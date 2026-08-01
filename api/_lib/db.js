import { createClient } from '@supabase/supabase-js';

let supabase = null;

export function getDb() {
  if (!supabase) {
    const rawUrl = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rawUrl || !key) {
      throw new Error(`Missing Database Environment Variables on Vercel: SUPABASE_URL (${rawUrl ? 'set' : 'MISSING'}) or SUPABASE_SERVICE_ROLE_KEY (${key ? 'set' : 'MISSING'}). Please add them in Vercel Settings > Environment Variables for Production and click Redeploy.`);
    }
    const url = rawUrl.trim().replace(/\/rest\/v\d+.*$/i, '').replace(/\/$/, '');
    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return supabase;
}

export function getPublicClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!rawUrl || !key) {
    throw new Error(`Missing Database Environment Variables on Vercel: SUPABASE_URL (${rawUrl ? 'set' : 'MISSING'}) or SUPABASE_ANON_KEY (${key ? 'set' : 'MISSING'}). Please add them in Vercel Settings > Environment Variables for Production and click Redeploy.`);
  }
  const url = rawUrl.trim().replace(/\/rest\/v\d+.*$/i, '').replace(/\/$/, '');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
