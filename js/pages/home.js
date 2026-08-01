import { api } from '../modules/api.js';

export async function init() {
  const featuredContainer = document.getElementById('featured-event');
  const pollContainer = document.getElementById('active-poll');
  const statsContainer = document.getElementById('stats-section');
  const newsContainer = document.getElementById('latest-news');
  const countdownContainer = document.getElementById('countdown');

  try {
    const [eventsRes, statsRes, newsRes, pollsRes] = await Promise.all([
      api.get('/api/public/events?upcoming=true'),
      api.get('/api/public/stats'),
      api.get('/api/public/news?limit=1'),
      api.get('/api/public/polls')
    ]);

    const events = extractArray(eventsRes);
    const stats = statsRes?.data || statsRes || {};
    const news = extractArray(newsRes);
    const polls = extractArray(pollsRes);

    if (featuredContainer && events.length > 0) {
      const event = events[0];
      featuredContainer.innerHTML = `<h3>Featured: ${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description || '')}</p>`;
      if (countdownContainer && event.event_date) {
        const eventDate = new Date(event.event_date).getTime();
        setInterval(() => {
          const now = new Date().getTime();
          const dist = eventDate - now;
          if (dist < 0) {
            countdownContainer.innerHTML = 'Event Started!';
            return;
          }
          const d = Math.floor(dist / (1000 * 60 * 60 * 24));
          const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((dist % (1000 * 60)) / 1000);
          countdownContainer.innerHTML = `${d}d ${h}h ${m}m ${s}s`;
        }, 1000);
      }
    }

    if (statsContainer && stats) {
      statsContainer.innerHTML = `
        <div style="display:flex; gap:2rem; justify-content:center;">
          <div><strong style="font-size:1.5rem;">${stats.members || stats.membersCount || 0}</strong><br><span style="font-size:0.875rem; color:var(--text-secondary);">Active Members</span></div>
          <div><strong style="font-size:1.5rem;">${stats.events || stats.eventsCount || 0}</strong><br><span style="font-size:0.875rem; color:var(--text-secondary);">Events Organized</span></div>
        </div>
      `;
    }

    if (newsContainer && news.length > 0) {
      newsContainer.innerHTML = `<p><strong>Latest Update:</strong> ${escapeHtml(news[0].title)}</p>`;
    }

    if (pollContainer && polls.length > 0) {
      const activePoll = polls.find(p => p.status === 'Active');
      if (activePoll) {
        pollContainer.innerHTML = `<p><strong>Featured Poll:</strong> ${escapeHtml(activePoll.title)} <a href="/polls.html" style="color:var(--accent-color); text-decoration:underline;">Vote Now &rarr;</a></p>`;
      }
    }
  } catch (err) {
    console.error('Home page init error:', err);
  }

  function extractArray(res) {
    if (!res) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
  }
}
