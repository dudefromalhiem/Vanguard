import { api } from '../modules/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';
    
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      // First try to login via the member API which checks the members table
      const response = await api.post('/api/member/login', { email, password });
      
      if (response.ok) {
        // The API returns the user object, containing the role
        const role = response.data.role;
        if (role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/dashboard.html';
        }
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Authenticate';
    }
  });
});
