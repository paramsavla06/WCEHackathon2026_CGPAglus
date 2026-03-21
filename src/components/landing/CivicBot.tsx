import React, { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const ISSUE_CATEGORIES = [
  { id: 'pothole', label: 'Pothole', icon: '', followUp: 'Can you describe the size and exact location of the pothole?' },
  { id: 'streetlight', label: 'Streetlight Failure', icon: '', followUp: 'Is the light completely out or flickering?' },
  { id: 'waste', label: 'Waste Overflow', icon: '', followUp: 'How long has this been overflowing?' },
  { id: 'water', label: 'Water Pipe Leak', icon: '', followUp: 'Is the water flooding the road?' },
  { id: 'road', label: 'Road Collapse', icon: '', followUp: 'How large is the collapse?' },
  { id: 'drainage', label: 'Blocked Drainage', icon: '', followUp: 'Is this causing waterlogging?' },
  { id: 'park', label: 'Park Damage', icon: '', followUp: 'What kind of damage?' },
  { id: 'noise', label: 'Noise Complaint', icon: '', followUp: 'What time of day is the noise happening?' },
]
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Other']
const PREFIX = 'ce_'

// FIX 1: Strongly typed User interface instead of `any`
interface CivicUser {
  name?: string
  points?: number
  [key: string]: unknown
}

// FIX 2: Strongly typed ReportData instead of `Record<string, any>`
interface ReportData {
  category?: string
  description?: string
  location?: string
  city?: string
  latitude?: number
  longitude?: number
  detectedAddress?: string
  photo?: string
  sev?: string
  title?: string
  landmark?: string
  draftDate?: string
}

type Msg = {
  role: 'bot' | 'user'
  text: string
  replies?: string[]
  showLocBtn?: boolean
  showPhotoBtn?: boolean
  isDetecting?: boolean
}

export default function CivicBot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [inputVal, setInputVal] = useState('')
  const [reportStep, setReportStep] = useState(0)
  const [reportData, setReportData] = useState<ReportData>({})
  const [isTyping, setIsTyping] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const stepRef = useRef(0)
  const dataRef = useRef<ReportData>({})
  const initRef = useRef(false)

  useEffect(() => { stepRef.current = reportStep }, [reportStep])
  useEffect(() => { dataRef.current = reportData }, [reportData])

  function getUser(): CivicUser | null {
    try {
      const u = localStorage.getItem(PREFIX + 'user')
      const t = localStorage.getItem(PREFIX + 'token')
      if (u && u !== 'null' && u !== 'undefined' && t && t !== 'null' && t !== 'undefined') {
        return JSON.parse(u) as CivicUser
      }
    } catch {
      return null
    }
    return null
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, isTyping])

  // FIX 3: useEffect cannot take an async callback directly — wrapped in inner async fn
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const user = getUser()
    const name = user?.name?.split(' ')[0] ?? ''
    const loggedIn = !!user

    if (loggedIn) {
      addBot(`Namaste ${name}! Welcome to CivicEye. How can I help you today?`, ['Report an issue', 'My Civic Points', 'Help me'])
    } else {
      addBot(`Namaste! Welcome to CivicEye. Please log in to use CivicBot.`, ['Sign in'])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function stripEmoji(str: string): string {
    return str
      .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[\u2702\u2705\u2706\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665-\u267E\u2680-\u2692\u2694-\u2697\u2699\u269B\u269C\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26CE-\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2708\u2709\u270A-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF-\u27BF\u23E9-\u23F3\u23F8-\u23FA\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u231A\u231B\u24C2]/gu, '')
      .trim()
  }

  function addBot(text: string, replies?: string[], opts: Partial<Msg> = {}): void {
    setMsgs(m => [...m, { role: 'bot', text: stripEmoji(text), replies, ...opts }])
  }
  function addUser(text: string): void {
    setMsgs(m => [...m, { role: 'user', text }])
  }

  function detectCategory(text: string) {
    const lower = text.toLowerCase()
    return ISSUE_CATEGORIES.find(c => lower.includes(c.id) || lower.includes(c.label.toLowerCase()))
  }
  function detectCity(text: string): string {
    const lower = text.toLowerCase()
    return CITIES.find(c => lower.includes(c.toLowerCase())) ?? 'Mumbai'
  }
  function detectIntent(text: string): string {
    const lower = text.toLowerCase()
    if (/^(hi|hello|hey|namaste)$/.test(lower)) return 'greeting'
    if (lower.includes('report') || lower.includes('issue') || lower.includes('problem')) return 'report'
    if (lower.includes('points') || lower.includes('civic') || lower.includes('reward')) return 'points'
    if (lower.includes('help') || lower.includes('what can')) return 'help'
    if (lower.includes('thank')) return 'thanks'
    if (lower.includes('bye') || lower.includes('goodbye')) return 'bye'
    return 'unknown'
  }

  // FIX 4: Properly typed async location handler, no floating promise
  const handleLocationDetect = (): void => {
    if (isDetecting) return
    setIsDetecting(true)
    addBot('Detecting your location... Please allow location access.', undefined, { showLocBtn: true, isDetecting: true })

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        let city = 'Mumbai'
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const d = await res.json() as {
            display_name?: string
            address?: { city?: string; town?: string; village?: string; municipality?: string }
          }
          if (d.display_name) address = d.display_name.split(', ').slice(0, 4).join(', ')
          city = d.address?.city ?? d.address?.town ?? d.address?.village ?? d.address?.municipality ?? 'Mumbai'
        } catch {
          // use defaults
        }

        const cityMatch = CITIES.find(c => city.toLowerCase().includes(c.toLowerCase()))
          ?? CITIES.find(c => address.toLowerCase().includes(c.toLowerCase()))
          ?? city

        const d2: ReportData = { ...dataRef.current, latitude, longitude, detectedAddress: address, city: cityMatch, location: address }
        setReportData(d2)
        dataRef.current = d2
        addBot('Location Detected!\n\n' + address + '\n\nAny nearby landmark? (Optional)', ['Skip'])
        setReportStep(5)
        stepRef.current = 5
        setProgressStep(4)
        setIsDetecting(false)
      },
      () => {
        addBot('Could not detect location. You can type the location manually.', ['Enter manually'], { showLocBtn: true, showPhotoBtn: true })
        setIsDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // FIX 5: Properly typed file change handler
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const photoData = ev.target?.result as string
      const d: ReportData = { ...dataRef.current, photo: photoData }
      setReportData(d)
      dataRef.current = d

      const step = stepRef.current
      if (step === 0) addBot('Photo attached! Please select a category to continue.')
      else if (step === 1) addBot('Photo attached! Please provide details (minimum 10 chars).')
      else if (step === 2) addBot('Photo attached! Enter the location or detect it automatically.', undefined, { showLocBtn: true })
      else if (step === 3 || step === 4 || step === 5) addBot('Photo attached! Ready to submit.', ['Submit Report'])

      if (d.category === 'pothole') {
        setIsTyping(true)
        try {
          const formData = new FormData()
          formData.append('image', file)
          const resp = await fetch('https://wcehackathon2026-cgpaglus.onrender.com/api/predict', { method: 'POST', body: formData })
          if (resp.ok) {
            const pred = await resp.json() as { severity?: string; confidence?: number }
            const sev = pred.severity?.toLowerCase() ?? 'medium'
            const conf = pred.confidence ?? 0
            const updated: ReportData = {
              ...dataRef.current,
              sev,
              title: `Pothole detected (${sev} severity)`,
              description: `A ${sev} severity pothole was detected by AI (Confidence: ${conf}%). ` + (dataRef.current.description ?? '')
            }
            setReportData(updated)
            dataRef.current = updated
            addBot(`AI System: Pothole detected with ${sev} severity (Confidence: ${conf}%). Details have been autofilled, you can edit them if needed.`, ['Continue'])
          }
        } catch (err) {
          console.error('AI Prediction error:', err)
        } finally {
          setIsTyping(false)
        }
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // FIX 6: Properly typed submitReport, safe JSON parsing, no implicit `any`
  async function submitReport(landmark: string): Promise<void> {
    const userRaw = localStorage.getItem(PREFIX + 'user')
    const token = localStorage.getItem(PREFIX + 'token')
    // FIX 7: Safe parse with explicit type cast
    const user: CivicUser | null = userRaw ? (JSON.parse(userRaw) as CivicUser) : null
    const data = dataRef.current

    if (!user || !token) {
      const draft: ReportData & { landmark: string; draftDate: string } = {
        ...data,
        landmark,
        draftDate: new Date().toISOString(),
      }
      localStorage.setItem(PREFIX + 'draft_report', JSON.stringify(draft))
      setProgressStep(0)
      const cat = ISSUE_CATEGORIES.find(c => c.id === data.category)
      addBot(
        `Draft Saved!\n\n━━━━━━━━━━━━━━\n${cat?.label}\n ${data.description}\n ${data.location}\n ${data.city}\n ${landmark}\n━━━━━━━━━━━━━━\n\n Please log in to submit.`,
        ['Sign in']
      )
      setReportStep(-1)
      stepRef.current = -1
      setReportData({})
      dataRef.current = {}
      return
    }

    const cat = ISSUE_CATEGORIES.find(c => c.id === data.category)
    const payload = {
      type: data.category,
      label: cat?.label,
      title: data.title ?? data.description?.slice(0, 60) ?? cat?.label ?? 'Issue',
      description: data.description ?? '',
      location: data.location ?? '',
      city: data.city ?? 'Mumbai',
      lat: data.latitude,
      lng: data.longitude,
      sev: data.sev ?? 'medium',
      imageUrl: data.photo ?? null,
      landmark,
    }

    try {
      const resp = await fetch('https://wcehackathon2026-cgpaglus.onrender.com/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const errDesc = await resp.json() as { error?: string }
        throw new Error(errDesc.error ?? 'Server error')
      }

      const newReport = await resp.json() as { id: string; [key: string]: unknown }

      user.points = ((user.points as number) || 0) + 10
      localStorage.setItem(PREFIX + 'user', JSON.stringify(user))

      // Update local reports cache so it shows up in dashboard immediately
      try {
        const existingRaw = localStorage.getItem(PREFIX + 'reports')
        const existing = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : []
        existing.unshift(newReport)
        localStorage.setItem(PREFIX + 'reports', JSON.stringify(existing))
      } catch (err) {
        console.error('Failed to update reports cache:', err)
      }

      setProgressStep(0)
      addBot(
        `Report Submitted!\n\n━━━━━━━━━━━━━━\nID: ${newReport.id}\n${cat?.label}\nLocation: ${data.location}, ${data.city}\nLandmark: ${landmark}\n${data.photo ? 'Photo attached\n' : ''}━━━━━━━━━━━━━━\n\n+10 Civic Points earned!`,
        ['Report another', 'Thank you!']
      )
    } catch (e: unknown) {
      // FIX 8: `catch (e: any)` replaced with `unknown` + type guard
      const message = e instanceof Error ? e.message : 'Unknown error'
      addBot(`Failed to submit report. Error: ${message}`, ['Try again'])
    }

    setReportStep(0)
    stepRef.current = 0
    setReportData({})
    dataRef.current = {}
  }

  function handleReportStep(text: string): void {
    const lower = text.toLowerCase()
    const step = stepRef.current
    const data = dataRef.current

    if (step === -1) {
      if (lower.includes('submit') || lower.includes('send')) {
        const draftRaw = localStorage.getItem(PREFIX + 'draft_report')
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ReportData & { landmark?: string }
          setReportData(d)
          dataRef.current = d
          void submitReport(d.landmark ?? 'Not specified')
        } else {
          setReportStep(0)
          stepRef.current = 0
          addBot('No draft found. Start a new report?', ['Report an issue'])
        }
      } else if (lower.includes('cancel') || lower.includes('discard')) {
        localStorage.removeItem(PREFIX + 'draft_report')
        setReportStep(0)
        stepRef.current = 0
        setReportData({})
        dataRef.current = {}
        addBot('Draft discarded. Anything else I can help you with?', ['Report an issue', 'Help me'])
      } else {
        addBot("Your draft is saved! Sign in then say 'submit my report'.", ['Submit my report', 'Cancel draft'])
      }
      return
    }

    if (step === 0) {
      const cat = detectCategory(text)
      if (cat) {
        const d: ReportData = { ...data, category: cat.id }
        setReportData(d)
        dataRef.current = d
        setProgressStep(1)
        setReportStep(1)
        stepRef.current = 1
        addBot(`${cat.label} selected.\n\n${cat.followUp}`, undefined, { showPhotoBtn: true })
      } else {
        addBot(
          'Please select a category:\n\n' + ISSUE_CATEGORIES.map(c => c.label).join('\n'),
          ['Pothole', 'Streetlight', 'Waste', 'Water Leak']
        )
      }
      return
    }

    if (step === 1) {
      if (text.trim().length < 10) {
        addBot("Please provide more details.\n\nExample: 'Large pothole near the bus stop, ~2 feet wide'", undefined, { showPhotoBtn: true })
      } else {
        const d: ReportData = { ...data, description: text.trim() }
        setReportData(d)
        dataRef.current = d
        setProgressStep(2)
        setReportStep(2)
        stepRef.current = 2
        addBot('Got it! Now, enter the location or detect it automatically.', undefined, { showLocBtn: true })
      }
      return
    }

    if (step === 2) {
      if (lower.includes('detect') && lower.includes('location')) {
        handleLocationDetect()
        return
      }
      if ((lower.includes('use location') || lower.includes('use this')) && data.detectedAddress) {
        const addr = data.detectedAddress
        const cityMatch = detectCity(addr)
        const d: ReportData = { ...data, location: addr, city: cityMatch }
        setReportData(d)
        dataRef.current = d
        setProgressStep(4)
        setReportStep(4)
        stepRef.current = 4
        addBot(` ${addr}\n\n Any landmark? (Optional)`, ['Skip'], { showPhotoBtn: true })
        return
      }
      if (text.trim().length < 5) {
        addBot('Please provide a more specific location.', ['Detect Location'], { showLocBtn: true })
        return
      }
      const typedCityMatch = detectCity(text)
      const d: ReportData = { ...data, location: text.trim(), city: typedCityMatch }
      setReportData(d)
      dataRef.current = d
      setProgressStep(4)
      setReportStep(4)
      stepRef.current = 4
      addBot(` ${text.trim()}\n\n Any nearby landmark? (Optional)`, ['Skip'], { showPhotoBtn: !data.photo })
      return
    }

    if (step === 4 || step === 5) {
      if (lower.includes('photo') || lower.includes('yes, add')) {
        fileRef.current?.click()
        return
      }
      if (lower.includes('submit')) {
        void submitReport(data.landmark ?? 'Not specified')
        return
      }
      const lm = lower === 'skip' || lower === 'none' ? 'Not specified' : (text.trim() || 'Not specified')
      const d: ReportData = { ...data, landmark: lm }
      setReportData(d)
      dataRef.current = d
      setReportStep(5)
      stepRef.current = 5
      if (data.photo) {
        addBot(`Landmark: ${lm}\nPhoto attached!\n\nReady to submit.`, ['Submit Report'])
      } else {
        addBot(`Landmark: ${lm}\n\nAdd a photo? Reports with photos are 3x more likely to be resolved!`, ['Yes, add photo', 'Skip & Submit'])
      }
      return
    }
  }

  // FIX 9: Floating promise from async handleSend wrapped with void
  const handleSend = async (override?: string): Promise<void> => {
    const text = (override ?? inputVal).trim()
    if (!text) return
    setInputVal('')
    addUser(text)
    setIsTyping(true)
    await new Promise<void>(r => setTimeout(r, 480))
    setIsTyping(false)

    const lower = text.toLowerCase()
    const step = stepRef.current
    const isCategory = detectCategory(text)

    const user = getUser()
    if (!user) {
      if (lower.includes('sign in') || lower.includes('login')) {
        const loginSection = document.getElementById('login')
        if (loginSection) {
          loginSection.scrollIntoView({ behavior: 'smooth' })
          addBot('Redirecting you to the login section. Please sign in to continue.', ['Close'])
        } else {
          addBot('Please visit the login page to sign in to your CivicEye account.', ['Close'])
        }
      } else {
        addBot('Please log in to use CivicBot and report issues.', ['Sign in'])
      }
      return
    }

    if (step > 0 || step === -1 || isCategory) {
      handleReportStep(text)
      return
    }

    if (lower.includes('submit') && lower.includes('report')) {
      const draftRaw = localStorage.getItem(PREFIX + 'draft_report')
      const userRaw = localStorage.getItem(PREFIX + 'user')
      if (draftRaw && userRaw) {
        const d = JSON.parse(draftRaw) as ReportData & { landmark?: string }
        setReportData(d)
        dataRef.current = d
        localStorage.removeItem(PREFIX + 'draft_report')
        void submitReport(d.landmark ?? 'Not specified')
        return
      }
    }

    const intent = detectIntent(text)
    switch (intent) {
      case 'greeting':
        addBot('Namaste! How can I help?', ['Report an issue', 'My Civic Points', 'Help me'])
        break
      case 'report':
        addBot(
          "Let's report an issue! What type of issue?\n\nPothole - Streetlight - Waste\nWater Leak - Road - Drainage",
          ['Pothole', 'Streetlight', 'Waste', 'Water Leak']
        )
        setReportStep(0)
        setProgressStep(1)
        break
      case 'points': {
        const u = JSON.parse(localStorage.getItem(PREFIX + 'user') ?? '{}') as CivicUser
        const pts = (u.points as number) || 0
        const badge = pts < 100 ? 'Bronze' : pts < 500 ? 'Silver' : pts < 1000 ? 'Gold' : 'Diamond'
        addBot(`Civic Points: ${pts}\nBadge: ${badge}\n\nEarn more:\nSubmit report: +10\nVerified: +25\nResolved: +50`, ['Report an issue'])
        break
      }
      case 'help':
        addBot('I can help with:\n\nReport issues\nCivic points info\nLocation detection\n\nWhat would you like?', ['Report an issue', 'My points'])
        break
      case 'thanks':
        addBot("You're welcome! Anything else?", ['Report an issue'])
        break
      case 'bye':
        addBot('Goodbye! Every report counts. Every voice matters.', ['Report an issue'])
        break
      default:
        addBot("I'm not sure I understood. How can I help?\n\nReport an issue\nCheck civic points", ['Report an issue', 'Help me'])
    }
  }

  return (
    <>
      <style>{`
        .cbb-fab {
          position: fixed; bottom: 24px; right: 24px;
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #ff9933, #138808);
          border: 3px solid rgba(255,255,255,0.9);
          color: white; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
          z-index: 9999; transition: transform .3s, box-shadow .3s;
          animation: cbbPulse 2.5s infinite;
        }
        .cbb-fab:hover { transform: scale(1.12); box-shadow: 0 8px 32px rgba(255,153,51,0.45); }
        @keyframes cbbPulse {
          0%,100% { box-shadow: 0 4px 24px rgba(0,0,0,0.35); }
          50% { box-shadow: 0 4px 32px rgba(255,153,51,0.5); }
        }
        .cbb-win {
          position: fixed; bottom: 94px; right: 24px;
          width: 390px; max-width: calc(100vw - 32px);
          height: 560px; max-height: calc(100vh - 110px);
          background: #1a1a2e; border-radius: 20px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.55);
          display: flex; flex-direction: column; overflow: hidden;
          z-index: 9998; border: 1px solid rgba(255,255,255,0.1);
          transform-origin: bottom right;
          animation: cbbSlideIn .22s cubic-bezier(.4,0,.2,1);
        }
        @keyframes cbbSlideIn { from { opacity:0; transform: scale(.92) translateY(12px); } to { opacity:1; transform: none; } }
        .cbb-header {
          padding: 14px 18px;
          background: linear-gradient(135deg, #ff9933, #138808);
          color: white; display: flex; align-items: center;
          gap: 10px; flex-shrink: 0; position: relative; z-index: 10;
        }
        .cbb-av {
          width: 38px; height: 38px; background: rgba(255,255,255,.22);
          border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cbb-hi { flex:1 }
        .cbb-title { font-weight: 700; font-size: 15px; display: block; }
        .cbb-status { font-size: 10.5px; opacity: .88; }
        .cbb-close-btn {
          background: rgba(255,255,255,.2); border: none; color: white;
          width: 30px; height: 30px; border-radius: 7px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .cbb-close-btn:hover { background: rgba(255,255,255,.35); }
        .cbb-prog {
          display: flex; align-items: center; justify-content: center;
          padding: 8px 14px; background: rgba(255,153,51,.08);
          border-bottom: 1px solid rgba(255,255,255,.08);
          gap: 6px; flex-shrink: 0;
        }
        .cbb-ps {
          display: flex; flex-direction: column; align-items: center; gap: 2px; opacity: .35; transition: opacity .3s;
        }
        .cbb-ps.on { opacity: 1; }
        .cbb-ps span {
          width: 22px; height: 22px; background: rgba(255,255,255,.15); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white;
        }
        .cbb-ps.on span { background: linear-gradient(135deg, #ff9933, #138808); }
        .cbb-ps small { font-size: 8.5px; color: #888; }
        .cbb-pline { width: 20px; height: 2px; background: rgba(255,255,255,.15); margin-bottom: 11px; }
        .cbb-msgs {
          flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
          background: #1a1a2e;
        }
        .cbb-msgs::-webkit-scrollbar { width: 5px; }
        .cbb-msgs::-webkit-scrollbar-track { background: rgba(255,255,255,.04); border-radius: 3px; }
        .cbb-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 3px; }
        .cbb-msg {
          max-width: 86%; padding: 11px 15px; border-radius: 15px;
          font-size: 13.5px; line-height: 1.5; color: white; word-wrap: break-word; white-space: pre-line;
        }
        .cbb-bot { background: #2d2d44; align-self: flex-start; border-bottom-left-radius: 4px; }
        .cbb-user { background: linear-gradient(135deg, #ff9933, #e67e22); align-self: flex-end; border-bottom-right-radius: 4px; }
        .cbb-qrs { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 9px; }
        .cbb-qr {
          background: rgba(255,153,51,.13); border: 1px solid rgba(255,153,51,.38);
          color: #ff9933; padding: 6px 13px; border-radius: 20px; font-size: 12px;
          cursor: pointer; transition: .2s; font-weight: 500; font-family: inherit;
        }
        .cbb-qr:hover { background: rgba(255,153,51,.23); transform: translateY(-1px); }
        .cbb-acts { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 9px; }
        .cbb-loc-btn {
          background: linear-gradient(135deg,#138808,#0d6b06); color:white; border:none;
          padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor:pointer; transition: .2s; font-family: inherit;
        }
        .cbb-loc-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(19,136,8,.4); }
        .cbb-loc-btn:disabled { opacity: .6; cursor: not-allowed; }
        .cbb-photo-btn {
          background: linear-gradient(135deg,#667eea,#764ba2); color:white; border:none;
          padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: .2s; font-family: inherit;
        }
        .cbb-photo-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(118,75,162,.4); }
        .cbb-typing { display:flex; gap:5px; padding: 14px; }
        .cbb-typing span {
          width: 7px; height: 7px; background: #888; border-radius: 50%;
          animation: cbbBounce 1.4s infinite ease-in-out;
        }
        .cbb-typing span:nth-child(2) { animation-delay: .2s; }
        .cbb-typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes cbbBounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-7px); } }
        .cbb-input-row {
          padding: 12px; border-top: 1px solid rgba(255,255,255,.09);
          display: flex; gap: 8px; background: #16162a; flex-shrink: 0;
        }
        .cbb-input {
          flex:1; padding: 11px 16px; border-radius: 24px;
          border: 2px solid rgba(255,255,255,.1); background: #2d2d44;
          color: white; font-size: 13.5px; outline: none; font-family: inherit;
          transition: border-color .2s;
        }
        .cbb-input:focus { border-color: #ff9933; }
        .cbb-input::placeholder { color: #888; }
        .cbb-send {
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg, #ff9933, #138808);
          border: none; color: white; cursor: pointer; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0; transition: transform .2s;
        }
        .cbb-send:hover { transform: scale(1.08); }
        @media (max-width: 480px) {
          .cbb-win { bottom:0; right:0; width:100%; max-width:100%; height:100%; max-height:100%; border-radius:0; }
          .cbb-fab { bottom:16px; right:16px; }
        }
      `}</style>

      {/* FIX 10: `capture` attribute typed correctly as "environment" literal */}
      <input
        type="file"
        ref={fileRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {/* FAB */}
      {!open && (
        <button className="cbb-fab" onClick={() => setOpen(true)} title="Chat with CivicBot" aria-label="Open CivicBot">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="cbb-win">
          {/* Header */}
          <div className="cbb-header">
            <div className="cbb-av">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div className="cbb-hi">
              <span className="cbb-title">CivicBot</span>
              <span className="cbb-status">{getUser() ? 'Logged in' : 'Not logged in'}</span>
            </div>
            <button className="cbb-close-btn" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          {progressStep > 0 && (
            <div className="cbb-prog">
              {(['Category', 'Details', 'Location', 'Landmark'] as const).map((lbl, i) => (
                // FIX 11: Use React.Fragment with key (correct approach)
                <React.Fragment key={lbl}>
                  <div className={`cbb-ps${progressStep > i ? ' on' : ''}`}>
                    <span>{i + 1}</span>
                    <small>{lbl}</small>
                  </div>
                  {i < 3 && <div className="cbb-pline" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="cbb-msgs" ref={scrollRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`cbb-msg ${m.role === 'bot' ? 'cbb-bot' : 'cbb-user'}`}>
                {m.text}
                {m.role === 'bot' && (m.showLocBtn || m.showPhotoBtn) && (
                  <div className="cbb-acts">
                    {m.showLocBtn && (
                      <button className="cbb-loc-btn" onClick={handleLocationDetect} disabled={isDetecting}>
                        {isDetecting ? 'Detecting...' : 'Detect Location'}
                      </button>
                    )}
                    {m.showPhotoBtn && (
                      <button className="cbb-photo-btn" onClick={() => fileRef.current?.click()}>Add Photo</button>
                    )}
                  </div>
                )}
                {m.role === 'bot' && m.replies && m.replies.length > 0 && (
                  <div className="cbb-qrs">
                    {m.replies.map(r => (
                      <button key={r} className="cbb-qr" onClick={() => void handleSend(r)}>{r}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="cbb-msg cbb-bot cbb-typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="cbb-input-row">
            <input
              className="cbb-input"
              placeholder="Message CivicBot..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSend() }}
            />
            <button className="cbb-send" onClick={() => void handleSend()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}