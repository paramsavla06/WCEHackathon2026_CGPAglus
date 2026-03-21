import { useEffect } from 'react'
import { ISSUES, CITIES } from '../../lib/data.ts'

const PCTS = [72, 58, 45, 88, 34, 61, 79, 53]

export default function Marquee() {
    const tiles = ISSUES.map((is, i) => (
        <div key={is.type} className="ce-mtile">
            <div className="ce-mtile-ico" style={{ background: is.bg }}
                dangerouslySetInnerHTML={{ __html: is.svg }} />
            <div className="ce-mtile-name">{is.label}</div>
            <div className="ce-mtile-cnt">{Math.floor(PCTS[i] * 14)} reports this month</div>
            <div className="ce-mtile-bar">
                <div className="ce-mtile-fi" style={{ width: PCTS[i] + '%', background: is.col }} />
            </div>
        </div>
    ))

    const cityItems = [...CITIES, ...CITIES].map((c, i) => (
        <div key={i} className="ce-city-item">
            {c}<div className="ce-city-sep" />
        </div>
    ))

    return (
        <>
            <section className="ce-showcase" id="issues">
                <div className="ce-sh-inner">
                    <div className="ce-sec-ey rv">What Gets Reported</div>
                    <h2 className="ce-sh-t rv">Every civic issue,<br />one platform.</h2>
                </div>
                <div className="ce-mwrap rv">
                    <div className="ce-mtrack">
                        {tiles}{tiles}
                    </div>
                </div>
            </section>
            <div className="ce-city-ticker">
                <div className="ce-city-track">
                    {cityItems}
                </div>
            </div>
        </>
    )
}