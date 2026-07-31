import { api } from '../modules/api.js';

export async function init() {
  const featuredContainer = document.getElementById('featured-event');
  const pollContainer = document.getElementById('active-poll');
  const statsContainer = document.getElementById('stats-section');
  const newsContainer = document.getElementById('latest-news');
  const countdownContainer = document.getElementById('countdown');

  try {
    const [eventsData, statsData, newsData, pollsData] = await Promise.all([
      api.get('/api/public/events?upcoming=true'),
      api.get('/api/public/stats'),
      api.get('/api/public/news?limit=1'),
      api.get('/api/public/polls')
    ]);

    if (eventsData?.data?.length > 0) {
      const event = eventsData.data[0];
      featuredContainer.innerHTML = `<h3>Featured: ${event.title}</h3><p>${event.description}</p>`;
      // Countdown
      const eventDate = new Date(event.date).getTime();
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

    if (statsData?.data) {
      statsContainer.innerHTML = `<p>Members: ${statsData.data.members}</p><p>Events: ${statsData.data.events}</p>`;
    }

    if (newsData?.data?.length > 0) {
      newsContainer.innerHTML = `<p>Latest News: ${newsData.data[0].title}</p>`;
    }

    if (pollsData?.data?.length > 0) {
      const activePoll = pollsData.data.find(p => p.active);
      if (activePoll) {
        pollContainer.innerHTML = `<p>Poll: ${activePoll.question}</p>`;
      }
    }
  } catch (err) {
    console.error('Home init error', err);
  }
}
