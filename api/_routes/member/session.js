import { requireAuth } from '../../_lib/auth.js';
import { success, error, methodNotAllowed } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  // Use requireAuth without roles to allow ANY valid session
  const payload = await requireAuth(req, res);
  if (!payload) return; // requireAuth handles the error response

  return success(res, payload);
}
