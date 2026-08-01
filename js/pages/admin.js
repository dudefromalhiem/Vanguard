import { api } from '../modules/api.js';

export async function init() {
  const loginForm = document.getElementById('admin-login-form');
  const dashboard = document.getElementById('admin-dashboard');

  async function checkAdminSession() {
    try {
      // Assuming a generic profile/status endpoint for admin, or attempting to fetch a simple admin endpoint
      // We'll mock the check by seeing if fetching news with admin rights fails
      const res = await api.get('/api/admin/news');
      if (res.status === 401 || res.error) {
        showLogin();
      } else {
        showDashboard();
      }
    } catch (e) {
      showLogin();
    }
  }

  function showLogin() {
    if (loginForm) loginForm.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
  }

  function showDashboard() {
    if (loginForm) loginForm.style.display = 'none';
    if (dashboard) {
      dashboard.style.display = 'block';
      initTabs();
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;
      const errorDiv = document.getElementById('admin-login-error');
      
      if (errorDiv) errorDiv.style.display = 'none';

      const res = await api.post('/api/admin/login', { email, password });
      if (res.ok) {
        showDashboard();
      } else {
        if (errorDiv) {
          errorDiv.textContent = res.error || 'Invalid admin credentials';
          errorDiv.style.display = 'block';
        } else {
          alert(res.error || 'Invalid admin credentials');
        }
      }
    });
  }

  function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const entity = tab.dataset.entity;
        loadEntity(entity);
      });
    });
    // Load first tab
    if (tabs.length > 0) loadEntity(tabs[0].dataset.entity);
  }

  async function loadEntity(entity) {
    const contentArea = document.getElementById('admin-content');
    if (!contentArea) return;
    try {
      const res = await api.get(`/api/admin/${entity}`);
      if (res.success) {
        contentArea.innerHTML = renderTable(entity, res.data);
      } else {
        contentArea.innerHTML = `<p>Error loading ${entity}</p>`;
      }
    } catch (e) {
      contentArea.innerHTML = `<p>Error loading ${entity}</p>`;
    }
  }

  function renderTable(entity, data) {
    if (!data || data.length === 0) return `<p>No data for ${entity}</p>`;
    const keys = Object.keys(data[0]).filter(k => k !== 'id' && !k.endsWith('_hash'));
    return `
      <button onclick="window.showAddModal('${entity}')">Add ${entity}</button>
      <table>
        <thead>
          <tr>
            ${keys.map(k => `<th>${k}</th>`).join('')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${keys.map(k => `<td>${row[k]}</td>`).join('')}
              <td>
                <button onclick="window.editEntity('${entity}', '${row.id}')">Edit</button>
                <button onclick="window.deleteEntity('${entity}', '${row.id}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  window.deleteEntity = async (entity, id) => {
    if (confirm(`Delete this ${entity}?`)) {
      await api.del(`/api/admin/${entity}/${id}`);
      loadEntity(entity);
    }
  };

  // Check on load
  checkAdminSession();
}
