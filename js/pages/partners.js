import { api } from '../modules/api.js';

export async function init() {
  const container = document.getElementById('partners-list');
  if (!container) return;

  try {
    const res = await api.get('/api/public/partners');
    if (res.success) {
      container.innerHTML = res.data.map(p => `
        <div class="partner-card">
          ${p.logo ? `<img src="${p.logo}" alt="${p.name}">` : ''}
          <h3>${p.name}</h3>
          <p>${p.description || ''}</p>
          ${p.website_url ? `<a href="${p.website_url}" target="_blank">Visit Website</a>` : ''}
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}
