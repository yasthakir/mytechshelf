const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function redirectIfLoggedIn() {
  const token = localStorage.getItem('coderslab_token');
  if (token) {
    window.location.href = '/admin/dashboard';
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await fetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to sign in.');
    }

    localStorage.setItem('coderslab_token', result.token);
    localStorage.setItem('coderslab_user', JSON.stringify(result.user));
    window.location.href = '/admin/dashboard';
  } catch (error) {
    loginError.textContent = error.message;
  }
});

redirectIfLoggedIn();
