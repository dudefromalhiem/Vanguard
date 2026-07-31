import { api } from './api.js';
import { debounce, escapeHtml } from './utils.js';

export function initSearch() {
  const trigger = document.getElementById('search-trigger');
  const overlay = document.querySelector('.search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const close = document.getElementById('close-search');

  const staticLinks = [
    { title: 'Home', url: './index.html', type: 'page', desc: 'The Vanguard Society landing page' },
    { title: 'About Us', url: './about.html', type: 'page', desc: 'Our mission, vision, and history' },
    { title: 'Events & Sessions', url: './events.html', type: 'page', desc: 'Upcoming parliamentary debates and hackathons' },
    { title: 'News & Announcements', url: './news.html', type: 'page', desc: 'Latest updates from the society' },
    { title: 'Society Wings', url: './wings.html', type: 'page', desc: 'The Leadership and Technical divisions' },
    { title: 'Active Polls', url: './polls.html', type: 'page', desc: 'Vote on upcoming initiatives' },
    { title: 'Research & Projects', url: './projects.html', type: 'page', desc: 'Open-source initiatives and research papers' },
    { title: 'Team & Faculty', url: './team.html', type: 'page', desc: 'Core committee members and faculty advisors' },
    { title: 'Gallery', url: './gallery.html', type: 'page', desc: 'Photos from past events' },
    { title: 'Resources', url: './resources.html', type: 'page', desc: 'Curated library of articles and tools' },
    { title: 'Membership', url: './membership.html', type: 'page', desc: 'Join The Vanguard Society' },
    { title: 'Alumni Network', url: './alumni.html', type: 'page', desc: 'Connect with former members' },
    { title: 'Contact Us', url: './contact.html', type: 'page', desc: 'Get in touch with the core committee' },
    { title: 'FAQs', url: './faqs.html', type: 'page', desc: 'Frequently asked questions' },
    { title: 'Admin Login', url: './admin.html', type: 'page', desc: 'Restricted administrative portal' },
  ];

  let currentSelectedIndex = -1;

  function renderResults(data) {
    if (!results) return;
    
    // Group all data
    const hasData = Object.values(data).some(arr => arr && arr.length > 0);
    if (!hasData) {
      results.innerHTML = '<div class="spotlight-empty"><p>No results found for that query.</p></div>';
      return;
    }

    let html = '';
    
    const sections = [
      { key: 'pages', label: 'Page', linkBase: '' },
      { key: 'news', label: 'News', linkBase: './news.html#' },
      { key: 'events', label: 'Event', linkBase: './events.html#' },
      { key: 'projects', label: 'Project', linkBase: './projects.html#' },
      { key: 'polls', label: 'Poll', linkBase: './polls.html#' },
      { key: 'resources', label: 'Resource', linkBase: './resources.html' },
      { key: 'team', label: 'Member', linkBase: './team.html' },
      { key: 'faqs', label: 'FAQ', linkBase: './faqs.html' }
    ];

    for (const s of sections) {
      const items = data[s.key];
      if (items && items.length > 0) {
        html += `<div class="search-section"><h3 class="search-section-title">${s.label}s</h3><ul>`;
        for (const item of items) {
          const title = item.title || item.name || item.question || '';
          const desc = item.desc || item.description || item.answer || item.role || 'Vanguard Society';
          const url = item.url ? item.url : `${s.linkBase}${item.slug || item.id || ''}`;
          
          html += `<li>
            <a href="${url}" class="search-item" data-url="${url}">
              <div class="category-badge">${s.label}</div>
              <div class="search-item-content">
                <div class="search-item-title">${escapeHtml(title)}</div>
                <div class="search-item-desc">${escapeHtml(desc)}</div>
              </div>
              <div class="jump-hint">Jump to ↵</div>
            </a>
          </li>`;
        }
        html += '</ul></div>';
      }
    }
    
    results.innerHTML = html;
    currentSelectedIndex = -1;
    updateSelection(false);
  }

  function updateSelection(scrollTo = true) {
    if (!results) return;
    const items = results.querySelectorAll('.search-item');
    items.forEach((item, index) => {
      if (index === currentSelectedIndex) {
        item.classList.add('is-selected');
        if (scrollTo) {
          item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else {
        item.classList.remove('is-selected');
      }
    });
  }

  const doSearch = debounce(async (query) => {
    if (!query || query.length < 2) {
      renderResults({ pages: staticLinks });
      return;
    }
    
    const staticMatches = staticLinks.filter(l => l.title.toLowerCase().includes(query) || l.url.toLowerCase().includes(query));
    
    try {
      const res = await api.get(`/api/public/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = res.data;
        data.pages = staticMatches;
        renderResults(data);
      } else {
        renderResults({ pages: staticMatches });
      }
    } catch {
      renderResults({ pages: staticMatches });
    }
  }, 250);

  function openSearch() { 
    if (!overlay || !input) return;
    overlay.classList.add('active'); 
    input.value = ''; 
    renderResults({ pages: staticLinks }); 
    input.focus(); 
  }
  
  function closeSearch() { 
    if (overlay) overlay.classList.remove('active'); 
  }

  if (trigger) trigger.addEventListener('click', openSearch);
  if (close) close.addEventListener('click', closeSearch);

  // Close search when a result link is clicked (crucial for hash links)
  if (results) {
    results.addEventListener('click', (e) => {
      const link = e.target.closest('.search-item');
      if (link) {
        // Allow native navigation, delay closing to prevent browser cancelling it
        setTimeout(() => closeSearch(), 50);
      }
    });

    // Hover sync logic
    results.addEventListener('mousemove', (e) => {
      const link = e.target.closest('.search-item');
      if (link) {
        const items = Array.from(results.querySelectorAll('.search-item'));
        const index = items.indexOf(link);
        if (index !== -1 && index !== currentSelectedIndex) {
          currentSelectedIndex = index;
          updateSelection(false); // DO NOT scroll on hover
        }
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { 
      e.preventDefault(); 
      openSearch(); 
    }
    if (overlay && overlay.classList.contains('active')) {
      if (e.key === 'Escape') closeSearch();
      
      if (!results) return;
      const items = results.querySelectorAll('.search-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentSelectedIndex = (currentSelectedIndex + 1) % items.length;
        updateSelection(true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentSelectedIndex = (currentSelectedIndex - 1 + items.length) % items.length;
        updateSelection(true);
      } else if (e.key === 'Enter') {
        const targetLink = items[currentSelectedIndex] || (document.activeElement === input && items.length > 0 ? items[0] : null);
        if (targetLink) {
          e.preventDefault();
          targetLink.click(); // Triggers the native click and our click listener
        }
      }
    }
  });

  if (overlay) {
    overlay.addEventListener('click', (e) => { 
      if (e.target === overlay || e.target.closest('.spotlight-modal') === null) {
        if (e.target.closest('.spotlight-modal') === null && e.target !== overlay) return;
        closeSearch(); 
      }
    });
  }

  if (input) {
    input.addEventListener('input', (e) => doSearch(e.target.value.toLowerCase().trim()));
  }
}
