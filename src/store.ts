import { User, InventoryItem, AttendanceLog, RosterSlot } from './types';

export const DUMMY_USERS: User[] = [
  { id: 'u1', name: 'Zayed Khan', role: 'Admin', branchId: 'all', branchName: 'HQ' },
  { id: 'u2', name: 'Rahim Uddin', role: 'Manager', branchId: 'b1', branchName: 'Banani Branch' },
  { id: 'u3', name: 'Karim Ali', role: 'Supervisor', branchId: 'b1', branchName: 'Banani Branch' },
  { id: 'u4', name: 'Sara Rahman', role: 'Employee', branchId: 'b1', branchName: 'Banani Branch' },
];

export const DUMMY_INVENTORY: InventoryItem[] = [
  { id: 'i1', category: 'Coffee', name: 'Espresso Beans', quantity: 15, unit: 'kg', threshold: 10, status: 'In Stock' },
  { id: 'i2', category: 'Coffee', name: 'Colombian Roast', quantity: 4, unit: 'kg', threshold: 5, status: 'Low Stock' },
  { id: 'i3', category: 'Bakery', name: 'Croissant Dough', quantity: 50, unit: 'pcs', threshold: 100, status: 'Low Stock' },
  { id: 'i4', category: 'Bakery', name: 'Blueberry Muffin', quantity: 120, unit: 'pcs', threshold: 30, status: 'In Stock' },
  { id: 'i5', category: 'Supplies', name: 'Paper Cups (M)', quantity: 500, unit: 'pcs', threshold: 1000, status: 'Low Stock' },
];

export const DUMMY_ATTENDANCE: AttendanceLog[] = [
  { id: 'a1', date: new Date().toISOString().split('T')[0], checkIn: '08:00 AM', checkOut: null, status: 'Present', type: 'Fingerprint' },
  { id: 'a2', date: '2023-10-25', checkIn: '08:15 AM', checkOut: '05:00 PM', status: 'Late', type: 'App' },
  { id: 'a3', date: '2023-10-24', checkIn: '07:55 AM', checkOut: '04:30 PM', status: 'Present', type: 'Face' },
];

const getToday = () => new Date().toISOString().split('T')[0];

export const DUMMY_ROSTER: RosterSlot[] = [
  { id: 'r1', date: getToday(), shift: 'Morning', employeeId: 'u4', employeeName: 'Sara Rahman' },
  { id: 'r2', date: getToday(), shift: 'Evening', employeeId: 'u3', employeeName: 'Karim Ali' },
];
