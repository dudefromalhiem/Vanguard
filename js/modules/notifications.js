import { api } from './api.js';

let readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
let pollInterval = null;

export function initNotifications() {
  fetchNotifications();
  pollInterval = setInterval(fetchNotifications, 60000);

  const bell = document.getElementById('notification-bell');
  const panel = document.getElementById('notification-panel');
  if (bell && panel) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', () => panel.classList.remove('open'));
  }
}

async function fetchNotifications() {
  const res = await api.get('/api/public/notifications');
  if (!res.ok) return;
  const notifications = res.data || [];
  const unread = notifications.filter(n => !readIds.includes(n.id));
  const badge = document.getElementById('notification-count');
  if (badge) {
    badge.textContent = unread.length > 0 ? unread.length : '';
    badge.style.display = unread.length > 0 ? 'flex' : 'none';
  }
  const panel = document.getElementById('notification-panel');
  if (panel) {
    panel.innerHTML = notifications.length === 0
      ? '<p class="empty-state">No notifications</p>'
      : notifications.map(n => `
        <div class="notification-item ${readIds.includes(n.id) ? 'read' : 'unread'}" data-id="${n.id}">
          <div class="notification-title">${n.title}</div>
          <div class="notification-message">${n.message || ''}</div>
          <div class="notification-time">${new Date(n.created_at).toLocaleDateString()}</div>
        </div>
      `).join('');
    panel.querySelectorAll('.notification-item.unread').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        readIds.push(id);
        localStorage.setItem('readNotifications', JSON.stringify(readIds));
        item.classList.replace('unread', 'read');
        const cnt = document.getElementById('notification-count');
        const remaining = parseInt(cnt?.textContent || '0') - 1;
        if (cnt) { cnt.textContent = remaining > 0 ? remaining : ''; cnt.style.display = remaining > 0 ? 'flex' : 'none'; }
      });
    });
  }
}

export function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
