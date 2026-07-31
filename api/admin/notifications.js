import { getDb } from '../_lib/db.js';
import { requireAdmin } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../_lib/response.js';
import { validateRequired } from '../_lib/validate.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();
  
  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { limit, offset } = paginate(query);
    const { data, count, error: err } = await db.from('notifications').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (err) return error(res, err.message, 500);
    return success(res, { data, count, limit, offset });
  } else if (req.method === 'POST') {
    const body = await parseBody(req);
    if (!validateRequired(body, ['type', 'title'])) return error(res, 'Missing required fields', 400);
    const { data, error: err } = await db.from('notifications').insert(body).select().single();
    if (err) return error(res, err.message, 500);
    return success(res, data, 201);
  } else {
    return methodNotAllowed(res, ['GET', 'POST']);
  }
}
