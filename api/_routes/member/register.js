import { getDb } from '../_lib/db.js';
import { hashPassword } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../_lib/response.js';
import { validateRequired, validateEmail } from '../_lib/validate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = parseBody(req);
  const missing = validateRequired(body, ['name', 'email', 'password']);
  if (missing.length > 0) return error(res, `Missing required fields: ${missing.join(', ')}`, 400);
  
  if (!validateEmail(body.email)) return error(res, 'Invalid email format', 400);
  if (body.password.length < 8) return error(res, 'Password must be at least 8 characters long', 400);

  const db = getDb();
  const password_hash = await hashPassword(body.password);

  const { data, error: dbError } = await db.from('membership_applications').insert([{
    name: body.name,
    email: body.email,
    phone: body.phone,
    usn: body.usn,
    branch: body.branch,
    semester: body.semester,
    why_join: body.why_join,
    preferred_wing: body.preferred_wing,
    password_hash: password_hash
  }]);

  if (dbError) {
    if (dbError.code === '23505') {
      return error(res, 'Email already in use for an application or membership', 409);
    }
    return error(res, 'Failed to submit application', 500);
  }

  return success(res, { message: 'Application submitted successfully' }, 201);
}
