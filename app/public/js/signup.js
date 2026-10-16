(function () {
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    ['err-username', 'err-password', 'signup-error'].forEach(function (id) { setError(id, ''); });
    const body = {
      username: form.username.value.trim(),
      displayName: form.displayName.value.trim(),
      password: form.password.value,
    };
    const res = await api('POST', '/api/users', body);
    if (res.status === 400 && res.data && res.data.errors) {
      setError('err-username', res.data.errors.username);
      setError('err-password', res.data.errors.password);
      return;
    }
    if (!res.ok) return setError('signup-error', (res.data && res.data.error) || 'Sign up failed');
    const login = await api('POST', '/api/auth/login', { username: body.username, password: body.password });
    if (!login.ok) return setError('signup-error', 'Account created, but login failed');
    flash('Account created. Welcome to Taskly!');
    window.location.href = '/dashboard';
  });
})();
