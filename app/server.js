const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const store = require('./db');
const views = require('./views');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));

// ---------- auth helpers ----------
function tokenFrom(req) {
  const h = req.get('authorization');
  if (h && h.startsWith('Bearer ')) return h.slice(7).trim();
  return req.cookies.sid;
}
function currentUser(req) { return store.sessions.user(tokenFrom(req)); }

function apiAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}
function apiAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}
function pageAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  req.user = user;
  next();
}

// ---------- validation ----------
const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

function validateTask(body, partial) {
  const errors = {};
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('title')) {
    const t = typeof body.title === 'string' ? body.title.trim() : '';
    if (!t) errors.title = 'Title is required';
    else if (t.length < 3) errors.title = 'Title must be at least 3 characters';
    else if (t.length > 80) errors.title = 'Title must be 80 characters or fewer';
    else out.title = t;
  }
  if (!partial || has('description')) {
    const d = body.description == null ? '' : body.description;
    if (typeof d !== 'string') errors.description = 'Description must be text';
    else if (d.length > 500) errors.description = 'Description must be 500 characters or fewer';
    else out.description = d.trim();
  }
  if (!partial || has('status')) {
    const s = body.status == null && !partial ? 'todo' : body.status;
    if (!STATUSES.includes(s)) errors.status = 'Status must be one of: todo, in_progress, done';
    else out.status = s;
  }
  if (!partial || has('priority')) {
    const p = body.priority == null && !partial ? 'medium' : body.priority;
    if (!PRIORITIES.includes(p)) errors.priority = 'Priority must be one of: low, medium, high';
    else out.priority = p;
  }
  if (!partial || has('dueDate')) {
    const d = body.dueDate;
    if (d == null || d === '') out.dueDate = null;
    else if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) errors.dueDate = 'Due date must be a valid date (YYYY-MM-DD)';
    else out.dueDate = d;
  }
  if (!partial || has('urgent')) {
    const u = body.urgent == null && !partial ? false : body.urgent;
    if (typeof u !== 'boolean') errors.urgent = 'Urgent must be true or false';
    else out.urgent = u;
  }
  return { errors, value: out };
}

function canAccess(req, owner) { return owner === req.user.username || req.user.role === 'admin'; }

function findOwnedTask(req, res) {
  const task = store.tasks.get(req.params.id);
  if (!task) { res.status(404).json({ error: 'Task not found' }); return null; }
  if (!canAccess(req, task.owner)) { res.status(403).json({ error: 'You do not have access to this task' }); return null; }
  return task;
}

// ---------- API: health, test utilities ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/test/reset', (req, res) => {
  store.reset();
  res.status(204).end();
});

app.get('/api/slow', (req, res) => {
  const raw = req.query.ms === undefined ? 2000 : Number(req.query.ms);
  const ms = Math.min(Math.max(Number.isFinite(raw) ? raw : 2000, 0), 10000);
  setTimeout(() => res.json({ done: true, waitedMs: ms }), ms);
});

// ---------- API: auth ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  const user = store.users.checkLogin(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  if (user.locked) return res.status(403).json({ error: 'This account has been locked. Contact support.' });
  const token = store.sessions.create(user.id);
  res.cookie('sid', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.json({ token, user: store.publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = tokenFrom(req);
  if (token) store.sessions.remove(token);
  res.clearCookie('sid', { path: '/' });
  res.status(204).end();
});

app.get('/api/me', apiAuth, (req, res) => res.json(store.publicUser(req.user)));

app.patch('/api/me', apiAuth, (req, res) => {
  const name = typeof (req.body || {}).displayName === 'string' ? req.body.displayName.trim() : '';
  if (!name) return res.status(400).json({ errors: { displayName: 'Display name is required' } });
  if (name.length > 40) return res.status(400).json({ errors: { displayName: 'Display name must be 40 characters or fewer' } });
  res.json(store.publicUser(store.users.setDisplayName(req.user.id, name)));
});

// ---------- API: users ----------
app.post('/api/users', (req, res) => {
  const { username, password, displayName } = req.body || {};
  const errors = {};
  if (typeof username !== 'string' || !/^[a-z0-9_.-]{3,30}$/.test(username)) {
    errors.username = 'Username must be 3 to 30 characters: lowercase letters, numbers, _ . -';
  }
  if (typeof password !== 'string' || password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  if (store.users.byUsername(username)) return res.status(409).json({ error: 'Username already taken' });
  const name = typeof displayName === 'string' && displayName.trim() ? displayName.trim().slice(0, 40) : username;
  res.status(201).json(store.publicUser(store.users.create(username, password, name)));
});

app.delete('/api/users/:username', apiAuth, (req, res) => {
  const target = store.users.byUsername(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (req.user.id !== target.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only delete your own account' });
  if (target.isDemo) return res.status(403).json({ error: 'Demo accounts cannot be deleted' });
  store.users.remove(req.user.id, target.id);
  if (req.user.id === target.id) res.clearCookie('sid', { path: '/' });
  res.status(204).end();
});

// ---------- API: admin ----------
app.get('/api/admin/users', apiAuth, apiAdmin, (req, res) => res.json(store.users.all().map(store.publicUser)));

app.patch('/api/admin/users/:username', apiAuth, apiAdmin, (req, res) => {
  const target = store.users.byUsername(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (typeof (req.body || {}).locked !== 'boolean') return res.status(400).json({ errors: { locked: 'Locked must be true or false' } });
  if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot lock your own account' });
  res.json(store.publicUser(store.users.setLocked(req.user.id, target.id, req.body.locked)));
});

// ---------- API: tasks ----------
app.get('/api/stats', apiAuth, (req, res) => res.json(store.tasks.stats(req.user.id)));

app.get('/api/tasks/export.csv', apiAuth, (req, res) => {
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['id', 'title', 'status', 'priority', 'dueDate', 'urgent'].join(',')];
  store.tasks.forExport(req.user.id).forEach((t) => rows.push([t.id, esc(t.title), t.status, t.priority, t.dueDate || '', t.urgent].join(',')));
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="tasks.csv"');
  res.send(rows.join('\n') + '\n');
});

app.get('/api/tasks', apiAuth, (req, res) => {
  const status = req.query.status || '';
  const priority = req.query.priority || '';
  const sort = req.query.sort || 'newest';
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status filter' });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority filter' });
  if (!['newest', 'oldest', 'title', 'due'].includes(sort)) return res.status(400).json({ error: 'Invalid sort option' });
  res.json(store.tasks.list(req.user.id, {
    q: String(req.query.q || '').trim().toLowerCase(),
    status, priority, sort,
    page: parseInt(req.query.page, 10) || 1,
    limit: Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50),
  }));
});

app.post('/api/tasks', apiAuth, (req, res) => {
  const { errors, value } = validateTask(req.body || {}, false);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  res.status(201).json(store.tasks.create(req.user.id, value));
});

app.get('/api/tasks/:id', apiAuth, (req, res) => {
  const task = findOwnedTask(req, res);
  if (task) res.json(task);
});

app.put('/api/tasks/:id', apiAuth, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) return;
  const { errors, value } = validateTask(req.body || {}, false);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  res.json(store.tasks.update(req.user.id, task.id, value));
});

app.patch('/api/tasks/:id', apiAuth, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) return;
  const { errors, value } = validateTask(req.body || {}, true);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  if (!Object.keys(value).length) return res.json(task);
  res.json(store.tasks.update(req.user.id, task.id, value));
});

app.delete('/api/tasks/:id', apiAuth, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) return;
  store.tasks.remove(req.user.id, task.id);
  res.status(204).end();
});

// ---------- API: files ----------
const ALLOWED_EXT = ['.txt', '.csv', '.json', '.png', '.jpg', '.jpeg', '.pdf'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return cb(new Error('UNSUPPORTED_TYPE:' + file.originalname));
    cb(null, true);
  },
});
const fileMeta = (f) => ({ id: f.id, name: f.name, size: f.size, mimeType: f.mimeType, uploadedAt: f.uploadedAt });

app.post('/api/files', apiAuth, (req, res) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File is too large. Maximum size is 1 MB.' });
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'You can upload up to 5 files at once, using the "files" field.' });
      if (String(err.message).startsWith('UNSUPPORTED_TYPE:')) {
        return res.status(400).json({ error: 'Unsupported file type: ' + err.message.split(':')[1] + '. Allowed: ' + ALLOWED_EXT.join(', ') });
      }
      return res.status(400).json({ error: 'Upload failed' });
    }
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Please choose at least one file' });
    const saved = req.files.map((f) => fileMeta(store.files.create(req.user.id, f.originalname, f.size, f.mimetype || 'application/octet-stream', f.buffer)));
    res.status(201).json({ files: saved });
  });
});

app.get('/api/files', apiAuth, (req, res) => res.json(store.files.list(req.user.id).map(fileMeta)));

function findOwnedFile(req, res) {
  const f = store.files.get(req.params.id);
  if (!f) { res.status(404).json({ error: 'File not found' }); return null; }
  if (!canAccess(req, f.owner)) { res.status(403).json({ error: 'You do not have access to this file' }); return null; }
  return f;
}

app.get('/api/files/:id/download', apiAuth, (req, res) => {
  const f = findOwnedFile(req, res);
  if (!f) return;
  res.set('Content-Type', f.mimeType || 'application/octet-stream');
  res.set('Content-Disposition', 'attachment; filename="' + f.name.replace(/"/g, '') + '"');
  res.send(store.files.data(f.id));
});

app.delete('/api/files/:id', apiAuth, (req, res) => {
  const f = findOwnedFile(req, res);
  if (!f) return;
  store.files.remove(req.user.id, f.id);
  res.status(204).end();
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- pages ----------
app.get('/', (req, res) => res.redirect(currentUser(req) ? '/dashboard' : '/login'));
app.get('/login', (req, res) => (currentUser(req) ? res.redirect('/dashboard') : res.send(views.login())));
app.get('/signup', (req, res) => res.send(views.signup()));
app.get('/help', (req, res) => res.send(views.help(currentUser(req))));
app.get('/lab/frame', (req, res) => res.send(views.labFrame()));

app.get('/dashboard', pageAuth, (req, res) => res.send(views.dashboard(req.user)));
app.get('/tasks', pageAuth, (req, res) => res.send(views.tasks(req.user)));
app.get('/tasks/new', pageAuth, (req, res) => res.send(views.taskForm(req.user, null)));
app.get('/tasks/:id/edit', pageAuth, (req, res) => {
  const task = store.tasks.get(req.params.id);
  if (!task || !canAccess(req, task.owner)) return res.status(404).send(views.notFound(req.user));
  res.send(views.taskForm(req.user, task.id));
});
app.get('/files', pageAuth, (req, res) => res.send(views.files(req.user)));
app.get('/settings', pageAuth, (req, res) => res.send(views.settings(req.user)));
app.get('/lab', pageAuth, (req, res) => res.send(views.lab(req.user)));
app.get('/admin', pageAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send(views.forbidden(req.user));
  res.send(views.admin(req.user));
});

app.use((req, res) => res.status(404).send(views.notFound(currentUser(req))));

app.listen(PORT, () => {
  console.log(`Taskly practice app running at http://localhost:${PORT}`);
  console.log(`Database: ${store.DB_PATH}`);
});
