import { api } from './api.js';
import { showToast } from './notifications.js';

export function validateForm(form) {
  let valid = true;
  form.querySelectorAll('.form-error').forEach(el => el.remove());
  form.querySelectorAll('[required]').forEach(input => {
    if (!input.value.trim()) {
      valid = false;
      showFieldError(input, 'This field is required');
    }
  });
  form.querySelectorAll('[type="email"]').forEach(input => {
    if (input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      valid = false;
      showFieldError(input, 'Please enter a valid email');
    }
  });
  form.querySelectorAll('[minlength]').forEach(input => {
    const min = parseInt(input.getAttribute('minlength'));
    if (input.value && input.value.length < min) {
      valid = false;
      showFieldError(input, `Must be at least ${min} characters`);
    }
  });
  return valid;
}

function showFieldError(input, message) {
  const existing = input.parentElement.querySelector('.form-error');
  if (existing) existing.remove();
  const err = document.createElement('div');
  err.className = 'form-error';
  err.textContent = message;
  input.parentElement.appendChild(err);
  input.classList.add('error');
  input.addEventListener('input', () => { err.remove(); input.classList.remove('error'); }, { once: true });
}

export async function handleSubmit(form, apiPath, method = 'POST', onSuccess) {
  if (!validateForm(form)) return;
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn?.textContent;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = method === 'POST' ? await api.post(apiPath, data)
              : method === 'PUT' ? await api.put(apiPath, data)
              : await api.del(apiPath);
    if (res.ok) {
      showToast('Saved successfully!', 'success');
      if (onSuccess) onSuccess(res.data);
    } else {
      showToast(res.error || 'Something went wrong', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
  }
}

export function initFileUpload(input, onUpload) {
  if (!input) return;
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    if (onUpload) onUpload(file);
  });
}
