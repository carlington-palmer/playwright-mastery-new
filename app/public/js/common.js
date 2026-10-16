// Shared browser helpers
window.api = async function (method, url, body) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  let data = null;
  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    try { data = await res.json(); } catch (e) { data = null; }
  }
  if (res.status === 401 && !url.startsWith('/api/auth/')) {
    window.location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search);
  }
  return { ok: res.ok, status: res.status, data };
};

window.showToast = function (message) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.hidden = false;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function () { t.hidden = true; }, 4000);
};

// Messages carried across a redirect
window.flash = function (message) {
  try { sessionStorage.setItem('taskly.flash', message); } catch (e) {}
};
(function () {
  let msg = null;
  try { msg = sessionStorage.getItem('taskly.flash'); sessionStorage.removeItem('taskly.flash'); } catch (e) {}
  if (msg) window.addEventListener('DOMContentLoaded', function () { window.showToast(msg); });
})();

window.setError = function (id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
};

window.formatDate = function (iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
};

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', async function () {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      try { localStorage.removeItem('taskly.user'); } catch (e) {}
      window.flash('You have been logged out');
      window.location.href = '/login';
    });
  }
});
