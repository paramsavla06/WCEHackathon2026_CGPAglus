import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import multer from 'multer'
import { spawn } from 'child_process'
import fs from 'fs'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'civiceye-secret-dev-2026'

// ── Database Pool ────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Helper: run a query
const query = (text, params) => pool.query(text, params)

// ── Schema Bootstrap ─────────────────────────────────────────────────────────
async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      lat              DOUBLE PRECISION,
      lng              DOUBLE PRECISION,
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
      submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_votes (
      user_id   INTEGER NOT NULL REFERENCES users(id),
      report_id TEXT    NOT NULL REFERENCES reports(id),
      PRIMARY KEY (user_id, report_id)
    );

    CREATE TABLE IF NOT EXISTS officer_team (
      id         SERIAL PRIMARY KEY,
      officer_id INTEGER NOT NULL REFERENCES users(id),
      name       TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'Field Engineer',
      avatar     TEXT    NOT NULL DEFAULT '??',
      col        TEXT    NOT NULL DEFAULT '#3d7fff',
      load_pct   INTEGER NOT NULL DEFAULT 0,
      resolved   INTEGER NOT NULL DEFAULT 0
    );
  `)
  console.log('✅ PostgreSQL schema ready')
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next() })

// ── Multer ───────────────────────────────────────────────────────────────────
fs.mkdirSync(join(__dirname, 'uploads'), { recursive: true })
const upload = multer({
  dest: join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }
})

const PYTHON = process.platform === 'win32' ? 'python' : 'python3'
const INFERENCE_SCRIPT = join(__dirname, '..', 'model', 'inference (1).py')

// ── Auth Middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try { req.user = jwt.verify(header.slice(7), JWT_SECRET); next() }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }) }
}

function officerAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    if (payload.role !== 'officer') return res.status(403).json({ error: 'Officers only' })
    req.user = payload; next()
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }) }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function computePoints(userId) {
  const { rows } = await query('SELECT status, votes FROM reports WHERE user_id = $1', [userId])
  const count = rows.length
  const resolved = rows.filter(r => r.status === 'Resolved').length
  const upvotes = rows.reduce((a, r) => a + (r.votes || 0), 0)
  return count * 10 + resolved * 20 + upvotes * 2
}

function normalizeReport(r, currentUserId) {
  const STEP_MAP = { 'Submitted': 0, 'Verified': 1, 'Assigned': 2, 'In Progress': 3, 'Resolved': 4 }
  return {
    id: r.id, type: r.type, label: r.label, title: r.title,
    description: r.description, location: r.location, city: r.city,
    lat: r.lat, lng: r.lng, sev: r.sev, severity: r.sev,
    status: r.status, currentStep: STEP_MAP[r.status] ?? r.current_step,
    votes: r.votes, imageUrl: r.image_url, imgUrl: r.image_url,
    bg: r.bg || 'rgba(255,153,51,.1)', col: r.col || '#ff9933',
    imgGrad: r.img_grad || 'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
    assignedTo: r.assigned_to || null, resolutionNote: r.resolution_note || null,
    proofBeforeUrl: r.proof_before_url || null, proofAfterUrl: r.proof_after_url || null,
    dueDate: r.due_date || null, submittedAt: r.submitted_at, updatedAt: r.updated_at,
    authorName: r.author_name || null, authorAvatar: r.author_avatar || null,
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

function runInference(imagePath) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON, [INFERENCE_SCRIPT, imagePath])
    let stdout = '', stderr = ''
    py.stdout.on('data', c => stdout += c)
    py.stderr.on('data', c => stderr += c)
    py.on('close', code => {
      fs.unlink(imagePath, () => {})
      if (!stdout.trim()) return reject(new Error(stderr.trim() || `Inference exited with code ${code}`))
      try {
        const result = JSON.parse(stdout.trim())
        if (result.error) return reject(new Error(result.error))
        resolve(result)
      } catch { reject(new Error(`Failed to parse: ${stdout}`)) }
    })
    py.on('error', err => reject(new Error(`Spawn failed: ${err.message}`)))
  })
}

// ═════════════════════════════════════════════
//  CITIZEN AUTH
// ═════════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, name, city, avatar } = req.body
  if (!username || !email || !password || !name)
    return res.status(400).json({ error: 'username, email, password, name are required' })
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' })
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username: letters, numbers, underscores only' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (email.toLowerCase().endsWith('@gov.in'))
    return res.status(400).json({ error: 'Government emails must use the Officer Portal login' })

  try {
    const existing = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username.toLowerCase(), email.toLowerCase()])
    if (existing.rows.length) return res.status(409).json({ error: 'Username or email already taken' })

    const hashed = await bcrypt.hash(password, 10)
    const result = await query(
      'INSERT INTO users (username, email, password, name, city, avatar, role) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,username,name,email,city,avatar,streak,role',
      [username.toLowerCase(), email.toLowerCase(), hashed, name, city || 'Mumbai', avatar || name.slice(0, 2).toUpperCase(), 'citizen']
    )
    const user = result.rows[0]
    const token = jwt.sign({ id: user.id, username: user.username, role: 'citizen' }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ token, user: { ...user, points: 0 } })
  } catch (e) {
    res.status(409).json({ error: 'Username or email already taken' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })

  try {
    const result = await query('SELECT * FROM users WHERE username = $1 OR email = $1', [username.toLowerCase()])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'No account found with that username or email' })
    if (user.email.endsWith('@gov.in') || user.role === 'officer')
      return res.status(403).json({ error: 'Government accounts must login via the Officer Portal' })
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Incorrect password' })

    const token = jwt.sign({ id: user.id, username: user.username, role: 'citizen' }, JWT_SECRET, { expiresIn: '30d' })
    const points = await computePoints(user.id)
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, email: user.email, city: user.city, avatar: user.avatar, streak: user.streak, role: user.role, points } })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const { rows } = await query('SELECT id,username,name,email,city,avatar,streak,role FROM users WHERE id=$1', [req.user.id])
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    const points = await computePoints(req.user.id)
    res.json({ ...rows[0], points })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// ═════════════════════════════════════════════
//  OFFICER AUTH
// ═════════════════════════════════════════════

app.post('/api/officer/register', async (req, res) => {
  const { email, password, name, department, zone, avatar } = req.body
  if (!email || !password || !name) return res.status(400).json({ error: 'email, password, name are required' })
  if (!email.toLowerCase().endsWith('@gov.in')) return res.status(403).json({ error: 'Only @gov.in emails can register as officers' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  try {
    const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()])
    if (existing.rows.length) return res.status(409).json({ error: 'This officer email is already registered' })

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const av = avatar || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const hashed = await bcrypt.hash(password, 10)

    const result = await query(
      'INSERT INTO users (username,email,password,name,city,avatar,role,department,zone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,username,name,email,city,avatar,role,department,zone',
      [username, email.toLowerCase(), hashed, name, 'Mumbai', av, 'officer', department || 'Roads & Infrastructure', zone || 'Zone 4']
    )
    const user = result.rows[0]
    const token = jwt.sign({ id: user.id, username: user.username, role: 'officer' }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ token, officer: user })
  } catch (e) { res.status(409).json({ error: 'Officer account already exists for this email' }) }
})

app.post('/api/officer/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  if (!email.toLowerCase().endsWith('@gov.in')) return res.status(403).json({ error: 'Only @gov.in emails can access the Officer Portal' })

  try {
    const { rows } = await query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'No officer account found — please register first' })
    if (user.role !== 'officer') return res.status(403).json({ error: 'This account is not authorized as an officer' })
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Incorrect password' })

    const token = jwt.sign({ id: user.id, username: user.username, role: 'officer' }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, officer: { id: user.id, username: user.username, name: user.name, email: user.email, city: user.city, avatar: user.avatar, role: user.role, department: user.department || 'Roads & Infrastructure', zone: user.zone || 'Zone 4' } })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/officer/me', officerAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT id,username,name,email,city,avatar,role,department,zone FROM users WHERE id=$1', [req.user.id])
    if (!rows[0]) return res.status(404).json({ error: 'Officer not found' })
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// ═════════════════════════════════════════════
//  OFFICER REPORTS
// ═════════════════════════════════════════════

app.get('/api/officer/reports', officerAuth, async (req, res) => {
  const { status, sev, limit = 50, offset = 0 } = req.query
  let q = `SELECT r.*, u.name as author_name, u.avatar as author_avatar FROM reports r JOIN users u ON r.user_id = u.id WHERE 1=1`
  const params = []
  if (status && status !== 'all') { q += ` AND r.status = $${params.length + 1}`; params.push(status) }
  if (sev && sev !== 'all') { q += ` AND r.sev = $${params.length + 1}`; params.push(sev) }
  q += ` ORDER BY r.submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(Number(limit), Number(offset))

  try {
    const { rows } = await query(q, params)
    const countRes = await query('SELECT COUNT(*) as c FROM reports')
    res.json({ reports: rows.map(r => normalizeReport(r)), total: parseInt(countRes.rows[0].c) })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/officer/stats', officerAuth, async (_req, res) => {
  try {
    const [[total], [pending], [critical], [overdue], [resolved]] = await Promise.all([
      query('SELECT COUNT(*) as c FROM reports').then(r => r.rows),
      query("SELECT COUNT(*) as c FROM reports WHERE status != 'Resolved'").then(r => r.rows),
      query("SELECT COUNT(*) as c FROM reports WHERE sev = 'critical'").then(r => r.rows),
      query("SELECT COUNT(*) as c FROM reports WHERE due_date < NOW()::date AND status != 'Resolved'").then(r => r.rows),
      query("SELECT COUNT(*) as c FROM reports WHERE status = 'Resolved'").then(r => r.rows),
    ])
    const t = parseInt(total.c), r = parseInt(resolved.c)
    res.json({ total: t, pending: parseInt(pending.c), critical: parseInt(critical.c), overdue: parseInt(overdue.c), resolved: r, rate: t ? Math.round(r / t * 100) : 0 })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.patch('/api/officer/reports/:id/status', officerAuth, async (req, res) => {
  const { id } = req.params
  const { status, assignedTo, resolutionNote, proofBeforeUrl, proofAfterUrl, dueDate } = req.body
  const STEP_MAP = { 'Submitted': 0, 'Verified': 1, 'Assigned': 2, 'In Progress': 3, 'Resolved': 4 }

  try {
    const { rows: existing } = await query('SELECT id FROM reports WHERE id=$1', [id])
    if (!existing.length) return res.status(404).json({ error: 'Report not found' })

    await query(`
      UPDATE reports SET
        status           = COALESCE($1, status),
        current_step     = $2,
        assigned_to      = COALESCE($3, assigned_to),
        resolution_note  = COALESCE($4, resolution_note),
        proof_before_url = COALESCE($5, proof_before_url),
        proof_after_url  = COALESCE($6, proof_after_url),
        due_date         = COALESCE($7, due_date),
        updated_at       = NOW()
      WHERE id = $8
    `, [status || null, STEP_MAP[status] ?? 0, assignedTo || null, resolutionNote || null, proofBeforeUrl || null, proofAfterUrl || null, dueDate || null, id])

    const { rows } = await query('SELECT r.*, u.name as author_name, u.avatar as author_avatar FROM reports r JOIN users u ON r.user_id = u.id WHERE r.id=$1', [id])
    res.json(normalizeReport(rows[0]))
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/officer/team', officerAuth, async (req, res) => {
  try {
    let { rows: team } = await query('SELECT * FROM officer_team WHERE officer_id=$1', [req.user.id])
    if (team.length === 0) {
      const defaults = [
        { name: 'Sunil Patil', role: 'Field Engineer', av: 'SP', col: '#3d7fff', load: 80, resolved: 12 },
        { name: 'Rekha More', role: 'Infrastructure Officer', av: 'RM', col: '#f59e0b', load: 60, resolved: 9 },
        { name: 'Anil Sharma', role: 'Senior Engineer', av: 'AS', col: '#22c55e', load: 40, resolved: 18 },
        { name: 'Priya Nair', role: 'Field Officer', av: 'PN', col: '#a78bfa', load: 100, resolved: 7 },
        { name: 'Dev Kulkarni', role: 'Jr. Engineer', av: 'DK', col: '#2dd4bf', load: 20, resolved: 4 },
      ]
      for (const m of defaults) {
        await query('INSERT INTO officer_team (officer_id,name,role,avatar,col,load_pct,resolved) VALUES ($1,$2,$3,$4,$5,$6,$7)', [req.user.id, m.name, m.role, m.av, m.col, m.load, m.resolved])
      }
      const fresh = await query('SELECT * FROM officer_team WHERE officer_id=$1', [req.user.id])
      team = fresh.rows
    }
    const result = await Promise.all(team.map(async m => {
      const { rows } = await query("SELECT COUNT(*) as c FROM reports WHERE assigned_to=$1 AND status!='Resolved'", [m.name])
      return { id: m.id, name: m.name, role: m.role, avatar: m.avatar, col: m.col, load: m.load_pct, resolved: m.resolved, assigned: parseInt(rows[0].c) }
    }))
    res.json(result)
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// ═════════════════════════════════════════════
//  CITIZEN REPORTS
// ═════════════════════════════════════════════

app.get('/api/reports', auth, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM reports WHERE user_id=$1 ORDER BY submitted_at DESC', [req.user.id])
    res.json(rows.map(r => normalizeReport(r, req.user.id)))
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/reports', auth, async (req, res) => {
  const { type, label, title, description, location, city, lat, lng, sev, imageUrl, imgUrl, bg, col, imgGrad } = req.body
  if (!type || !title) return res.status(400).json({ error: 'type and title are required' })

  try {
    const maxRes = await query("SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_id FROM reports WHERE id LIKE 'CE-%'")
    const nextNum = (parseInt(maxRes.rows[0].max_id) || 2870) + 1
    const reportId = 'CE-' + nextNum

    await query(
      'INSERT INTO reports (id,user_id,type,label,title,description,location,city,lat,lng,sev,image_url,bg,col,img_grad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
      [reportId, req.user.id, type, label || type, title, description || '', location || '', city || 'Mumbai', lat || null, lng || null, sev || 'medium', imageUrl || imgUrl || null, bg || null, col || null, imgGrad || null]
    )
    const { rows } = await query('SELECT * FROM reports WHERE id=$1', [reportId])
    res.status(201).json(normalizeReport(rows[0], req.user.id))
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/reports/community', async (_req, res) => {
  try {
    const { rows } = await query('SELECT r.*, u.name as author_name, u.avatar as author_avatar FROM reports r JOIN users u ON r.user_id = u.id ORDER BY r.submitted_at DESC LIMIT 50')
    res.json(rows.map(r => normalizeReport(r)))
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// ── VOTES ────────────────────────────────────────────────────────────────────

app.post('/api/votes/:reportId', auth, async (req, res) => {
  const { reportId } = req.params
  try {
    const { rows: rep } = await query('SELECT id FROM reports WHERE id=$1', [reportId])
    if (!rep.length) return res.status(404).json({ error: 'Report not found' })

    const { rows: existing } = await query('SELECT * FROM user_votes WHERE user_id=$1 AND report_id=$2', [req.user.id, reportId])
    if (existing.length) {
      await query('DELETE FROM user_votes WHERE user_id=$1 AND report_id=$2', [req.user.id, reportId])
      await query('UPDATE reports SET votes = GREATEST(0, votes - 1), updated_at = NOW() WHERE id=$1', [reportId])
      res.json({ voted: false })
    } else {
      await query('INSERT INTO user_votes (user_id, report_id) VALUES ($1,$2)', [req.user.id, reportId])
      await query('UPDATE reports SET votes = votes + 1, updated_at = NOW() WHERE id=$1', [reportId])
      res.json({ voted: true })
    }
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/votes', auth, async (req, res) => {
  try {
    const { rows } = await query('SELECT report_id FROM user_votes WHERE user_id=$1', [req.user.id])
    res.json(rows.map(r => r.report_id))
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// ── LEADERBOARD ──────────────────────────────────────────────────────────────

app.get('/api/leaderboard', auth, async (req, res) => {
  try {
    const { rows: users } = await query("SELECT id,username,name,city,avatar FROM users WHERE role='citizen'")
    const board = await Promise.all(users.map(async u => {
      const { rows: reports } = await query('SELECT status, votes FROM reports WHERE user_id=$1', [u.id])
      const pts = reports.length * 10 + reports.filter(r => r.status === 'Resolved').length * 20 + reports.reduce((a, r) => a + (r.votes || 0), 0) * 2
      return { id: u.id, name: u.name, city: u.city, avatar: u.avatar, pts, reports: reports.length, resolved: reports.filter(r => r.status === 'Resolved').length, you: u.id === req.user.id, col: '#ff9933' }
    }))
    res.json(board.sort((a, b) => b.pts - a.pts))
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// ── AI PREDICTION ────────────────────────────────────────────────────────────

app.post('/api/predict', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image' })
  const imagePath = req.file.path
  try {
    const result = await runInference(imagePath)
    res.json(result)
  } catch (err) {
    fs.unlink(imagePath, () => {})
    res.status(500).json({ error: err.message })
  }
})

// ── HEALTH ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  db: 'postgresql (supabase)',
  model: fs.existsSync(join(__dirname, '..', 'model', 'severity_model_v3_67pct.pth'))
}))

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }))
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }) })

// ── Start ────────────────────────────────────────────────────────────────────

initSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ CivicEye API (PostgreSQL) running on http://localhost:${PORT}`)
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET ✓' : 'NOT SET ✗'}`)
  })
}).catch(err => {
  console.error('❌ Failed to initialize schema:', err)
  process.exit(1)
})
