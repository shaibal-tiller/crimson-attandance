const fs = require('fs');

const branches = [
  { id: 'b1', name: 'Banani 11', location: 'Banani, Dhaka' },
  { id: 'b2', name: 'Gulshan 2', location: 'Gulshan, Dhaka' }
];

const users = [];
const roster = [];
const inventory = [];
const attendance = [];

// Inventory items per branch
const inventoryItems = [
  { category: 'Coffee', name: 'Espresso Beans', quantity: 15, unit: 'kg', threshold: 10, status: 'In Stock' },
  { category: 'Coffee', name: 'Colombian Roast', quantity: 4, unit: 'kg', threshold: 5, status: 'Low Stock' },
  { category: 'Bakery', name: 'Croissant Dough', quantity: 50, unit: 'pcs', threshold: 100, status: 'Low Stock' },
  { category: 'Bakery', name: 'Blueberry Muffin', quantity: 120, unit: 'pcs', threshold: 30, status: 'In Stock' },
  { category: 'Supplies', name: 'Paper Cups (M)', quantity: 500, unit: 'pcs', threshold: 1000, status: 'Low Stock' }
];

branches.forEach((b, bIdx) => {
  inventoryItems.forEach((item, iIdx) => {
    inventory.push({
      id: `inv_${b.id}_${iIdx}`,
      branchId: b.id,
      ...item
    });
  });

  // Create 10 users per branch
  for (let i = 0; i < 10; i++) {
    const role = i === 0 ? 'Manager' : i === 1 ? 'Supervisor' : 'Employee';
    const userId = `u_${b.id}_${i}`;
    users.push({
      id: userId,
      name: `${role} ${b.id.toUpperCase()} ${i}`,
      role: role,
      branchId: b.id,
      branchName: b.name
    });

    // Dummy attendance
    attendance.push({
      id: `att_${userId}`,
      userId: userId,
      branchId: b.id,
      date: new Date().toISOString().split('T')[0],
      checkIn: '08:00 AM',
      checkOut: '05:00 PM',
      status: 'Present',
      type: 'App'
    });

    // Dummy roster
    roster.push({
      id: `ros_${userId}`,
      date: new Date().toISOString().split('T')[0],
      shift: i % 2 === 0 ? 'Morning' : 'Evening',
      employeeId: userId,
      branchId: b.id,
      employeeName: `${role} ${b.id.toUpperCase()} ${i}`
    });
  }
});

// Admin
users.push({
  id: 'admin_1',
  name: 'Admin User',
  role: 'Admin',
  branchId: 'all',
  branchName: 'HQ'
});

const blueprint = {
  collections: [
    { name: 'users', documents: users },
    { name: 'branches', documents: branches },
    { name: 'inventory', documents: inventory },
    { name: 'attendance', documents: attendance },
    { name: 'roster', documents: roster }
  ]
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(blueprint, null, 2));
console.log('Blueprint generated');
