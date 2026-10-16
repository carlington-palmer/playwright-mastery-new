(function () {
  // Delayed content: random delay between 1 and 3 seconds
  document.getElementById('load-report').addEventListener('click', async function () {
    const status = document.getElementById('report-status');
    status.textContent = 'Loading report…';
    const ms = 1000 + Math.floor(Math.random() * 2000);
    const res = await api('GET', '/api/slow?ms=' + ms);
    status.textContent = res.ok ? 'Report ready' : 'Report failed to load';
  });

  // Background job: Queued -> Running -> Complete
  document.getElementById('start-job').addEventListener('click', function () {
    const s = document.getElementById('job-status');
    const btn = this;
    btn.disabled = true;
    s.textContent = 'Queued';
    setTimeout(function () { s.textContent = 'Running'; }, 800);
    setTimeout(function () { s.textContent = 'Complete'; btn.disabled = false; }, 2500);
  });

  // Native dialogs
  const result = document.getElementById('dialog-result');
  document.getElementById('show-alert').addEventListener('click', function () {
    window.alert('Heads up! This is an alert.');
    result.textContent = 'Alert closed';
  });
  document.getElementById('show-confirm').addEventListener('click', function () {
    result.textContent = window.confirm('Do you want to continue?') ? 'You clicked OK' : 'You clicked Cancel';
  });
  document.getElementById('show-prompt').addEventListener('click', function () {
    const v = window.prompt('What is your name?');
    result.textContent = v === null ? 'Prompt cancelled' : 'Hello, ' + v + '!';
  });

  // Hover tooltip
  const target = document.getElementById('hover-target');
  const tip = document.getElementById('hover-tip');
  target.addEventListener('mouseenter', function () { tip.hidden = false; });
  target.addEventListener('mouseleave', function () { tip.hidden = true; });
  target.addEventListener('focus', function () { tip.hidden = false; });
  target.addEventListener('blur', function () { tip.hidden = true; });

  // Dynamic list
  const list = document.getElementById('dynamic-list');
  let n = 0;
  document.getElementById('add-item').addEventListener('click', function () {
    n += 1;
    const li = document.createElement('li');
    li.textContent = 'Item ' + n;
    list.appendChild(li);
  });
  document.getElementById('remove-item').addEventListener('click', function () {
    if (list.lastElementChild) { list.removeChild(list.lastElementChild); n = Math.max(n - 1, 0); }
  });

  // Keyboard: Enter adds a tag, Escape clears the input
  const tagInput = document.getElementById('tag-input');
  const tags = document.getElementById('tag-list');
  tagInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = tagInput.value.trim();
      if (!v) return;
      const li = document.createElement('li');
      li.textContent = v;
      tags.appendChild(li);
      tagInput.value = '';
    }
    if (e.key === 'Escape') tagInput.value = '';
  });
})();
