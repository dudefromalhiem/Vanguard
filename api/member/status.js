import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseBody } from '../_lib/response.js';
import { validateRequired } from '../_lib/validate.js';

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
    const { data: application, error: dbError } = await db
      .from('membership_applications')
      .select('status, created_at, reviewed_at')
      .eq('email', body.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !application) {
      return error(res, 'Application not found', 404);
    }

    return success(res, {
      status: application.status,
      applied_at: application.created_at,
      reviewed_at: application.reviewed_at
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
}
