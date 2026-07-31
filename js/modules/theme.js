export function initTheme() {
  const saved = localStorage.getItem('theme');
  const theme = saved || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateToggleIcon(theme);

  document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-toggle')) toggleTheme();
  });
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateToggleIcon(next);
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function updateToggleIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const sunIcon = btn.querySelector('.icon-sun');
  const moonIcon = btn.querySelector('.icon-moon');
  if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
  if (moonIcon) moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
}
