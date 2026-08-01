import { getDb } from '../../_lib/db.js';
import { requireMember } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../../_lib/response.js';
import { validateRequired } from '../../_lib/validate.js';
import { notifyEventRegistration } from '../../_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const memberPayload = await requireMember(req, res);
  if (!memberPayload) return;

  try {
    const body = await parseBody(req);
    const missing = validateRequired(body, ['event_id']);
    if (missing.length > 0) {
      return error(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const { event_id } = body;
    const db = getDb();

    const { data: event, error: eventError } = await db
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return error(res, 'Event not found', 404);
    }

    // Basic capacity check (not fully atomic here)
    const { count } = await db.from('event_registrations').select('*', { count: 'exact' }).eq('event_id', event_id);
    if (event.capacity && count >= event.capacity) {
      return error(res, 'Event is at capacity', 400);
    }

    const ticket_code = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const { data: registration, error: regError } = await db
      .from('event_registrations')
      .insert({ event_id, member_id: memberPayload.id, ticket_code })
      .select()
      .single();

    if (regError) {
      if (regError.code === '23505') return error(res, 'Already registered', 400);
      return error(res, 'Failed to register', 500);
    }

    await notifyEventRegistration(memberPayload.email, event, ticket_code);

    return success(res, registration, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
}
