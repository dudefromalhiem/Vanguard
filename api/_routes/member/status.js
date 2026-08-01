import { getDb } from '../../_lib/db.js';
import { success, error, methodNotAllowed, parseBody } from '../../_lib/response.js';
import { validateRequired } from '../../_lib/validate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await parseBody(req);
    const missing = validateRequired(body, ['email']);
    if (missing.length > 0) {
      return error(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const db = getDb();
    const { data: member, error: dbError } = await db
      .from('members')
      .select('name, email, role, created_at')
      .eq('email', body.email)
      .single();

    if (dbError || !member) {
      return error(res, 'Application not found', 404);
    }

    return success(res, {
      status: member.role,
      applied_at: member.created_at
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
}
