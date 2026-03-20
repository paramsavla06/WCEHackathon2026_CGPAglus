// All animation helpers — cursor, particles, constellation, scroll reveal, countup

export function initCursor(): () => void {
    const cur = document.getElementById('ce-cur')
    const curR = document.getElementById('ce-curR')
    if (!cur || !curR) return () => { }

    let mx = 0, my = 0, rx = 0, ry = 0
    let raf: number

    const onMove = (e: MouseEvent) => {
        mx = e.clientX; my = e.clientY
        cur.style.left = mx + 'px'
        cur.style.top = my + 'px'
    }
    document.addEventListener('mousemove', onMove)

    const loop = () => {
        rx += (mx - rx) * .1
        ry += (my - ry) * .1
        curR.style.left = rx + 'px'
        curR.style.top = ry + 'px'
        raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
        document.removeEventListener('mousemove', onMove)
        cancelAnimationFrame(raf)
    }
}

export function attachCursorHover(selectors = 'button,a,.ce-scell,.ce-icard,.ce-pcard,.ce-mtile,.ce-step'): void {
    document.querySelectorAll<HTMLElement>(selectors).forEach(el => {
        el.addEventListener('mouseenter', () => {
            const cur = document.getElementById('ce-cur')
            const curR = document.getElementById('ce-curR')
            if (cur) { cur.style.width = '5px'; cur.style.height = '5px' }
            if (curR) { curR.style.width = '48px'; curR.style.height = '48px'; curR.style.borderColor = 'rgba(255,153,51,.75)' }
        })
        el.addEventListener('mouseleave', () => {
            const cur = document.getElementById('ce-cur')
            const curR = document.getElementById('ce-curR')
            if (cur) { cur.style.width = '10px'; cur.style.height = '10px' }
            if (curR) { curR.style.width = '36px'; curR.style.height = '36px'; curR.style.borderColor = 'rgba(255,153,51,.5)' }
            el.style.transform = ''
        })
        el.addEventListener('mousemove', (e: MouseEvent) => {
            const r = el.getBoundingClientRect()
            const dx = e.clientX - (r.left + r.width / 2)
            const dy = e.clientY - (r.top + r.height / 2)
            el.style.transform = `translate(${dx * .12}px, ${dy * .12}px)`
        })
    })
}

export function attachRadialGlow(sel = '.ce-pcard,.ce-mtile,.ce-icard,.ce-lcard,.ce-scell'): void {
    document.querySelectorAll<HTMLElement>(sel).forEach(el => {
        el.addEventListener('mousemove', (e: MouseEvent) => {
            const r = el.getBoundingClientRect()
            el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
            el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
        })
    })
}

export function initParticles(): () => void {
    const container = document.getElementById('ce-particles')
    if (!container) return () => { }

    const makeParticle = () => {
        const p = document.createElement('div')
        p.className = 'ce-particle'
        const size = Math.random() * 4 + 2
        const x = Math.random() * 100
        const dur = Math.random() * 18 + 12
        const delay = Math.random() * 10
        const op = Math.random() * .4 + .1
        const cols = [`rgba(255,153,51,${op})`, `rgba(19,136,8,${op})`, `rgba(255,180,80,${op})`]
        const col = cols[Math.floor(Math.random() * cols.length)]
        Object.assign(p.style, {
            width: size + 'px', height: size + 'px',
            left: x + '%', bottom: '-20px', background: col,
            animationDuration: dur + 's', animationDelay: delay + 's',
        })
        container.appendChild(p)
        setTimeout(() => p.remove(), (dur + delay) * 1000 + 500)
    }

    const iv = setInterval(makeParticle, 900)
    for (let i = 0; i < 8; i++) setTimeout(makeParticle, i * 400)
    return () => clearInterval(iv)
}

export function initConstellation(): () => void {
    const cnv = document.getElementById('ce-constellation') as HTMLCanvasElement | null
    if (!cnv) return () => { }
    const ctx = cnv.getContext('2d')!
    let stars: { x: number; y: number; r: number; speed: number; phase: number }[] = []
    let raf: number

    const resize = () => {
        cnv.width = window.innerWidth
        cnv.height = window.innerHeight
        const n = Math.floor(cnv.width * cnv.height / 9000)
        stars = Array.from({ length: n }, () => ({
            x: Math.random() * cnv.width,
            y: Math.random() * cnv.height,
            r: Math.random() * 1.4 + .3,
            speed: Math.random() * .15 + .04,
            phase: Math.random() * Math.PI * 2,
        }))
    }

    const draw = () => {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark'
        ctx.clearRect(0, 0, cnv.width, cnv.height)
        const t = performance.now() / 1000
        stars.forEach(s => {
            const a = (.4 + .3 * Math.sin(t * s.speed + s.phase)) * (dark ? .85 : .5)
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            ctx.fillStyle = dark ? `rgba(255,180,80,${a})` : `rgba(180,100,20,${a * .6})`
            ctx.fill()
        })
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x
                const dy = stars[i].y - stars[j].y
                const d = Math.sqrt(dx * dx + dy * dy)
                if (d < 110) {
                    const a = (1 - d / 110) * (dark ? .06 : .035)
                    ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y)
                    ctx.strokeStyle = dark ? `rgba(255,153,51,${a})` : `rgba(180,90,10,${a})`
                    ctx.lineWidth = .5; ctx.stroke()
                }
            }
        }
        raf = requestAnimationFrame(draw)
    }

    resize(); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
}

export function initScrollReveal(): () => void {
    const check = () => {
        document.querySelectorAll<HTMLElement>('.rv,.rvl,.rvr').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight * .88) el.classList.add('in')
        })
    }
    check()
    window.addEventListener('scroll', check)
    return () => window.removeEventListener('scroll', check)
}

export function initCountUp(containerSel = '.ce-stats'): () => void {
    const container = document.querySelector(containerSel)
    if (!container) return () => { }
    let counted = false
    const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !counted) {
            counted = true
            container.querySelectorAll<HTMLElement>('[data-t]').forEach(el => {
                const end = +el.dataset.t!
                let n = 0
                const step = end / 80
                const iv = setInterval(() => {
                    n += step
                    if (n >= end) { n = end; clearInterval(iv) }
                    el.textContent = end > 999 ? Math.round(n).toLocaleString('en-IN') : String(Math.round(n))
                }, 18)
            })
        }
    }, { threshold: .4 })
    obs.observe(container)
    return () => obs.disconnect()
}

export function initHowItWorksDot(): () => void {
    const grid = document.getElementById('stepsGrid')
    if (!grid) return () => { }

    let animated = false
    let cancelled = false

    const measure = () => {
        const track = document.getElementById('stepsTrack')
        if (!track) return null
        const stepNs = Array.from(grid.querySelectorAll<HTMLElement>('.ce-step-n'))
        if (stepNs.length < 2) return null
        const gridRect = grid.getBoundingClientRect()
        const r = stepNs[0].getBoundingClientRect().width / 2
        const centers = stepNs.map(n => {
            const nr = n.getBoundingClientRect()
            return { x: nr.left + r - gridRect.left, y: nr.top + r - gridRect.top }
        })
        const first = centers[0], last = centers[centers.length - 1]
        const trackW = last.x - first.x
        track.style.cssText = [
            'position:absolute', 'height:2px', 'border-radius:2px',
            'pointer-events:none', 'z-index:1',
            `top:${first.y}px`, `left:${first.x}px`, `width:${trackW}px`,
            'transform:translateY(-50%)',
        ].join(';')
        return {
            dotPos: centers.map(c => c.x - first.x),
            fillPct: centers.map(c => ((c.x - first.x) / trackW) * 100),
        }
    }

    const animate = () => {
        if (animated) return
        setTimeout(() => {
            const data = measure()
            if (!data) return
            animated = true
            cancelled = false
            const fill = document.getElementById('trackFill')!
            const dot = document.getElementById('flowDot')!
            const steps = Array.from(grid.querySelectorAll<HTMLElement>('.ce-step[data-step]'))
            const { dotPos, fillPct } = data

            dot.classList.remove('merged', 'hidden')
            dot.style.transition = 'none'
            fill.style.transition = 'none'
            dot.style.left = dotPos[0] + 'px'
            fill.style.width = '0%'

            const goToStep = (i: number) => {
                if (cancelled) return
                dot.classList.remove('merged', 'hidden')
                dot.style.transition = 'left .55s cubic-bezier(.4,0,.2,1), transform .3s ease, opacity .3s ease'
                dot.style.left = dotPos[i] + 'px'
                fill.style.transition = 'width .55s cubic-bezier(.4,0,.2,1)'
                fill.style.width = fillPct[i] + '%'
                setTimeout(() => {
                    if (cancelled) return
                    steps.forEach((s, j) => s.classList.toggle('active', j === i))
                    dot.classList.add('merged')
                    setTimeout(() => {
                        if (cancelled) return
                        dot.classList.remove('merged')
                        dot.classList.add('hidden')
                        const next = i + 1
                        if (next <= 3) { dot.style.transition = 'none'; dot.style.left = dotPos[next] + 'px' }
                        setTimeout(() => {
                            if (cancelled) return
                            dot.classList.remove('hidden')
                            if (next <= 3) {
                                goToStep(next)
                            } else {
                                setTimeout(() => {
                                    if (cancelled) return
                                    steps.forEach(s => s.classList.remove('active'))
                                    dot.style.transition = 'none'; fill.style.transition = 'none'
                                    dot.style.left = dotPos[0] + 'px'; fill.style.width = '0%'
                                    animated = false
                                    setTimeout(animate, 300)
                                }, 2200)
                            }
                        }, 180)
                    }, 350)
                }, 600)
            }
            requestAnimationFrame(() => requestAnimationFrame(() => goToStep(0)))
        }, 400)
    }

    const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            requestAnimationFrame(() => requestAnimationFrame(animate))
        } else {
            cancelled = true; animated = false
            const fill = document.getElementById('trackFill')
            const dot = document.getElementById('flowDot')
            if (fill) { fill.style.transition = 'none'; fill.style.width = '0%' }
            if (dot) { dot.classList.remove('merged', 'hidden'); dot.style.transition = 'none'; dot.style.left = '0px' }
            grid.querySelectorAll('.ce-step').forEach(s => s.classList.remove('active'))
        }
    }, { threshold: .3 })

    obs.observe(grid)
    window.addEventListener('resize', () => { if (animated) measure() })
    return () => obs.disconnect()
}