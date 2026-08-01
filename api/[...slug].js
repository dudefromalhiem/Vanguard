import route_0 from './_routes/admin/alumni.js';
import route_1 from './_routes/admin/analytics.js';
import route_2 from './_routes/admin/events.js';
import route_3 from './_routes/admin/faqs.js';
import route_4 from './_routes/admin/gallery.js';
import route_5 from './_routes/admin/login.js';
import route_6 from './_routes/admin/logout.js';
import route_7 from './_routes/admin/membership.js';
import route_8 from './_routes/admin/news.js';
import route_9 from './_routes/admin/notifications.js';
import route_10 from './_routes/admin/partners.js';
import route_11 from './_routes/admin/polls.js';
import route_12 from './_routes/admin/projects.js';
import route_13 from './_routes/admin/resources.js';
import route_14 from './_routes/admin/session.js';
import route_15 from './_routes/admin/team.js';
import route_16 from './_routes/member/auth-google.js';
import route_17 from './_routes/member/dashboard.js';
import route_18 from './_routes/member/events.js';
import route_19 from './_routes/member/login.js';
import route_20 from './_routes/member/logout.js';
import route_21 from './_routes/member/profile.js';
import route_22 from './_routes/member/register.js';
import route_23 from './_routes/member/session.js';
import route_24 from './_routes/member/status.js';
import route_25 from './_routes/public/alumni.js';
import route_26 from './_routes/public/events.js';
import route_27 from './_routes/public/faqs.js';
import route_28 from './_routes/public/gallery.js';
import route_29 from './_routes/public/news.js';
import route_30 from './_routes/public/notifications.js';
import route_31 from './_routes/public/partners.js';
import route_32 from './_routes/public/polls.js';
import route_33 from './_routes/public/projects.js';
import route_34 from './_routes/public/resources.js';
import route_35 from './_routes/public/search.js';
import route_36 from './_routes/public/stats.js';
import route_37 from './_routes/public/team.js';

const routes = {
  '/api/admin/alumni': route_0,
  '/api/admin/analytics': route_1,
  '/api/admin/events': route_2,
  '/api/admin/faqs': route_3,
  '/api/admin/gallery': route_4,
  '/api/admin/login': route_5,
  '/api/admin/logout': route_6,
  '/api/admin/membership': route_7,
  '/api/admin/news': route_8,
  '/api/admin/notifications': route_9,
  '/api/admin/partners': route_10,
  '/api/admin/polls': route_11,
  '/api/admin/projects': route_12,
  '/api/admin/resources': route_13,
  '/api/admin/session': route_14,
  '/api/admin/team': route_15,
  '/api/member/auth-google': route_16,
  '/api/member/dashboard': route_17,
  '/api/member/events': route_18,
  '/api/member/login': route_19,
  '/api/member/logout': route_20,
  '/api/member/profile': route_21,
  '/api/member/register': route_22,
  '/api/member/session': route_23,
  '/api/member/status': route_24,
  '/api/public/alumni': route_25,
  '/api/public/events': route_26,
  '/api/public/faqs': route_27,
  '/api/public/gallery': route_28,
  '/api/public/news': route_29,
  '/api/public/notifications': route_30,
  '/api/public/partners': route_31,
  '/api/public/polls': route_32,
  '/api/public/projects': route_33,
  '/api/public/resources': route_34,
  '/api/public/search': route_35,
  '/api/public/stats': route_36,
  '/api/public/team': route_37,
};

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;
    
    // Exact match
    let routeHandler = routes[pathname];
    
    // Handle optional trailing slash
    if (!routeHandler && pathname.endsWith('/')) {
      routeHandler = routes[pathname.slice(0, -1)];
    }
    
    if (routeHandler) {
      return routeHandler(req, res);
    } else {
      return res.status(404).json({ error: 'Route not found: ' + pathname });
    }
  } catch (err) {
    console.error('Router error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
