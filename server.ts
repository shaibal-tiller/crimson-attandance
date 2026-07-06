import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { db } from './src/db/index.js';
import { users, branches, inventory, attendance, roster, payroll, leaveRequests, inventoryLogs, overtime, chatSessions, chatMessages, aiUsageLogs } from './src/db/schema.js';
import { requireAuth } from './src/middleware/auth.js';

dotenv.config();

const aiUsageLimits = new Map();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

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
             if (!user || user.role === 'Admin') toolResult = await db.select().from(inventory);
             else toolResult = await db.select().from(inventory).where(eq(inventory.branchId, user.branchId));
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
  
  app.get('/api/users', async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
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

  app.get('/api/inventory', async (req, res) => {
    try {
      const items = await db.select().from(inventory);
      res.json(items);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
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
    const { userId, month, amount, date, status } = req.body;
    try {
      const id = `p_${Date.now()}_${userId}`;
      await db.insert(payroll).values({
        id, userId, month, amount, date, status
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


  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
