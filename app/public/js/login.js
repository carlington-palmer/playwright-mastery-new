(function () {
  const form = document.getElementById('login-form');
  const params = new URLSearchParams(location.search);
  const notice = document.getElementById('login-notice');
  if (params.get('next')) { notice.textContent = 'Please log in to continue'; notice.hidden = false; }
  if (params.get('deleted')) { notice.textContent = 'Your account has been deleted'; notice.hidden = false; }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setError('login-error', '');
    const username = form.username.value.trim();
    const password = form.password.value;
    if (!username) return setError('login-error', 'Username is required');
    if (!password) return setError('login-error', 'Password is required');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const res = await api('POST', '/api/auth/login', { username, password });
    btn.disabled = false;
    if (!res.ok) return setError('login-error', (res.data && res.data.error) || 'Login failed');
    try { localStorage.setItem('taskly.user', JSON.stringify({ username: res.data.user.username, role: res.data.user.role })); } catch (err) {}
    const next = params.get('next');
    window.location.href = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  });
})();
