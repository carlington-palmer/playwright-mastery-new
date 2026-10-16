(async function () {
  const stats = await api('GET', '/api/stats');
  const set = function (id, v) { document.querySelector('[data-testid="' + id + '"] .stat-value').textContent = v; };
  if (stats.ok) {
    set('stat-total', stats.data.total);
    set('stat-todo', stats.data.todo);
    set('stat-in-progress', stats.data.in_progress);
    set('stat-done', stats.data.done);
  } else {
    ['stat-total', 'stat-todo', 'stat-in-progress', 'stat-done'].forEach(function (id) { set(id, '!'); });
  }
  const list = document.getElementById('recent-tasks');
  const recent = await api('GET', '/api/tasks?sort=newest&limit=5');
  list.innerHTML = '';
  if (!recent.ok) {
    const li = document.createElement('li');
    li.className = 'error-text';
    li.setAttribute('role', 'alert');
    li.textContent = 'Could not load recent tasks';
    list.appendChild(li);
    return;
  }
  if (!recent.data.items.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No tasks yet';
    list.appendChild(li);
    return;
  }
  recent.data.items.forEach(function (t) {
    const li = document.createElement('li');
    li.textContent = t.title;
    list.appendChild(li);
  });
})();
