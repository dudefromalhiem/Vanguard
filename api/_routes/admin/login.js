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
  const rawAdminCreds = (process.env.ADMIN_CREDENTIALS || '').trim();
  let envAdmins = {};

  if (rawAdminCreds) {
    try {
      envAdmins = JSON.parse(rawAdminCreds);
    } catch {
      const parts = rawAdminCreds.split(':');
      if (parts.length >= 2) {
        const cleanKey = parts[0].replace(/['"{} ]/g, '').trim();
        const cleanVal = parts.slice(1).join(':').replace(/['"{} ]/g, '').trim();
        envAdmins[cleanKey] = cleanVal;
      }
    }
  }

  const inputEmail = (email || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  // 0. Superadmin direct login override
  if (inputEmail === 'dudefromalhiem@gmail.com' && inputPassword === 'vanguardian123') {
    const payload = { id: 'admin-super', email: inputEmail, role: 'admin' };
    const token = await createAdminSession(payload);
    setAdminCookie(res, token);
    return success(res, { message: 'Admin logged in successfully', user: payload });
  }

  for (const [k, v] of Object.entries(envAdmins)) {
    const keyClean = k.replace(/['"{} ]/g, '').trim().toLowerCase();
    const valClean = String(v).replace(/['"{} ]/g, '').trim();
    if (keyClean === inputEmail && valClean === inputPassword) {
      const payload = { id: 'admin-env', email: email, role: 'admin' };
      const token = await createAdminSession(payload);
      setAdminCookie(res, token);
      return success(res, { message: 'Admin logged in successfully', user: payload });
    }
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
