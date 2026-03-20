export default function Features() {
    const features = [
        {
            icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
            title: 'Submit Reports',
            desc: 'File a civic complaint in under 60 seconds with photo evidence, GPS location, and issue category — directly to your municipal authority.',
            color: 'var(--saffron)',
            bg: 'rgba(255,153,51,.1)',
        },
        {
            icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
            title: 'Real-Time Heatmap',
            desc: 'A live geographic heatmap built on real maps, showing civic issues clustered by zone — powered by your GPS location.',
            color: '#f43f5e',
            bg: 'rgba(244,63,94,.1)',
        },
        {
            icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
            title: 'Personal Analytics',
            desc: 'Track your civic impact — reports filed, issues resolved, community upvotes, reporting streak, and civic points earned.',
            color: '#3d7fff',
            bg: 'rgba(61,127,255,.1)',
        },
        {
            icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
            title: 'Community Feed',
            desc: 'See all active civic issues in your area, upvote reports, follow resolution progress, and collaborate with fellow citizens.',
            color: '#22c55e',
            bg: 'rgba(34,197,94,.1)',
        },
        {
            icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
            title: 'Civic Points & Badges',
            desc: 'Earn reward points for every verified report and unlock achievement badges. Rise through leaderboard ranks.',
            color: '#a78bfa',
            bg: 'rgba(167,139,250,.1)',
        },
        {
            icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
            title: 'Live Status Tracking',
            desc: 'Get real-time alerts when your reports are verified, assigned to engineers, or resolved by the municipal authority.',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,.1)',
        },
    ]

    return (
        <section className="ce-features" id="features">
            <div className="ce-features-inner">
                <div className="ce-sec-ey rv">Platform Features</div>
                <h2 className="ce-sec-t rv">Everything you need to<br /><em>drive real change.</em></h2>
                <p className="ce-features-sub rv">
                    Built for citizens. Designed for impact. Every feature crafted to make civic reporting
                    fast, transparent, and effective across India.
                </p>
                <div className="ce-features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="ce-feat-card rv" style={{ transitionDelay: `${i * 0.07}s` }}>
                            <div
                                className="ce-feat-ico"
                                style={{ background: f.bg, color: f.color }}
                                dangerouslySetInnerHTML={{ __html: f.icon }}
                            />
                            <div className="ce-feat-title">{f.title}</div>
                            <div className="ce-feat-desc">{f.desc}</div>
                            <div className="ce-feat-line" style={{ background: f.color }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
