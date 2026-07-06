import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  branchId: text('branch_id').notNull(),
  branchName: text('branch_name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
});

export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  category: text('category').notNull(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  unit: text('unit').notNull(),
  threshold: integer('threshold').notNull(),
  status: text('status').notNull(),
});

export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  branchId: text('branch_id').notNull(),
  date: text('date').notNull(),
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  status: text('status').notNull(),
  type: text('type').notNull(),
});

export const roster = pgTable('roster', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  shift: text('shift').notNull(),
  employeeId: text('employee_id').notNull(),
  branchId: text('branch_id').notNull(),
  employeeName: text('employee_name').notNull(),
});

export const payroll = pgTable('payroll', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  month: text('month').notNull(),
  amount: text('amount').notNull(),
  status: text('status').notNull(),
  date: text('date').notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  branchId: text('branch_id').notNull(),
  type: text('type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
});

export const inventoryLogs = pgTable('inventory_logs', {
  id: text('id').primaryKey(),
  inventoryId: text('inventory_id').notNull(),
  branchId: text('branch_id').notNull(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  quantityChange: integer('quantity_change').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const overtime = pgTable('overtime', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  branchId: text('branch_id').notNull(),
  date: text('date').notNull(),
  hours: integer('hours').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  createdAt: text('created_at').notNull(),
});

