(function () {
  const form = document.getElementById('upload-form');
  const input = document.getElementById('file-input');
  const table = document.getElementById('files-table');
  const tbody = document.getElementById('files-body');
  const empty = document.getElementById('files-empty');

  function size(bytes) {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  async function load() {
    const res = await api('GET', '/api/files');
    tbody.innerHTML = '';
    if (!res.ok) { empty.textContent = 'Could not load files'; empty.hidden = false; table.hidden = true; return; }
    if (!res.data.length) { empty.textContent = 'No files uploaded yet.'; empty.hidden = false; table.hidden = true; return; }
    empty.hidden = true;
    res.data.forEach(function (f) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-testid', 'file-row');
      const name = document.createElement('td'); name.textContent = f.name;
      const sz = document.createElement('td'); sz.textContent = size(f.size);
      const up = document.createElement('td'); up.textContent = formatDate(f.uploadedAt);
      const act = document.createElement('td');
      const dl = document.createElement('a');
      dl.href = '/api/files/' + f.id + '/download';
      dl.textContent = 'Download';
      dl.setAttribute('aria-label', 'Download ' + f.name);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-link danger';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', 'Delete ' + f.name);
      del.addEventListener('click', async function () {
        const r = await fetch('/api/files/' + f.id, { method: 'DELETE', credentials: 'same-origin' });
        if (r.ok) { showToast('File deleted'); load(); }
      });
      act.append(dl, ' ', del);
      tr.append(name, sz, up, act);
      tbody.appendChild(tr);
    });
    table.hidden = false;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setError('upload-error', '');
    setError('upload-message', '');
    if (!input.files.length) return setError('upload-error', 'Please choose at least one file');
    const data = new FormData();
    Array.from(input.files).forEach(function (f) { data.append('files', f); });
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const res = await fetch('/api/files', { method: 'POST', body: data, credentials: 'same-origin' });
    btn.disabled = false;
    let body = null;
    try { body = await res.json(); } catch (err) {}
    if (!res.ok) return setError('upload-error', (body && body.error) || 'Upload failed');
    const n = body.files.length;
    setError('upload-message', n === 1 ? 'Uploaded 1 file' : 'Uploaded ' + n + ' files');
    form.reset();
    load();
  });

  load();
})();
