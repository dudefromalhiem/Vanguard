import { getDb } from '../../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery, paginate } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { category, q, slug } = query;
  const { page, limit, offset } = paginate(query);

  if (slug) {
    const { data, error: err } = await db.from('news').select('*').eq('slug', slug).eq('is_published', true).single();
    if (err) return error(res, 'News not found', 404);
    return success(res, data);
  }

  let dbQuery = db.from('news').select('*', { count: 'exact' }).eq('is_published', true).order('published_at', { ascending: false }).range(offset, offset + limit - 1);

  if (category) dbQuery = dbQuery.eq('category', category);
  if (q) dbQuery = dbQuery.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

  const { data, error: err, count } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, { data, pagination: { total: count, page, limit } });
}
