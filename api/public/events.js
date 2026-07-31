import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery, paginate } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const query = parseQuery(req);
  const { upcoming, past, wing, type, slug } = query;
  const { page, limit, offset } = paginate(query);
  const now = new Date().toISOString();

  if (slug) {
    const { data: event, error: err } = await db.from('events').select('*').eq('slug', slug).single();
    if (err) return error(res, 'Event not found', 404);
    
    const { count, error: countErr } = await db.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id);
    if (!countErr) event.registration_count = count;
    
    return success(res, event);
  }

  let dbQuery = db.from('events').select('*', { count: 'exact' }).order('event_date', { ascending: upcoming === 'true' }).range(offset, offset + limit - 1);

  if (upcoming === 'true') dbQuery = dbQuery.gte('event_date', now);
  if (past === 'true') dbQuery = dbQuery.lt('event_date', now);
  if (wing) dbQuery = dbQuery.eq('wing', wing);
  if (type) dbQuery = dbQuery.eq('type', type);

  const { data, error: err, count } = await dbQuery;
  if (err) return error(res, err.message, 500);

  return success(res, { data, pagination: { total: count, page, limit } });
}
