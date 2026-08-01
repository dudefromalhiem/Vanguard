import { api } from '../modules/api.js';

export async function init() {
  const loginSection = document.getElementById('admin-login-section');
  const loginForm = document.getElementById('admin-login-form');
  const dashboardSection = document.getElementById('admin-dashboard-section');
  const logoutBtn = document.getElementById('admin-logout-btn');

  function showLogin() {
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }

  function showDashboard() {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
      initTabs();
      initModals();
      loadAllData();
    }
  }

  // Session check on load
  async function checkAdminSession() {
    try {
      const res = await api.get('/api/admin/session');
      if (res.ok && res.data && res.data.role === 'admin') {
        showDashboard();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('admin-email');
      const passwordInput = document.getElementById('admin-password');
      const errorDiv = document.getElementById('admin-login-error');
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';
      }

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      try {
        const res = await api.post('/api/admin/login', { email, password });
        
        if (res.ok) {
          showDashboard();
        } else {
          const errMsg = res.error || 'Invalid admin credentials';
          if (errorDiv) {
            errorDiv.textContent = errMsg;
            errorDiv.style.display = 'block';
          } else {
            alert(errMsg);
          }
        }
      } catch (err) {
        const errMsg = err.message || 'Login network error';
        if (errorDiv) {
          errorDiv.textContent = errMsg;
          errorDiv.style.display = 'block';
        } else {
          alert(errMsg);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Authenticate Console';
        }
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api.post('/api/admin/logout', {});
      showLogin();
    });
  }

  // Tab switching
  function initTabs() {
    const tabItems = document.querySelectorAll('.admin-tab-btn');
    const tabPanes = document.querySelectorAll('.admin-pane');

    tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;

        tabItems.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  // Modals Controller
  function initModals() {
    const eventModal = document.getElementById('modal-event');
    const newsModal = document.getElementById('modal-news');
    const pollModal = document.getElementById('modal-poll');

    document.getElementById('btn-open-event-modal')?.addEventListener('click', () => eventModal?.classList.add('open'));
    document.getElementById('btn-open-news-modal')?.addEventListener('click', () => newsModal?.classList.add('open'));
    document.getElementById('btn-open-poll-modal')?.addEventListener('click', () => pollModal?.classList.add('open'));

    // Modal Form Submits with Picture/Video/Audio support
    document.getElementById('form-create-event')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mediaType = document.getElementById('event-media-type').value;
      const mediaUrl = document.getElementById('event-media-url').value;
      
      const body = {
        title: document.getElementById('event-title').value,
        event_date: document.getElementById('event-date').value,
        location: document.getElementById('event-location').value,
        description: document.getElementById('event-description').value,
        image_url: mediaUrl,
        media_type: mediaType,
        media_url: mediaUrl
      };

      const res = await api.post('/api/admin/events', body);
      if (res.ok) {
        alert('Event created successfully!');
        window.closeModals();
        loadEvents();
      } else {
        alert('Failed to create event: ' + (res.error || 'Unknown error'));
      }
    });

    document.getElementById('form-publish-news')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mediaType = document.getElementById('news-media-type').value;
      const mediaUrl = document.getElementById('news-media-url').value;

      const body = {
        title: document.getElementById('news-title').value,
        author: document.getElementById('news-author').value,
        category: document.getElementById('news-category').value,
        body: document.getElementById('news-body').value,
        image_url: mediaUrl,
        media_type: mediaType,
        media_url: mediaUrl
      };

      const res = await api.post('/api/admin/news', body);
      if (res.ok) {
        alert('Article published successfully!');
        window.closeModals();
        loadNews();
      } else {
        alert('Failed to publish news: ' + (res.error || 'Unknown error'));
      }
    });

    document.getElementById('form-create-poll')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawOptions = document.getElementById('poll-options').value;
      const optionsArr = rawOptions.split(',').map(s => s.trim()).filter(Boolean);
      const durationHours = document.getElementById('poll-duration')?.value || '24';
      const mediaUrlInput = document.getElementById('poll-media-url')?.value || '';
      const fileInput = document.getElementById('poll-file');

      let finalImageUrl = mediaUrlInput;

      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        finalImageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.onerror = () => resolve(mediaUrlInput);
          reader.readAsDataURL(file);
        });
      }

      const body = {
        title: document.getElementById('poll-question').value,
        options: optionsArr,
        duration_hours: durationHours,
        image_url: finalImageUrl
      };

      const res = await api.post('/api/admin/polls', body);
      if (res.ok) {
        alert('Poll created successfully!');
        window.closeModals();
        loadPolls();
      } else {
        alert('Failed to create poll: ' + (res.error || 'Unknown error'));
      }
    });
  }

  window.closeModals = () => {
    document.querySelectorAll('.admin-modal-overlay').forEach(m => m.classList.remove('open'));
  };

  // Data Loading & Table Rendering
  function loadAllData() {
    loadApplications();
    loadMembers();
    loadEvents();
    loadNews();
    loadPolls();
  }

  window.refreshApplications = loadApplications;
  window.refreshMembers = loadMembers;

  async function loadApplications() {
    const tbody = document.getElementById('applications-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Loading pending applications...</td></tr>';

    const res = await api.get('/api/admin/membership?status=pending');
    const items = extractArray(res);
    
    document.getElementById('stat-pending-count').textContent = items.length;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No pending applications found</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(app => `
      <tr>
        <td><strong>${escapeHtml(app.name)}</strong></td>
        <td>${escapeHtml(app.email)}</td>
        <td>${escapeHtml(app.usn || 'N/A')} (${escapeHtml(app.branch || 'N/A')})</td>
        <td><span class="badge badge-active">${escapeHtml(app.preferred_wing || 'General')}</span></td>
        <td>${new Date(app.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn-admin-gold" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; margin-right: 0.375rem;" onclick="window.approveApp('${app.id}')">Approve</button>
          <button class="btn-admin-outline" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;" onclick="window.rejectApp('${app.id}')">Reject</button>
        </td>
      </tr>
    `).join('');
  }

  async function loadMembers() {
    const tbody = document.getElementById('members-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading member directory...</td></tr>';

    const res = await api.get('/api/admin/membership?type=members');
    const items = extractArray(res);

    document.getElementById('stat-members-count').textContent = items.length;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No active members found</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(m => `
      <tr>
        <td><strong>${escapeHtml(m.name || 'N/A')}</strong></td>
        <td>${escapeHtml(m.email || 'N/A')}</td>
        <td><span class="badge badge-approved">${escapeHtml(m.role || 'member')}</span></td>
        <td>${new Date(m.created_at || Date.now()).toLocaleDateString()}</td>
        <td>
          <button class="btn-admin-outline" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;" onclick="window.removeMember('${m.id}')">Remove</button>
        </td>
      </tr>
    `).join('');
  }

  async function loadEvents() {
    const tbody = document.getElementById('events-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading events...</td></tr>';

    const res = await api.get('/api/admin/events');
    const items = extractArray(res);

    document.getElementById('stat-events-count').textContent = items.length;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No events scheduled</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(e => `
      <tr>
        <td><strong>${escapeHtml(e.title)}</strong></td>
        <td>${new Date(e.event_date || e.created_at).toLocaleDateString()}</td>
        <td>${escapeHtml(e.location || 'Online')}</td>
        <td><span class="badge badge-active">${escapeHtml(e.media_type || 'image')}</span> ${e.media_url ? `<a href="${escapeHtml(e.media_url)}" target="_blank" style="color: var(--admin-gold); text-decoration: underline;">View</a>` : 'None'}</td>
        <td>
          <button class="btn-admin-outline" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; color: #ef4444;" onclick="window.deleteItem('events', '${e.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async function loadNews() {
    const tbody = document.getElementById('news-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading articles...</td></tr>';

    const res = await api.get('/api/admin/news');
    const items = extractArray(res);

    document.getElementById('stat-news-count').textContent = items.length;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No news articles published</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(n => `
      <tr>
        <td><strong>${escapeHtml(n.title)}</strong></td>
        <td>${escapeHtml(n.author || 'Editorial')}</td>
        <td><span class="badge badge-pending">${escapeHtml(n.category || 'General')}</span></td>
        <td><span class="badge badge-active">${escapeHtml(n.media_type || 'image')}</span> ${n.media_url || n.image_url ? `<a href="${escapeHtml(n.media_url || n.image_url)}" target="_blank" style="color: var(--admin-gold); text-decoration: underline;">View</a>` : 'None'}</td>
        <td>
          <button class="btn-admin-outline" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; color: #ef4444;" onclick="window.deleteItem('news', '${n.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async function loadPolls() {
    const officialTbody = document.getElementById('official-polls-table-body');
    const communityTbody = document.getElementById('community-polls-table-body');
    
    if (officialTbody) officialTbody.innerHTML = '<tr><td colspan="5">Loading official polls...</td></tr>';
    if (communityTbody) communityTbody.innerHTML = '<tr><td colspan="5">Loading community polls...</td></tr>';

    const res = await api.get('/api/admin/polls');
    const items = extractArray(res);

    const officialItems = items.filter(p => p.tags && p.tags.includes('official'));
    const communityItems = items.filter(p => !p.tags || !p.tags.includes('official'));

    renderAdminPollTable(officialTbody, officialItems, 'No official society polls created');
    renderAdminPollTable(communityTbody, communityItems, 'No community polls created');
  }

  function renderAdminPollTable(tbody, items, emptyText) {
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">${emptyText}</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(p => {
      const optionCount = Array.isArray(p.poll_options) ? p.poll_options.length : (Array.isArray(p.options) ? p.options.length : 'Multiple');
      return `
        <tr>
          <td><strong>${escapeHtml(p.title)}</strong></td>
          <td><span class="badge ${p.status === 'Active' ? 'badge-approved' : 'badge-rejected'}">${escapeHtml(p.status || 'Active')}</span></td>
          <td>${optionCount} Options</td>
          <td>${p.image_url ? `<a href="${escapeHtml(p.image_url)}" target="_blank" style="color: var(--admin-gold); text-decoration: underline;">View Attachment</a>` : '<span style="color:var(--admin-text-muted);">None</span>'}</td>
          <td>
            <button class="btn-admin-gold" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; margin-right: 0.375rem;" onclick="window.postponePoll('${p.id}')">+ Extend 24h</button>
            <button class="btn-admin-outline" style="padding: 0.25rem 0.625rem; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;" onclick="window.deleteItem('polls', '${p.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Global Actions
  window.postponePoll = async (id) => {
    if (confirm('Extend this poll by 24 hours and keep it active?')) {
      const res = await api.post('/api/admin/polls', { action: 'postpone', id, extension_hours: 24 });
      if (res.ok) {
        alert('Poll extended by 24 hours!');
        loadPolls();
      } else {
        alert('Failed to extend poll: ' + (res.error || 'Unknown error'));
      }
    }
  };
  window.approveApp = async (id) => {
    if (confirm('Approve this membership application?')) {
      const res = await api.post('/api/admin/membership', { action: 'approve', id });
      if (res.ok) {
        alert('Application approved!');
        loadApplications();
        loadMembers();
      } else {
        alert('Failed to approve application: ' + (res.error || 'Unknown error'));
      }
    }
  };

  window.rejectApp = async (id) => {
    if (confirm('Reject this application?')) {
      const res = await api.post('/api/admin/membership', { action: 'reject', id });
      if (res.ok) {
        alert('Application rejected');
        loadApplications();
      } else {
        alert('Failed to reject application');
      }
    }
  };

  window.removeMember = async (id) => {
    if (confirm('Remove this member from directory?')) {
      const res = await api.del(`/api/admin/membership/${id}`);
      if (res.ok) loadMembers();
    }
  };

  window.deleteItem = async (entity, id) => {
    if (confirm(`Delete this item from ${entity}?`)) {
      const res = await api.del(`/api/admin/${entity}?id=${id}`);
      if (res.ok) {
        loadAllData();
      } else {
        alert('Failed to delete item: ' + (res.error || 'Unknown error'));
      }
    }
  };

  // Utilities
  function extractArray(res) {
    if (!res || !res.ok) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  // Initial check
  checkAdminSession();
}
