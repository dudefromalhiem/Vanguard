import { getDb } from '../_lib/db.js';
import { success, error, methodNotAllowed, parseQuery } from '../_lib/response.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const db = getDb();
  const { q } = parseQuery(req);
  
  if (!q) return success(res, { news: [], events: [], projects: [], resources: [], team: [], faqs: [] });

  const results = await Promise.all([
    db.from('news').select('id, title, slug, type:"news"').eq('is_published', true).or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(5),
    db.from('events').select('id, title, slug, type:"event"').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(5),
    db.from('projects').select('id, title, slug, type:"project"').neq('status', 'archived').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(5),
    db.from('resources').select('id, title, type:"resource"').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(5),
    db.from('team_members').select('id, name as title, type:"team"').eq('is_active', true).or(`name.ilike.%${q}%,role.ilike.%${q}%`).limit(5),
    db.from('faqs').select('id, question as title, type:"faq"').or(`question.ilike.%${q}%,answer.ilike.%${q}%`).limit(5),
    db.from('polls').select('id, title, type:"poll"').neq('status', 'Draft').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(5)
  ]);

  return success(res, {
    news: results[0].data || [],
    events: results[1].data || [],
    projects: results[2].data || [],
    resources: results[3].data || [],
    team: results[4].data || [],
    faqs: results[5].data || [],
    polls: results[6].data || []
  });
}
