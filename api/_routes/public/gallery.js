import { getDb } from '../../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery, paginate } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { album_id, wing, year, event_id } = query;
  const { page, limit, offset } = paginate(query);

  let dbQuery = db.from('gallery').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  
  if (wing) dbQuery = dbQuery.eq('wing', wing);
  if (year) dbQuery = dbQuery.eq('year', year);
  if (event_id) dbQuery = dbQuery.eq('event_id', event_id);

  const { data, error: err, count } = await dbQuery;
  if (err) return error(res, err.message, 500);
  return success(res, data || []);
}
