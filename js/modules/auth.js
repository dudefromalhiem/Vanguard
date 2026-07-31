import { api } from './api.js';

let currentUser = null;

export async function checkSession() {
  if (currentUser) return currentUser;
  try {
    const res = await api.get('/api/member/session');
    if (res.ok && res.data) {
      currentUser = res.data;
      sessionStorage.setItem('vanguardSession', JSON.stringify(res.data));
      return res.data;
    }
  } catch {}
  
  const cached = sessionStorage.getItem('vanguardSession');
  if (cached) {
    currentUser = JSON.parse(cached);
    return currentUser;
  }
  return null;
}

export function getUser() { return currentUser; }
export function isAdmin() { return currentUser?.role === 'admin'; }
export function isMember() { return !!currentUser; }

export async function logout() {
  await api.post('/api/member/logout');
  currentUser = null;
  sessionStorage.removeItem('vanguardSession');
  window.location.href = '/login.html';
}

export async function requireAuth(allowedRoles = [], redirectUrl = '/login.html') {
  const session = await checkSession();
  if (!session || (allowedRoles.length > 0 && !allowedRoles.includes(session.role))) {
    window.location.href = redirectUrl;
    return null;
  }
  return session;
}

export async function initAuthUI() {
  const session = await checkSession();
  const joinBtnDesktop = document.getElementById('join-btn-desktop');
  const desktopNavLinks = document.querySelector('.nav-links');
  const mobileDrawer = document.getElementById('mobile-drawer');

  if (session) {
    const linkUrl = session.role === 'admin' ? '/admin.html' : '/dashboard.html';
    const linkText = session.role === 'admin' ? 'Admin' : 'Portal';

    if (joinBtnDesktop) {
      joinBtnDesktop.href = linkUrl;
      joinBtnDesktop.textContent = linkText;
      joinBtnDesktop.style.display = 'inline-flex';
    }

    if (desktopNavLinks) {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" class="nav-link" id="logout-btn">Logout</a>`;
      desktopNavLinks.appendChild(li);
    }
    
    if (mobileDrawer) {
      const btnContainer = mobileDrawer.querySelector('div:last-child');
      if (btnContainer) {
        btnContainer.innerHTML = `<a href="${linkUrl}" class="btn btn-primary" style="width:100%;text-align:center;margin-bottom:0.5rem;">${linkText}</a>
                                  <button id="mobile-logout-btn" class="btn btn-secondary" style="width:100%;text-align:center;margin-bottom:1rem;">Logout</button>`;
        document.getElementById('mobile-logout-btn')?.addEventListener('click', logout);
      }
    }
    
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    if (joinBtnDesktop) {
      joinBtnDesktop.href = '/login.html';
      joinBtnDesktop.textContent = 'Login';
      joinBtnDesktop.style.display = 'inline-flex';
    }
  }
}
