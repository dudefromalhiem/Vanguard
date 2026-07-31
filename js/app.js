import { loadComponents } from './modules/components.js';
import { initTheme } from './modules/theme.js';
import { initNavigation } from './modules/navigation.js';
import { initSearch } from './modules/search.js';
import { initNotifications } from './modules/notifications.js';
import { initAuthUI } from './modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  loadComponents();
});

document.addEventListener('componentsLoaded', () => {
  initTheme();
  initNavigation();
  initSearch();
  initNotifications();
  initAuthUI();

  // Auto-load page-specific JS
  const path = window.location.pathname;
  const pageMap = {
    '/': 'home', '/index.html': 'home',
    '/about.html': 'about', '/events.html': 'events',
    '/wings.html': 'wings', '/news.html': 'news',
    '/polls.html': 'polls', '/projects.html': 'projects',
    '/team.html': 'team', '/gallery.html': 'gallery',
    '/resources.html': 'resources', '/contact.html': 'contact',
    '/membership.html': 'membership', '/alumni.html': 'alumni',
    '/partners.html': 'partners', '/publications.html': 'publications',
    '/faqs.html': 'faqs', '/dashboard.html': 'dashboard',
    '/portal.html': 'portal', '/admin.html': 'admin'
  };

  const pageName = pageMap[path] || pageMap[path.replace(/\/$/, '')] || null;
  if (pageName) {
    import(`./pages/${pageName}.js`)
      .then(mod => { if (mod.init) mod.init(); })
      .catch(err => console.warn(`Page module not found: ${pageName}`, err));
  }
});
