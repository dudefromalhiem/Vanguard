export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  
  if (!supabaseUrl) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Supabase URL not configured in environment variables' }));
  }

  const redirectUrl = `${supabaseUrl}/auth/v1/authorize?provider=google`;
  
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}
