import { getDb } from '../../_lib/db.js';
import { requireAuth } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../../_lib/response.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const { data: polls, error: err } = await db.from('polls')
      .select('*, poll_options(*, poll_votes(count))')
      .order('is_active', { ascending: false })
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
    // Require authentication for voting
    const session = await requireAuth(req, res);
    if (!session) return; // requireAuth handles the 401 response

    const { poll_id, option_id } = await parseBody(req);
    if (!poll_id || !option_id) return error(res, 'Missing required fields', 400);

    // Use session ID directly to prevent spoofing
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
