import { clearMemberCookie } from '../../_lib/auth.js';
import { success, methodNotAllowed } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  clearMemberCookie(res);
  return success(res, { message: 'Logged out successfully' });
}
