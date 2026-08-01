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

  // Active link matching supporting clean URLs
  const pathParts = window.location.pathname.split('/');
  let rawFilename = pathParts[pathParts.length - 1] || 'index.html';
  if (!rawFilename) rawFilename = 'index.html';
  const currentKey = rawFilename.replace(/\.html$/, '');

  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    let href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('./')) href = href.substring(2);
    const linkKey = href.replace(/\.html$/, '');
    
    if (currentKey === linkKey || (linkKey === 'index' && currentKey === '')) {
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
      if (notificationPanel) notificationPanel.classList.remove('open');
      if (profileDropdown) profileDropdown.classList.remove('open');
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

  // Notification panel
  const notificationTrigger = document.getElementById('notification-trigger');
  const notificationPanel = document.getElementById('notification-panel');
  if (notificationTrigger && notificationPanel) {
    notificationTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationPanel.classList.toggle('open');
      if (moreDropdown) moreDropdown.classList.remove('open');
      if (profileDropdown) profileDropdown.classList.remove('open');
    });
    document.addEventListener('click', () => notificationPanel.classList.remove('open'));
  }

  // Profile dropdown
  const profileBtn = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown-menu');
  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('open');
      if (moreDropdown) moreDropdown.classList.remove('open');
      if (notificationPanel) notificationPanel.classList.remove('open');
    });
    document.addEventListener('click', () => profileDropdown.classList.remove('open'));
  }
}
