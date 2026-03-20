import { useEffect, useRef, useState } from 'react'

interface NavProps {
    theme: 'dark' | 'light'
    onToggleTheme: () => void
}

export default function Nav({ theme, onToggleTheme }: NavProps) {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <nav className={`ce-nav${scrolled ? ' scrolled' : ''}`} id="ce-nav">
            <div className="ce-logo">
                <div className="ce-logo-dot" />
                CivicEye
            </div>

            <ul className="ce-nav-links">
                <li><a href="#problems" onClick={e => { e.preventDefault(); scrollTo('problems') }}>Problems</a></li>
                <li><a href="#how" onClick={e => { e.preventDefault(); scrollTo('how') }}>How It Works</a></li>
                <li><a href="#issues" onClick={e => { e.preventDefault(); scrollTo('issues') }}>Issue Types</a></li>
                <li><a href="#login" onClick={e => { e.preventDefault(); scrollTo('login') }}>Sign In</a></li>
            </ul>

            <div className="ce-nav-right">
                <button
                    className="ce-mode-btn"
                    onClick={onToggleTheme}
                    title="Toggle light/dark mode"
                >
                    {theme === 'dark' ? '☀' : '☾'}
                </button>
                <button
                    className="ce-nav-pill"
                    onClick={() => scrollTo('login')}
                >
                    Get Started — It's Free
                </button>
            </div>
        </nav>
    )
}