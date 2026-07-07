import { users } from '../src/db/schema.js';

export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    schemaExists: !!users,
    vercel: process.env.VERCEL, 
    nodeEnv: process.env.NODE_ENV
  });
}
