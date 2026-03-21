export interface Issue {
    type: string
    label: string
    loc: string
    city: string
    status: string
    col: string
    bg: string
    svg: string
    desc?: string
}

export const ISSUES: Issue[] = [
    {
        type: 'pothole', label: 'Pothole', loc: 'Dadar, Zone 4', city: 'Mumbai',
        status: 'In Progress', col: '#f59e0b', bg: 'rgba(245,158,11,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="15" rx="8" ry="3.5" stroke="#f59e0b" stroke-width="1.5"/><path d="M4 15c0-3 3.6-9 8-9s8 6 8 9" stroke="#f59e0b" stroke-width="1.5"/><ellipse cx="12" cy="15" rx="4" ry="1.5" stroke="#f59e0b" stroke-width="1" opacity=".4"/></svg>`,
        desc: 'Deep pothole near MG Road junction — causing vehicle damage daily...'
    },
    {
        type: 'light', label: 'Streetlight Failure', loc: 'Bandra West', city: 'Mumbai',
        status: 'Assigned', col: '#3d7fff', bg: 'rgba(61,127,255,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="12" y1="4" x2="12" y2="20" stroke="#3d7fff" stroke-width="1.5" stroke-linecap="round"/><path d="M12 4 Q19 4 19 10" stroke="#3d7fff" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="19" cy="10" r="2.5" stroke="#3d7fff" stroke-width="1.5"/><circle cx="19" cy="10" r="5" stroke="#3d7fff" stroke-width=".5" opacity=".3"/><path d="M9 20h6" stroke="#3d7fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        desc: 'Streetlight out on Bandra West — complete darkness at night...'
    },
    {
        type: 'waste', label: 'Waste Overflow', loc: 'Andheri East', city: 'Mumbai',
        status: 'Received', col: '#34d399', bg: 'rgba(52,211,153,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="8" width="12" height="12" rx="2" stroke="#34d399" stroke-width="1.5"/><path d="M4 8h16M10 4h4" stroke="#34d399" stroke-width="1.5" stroke-linecap="round"/><path d="M10 12v4M14 12v4" stroke="#34d399" stroke-width="1.5" stroke-linecap="round" opacity=".5"/></svg>`,
        desc: 'Bins overflowing at Andheri East market...'
    },
    {
        type: 'water', label: 'Water Pipe Leak', loc: 'Chembur Colony', city: 'Mumbai',
        status: 'In Progress', col: '#2dd4bf', bg: 'rgba(45,212,191,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="#2dd4bf" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="12" r="2" stroke="#2dd4bf" stroke-width="1.5"/><circle cx="20" cy="12" r="2" stroke="#2dd4bf" stroke-width="1.5"/><path d="M12 7c0-2-2-3-2-5M12 7c0-2 2-3 2-5" stroke="#2dd4bf" stroke-width="1.5" stroke-linecap="round" opacity=".5"/></svg>`,
        desc: 'Pipe burst at Chembur Colony — flooding road...'
    },
    {
        type: 'road', label: 'Road Collapse', loc: 'Thane West', city: 'Thane',
        status: 'Resolved', col: '#f43f5e', bg: 'rgba(244,63,94,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 20l4-16h10l4 16" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14h10M9 10h6" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" opacity=".5"/></svg>`,
        desc: 'Road collapse in Thane West — dangerous...'
    },
    {
        type: 'drain', label: 'Blocked Drainage', loc: 'Kurla Junction', city: 'Mumbai',
        status: 'In Progress', col: '#6ee7b7', bg: 'rgba(110,231,183,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="15" width="18" height="4" rx="1" stroke="#6ee7b7" stroke-width="1.5"/><path d="M6 15V11M9 15V8M12 15V11M15 15V7M18 15V11" stroke="#6ee7b7" stroke-width="1.5" stroke-linecap="round" opacity=".5"/></svg>`,
        desc: 'Drainage blocked at Kurla junction...'
    },
    {
        type: 'park', label: 'Park Damage', loc: 'Powai Lake Area', city: 'Mumbai',
        status: 'Assigned', col: '#a78bfa', bg: 'rgba(167,139,250,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3c-3.3 0-6 2.7-6 6 0 2.2 1.2 4.1 3 5.2V19h6v-4.8c1.8-1.1 3-3 3-5.2 0-3.3-2.7-6-6-6z" stroke="#a78bfa" stroke-width="1.5"/><path d="M9 19h6" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        desc: 'Bench and fencing damaged at Powai park...'
    },
    {
        type: 'noise', label: 'Noise Complaint', loc: 'Borivali East', city: 'Mumbai',
        status: 'Received', col: '#fb923c', bg: 'rgba(251,146,60,.1)',
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#fb923c" stroke-width="1.5" stroke-linejoin="round"/><path d="M15.54 8.46A5 5 0 0117 12a5 5 0 01-1.46 3.54" stroke="#fb923c" stroke-width="1.5" stroke-linecap="round"/><path d="M19.07 4.93A10 10 0 0121 12a10 10 0 01-1.93 7.07" stroke="#fb923c" stroke-width="1.5" stroke-linecap="round" opacity=".4"/></svg>`,
        desc: 'Excessive noise from construction — Borivali...'
    },
]

export const FLY_ISSUES = [
    {
        type: 'pothole', label: 'Pothole', loc: 'Dadar, Zone 4', col: '#f59e0b', bg: 'rgba(245,158,11,.1)',
        svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="15" rx="8" ry="3.5" stroke="#f59e0b" stroke-width="1.8"/><path d="M4 15c0-3 3.6-9 8-9s8 6 8 9" stroke="#f59e0b" stroke-width="1.8"/></svg>`,
        desc: 'Deep pothole near MG Road — damage daily...'
    },
    {
        type: 'light', label: 'Streetlight', loc: 'Bandra West', col: '#3d7fff', bg: 'rgba(61,127,255,.1)',
        svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="12" y1="4" x2="12" y2="20" stroke="#3d7fff" stroke-width="1.8" stroke-linecap="round"/><path d="M12 4 Q18 4 18 10" stroke="#3d7fff" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="18" cy="10" r="2.5" stroke="#3d7fff" stroke-width="1.5"/></svg>`,
        desc: 'Streetlight out on Bandra West...'
    },
    {
        type: 'waste', label: 'Waste Overflow', loc: 'Andheri East', col: '#34d399', bg: 'rgba(52,211,153,.1)',
        svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="6" y="8" width="12" height="12" rx="2" stroke="#34d399" stroke-width="1.8"/><path d="M4 8h16M10 4h4" stroke="#34d399" stroke-width="1.8" stroke-linecap="round"/></svg>`,
        desc: 'Bins overflowing at Andheri East...'
    },
    {
        type: 'water', label: 'Water Leak', loc: 'Chembur Colony', col: '#2dd4bf', bg: 'rgba(45,212,191,.1)',
        svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="#2dd4bf" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="12" r="2" stroke="#2dd4bf" stroke-width="1.5"/><circle cx="20" cy="12" r="2" stroke="#2dd4bf" stroke-width="1.5"/></svg>`,
        desc: 'Pipe burst at Chembur Colony...'
    },
    {
        type: 'road', label: 'Road Collapse', loc: 'Thane West', col: '#f43f5e', bg: 'rgba(244,63,94,.1)',
        svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 20l4-16h10l4 16" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        desc: 'Road collapse — Thane West...'
    },
]

export const CITIES = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune',
    'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Surat',
    'Nagpur', 'Indore', 'Visakhapatnam', 'Chandigarh', 'Vadodara', 'Patna',
]

export const STATS = [
    { value: 94823, label: 'Issues Reported' },
    { value: 78, label: 'Resolution Rate %' },
    { value: 4, label: 'Days Avg. Resolution' },
    { value: 48, label: 'Cities Active' },
]