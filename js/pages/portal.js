import { api } from '../modules/api.js';
import { requireAuth } from '../modules/auth.js';

export async function init() {
  const auth = await requireAuth('member');
  if (!auth) return;

  const profileForm = document.getElementById('profile-form');
  const logoutBtn = document.getElementById('logout-btn');

  try {
    const res = await api.get('/api/member/profile');
    if (res.success && profileForm) {
      const data = res.data;
      if(profileForm.name) profileForm.name.value = data.name || '';
      if(profileForm.phone) profileForm.phone.value = data.phone || '';
      if(profileForm.bio) profileForm.bio.value = data.bio || '';
      if(profileForm.portfolio_url) profileForm.portfolio_url.value = data.portfolio_url || '';
    }
  } catch (e) {
    console.error(e);
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const data = Object.fromEntries(formData);
      try {
        const res = await api.put('/api/member/profile', data);
        if (res.success) alert('Profile updated');
        else alert(res.error || 'Failed to update profile');
      } catch (err) {
        alert('Error updating profile');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api.post('/api/member/logout', {});
      window.location.href = '/login.html';
    });
  }
}
