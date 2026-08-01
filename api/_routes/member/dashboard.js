import { getDb } from '../../_lib/db.js';
import { requireMember } from '../../_lib/auth.js';
import { success, error, methodNotAllowed } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const memberPayload = await requireMember(req, res);
  if (!memberPayload) return;

  const db = getDb();

  try {
    const [registrations, notifications, polls] = await Promise.all([
      db.from('event_registrations').select('*, events(*)').eq('member_id', memberPayload.id),
      db.from('notifications').select('*').eq('member_id', memberPayload.id).order('created_at', { ascending: false }).limit(10),
      db.from('polls').select('*').eq('is_active', true).order('created_at', { ascending: false })
    ]);

    return success(res, {
      registrations: registrations.data || [],
      notifications: notifications.data || [],
      polls: polls.data || []
    });
  } catch (err) {
    return error(res, 'Failed to fetch dashboard data', 500);
  }
}
