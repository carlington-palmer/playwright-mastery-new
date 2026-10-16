// SQLite data layer. The database file lives at app/data/taskly.db.
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.TASKLY_DB || path.join(__dirname, 'data', 'taskly.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 3000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  display_name  TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  locked        INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
  is_demo       INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at    TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority    TEXT    NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date    TEXT,
  urgent      INTEGER NOT NULL DEFAULT 0 CHECK (urgent IN (0, 1)),
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  size        INTEGER NOT NULL,
  mime_type   TEXT    NOT NULL,
  data        BLOB    NOT NULL,
  uploaded_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL,
  expires_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT    NOT NULL,
  entity     TEXT    NOT NULL,
  entity_id  INTEGER,
  details    TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
`);

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const now = () => new Date().toISOString();

// ---------- passwords ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split('$');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(check, Buffer.from(hash, 'hex'));
}

// ---------- seed ----------
const SEED_USERS = [
  ['standard_user', 'Password123!', 'Sam Standard', 'user', 0],
  ['admin_user', 'Admin123!', 'Avery Admin', 'admin', 0],
  ['locked_user', 'Password123!', 'Lee Locked', 'user', 1],
];
const SEED_TASKS = [
  ['Write login tests', 'Cover valid, invalid and locked users', 'done', 'high', '2026-10-01', 0],
  ['Set up CI pipeline', 'GitHub Actions with HTML report artifact', 'in_progress', 'high', '2026-10-20', 1],
  ['Review page objects', 'Check locators are role based', 'todo', 'medium', '2026-10-22', 0],
  ['Add API tests', 'CRUD coverage for tasks endpoint', 'todo', 'high', '2026-10-25', 0],
  ['Fix flaky checkout test', 'Investigate with trace viewer', 'in_progress', 'medium', '2026-10-18', 1],
  ['Document test data strategy', '', 'todo', 'low', null, 0],
  ['Upload test fixtures', 'Sample CSV and PNG files', 'done', 'low', '2026-09-30', 0],
  ['Mock payments API', 'Use page.route for error states', 'todo', 'medium', '2026-11-02', 0],
  ['Cross browser run', 'Chromium, Firefox and WebKit', 'todo', 'medium', '2026-11-05', 0],
  ['Tag smoke tests', 'Add @smoke to critical paths', 'done', 'low', '2026-10-05', 0],
  ['Shard nightly suite', 'Split across 3 runners', 'todo', 'low', '2026-11-10', 0],
  ['Add storageState setup', 'Log in once per run', 'in_progress', 'high', '2026-10-19', 0],
];

function reset() {
  db.exec('BEGIN');
  try {
    db.exec(`DELETE FROM audit_log; DELETE FROM sessions; DELETE FROM files; DELETE FROM tasks; DELETE FROM users;
             DELETE FROM sqlite_sequence WHERE name IN ('users','tasks','files','audit_log');`);
    const insUser = db.prepare(`INSERT INTO users (username, password_hash, display_name, role, locked, is_demo, created_at)
                                VALUES (?, ?, ?, ?, ?, 1, '2026-01-01T09:00:00.000Z')`);
    SEED_USERS.forEach(([u, p, n, r, l]) => insUser.run(u, hashPassword(p), n, r, l));
    const std = db.prepare('SELECT id FROM users WHERE username = ?').get('standard_user').id;
    const adm = db.prepare('SELECT id FROM users WHERE username = ?').get('admin_user').id;
    const insTask = db.prepare(`INSERT INTO tasks (owner_id, title, description, status, priority, due_date, urgent, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const base = new Date('2026-09-01T12:00:00Z').getTime();
    SEED_TASKS.forEach(([t, d, s, p, due, u], i) => {
      const ts = new Date(base + i * 86400000).toISOString();
      insTask.run(std, t, d, s, p, due, u, ts, ts);
    });
    const ts = new Date(base).toISOString();
    insTask.run(adm, 'Audit user permissions', 'Admin only task', 'todo', 'high', '2026-10-30', 0, ts, ts);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) reset();

// ---------- mappers ----------
function userOut(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, displayName: u.display_name, role: u.role, locked: !!u.locked, isDemo: !!u.is_demo, createdAt: u.created_at };
}
function publicUser(u) {
  return { username: u.username, displayName: u.displayName, role: u.role, locked: u.locked, createdAt: u.createdAt };
}
function taskOut(t) {
  if (!t) return null;
  return {
    id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
    dueDate: t.due_date, urgent: !!t.urgent, owner: t.owner, createdAt: t.created_at, updatedAt: t.updated_at,
  };
}
function fileOut(f) {
  return { id: f.id, name: f.name, size: f.size, mimeType: f.mime_type, uploadedAt: f.uploaded_at, owner: f.owner };
}

function audit(userId, action, entity, entityId, details) {
  db.prepare('INSERT INTO audit_log (user_id, action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId == null ? null : userId, action, entity, entityId == null ? null : entityId, details ? JSON.stringify(details) : null, now());
}

// ---------- users ----------
const TASK_SELECT = 'SELECT t.*, u.username AS owner FROM tasks t JOIN users u ON u.id = t.owner_id';

const users = {
  byUsername(username) { return userOut(db.prepare('SELECT * FROM users WHERE username = ?').get(String(username))); },
  checkLogin(username, password) {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username));
    if (!row || !verifyPassword(String(password), row.password_hash)) return null;
    return userOut(row);
  },
  all() { return db.prepare('SELECT * FROM users ORDER BY id').all().map(userOut); },
  create(username, password, displayName) {
    const r = db.prepare(`INSERT INTO users (username, password_hash, display_name, role, locked, is_demo, created_at)
                          VALUES (?, ?, ?, 'user', 0, 0, ?)`).run(username, hashPassword(password), displayName, now());
    const u = userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid));
    audit(u.id, 'create', 'user', u.id, { username });
    return u;
  },
  setDisplayName(id, name) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(name, id);
    audit(id, 'update', 'user', id, { displayName: name });
    return userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  },
  setLocked(actorId, id, locked) {
    db.prepare('UPDATE users SET locked = ? WHERE id = ?').run(locked ? 1 : 0, id);
    if (locked) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    audit(actorId, locked ? 'lock' : 'unlock', 'user', id, null);
    return userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  },
  remove(actorId, id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    audit(actorId, 'delete', 'user', id, null);
  },
};

// ---------- sessions ----------
const sessions = {
  create(userId) {
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(token, userId, now(), new Date(Date.now() + SESSION_TTL_MS).toISOString());
    audit(userId, 'login', 'session', null, null);
    return token;
  },
  user(token) {
    if (!token) return null;
    const row = db.prepare(`SELECT u.*, s.expires_at AS s_exp FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).get(String(token));
    if (!row) return null;
    if (row.s_exp < now()) { db.prepare('DELETE FROM sessions WHERE token = ?').run(String(token)); return null; }
    if (row.locked) return null;
    return userOut(row);
  },
  remove(token) { db.prepare('DELETE FROM sessions WHERE token = ?').run(String(token)); },
};

// ---------- tasks ----------
const tasks = {
  get(id) { return taskOut(db.prepare(TASK_SELECT + ' WHERE t.id = ?').get(Number(id))); },
  list(ownerId, { q, status, priority, sort, page, limit }) {
    const where = ['t.owner_id = ?'];
    const args = [ownerId];
    if (q) { where.push('(LOWER(t.title) LIKE ? OR LOWER(t.description) LIKE ?)'); args.push('%' + q + '%', '%' + q + '%'); }
    if (status) { where.push('t.status = ?'); args.push(status); }
    if (priority) { where.push('t.priority = ?'); args.push(priority); }
    const order = {
      newest: 't.created_at DESC, t.id DESC',
      oldest: 't.created_at ASC, t.id ASC',
      title: 't.title COLLATE NOCASE ASC',
      due: "COALESCE(t.due_date, '9999-12-31') ASC, t.id ASC",
    }[sort];
    const w = ' WHERE ' + where.join(' AND ');
    const total = db.prepare('SELECT COUNT(*) AS n FROM tasks t' + w).get(...args).n;
    const pages = Math.max(Math.ceil(total / limit), 1);
    const p = Math.min(Math.max(page, 1), pages);
    const items = db.prepare(TASK_SELECT + w + ' ORDER BY ' + order + ' LIMIT ? OFFSET ?').all(...args, limit, (p - 1) * limit).map(taskOut);
    return { items, total, page: p, limit, pages };
  },
  forExport(ownerId) { return db.prepare(TASK_SELECT + ' WHERE t.owner_id = ? ORDER BY t.id').all(ownerId).map(taskOut); },
  stats(ownerId) {
    const r = db.prepare(`SELECT COUNT(*) AS total,
        SUM(status = 'todo') AS todo, SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'done') AS done, SUM(urgent = 1) AS urgent
      FROM tasks WHERE owner_id = ?`).get(ownerId);
    return { total: r.total, todo: r.todo || 0, in_progress: r.in_progress || 0, done: r.done || 0, urgent: r.urgent || 0 };
  },
  create(ownerId, v) {
    const ts = now();
    const r = db.prepare(`INSERT INTO tasks (owner_id, title, description, status, priority, due_date, urgent, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(ownerId, v.title, v.description, v.status, v.priority, v.dueDate, v.urgent ? 1 : 0, ts, ts);
    audit(ownerId, 'create', 'task', Number(r.lastInsertRowid), { title: v.title });
    return tasks.get(r.lastInsertRowid);
  },
  update(actorId, id, v) {
    const map = { title: 'title', description: 'description', status: 'status', priority: 'priority', dueDate: 'due_date', urgent: 'urgent' };
    const sets = [];
    const args = [];
    Object.keys(v).forEach((k) => { sets.push(map[k] + ' = ?'); args.push(k === 'urgent' ? (v[k] ? 1 : 0) : v[k]); });
    sets.push('updated_at = ?'); args.push(now());
    db.prepare('UPDATE tasks SET ' + sets.join(', ') + ' WHERE id = ?').run(...args, Number(id));
    audit(actorId, 'update', 'task', Number(id), v);
    return tasks.get(id);
  },
  remove(actorId, id) {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(id));
    audit(actorId, 'delete', 'task', Number(id), null);
  },
};

// ---------- files ----------
const FILE_SELECT = 'SELECT f.id, f.owner_id, f.name, f.size, f.mime_type, f.uploaded_at, u.username AS owner FROM files f JOIN users u ON u.id = f.owner_id';
const files = {
  create(ownerId, name, size, mimeType, buffer) {
    const r = db.prepare('INSERT INTO files (owner_id, name, size, mime_type, data, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(ownerId, name, size, mimeType, buffer, now());
    audit(ownerId, 'upload', 'file', Number(r.lastInsertRowid), { name, size });
    return files.get(r.lastInsertRowid);
  },
  get(id) { const f = db.prepare(FILE_SELECT + ' WHERE f.id = ?').get(Number(id)); return f ? fileOut(f) : null; },
  data(id) { const r = db.prepare('SELECT data FROM files WHERE id = ?').get(Number(id)); return r ? Buffer.from(r.data) : null; },
  list(ownerId) { return db.prepare(FILE_SELECT + ' WHERE f.owner_id = ? ORDER BY f.id').all(ownerId).map(fileOut); },
  remove(actorId, id) {
    db.prepare('DELETE FROM files WHERE id = ?').run(Number(id));
    audit(actorId, 'delete', 'file', Number(id), null);
  },
};

module.exports = { reset, users, sessions, tasks, files, publicUser, DB_PATH };
