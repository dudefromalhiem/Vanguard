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

  // 1. Check ADMIN_CREDENTIALS environment variable
  let envAdmins = {};
  if (process.env.ADMIN_CREDENTIALS) {
    try {
      envAdmins = JSON.parse(process.env.ADMIN_CREDENTIALS);
    } catch {
      // If it's a simple string format like "email:password"
      const parts = process.env.ADMIN_CREDENTIALS.split(':');
      if (parts.length === 2) {
        envAdmins[parts[0].trim()] = parts[1].trim();
      }
    }
  }

  if (envAdmins[email] && envAdmins[email] === password) {
    const payload = { id: 'admin-env', email: email, role: 'admin' };
    const token = await createAdminSession(payload);
    setAdminCookie(res, token);
    return success(res, { message: 'Admin logged in successfully', user: payload });
  }

  // 2. Check Supabase members table for admin role
  try {
    const db = getDb();
    const { data: member, error: dbError } = await db
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    if (!dbError && member && member.role === 'admin') {
      const isValid = await verifyPassword(password, member.password_hash);
      if (isValid) {
        const payload = { id: member.id, email: member.email, role: member.role };
        const token = await createAdminSession(payload);
        setAdminCookie(res, token);
        return success(res, { message: 'Admin logged in successfully', user: payload });
      }
    }
  } catch (err) {
    console.error('DB check failed in admin login:', err.message);
  }

  return error(res, 'Invalid admin credentials', 401);
}
