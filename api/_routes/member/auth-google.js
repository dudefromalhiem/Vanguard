export default async function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  
  if (!supabaseUrl) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'SUPABASE_URL environment variable is missing on Vercel. Please set it in Vercel project settings.' }));
  }

  const redirectUrl = `${supabaseUrl}/auth/v1/authorize?provider=google`;
  
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}
