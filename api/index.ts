import { drizzle } from 'drizzle-orm/node-postgres';

export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    drizzleExists: !!drizzle,
    vercel: process.env.VERCEL, 
    nodeEnv: process.env.NODE_ENV,
    url: req.url
  });
}
