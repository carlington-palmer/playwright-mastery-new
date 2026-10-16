(async function () {
  const form = document.getElementById('task-form');
  const id = document.body.getAttribute('data-task-id');
  const fields = ['title', 'description', 'dueDate'];

  if (id) {
    const res = await api('GET', '/api/tasks/' + id);
    if (!res.ok) { setError('form-error', 'Could not load this task'); return; }
    const t = res.data;
    form.title.value = t.title;
    form.description.value = t.description || '';
    form.status.value = t.status;
    form.querySelector('input[name=priority][value=' + t.priority + ']').checked = true;
    form.dueDate.value = t.dueDate || '';
    form.urgent.checked = !!t.urgent;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    fields.forEach(function (f) { setError('err-' + f, ''); });
    setError('form-error', '');
    const body = {
      title: form.title.value,
      description: form.description.value,
      status: form.status.value,
      priority: form.querySelector('input[name=priority]:checked').value,
      dueDate: form.dueDate.value || null,
      urgent: form.urgent.checked,
    };
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const res = id ? await api('PUT', '/api/tasks/' + id, body) : await api('POST', '/api/tasks', body);
    btn.disabled = false;
    if (res.status === 400 && res.data && res.data.errors) {
      Object.keys(res.data.errors).forEach(function (k) {
        if (fields.includes(k)) setError('err-' + k, res.data.errors[k]);
        else setError('form-error', res.data.errors[k]);
      });
      return;
    }
    if (!res.ok) { setError('form-error', (res.data && res.data.error) || 'Something went wrong. Please try again.'); return; }
    flash(id ? 'Task updated' : 'Task created');
    window.location.href = '/tasks';
  });
})();
