export default function Problems() {
    return (
        <section id="problems">
            <div className="ce-sec">
                <div className="ce-sec-ey rv">The Problem</div>
                <h2 className="ce-sec-t rv">Civic reporting is broken.<br />We're fixing it.</h2>
                <p className="ce-sec-s rv">
                    Manual processes, zero transparency, and no accountability —
                    the current system fails citizens at every single step.
                </p>
                <div className="ce-pgrid">
                    <div
                        className="ce-pcard rv"
                        onMouseMove={e => {
                            const r = e.currentTarget.getBoundingClientRect()
                            e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
                            e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
                        }}
                    >
                        <div className="ce-psvg" style={{ background: 'rgba(244,63,94,.1)' }}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <path d="M3 3l22 22" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M11 6c1-.25 2-.35 3-.35 6 0 10.5 6 11.5 8.35-.7 1.3-1.8 2.8-3.1 4" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20.5 20.5C18.5 22 16 23 14 23c-6 0-10.5-6-11.5-8.35 1-2.2 3-5 6-7" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="14" cy="14" r="3.5" stroke="#f43f5e" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <div className="ce-ptitle">Zero Transparency</div>
                        <div className="ce-pdesc">Reports disappear into bureaucratic systems with no confirmation, no updates, and no resolution timeline — just silence.</div>
                    </div>

                    <div className="ce-pcard rv" style={{ transitionDelay: '.1s' }}
                        onMouseMove={e => {
                            const r = e.currentTarget.getBoundingClientRect()
                            e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
                            e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
                        }}
                    >
                        <div className="ce-psvg" style={{ background: 'rgba(245,158,11,.1)' }}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <circle cx="14" cy="14" r="10.5" stroke="#f59e0b" strokeWidth="1.5" />
                                <path d="M14 8.5v5.5l3.5 3.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4.5 4.5l3 3M23.5 4.5l-3 3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
                                <circle cx="14" cy="14" r="2" fill="rgba(245,158,11,.3)" />
                            </svg>
                        </div>
                        <div className="ce-ptitle">Manual and Slow</div>
                        <div className="ce-pdesc">Phone calls, paper forms, email chains. Urgent issues take weeks to route and assign — cascading delays for repairs that should take days.</div>
                    </div>

                    <div className="ce-pcard rv" style={{ transitionDelay: '.2s' }}
                        onMouseMove={e => {
                            const r = e.currentTarget.getBoundingClientRect()
                            e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%')
                            e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%')
                        }}
                    >
                        <div className="ce-psvg" style={{ background: 'rgba(255,153,51,.1)' }}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <path d="M11 17l-2.5 2.5a4 4 0 01-5.5-5.5l3.5-3.5a4 4 0 015.5 0" stroke="#ff9933" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M17 11l2.5-2.5a4 4 0 015.5 5.5l-3.5 3.5a4 4 0 01-5.5 0" stroke="#ff9933" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M11 17l6-6" stroke="#ff9933" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2.5 2.5" />
                            </svg>
                        </div>
                        <div className="ce-ptitle">No Accountability</div>
                        <div className="ce-pdesc">No performance metrics, no deadlines, no consequences. Authorities face zero systemic pressure to resolve issues within any reasonable timeframe.</div>
                    </div>
                </div>
            </div>
        </section>
    )
}