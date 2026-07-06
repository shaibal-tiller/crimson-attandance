import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      const { message, history } = req.body;
      
      const systemInstruction = \`
        You are the AI Assistant for the Crimson Cup Bd ERP system. 
        You help branch managers and HR analyze employee attendance, roster duties, and inventory for our branches.
        You have access to real-time database tools. ALWAYS use your tools to fetch the actual data when answering user queries about employees, inventory, attendance, or rosters.
        Be concise, professional, and helpful.
      \`;`;

const newStr = `      const { message, history, user } = req.body;

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

code = code.replace(targetStr, newStr);

fs.writeFileSync('server.ts', code);
