export default async function handler(req: any, res: any) {
  try {
    const moduleName = 'drizzle-orm/node-postgres';
    const { drizzle } = await import(moduleName);
    res.status(200).json({ 
      status: 'ok', 
      drizzleExists: !!drizzle,
      vercel: process.env.VERCEL, 
      nodeEnv: process.env.NODE_ENV
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Import Error",
      message: err.message,
      stack: err.stack,
      code: err.code
    });
  }
}
