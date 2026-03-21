import { useEffect, useRef, useState } from 'react'
import { FLY_ISSUES } from '../../lib/data.ts'
import { attachCursorHover } from '../../lib/animations.ts'

export default function Hero() {
    const hrightRef = useRef<HTMLDivElement>(null)
    const psceneRef = useRef<HTMLDivElement>(null)
    const p3dRef = useRef<HTMLDivElement>(null)
    const haloRef = useRef<HTMLDivElement>(null)
    const flyTimers = useRef<ReturnType<typeof setTimeout>[]>([])

    // clock
    const [time, setTime] = useState(() => {
        const n = new Date()
        return n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0')
    })
    useEffect(() => {
        const iv = setInterval(() => {
            const n = new Date()
            setTime(n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0'))
        }, 30000)
        return () => clearInterval(iv)
    }, [])

    // entrance
    useEffect(() => {
        const t1 = setTimeout(() => {
            document.getElementById('ce-hleft')?.classList.add('in')
            const t2 = setTimeout(() => {
                psceneRef.current?.classList.add('in')
                const t3 = setTimeout(runFlyLoop, 900)
                flyTimers.current.push(t3)
            }, 200)
            flyTimers.current.push(t2)
        }, 150)
        flyTimers.current.push(t1)

        attachCursorHover()
        return () => {
            flyTimers.current.forEach(clearTimeout)
            flyTimers.current = []
            // remove any dangling flycards
            document.querySelectorAll('.ce-flycard').forEach(el => el.remove())
        }
    }, [])

    // 3D phone spring physics
    useEffect(() => {
        const p3 = p3dRef.current
        const halo = haloRef.current
        if (!p3) return
        let tiltCur = { ry: -16, rx: 5 }, tiltTgt = { ry: -16, rx: 5 }
        let paused = false, raf = 0

        const springLoop = () => {
            tiltCur.ry += (tiltTgt.ry - tiltCur.ry) * .08
            tiltCur.rx += (tiltTgt.rx - tiltCur.rx) * .08
            p3.style.transform = `rotateY(${tiltCur.ry}deg) rotateX(${tiltCur.rx}deg)`
            if (halo) halo.style.transform = `translate(calc(-50% + ${(tiltCur.ry + 16) * .6}px), calc(-50% + ${(tiltCur.rx - 5) * .5}px))`
            raf = requestAnimationFrame(springLoop)
        }
        const onMove = (e: MouseEvent) => {
            if (!paused) { paused = true; p3.style.animation = 'none'; springLoop() }
            tiltTgt.ry = -16 + ((e.clientX / window.innerWidth) - .5) * 2 * 16
            tiltTgt.rx = 5 + ((e.clientY / window.innerHeight) - .5) * 2 * 8
        }
        const onLeave = () => {
            paused = false; cancelAnimationFrame(raf)
            p3.style.animation = 'pfloat 7s ease-in-out infinite'
            if (halo) halo.style.transform = 'translate(-50%,-50%)'
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseleave', onLeave)
        psceneRef.current?.addEventListener('click', () => {
            tiltTgt.ry += 10; tiltTgt.rx -= 6
            setTimeout(() => { tiltTgt.ry -= 10; tiltTgt.rx += 6 }, 180)
        })
        return () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseleave', onLeave)
            cancelAnimationFrame(raf)
        }
    }, [])

    // phone state
    const [chipActive, setChipActive] = useState('pothole')
    const [desc, setDesc] = useState('Deep pothole near MG Road — damage daily...')
    const [phase, setPhase] = useState<0 | 1>(0)
    const [progress, setProgress] = useState(0)
    const [progLabel, setProgLabel] = useState('Uploading...')

    const fa = (fn: () => void, ms: number) => {
        const t = setTimeout(fn, ms)
        flyTimers.current.push(t)
    }

    const resetPhone = () => {
        setPhase(0); setProgress(0); setProgLabel('Uploading...')
        setChipActive('pothole')
        setDesc('Deep pothole near MG Road — damage daily...')
    }

    function runFlyLoop() {
        flyTimers.current.forEach(clearTimeout)
        flyTimers.current = []
        const hr = hrightRef.current
        if (!hr) return
        hr.innerHTML = ''
        hr.classList.remove('in')

        FLY_ISSUES.forEach((is, i) => {
            fa(() => {
                setChipActive(is.type)
                setDesc(is.desc)

                const phoneEl = psceneRef.current
                const hrEl = hrightRef.current
                if (!phoneEl || !hrEl) return

                const pR = phoneEl.getBoundingClientRect()
                const hR = hrEl.getBoundingClientRect()

                const fc = document.createElement('div')
                fc.className = 'ce-flycard'
                fc.style.left = (pR.right - 20) + 'px'
                fc.style.top = (pR.top + pR.height * .4) + 'px'
                fc.innerHTML = `<div class="ce-flycard-ico" style="background:${is.bg}">${is.svg}</div><div><div class="ce-flycard-name">${is.label}</div><div class="ce-flycard-loc">${is.loc}</div></div>`
                document.body.appendChild(fc)

                requestAnimationFrame(() => requestAnimationFrame(() => {
                    fc.classList.add('launch')
                    requestAnimationFrame(() => {
                        fc.style.left = (hR.left + 8) + 'px'
                        fc.style.top = (hR.top + i * 68 + 8) + 'px'
                    })
                }))

                fa(() => {
                    fc.classList.add('land')
                    fa(() => {
                        fc.remove()
                        const card = document.createElement('div')
                        card.className = 'ce-icard on'
                        card.style.cssText = 'opacity:0;transform:translateX(14px)'
                        card.innerHTML = `<div class="ce-ic-wrap" style="background:${is.bg}">${is.svg.replace(/width="16" height="16"/, 'width="22" height="22"')}</div><div style="flex:1"><div class="ce-ic-name">${is.label}</div><div class="ce-ic-loc">${is.loc}</div></div>`
                        hr.appendChild(card)
                        requestAnimationFrame(() => requestAnimationFrame(() => {
                            card.style.transition = 'opacity .4s ease, transform .4s ease'
                            card.style.opacity = '1'
                            card.style.transform = 'translateX(0)'
                        }))
                        if (hr.children.length === 1) hr.classList.add('in')
                    }, 260)
                }, 680)
            }, i * 1400 + 400)
        })

        const allLanded = FLY_ISSUES.length * 1400 + 1200

        fa(() => {
            setChipActive('pothole')
            setDesc('Submitting all 5 reports...')
            let p = 0
            const iv = setInterval(() => {
                p = Math.min(p + 1.6, 100)
                setProgress(Math.floor(p))
                if (p >= 30 && p < 65) setProgLabel('Classifying issues...')
                else if (p >= 65 && p < 100) setProgLabel('Routing to authorities...')
                else if (p >= 100) { setProgLabel('Done!'); clearInterval(iv) }
            }, 35)
        }, allLanded)

        fa(() => setPhase(1), allLanded + 3800)

        fa(() => {
            resetPhone()
            const hr2 = hrightRef.current
            if (!hr2) return
            Array.from(hr2.children).forEach((c, i) => {
                const el = c as HTMLElement
                el.style.transition = `opacity .3s ease ${i * 60}ms, transform .3s ease ${i * 60}ms`
                el.style.opacity = '0'
                el.style.transform = 'translateX(16px)'
            })
            fa(() => { hr2.innerHTML = ''; hr2.classList.remove('in'); runFlyLoop() }, 400)
        }, allLanded + 6200)
    }

    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    const chips = ['pothole', 'light', 'waste', 'water']

    return (
        <section className="ce-hero" id="hero">
            <div className="ce-blob ce-blob-saf" />
            <div className="ce-blob ce-blob-grn" />
            <div className="ce-blob ce-blob-blu" />
            <div className="ce-blob ce-blob-cen" />

            {/* Mandala */}
            <div className="ce-mandala">
                <svg viewBox="0 0 920 920" fill="none">
                    <circle cx="460" cy="460" r="450" stroke="#ff9933" strokeWidth=".5" />
                    <circle cx="460" cy="460" r="380" stroke="#ff9933" strokeWidth=".4" />
                    <circle cx="460" cy="460" r="310" stroke="#ff9933" strokeWidth=".4" />
                    <circle cx="460" cy="460" r="240" stroke="#ff9933" strokeWidth=".5" />
                    <circle cx="460" cy="460" r="170" stroke="#ff9933" strokeWidth=".3" strokeDasharray="6 6" />
                    <g transform="translate(460,460)">
                        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map(r => (
                            <line key={r} x2="450" stroke="#ff9933" strokeWidth=".3" transform={r ? `rotate(${r})` : undefined} />
                        ))}
                    </g>
                </svg>
            </div>
            <div className="ce-mandala2">
                <svg viewBox="0 0 620 620" fill="none">
                    <g transform="translate(310,310)">
                        {[0, 30, 60, 90, 120, 150].map(r => (
                            <ellipse key={r} rx="165" ry="62" stroke="#ff9933" strokeWidth=".5" transform={r ? `rotate(${r})` : undefined} />
                        ))}
                        <circle r="22" stroke="#ff9933" strokeWidth=".5" />
                        <circle r="3" fill="#ff9933" opacity=".6" />
                        <circle r="55" stroke="#ff9933" strokeWidth=".3" strokeDasharray="4 4" />
                    </g>
                </svg>
            </div>

            <div className="ce-hgrid" />
            <div className="ce-rays">
                {[0, 1, 2, 3].map(i => <div key={i} className="ce-ray" />)}
            </div>
            <div className="ce-corner-tl" />
            <div className="ce-corner-br" />

            <div className="ce-hero-inner">
                {/* LEFT */}
                <div className="ce-hleft" id="ce-hleft">
                    <div className="ce-hero-eyebrow">India's Civic Infrastructure Platform</div>
                    <h1 className="ce-h1">
                        Your city.<br />Your voice.<br /><em>Real change.</em>
                    </h1>
                    <p className="ce-hero-sub">
                        Report potholes, broken streetlights, overflowing bins — directly to your municipal authority.
                        Real-time tracking, full transparency, zero runaround.
                    </p>
                    <div className="ce-hero-btns">
                        <button className="ce-btn-saffron" onClick={() => scrollTo('login')}>File a Report</button>
                        <button className="ce-btn-outline" onClick={() => scrollTo('how')}>See How It Works</button>
                    </div>
                </div>

                {/* PHONE */}
                <div className="ce-pscene" id="ce-pscene" ref={psceneRef}>
                    <div className="ce-phone-halo" ref={haloRef} />
                    <div className="ce-p3d" id="ce-p3d" ref={p3dRef}>
                        <div className="ce-pside-r" /><div className="ce-pside-b" />
                        <div className="ce-pside-btn" /><div className="ce-pside-btn2" />
                        <div className="ce-pvol1" /><div className="ce-pvol2" />
                        <div className="ce-pfront">
                            <div className="ce-pnotch">
                                <div className="ce-pnotch-spk" /><div className="ce-pnotch-cam" />
                            </div>
                            <div className="ce-pscreen">
                                {/* status bar */}
                                <div className="ce-psb">
                                    <span className="ce-ptime">{time}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div className="ce-psig">
                                            <span /><span /><span /><span />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <div className="ce-pbatt-body"><div className="ce-pbatt-fill" /></div>
                                            <div className="ce-pbatt-tip" />
                                        </div>
                                    </div>
                                </div>
                                {/* app header */}
                                <div className="ce-papp-head">
                                    <div className="ce-papp-logo">
                                        <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
                                            <path d="M7 2L9 5H12L9.5 7.5L10.5 11L7 9L3.5 11L4.5 7.5L2 5H5L7 2Z" fill="white" stroke="white" strokeWidth=".5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="ce-papp-name">CivicEye</div>
                                        <div className="ce-papp-sub">Mumbai · Live</div>
                                    </div>
                                    <div className="ce-papp-notif">3 New</div>
                                </div>

                                {phase === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                                        {/* map */}
                                        <div className="ce-pmap">
                                            <div className="ce-mgrid" />
                                            <div className="ce-mroad ce-mroad-h" /><div className="ce-mroad ce-mroad-v" />
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-66%)' }}>
                                                <div className="ce-mpin-dot" />
                                            </div>
                                            <div className="ce-mpulse" />
                                            <div className="ce-mloc">MG Road, Zone 4</div>
                                        </div>
                                        {/* chips */}
                                        <div className="ce-pchips">
                                            {chips.map(c => (
                                                <span key={c} className={`ce-pchip ${c === chipActive ? 'sel' : 'uns'}`} data-t={c}>
                                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="ce-pfield" id="pdesc">{desc}</div>
                                        {progress > 0 && (
                                            <div className="ce-ppbar" style={{ display: 'flex' }}>
                                                <div className="ce-ppbar-lbl">
                                                    <span>{progLabel}</span><span>{progress}%</span>
                                                </div>
                                                <div className="ce-ppbar-tr">
                                                    <div className="ce-ppbar-fi" style={{ width: progress + '%' }} />
                                                </div>
                                            </div>
                                        )}
                                        {progress === 0 && <button className="ce-psub">Submit Report</button>}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <div className="ce-pst-c">
                                            <div className="ce-pst-ico" style={{ background: 'rgba(34,197,94,.12)' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" width="22" height="22">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            </div>
                                            <div className="ce-pst-tx">Report Submitted!</div>
                                            <div className="ce-pst-su">Issue #CE-2847 registered<br />Routed to Mumbai Municipal Corp.</div>
                                        </div>
                                        <div className="ce-ptracks">
                                            {[
                                                { col: '#22c55e', cls: 'd', label: 'Received by system' },
                                                { col: 'var(--saffron)', cls: 'at', label: 'Assigned to engineer' },
                                                { col: 'rgba(255,255,255,.12)', cls: '', label: 'In Progress' },
                                                { col: 'rgba(255,255,255,.12)', cls: '', label: 'Resolved' },
                                            ].map((step, i) => (
                                                <div key={i}>
                                                    <div className="ce-ptr">
                                                        <div className="ce-ptr-d" style={{ width: 7, height: 7, borderRadius: '50%', background: step.col, flexShrink: 0 }} />
                                                        <div className={`ce-ptr-t${step.cls ? ' ' + step.cls : ''}`}>{step.label}</div>
                                                    </div>
                                                    {i < 3 && <div className="ce-ptrl" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="ce-phbar" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT — fly-card landing zone */}
                <div className="ce-hright" id="ce-hright" ref={hrightRef} />
            </div>
        </section>
    )
}