import { api } from '../modules/api.js';

export async function init() {
  const container = document.getElementById('publications-list');
  if (!container) return;

  try {
    const res = await api.get('/api/public/news?category=publication');
    if (res.success) {
      container.innerHTML = res.data.map(pub => `
        <article class="publication-card">
          <h3>${pub.title}</h3>
          <p>${pub.summary || ''}</p>
          <a href="/news/${pub.slug}">Read more</a>
        </article>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}
