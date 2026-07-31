import { getDb } from '../_lib/db.js';
import { verifyPassword, createMemberSession, setMemberCookie } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../_lib/response.js';
import { validateRequired } from '../_lib/validate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await parseBody(req);
    const missing = validateRequired(body, ['email', 'password']);
    if (missing.length > 0) {
      return error(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const { email, password } = body;
    const db = getDb();

    const { data: member, error: dbError } = await db
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !member) {
      return error(res, 'Invalid credentials', 401);
    }

    const isValid = await verifyPassword(password, member.password_hash);
    if (!isValid) {
      return error(res, 'Invalid credentials', 401);
    }

    const payload = { id: member.id, email: member.email, role: member.role };
    const token = await createMemberSession(payload);
    setMemberCookie(res, token);

    const { password_hash, ...profile } = member;
    return success(res, profile);
  } catch (err) {
    return error(res, err.message, 500);
  }
}
