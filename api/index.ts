import { Pool } from 'pg';

export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    poolExists: !!Pool,
    vercel: process.env.VERCEL, 
    nodeEnv: process.env.NODE_ENV,
    url: req.url
  });
}
