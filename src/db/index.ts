import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Function to create a new connection pool.
export const createPool = () => {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
