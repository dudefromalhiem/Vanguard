import { getDb } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../../_lib/response.js';
import { validateRequired } from '../../_lib/validate.js';

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res);
  if (!payload) return;

  const db = getDb();

  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { from, to } = paginate(query);
    const { data, error: dbError } = await db.from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data);
  }
  
  else if (req.method === 'POST') {
    const body = parseBody(req);
    const errors = validateRequired(body, ['title', 'options']);
    if (errors.length > 0) return error(res, `Missing fields: ${errors.join(', ')}`, 400);
    
    let options = body.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        return error(res, 'Invalid JSON in options', 400);
      }
    }
    
    if (!Array.isArray(options) || options.length === 0) {
      return error(res, 'options must be a non-empty array', 400);
    }
    
    // Insert Poll
    const { data: poll, error: pollError } = await db.from('polls').insert([{ 
      title: body.title,
      description: body.description || null,
      status: body.status || 'Draft',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      image_url: body.image_url || null,
      tags: body.tags || [],
      created_by: payload.id
    }]).select().single();
    
    if (pollError) return error(res, pollError.message, 500);
    
    // Insert Options
    const optionRows = options.map(opt => ({
      poll_id: poll.id,
      option_text: typeof opt === 'string' ? opt : opt.text
    }));
    
    const { error: optError } = await db.from('poll_options').insert(optionRows);
    if (optError) return error(res, optError.message, 500);
    
    return success(res, poll, 201);
  }
  
  else if (req.method === 'DELETE') {
    const query = parseQuery(req);
    if (!query.id) return error(res, 'Missing id parameter', 400);
    
    const { error: dbError } = await db.from('polls').delete().eq('id', query.id);
    if (dbError) return error(res, dbError.message, 500);
    return success(res, { message: 'Deleted successfully' });
  }
  
  else {
    return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
  }
}
