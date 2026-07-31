import { getDb } from '../_lib/db.js';
import { requireAdmin } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../_lib/response.js';

export default async function handler(req, res) {
  const payload = await requireAdmin(req, res);
  if (!payload) return;

  const db = getDb();
  const query = parseQuery(req);

  if (req.method === 'GET') {
    const { from, to } = paginate(query);
    if (query.album_id) {
      const { data, error: dbError } = await db.from('gallery_images')
        .select('*')
        .eq('album_id', query.album_id)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (dbError) return error(res, dbError.message, 500);
      return success(res, data);
    } else {
      const { data, error: dbError } = await db.from('gallery_albums')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (dbError) return error(res, dbError.message, 500);
      return success(res, data);
    }
  }
  
  else if (req.method === 'POST') {
    const body = parseBody(req);
    if (body.album_id) {
      const { data, error: dbError } = await db.from('gallery_images').insert([body]).select().single();
      if (dbError) return error(res, dbError.message, 500);
      return success(res, data, 201);
    } else {
      const { data, error: dbError } = await db.from('gallery_albums').insert([body]).select().single();
      if (dbError) return error(res, dbError.message, 500);
      return success(res, data, 201);
    }
  }
  
  else if (req.method === 'PUT') {
    if (!query.id) return error(res, 'Missing id parameter', 400);
    const body = parseBody(req);
    
    if (query.type === 'image') {
      const { data, error: dbError } = await db.from('gallery_images').update(body).eq('id', query.id).select().single();
      if (dbError) return error(res, dbError.message, 500);
      return success(res, data);
    } else if (query.type === 'album') {
      const { data, error: dbError } = await db.from('gallery_albums').update(body).eq('id', query.id).select().single();
      if (dbError) return error(res, dbError.message, 500);
      return success(res, data);
    } else {
      return error(res, 'Specify ?type=image or ?type=album', 400);
    }
  }
  
  else if (req.method === 'DELETE') {
    if (!query.id) return error(res, 'Missing id parameter', 400);
    
    if (query.type === 'image') {
      const { error: dbError } = await db.from('gallery_images').delete().eq('id', query.id);
      if (dbError) return error(res, dbError.message, 500);
      return success(res, { message: 'Image deleted successfully' });
    } else if (query.type === 'album') {
      const { error: dbError } = await db.from('gallery_albums').delete().eq('id', query.id);
      if (dbError) return error(res, dbError.message, 500);
      return success(res, { message: 'Album deleted successfully' });
    } else {
      return error(res, 'Specify ?type=image or ?type=album', 400);
    }
  }
  
  else {
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  }
}
