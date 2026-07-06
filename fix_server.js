import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("import { eq } from 'drizzle-orm';")) {
  code = code.replace("import dotenv", "import { eq } from 'drizzle-orm';\nimport dotenv");
}

if (!code.includes("const aiUsageLimits = new Map();")) {
  code = code.replace("const ai = new GoogleGenAI", "const aiUsageLimits = new Map();\nconst ai = new GoogleGenAI");
}

const chatLogic = `
      const { message, history, user } = req.body;
      
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
      
      const systemInstruction = \`
        You are the AI Assistant for the Crimson Cup Bd ERP system. 
        You help branch managers and HR analyze employee attendance, roster duties, and inventory for our branches.
        You have access to real-time database tools. ALWAYS use your tools to fetch the actual data when answering user queries about employees, inventory, attendance, or rosters.
        Be concise, professional, and helpful. You are talking to \${user ? user.name : 'a user'} (\${user ? user.role : 'Unknown role'}).
      \`;`;

code = code.replace(/const { message, history } = req\.body;[\s\S]*?Be concise, professional, and helpful\\.\n      `;/m, chatLogic);

const toolsLogic = `
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
           }
        } catch(e: any) {
`;

code = code.replace(/try {\s*if \(call.name === 'get_inventory'\) {[\s\S]*?} else if \(call.name === 'get_roster'\) {[\s\S]*?}\s*} catch\(e: any\) {/m, toolsLogic);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
