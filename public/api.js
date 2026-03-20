/**
 * CivicEye API Client
 * Handles all communication with the backend (https://wcehackathon2026-cgpaglus.onrender.com)
 * Falls back to localStorage transparently if offline.
 */

const API = 'https://wcehackathon2026-cgpaglus.onrender.com'

// ── Token management ──────────────────────────────────────────────────────────
export function getToken() { return localStorage.getItem('ce_token') || null }
export function setToken(t) { localStorage.setItem('ce_token', t) }
export function clearToken() { localStorage.removeItem('ce_token') }

function authHeaders() {
  const t = getToken()
  return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function api(method, path, body) {
  const opts = { method, headers: authHeaders() }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API + path, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function apiLogin(username, password) {
  const data = await api('POST', '/api/auth/login', { username, password })
  setToken(data.token)
  localStorage.setItem('ce_user', JSON.stringify(data.user))
  return data.user
}

export async function apiRegister({ username, email, password, name, city, avatar }) {
  const data = await api('POST', '/api/auth/register', { username, email, password, name, city, avatar })
  setToken(data.token)
  localStorage.setItem('ce_user', JSON.stringify(data.user))
  return data.user
}

export async function apiMe() {
  const data = await api('GET', '/api/auth/me')
  localStorage.setItem('ce_user', JSON.stringify(data))
  return data
}

// ── Reports ───────────────────────────────────────────────────────────────────
export async function apiGetReports() {
  const data = await api('GET', '/api/reports')
  localStorage.setItem('ce_reports', JSON.stringify(data))
  return data
}

export async function apiCreateReport(report) {
  const data = await api('POST', '/api/reports', report)
  // Immediately update local cache
  const existing = JSON.parse(localStorage.getItem('ce_reports') || '[]')
  existing.unshift(data)
  localStorage.setItem('ce_reports', JSON.stringify(existing))
  return data
}

export async function apiGetCommunityReports() {
  return api('GET', '/api/reports/community')
}

// ── Votes ─────────────────────────────────────────────────────────────────────
export async function apiToggleVote(reportId) {
  return api('POST', '/api/votes/' + reportId)
}

export async function apiGetMyVotes() {
  const ids = await api('GET', '/api/votes')
  // Store as a map
  const map = {}
  ids.forEach(id => { map[id] = true })
  localStorage.setItem('ce_votes', JSON.stringify(map))
  return map
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function apiGetLeaderboard() {
  return api('GET', '/api/leaderboard')
}
