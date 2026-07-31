import { getDb } from '../_lib/db.js';
import { requireAdmin } from '../_lib/auth.js';
import { success, error, methodNotAllowed, parseBody, parseQuery, paginate } from '../_lib/response.js';
import { validateRequired } from '../_lib/validate.js';
import { notifyApplicationStatus } from '../_lib/email.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();

  if (req.method === 'GET') {
    const query = parseQuery(req);
    const { limit, offset } = paginate(query);
    
    let supabaseQuery = db.from('membership_applications').select('*', { count: 'exact' });
    if (query.status) supabaseQuery = supabaseQuery.eq('status', query.status);
    
    const { data, count, error: err } = await supabaseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (err) return error(res, err.message, 500);
    return success(res, { data, count, limit, offset });
  } else if (req.method === 'PUT') {
    const body = await parseBody(req);
    const { id, status, admin_notes } = body;

    if (!id || !status) return error(res, 'Missing id or status', 400);

    const { data: currentApp, error: fetchErr } = await db.from('membership_applications').select('*').eq('id', id).single();
    if (fetchErr || !currentApp) return error(res, 'Application not found', 404);

    const { data: updatedApp, error: updateErr } = await db.from('membership_applications')
      .update({ status, admin_notes })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return error(res, updateErr.message, 500);

    if (status === 'accepted' && currentApp.status !== 'accepted') {
      const { error: insertErr } = await db.from('members').insert({
        name: currentApp.name,
        email: currentApp.email,
        phone: currentApp.phone,
        usn: currentApp.usn,
        branch: currentApp.branch,
        preferred_wing: currentApp.preferred_wing,
        password_hash: currentApp.password_hash,
        is_active: true
      });
      if (insertErr) return error(res, 'Failed to create member record: ' + insertErr.message, 500);
    }

    try {
      await notifyApplicationStatus(updatedApp.email, updatedApp.name, status);
    } catch (e) {
      console.error('Email notification failed', e);
    }

    return success(res, updatedApp);
  } else {
    return methodNotAllowed(res, ['GET', 'PUT']);
  }
}
