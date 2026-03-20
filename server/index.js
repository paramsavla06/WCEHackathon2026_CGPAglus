import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'civiceye-secret-dev-2026'

// ── Database Setup ──────────────────────────────────────────────────────────
const db = new DatabaseSync(join(__dirname, 'civiceye.db'))

db.exec(`PRAGMA journal_mode = WAL;`)
db.exec(`PRAGMA foreign_keys = ON;`)

// Core tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    city       TEXT    NOT NULL DEFAULT 'Mumbai',
    avatar     TEXT    NOT NULL DEFAULT '??',
    role       TEXT    NOT NULL DEFAULT 'citizen',
    department TEXT,
    zone       TEXT,
    streak     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id               TEXT    PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id),
    type             TEXT    NOT NULL,
    label            TEXT    NOT NULL,
    title            TEXT    NOT NULL,
    description      TEXT    NOT NULL DEFAULT '',
    location         TEXT    NOT NULL DEFAULT '',
    city             TEXT    NOT NULL DEFAULT 'Mumbai',
    lat              REAL,
    lng              REAL,
    sev              TEXT    NOT NULL DEFAULT 'medium',
    status           TEXT    NOT NULL DEFAULT 'Submitted',
    current_step     INTEGER NOT NULL DEFAULT 0,
    votes            INTEGER NOT NULL DEFAULT 0,
    image_url        TEXT,
    bg               TEXT,
    col              TEXT,
    img_grad         TEXT,
    assigned_to      TEXT,
    assigned_to_id   INTEGER REFERENCES users(id),
    resolution_note  TEXT,
    proof_before_url TEXT,
    proof_after_url  TEXT,
    due_date         TEXT,
    submitted_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_votes (
    user_id   INTEGER NOT NULL REFERENCES users(id),
    report_id TEXT    NOT NULL REFERENCES reports(id),
    PRIMARY KEY (user_id, report_id)
  );

  CREATE TABLE IF NOT EXISTS officer_team (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    officer_id INTEGER NOT NULL REFERENCES users(id),
    name       TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'Field Engineer',
    avatar     TEXT    NOT NULL DEFAULT '??',
    col        TEXT    NOT NULL DEFAULT '#3d7fff',
    load_pct   INTEGER NOT NULL DEFAULT 0,
    resolved   INTEGER NOT NULL DEFAULT 0
  );
`)

// Migrate existing users table to add role/department/zone columns if they don't exist
try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'citizen'`) } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN department TEXT`) } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN zone TEXT`) } catch {}
// Migrate reports table for officer fields
try { db.exec(`ALTER TABLE reports ADD COLUMN assigned_to TEXT`) } catch {}
try { db.exec(`ALTER TABLE reports ADD COLUMN assigned_to_id INTEGER`) } catch {}
try { db.exec(`ALTER TABLE reports ADD COLUMN resolution_note TEXT`) } catch {}
try { db.exec(`ALTER TABLE reports ADD COLUMN proof_before_url TEXT`) } catch {}
try { db.exec(`ALTER TABLE reports ADD COLUMN proof_after_url TEXT`) } catch {}
try { db.exec(`ALTER TABLE reports ADD COLUMN due_date TEXT`) } catch {}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// ── Auth middleware (citizen) ─────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' })
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── Auth middleware (officer only) ────────────────────────────────────────────
function officerAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    if (payload.role !== 'officer') {
      return res.status(403).json({ error: 'Access restricted to government officers only' })
    }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function computePoints(userId) {
  const reports = db.prepare('SELECT status, votes FROM reports WHERE user_id = ?').all(userId)
  const count = reports.length
  const resolved = reports.filter(r => r.status === 'Resolved').length
  const upvotes = reports.reduce((a, r) => a + (r.votes || 0), 0)
  return count * 10 + resolved * 20 + upvotes * 2
}

// Map raw SQL row to front-end shape
function normalizeReport(r, currentUserId) {
  const STEP_MAP = { 'Submitted': 0, 'Verified': 1, 'Assigned': 2, 'In Progress': 3, 'Resolved': 4 }
  return {
    id: r.id,
    type: r.type,
    label: r.label,
    title: r.title,
    description: r.description,
    location: r.location,
    city: r.city,
    lat: r.lat,
    lng: r.lng,
    sev: r.sev,
    severity: r.sev,
    status: r.status,
    currentStep: STEP_MAP[r.status] ?? r.current_step,
    votes: r.votes,
    imageUrl: r.image_url,
    imgUrl: r.image_url,
    bg: r.bg || 'rgba(255,153,51,.1)',
    col: r.col || '#ff9933',
    imgGrad: r.img_grad || 'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
    assignedTo: r.assigned_to || null,
    resolutionNote: r.resolution_note || null,
    proofBeforeUrl: r.proof_before_url || null,
    proofAfterUrl: r.proof_after_url || null,
    dueDate: r.due_date || null,
    submittedAt: r.submitted_at,
    updatedAt: r.updated_at,
    authorName: r.author_name || null,
    authorAvatar: r.author_avatar || null,
    mine: currentUserId ? r.user_id === currentUserId : undefined,
    age: relativeTime(r.submitted_at),
  }
}

function relativeTime(isoStr) {
  if (!isoStr) return ''
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
  if (diff < 3600) return Math.round(diff / 60) + 'm ago'
  if (diff < 86400) return Math.round(diff / 3600) + 'h ago'
  return Math.round(diff / 86400) + ' days ago'
}

// ══════════════════════════════════════════════════════════════
//  CITIZEN AUTH ROUTES
// ══════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, name, city, avatar } = req.body
  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'username, email, password, name are required' })
  }
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' })
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username: letters, numbers, underscores only' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  // Block gov.in emails from citizen registration
  if (email.toLowerCase().endsWith('@gov.in')) {
    return res.status(400).json({ error: 'Government emails must use the Officer Portal login' })
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.toLowerCase(), email.toLowerCase())
  if (existingUser) return res.status(409).json({ error: 'Username or email already taken' })

  const hashed = bcrypt.hashSync(password, 10)
  let info
  try {
    info = db.prepare(
      'INSERT INTO users (username, email, password, name, city, avatar, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(username.toLowerCase(), email.toLowerCase(), hashed, name, city || 'Mumbai', avatar || name.slice(0, 2).toUpperCase(), 'citizen')
  } catch (e) {
    return res.status(409).json({ error: 'Username or email already taken' })
  }

  const user = db.prepare('SELECT id, username, name, email, city, avatar, streak, role FROM users WHERE id = ?').get(info.lastInsertRowid)
  const token = jwt.sign({ id: user.id, username: user.username, role: 'citizen' }, JWT_SECRET, { expiresIn: '30d' })
  res.status(201).json({ token, user: { ...user, points: 0 } })
})

// POST /api/auth/login  (citizens — blocked for gov.in)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? OR email = ?'
  ).get(username.toLowerCase(), username.toLowerCase())
  if (!user) return res.status(401).json({ error: 'No account found with that username or email' })

  // gov.in accounts must use /api/officer/login
  if (user.email.endsWith('@gov.in') || user.role === 'officer') {
    return res.status(403).json({ error: 'Government accounts must login via the Officer Portal' })
  }

  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password' })

  const token = jwt.sign({ id: user.id, username: user.username, role: 'citizen' }, JWT_SECRET, { expiresIn: '30d' })
  const points = computePoints(user.id)
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, email: user.email, city: user.city, avatar: user.avatar, streak: user.streak, role: user.role, points }
  })
})

// GET /api/auth/me
app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, name, email, city, avatar, streak, role FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const points = computePoints(user.id)
  res.json({ ...user, points })
})

// ══════════════════════════════════════════════════════════════
//  OFFICER AUTH ROUTES
// ══════════════════════════════════════════════════════════════

// POST /api/officer/register  — first-time officer account creation
app.post('/api/officer/register', (req, res) => {
  const { email, password, name, department, zone, avatar } = req.body
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, name are required' })
  }
  if (!email.toLowerCase().endsWith('@gov.in')) {
    return res.status(403).json({ error: 'Only @gov.in email addresses can register as officers' })
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
  if (existing) return res.status(409).json({ error: 'This officer email is already registered' })

  // Derive a username from email (part before @)
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const av = avatar || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const hashed = bcrypt.hashSync(password, 10)
  let info
  try {
    info = db.prepare(
      'INSERT INTO users (username, email, password, name, city, avatar, role, department, zone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(username, email.toLowerCase(), hashed, name, 'Mumbai', av, 'officer', department || 'Roads & Infrastructure', zone || 'Zone 4')
  } catch (e) {
    return res.status(409).json({ error: 'Officer account already exists for this email' })
  }

  const user = db.prepare('SELECT id, username, name, email, city, avatar, role, department, zone FROM users WHERE id = ?').get(info.lastInsertRowid)
  const token = jwt.sign({ id: user.id, username: user.username, role: 'officer' }, JWT_SECRET, { expiresIn: '30d' })
  res.status(201).json({ token, officer: user })
})

// POST /api/officer/login
app.post('/api/officer/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  if (!email.toLowerCase().endsWith('@gov.in')) {
    return res.status(403).json({ error: 'Only @gov.in email addresses can access the Officer Portal' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())
  if (!user) return res.status(401).json({ error: 'No officer account found — please register first' })
  if (user.role !== 'officer') return res.status(403).json({ error: 'This account is not authorized as an officer' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password' })

  const token = jwt.sign({ id: user.id, username: user.username, role: 'officer' }, JWT_SECRET, { expiresIn: '30d' })
  res.json({
    token,
    officer: {
      id: user.id, username: user.username, name: user.name, email: user.email,
      city: user.city, avatar: user.avatar, role: user.role,
      department: user.department || 'Roads & Infrastructure',
      zone: user.zone || 'Zone 4'
    }
  })
})

// GET /api/officer/me
app.get('/api/officer/me', officerAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, name, email, city, avatar, role, department, zone FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'Officer not found' })
  res.json(user)
})

// ══════════════════════════════════════════════════════════════
//  OFFICER REPORT ROUTES
// ══════════════════════════════════════════════════════════════

// GET /api/officer/reports — ALL reports (paginated)
app.get('/api/officer/reports', officerAuth, (req, res) => {
  const { status, sev, limit = 50, offset = 0 } = req.query
  let query = `
    SELECT r.*, u.name as author_name, u.avatar as author_avatar
    FROM reports r
    JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `
  const params = []
  if (status && status !== 'all') { query += ' AND r.status = ?'; params.push(status) }
  if (sev && sev !== 'all') { query += ' AND r.sev = ?'; params.push(sev) }
  query += ' ORDER BY r.submitted_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), Number(offset))

  const rows = db.prepare(query).all(...params)
  const total = db.prepare('SELECT COUNT(*) as c FROM reports').get().c
  res.json({ reports: rows.map(r => normalizeReport(r)), total })
})

// GET /api/officer/stats — aggregate stats for the stats strip
app.get('/api/officer/stats', officerAuth, (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM reports').get().c
  const pending = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status != 'Resolved'").get().c
  const critical = db.prepare("SELECT COUNT(*) as c FROM reports WHERE sev = 'critical'").get().c
  const overdue = db.prepare("SELECT COUNT(*) as c FROM reports WHERE due_date < date('now') AND status != 'Resolved'").get().c
  const resolved = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status = 'Resolved'").get().c
  res.json({ total, pending, critical, overdue, resolved, rate: total ? Math.round(resolved / total * 100) : 0 })
})

// PATCH /api/officer/reports/:id/status — update status + optional proof
app.patch('/api/officer/reports/:id/status', officerAuth, (req, res) => {
  const { id } = req.params
  const { status, assignedTo, resolutionNote, proofBeforeUrl, proofAfterUrl, dueDate } = req.body

  const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(id)
  if (!report) return res.status(404).json({ error: 'Report not found' })

  const STEP_MAP = { 'Submitted': 0, 'Verified': 1, 'Assigned': 2, 'In Progress': 3, 'Resolved': 4 }
  const newStep = STEP_MAP[status] ?? 0

  db.prepare(`
    UPDATE reports SET
      status           = COALESCE(?, status),
      current_step     = ?,
      assigned_to      = COALESCE(?, assigned_to),
      resolution_note  = COALESCE(?, resolution_note),
      proof_before_url = COALESCE(?, proof_before_url),
      proof_after_url  = COALESCE(?, proof_after_url),
      due_date         = COALESCE(?, due_date),
      updated_at       = datetime('now')
    WHERE id = ?
  `).run(
    status || null,
    newStep,
    assignedTo || null,
    resolutionNote || null,
    proofBeforeUrl || null,
    proofAfterUrl || null,
    dueDate || null,
    id
  )

  const updated = db.prepare(`
    SELECT r.*, u.name as author_name, u.avatar as author_avatar
    FROM reports r JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(id)
  res.json(normalizeReport(updated))
})

// GET /api/officer/team — officer's team members
app.get('/api/officer/team', officerAuth, (req, res) => {
  let team = db.prepare('SELECT * FROM officer_team WHERE officer_id = ?').all(req.user.id)
  // Seed default team if none yet
  if (team.length === 0) {
    const defaults = [
      { name: 'Sunil Patil', role: 'Field Engineer', av: 'SP', col: '#3d7fff', load: 80, resolved: 12 },
      { name: 'Rekha More', role: 'Infrastructure Officer', av: 'RM', col: '#f59e0b', load: 60, resolved: 9 },
      { name: 'Anil Sharma', role: 'Senior Engineer', av: 'AS', col: '#22c55e', load: 40, resolved: 18 },
      { name: 'Priya Nair', role: 'Field Officer', av: 'PN', col: '#a78bfa', load: 100, resolved: 7 },
      { name: 'Dev Kulkarni', role: 'Jr. Engineer', av: 'DK', col: '#2dd4bf', load: 20, resolved: 4 },
    ]
    for (const m of defaults) {
      db.prepare(
        'INSERT INTO officer_team (officer_id, name, role, avatar, col, load_pct, resolved) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(req.user.id, m.name, m.role, m.av, m.col, m.load, m.resolved)
    }
    team = db.prepare('SELECT * FROM officer_team WHERE officer_id = ?').all(req.user.id)
  }
  // Attach active assigned report counts
  const result = team.map(m => {
    const active = db.prepare(
      "SELECT COUNT(*) as c FROM reports WHERE assigned_to = ? AND status != 'Resolved'"
    ).get(m.name)
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      avatar: m.avatar,
      col: m.col,
      load: m.load_pct,
      resolved: m.resolved,
      assigned: active.c
    }
  })
  res.json(result)
})

// ══════════════════════════════════════════════════════════════
//  CITIZEN REPORT ROUTES (unchanged)
// ══════════════════════════════════════════════════════════════

// GET /api/reports — current user's own reports
app.get('/api/reports', auth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM reports WHERE user_id = ? ORDER BY submitted_at DESC'
  ).all(req.user.id)
  res.json(rows.map(r => normalizeReport(r, req.user.id)))
})

// POST /api/reports — create a report
app.post('/api/reports', auth, (req, res) => {
  const { type, label, title, description, location, city, lat, lng, sev, imageUrl, imgUrl, bg, col, imgGrad } = req.body
  if (!type || !title) return res.status(400).json({ error: 'type and title are required' })

  const existingCount = db.prepare('SELECT COUNT(*) as c FROM reports').get().c
  const reportId = 'CE-' + (2870 + existingCount + Math.floor(Math.random() * 10))

  db.prepare(`
    INSERT INTO reports (id, user_id, type, label, title, description, location, city, lat, lng, sev, image_url, bg, col, img_grad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(reportId, req.user.id, type, label || type, title, description || '', location || '', city || 'Mumbai', lat || null, lng || null, sev || 'medium', imageUrl || imgUrl || null, bg || null, col || null, imgGrad || null)

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId)
  res.status(201).json(normalizeReport(report, req.user.id))
})

// GET /api/reports/community — all reports for community feed
app.get('/api/reports/community', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, u.name as author_name, u.avatar as author_avatar
    FROM reports r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.submitted_at DESC
    LIMIT 50
  `).all()
  res.json(rows.map(r => normalizeReport(r)))
})

// ── VOTES ─────────────────────────────────────────────────────────────────────
app.post('/api/votes/:reportId', auth, (req, res) => {
  const { reportId } = req.params
  const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(reportId)
  if (!report) return res.status(404).json({ error: 'Report not found' })

  const existing = db.prepare('SELECT * FROM user_votes WHERE user_id = ? AND report_id = ?').get(req.user.id, reportId)
  if (existing) {
    db.prepare('DELETE FROM user_votes WHERE user_id = ? AND report_id = ?').run(req.user.id, reportId)
    db.prepare('UPDATE reports SET votes = MAX(0, votes - 1), updated_at = datetime("now") WHERE id = ?').run(reportId)
    res.json({ voted: false })
  } else {
    db.prepare('INSERT INTO user_votes (user_id, report_id) VALUES (?, ?)').run(req.user.id, reportId)
    db.prepare('UPDATE reports SET votes = votes + 1, updated_at = datetime("now") WHERE id = ?').run(reportId)
    res.json({ voted: true })
  }
})

app.get('/api/votes', auth, (req, res) => {
  const rows = db.prepare('SELECT report_id FROM user_votes WHERE user_id = ?').all(req.user.id)
  res.json(rows.map(r => r.report_id))
})

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
app.get('/api/leaderboard', auth, (req, res) => {
  const users = db.prepare("SELECT id, username, name, city, avatar FROM users WHERE role = 'citizen'").all()
  const board = users.map(u => {
    const reports = db.prepare('SELECT status, votes FROM reports WHERE user_id = ?').all(u.id)
    const pts = reports.length * 10 + reports.filter(r => r.status === 'Resolved').length * 20 + reports.reduce((a, r) => a + (r.votes || 0), 0) * 2
    return {
      id: u.id, name: u.name, city: u.city, avatar: u.avatar, pts,
      reports: reports.length,
      resolved: reports.filter(r => r.status === 'Resolved').length,
      you: u.id === req.user.id,
      col: '#ff9933'
    }
  }).sort((a, b) => b.pts - a.pts)
  res.json(board)
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ CivicEye API running on http://localhost:${PORT}`)
  console.log(`   Citizen auth:  POST /api/auth/login`)
  console.log(`   Officer auth:  POST /api/officer/login  (requires @gov.in email)`)
  console.log(`   Database:      ${join(__dirname, 'civiceye.db')}`)
})
