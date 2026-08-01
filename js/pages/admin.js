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
        console.log('Submitting admin login for:', email);
        const res = await api.post('/api/admin/login', { email, password });
        console.log('Admin login response:', res);
        
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
        console.error('Admin login catch error:', err);
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
          submitBtn.textContent = 'Log In';
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
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

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

  // Load Data for Dashboard Tables
  async function loadAllData() {
    loadMembers();
    loadEvents();
    loadApplications();
  }

  async function loadMembers() {
    const tbody = document.getElementById('members-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading members...</td></tr>';
    
    const res = await api.get('/api/admin/membership');
    const items = res.ok && res.data ? (Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])) : [];
    
    if (res.ok) {
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No active members found</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(m => `
        <tr>
          <td>${m.name || 'N/A'}</td>
          <td>${m.email || 'N/A'}</td>
          <td><span style="color: green; font-weight: 600;">${m.role || 'member'}</span></td>
          <td>
            <button class="btn-sm btn-danger" onclick="window.removeMember('${m.id}')">Remove</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4">Failed to load members</td></tr>';
    }
  }

  async function loadEvents() {
    const tbody = document.getElementById('events-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading events...</td></tr>';

    const res = await api.get('/api/admin/events');
    const items = res.ok && res.data ? (Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])) : [];

    if (res.ok) {
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No events created yet</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(e => `
        <tr>
          <td>${e.title}</td>
          <td>${new Date(e.date || e.created_at).toLocaleDateString()}</td>
          <td>${e.location || 'Online'}</td>
          <td>
            <button class="btn-sm btn-danger" onclick="window.deleteEvent('${e.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4">Failed to load events</td></tr>';
    }
  }

  async function loadApplications() {
    const tbody = document.getElementById('applications-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading applications...</td></tr>';

    const res = await api.get('/api/admin/membership?status=pending');
    const items = res.ok && res.data ? (Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])) : [];

    if (res.ok) {
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No pending applications</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(app => `
        <tr>
          <td>${app.name}</td>
          <td>${app.email}</td>
          <td>${new Date(app.created_at).toLocaleDateString()}</td>
          <td>
            <button class="btn-sm btn-success" style="margin-right: 0.5rem; background: #166534; color: #fff; border: none; padding: 0.25rem 0.5rem; cursor: pointer;" onclick="window.approveApplication('${app.id}')">Approve</button>
            <button class="btn-sm btn-danger" style="background: #991b1b; color: #fff; border: none; padding: 0.25rem 0.5rem; cursor: pointer;" onclick="window.rejectApplication('${app.id}')">Reject</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4">No pending applications found</td></tr>';
    }
  }

  // Global actions for inline buttons
  window.approveApplication = async (id) => {
    if (confirm('Approve this membership application?')) {
      const res = await api.post('/api/admin/membership', { action: 'approve', applicationId: id });
      if (res.ok) {
        alert('Application approved!');
        loadAllData();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    }
  };

  window.rejectApplication = async (id) => {
    if (confirm('Reject this application?')) {
      const res = await api.post('/api/admin/membership', { action: 'reject', applicationId: id });
      if (res.ok) {
        alert('Application rejected');
        loadAllData();
      } else {
        alert('Failed to reject application');
      }
    }
  };

  window.removeMember = async (id) => {
    if (confirm('Remove this member?')) {
      const res = await api.del(`/api/admin/membership/${id}`);
      if (res.ok) loadMembers();
    }
  };

  window.deleteEvent = async (id) => {
    if (confirm('Delete this event?')) {
      const res = await api.del(`/api/admin/events/${id}`);
      if (res.ok) loadEvents();
    }
  };

  // Run initial session check
  checkAdminSession();
}
