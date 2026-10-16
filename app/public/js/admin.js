(function () {
  const tbody = document.getElementById('users-body');
  const me = document.querySelector('[data-testid="current-user"]');
  async function load() {
    const res = await api('GET', '/api/admin/users');
    tbody.innerHTML = '';
    if (!res.ok) return;
    res.data.forEach(function (u) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-testid', 'user-row');
      const cells = [u.username, u.displayName, u.role, u.locked ? 'Locked' : 'Active'].map(function (v) {
        const td = document.createElement('td'); td.textContent = v; return td;
      });
      const act = document.createElement('td');
      if (u.role !== 'admin') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-link';
        btn.textContent = u.locked ? 'Unlock' : 'Lock';
        btn.setAttribute('aria-label', (u.locked ? 'Unlock ' : 'Lock ') + u.username);
        btn.addEventListener('click', async function () {
          const r = await api('PATCH', '/api/admin/users/' + encodeURIComponent(u.username), { locked: !u.locked });
          if (r.ok) { showToast(u.username + (r.data.locked ? ' locked' : ' unlocked')); load(); }
        });
        act.appendChild(btn);
      }
      tr.append.apply(tr, cells.concat([act]));
      tbody.appendChild(tr);
    });
  }
  load();
})();
