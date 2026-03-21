import { useState } from 'react'

const API = 'https://wcehackathon2026-cgpaglus.onrender.com'

interface LoginProps {
    onShowToast: (msg: string) => void
}

export default function Login({ onShowToast }: LoginProps) {
    // main tab: 'l' = citizen login, 'r' = citizen register, 'g' = govt officer
    const [tab, setTab] = useState<'l' | 'r' | 'g'>('l')

    // citizen login
    const [username, setUsername] = useState('')
    const [pass, setPass] = useState('')

    // citizen register
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [regUsername, setRegUsername] = useState('')
    const [regCity, setRegCity] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPass, setRegPass] = useState('')
    const [agreed, setAgreed] = useState(false)
    const [passErr, setPassErr] = useState('')

    // govt officer
    const [govSubTab, setGovSubTab] = useState<'login' | 'reg'>('login')
    const [govEmail, setGovEmail] = useState('')
    const [govPass, setGovPass] = useState('')
    const [govFirst, setGovFirst] = useState('')
    const [govLast, setGovLast] = useState('')
    const [govRegEmail, setGovRegEmail] = useState('')
    const [govRegPass, setGovRegPass] = useState('')
    const [govDept, setGovDept] = useState('Roads & Infrastructure')
    const [govZone, setGovZone] = useState('Zone 4')
    const [govPassErr, setGovPassErr] = useState('')

    const [loading, setLoading] = useState(false)

    const isGovEmail = (e: string) => e.toLowerCase().endsWith('@gov.in')

    // ── Citizen Login ────────────────────────────────────────────────────────
    const doLogin = async () => {
        if (!username || !pass) { onShowToast('Please fill in all fields'); return }
        setLoading(true)
<<<<<<< HEAD
=======
        localStorage.removeItem('ce_token')
        localStorage.removeItem('ce_user')
>>>>>>> origin/param
        if (isGovEmail(username)) {
            onShowToast('Government email? Use the "Government Officer" tab instead.')
            setLoading(false); return
        }
        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pass })
            })
            const data = await res.json()
            if (!res.ok) { onShowToast(data.error || 'Login failed'); setLoading(false); return }
            localStorage.setItem('ce_token', data.token)
            localStorage.setItem('ce_user', JSON.stringify(data.user))
            localStorage.removeItem('ce_reports')
            localStorage.removeItem('ce_votes')
            onShowToast(`Welcome back, ${data.user.name}! Redirecting...`)
            setTimeout(() => { window.location.href = '/dashboard.html' }, 900)
        } catch {
            onShowToast('Cannot connect to server. Is the backend running?')
        }
        setLoading(false)
    }

    // ── Citizen Register ─────────────────────────────────────────────────────
    const doReg = async () => {
        if (!firstName || !regUsername || !regEmail || !regCity || !regPass) { onShowToast('Please fill in all required fields'); return }
        if (isGovEmail(regEmail)) { onShowToast('Government email? Use the "Government Officer" tab instead.'); return }
        if (regUsername.length < 3) { onShowToast('Username must be at least 3 characters'); return }
        if (!/^[a-zA-Z0-9_]+$/.test(regUsername)) { onShowToast('Username: letters, numbers and underscores only'); return }
        if (!agreed) { onShowToast('Please agree to the Terms of Service'); return }
        if (regPass.length < 8) { setPassErr('Min 8 characters'); return }
        setPassErr('')
        setLoading(true)
<<<<<<< HEAD
=======
        localStorage.removeItem('ce_token')
        localStorage.removeItem('ce_user')
>>>>>>> origin/param
        const fullName = firstName + (lastName ? ' ' + lastName : '')
        const initials = (firstName[0] + (lastName[0] || firstName[1] || '')).toUpperCase()
        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regUsername.toLowerCase(), email: regEmail, password: regPass, name: fullName, city: regCity, avatar: initials })
            })
            const data = await res.json()
            if (!res.ok) { onShowToast(data.error || 'Registration failed'); setLoading(false); return }
            localStorage.setItem('ce_token', data.token)
            localStorage.setItem('ce_user', JSON.stringify(data.user))
            localStorage.removeItem('ce_reports')
            localStorage.removeItem('ce_votes')
            onShowToast(`Account created! Welcome, ${firstName}!`)
            setTimeout(() => { window.location.href = '/dashboard.html' }, 900)
        } catch {
            onShowToast('Cannot connect to server. Is the backend running?')
        }
        setLoading(false)
    }

    // ── Officer Login ────────────────────────────────────────────────────────
    const doGovLogin = async () => {
        if (!govEmail || !govPass) { onShowToast('Please fill in all fields'); return }
        if (!isGovEmail(govEmail)) { onShowToast('Only @gov.in email addresses can access the Officer Portal'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API}/api/officer/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: govEmail, password: govPass })
            })
            const data = await res.json()
            if (!res.ok) { onShowToast(data.error || 'Officer login failed'); setLoading(false); return }
            localStorage.setItem('ce_token', data.token)
            localStorage.setItem('ce_officer', JSON.stringify(data.officer))
            localStorage.removeItem('ce_user')
            localStorage.removeItem('ce_reports')
            onShowToast(`Welcome, ${data.officer.name}! Redirecting to Officer Portal...`)
            setTimeout(() => { window.location.href = '/officer.html' }, 900)
        } catch {
            onShowToast('Cannot connect to server. Is the backend running?')
        }
        setLoading(false)
    }

    // ── Officer Register ─────────────────────────────────────────────────────
    const doGovReg = async () => {
        if (!govFirst || !govRegEmail || !govRegPass) { onShowToast('Please fill in all required fields'); return }
        if (!isGovEmail(govRegEmail)) { onShowToast('Only @gov.in email addresses can register as officers'); return }
        if (govRegPass.length < 8) { setGovPassErr('Min 8 characters'); return }
        setGovPassErr('')
        setLoading(true)
        const name = govFirst + (govLast ? ' ' + govLast : '')
        try {
            const res = await fetch(`${API}/api/officer/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: govRegEmail, password: govRegPass, name, department: govDept, zone: govZone })
            })
            const data = await res.json()
            if (!res.ok) { onShowToast(data.error || 'Registration failed'); setLoading(false); return }
            localStorage.setItem('ce_token', data.token)
            localStorage.setItem('ce_officer', JSON.stringify(data.officer))
            localStorage.removeItem('ce_user')
            onShowToast(`Officer account created! Welcome, ${data.officer.name}!`)
            setTimeout(() => { window.location.href = '/officer.html' }, 900)
        } catch {
            onShowToast('Cannot connect to server. Is the backend running?')
        }
        setLoading(false)
    }

    const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Surat', 'Nagpur', 'Indore', 'Other']
    const depts = ['Roads & Infrastructure', 'Water Supply & Sewerage', 'Solid Waste Management', 'Streetlights & Electrical', 'Parks & Gardens', 'Health & Sanitation', 'Storm Water Drains', 'Building & Permissions']
    const zones = ['Zone 1 — South Mumbai', 'Zone 2 — Island City', 'Zone 3 — Western Suburbs (S)', 'Zone 4 — Western Suburbs (N)', 'Zone 5 — Eastern Suburbs (S)', 'Zone 6 — Eastern Suburbs (N)']

    // Gov portal note banner
    const GovNote = ({ children }: { children: React.ReactNode }) => (
        <div style={{ background: 'rgba(19,136,8,.08)', border: '.5px solid rgba(19,136,8,.22)', borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
            <svg style={{ flexShrink: 0, color: '#138808', marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <div style={{ fontSize: 11, color: 'var(--txt2)', lineHeight: 1.6 }}>{children}</div>
        </div>
    )

    return (
        <section className="ce-login-sec" id="login">
            <svg className="ce-login-corner" viewBox="0 0 400 400" fill="none">
                <g transform="translate(200,200)">
                    {[0, 30, 60, 90, 120, 150].map(r => (
                        <ellipse key={r} rx="140" ry="50" stroke="#ff9933" strokeWidth="1" transform={r ? `rotate(${r})` : undefined} />
                    ))}
                    <circle r="30" stroke="#ff9933" strokeWidth="1" />
                    <circle r="60" stroke="#ff9933" strokeWidth=".5" strokeDasharray="6 6" />
                </g>
            </svg>

            <div className="ce-lgrid">
                {/* LEFT */}
                <div className="rvl">
                    <div className="ce-sec-ey">Join the Platform</div>
                    <h2 className="ce-sec-t" style={{ marginBottom: 14 }}>Your city needs<br />your voice.</h2>
                    <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--txt2)', lineHeight: 1.85, marginBottom: 36 }}>
                        Thousands of citizens across India are driving faster resolutions, stronger accountability,
                        and more responsive governance. Add your voice today.
                    </p>
                    <div className="tlist" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                        {[
                            'Free for all citizens — always',
                            'Real-time updates on every report',
                            'Verified government system integration',
                            'Anonymous reporting available',
                            'Works on every device and browser',
                        ].map(t => (
                            <div key={t} className="ce-trow">
                                <div className="ce-tpip" />
                                {t}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT — auth card */}
                <div className="ce-lcard rvr">
                    {/* THREE TABS */}
                    <div className="ce-tabs" style={{ display: 'flex' }}>
                        <button className={`ce-tab${tab === 'l' ? ' on' : ''}`} onClick={() => setTab('l')} style={{ flex: 1 }}>Sign In</button>
                        <button className={`ce-tab${tab === 'r' ? ' on' : ''}`} onClick={() => setTab('r')} style={{ flex: 1 }}>Register</button>
                        <button
                            className={`ce-tab${tab === 'g' ? ' on' : ''}`}
                            onClick={() => setTab('g')}
                            style={{
                                flex: 1,
                                color: tab === 'g' ? '#138808' : 'var(--txt3)',
                                background: tab === 'g' ? 'rgba(19,136,8,.08)' : 'transparent',
                                borderTop: tab === 'g' ? '2px solid #138808' : undefined,
                                fontSize: 11,
                            }}
                        >
                            🏛️ Gov Officer
                        </button>
                    </div>

                    {/* ── CITIZEN LOGIN ── */}
                    {tab === 'l' && (
                        <>
                            <label className="ce-field-lbl">Email or Username</label>
                            <input type="text" className="ce-field" placeholder="your_username or email"
                                value={username} onChange={e => setUsername(e.target.value)} />
                            <label className="ce-field-lbl">Password</label>
                            <input type="password" className="ce-field" placeholder="Your password"
                                value={pass} onChange={e => setPass(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && doLogin()} />
                            <button className="ce-bsub" onClick={doLogin} disabled={loading}>
                                {loading ? 'Signing in…' : 'Sign In to CivicEye'}
                            </button>
                            <div className="ce-cf">
                                No account yet?{' '}
                                <a href="#" onClick={e => { e.preventDefault(); setTab('r') }}>Sign up free</a>
                                {' · '}
                                <a href="#" onClick={e => { e.preventDefault(); setTab('g') }} style={{ color: '#138808' }}>Officer login →</a>
                            </div>
                        </>
                    )}

                    {/* ── CITIZEN REGISTER ── */}
                    {tab === 'r' && (
                        <>
                            <div className="ce-f2col">
                                <div>
                                    <label className="ce-field-lbl">First Name *</label>
                                    <input type="text" className="ce-field" placeholder="Arjun" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="ce-field-lbl">Last Name</label>
                                    <input type="text" className="ce-field" placeholder="Sharma" value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                            </div>
                            <label className="ce-field-lbl">Username *</label>
                            <input type="text" className="ce-field" placeholder="arjun_sharma" value={regUsername} onChange={e => setRegUsername(e.target.value)} />
                            <label className="ce-field-lbl">Email Address *</label>
                            <input type="email" className="ce-field" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                            <label className="ce-field-lbl">Your City *</label>
                            <select className="ce-field" value={regCity} onChange={e => setRegCity(e.target.value)}>
                                <option value="">Select your city</option>
                                {cities.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <label className="ce-field-lbl">
                                Password *{' '}
                                {passErr && <span style={{ color: '#f43f5e', fontSize: '10px', fontWeight: 'normal' }}>{passErr}</span>}
                            </label>
                            <input type="password" className="ce-field" placeholder="Minimum 8 characters" value={regPass} onChange={e => { setRegPass(e.target.value); setPassErr('') }} />
                            <div className="ce-chkrow">
                                <input type="checkbox" id="tc" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                                <label htmlFor="tc">
                                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                                </label>
                            </div>
                            <button className="ce-bsub" onClick={doReg} disabled={loading}>
                                {loading ? 'Creating account…' : 'Create My Account'}
                            </button>
                            <div className="ce-cf">
                                Already have an account?{' '}
                                <a href="#" onClick={e => { e.preventDefault(); setTab('l') }}>Sign in</a>
                            </div>
                        </>
                    )}

                    {/* ── GOVERNMENT OFFICER ── */}
                    {tab === 'g' && (
                        <>
                            {/* Gov sub-tabs */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(19,136,8,.06)', borderRadius: 10, padding: 4 }}>
                                <button onClick={() => setGovSubTab('login')} style={{
                                    flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
                                    background: govSubTab === 'login' ? 'rgba(19,136,8,.18)' : 'transparent',
                                    color: govSubTab === 'login' ? '#138808' : 'var(--txt3)',
                                }}>Sign In</button>
                                <button onClick={() => setGovSubTab('reg')} style={{
                                    flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
                                    background: govSubTab === 'reg' ? 'rgba(19,136,8,.18)' : 'transparent',
                                    color: govSubTab === 'reg' ? '#138808' : 'var(--txt3)',
                                }}>Register</button>
                            </div>

                            {govSubTab === 'login' ? (
                                <>
                                    <GovNote>
                                        <strong style={{ color: 'var(--txt)', display: 'block', marginBottom: 2 }}>Government Officers Only</strong>
                                        Sign in with your official <code style={{ fontSize: 10, background: 'rgba(19,136,8,.15)', padding: '1px 4px', borderRadius: 3 }}>@gov.in</code> email to access the Officer Portal.
                                    </GovNote>
                                    <label className="ce-field-lbl">Official Email</label>
                                    <input type="email" className="ce-field" placeholder="name@department.gov.in"
                                        value={govEmail} onChange={e => setGovEmail(e.target.value)} />
                                    <label className="ce-field-lbl">Password</label>
                                    <input type="password" className="ce-field" placeholder="Your password"
                                        value={govPass} onChange={e => setGovPass(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && doGovLogin()} />
                                    <button className="ce-bsub" onClick={doGovLogin} disabled={loading}
                                        style={{ background: 'linear-gradient(135deg,#138808,#074c04)', boxShadow: loading ? 'none' : '0 4px 20px rgba(19,136,8,.35)' }}>
                                        {loading ? 'Signing in…' : '🏛️ Sign In to Officer Portal'}
                                    </button>
                                    <div className="ce-cf">
                                        First time?{' '}
                                        <a href="#" onClick={e => { e.preventDefault(); setGovSubTab('reg') }} style={{ color: '#138808' }}>Register your officer account →</a>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <GovNote>
                                        <strong style={{ color: 'var(--txt)', display: 'block', marginBottom: 2 }}>First-Time Registration</strong>
                                        Register with your official government email. Only <code style={{ fontSize: 10, background: 'rgba(19,136,8,.15)', padding: '1px 4px', borderRadius: 3 }}>@gov.in</code> addresses are accepted.
                                    </GovNote>
                                    <div className="ce-f2col">
                                        <div>
                                            <label className="ce-field-lbl">First Name *</label>
                                            <input type="text" className="ce-field" placeholder="Rajesh" value={govFirst} onChange={e => setGovFirst(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="ce-field-lbl">Last Name</label>
                                            <input type="text" className="ce-field" placeholder="Kumar" value={govLast} onChange={e => setGovLast(e.target.value)} />
                                        </div>
                                    </div>
                                    <label className="ce-field-lbl">Official Email *</label>
                                    <input type="email" className="ce-field" placeholder="rajesh.kumar@mcgm.gov.in"
                                        value={govRegEmail} onChange={e => setGovRegEmail(e.target.value)} />
                                    <label className="ce-field-lbl">Department</label>
                                    <select className="ce-field" value={govDept} onChange={e => setGovDept(e.target.value)}>
                                        {depts.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <label className="ce-field-lbl">Zone</label>
                                    <select className="ce-field" value={govZone} onChange={e => setGovZone(e.target.value.split(' —')[0])}>
                                        {zones.map(z => <option key={z} value={z.split(' —')[0]}>{z}</option>)}
                                    </select>
                                    <label className="ce-field-lbl">
                                        Password *{' '}
                                        {govPassErr && <span style={{ color: '#f43f5e', fontSize: '10px', fontWeight: 'normal' }}>{govPassErr}</span>}
                                    </label>
                                    <input type="password" className="ce-field" placeholder="Minimum 8 characters"
                                        value={govRegPass} onChange={e => { setGovRegPass(e.target.value); setGovPassErr('') }} />
                                    <button className="ce-bsub" onClick={doGovReg} disabled={loading}
                                        style={{ background: 'linear-gradient(135deg,#138808,#074c04)', boxShadow: loading ? 'none' : '0 4px 20px rgba(19,136,8,.35)' }}>
                                        {loading ? 'Creating account…' : '🏛️ Create Officer Account'}
                                    </button>
                                    <div className="ce-cf">
                                        Already registered?{' '}
                                        <a href="#" onClick={e => { e.preventDefault(); setGovSubTab('login') }} style={{ color: '#138808' }}>Sign in →</a>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}