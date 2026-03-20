import { useEffect, useState } from 'react'

interface NavProps {
    theme: 'dark' | 'light'
    onToggleTheme: () => void
}

export default function Nav({ theme, onToggleTheme }: NavProps) {
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const scrollTo = (id: string) => {
        setMenuOpen(false)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <>
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
                    <button className="ce-mode-btn" onClick={onToggleTheme} title="Toggle light/dark mode">
                        {theme === 'dark' ? '☀' : '☾'}
                    </button>
                    <button className="ce-nav-pill ce-hide-mobile" onClick={() => scrollTo('login')}>
                        Get Started — It's Free
                    </button>
                    {/* Hamburger — visible on mobile only */}
                    <button
                        className="ce-hamburger"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                    >
                        <span />
                        <span className={menuOpen ? 'open-mid' : ''} />
                        <span />
                    </button>
                </div>
            </nav>

            {/* Mobile dropdown */}
            <div className={`ce-mobile-menu${menuOpen ? ' open' : ''}`}>
                <ul>
                    <li><a onClick={() => scrollTo('problems')}>Problems</a></li>
                    <li><a onClick={() => scrollTo('how')}>How It Works</a></li>
                    <li><a onClick={() => scrollTo('issues')}>Issue Types</a></li>
                    <li><a onClick={() => scrollTo('login')}>Sign In</a></li>
                </ul>
                <button
                    className="ce-nav-pill"
                    style={{ width: '100%', marginTop: '12px', borderRadius: '12px' }}
                    onClick={() => scrollTo('login')}
                >
                    Get Started — It's Free
                </button>
            </div>
        </>
    )
}