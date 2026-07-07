import express from 'express';

export default function handler(req: any, res: any) {
  const app = express();
  res.status(200).json({ 
    status: 'ok', 
    appExists: !!app,
    vercel: process.env.VERCEL, 
    nodeEnv: process.env.NODE_ENV
  });
}
