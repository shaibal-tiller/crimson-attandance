import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        try {
           if (call.name === 'get_inventory') {
             toolResult = await db.select().from(inventory);
           } else if (call.name === 'get_employees') {
             toolResult = await db.select().from(users);
           } else if (call.name === 'get_attendance') {
             toolResult = await db.select().from(attendance);
           } else if (call.name === 'get_roster') {
             toolResult = await db.select().from(roster);
           }
        } catch(e: any) {`;

const newStr = `        try {
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
        } catch(e: any) {`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('server.ts', code);
