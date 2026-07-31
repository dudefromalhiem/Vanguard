export function initNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.drawer-overlay');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      drawer.classList.toggle('open');
      hamburger.classList.toggle('active');
      document.body.classList.toggle('drawer-open');
    });

    if (overlay) overlay.addEventListener('click', closeDrawer);
    
    const closeBtn = document.getElementById('close-drawer');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (hamburger) hamburger.classList.remove('active');
    document.body.classList.remove('drawer-open');
  }

  // Active link
  const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (path.endsWith(href) || (href === '/' && (path === '' || path === '/index.html')))) {
      link.classList.add('active');
    }
  });

  // More dropdown
  const moreBtn = document.querySelector('.nav-more-btn');
  const moreDropdown = document.querySelector('.nav-more-dropdown');
  if (moreBtn && moreDropdown) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => moreDropdown.classList.remove('open'));
  }

  // Sticky header
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('sticky', window.scrollY > 50);
    });
  }
}
