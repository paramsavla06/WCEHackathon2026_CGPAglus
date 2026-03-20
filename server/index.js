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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    city       TEXT    NOT NULL DEFAULT 'Mumbai',
    avatar     TEXT    NOT NULL DEFAULT '??',
    streak     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id           TEXT    PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    type         TEXT    NOT NULL,
    label        TEXT    NOT NULL,
    title        TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    location     TEXT    NOT NULL DEFAULT '',
    city         TEXT    NOT NULL DEFAULT 'Mumbai',
    lat          REAL,
    lng          REAL,
    sev          TEXT    NOT NULL DEFAULT 'medium',
    status       TEXT    NOT NULL DEFAULT 'Submitted',
    current_step INTEGER NOT NULL DEFAULT 0,
    votes        INTEGER NOT NULL DEFAULT 0,
    image_url    TEXT,
    bg           TEXT,
    col          TEXT,
    img_grad     TEXT,
    submitted_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_votes (
    user_id   INTEGER NOT NULL REFERENCES users(id),
    report_id TEXT    NOT NULL REFERENCES reports(id),
    PRIMARY KEY (user_id, report_id)
  );
`)

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}))
app.use(express.json({ limit: '5mb' }))

// Request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Auth middleware
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

// Compute civic points for a user
function computePoints(userId) {
  const reports = db.prepare('SELECT status, votes FROM reports WHERE user_id = ?').all(userId)
  const count = reports.length
  const resolved = reports.filter(r => r.status === 'Resolved').length
  const upvotes = reports.reduce((a, r) => a + (r.votes || 0), 0)
  return count * 10 + resolved * 20 + upvotes * 2
}

function normalizeReport(r) {
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
    currentStep: r.current_step,
    votes: r.votes,
    imageUrl: r.image_url,
    imgUrl: r.image_url,
    bg: r.bg || 'rgba(255,153,51,.1)',
    col: r.col || '#ff9933',
    imgGrad: r.img_grad || 'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
    submittedAt: r.submitted_at,
    updatedAt: r.updated_at,
    authorName: r.author_name,
    authorAvatar: r.author_avatar,
  }
}

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, name, city, avatar } = req.body
  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'username, email, password, name are required' })
  }
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' })
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username: letters, numbers, underscores only' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.toLowerCase(), email.toLowerCase())
  if (existingUser) return res.status(409).json({ error: 'Username or email already taken' })

  const hashed = bcrypt.hashSync(password, 10)
  let info
  try {
    info = db.prepare(
      'INSERT INTO users (username, email, password, name, city, avatar) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username.toLowerCase(), email.toLowerCase(), hashed, name, city || 'Mumbai', avatar || name.slice(0, 2).toUpperCase())
  } catch (e) {
    return res.status(409).json({ error: 'Username or email already taken' })
  }

  const user = db.prepare('SELECT id, username, name, email, city, avatar, streak FROM users WHERE id = ?').get(info.lastInsertRowid)
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
  res.status(201).json({ token, user: { ...user, points: 0 } })
})

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? OR email = ?'
  ).get(username.toLowerCase(), username.toLowerCase())
  if (!user) return res.status(401).json({ error: 'No account found with that username or email' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Incorrect password' })

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
  const points = computePoints(user.id)
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, email: user.email, city: user.city, avatar: user.avatar, streak: user.streak, points }
  })
})

// GET /api/auth/me — validate token and return fresh user + points
app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, name, email, city, avatar, streak FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const points = computePoints(user.id)
  res.json({ ...user, points })
})

// ── REPORTS ROUTES ───────────────────────────────────────────────────────────
// GET /api/reports — current user's own reports
app.get('/api/reports', auth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM reports WHERE user_id = ? ORDER BY submitted_at DESC'
  ).all(req.user.id)
  res.json(rows.map(normalizeReport))
})

// POST /api/reports — create a report
app.post('/api/reports', auth, (req, res) => {
  const { type, label, title, description, location, city, lat, lng, sev, imageUrl, imgUrl, bg, col, imgGrad } = req.body
  if (!type || !title) return res.status(400).json({ error: 'type and title are required' })

  // Generate unique ID
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM reports').get().c
  const reportId = 'CE-' + (2870 + existingCount + Math.floor(Math.random() * 10))

  db.prepare(`
    INSERT INTO reports (id, user_id, type, label, title, description, location, city, lat, lng, sev, image_url, bg, col, img_grad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(reportId, req.user.id, type, label || type, title, description || '', location || '', city || 'Mumbai', lat || null, lng || null, sev || 'medium', imageUrl || imgUrl || null, bg || null, col || null, imgGrad || null)

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId)
  res.status(201).json(normalizeReport(report))
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
  res.json(rows.map(normalizeReport))
})

// ── VOTES ─────────────────────────────────────────────────────────────────────
// POST /api/votes/:reportId — toggle upvote
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

// GET /api/votes — IDs the current user has voted on
app.get('/api/votes', auth, (req, res) => {
  const rows = db.prepare('SELECT report_id FROM user_votes WHERE user_id = ?').all(req.user.id)
  res.json(rows.map(r => r.report_id))
})

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
app.get('/api/leaderboard', auth, (req, res) => {
  const users = db.prepare('SELECT id, username, name, city, avatar FROM users').all()
  const board = users.map(u => {
    const reports = db.prepare('SELECT status, votes FROM reports WHERE user_id = ?').all(u.id)
    const pts = reports.length * 10 + reports.filter(r => r.status === 'Resolved').length * 20 + reports.reduce((a, r) => a + (r.votes || 0), 0) * 2
    return {
      id: u.id,
      name: u.name,
      city: u.city,
      avatar: u.avatar,
      pts,
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

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ CivicEye API running on http://localhost:${PORT}`)
  console.log(`   Database: ${join(__dirname, 'civiceye.db')}`)
})
