(function () {
  // Tabs
  const tabs = Array.from(document.querySelectorAll('[role=tab]'));
  function select(tab) {
    tabs.forEach(function (t) {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length]);
      if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length]);
    });
  });

  // Profile
  const profile = document.getElementById('profile-form');
  profile.addEventListener('submit', async function (e) {
    e.preventDefault();
    setError('err-displayName', '');
    const res = await api('PATCH', '/api/me', { displayName: profile.displayName.value });
    if (res.status === 400 && res.data && res.data.errors) return setError('err-displayName', res.data.errors.displayName);
    if (!res.ok) return showToast('Could not save profile');
    const name = document.querySelector('[data-testid="current-user"]');
    if (name) name.textContent = res.data.displayName;
    showToast('Profile updated');
  });

  // Theme (localStorage)
  const theme = document.getElementById('theme');
  let current = 'light';
  try { current = localStorage.getItem('taskly.theme') || 'light'; } catch (e) {}
  theme.value = current;
  theme.addEventListener('change', function () {
    try { localStorage.setItem('taskly.theme', theme.value); } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme.value);
    showToast('Theme saved');
  });

  // Delete account modal
  const username = document.body.getAttribute('data-username');
  const modal = document.getElementById('delete-modal');
  const confirmInput = document.getElementById('confirm-username');
  const confirmBtn = document.getElementById('confirm-delete');
  function open() {
    confirmInput.value = '';
    confirmBtn.disabled = true;
    setError('delete-error', '');
    modal.hidden = false;
    confirmInput.focus();
  }
  function close() { modal.hidden = true; document.getElementById('open-delete-modal').focus(); }
  document.getElementById('open-delete-modal').addEventListener('click', open);
  document.getElementById('cancel-delete').addEventListener('click', close);
  modal.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  confirmInput.addEventListener('input', function () { confirmBtn.disabled = confirmInput.value !== username; });
  confirmBtn.addEventListener('click', async function () {
    const res = await api('DELETE', '/api/users/' + encodeURIComponent(username));
    if (!res.ok) return setError('delete-error', (res.data && res.data.error) || 'Could not delete account');
    try { localStorage.removeItem('taskly.user'); } catch (e) {}
    window.location.href = '/login?deleted=1';
  });
})();
