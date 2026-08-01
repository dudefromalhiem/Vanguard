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
  const pathParts = window.location.pathname.split('/');
  let rawFilename = pathParts[pathParts.length - 1] || 'index.html';
  if (!rawFilename) rawFilename = 'index.html';
  const pageKey = rawFilename.replace(/\.html$/, '');

  const pageMap = {
    '': 'home', 'index': 'home',
    'about': 'about', 'events': 'events',
    'wings': 'wings', 'news': 'news',
    'polls': 'polls', 'projects': 'projects',
    'team': 'team', 'gallery': 'gallery',
    'resources': 'resources', 'contact': 'contact',
    'membership': 'membership', 'alumni': 'alumni',
    'partners': 'partners', 'publications': 'publications',
    'faqs': 'faqs', 'dashboard': 'dashboard',
    'portal': 'portal', 'admin': 'admin', 'login': 'login'
  };

  const pageName = pageMap[pageKey] || null;
  if (pageName) {
    import(`./pages/${pageName}.js`)
      .then(mod => { if (mod.init) mod.init(); })
      .catch(err => console.warn(`Page module not found: ${pageName}`, err));
  }
});
