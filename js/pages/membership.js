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
      const emailInput = document.getElementById('status-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;
      
      if (statusResult) statusResult.innerHTML = '<p style="color:var(--text-secondary);">Checking status...</p>';

      try {
        const response = await api.post('/api/member/status', { email });
        if (response.ok || response.success) {
          const data = response.data || response;
          const status = data.status || 'pending';
          const isApproved = status === 'approved' || status === 'accepted';
          const isRejected = status === 'rejected';
          const statusColor = isApproved ? '#166534' : (isRejected ? '#ef4444' : 'var(--accent-color)');
          
          statusResult.innerHTML = `
            <div class="card" style="padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-color);">
              <h4 style="margin-bottom: 0.5rem;">Application Status</h4>
              <p style="margin-bottom: 0.5rem;">Status: <strong style="color:${statusColor}; text-transform: uppercase;">${status}</strong></p>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">Submitted: ${new Date(data.applied_at || Date.now()).toLocaleDateString()}</p>
              ${data.reviewed_at ? `<p style="font-size: 0.875rem; color: var(--text-secondary);">Reviewed: ${new Date(data.reviewed_at).toLocaleDateString()}</p>` : ''}
              ${isApproved ? '<p style="margin-top:0.75rem; color:#166534; font-weight:600;">🎉 Your application is approved! You can now <a href="/login.html" style="color:var(--accent-color); text-decoration:underline;">login</a> to access your member account.</p>' : ''}
            </div>
          `;
        } else {
          statusResult.innerHTML = `<p style="color:#ef4444; font-weight:500;">${response.error || 'No application found for this email address.'}</p>`;
        }
      } catch (err) {
        statusResult.innerHTML = '<p style="color:#ef4444;">An error occurred while checking application status.</p>';
      }
    });
  }
}
