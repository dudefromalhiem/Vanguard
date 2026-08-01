import { api } from '../modules/api.js';

export function init() {
  const applicationForm = document.getElementById('membership-form') || document.getElementById('application-form');
  const statusForm = document.getElementById('status-form');
  const statusResult = document.getElementById('status-result');

  if (applicationForm) {
    applicationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(applicationForm);
      const data = Object.fromEntries(formData);
      
      if (data.password && data['confirm-password'] && data.password !== data['confirm-password']) {
        alert('Passwords do not match');
        return;
      }

      try {
        const response = await api.post('/api/member/register', data);
        if (response.ok || response.success) {
          alert('Application submitted successfully! Your membership status is pending admin approval.');
          applicationForm.reset();
        } else {
          alert(response.error || 'Failed to submit application');
        }
      } catch (err) {
        alert('An error occurred while submitting your application.');
      }
    });
  }

  if (statusForm) {
    statusForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('status-email').value;
      
      try {
        const response = await api.post('/api/member/status', { email });
        if (response.success) {
          const { status, applied_at, reviewed_at } = response.data;
          statusResult.innerHTML = `
            <p>Status: <strong>${status}</strong></p>
            <p>Applied on: ${new Date(applied_at).toLocaleDateString()}</p>
            ${reviewed_at ? `<p>Reviewed on: ${new Date(reviewed_at).toLocaleDateString()}</p>` : ''}
          `;
        } else {
          statusResult.innerHTML = `<p class="error">${response.error || 'Application not found'}</p>`;
        }
      } catch (err) {
        statusResult.innerHTML = '<p class="error">An error occurred</p>';
      }
    });
  }
}
