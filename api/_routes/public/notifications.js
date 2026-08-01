import { getDb } from '../../_lib/db.js';
import { success, error, methodNotAllowed } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();

  const { data, error: err } = await db.from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (err) return error(res, err.message, 500);
  
  return success(res, data);
}
