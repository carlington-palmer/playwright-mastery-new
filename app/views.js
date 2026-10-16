// Server rendered page shells. Data is loaded by the browser through /api/*
// so network requests can be inspected and mocked in tests.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const NAV = [
  ['/dashboard', 'Dashboard'],
  ['/tasks', 'Tasks'],
  ['/files', 'Files'],
  ['/settings', 'Settings'],
  ['/lab', 'Lab'],
];

function layout({ title, user, active, body, scripts = [], bodyAttrs = '' }) {
  const links = NAV.slice();
  if (user && user.role === 'admin') links.push(['/admin', 'Admin']);
  const nav = user
    ? `<header class="topbar">
        <a class="brand" href="/dashboard">Taskly</a>
        <nav aria-label="Main">
          ${links.map(([href, label]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
        </nav>
        <div class="user-menu">
          <span class="user-name" data-testid="current-user">${esc(user.displayName)}</span>
          <button type="button" class="btn btn-ghost" id="logout-btn">Log out</button>
        </div>
      </header>`
    : `<header class="topbar"><a class="brand" href="/login">Taskly</a></header>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Taskly</title>
<link rel="stylesheet" href="/static/styles.css">
<script>try{var t=localStorage.getItem('taskly.theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
</head>
<body ${bodyAttrs}>
${nav}
<main id="main">
${body}
</main>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<script src="/static/js/common.js"></script>
${scripts.map((s) => `<script src="/static/js/${s}"></script>`).join('\n')}
</body>
</html>`;
}

function login() {
  return layout({
    title: 'Log in',
    body: `
<section class="auth-card">
  <h1>Log in to Taskly</h1>
  <div id="login-notice" class="notice" role="status" hidden></div>
  <form id="login-form" novalidate>
    <div class="field">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" placeholder="Enter your username">
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password">
    </div>
    <div id="login-error" class="error-banner" role="alert" hidden></div>
    <button type="submit" class="btn btn-primary btn-block">Log in</button>
  </form>
  <p class="muted">New here? <a href="/signup">Create an account</a></p>
</section>`,
    scripts: ['login.js'],
  });
}

function signup() {
  return layout({
    title: 'Sign up',
    body: `
<section class="auth-card">
  <h1>Create your account</h1>
  <form id="signup-form" novalidate>
    <div class="field">
      <label for="su-username">Username</label>
      <input id="su-username" name="username" type="text" autocomplete="off">
      <p class="field-error" id="err-username" role="alert" hidden></p>
    </div>
    <div class="field">
      <label for="su-display">Display name</label>
      <input id="su-display" name="displayName" type="text" autocomplete="off">
    </div>
    <div class="field">
      <label for="su-password">Password</label>
      <input id="su-password" name="password" type="password" autocomplete="new-password">
      <p class="field-error" id="err-password" role="alert" hidden></p>
    </div>
    <div id="signup-error" class="error-banner" role="alert" hidden></div>
    <button type="submit" class="btn btn-primary btn-block">Create account</button>
  </form>
  <p class="muted">Already have an account? <a href="/login">Log in</a></p>
</section>`,
    scripts: ['signup.js'],
  });
}

function dashboard(user) {
  return layout({
    title: 'Dashboard', user, active: '/dashboard',
    body: `
<h1>Dashboard</h1>
<p class="lead">Welcome back, <strong data-testid="welcome-name">${esc(user.displayName)}</strong></p>
<section aria-labelledby="stats-heading">
  <h2 id="stats-heading" class="sr-only">Task summary</h2>
  <div class="stats" id="stats">
    <div class="stat" data-testid="stat-total"><span class="stat-label">Total tasks</span><span class="stat-value">…</span></div>
    <div class="stat" data-testid="stat-todo"><span class="stat-label">To do</span><span class="stat-value">…</span></div>
    <div class="stat" data-testid="stat-in-progress"><span class="stat-label">In progress</span><span class="stat-value">…</span></div>
    <div class="stat" data-testid="stat-done"><span class="stat-label">Done</span><span class="stat-value">…</span></div>
  </div>
</section>
<section aria-labelledby="recent-heading" class="card">
  <h2 id="recent-heading">Recent tasks</h2>
  <ul id="recent-tasks" class="plain-list"><li class="muted">Loading…</li></ul>
  <a href="/tasks">View all tasks</a>
</section>`,
    scripts: ['dashboard.js'],
  });
}

function tasks(user) {
  return layout({
    title: 'Tasks', user, active: '/tasks',
    body: `
<div class="page-head">
  <h1>Tasks</h1>
  <a class="btn btn-primary" href="/tasks/new">New task</a>
</div>
<form id="filters" class="filters" role="search">
  <div class="field">
    <label for="search">Search tasks</label>
    <input id="search" name="q" type="search" placeholder="Title or description">
  </div>
  <div class="field">
    <label for="status-filter">Status</label>
    <select id="status-filter" name="status">
      <option value="">All</option>
      <option value="todo">To do</option>
      <option value="in_progress">In progress</option>
      <option value="done">Done</option>
    </select>
  </div>
  <div class="field">
    <label for="sort">Sort by</label>
    <select id="sort" name="sort">
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
      <option value="title">Title A to Z</option>
      <option value="due">Due date</option>
    </select>
  </div>
  <button type="submit" class="btn">Search</button>
  <button type="button" class="btn btn-ghost" id="clear-filters">Clear</button>
</form>
<p id="result-count" class="muted" aria-live="polite"></p>
<div id="tasks-state"></div>
<table id="tasks-table" class="table" hidden>
  <caption class="sr-only">Your tasks</caption>
  <thead>
    <tr><th scope="col">Title</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Due</th><th scope="col">Actions</th></tr>
  </thead>
  <tbody id="tasks-body"></tbody>
</table>
<nav class="pager" aria-label="Pagination">
  <button type="button" class="btn" id="prev-page" disabled>Previous</button>
  <span id="page-info"></span>
  <button type="button" class="btn" id="next-page" disabled>Next</button>
</nav>`,
    scripts: ['tasks.js'],
  });
}

function taskForm(user, id) {
  const editing = id != null;
  return layout({
    title: editing ? 'Edit task' : 'New task', user, active: '/tasks',
    bodyAttrs: editing ? `data-task-id="${id}"` : '',
    body: `
<h1>${editing ? 'Edit task' : 'New task'}</h1>
<form id="task-form" class="card form" novalidate>
  <div class="field">
    <label for="title">Title</label>
    <input id="title" name="title" type="text">
    <p class="field-error" id="err-title" role="alert" hidden></p>
  </div>
  <div class="field">
    <label for="description">Description</label>
    <textarea id="description" name="description" rows="4"></textarea>
    <p class="field-error" id="err-description" role="alert" hidden></p>
  </div>
  <div class="field">
    <label for="status">Status</label>
    <select id="status" name="status">
      <option value="todo">To do</option>
      <option value="in_progress">In progress</option>
      <option value="done">Done</option>
    </select>
  </div>
  <fieldset class="field">
    <legend>Priority</legend>
    <label class="inline"><input type="radio" name="priority" value="low"> Low</label>
    <label class="inline"><input type="radio" name="priority" value="medium" checked> Medium</label>
    <label class="inline"><input type="radio" name="priority" value="high"> High</label>
  </fieldset>
  <div class="field">
    <label for="dueDate">Due date</label>
    <input id="dueDate" name="dueDate" type="date">
    <p class="field-error" id="err-dueDate" role="alert" hidden></p>
  </div>
  <div class="field">
    <label class="inline"><input id="urgent" name="urgent" type="checkbox"> Mark as urgent</label>
  </div>
  <div id="form-error" class="error-banner" role="alert" hidden></div>
  <div class="actions">
    <button type="submit" class="btn btn-primary">${editing ? 'Save changes' : 'Create task'}</button>
    <a class="btn btn-ghost" href="/tasks">Cancel</a>
  </div>
</form>`,
    scripts: ['task-form.js'],
  });
}

function files(user) {
  return layout({
    title: 'Files', user, active: '/files',
    body: `
<div class="page-head">
  <h1>Files</h1>
  <a class="btn" href="/api/tasks/export.csv" download>Export tasks (CSV)</a>
</div>
<form id="upload-form" class="card form" novalidate>
  <h2>Upload files</h2>
  <p class="muted">Allowed: .txt, .csv, .json, .png, .jpg, .jpeg, .pdf. Max 1 MB each, up to 5 at once.</p>
  <div class="field">
    <label for="file-input">Choose files</label>
    <input id="file-input" name="files" type="file" multiple>
  </div>
  <button type="submit" class="btn btn-primary">Upload</button>
  <div id="upload-message" class="notice" role="status" hidden></div>
  <div id="upload-error" class="error-banner" role="alert" hidden></div>
</form>
<section class="card" aria-labelledby="files-heading">
  <h2 id="files-heading">Your files</h2>
  <p id="files-empty" class="muted" hidden>No files uploaded yet.</p>
  <table id="files-table" class="table" hidden>
    <thead><tr><th scope="col">Name</th><th scope="col">Size</th><th scope="col">Uploaded</th><th scope="col">Actions</th></tr></thead>
    <tbody id="files-body"></tbody>
  </table>
</section>`,
    scripts: ['files.js'],
  });
}

function settings(user) {
  return layout({
    title: 'Settings', user, active: '/settings',
    bodyAttrs: `data-username="${esc(user.username)}"`,
    body: `
<h1>Settings</h1>
<div class="tabs">
  <div role="tablist" aria-label="Settings sections">
    <button role="tab" id="tab-profile" aria-controls="panel-profile" aria-selected="true">Profile</button>
    <button role="tab" id="tab-preferences" aria-controls="panel-preferences" aria-selected="false" tabindex="-1">Preferences</button>
    <button role="tab" id="tab-account" aria-controls="panel-account" aria-selected="false" tabindex="-1">Account</button>
  </div>
  <section role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" class="card">
    <h2>Profile</h2>
    <form id="profile-form" novalidate>
      <div class="field">
        <label for="displayName">Display name</label>
        <input id="displayName" name="displayName" type="text" value="${esc(user.displayName)}">
        <p class="field-error" id="err-displayName" role="alert" hidden></p>
      </div>
      <p class="muted">Username: <span data-testid="profile-username">${esc(user.username)}</span> · Role: <span data-testid="profile-role">${esc(user.role)}</span></p>
      <button type="submit" class="btn btn-primary">Save profile</button>
    </form>
  </section>
  <section role="tabpanel" id="panel-preferences" aria-labelledby="tab-preferences" class="card" hidden>
    <h2>Preferences</h2>
    <div class="field">
      <label for="theme">Theme</label>
      <select id="theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
    <p class="muted">Your theme is saved in this browser only.</p>
  </section>
  <section role="tabpanel" id="panel-account" aria-labelledby="tab-account" class="card" hidden>
    <h2>Account</h2>
    <p>Deleting your account removes all your tasks and files. This cannot be undone.</p>
    <button type="button" class="btn btn-danger" id="open-delete-modal">Delete account</button>
  </section>
</div>
<div class="modal-backdrop" id="delete-modal" hidden>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
    <h2 id="delete-title">Delete your account?</h2>
    <p>Type your username to confirm.</p>
    <div class="field">
      <label for="confirm-username">Username</label>
      <input id="confirm-username" type="text" autocomplete="off">
    </div>
    <div id="delete-error" class="error-banner" role="alert" hidden></div>
    <div class="actions">
      <button type="button" class="btn btn-ghost" id="cancel-delete">Cancel</button>
      <button type="button" class="btn btn-danger" id="confirm-delete" disabled>Delete permanently</button>
    </div>
  </div>
</div>`,
    scripts: ['settings.js'],
  });
}

function lab(user) {
  return layout({
    title: 'Lab', user, active: '/lab',
    body: `
<h1>Lab</h1>
<p class="lead">Browser behaviours to practise against.</p>
<div class="lab-grid">
  <section class="card" aria-labelledby="lab-report">
    <h2 id="lab-report">Delayed content</h2>
    <button type="button" class="btn" id="load-report">Load report</button>
    <p id="report-status" role="status"></p>
  </section>

  <section class="card" aria-labelledby="lab-job">
    <h2 id="lab-job">Background job</h2>
    <button type="button" class="btn" id="start-job">Start job</button>
    <p>Status: <span id="job-status" data-testid="job-status">Idle</span></p>
  </section>

  <section class="card" aria-labelledby="lab-dialogs">
    <h2 id="lab-dialogs">Native dialogs</h2>
    <div class="actions">
      <button type="button" class="btn" id="show-alert">Show alert</button>
      <button type="button" class="btn" id="show-confirm">Show confirm</button>
      <button type="button" class="btn" id="show-prompt">Show prompt</button>
    </div>
    <p id="dialog-result" data-testid="dialog-result"></p>
  </section>

  <section class="card" aria-labelledby="lab-tab">
    <h2 id="lab-tab">New tab</h2>
    <a href="/help" target="_blank" rel="noopener">Open help center</a>
  </section>

  <section class="card" aria-labelledby="lab-frame">
    <h2 id="lab-frame">Iframe</h2>
    <iframe src="/lab/frame" title="Feedback form" class="frame"></iframe>
  </section>

  <section class="card" aria-labelledby="lab-hover">
    <h2 id="lab-hover">Hover</h2>
    <span class="tip-wrap">
      <button type="button" class="btn" id="hover-target" aria-describedby="hover-tip">Hover for tip</button>
      <span role="tooltip" id="hover-tip" class="tooltip" hidden>Tests should not depend on each other</span>
    </span>
  </section>

  <section class="card" aria-labelledby="lab-list">
    <h2 id="lab-list">Dynamic list</h2>
    <div class="actions">
      <button type="button" class="btn" id="add-item">Add item</button>
      <button type="button" class="btn" id="remove-item">Remove last</button>
    </div>
    <ul id="dynamic-list" aria-label="Dynamic items"></ul>
  </section>

  <section class="card" aria-labelledby="lab-keys">
    <h2 id="lab-keys">Keyboard</h2>
    <div class="field">
      <label for="tag-input">Add a tag</label>
      <input id="tag-input" type="text" placeholder="Type and press Enter">
    </div>
    <ul id="tag-list" aria-label="Tags" class="tags"></ul>
  </section>
</div>`,
    scripts: ['lab.js'],
  });
}

function labFrame() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Feedback</title>
<link rel="stylesheet" href="/static/styles.css">
<script>try{var t=localStorage.getItem('taskly.theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
</head>
<body class="frame-body">
<form id="feedback-form">
  <div class="field">
    <label for="feedback">Your feedback</label>
    <textarea id="feedback" rows="3"></textarea>
  </div>
  <button type="submit" class="btn btn-primary">Send feedback</button>
  <p id="feedback-result" role="status"></p>
</form>
<script>
document.getElementById('feedback-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var v = document.getElementById('feedback').value.trim();
  document.getElementById('feedback-result').textContent = v ? 'Thanks for your feedback!' : 'Please enter some feedback';
});
</script>
</body></html>`;
}

function admin(user) {
  return layout({
    title: 'Admin', user, active: '/admin',
    body: `
<h1>Admin</h1>
<section class="card" aria-labelledby="users-heading">
  <h2 id="users-heading">Users</h2>
  <table class="table" id="users-table">
    <thead><tr><th scope="col">Username</th><th scope="col">Display name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
    <tbody id="users-body"></tbody>
  </table>
</section>`,
    scripts: ['admin.js'],
  });
}

function help(user) {
  return layout({
    title: 'Help center', user,
    body: `
<h1>Help center</h1>
<section class="card">
  <h2>Getting started</h2>
  <p>Create tasks from the Tasks page, upload files from the Files page, and change your theme in Settings.</p>
  <h2>Need more help?</h2>
  <p>Contact <a href="mailto:support@taskly.test">support@taskly.test</a>.</p>
</section>`,
  });
}

function forbidden(user) {
  return layout({
    title: 'Access denied', user,
    body: `<section class="card center"><h1>Access denied</h1><p>You do not have permission to view this page.</p><a href="/dashboard">Back to dashboard</a></section>`,
  });
}

function notFound(user) {
  return layout({
    title: 'Page not found', user,
    body: `<section class="card center"><h1>Page not found</h1><p>The page you are looking for does not exist.</p><a href="/">Go home</a></section>`,
  });
}

module.exports = { login, signup, dashboard, tasks, taskForm, files, settings, lab, labFrame, admin, help, forbidden, notFound };
