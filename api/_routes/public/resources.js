import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery, paginate } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { category, wing, q } = query;
  const { page, limit, offset } = paginate(query);

  let dbQuery = db.from('resources').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  if (category) dbQuery = dbQuery.eq('category', category);
  if (wing) dbQuery = dbQuery.eq('wing', wing);
  if (q) dbQuery = dbQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error: err, count } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, { data, pagination: { total: count, page, limit } });
}
