import { GoogleGenAI } from '@google/genai';

export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    aiExists: !!GoogleGenAI,
    vercel: process.env.VERCEL, 
    nodeEnv: process.env.NODE_ENV
  });
}
