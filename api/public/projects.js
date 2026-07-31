import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery, paginate } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { wing, status, slug } = query;
  const { page, limit, offset } = paginate(query);

  if (slug) {
    const { data, error: err } = await db.from('projects').select('*').eq('slug', slug).neq('status', 'archived').single();
    if (err) return error(res, 'Project not found', 404);
    return success(res, data);
  }

  let dbQuery = db.from('projects').select('*', { count: 'exact' }).neq('status', 'archived').order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  if (wing) dbQuery = dbQuery.eq('wing', wing);
  if (status) dbQuery = dbQuery.eq('status', status);

  const { data, error: err, count } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, { data, pagination: { total: count, page, limit } });
}
