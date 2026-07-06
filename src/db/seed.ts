import { db } from './index.js';
import { users, branches, inventory, attendance, roster, payroll, leaveRequests, inventoryLogs, overtime } from './schema.js';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
dotenv.config();

const branchData = [
  { id: 'all', name: 'HQ', location: 'HQ, Dhaka' },
  { id: 'b1', name: 'Banani 11', location: 'Banani, Dhaka' },
  { id: 'b2', name: 'Dhanmondi', location: 'Dhanmondi 27, Dhaka' },
  { id: 'b3', name: 'Bashundhara', location: 'Bashundhara R/A, Dhaka' },
  { id: 'b4', name: 'Uttara', location: 'Sector 11, Uttara, Dhaka' },
  { id: 'b5', name: 'Mirpur', location: 'Mirpur 2, Dhaka' },
  { id: 'b6', name: 'Gulshan 1', location: 'Gulshan 1, Dhaka' },
  { id: 'b7', name: 'Khilgaon', location: 'Khilgaon, Dhaka' },
  { id: 'b8', name: 'Baily Road', location: 'Baily Road, Dhaka' }
];

const inventoryItems = [
  { category: 'Coffee', name: 'Espresso Beans', quantity: 45, unit: 'kg', threshold: 10, status: 'In Stock' },
  { category: 'Coffee', name: 'Colombian Roast', quantity: 4, unit: 'kg', threshold: 15, status: 'Low Stock' },
  { category: 'Coffee', name: 'Decaf Beans', quantity: 20, unit: 'kg', threshold: 5, status: 'In Stock' },
  { category: 'Syrups', name: 'Vanilla Syrup', quantity: 12, unit: 'bottles', threshold: 5, status: 'In Stock' },
  { category: 'Syrups', name: 'Caramel Syrup', quantity: 3, unit: 'bottles', threshold: 5, status: 'Low Stock' },
  { category: 'Syrups', name: 'Hazelnut Syrup', quantity: 8, unit: 'bottles', threshold: 5, status: 'In Stock' },
  { category: 'Bakery', name: 'Croissant Dough', quantity: 50, unit: 'pcs', threshold: 100, status: 'Low Stock' },
  { category: 'Bakery', name: 'Blueberry Muffin', quantity: 120, unit: 'pcs', threshold: 30, status: 'In Stock' },
  { category: 'Bakery', name: 'Chocolate Chip Cookie', quantity: 80, unit: 'pcs', threshold: 40, status: 'In Stock' },
  { category: 'Supplies', name: 'Paper Cups (S)', quantity: 1500, unit: 'pcs', threshold: 1000, status: 'In Stock' },
  { category: 'Supplies', name: 'Paper Cups (M)', quantity: 500, unit: 'pcs', threshold: 1000, status: 'Low Stock' },
  { category: 'Supplies', name: 'Paper Cups (L)', quantity: 1200, unit: 'pcs', threshold: 1000, status: 'In Stock' },
  { category: 'Supplies', name: 'Lids (Universal)', quantity: 3500, unit: 'pcs', threshold: 1500, status: 'In Stock' },
  { category: 'Supplies', name: 'Stirrers', quantity: 5000, unit: 'pcs', threshold: 2000, status: 'In Stock' },
  { category: 'Dairy', name: 'Whole Milk', quantity: 40, unit: 'liters', threshold: 20, status: 'In Stock' },
  { category: 'Dairy', name: 'Oat Milk', quantity: 8, unit: 'liters', threshold: 10, status: 'Low Stock' }
];

const bdNames = ["Aarav Hossain", "Tahmid Rahman", "Nabila Islam", "Samir Khan", "Raisa Ahmed", "Anika Tabassum", "Kazi Mehedi", "Mehedi Hasan", "Fahim Ahmed", "Nusrat Jahan", "Imran Mahmud", "Tariqul Islam", "Sadia Akter", "Zarif Karim", "Tasnim Fariha", "Sakib Al Hasan", "Rubel Hossain", "Ayesha Siddiqa", "Mominul Haque", "Habib Wahid", "Nayeem Islam", "Farhana Amin", "Sajid Alam", "Rifat Hossen", "Shahriar Nafis", "Maliha Tasnim", "Iqbal Hossain", "Ashiqur Rahman", "Sabrina Zaman", "Mahmudullah", "Sadiya Afrin", "Rashed Khan", "Shuvo Chowdhury", "Fariha Sultana", "Jubayer Ahmed", "Tanvir Ahmed", "Sumaiya Akter", "Hasan Mahmud", "Ariful Islam", "Jamil Ahmed", "Kamrul Islam", "Nadim Chowdhury", "Parvez Hossain", "Sohail Tanvir", "Rina Akter", "Shahin Alam", "Sonia Rahman", "Sumon Ali", "Tania Akter"];

const mockUsers = [
  { uid: 'u_admin_1', email: 'admin@crimsoncup.com', name: 'Rehan Admin', role: 'Admin', branchId: 'all', branchName: 'HQ' },
  { uid: 'u_manager_1', email: 'manager_banani@crimsoncup.com', name: 'Shafayat Manager', role: 'Manager', branchId: 'b1', branchName: 'Banani 11' },
  { uid: 'u_manager_2', email: 'manager_dhanmondi@crimsoncup.com', name: 'Raju Manager', role: 'Manager', branchId: 'b2', branchName: 'Dhanmondi' },
  { uid: 'u_manager_3', email: 'manager_bmd@crimsoncup.com', name: 'Kaiser Manager', role: 'Manager', branchId: 'b3', branchName: 'Bashundhara' },
  { uid: 'u_super_1', email: 'super_banani@crimsoncup.com', name: 'Rafiq Supervisor', role: 'Supervisor', branchId: 'b1', branchName: 'Banani 11' },
  { uid: 'u_super_2', email: 'super_dhanmondi@crimsoncup.com', name: 'Hasan Supervisor', role: 'Supervisor', branchId: 'b2', branchName: 'Dhanmondi' },
  { uid: 'u_super_3', email: 'super_uttara@crimsoncup.com', name: 'Jamal Supervisor', role: 'Supervisor', branchId: 'b4', branchName: 'Uttara' },
  ...Array.from({ length: 42 }).map((_, i) => {
    const branchesKeys = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
    const branchId = branchesKeys[i % branchesKeys.length];
    const branchName = branchData.find(b => b.id === branchId)?.name || 'Unknown';
    const name = bdNames[i % bdNames.length];
    return {
      uid: `u_emp_${i + 1}`,
      email: `emp${i + 1}@crimsoncup.com`,
      name: name,
      role: 'Employee',
      branchId,
      branchName
    };
  })
].map(u => ({
  ...u,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&size=150`
}));

async function seed() {
  console.log('Clearing old data...');
  await db.execute(sql`DELETE FROM overtime`);
  await db.execute(sql`DELETE FROM inventory_logs`);
  await db.execute(sql`DELETE FROM leave_requests`);
  await db.execute(sql`DELETE FROM payroll`);
  await db.execute(sql`DELETE FROM roster`);
  await db.execute(sql`DELETE FROM attendance`);
  await db.execute(sql`DELETE FROM inventory`);
  await db.execute(sql`DELETE FROM users`);
  await db.execute(sql`DELETE FROM branches`);

  console.log('Seeding branches...');
  for (const b of branchData) {
    await db.insert(branches).values(b).onConflictDoNothing();
  }

  console.log(`Seeding ${mockUsers.length} users...`);
  for (const u of mockUsers) {
    await db.insert(users).values(u).onConflictDoNothing();
  }

  console.log('Seeding inventory, attendance and roster...');
  for (const b of branchData) {
    if (b.id === 'all') continue;
    
    // Vary inventory per branch
    for (let idx = 0; idx < inventoryItems.length; idx++) {
      const item = { ...inventoryItems[idx] };
      const qtyVariation = Math.floor(Math.random() * 20) - 10;
      item.quantity = Math.max(0, item.quantity + qtyVariation);
      item.status = item.quantity <= item.threshold ? 'Low Stock' : 'In Stock';

      await db.insert(inventory).values({
        id: `inv_${b.id}_${idx}`,
        branchId: b.id,
        ...item
      }).onConflictDoNothing();
    }
  }

  const today = new Date();
  for (const u of mockUsers) {
    if (u.role === 'Admin') continue;
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      if (Math.random() > 0.1 || i === 0) {
        await db.insert(attendance).values({
          id: `att_${u.uid}_${dateStr}`,
          userId: u.uid,
          branchId: u.branchId,
          date: dateStr,
          checkIn: '09:00 AM',
          checkOut: i === 0 ? null : (Math.random() > 0.5 ? '04:30 PM' : '12:00 AM'),
          status: 'Present',
          type: Math.random() > 0.5 ? 'App' : 'Fingerprint'
        }).onConflictDoNothing();
      }

      await db.insert(roster).values({
        id: `ros_${u.uid}_${dateStr}`,
        date: dateStr,
        shift: Math.random() > 0.5 ? 'Morning (9:00 AM - 4:30 PM)' : 'Evening (4:30 PM - 12:00 AM)',
        employeeId: u.uid,
        branchId: u.branchId,
        employeeName: u.name
      }).onConflictDoNothing();
      
      // Some dummy leave requests
      if (i === 3 && Math.random() > 0.8) {
        await db.insert(leaveRequests).values({
          id: `lr_${u.uid}_${dateStr}`,
          userId: u.uid,
          branchId: u.branchId,
          type: 'Sick',
          startDate: dateStr,
          endDate: dateStr,
          reason: 'Feeling unwell',
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
      }
      
      // Some dummy overtime
      if (i === 2 && Math.random() > 0.7) {
        await db.insert(overtime).values({
          id: `ot_${u.uid}_${dateStr}`,
          userId: u.uid,
          branchId: u.branchId,
          date: dateStr,
          hours: Math.floor(Math.random() * 4) + 1,
          reason: 'Late night closing prep',
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  console.log('Seeding payroll...');
  await seedPayroll();

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function seedPayroll() {
  const allUsers = await db.select().from(users);
  const months = [
    { month: 'September 2023', date: 'Oct 01, 2023' },
    { month: 'August 2023', date: 'Sep 01, 2023' },
    { month: 'July 2023', date: 'Aug 01, 2023' },
  ];

  for (const u of allUsers) {
    if (u.role === 'Admin') continue;
    
    const amount = u.role === 'Manager' ? '৳ 45,000' : (u.role === 'Supervisor' ? '৳ 35,000' : '৳ 20,000');
    
    for (let i = 0; i < months.length; i++) {
      await db.insert(payroll).values({
        id: `p${i}_${u.uid}`,
        userId: u.uid,
        month: months[i].month,
        amount: amount,
        status: 'Paid',
        date: months[i].date
      }).onConflictDoNothing();
    }
  }
}
