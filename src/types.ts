export type Role = 'Admin' | 'Manager' | 'Supervisor' | 'Employee';

export interface User {
  id: string;
  name: string;
  role: Role;
  branchId: string;
  branchName: string;
}

export interface AttendanceLog {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  type: 'Fingerprint' | 'Face' | 'App';
}

export interface RosterSlot {
  id: string;
  date: string; // YYYY-MM-DD
  shift: 'Morning' | 'Evening' | 'Night';
  employeeId: string;
  employeeName: string;
}

export interface InventoryItem {
  id: string;
  category: 'Coffee' | 'Bakery' | 'Supplies';
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
