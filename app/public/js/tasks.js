(function () {
  const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
  const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };
  const form = document.getElementById('filters');
  const table = document.getElementById('tasks-table');
  const tbody = document.getElementById('tasks-body');
  const stateBox = document.getElementById('tasks-state');
  const count = document.getElementById('result-count');
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    status: params.get('status') || '',
    sort: params.get('sort') || 'newest',
    page: parseInt(params.get('page'), 10) || 1,
  };
  form.q.value = state.q;
  form.status.value = state.status;
  form.sort.value = state.sort;

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.status) p.set('status', state.status);
    if (state.sort !== 'newest') p.set('sort', state.sort);
    if (state.page > 1) p.set('page', state.page);
    const qs = p.toString();
    history.replaceState(null, '', '/tasks' + (qs ? '?' + qs : ''));
  }

  function showState(kind, text) {
    stateBox.innerHTML = '';
    if (!kind) return;
    const p = document.createElement('p');
    if (kind === 'loading') { p.setAttribute('role', 'status'); p.className = 'muted'; }
    if (kind === 'empty') { p.className = 'muted'; }
    if (kind === 'error') { p.setAttribute('role', 'alert'); p.className = 'error-banner'; }
    p.textContent = text;
    stateBox.appendChild(p);
    if (kind === 'error') {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'btn';
      retry.textContent = 'Retry';
      retry.addEventListener('click', load);
      stateBox.appendChild(retry);
    }
  }

  async function load() {
    syncUrl();
    showState('loading', 'Loading tasks…');
    table.hidden = true;
    count.textContent = '';
    const p = new URLSearchParams({ sort: state.sort, page: state.page, limit: 5 });
    if (state.q) p.set('q', state.q);
    if (state.status) p.set('status', state.status);
    const res = await api('GET', '/api/tasks?' + p.toString());
    if (!res.ok || !res.data || !Array.isArray(res.data.items)) {
      showState('error', 'Could not load tasks. Please try again.');
      prev.disabled = true; next.disabled = true; pageInfo.textContent = '';
      return;
    }
    const d = res.data;
    state.page = d.page;
    count.textContent = d.total === 1 ? '1 task' : d.total + ' tasks';
    pageInfo.textContent = 'Page ' + d.page + ' of ' + d.pages;
    prev.disabled = d.page <= 1;
    next.disabled = d.page >= d.pages;
    if (!d.items.length) {
      showState('empty', 'No tasks found');
      return;
    }
    showState(null);
    tbody.innerHTML = '';
    d.items.forEach(function (t) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-testid', 'task-row');
      const title = document.createElement('td');
      title.textContent = t.title;
      if (t.urgent) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-urgent';
        badge.textContent = 'Urgent';
        title.appendChild(document.createTextNode(' '));
        title.appendChild(badge);
      }
      const status = document.createElement('td');
      const sb = document.createElement('span');
      sb.className = 'badge badge-' + t.status;
      sb.textContent = STATUS_LABEL[t.status];
      status.appendChild(sb);
      const pr = document.createElement('td');
      pr.textContent = PRIORITY_LABEL[t.priority];
      const due = document.createElement('td');
      due.textContent = t.dueDate || '';
      const actions = document.createElement('td');
      const edit = document.createElement('a');
      edit.href = '/tasks/' + t.id + '/edit';
      edit.textContent = 'Edit';
      edit.setAttribute('aria-label', 'Edit ' + t.title);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-link danger';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', 'Delete ' + t.title);
      del.addEventListener('click', async function () {
        if (!window.confirm('Delete task "' + t.title + '"?')) return;
        const r = await api('DELETE', '/api/tasks/' + t.id);
        if (r.ok) { showToast('Task deleted'); load(); }
        else showToast((r.data && r.data.error) || 'Could not delete task');
      });
      actions.append(edit, ' ', del);
      tr.append(title, status, pr, due, actions);
      tbody.appendChild(tr);
    });
    table.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    state.q = form.q.value.trim();
    state.status = form.status.value;
    state.sort = form.sort.value;
    state.page = 1;
    load();
  });
  form.status.addEventListener('change', function () { form.requestSubmit(); });
  form.sort.addEventListener('change', function () { form.requestSubmit(); });
  document.getElementById('clear-filters').addEventListener('click', function () {
    form.reset();
    state.q = ''; state.status = ''; state.sort = 'newest'; state.page = 1;
    load();
  });
  prev.addEventListener('click', function () { state.page -= 1; load(); });
  next.addEventListener('click', function () { state.page += 1; load(); });

  load();
})();
