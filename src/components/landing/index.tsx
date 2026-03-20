import React, { useEffect, useState } from 'react'
import Nav from './Nav.tsx'
import Hero from './Hero.tsx'
import Problems from './Problems.tsx'
import HowItWorks from './HowItWorks.tsx'
import Marquee from './Marquee.tsx'
import Features from './Features.tsx'
import Login from './Login.tsx'
import Footer from './Footer.tsx'
import { STATS } from '../../lib/data.ts'
import {
    initCursor,
    initParticles,
    initConstellation,
    initScrollReveal,
    initCountUp,
} from '../../lib/animations.ts'

export default function LandingPage() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [toast, setToast] = useState('')
    const [toastVisible, setToastVisible] = useState(false)

    // apply theme to <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // global animations — run once
    useEffect(() => {
        const cleanupCursor = initCursor()
        const cleanupParticles = initParticles()
        const cleanupConstellation = initConstellation()
        const cleanupReveal = initScrollReveal()
        const cleanupCountUp = initCountUp('.ce-stats')
        return () => {
            cleanupCursor()
            cleanupParticles()
            cleanupConstellation()
            cleanupReveal()
            cleanupCountUp()
        }
    }, [])

    const showToast = (msg: string) => {
        setToast(msg)
        setToastVisible(true)
        setTimeout(() => setToastVisible(false), 3200)
    }

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    return (
        <>
            {/* Global background elements */}
            <div className="ce-rangoli">
                <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="rp" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                            <g transform="translate(60,60)">
                                <ellipse rx="22" ry="8" fill="none" stroke="#ff9933" strokeWidth=".6" />
                                <ellipse rx="22" ry="8" transform="rotate(45)" fill="none" stroke="#ff9933" strokeWidth=".6" />
                                <ellipse rx="22" ry="8" transform="rotate(90)" fill="none" stroke="#ff9933" strokeWidth=".6" />
                                <ellipse rx="22" ry="8" transform="rotate(135)" fill="none" stroke="#ff9933" strokeWidth=".6" />
                                <circle r="4" fill="none" stroke="#ff9933" strokeWidth=".5" />
                                <circle r="9" fill="none" stroke="#ff9933" strokeWidth=".3" strokeDasharray="2 2" />
                                <circle r="1.5" fill="#ff9933" />
                            </g>
                        </pattern>
                    </defs>
                    <rect width="1440" height="900" fill="url(#rp)" />
                </svg>
            </div>
            <div className="ce-particles" id="ce-particles" />
            <canvas id="ce-constellation" />
            <div id="ce-cur" />
            <div id="ce-curR" />

            {/* Toast */}
            <div className={`ce-toast${toastVisible ? ' show' : ''}`}>{toast}</div>

            {/* Page */}
            <Nav theme={theme} onToggleTheme={toggleTheme} />
            <Hero />

            {/* Tricolor divider */}
            <div className="ce-tribar" />

            {/* Stats */}
            <div className="ce-stats rv">
                {STATS.map(s => (
                    <div key={s.label} className="ce-scell">
                        <div className="ce-snum" data-t={s.value}>0</div>
                        <div className="ce-slbl">{s.label}</div>
                    </div>
                ))}
            </div>

            <Marquee />
            <Problems />
            <HowItWorks />
            <Features />
            <Login onShowToast={showToast} />
            <Footer />
        </>
    )
}
