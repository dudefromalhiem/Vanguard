import { getDb } from '../../_lib/db.js';
import { hashPassword } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody } from '../../_lib/response.js';
import { validateRequired, validateEmail } from '../../_lib/validate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = parseBody(req);
  const missing = validateRequired(body, ['name', 'email', 'password']);
  if (missing.length > 0) return error(res, `Missing required fields: ${missing.join(', ')}`, 400);
  
  if (!validateEmail(body.email)) return error(res, 'Invalid email format', 400);
  if (body.password.length < 8) return error(res, 'Password must be at least 8 characters long', 400);

  const db = getDb();
  const password_hash = await hashPassword(body.password);

  const payload = {
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    branch: body.branch || null,
    semester: body.semester || null,
    why_join: body.why_join || body['why-join'] || null,
    password_hash: password_hash,
    status: 'pending'
  };

  const { data, error: dbError } = await db.from('membership_applications').insert([payload]).select().single();

  if (dbError) {
    if (dbError.code === '23505') {
      return error(res, 'Email already in use for an application or membership', 409);
    }
    return error(res, 'Failed to submit application: ' + dbError.message, 500);
  }

  return success(res, { message: 'Application submitted successfully', data }, 201);
}
