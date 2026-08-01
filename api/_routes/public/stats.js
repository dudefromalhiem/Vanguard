import { getDb } from '../../_lib/db.js';
import { success, error, methodNotAllowed } from '../../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();

  const [
    { count: membersCount },
    { count: facultyCount },
    { count: eventsCount },
    { count: projectsCount },
    { count: resourcesCount }
  ] = await Promise.all([
    db.from('members').select('*', { count: 'exact', head: true }),
    db.from('team').select('*', { count: 'exact', head: true }).eq('category', 'faculty'),
    db.from('events').select('*', { count: 'exact', head: true }),
    db.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'archived'),
    db.from('resources').select('*', { count: 'exact', head: true })
  ]);

  return success(res, {
    members: membersCount || 0,
    faculty: facultyCount || 0,
    events: eventsCount || 0,
    projects: projectsCount || 0,
    resources: resourcesCount || 0,
    founded: 2026,
    wings: 2
  });
}
