import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { category } = query;

  let dbQuery = db.from('faqs').select('*').order('sort_order', { ascending: true });
  if (category) dbQuery = dbQuery.eq('category', category);

  const { data, error: err } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, data);
}
