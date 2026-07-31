import { api } from '../modules/api.js';
import { requireAuth } from '../modules/auth.js';

export async function init() {
  const auth = await requireAuth('member', '/membership.html');
  if (!auth) return;

  const statsContainer = document.getElementById('dashboard-stats');
  const eventsContainer = document.getElementById('dashboard-events');
  const pollsContainer = document.getElementById('dashboard-polls');

  try {
    const res = await api.get('/api/member/dashboard');
    if (res.success) {
      const { registrations, notifications, polls } = res.data;

      if (statsContainer) {
        statsContainer.innerHTML = `
          <p>You have ${registrations.length} event registrations.</p>
          <p>You have ${notifications.length} recent notifications.</p>
        `;
      }

      if (eventsContainer) {
        eventsContainer.innerHTML = registrations.map(r => `
          <li>${r.events?.title || 'Unknown Event'} - Ticket: ${r.ticket_code}</li>
        `).join('');
      }

      if (pollsContainer) {
        pollsContainer.innerHTML = polls.map(p => `
          <li>${p.question} (Active)</li>
        `).join('');
      }
    }
  } catch (e) {
    console.error(e);
  }
}
