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

    // Auto-close expired polls & auto-delete media 24 hours post-expiration
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Close active polls whose end_date has passed
    await db.from('polls')
      .update({ status: 'Closed' })
      .eq('status', 'Active')
      .lt('end_date', now.toISOString());

    // 2. Delete media (image_url) 24 hours after expiration, preserving poll results forever
    await db.from('polls')
      .update({ image_url: null })
      .not('image_url', 'is', null)
      .lt('end_date', cutoff24h);

    const { data, error: dbError } = await db.from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (dbError) return error(res, dbError.message, 500);
    return success(res, data);
  }
  
  else if (req.method === 'POST' || req.method === 'PUT') {
    const body = parseBody(req);

    // Postpone / Extend Expiration Handler (Admin)
    if (body.action === 'postpone' || body.action === 'extend') {
      const pollId = body.id || body.poll_id;
      const extensionHours = parseInt(body.extension_hours || 24, 10);
      if (!pollId) return error(res, 'Missing poll id for postpone action', 400);

      const { data: currentPoll, error: fetchErr } = await db.from('polls').select('*').eq('id', pollId).single();
      if (fetchErr || !currentPoll) return error(res, 'Poll not found', 404);

      // Extend from existing end_date or from current time
      const baseTime = currentPoll.end_date ? new Date(currentPoll.end_date) : new Date();
      const newEndDate = new Date(Math.max(baseTime.getTime(), Date.now()) + extensionHours * 3600000).toISOString();

      const { data: updatedPoll, error: updateErr } = await db.from('polls')
        .update({ end_date: newEndDate, status: 'Active' })
        .eq('id', pollId)
        .select()
        .single();

      if (updateErr) return error(res, updateErr.message, 500);
      return success(res, { message: `Poll extended by ${extensionHours} hours`, poll: updatedPoll });
    }

    const errors = validateRequired(body, ['title', 'options']);
    if (errors.length > 0) return error(res, `Missing fields: ${errors.join(', ')}`, 400);
    
    let options = body.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        options = options.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    if (!Array.isArray(options) || options.length === 0) {
      return error(res, 'options must be a non-empty array', 400);
    }
    
    const isValidUuid = typeof payload?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id);
    
    // Duration calculation in hours (default 24h)
    const durationHours = parseInt(body.duration_hours || 24, 10);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationHours * 3600000);

    // Insert Poll (Only using schema-valid columns in polls table)
    const { data: poll, error: pollError } = await db.from('polls').insert([{ 
      title: body.title,
      description: body.description || null,
      status: 'Active',
      start_date: startDate.toISOString(),
      end_date: body.end_date || endDate.toISOString(),
      image_url: body.image_url || body.media_url || null,
      tags: body.tags || [],
      created_by: isValidUuid ? payload.id : null
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
