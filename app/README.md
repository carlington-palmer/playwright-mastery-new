# Taskly: practice app

Taskly is a small task manager built only to be tested. Treat it like an app at work: you get this guide, the running app, and its API docs. **Do not read the source code** to decide what to assert. Find out how it behaves by using it, the same way you would on a real team.

## Run it

```bash
cd app
npm install
npm start
```

It runs at **http://localhost:3000**. Keep that terminal open and run your tests in a second terminal. It needs Node 22.13 or newer.

Data is stored in a SQLite database at `app/data/taskly.db` and survives restarts. To put everything back to the starting state, run `npm run reset-db` or call `POST /api/test/reset`. A reset also logs everyone out, which you will see in Block 7.

## Accounts

| Username | Password | Notes |
|---|---|---|
| `standard_user` | `Password123!` | Normal user, owns 12 tasks |
| `admin_user` | `Admin123!` | Admin, can see the Admin page |
| `locked_user` | `Password123!` | Locked, cannot log in |

You can also create your own accounts from the Sign up page or the API. Demo accounts cannot be deleted. Accounts you create can be.

## Pages

| Page | What is there |
|---|---|
| `/login`, `/signup` | Log in, sign up, validation errors, locked account |
| `/dashboard` | Welcome message, task counts, recent tasks |
| `/tasks` | Table with search, status filter, sort, pagination (5 per page), edit and delete |
| `/tasks/new`, `/tasks/:id/edit` | Form with text, textarea, select, radio, date, checkbox, validation |
| `/files` | Multi file upload, type and size rules, download, delete, CSV export |
| `/settings` | Tabs, profile update, theme saved in the browser, a confirmation modal |
| `/lab` | Slow content, a status that changes over time, alert/confirm/prompt dialogs, a link that opens a new tab, an iframe, a hover tooltip, a dynamic list, keyboard input |
| `/admin` | Admins only: lock and unlock users. Everyone else gets "Access denied" |
| `/help` | Public help page |

Pages that need a login send you to `/login?next=...` and come back after you log in.

## API

Every endpoint accepts **either** the session cookie set by logging in **or** a header `Authorization: Bearer <token>`. Without either you get `401`. Errors come back as JSON, either `{ "error": "..." }` or, for validation, `{ "errors": { "field": "message" } }`.

### Auth and users

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` | `200` `{ token, user }` and sets a cookie |
| POST | `/api/auth/logout` | | `204` |
| GET | `/api/me` | | `200` current user |
| PATCH | `/api/me` | `{ displayName }` | `200` updated user |
| POST | `/api/users` | `{ username, password, displayName? }` | `201` new user (no login needed) |
| DELETE | `/api/users/:username` | | `204` (yourself, or any non demo user if admin) |

Login returns `400` for missing fields, `401` for wrong credentials and `403` for a locked account. Sign up returns `400` for invalid input and `409` if the username is taken.

### Tasks

A task looks like:

```json
{
  "id": 1,
  "title": "Write login tests",
  "description": "Cover valid, invalid and locked users",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "2026-10-01 or null",
  "urgent": false,
  "owner": "standard_user",
  "createdAt": "ISO timestamp"
}
```

| Method | Path | Notes |
|---|---|---|
| GET | `/api/tasks` | Your tasks. Query: `q`, `status`, `priority`, `sort` (`newest`, `oldest`, `title`, `due`), `page`, `limit` (max 50). Returns `{ items, total, page, limit, pages }` |
| POST | `/api/tasks` | Create. `title` required (3 to 80 characters). Defaults: status `todo`, priority `medium`, urgent `false`. `201` |
| GET | `/api/tasks/:id` | `404` if it does not exist, `403` if it is not yours |
| PUT | `/api/tasks/:id` | Full replace, same rules as create |
| PATCH | `/api/tasks/:id` | Update only the fields you send |
| DELETE | `/api/tasks/:id` | `204` |
| GET | `/api/stats` | Counts of your tasks by status |
| GET | `/api/tasks/export.csv` | Downloads your tasks as `tasks.csv` |

### Files

| Method | Path | Notes |
|---|---|---|
| POST | `/api/files` | `multipart/form-data`, field name `files`, up to 5 files, 1 MB each. Allowed: .txt .csv .json .png .jpg .jpeg .pdf. `201` `{ files: [...] }` |
| GET | `/api/files` | Your files |
| GET | `/api/files/:id/download` | Downloads the file |
| DELETE | `/api/files/:id` | `204` |

### Admin

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/users` | Admins only, otherwise `403` |
| PATCH | `/api/admin/users/:username` | `{ locked: true \| false }`. Locking someone ends their sessions |

### Test helpers

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{ status: "ok" }` |
| POST | `/api/test/reset` | Puts all data back to the starting state. `204` |
| GET | `/api/slow?ms=2000` | Answers after the given delay (max 10000 ms) |

## Database

SQLite, file `app/data/taskly.db`. Foreign keys are on, and the file is in WAL mode, so your tests can open it read only while the app is running. Timestamps are ISO 8601 text in UTC. Booleans are stored as `0` or `1`.

### users

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| username | TEXT | Unique |
| password_hash | TEXT | Hashed, never the plain password |
| display_name | TEXT | |
| role | TEXT | `user` or `admin` |
| locked | INTEGER | 0 or 1 |
| is_demo | INTEGER | 1 for the three demo accounts |
| created_at | TEXT | |

### tasks

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| owner_id | INTEGER | References `users.id`. Deleting a user deletes their tasks |
| title | TEXT | |
| description | TEXT | Empty string when not given |
| status | TEXT | `todo`, `in_progress` or `done` |
| priority | TEXT | `low`, `medium` or `high` |
| due_date | TEXT | `YYYY-MM-DD` or NULL |
| urgent | INTEGER | 0 or 1 |
| created_at | TEXT | |
| updated_at | TEXT | Changes on every edit |

### files

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| owner_id | INTEGER | References `users.id`, cascades on delete |
| name | TEXT | Original file name |
| size | INTEGER | Bytes |
| mime_type | TEXT | |
| data | BLOB | The file contents |
| uploaded_at | TEXT | |

### sessions

| Column | Type | Notes |
|---|---|---|
| token | TEXT | Primary key. Same value as the `sid` cookie and the bearer token |
| user_id | INTEGER | References `users.id`, cascades on delete |
| created_at | TEXT | |
| expires_at | TEXT | Two hours after login |

### audit_log

Every login, create, update, delete, upload, lock and unlock writes a row here.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Who did it |
| action | TEXT | `login`, `create`, `update`, `delete`, `upload`, `lock`, `unlock` |
| entity | TEXT | `session`, `user`, `task` or `file` |
| entity_id | INTEGER | The row that was affected, or NULL for logins |
| details | TEXT | JSON with what changed, or NULL |
| created_at | TEXT | |
