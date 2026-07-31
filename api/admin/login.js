import { getDb } from '../_lib/db.js';
import { verifyPassword, createAdminSession, setAdminCookie } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../_lib/response.js';
import { validateRequired } from '../_lib/validate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const body = parseBody(req);
  const errors = validateRequired(body, ['email', 'password']);
  if (errors.length > 0) {
    return error(res, `Missing required fields: ${errors.join(', ')}`, 400);
  }

  const { email, password } = body;
  const db = getDb();

  const { data: member, error: dbError } = await db
    .from('members')
    .select('*')
    .eq('email', email)
    .single();

  if (dbError || !member || member.role !== 'admin') {
    return error(res, 'Invalid admin credentials', 401);
  }

  const isValid = await verifyPassword(password, member.password_hash);
  
  if (!isValid) {
    return error(res, 'Invalid admin credentials', 401);
  }

  const payload = { id: member.id, email: member.email, role: member.role };
  const token = await createAdminSession(payload);
  setAdminCookie(res, token);
  
  return success(res, { message: 'Admin logged in successfully', user: { id: member.id, email: member.email, role: member.role } });
}
