import { db } from '../src/db/index.js';

export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    dbExists: !!db,
    vercel: process.env.VERCEL, 
    nodeEnv: process.env.NODE_ENV,
    url: req.url
  });
}
