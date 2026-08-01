import { getDb } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../../_lib/response.js';
import { validateRequired } from '../../_lib/validate.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();
  
  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { limit, offset } = paginate(query);
    const { data, count, error: err } = await db.from('alumni').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (err) return error(res, err.message, 500);
    return success(res, { data, count, limit, offset });
  } else if (req.method === 'POST') {
    const body = await parseBody(req);
    if (validateRequired(body, ['name']).length > 0) return error(res, 'Missing required fields', 400);
    const { data, error: err } = await db.from('alumni').insert(body).select().single();
    if (err) return error(res, err.message, 500);
    return success(res, data, 201);
  } else if (req.method === 'PUT') {
    const body = await parseBody(req);
    const { id, ...updates } = body;
    if (!id) return error(res, 'Missing id', 400);
    const { data, error: err } = await db.from('alumni').update(updates).eq('id', id).select().single();
    if (err) return error(res, err.message, 500);
    return success(res, data);
  } else if (req.method === 'DELETE') {
    const query = parseQuery(req);
    const { id } = query;
    if (!id) return error(res, 'Missing id', 400);
    const { error: err } = await db.from('alumni').delete().eq('id', id);
    if (err) return error(res, err.message, 500);
    return success(res, { deleted: true });
  } else {
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  }
}
