import { getDb } from '../_lib/db.js';
import { requireAdmin } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../_lib/response.js';
import { validateRequired } from '../_lib/validate.js';

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res);
  if (!payload) return;

  const db = getDb();

  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { from, to } = paginate(query);
    const { data, error: dbError } = await db.from('team_members')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data);
  }
  
  else if (req.method === 'POST') {
    const body = parseBody(req);
    const errors = validateRequired(body, ['name', 'role', 'category']);
    if (errors.length > 0) return error(res, `Missing fields: ${errors.join(', ')}`, 400);
    
    const { data, error: dbError } = await db.from('team_members').insert([body]).select().single();
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data, 201);
  }
  
  else if (req.method === 'PUT') {
    const query = parseQuery(req);
    if (!query.id) return error(res, 'Missing id parameter', 400);
    
    const body = parseBody(req);
    const { data, error: dbError } = await db.from('team_members').update(body).eq('id', query.id).select().single();
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data);
  }
  
  else if (req.method === 'DELETE') {
    const query = parseQuery(req);
    if (!query.id) return error(res, 'Missing id parameter', 400);
    
    const { error: dbError } = await db.from('team_members').delete().eq('id', query.id);
    if (dbError) return error(res, dbError.message, 500);
    return success(res, { message: 'Deleted successfully' });
  }
  
  else {
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  }
}
