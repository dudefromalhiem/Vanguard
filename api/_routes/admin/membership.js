import { getDb } from '../../_lib/db.js';
import { requireAdmin, hashPassword } from '../../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../../_lib/response.js';
import { validateRequired } from '../../_lib/validate.js';
import { notifyApplicationStatus } from '../../_lib/email.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();

  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { limit, offset } = paginate(query);
    
    let supabaseQuery = db.from('members').select('*', { count: 'exact' });
    if (query.status === 'pending') {
      supabaseQuery = supabaseQuery.eq('role', 'pending');
    } else if (query.type === 'members') {
      supabaseQuery = supabaseQuery.neq('role', 'pending').neq('role', 'rejected');
    }
    
    const { data, count, error: err } = await supabaseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (err) return error(res, err.message, 500);
    return success(res, { data, count, limit, offset });
  } else if (req.method === 'PUT' || req.method === 'POST') {
    const body = await parseBody(req);
    let id = body.id || body.applicationId;
    let action = body.action || body.status;

    if (!id) return error(res, 'Missing member id', 400);

    let targetRole = 'member';
    if (action === 'reject' || action === 'rejected') targetRole = 'rejected';
    if (action === 'approve' || action === 'approved' || action === 'accepted') targetRole = 'member';

    const { data: updatedMember, error: updateErr } = await db.from('members')
      .update({ role: targetRole })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return error(res, 'Failed to update member status: ' + updateErr.message, 500);

    return success(res, { message: `Member status updated to ${targetRole} successfully`, app: updatedMember });
  } else {
    return methodNotAllowed(res, ['GET', 'PUT', 'POST']);
  }
}
