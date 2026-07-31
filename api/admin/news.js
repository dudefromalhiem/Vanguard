import { getDb } from '../_lib/db.js';
import { requireAdmin } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../_lib/response.js';
import { validateRequired, slugify } from '../_lib/validate.js';

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res);
  if (!payload) return;

  const db = getDb();

  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { from, to } = paginate(query);
    const { data, error: dbError } = await db.from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data);
  } 
  
  else if (req.method === 'POST') {
    const body = parseBody(req);
    const errors = validateRequired(body, ['title', 'body', 'category', 'author']);
    if (errors.length > 0) return error(res, `Missing fields: ${errors.join(', ')}`, 400);
    
    body.slug = slugify(body.title);
    
    const { data, error: dbError } = await db.from('news').insert([body]).select().single();
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data, 201);
  }
  
  else if (req.method === 'PUT') {
    const query = parseQuery(req);
    if (!query.id) return error(res, 'Missing id parameter', 400);
    
    const body = parseBody(req);
    if (body.title) body.slug = slugify(body.title);
    
    const { data, error: dbError } = await db.from('news').update(body).eq('id', query.id).select().single();
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data);
  }
  
  else if (req.method === 'DELETE') {
    const query = parseQuery(req);
    if (!query.id) return error(res, 'Missing id parameter', 400);
    
    const { error: dbError } = await db.from('news').delete().eq('id', query.id);
    if (dbError) return error(res, dbError.message, 500);
    return success(res, { message: 'Deleted successfully' });
  }
  
  else {
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  }
}
