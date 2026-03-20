import { useState } from 'react'

const API = 'http://localhost:4000'

interface LoginProps {
    onShowToast: (msg: string) => void
}

export default function Login({ onShowToast }: LoginProps) {
    const [tab, setTab] = useState<'l' | 'r'>('l')
    const [username, setUsername] = useState('')
    const [pass, setPass] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [regUsername, setRegUsername] = useState('')
    const [regCity, setRegCity] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPass, setRegPass] = useState('')
    const [agreed, setAgreed] = useState(false)
    const [passErr, setPassErr] = useState('')
    const [loading, setLoading] = useState(false)

    const doLogin = async () => {
        if (!username || !pass) { onShowToast('Please fill in all fields'); return }
        setLoading(true)
        try {
            const res = await fetch(`${API}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: pass })
            })
            const data = await res.json()
            if (!res.ok) { onShowToast(data.error || 'Login failed'); setLoading(false); return }
            // Store token and user in localStorage
            localStorage.setItem('ce_token', data.token)
            localStorage.setItem('ce_user', JSON.stringify(data.user))
            // Clear old report/vote caches so fresh data is loaded from backend
            localStorage.removeItem('ce_reports')
            localStorage.removeItem('ce_votes')
            onShowToast(`Welcome back, ${data.user.name}! Redirecting...`)
            setTimeout(() => { window.location.href = '/dashboard.html' }, 900)
        } catch (e) {
            onShowToast('Cannot connect to server. Is the backend running?')
        }
        setLoading(false)
    }

    const doReg = async () => {
        if (!firstName || !regUsername || !regEmail || !regCity || !regPass) { onShowToast('Please fill in all required fields'); return }
        if (regUsername.length < 3) { onShowToast('Username must be at least 3 characters'); return }
        if (!/^[a-zA-Z0-9_]+$/.test(regUsername)) { onShowToast('Username can only contain letters, numbers and underscores'); return }
        if (!agreed) { onShowToast('Please agree to the Terms of Service'); return }
        if (regPass.length < 8) { setPassErr('Min 8 characters'); return }
        setPassErr('')
        setLoading(true)

        const fullName = firstName + (lastName ? ' ' + lastName : '')
        const initials = (firstName[0] + (lastName[0] || firstName[1] || '')).toUpperCase()

        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: regUsername.toLowerCase(),
                    email: regEmail,
                    password: regPass,
                    name: fullName,
                    city: regCity,
                    avatar: initials,
                })
            })
            const data = await res.json()
            if (!res.ok) { onShowToast(data.error || 'Registration failed'); setLoading(false); return }
            localStorage.setItem('ce_token', data.token)
            localStorage.setItem('ce_user', JSON.stringify(data.user))
            localStorage.removeItem('ce_reports')
            localStorage.removeItem('ce_votes')
            onShowToast(`Account created! Welcome, ${firstName}!`)
            setTimeout(() => { window.location.href = '/dashboard.html' }, 900)
        } catch (e) {
            onShowToast('Cannot connect to server. Is the backend running?')
        }
        setLoading(false)
    }

    const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Surat', 'Nagpur', 'Indore', 'Other']

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
                    <div className="ce-tabs">
                        <button className={`ce-tab${tab === 'l' ? ' on' : ''}`} onClick={() => setTab('l')}>Sign In</button>
                        <button className={`ce-tab${tab === 'r' ? ' on' : ''}`} onClick={() => setTab('r')}>Create Account</button>
                    </div>

                    {tab === 'l' ? (
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
                            </div>
                        </>
                    ) : (
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
                            <input type="text" className="ce-field" placeholder="arjun_sharma (letters, numbers, _)" value={regUsername} onChange={e => setRegUsername(e.target.value)} />
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
                </div>
            </div>
        </section>
    )
}