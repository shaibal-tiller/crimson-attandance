import express from 'express';
import path from 'path';

import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { db } from './src/db/index.js';
import { users, branches, attendance, roster, payroll, leaveRequests, overtime, chatSessions, chatMessages, aiUsageLogs, warehouseItems, branchInventory, stockRequests, stockRequestItems } from './src/db/schema.js';

let app: any = express();
let aiUsageLimits: any = new Map();
let ai: any = null;

try {
  dotenv.config();
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  app.use(express.json());

  // AI Chat Endpoint with Database Tools
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, user, sessionId } = req.body;

      if (sessionId) {
        await db.insert(chatMessages).values({
          id: `cm_${Date.now()}_u`,
          sessionId,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString()
        });
      }

      if (user && user.role === 'Employee') {
        const today = new Date().toISOString().split('T')[0];
        const usage = aiUsageLimits.get(user.uid) || { count: 0, date: today };
        if (usage.date !== today) {
          usage.count = 0;
          usage.date = today;
        }
        if (usage.count >= 5) {
          return res.json({ reply: "You have reached your daily limit of 5 AI queries. Please contact a manager if you need further assistance." });
        }
        usage.count += 1;
        aiUsageLimits.set(user.uid, usage);
      }
      
      const systemInstruction = `
        You are the AI Assistant for the Crimson Cup Bd ERP system. 
        You help branch managers and HR analyze employee attendance, roster duties, and inventory for our branches.
        You have access to real-time database tools. ALWAYS use your tools to fetch the actual data when answering user queries about employees, inventory, attendance, or rosters.
        If the user asks for a chart, you MUST output a JSON code block with the language set to 'chart' (e.g. \`\`\`chart\\n[{"name": "X", "value": 10}]\\n\`\`\`). The JSON should be an array of objects with 'name' and 'value' keys.
        Be concise, professional, and helpful. You are talking to ${user ? user.name : 'a user'} (${user ? user.role : 'Unknown role'}).
      `;

      const getInventoryTool: FunctionDeclaration = {
        name: 'get_inventory',
        description: 'Get the current inventory for all branches.',
      };

      const getEmployeesTool: FunctionDeclaration = {
        name: 'get_employees',
        description: 'Get the list of all employees and their branches.',
      };

      const getAttendanceTool: FunctionDeclaration = {
        name: 'get_attendance',
        description: 'Get the attendance logs for employees.',
      };

      const getRosterTool: FunctionDeclaration = {
        name: 'get_roster',
        description: 'Get the roster schedules for employees.',
      };

      const getLeaveTool: FunctionDeclaration = {
        name: 'get_leave_requests',
        description: 'Get all leave requests for employees.',
      };

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
          temperature: 0,
          tools: [{ functionDeclarations: [getInventoryTool, getEmployeesTool, getAttendanceTool, getRosterTool, getLeaveTool] }],
        }
      });

      // Restore history manually if needed, or just send the current message + history as parts.
      // Since it's a new chat instance, we'll just send the full history as a single message string for simplicity.
      const conversationContext = history.map((h: any) => `${h.role}: ${h.content}`).join('\n');
      
      const fullMessage = conversationContext.length > 0 
        ? `Previous conversation:\n${conversationContext}\n\nUser's new message: ${message}` 
        : message;

      let response = await chat.sendMessage({ message: fullMessage });
      
      // Handle tool calls
      while (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        let toolResult = {};
        
        
        try {
          if (call.name === 'get_inventory') {
            toolResult = await db.select().from(warehouseItems);
          } else if (call.name === 'get_employees') {
             if (!user || user.role === 'Admin') toolResult = await db.select().from(users);
             else toolResult = await db.select().from(users).where(eq(users.branchId, user.branchId));
           } else if (call.name === 'get_attendance') {
             if (!user || user.role === 'Admin') toolResult = await db.select().from(attendance);
             else if (user.role === 'Employee') toolResult = await db.select().from(attendance).where(eq(attendance.userId, user.uid));
             else toolResult = await db.select().from(attendance).where(eq(attendance.branchId, user.branchId));
           } else if (call.name === 'get_roster') {
             if (!user || user.role === 'Admin') toolResult = await db.select().from(roster);
             else toolResult = await db.select().from(roster).where(eq(roster.branchId, user.branchId));
           } else if (call.name === 'get_leave_requests') {
             if (!user || user.role === 'Admin') toolResult = await db.select().from(leaveRequests);
             else if (user.role === 'Employee') toolResult = await db.select().from(leaveRequests).where(eq(leaveRequests.userId, user.uid));
             else toolResult = await db.select().from(leaveRequests).where(eq(leaveRequests.branchId, user.branchId));
           }
        } catch(e: any) {

           toolResult = { error: e.message };
        }

        response = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          }]
        });
      }

      if (sessionId) {
        await db.insert(chatMessages).values({
          id: `cm_${Date.now()}_m`,
          sessionId,
          role: 'model',
          content: response.text,
          createdAt: new Date().toISOString()
        });
        await db.insert(aiUsageLogs).values({
          id: `ul_${Date.now()}`,
          userId: user.uid,
          action: 'chat_query',
          createdAt: new Date().toISOString()
        });
        await db.execute(`UPDATE chat_sessions SET updated_at = '${new Date().toISOString()}' WHERE id = '${sessionId}'`);
      }

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: 'Failed to communicate with AI', details: error.message, stack: error.stack });
    }
  });

  // Chat Sessions & Usage Endpoints
  app.get('/api/chat/sessions', async (req, res) => {
    try {
      const { userId } = req.query;
      const sessions = await db.select().from(chatSessions).where(eq(chatSessions.userId, String(userId)));
      res.json(sessions);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/chat/sessions', async (req, res) => {
    try {
      const { userId, title } = req.body;
      const id = `cs_${Date.now()}_${userId}`;
      const now = new Date().toISOString();
      await db.insert(chatSessions).values({ id, userId, title, createdAt: now, updatedAt: now });
      res.json({ id, title, createdAt: now, updatedAt: now });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/chat/sessions/:id', async (req, res) => {
    try {
      const { title } = req.body;
      await db.execute(`UPDATE chat_sessions SET title = '${title}', updated_at = '${new Date().toISOString()}' WHERE id = '${req.params.id}'`);
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/chat/sessions/:id', async (req, res) => {
    try {
      await db.execute(`DELETE FROM chat_messages WHERE session_id = '${req.params.id}'`);
      await db.execute(`DELETE FROM chat_sessions WHERE id = '${req.params.id}'`);
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/chat/sessions/:id/messages', async (req, res) => {
    try {
      const messages = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, req.params.id));
      res.json(messages);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/chat/usage', async (req, res) => {
    try {
      const { userId } = req.query;
      const usage = await db.select().from(aiUsageLogs).where(eq(aiUsageLogs.userId, String(userId)));
      res.json(usage);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Real Database Endpoints
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', vercel: process.env.VERCEL, nodeEnv: process.env.NODE_ENV });
  });

  app.get('/api/debug', async (req, res) => {
    try {
      const allUsers = await db.select().from(users).limit(1);
      res.json({ status: 'success', database: 'connected', sampleUser: allUsers[0] || null });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message, stack: e.stack });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { name, email, role, branchId, branchName } = req.body;
      if (!name || !email || !role || !branchId || !branchName) {
        return res.status(400).json({ error: 'Missing required fields: name, email, role, branchId, branchName' });
      }
      const uid = `u_${role.toLowerCase().slice(0, 3)}_${Date.now()}`;
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=150`;
      await db.insert(users).values({ uid, name, email, role, branchId, branchName, avatar });
      res.json({ success: true, uid, name, role, branchId, branchName });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/branches', async (req, res) => {
    try {
      const allBranches = await db.select().from(branches);
      res.json(allBranches);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  app.get('/api/inventory_logs', async (req, res) => {
    try {
      const logs = await db.select().from(inventoryLogs);
      res.json(logs);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/inventory/restock', async (req, res) => {
    const { id, branchId, userId, amount } = req.body;
    try {
      await db.execute(`UPDATE inventory SET quantity = quantity + ${amount} WHERE id = '${id}'`);
      await db.execute(`UPDATE inventory SET status = CASE WHEN quantity <= threshold THEN 'Low Stock' ELSE 'In Stock' END WHERE id = '${id}'`);
      
      const logId = `il_${Date.now()}_${userId}`;
      await db.insert(inventoryLogs).values({
        id: logId, inventoryId: id, branchId, userId, action: 'Restock',
        quantityChange: amount, timestamp: new Date().toISOString()
      });
      res.json({ success: true, message: 'Restocked' });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- NEW INVENTORY APIs ---

  // Get master warehouse items
  app.get('/api/inventory/warehouse', async (req, res) => {
    try {
      const items = await db.select().from(warehouseItems);
      res.json(items);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Create or update warehouse item
  app.post('/api/inventory/warehouse/items', async (req, res) => {
    try {
      const { id, name, category, unit, imageUrl, quantity, threshold } = req.body;
      const itemId = id || `wi_${Date.now()}`;
      await db.insert(warehouseItems).values({
        id: itemId, name, category, unit, imageUrl, quantity, threshold
      }).onConflictDoUpdate({
        target: warehouseItems.id,
        set: { name, category, unit, imageUrl, quantity, threshold }
      });
      res.json({ success: true, id: itemId });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Get branch inventory
  app.get('/api/inventory/branch/:branchId', async (req, res) => {
    try {
      const { branchId } = req.params;
      const result = await db.select({
        id: branchInventory.id,
        branchId: branchInventory.branchId,
        itemId: branchInventory.itemId,
        quantity: branchInventory.quantity,
        threshold: branchInventory.threshold,
        item: warehouseItems
      })
      .from(branchInventory)
      .leftJoin(warehouseItems, eq(branchInventory.itemId, warehouseItems.id))
      .where(eq(branchInventory.branchId, branchId));
      res.json(result);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Get stock requests
  app.get('/api/inventory/requests', async (req, res) => {
    try {
      const { branchId } = req.query;
      let query = db.select().from(stockRequests);
      if (branchId) {
        query = query.where(eq(stockRequests.branchId, String(branchId)));
      }
      const requests = await query;
      
      const reqIds = requests.map(r => r.id);
      let items = [];
      if (reqIds.length > 0) {
        items = await db.select({
          id: stockRequestItems.id,
          requestId: stockRequestItems.requestId,
          itemId: stockRequestItems.itemId,
          quantity: stockRequestItems.quantity,
          item: warehouseItems
        })
        .from(stockRequestItems)
        .leftJoin(warehouseItems, eq(stockRequestItems.itemId, warehouseItems.id));
      }
      
      // group items by requestId
      const result = requests.map(r => ({
        ...r,
        items: items.filter(i => i.requestId === r.id)
      })).reverse();
      
      res.json(result);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Create a new stock request
  app.post('/api/inventory/requests', async (req, res) => {
    try {
      const { branchId, items } = req.body; // items: { itemId: string, quantity: number }[]
      const requestId = `req_${Date.now()}`;
      await db.insert(stockRequests).values({
        id: requestId,
        branchId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      for (const item of items) {
        await db.insert(stockRequestItems).values({
          id: `reqi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          requestId,
          itemId: item.itemId,
          quantity: item.quantity
        });
      }
      res.json({ success: true, requestId });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Update stock request status
  app.put('/api/inventory/requests/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await db.update(stockRequests).set({ status, updatedAt: new Date().toISOString() }).where(eq(stockRequests.id, id));
      
      // If status is received, we must restock the branch inventory and deduct warehouse stock
      if (status === 'received') {
        const reqDb = await db.select().from(stockRequests).where(eq(stockRequests.id, id));
        if (reqDb.length === 0) return res.status(404).json({error: 'not found'});
        const branchId = reqDb[0].branchId;
        
        const reqItems = await db.select().from(stockRequestItems).where(eq(stockRequestItems.requestId, id));
        
        for (const item of reqItems) {
          // Add to branch
          const existing = await db.select().from(branchInventory)
            .where(eq(branchInventory.branchId, branchId))
            .where(eq(branchInventory.itemId, item.itemId));
            
          if (existing.length > 0) {
            await db.execute(`UPDATE branch_inventory SET quantity = quantity + ${item.quantity} WHERE id = '${existing[0].id}'`);
          } else {
            await db.insert(branchInventory).values({
              id: `bi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              branchId,
              itemId: item.itemId,
              quantity: item.quantity,
              threshold: 5
            });
          }
          
          // Deduct from warehouse
          await db.execute(`UPDATE warehouse_items SET quantity = quantity - ${item.quantity} WHERE id = '${item.itemId}'`);
        }
      }
      
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });


  app.get('/api/attendance', async (req, res) => {
    try {
      const logs = await db.select().from(attendance);
      res.json(logs);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.post('/api/payroll/generate', async (req, res) => {
    const { userId, month, amount, basic, medical, tada, houseAllowance, overtimeAmount, date, status } = req.body;
    try {
      const id = `p_${Date.now()}_${userId}`;
      await db.insert(payroll).values({
        id, userId, month, amount, basic: basic || 0, medical: medical || 0, tada: tada || 0, houseAllowance: houseAllowance || 0, overtimeAmount: overtimeAmount || 0, date, status
      });
      res.json({ success: true, message: "Payslip generated" });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  
  app.get('/api/overtime', async (req, res) => {
    try {
      const o = await db.select().from(overtime);
      res.json(o);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/overtime', async (req, res) => {
    const { userId, branchId, date, hours, reason } = req.body;
    try {
      const id = `ot_${Date.now()}_${userId}`;
      await db.insert(overtime).values({
        id, userId, branchId, date, hours, reason,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, message: 'Overtime requested' });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/overtime/:id', async (req, res) => {
    const { status } = req.body;
    try {
      await db.execute(`UPDATE overtime SET status = '${status}' WHERE id = '${req.params.id}'`);
      res.json({ success: true, message: 'Overtime updated' });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/leave', async (req, res) => {
    try {
      const l = await db.select().from(leaveRequests);
      res.json(l);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/leave', async (req, res) => {
    const { userId, branchId, type, startDate, endDate, reason } = req.body;
    try {
      const id = `lr_${Date.now()}_${userId}`;
      await db.insert(leaveRequests).values({
        id, userId, branchId, type, startDate, endDate, reason,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, message: 'Leave requested' });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/leave/:id', async (req, res) => {
    const { status } = req.body;
    try {
      await db.execute(`UPDATE leave_requests SET status = '${status}' WHERE id = '${req.params.id}'`);
      res.json({ success: true, message: 'Leave updated' });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/payroll', async (req, res) => {
    try {
      const p = await db.select().from(payroll);
      res.json(p);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/roster', async (req, res) => {
    try {
      const schedules = await db.select().from(roster);
      res.json(schedules);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/attendance/check-in', async (req, res) => {
    const { userId, branchId, type } = req.body;
    try {
      await db.insert(attendance).values({
        id: `att_${Date.now()}`,
        userId,
        branchId,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toLocaleTimeString(),
        status: 'Present',
        type
      });
      res.json({ success: true, message: `Checked in successfully at Branch ${branchId} via ${type}` });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/attendance/check-out', async (req, res) => {
    const { userId, branchId, type } = req.body;
    // In a real app we would update the existing record
    res.json({ success: true, message: `Checked out successfully at Branch ${branchId} via ${type}` });
  });


  async function setupFrontendServing(app: any) {
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (process.env.VERCEL !== '1') {
    setupFrontendServing(app).then(() => {
      const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    });
  }

} catch (e: any) {
  console.error("SERVER BOOT FAILURE:", e);
  app = express();
  app.use(express.json());
  app.all('*', (req: any, res: any) => {
    res.status(500).json({
      error: "Server Boot Failure",
      message: e.message,
      stack: e.stack
    });
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
