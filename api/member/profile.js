import { getDb } from '../_lib/db.js';
import { requireMember } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../_lib/response.js';

export default async function handler(req, res) {
  const memberPayload = await requireMember(req, res);
  if (!memberPayload) return;

  const db = getDb();

  if (req.method === 'GET') {
    const { data: member, error: dbError } = await db
      .from('members')
      .select('id, name, email, phone, bio, avatar, portfolio_url, role, joined_at')
      .eq('id', memberPayload.id)
      .single();

    if (dbError || !member) {
      return error(res, 'Member not found', 404);
    }

    return success(res, member);
  } else if (req.method === 'PUT') {
    const body = await parseBody(req);
    const { name, phone, bio, avatar, portfolio_url } = body;

    const { data: updated, error: dbError } = await db
      .from('members')
      .update({ name, phone, bio, avatar, portfolio_url })
      .eq('id', memberPayload.id)
      .select('id, name, email, phone, bio, avatar, portfolio_url, role, joined_at')
      .single();

    if (dbError) {
      return error(res, 'Failed to update profile', 500);
    }

    return success(res, updated);
  } else {
    return methodNotAllowed(res, ['GET', 'PUT']);
  }
}
