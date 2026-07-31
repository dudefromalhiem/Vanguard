export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  trapFocus(modal);
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

export function confirm(message) {
  return new Promise((resolve) => {
    let dialog = document.getElementById('confirm-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'confirm-dialog';
      dialog.className = 'modal';
      dialog.innerHTML = `<div class="modal-overlay"><div class="modal-content">
        <div class="modal-header"><h3>Confirm</h3></div>
        <div class="modal-body"><p id="confirm-message"></p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="btn btn-primary" id="confirm-ok">Confirm</button>
        </div></div></div>`;
      document.body.appendChild(dialog);
    }
    document.getElementById('confirm-message').textContent = message;
    dialog.classList.add('active');
    document.body.style.overflow = 'hidden';

    const cleanup = (result) => {
      dialog.classList.remove('active');
      document.body.style.overflow = '';
      resolve(result);
    };
    document.getElementById('confirm-ok').onclick = () => cleanup(true);
    document.getElementById('confirm-cancel').onclick = () => cleanup(false);
  });
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  focusable[0].focus();
}

// Global event listeners
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const modal = e.target.closest('.modal');
    if (modal) closeModal(modal.id);
  }
  if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
    const modal = e.target.closest('.modal');
    if (modal) closeModal(modal.id);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const active = document.querySelector('.modal.active');
    if (active) closeModal(active.id);
  }
});
