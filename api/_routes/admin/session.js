import { requireAdmin } from '../_lib/auth.js';
import { success, methodNotAllowed } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const payload = await requireAdmin(req, res);
  if (!payload) return;

  return success(res, { email: payload.email, role: 'admin' });
}
