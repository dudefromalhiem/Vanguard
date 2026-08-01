import { getDb } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth.js';
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
    
    const tableName = query.type === 'members' ? 'members' : 'membership_applications';
    let supabaseQuery = db.from(tableName).select('*', { count: 'exact' });
    if (query.status && tableName === 'membership_applications') {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }
    
    const { data, count, error: err } = await supabaseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (err) return error(res, err.message, 500);
    return success(res, { data, count, limit, offset });
  } else if (req.method === 'PUT' || req.method === 'POST') {
    const body = await parseBody(req);
    let id = body.id || body.applicationId;
    let status = body.status;
    
    if (body.action === 'approve') status = 'approved';
    if (body.action === 'reject') status = 'rejected';

    if (!id || !status) return error(res, 'Missing application id or status', 400);

    const { data: currentApp, error: fetchErr } = await db.from('membership_applications').select('*').eq('id', id).single();
    if (fetchErr || !currentApp) return error(res, 'Application not found', 404);

    const { data: updatedApp, error: updateErr } = await db.from('membership_applications')
      .update({ status: status, admin_notes: body.admin_notes || '' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return error(res, 'Failed to update application: ' + updateErr.message, 500);

    // If approved, create/promote user in members table so they can log in!
    if (status === 'approved' || status === 'accepted') {
      const { error: insertErr } = await db.from('members').insert({
        name: currentApp.name,
        email: currentApp.email,
        password_hash: currentApp.password_hash,
        role: 'member'
      });
      
      // Ignore unique email error if member already exists
      if (insertErr && insertErr.code !== '23505') {
        return error(res, 'Failed to create member record: ' + insertErr.message, 500);
      }
    }

    try {
      await notifyApplicationStatus(currentApp.email, currentApp.name, status);
    } catch (e) {
      console.error('Email notification failed', e);
    }

    return success(res, { message: `Application ${status} successfully`, app: updatedApp });
  } else {
    return methodNotAllowed(res, ['GET', 'PUT', 'POST']);
  }
}
