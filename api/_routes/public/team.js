import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { category, wing } = query;

  let dbQuery = db.from('team_members').select('*').eq('is_active', true).order('sort_order', { ascending: true });
  
  if (category) dbQuery = dbQuery.eq('category', category);
  if (wing) dbQuery = dbQuery.eq('wing', wing);

  const { data, error: err } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, data);
}
