import { getDb } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../../_lib/response.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    // Auto-close expired polls & auto-delete media 24 hours post-expiration
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    await db.from('polls')
      .update({ status: 'Closed' })
      .eq('status', 'Active')
      .lt('end_date', now.toISOString());

    await db.from('polls')
      .update({ image_url: null })
      .not('image_url', 'is', null)
      .lt('end_date', cutoff24h);

    const { data: polls, error: err } = await db.from('polls')
      .select('*, poll_options(*, poll_votes(count))')
      .order('created_at', { ascending: false });
    
    if (err) return error(res, err.message, 500);
    
    const formattedPolls = polls.map(poll => ({
      ...poll,
      poll_options: poll.poll_options.map(opt => ({
        ...opt,
        vote_count: opt.poll_votes && opt.poll_votes.length > 0 ? opt.poll_votes[0].count : 0
      }))
    }));
    return success(res, formattedPolls);
    
  } else if (req.method === 'POST') {
    const body = await parseBody(req);
    
    // 1. Create New Community Poll (Public / Member)
    if (body.title && body.options) {
      let options = body.options;
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch (e) {
          options = options.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      if (!Array.isArray(options) || options.length === 0) {
        return error(res, 'Options must be a non-empty list', 400);
      }

      const durationHours = parseInt(body.duration_hours || 24, 10);
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationHours * 3600000);

      // Only insert schema-valid columns
      const { data: poll, error: pollError } = await db.from('polls').insert([{ 
        title: body.title,
        status: 'Active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        image_url: body.image_url || body.media_url || null,
        created_by: null
      }]).select().single();

      if (pollError) return error(res, pollError.message, 500);

      const optionRows = options.map(opt => ({
        poll_id: poll.id,
        option_text: typeof opt === 'string' ? opt : opt.text
      }));

      const { error: optError } = await db.from('poll_options').insert(optionRows);
      if (optError) return error(res, optError.message, 500);

      return success(res, poll, 201);
    }

    // 2. Vote in Existing Poll
    const session = await requireAuth(req, res);
    if (!session) return; // requireAuth handles 401

    const { poll_id, option_id } = body;
    if (!poll_id || !option_id) return error(res, 'Missing required fields', 400);

    const voter_id = session.id;

    const { error: err } = await db.from('poll_votes').insert([{ 
      poll_id, 
      option_id, 
      member_id: voter_id 
    }]);

    if (err) {
      if (err.code === '23505') return error(res, 'You have already voted in this poll', 409);
      return error(res, err.message, 500);
    }
    return success(res, { message: 'Vote recorded successfully' });
  }
  
  return methodNotAllowed(res, ['GET', 'POST']);
}
