document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.querySelector('.admin-menu-toggle');
  const nav = document.querySelector('.admin-nav');

  if (!toggleButton || !nav) return;

  const closeNav = () => {
    nav.classList.remove('open');
    toggleButton.classList.remove('open');
    toggleButton.setAttribute('aria-expanded', 'false');
  };

  toggleButton.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('open');
    nav.classList.toggle('open', willOpen);
    toggleButton.classList.toggle('open', willOpen);
    toggleButton.setAttribute('aria-expanded', String(willOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', (event) => {
    const clickedInsideNav = nav.contains(event.target);
    const clickedToggle = toggleButton.contains(event.target);
    if (!clickedInsideNav && !clickedToggle && nav.classList.contains('open')) {
      closeNav();
    }
  });
});
