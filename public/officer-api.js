/**
 * CivicEye — Officer Dashboard API Integration
 * Drop this script at the end of officer.html (before </body>)
 * and it will wire up all backend calls automatically.
 */
;(function () {
  'use strict'

  const CE_API = 'http://localhost:4000'
  const getToken = () => localStorage.getItem('ce_token')
  const getOfficer = () => { try { return JSON.parse(localStorage.getItem('ce_officer') || 'null') } catch { return null } }

  function authH() {
    return { 'Authorization': 'Bearer ' + getToken(), 'Content-Type': 'application/json' }
  }

  async function apiCall(method, path, body) {
    const opts = { method, headers: authH() }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(CE_API + path, opts)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  // ── Auth Guard ────────────────────────────────────────────────────────────────
  function guardOfficer() {
    const token = getToken()
    const officer = getOfficer()
    if (!token || !officer) {
      window.location.replace('/')
      throw new Error('Not authenticated as officer')
    }
    return officer
  }

  // ── Populate officer identity in nav ─────────────────────────────────────────
  function populateOfficerIdentity(officer) {
    const av = officer.avatar || officer.name.slice(0, 2).toUpperCase()
    const el = document.getElementById('offAv')
    if (el) el.textContent = av
    const tnAv = document.getElementById('tnAv')
    if (tnAv) tnAv.textContent = av
    const offName = document.getElementById('offName')
    if (offName) offName.textContent = officer.name
    const offRole = document.getElementById('offRole')
    if (offRole) offRole.textContent = officer.department || 'Government Officer'
  }

  // ── Load stats from backend ───────────────────────────────────────────────────
  async function loadStats() {
    try {
      const s = await apiCall('GET', '/api/officer/stats')
      // Re-render the stats strip with real data
      const strip = document.getElementById('statsStrip')
      if (!strip) return
      const CELLS = [
        { ico: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, col: 'var(--ind-green)', bg: 'var(--gov-g)', v: s.total, l: 'Total Reports', d: 'All zones', dt: 'up' },
        { ico: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`, col: 'var(--amber)', bg: 'var(--amber-bg)', v: s.pending, l: 'Pending Action', d: 'Needs attention', dt: 'neu' },
        { ico: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`, col: 'var(--red)', bg: 'var(--red-bg)', v: s.critical, l: 'Critical Issues', d: 'Immediate action', dt: 'dn' },
        { ico: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5l3 3"/></svg>`, col: '#f97316', bg: 'rgba(249,115,22,.1)', v: s.overdue, l: 'Overdue SLA', d: 'Past deadline', dt: 'dn' },
        { ico: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, col: 'var(--grn)', bg: 'var(--grn-bg)', v: s.rate + '%', l: 'Resolution Rate', d: 'This month', dt: 'up' },
      ]
      strip.innerHTML = CELLS.map(c => `<div class="sc"><div class="sc-ico" style="background:${c.bg};color:${c.col}">${c.ico}</div><div><div class="sc-val">${c.v}</div><div class="sc-lbl">${c.l}</div><div class="sc-delta ${c.dt === 'up' ? 'd-up' : c.dt === 'dn' ? 'd-dn' : 'd-neu'}">${c.d}</div></div></div>`).join('')

      // Officer hero stats
      const cu = (id, v) => { const el = document.getElementById(id); if (!el) return; let n = 0; const step = Math.max(1, v / 40); const iv = setInterval(() => { n = Math.min(n + step, v); el.textContent = Math.round(n); if (n >= v) clearInterval(iv) }, 22) }
      cu('os3a', s.pending)
      cu('os3b', s.resolved)
      cu('os3c', s.overdue)
      const urgEl = document.getElementById('urgCount')
      if (urgEl) urgEl.textContent = s.critical

      // Performance ring
      const pct = s.rate, circ = 175.93, filled = (pct / 100) * circ
      setTimeout(() => {
        const ring = document.getElementById('perfRing')
        if (ring) { ring.style.transition = 'stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)'; ring.setAttribute('stroke-dasharray', filled + ' ' + circ) }
        const pEl = document.getElementById('perfPct'); if (pEl) { let n = 0; const iv = setInterval(() => { n = Math.min(n + 1, pct); pEl.textContent = n + '%'; if (n >= pct) clearInterval(iv) }, 25) }
        const pvEl = document.getElementById('perfVal'); if (pvEl) pvEl.textContent = s.resolved + ' / ' + s.total
        const psEl = document.getElementById('perfSub'); if (psEl) psEl.textContent = 'Avg 3.2 days resolution · Zone 4'
        const sBar = document.getElementById('slaCompBar'); if (sBar) { sBar.style.transition = 'width 1.1s cubic-bezier(.4,0,.2,1)'; sBar.style.width = Math.round(pct * .88) + '%' }
        const sVal = document.getElementById('slaCompVal'); if (sVal) sVal.textContent = Math.round(pct * .88) + '%'
      }, 700)
    } catch (e) {
      console.warn('loadStats error:', e.message)
    }
  }

  // ── SEV / status helpers (mirrors officer.html) ───────────────────────────────
  const SM = {
    'Submitted': { col: '#7a8699', bg: 'rgba(122,134,153,.12)' },
    'Verified': { col: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
    'Assigned': { col: '#3d7fff', bg: 'rgba(61,127,255,.12)' },
    'In Progress': { col: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    'Resolved': { col: '#22c55e', bg: 'rgba(34,197,94,.12)' },
  }
  const SEV_COLOR = { critical: '#f43f5e', high: '#f97316', medium: '#f59e0b', low: '#22c55e' }
  const SEV_BG = { critical: 'rgba(244,63,94,.13)', high: 'rgba(249,115,22,.12)', medium: 'rgba(245,158,11,.12)', low: 'rgba(34,197,94,.12)' }
  const TICO = {
    pothole: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="15" rx="8" ry="3.5"/><path d="M4 15c0-3 3.6-9 8-9s8 6 8 9"/></svg>`,
    light: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="4" x2="12" y2="20"/><path d="M12 4 Q18 4 18 10" fill="none"/><circle cx="18" cy="10" r="2.5"/><path d="M9 20h6"/></svg>`,
    waste: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="6" y="8" width="12" height="12" rx="2"/><path d="M4 8h16M10 4h4"/></svg>`,
    water: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12h18"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/></svg>`,
    drain: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="15" width="18" height="4" rx="1"/><path d="M6 15V11M9 15V8M12 15V11M15 15V7M18 15V11" opacity=".7"/></svg>`,
    road: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 20l4-16h10l4 16"/><path d="M7 14h10" opacity=".5"/></svg>`,
    park: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c-3.3 0-6 2.7-6 6 0 2.2 1.2 4.1 3 5.2V19h6v-4.8c1.8-1.1 3-3 3-5.2 0-3.3-2.7-6-6-6z"/></svg>`,
    noise: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>`,
  }

  function relativeTime(isoStr) {
    if (!isoStr) return ''
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
    if (diff < 3600) return Math.round(diff / 60) + 'm ago'
    if (diff < 86400) return Math.round(diff / 3600) + 'h ago'
    return Math.round(diff / 86400) + ' days ago'
  }

  // ── Build a report card (officer view) ───────────────────────────────────────
  function mkRc(r) {
    const sm = SM[r.status] || SM['Submitted']
    const ico = TICO[r.type] || TICO.pothole
    const age = relativeTime(r.submittedAt)
    const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'Resolved'
    return `<div class="rc ${r.sev === 'critical' ? 'sev-critical' : r.sev === 'high' ? 'sev-high' : ''} rv" data-report-id="${r.id}">
      <div class="rc-photo"><div class="rc-photo-inner" style="background:${r.imgGrad};width:100%;height:100%"></div>
        <div class="rc-overlay"></div>
        <div class="rc-photo-badges">
          <span class="rc-sev sev-${r.sev}">${r.sev}</span>
          ${isOverdue ? '<span class="rc-overdue-tag">OVERDUE</span>' : ''}
        </div>
        <div class="rc-st-overlay"><span class="rc-st" style="background:${sm.bg};color:${sm.col}">${r.status}</span></div>
      </div>
      <div class="rc-body">
        <div class="rc-row1">
          <div class="rc-ico" style="background:${r.bg};color:${r.col}">${ico}</div>
          <div class="rc-meta">
            <div class="rc-title">${r.title}</div>
            <div class="rc-loc"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>${r.location}${age ? ' · ' + age : ''}</div>
          </div>
        </div>
        <div class="rc-desc">${r.description}</div>
      </div>
      <div class="rc-foot">
        <div class="rc-id">${r.id}${r.assignedTo ? ` · <span style="color:var(--txt2)">${r.assignedTo}</span>` : ''}</div>
        <div style="display:flex;align-items:center;gap:5px">
          ${r.votes > 0 ? `<div class="rc-votes"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/></svg>${r.votes}</div>` : ''}
        </div>
        <div class="rc-actions">
          ${r.status === 'Submitted' || r.status === 'Verified' ? `<button class="act-btn act-assign" data-id="${r.id}" data-act="assign">Assign</button>` : ''}
          ${r.status === 'Assigned' || r.status === 'In Progress' ? `<button class="act-btn act-proof" data-id="${r.id}" data-act="proof">Upload Proof</button>` : ''}
          ${r.status === 'Resolved' ? `<button class="act-btn act-view" data-id="${r.id}" data-act="view">View Proof</button>` : ''}
          ${r.status !== 'Resolved' ? `<button class="act-btn act-escalate" data-id="${r.id}" data-act="escalate">Escalate</button>` : ''}
        </div>
      </div>
    </div>`
  }

  // ── Cache of backend reports ──────────────────────────────────────────────────
  let ALL_REPORTS = []

  async function loadReports() {
    try {
      const { reports } = await apiCall('GET', '/api/officer/reports?limit=50')
      ALL_REPORTS = reports
      // Override the local REPORTS array used by other dashboard functions
      if (window.REPORTS !== undefined) {
        window.REPORTS.length = 0
        reports.forEach(r => window.REPORTS.push(adaptReport(r)))
      }
      renderFeedFromBackend()
      buildSlaListFromBackend()
    } catch (e) {
      console.warn('loadReports error:', e.message)
      // Fall back to static REPORTS already in the page
      window.REPORTS && renderFeed && renderFeed()
    }
  }

  // Adapt backend shape → officer-dashboard shape
  function adaptReport(r) {
    return {
      ...r,
      desc: r.description,
      age: relativeTime(r.submittedAt),
      overdue: r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'Resolved',
      dueDate: r.dueDate || 'Tomorrow',
      imgGrad: r.imgGrad || 'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
    }
  }

  // ── Render feed from backend data ─────────────────────────────────────────────
  let rfPage = 0, rfFilter = 'all', rfAll = []

  function filterReports(filter) {
    let data = [...ALL_REPORTS]
    if (filter === 'new') data = data.filter(r => r.status === 'Submitted')
    else if (filter === 'critical') data = data.filter(r => r.sev === 'critical')
    else if (filter === 'high') data = data.filter(r => r.sev === 'high' || r.sev === 'critical')
    else if (filter === 'overdue') data = data.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'Resolved')
    else if (filter === 'inprog') data = data.filter(r => r.status === 'In Progress' || r.status === 'Assigned')
    else if (filter === 'resolved') data = data.filter(r => r.status === 'Resolved')
    return data
  }

  function renderFeedFromBackend(filter) {
    filter = filter || rfFilter
    rfFilter = filter
    rfAll = filterReports(filter)
    const PAGE_SIZE = 4
    const s = rfPage * PAGE_SIZE, e = Math.min(s + PAGE_SIZE, rfAll.length)
    const slice = rfAll.slice(s, e)
    const list = document.getElementById('reportList')
    if (list) list.innerHTML = slice.map(r => mkRc(r)).join('')
    const feedSub = document.getElementById('feedSub')
    if (feedSub) feedSub.textContent = `${rfAll.length} reports · Zone 4 · Mumbai`
    const pi = document.getElementById('pgInfo')
    if (pi) pi.innerHTML = `<span>${rfAll.length ? s + 1 : 0}–${e}</span> of ${rfAll.length}`
    const prev = document.getElementById('pgPrev'), next = document.getElementById('pgNext')
    if (prev) { prev.disabled = rfPage === 0; prev.style.opacity = rfPage === 0 ? '.3' : '1' }
    if (next) { next.disabled = e >= rfAll.length; next.style.opacity = e >= rfAll.length ? '.3' : '1' }
    if (window.rev) setTimeout(window.rev, 60)
  }

  function buildSlaListFromBackend() {
    const due = ALL_REPORTS.filter(r => r.status !== 'Resolved').slice(0, 4)
    const el = document.getElementById('slaList')
    if (!el) return
    if (!due.length) { el.innerHTML = '<div style="padding:8px 0;font-size:11px;color:var(--txt3)">No SLA due today 🎉</div>'; return }
    el.innerHTML = due.map(r => {
      const ico = TICO[r.type] || TICO.pothole
      const isOverdue = r.dueDate && new Date(r.dueDate) < new Date()
      const tc = isOverdue ? 'sla-overdue' : r.sev === 'critical' ? 'sla-warn' : 'sla-ok'
      return `<div class="sla-item"><div class="sla-ico" style="background:${r.bg};color:${r.col}">${ico}</div>
        <div class="sla-bd"><div class="sla-t">${r.title}</div><div class="sla-s">${r.id} · ${r.location}</div></div>
        <div><div class="sla-time ${tc}">${isOverdue ? 'OVERDUE' : r.sev === 'critical' ? 'Urgent' : 'Pending'}</div></div></div>`
    }).join('')
  }

  // ── Load team from backend ────────────────────────────────────────────────────
  async function loadTeam() {
    try {
      const team = await apiCall('GET', '/api/officer/team')
      // Override static TEAM array
      if (window.TEAM !== undefined) {
        window.TEAM.length = 0
        team.forEach(m => window.TEAM.push({ name: m.name, role: m.role, av: m.avatar, col: m.col, assigned: m.assigned, resolved: m.resolved, load: m.load }))
      }
      // Rebuild team panels if currently visible
      if (typeof window.buildTeamPanel === 'function') window.buildTeamPanel()
    } catch (e) {
      console.warn('loadTeam error:', e.message)
    }
  }

  // ── Status update via API ─────────────────────────────────────────────────────
  async function updateReportStatus(reportId, payload) {
    try {
      const updated = await apiCall('PATCH', `/api/officer/reports/${reportId}/status`, payload)
      // Patch in cache
      const idx = ALL_REPORTS.findIndex(r => r.id === reportId)
      if (idx !== -1) ALL_REPORTS[idx] = { ...ALL_REPORTS[idx], ...updated }
      return updated
    } catch (e) {
      console.error('updateReportStatus error:', e.message)
      throw e
    }
  }

  // ── Override proof modal submit ───────────────────────────────────────────────
  function wireProofModal() {
    const submitBtn = document.getElementById('proofSubmitBtn')
    if (!submitBtn) return
    // Remove existing listener by cloning
    const fresh = submitBtn.cloneNode(true)
    submitBtn.parentNode.replaceChild(fresh, submitBtn)

    fresh.addEventListener('click', async () => {
      const note = document.getElementById('proofNote')?.value
      if (!note?.trim()) { if (window.toast) window.toast('Please add a resolution note'); return }
      const status = document.getElementById('proofStatus')?.value || 'Resolved'
      const engineer = document.getElementById('proofEngineer')?.value || ''
      const dateVal = document.getElementById('proofDate')?.value || ''
      const reportId = document.getElementById('proofModalBg')?.dataset?.reportId
      if (!reportId) { if (window.toast) window.toast('No report selected'); return }

      fresh.textContent = 'Submitting…'
      fresh.disabled = true
      try {
        await updateReportStatus(reportId, {
          status,
          assignedTo: engineer || undefined,
          resolutionNote: note,
          dueDate: dateVal || undefined,
        })
        document.getElementById('proofModalBg')?.classList.remove('open')
        renderFeedFromBackend()
        buildSlaListFromBackend()
        await loadStats()
        if (window.toast) window.toast('Resolution proof submitted — citizens notified!')
      } catch (e) {
        if (window.toast) window.toast('Error: ' + e.message)
      }
      fresh.textContent = 'Submit Resolution Proof'
      fresh.disabled = false
    })
  }

  // ── Override openProofModal to track which report ─────────────────────────────
  function wireOpenProofModal() {
    window.openProofModal = function (r) {
      if (!r) return
      const bg = document.getElementById('proofModalBg')
      if (!bg) return
      bg.dataset.reportId = r.id || r.id
      const info = document.getElementById('proofReportInfo')
      if (info) info.textContent = `${r.id} · ${r.title}`
      const dateEl = document.getElementById('proofDate')
      if (dateEl) dateEl.value = new Date().toISOString().split('T')[0]
      const noteEl = document.getElementById('proofNote')
      if (noteEl) noteEl.value = ''
      bg.classList.add('open')
    }
  }

  // ── Wire feed pagination & filters ───────────────────────────────────────────
  function wireFeedInteractions() {
    document.getElementById('pgPrev')?.addEventListener('click', () => {
      if (rfPage > 0) { rfPage--; renderFeedFromBackend() }
    })
    document.getElementById('pgNext')?.addEventListener('click', () => {
      const end = (rfPage + 1) * 4
      if (end < rfAll.length) { rfPage++; renderFeedFromBackend() }
    })
    document.getElementById('feedFilters')?.addEventListener('click', e => {
      const c = e.target.closest('.fchip')
      if (!c) return
      rfFilter = c.dataset.f; rfPage = 0
      document.querySelectorAll('#feedFilters .fchip').forEach(x => x.classList.remove('on'))
      c.classList.add('on')
      renderFeedFromBackend(rfFilter)
    })
    document.getElementById('feedRefreshBtn')?.addEventListener('click', async () => {
      rfPage = 0
      await loadReports()
      await loadStats()
      if (window.toast) window.toast('Feed refreshed from server')
    })
    // Delegated action clicks on report list
    document.getElementById('reportList')?.addEventListener('click', async e => {
      const btn = e.target.closest('[data-act]')
      if (!btn) return
      const id = btn.dataset.id
      const r = ALL_REPORTS.find(x => x.id === id)
      if (!r) return
      const act = btn.dataset.act
      if (act === 'assign') {
        // Pick least-loaded team member
        const team = window.TEAM || []
        const avail = team.filter(t => t.load < 100)[0]
        const assignTo = avail ? avail.name : 'Field Team'
        try {
          await updateReportStatus(id, { status: 'Assigned', assignedTo: assignTo })
          renderFeedFromBackend()
          if (window.toast) window.toast(`${id} assigned to ${assignTo}`)
        } catch (err) { if (window.toast) window.toast('Error: ' + err.message) }
      } else if (act === 'proof') {
        window.openProofModal(r)
      } else if (act === 'view') {
        if (window.toast) window.toast('Resolution proof already uploaded for ' + id)
      } else if (act === 'escalate') {
        try {
          await updateReportStatus(id, { status: 'In Progress' })
          renderFeedFromBackend()
          if (window.toast) window.toast(id + ' escalated to Commissioner\'s office')
        } catch (err) { if (window.toast) window.toast('Error: ' + err.message) }
      }
    })
  }

  // ── Sign-out ──────────────────────────────────────────────────────────────────
  function wireSignOut() {
    document.getElementById('signOutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('ce_token')
      localStorage.removeItem('ce_officer')
      if (window.toast) window.toast('Signing out…')
      setTimeout(() => { window.location.href = '/' }, 800)
    })
  }

  // ── BOOT ─────────────────────────────────────────────────────────────────────
  async function boot() {
    const officer = guardOfficer()
    populateOfficerIdentity(officer)
    wireOpenProofModal()
    wireProofModal()
    wireFeedInteractions()
    wireSignOut()

    // Load data in parallel
    await Promise.all([loadStats(), loadReports(), loadTeam()])
    if (window.toast) window.toast(`Welcome, ${officer.name}!`, 2000)
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    // Give the page's own scripts a moment to set up their globals
    setTimeout(boot, 50)
  }
})()
