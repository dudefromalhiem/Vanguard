import { getDb } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth.js';
import { success, error, methodNotAllowed } from '../../_lib/response.js';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const db = getDb();
  
  try {
    const [
      { count: membersCount },
      { count: pendingAppsCount },
      { count: eventsCount },
      { count: newsCount },
      { count: pollsCount },
      { count: resourcesCount },
      { count: projectsCount },
      { count: alumniCount }
    ] = await Promise.all([
      db.from('members').select('*', { count: 'exact', head: true }),
      db.from('membership_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString()),
      db.from('news').select('*', { count: 'exact', head: true }).eq('is_published', true),
      db.from('polls').select('*', { count: 'exact', head: true }),
      db.from('resources').select('*', { count: 'exact', head: true }),
      db.from('projects').select('*', { count: 'exact', head: true }),
      db.from('alumni').select('*', { count: 'exact', head: true })
    ]);

    return success(res, {
      members: membersCount || 0,
      membership_applications: pendingAppsCount || 0,
      events: eventsCount || 0,
      news: newsCount || 0,
      polls: pollsCount || 0,
      resources: resourcesCount || 0,
      projects: projectsCount || 0,
      alumni: alumniCount || 0
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
}
