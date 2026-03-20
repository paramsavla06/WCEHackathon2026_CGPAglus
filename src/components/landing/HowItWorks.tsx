import { useEffect } from 'react'
import { initHowItWorksDot } from '../../lib/animations.ts'

export default function HowItWorks() {
    useEffect(() => {
        const cleanup = initHowItWorksDot()
        return cleanup
    }, [])

    const steps = [
        { n: '01', title: 'You Report', desc: 'Tap, photograph, and pin-drop. Submitted in under 30 seconds with automatic location tagging and priority classification.' },
        { n: '02', title: 'AI Routes It', desc: 'Our model classifies severity and routes directly to the correct municipal department — no manual triage, no delays.' },
        { n: '03', title: 'Live Tracking', desc: 'Watch your issue move through Received, Assigned, In Progress, and Resolved with real-time push notifications.' },
        { n: '04', title: 'Public Record', desc: 'Every resolution is published. Authorities receive monthly performance scores. Citizens hold institutions accountable.' },
    ]

    return (
        <section className="ce-how-bg" id="how">
            <div className="ce-sec">
                <div className="ce-sec-ey rv">How CivicEye Works</div>
                <h2 className="ce-sec-t rv">Four steps.<br />One resolution.</h2>
                <div className="ce-steps" id="stepsGrid">
                    <div className="ce-steps-track" id="stepsTrack">
                        <div className="ce-steps-track-fill" id="trackFill" />
                        <div className="ce-flow-dot" id="flowDot" />
                    </div>
                    {steps.map((s, i) => (
                        <div key={i} className="ce-step rv" data-step={i} style={i > 0 ? { transitionDelay: `${i * .1}s` } : undefined}>
                            <div className="ce-step-n">{s.n}</div>
                            <div className="ce-step-title">{s.title}</div>
                            <div className="ce-step-desc">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}