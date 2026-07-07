export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server.js');
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Boot Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Boot Error",
      message: err.message,
      stack: err.stack,
      code: err.code
    });
  }
}
