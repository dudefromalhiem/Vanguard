import { getDb } from '../../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery, paginate } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { mentorship } = query;
  const { page, limit, offset } = paginate(query);

  let dbQuery = db.from('alumni').select('*', { count: 'exact' }).order('graduation_year', { ascending: false }).range(offset, offset + limit - 1);

  if (mentorship === 'true') dbQuery = dbQuery.eq('mentorship_available', true);

  const { data, error: err, count } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, { data, pagination: { total: count, page, limit } });
}
