'use client'
import { useState, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import VideoLipSyncStudio from '../components/VideoLipSyncStudio'
// ── TYPES ─────────────────────────────────────────────────────
type StudioTool = 'dashboard' | 'content' | 'cineflow' | 'lipsync' | 'show' | 'animation' | 'image' | 'video' | 'network' | 'saved'

// ── API HELPER ────────────────────────────────────────────────
async function callAPI(endpoint: string, body: Record<string, string>): Promise<string> {
  const res = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Generation failed')
  return data.result
}

// ── STYLES ────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #000;
    --bg2: #030508;
    --bg3: #060a10;
    --s1: #0a0f18;
    --s2: #101620;
    --w: #e8f4ff;
    --w2: #c0d8f0;
    --mu: #2a3a4a;
    --mu2: #3a5060;
    --mu3: #6080a0;
    --r: 8px;
    --r2: 12px;
    --r3: 16px;
    --blue: #00d4ff;
    --blue2: #0066ff;
    --blue3: rgba(0,212,255,0.1);
    --blue-border: rgba(0,212,255,0.25);
    --blue-glow: rgba(0,212,255,0.15);
    --ai-grad: linear-gradient(135deg, #00d4ff, #0066ff);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: #111; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: #0a0f18; overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--ai-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .ai-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); display: inline-block; animation: pulse 1.8s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(0,100,180,0.15); border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: rgba(0,150,220,0.2); }
  .card.accent { border-color: var(--blue-border); background: rgba(0,212,255,0.03); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--blue); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(0,100,180,0.15); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(0,100,180,0.2); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: var(--blue-border); box-shadow: 0 0 0 2px rgba(0,212,255,0.05); }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(0,100,180,0.2); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(0,100,180,0.2); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 90px; line-height: 1.6; }

  .ai-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--ai-grad); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(0,212,255,0.2); }
  .ai-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(0,212,255,0.35); }
  .ai-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-btn { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--blue-border); background: transparent; color: var(--blue); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-btn:hover { background: var(--blue3); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .ai-out { background: var(--bg3); border: 0.5px solid rgba(0,100,180,0.2); border-radius: var(--r2); padding: 14px; margin-top: 12px; }
  .ai-out-text { font-size: 12px; color: var(--w2); line-height: 1.85; white-space: pre-wrap; }

  .tab-btn { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; }
  .tab-btn.active { background: var(--blue3); border: 0.5px solid var(--blue-border); color: var(--blue); }
  .tab-btn.inactive { background: transparent; border: 0.5px solid rgba(0,100,180,0.1); color: var(--mu3); }

  .drag-zone { border: 1.5px dashed rgba(0,150,220,0.25); border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all .2s; background: rgba(0,150,220,0.03); position: relative; }
  .drag-zone:hover, .drag-zone.dragging { border-color: var(--blue); background: rgba(0,212,255,0.05); box-shadow: 0 0 20px rgba(0,212,255,0.08); }
  .drag-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
`

// ── HELPERS ───────────────────────────────────────────────────
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

function Output({ text, loading }: { text: string; loading: boolean }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  function copy() {
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function save() {
    if (!text) return
    const existing = JSON.parse(localStorage.getItem('aiStudiosSaved') || '[]')
    existing.unshift({ id: Date.now(), content: text, savedAt: new Date().toISOString() })
    localStorage.setItem('aiStudiosSaved', JSON.stringify(existing.slice(0, 100)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (!text && !loading) return null
  return (
    <div className="ai-out">
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: 'var(--blue)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
        <span className="ai-dot" />Output
      </div>
      {loading && <div className="lbar" style={{ marginBottom: '8px' }}><div className="lbar-fill" /></div>}
      {text && (
        <>
          <div className="ai-out-text">{text}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={copy} className="ghost-btn">{copied ? '✓ Copied!' : 'Copy ↗'}</button>
            <button onClick={save} className="ghost-btn" style={{ borderColor: 'rgba(0,200,83,0.3)', color: '#00c853' }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function DragDrop({ onImage, currentImage, onClear, label = 'Drag & drop image', sub = 'Any image format', height = 130 }: {
  onImage: (url: string) => void; currentImage?: string | null; onClear?: () => void; label?: string; sub?: string; height?: number
}) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className={`drag-zone${dragging ? ' dragging' : ''}`} style={{ minHeight: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: currentImage ? '0' : '20px' }}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !currentImage && ref.current?.click()}>
      <input ref={ref} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {currentImage ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <img src={currentImage} alt="uploaded" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block', borderRadius: '8px' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
            <button onClick={e => { e.stopPropagation(); ref.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'var(--blue)', fontSize: '10px', cursor: 'pointer' }}>Replace</button>
            {onClear && <button onClick={e => { e.stopPropagation(); onClear() }} className="del-btn" style={{ padding: '4px 10px' }}>Clear</button>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.4 }}>◈</div>
          <div style={{ fontSize: '12px', color: dragging ? 'var(--blue)' : 'var(--mu3)', marginBottom: '3px' }}>{dragging ? 'Drop it!' : label}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu2)' }}>{sub}</div>
        </div>
      )}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ setTool }: { setTool: (t: StudioTool) => void }) {
  const { user } = useUser()

  const sections = [
    { id: 'content', icon: '✦', label: 'Content Studio', desc: 'Hooks, captions, UGC ads, brand deals', color: '#00d4ff' },
    { id: 'cineflow', icon: '⊳', label: 'CineFlow AI', desc: 'Video prompts, storyboard, scene builder', color: '#0099ff' },
    { id: 'lipsync', icon: '◈', label: 'Lip Sync Studio', desc: 'Single, multi-character, OmniHuman', color: '#00aaff' },
    { id: 'show', icon: '◷', label: 'Show Production', desc: 'Reality TV, sitcoms, talk shows, podcast', color: '#0066ff' },
    { id: 'animation', icon: '◉', label: 'Animation Studio', desc: 'Cartoon, anime, character animation', color: '#5599ff' },
    { id: 'image', icon: '⊹', label: 'Image Generator', desc: 'Storyboard studio with face locking', color: '#00ccff' },
    { id: 'video', icon: '◌', label: 'Video Generator', desc: 'Kling AI, Higgsfield, Veo 3.1', color: '#0077ff' },
    { id: 'network', icon: '★', label: 'The Network', desc: 'Submit work, student showcase', color: '#00eeff' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(0,212,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>AI Studios Dashboard</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Welcome, <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'Creator'}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Build shows, create content, generate videos — all in one place.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '36px' }}>
        {[
          { label: 'Tools Available', value: '30+', color: 'var(--blue)' },
          { label: 'Video Models', value: '3', color: '#0099ff' },
          { label: 'Show Formats', value: '6', color: '#00aaff' },
          { label: 'AI Models', value: 'Gemini', color: '#00ccff' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(0,212,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Studios</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {sections.map(s => (
          <div key={s.id} className="card" style={{ cursor: 'pointer', transition: 'all .2s', borderColor: `${s.color}22` }}
            onClick={() => setTool(s.id as StudioTool)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}55`; (e.currentTarget as HTMLElement).style.background = `${s.color}08` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}22`; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ fontSize: '20px', color: s.color, marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '10px' }}>{s.desc}</div>
            <div style={{ fontSize: '10px', color: s.color, fontFamily: "'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CONTENT STUDIO ────────────────────────────────────────────
function ContentStudio() {
  const [tab, setTab] = useState('hooks')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  // Hooks
  const [hProduct, setHProduct] = useState('')
  const [hPlatform, setHPlatform] = useState('TikTok')
  const [hStyle, setHStyle] = useState('Bold and attention-grabbing')

  // Captions
  const [cTopic, setCTopic] = useState('')
  const [cPlatform, setCPlatform] = useState('Instagram')
  const [cTone, setCTone] = useState('Luxury and aspirational')

  // UGC
  const [uProduct, setUProduct] = useState('')
  const [uBrand, setUBrand] = useState('')
  const [uGoal, setUGoal] = useState('Drive product sales')

  // Brand Deals
  const [bdBrand, setBdBrand] = useState('')
  const [bdType, setBdType] = useState('Pitch Email')
  const [bdRate, setBdRate] = useState('$500')
  const [bdNiche, setBdNiche] = useState('Luxury fashion and lifestyle')

  async function run() {
    setLoading(true); setOutput('')
    try {
      if (tab === 'hooks') setOutput(await callAPI('generate/cineflow', { tool: 'hooks', product: hProduct, platform: hPlatform, style: hStyle }))
      else if (tab === 'captions') setOutput(await callAPI('generate/cineflow', { tool: 'captions', topic: cTopic, platform: cPlatform, tone: cTone }))
      else if (tab === 'ugc') setOutput(await callAPI('generate/cineflow', { tool: 'ugc', product: uProduct, brand: uBrand, goal: uGoal }))
      else if (tab === 'branddeals') setOutput(await callAPI('generate/cineflow', { tool: 'branddeals', brand: bdBrand, type: bdType, rate: bdRate, niche: bdNiche }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  const tabs = [
    { id: 'hooks', label: '◈ Hooks' },
    { id: 'captions', label: '⊹ Captions' },
    { id: 'ugc', label: '⊳ UGC Ad' },
    { id: 'branddeals', label: '★ Brand Deals' },
  ]

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Content <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Hooks, captions, UGC scripts, and brand deal templates — all AI-powered.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {tabs.map(t => <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : 'inactive'}`} onClick={() => { setTab(t.id); setOutput('') }}>{t.label}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          {tab === 'hooks' && <>
            <div className="ftitle">Hook Generator</div>
            <F label="Product or topic"><input className="finp" placeholder="e.g. POD hoodie, AI twin course, luxury candle" value={hProduct} onChange={e => setHProduct(e.target.value)} /></F>
            <F label="Platform"><select className="fsel" value={hPlatform} onChange={e => setHPlatform(e.target.value)}>{['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook'].map(p => <option key={p}>{p}</option>)}</select></F>
            <F label="Hook style"><select className="fsel" value={hStyle} onChange={e => setHStyle(e.target.value)}>{['Bold and attention-grabbing', 'Soft and relatable', 'Controversial question', 'Story-based', 'Transformation hook', 'POV hook'].map(s => <option key={s}>{s}</option>)}</select></F>
          </>}
          {tab === 'captions' && <>
            <div className="ftitle">Caption Writer</div>
            <F label="Post topic"><input className="finp" placeholder="e.g. New collection drop, AI twin reveal, behind the scenes" value={cTopic} onChange={e => setCTopic(e.target.value)} /></F>
            <F label="Platform"><select className="fsel" value={cPlatform} onChange={e => setCPlatform(e.target.value)}>{['Instagram', 'TikTok', 'Facebook', 'Pinterest', 'LinkedIn'].map(p => <option key={p}>{p}</option>)}</select></F>
            <F label="Tone"><select className="fsel" value={cTone} onChange={e => setCTone(e.target.value)}>{['Luxury and aspirational', 'Bold and unapologetic', 'Funny and relatable', 'Educational', 'Motivational', 'Mysterious'].map(t => <option key={t}>{t}</option>)}</select></F>
          </>}
          {tab === 'ugc' && <>
            <div className="ftitle">UGC Ad Script</div>
            <F label="Product name"><input className="finp" placeholder="e.g. Luxe Serum, Baddie Candle" value={uProduct} onChange={e => setUProduct(e.target.value)} /></F>
            <F label="Brand name"><input className="finp" placeholder="e.g. Envi Lee, your own brand" value={uBrand} onChange={e => setUBrand(e.target.value)} /></F>
            <F label="Campaign goal"><select className="fsel" value={uGoal} onChange={e => setUGoal(e.target.value)}>{['Drive product sales', 'Build brand awareness', 'Get email signups', 'Promote a discount', 'Launch a new product'].map(g => <option key={g}>{g}</option>)}</select></F>
          </>}
          {tab === 'branddeals' && <>
            <div className="ftitle">Brand Deal Templates</div>
            <F label="Brand name"><input className="finp" placeholder="e.g. Fashion Nova, Amazon" value={bdBrand} onChange={e => setBdBrand(e.target.value)} /></F>
            <F label="Template type"><select className="fsel" value={bdType} onChange={e => setBdType(e.target.value)}>{['Pitch Email', 'Rate Card', 'Follow Up Email', 'Counter Offer', 'Contract Points', 'Thank You Email'].map(t => <option key={t}>{t}</option>)}</select></F>
            <F label="Your rate"><input className="finp" placeholder="e.g. $500, $1000 per post" value={bdRate} onChange={e => setBdRate(e.target.value)} /></F>
            <F label="Your niche"><input className="finp" value={bdNiche} onChange={e => setBdNiche(e.target.value)} /></F>
          </>}
          <button className="ai-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating…' : '✦ Generate ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Quick-starts</div>
          {tab === 'hooks' && [
            'POD hoodie drop — TikTok bold hook',
            'AI twin reveal — Instagram story hook',
            'New collection launch — transformation hook',
            'Behind the scenes — relatable POV hook',
          ].map(q => <button key={q} onClick={() => setHProduct(q)} style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.15)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>{q} ↗</button>)}
          {tab === 'captions' && [
            'AI twin debut post — Instagram',
            'POD collection reveal — TikTok',
            'Motivational creator journey — all platforms',
            'New product drop — Instagram',
          ].map(q => <button key={q} onClick={() => setCTopic(q)} style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.15)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>{q} ↗</button>)}
          {tab === 'ugc' && [
            { product: 'Luxury skincare serum', brand: 'Glow Beauty', goal: 'Drive product sales' },
            { product: 'AI creator course', brand: 'Envi Lee Academy', goal: 'Get email signups' },
            { product: 'POD graphic tee', brand: 'My POD Brand', goal: 'Launch a new product' },
          ].map(q => <button key={q.product} onClick={() => { setUProduct(q.product); setUBrand(q.brand); setUGoal(q.goal) }} style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.15)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>{q.product} — {q.goal} ↗</button>)}
          {tab === 'branddeals' && [
            { brand: 'Fashion Nova', type: 'Pitch Email', rate: '$800', niche: 'Luxury fashion and lifestyle' },
            { brand: 'Amazon', type: 'Rate Card', rate: '$500', niche: 'AI creator and tech lifestyle' },
            { brand: 'SheaMoisture', type: 'Pitch Email', rate: '$600', niche: 'Black beauty and lifestyle' },
          ].map(q => <button key={q.brand} onClick={() => { setBdBrand(q.brand); setBdType(q.type); setBdRate(q.rate); setBdNiche(q.niche) }} style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.15)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>{q.brand} — {q.type} ↗</button>)}
        </div>
      </div>
    </div>
  )
}

// ── CINEFLOW AI ───────────────────────────────────────────────
function CineFlowAI() {
  const [tab, setTab] = useState('prompt')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const [vpType, setVpType] = useState('fashion')
  const [vpSubject, setVpSubject] = useState('')
  const [vpCharacter, setVpCharacter] = useState('Black woman, confident, luxury lifestyle')
  const [vpSetting, setVpSetting] = useState('')
  const [vpPlatform, setVpPlatform] = useState('TikTok')

  const [sbProject, setSbProject] = useState('Reality Show')
  const [sbTitle, setSbTitle] = useState('')
  const [sbStory, setSbStory] = useState('')
  const [sbScenes, setSbScenes] = useState('4')

  async function run() {
    setLoading(true); setOutput('')
    try {
      if (tab === 'prompt') setOutput(await callAPI('generate/cineflow', { tool: 'prompt', type: vpType, subject: vpSubject, character: vpCharacter, setting: vpSetting, platform: vpPlatform }))
      else if (tab === 'storyboard') setOutput(await callAPI('generate/cineflow', { tool: 'storyboard', projectType: sbProject, title: sbTitle, story: sbStory, scenes: sbScenes }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        CineFlow <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI™</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Generate cinematic video prompts and storyboards for your content.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[['prompt', '⊳ Video Prompt'], ['storyboard', '◈ Storyboard']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : 'inactive'}`} onClick={() => { setTab(id); setOutput('') }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          {tab === 'prompt' && <>
            <div className="ftitle">Video Prompt Generator</div>
            <F label="Content type"><select className="fsel" value={vpType} onChange={e => setVpType(e.target.value)}>{['fashion', 'lifestyle', 'product', 'reality tv scene', 'music video', 'UGC', 'cinematic', 'talking head', 'dance'].map(t => <option key={t}>{t}</option>)}</select></F>
            <F label="Subject"><input className="finp" placeholder="e.g. New collection, AI twin walking in NYC" value={vpSubject} onChange={e => setVpSubject(e.target.value)} /></F>
            <F label="Character"><input className="finp" value={vpCharacter} onChange={e => setVpCharacter(e.target.value)} /></F>
            <F label="Setting"><input className="finp" placeholder="e.g. Luxury penthouse, NYC rooftop, beach" value={vpSetting} onChange={e => setVpSetting(e.target.value)} /></F>
            <F label="Platform"><select className="fsel" value={vpPlatform} onChange={e => setVpPlatform(e.target.value)}>{['TikTok', 'Instagram Reels', 'YouTube', 'Facebook'].map(p => <option key={p}>{p}</option>)}</select></F>
          </>}
          {tab === 'storyboard' && <>
            <div className="ftitle">Scene Storyboard</div>
            <F label="Project type"><select className="fsel" value={sbProject} onChange={e => setSbProject(e.target.value)}>{['Reality Show', 'Music Video', 'Short Film', 'Sitcom', 'Talk Show', 'News Broadcast', 'Podcast Video', 'UGC Campaign'].map(t => <option key={t}>{t}</option>)}</select></F>
            <F label="Title"><input className="finp" placeholder="e.g. Baddie House, The Come Up" value={sbTitle} onChange={e => setSbTitle(e.target.value)} /></F>
            <F label="Story"><textarea className="fta" placeholder="Describe your story, characters, and key scenes..." value={sbStory} onChange={e => setSbStory(e.target.value)} /></F>
            <F label="Number of scenes"><select className="fsel" value={sbScenes} onChange={e => setSbScenes(e.target.value)}>{['3', '4', '5', '6', '8'].map(n => <option key={n}>{n}</option>)}</select></F>
          </>}
          <button className="ai-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating…' : '✦ Generate ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Quick-starts</div>
          {[
            { label: 'Reality TV Drama Scene', type: 'reality tv scene', subject: 'Two women confronting each other in a luxury penthouse', setting: 'NYC luxury penthouse rooftop pool' },
            { label: 'Music Video Opening', type: 'music video', subject: 'AI pop star entrance scene', setting: 'Empty stage transforming into luxury world' },
            { label: 'UGC Lifestyle', type: 'UGC', subject: 'Creator showing off new POD collection', setting: 'LA rooftop, golden hour' },
            { label: 'Cinematic Fashion', type: 'fashion', subject: 'AI model walking in luxury designer', setting: 'Paris streets, evening light' },
          ].map(q => (
            <button key={q.label} onClick={() => { setVpType(q.type); setVpSubject(q.subject); setVpSetting(q.setting); setTab('prompt') }}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.15)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>
              {q.label} ↗
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── LIP SYNC STUDIO ───────────────────────────────────────────
function LipSyncStudio() {
  const [tab, setTab] = useState('single')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [scenePrompt, setScenePrompt] = useState('')
  const [character, setCharacter] = useState('Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs')
  const [c1Name, setC1Name] = useState(''); const [c1Desc, setC1Desc] = useState('')
  const [c2Name, setC2Name] = useState(''); const [c2Desc, setC2Desc] = useState('')
  const [scriptContext, setScriptContext] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)

  async function generateOmniHuman() {
    if (!characterPhoto) { alert('Please upload a character photo first'); return }
    if (!audioUrl.trim()) { alert('Please enter an audio URL from ElevenLabs'); return }
    setVideoLoading(true); setVideoUrl(null)
    try {
      const res = await fetch('/api/generate/omnihuman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: characterPhoto, audioUrl, prompt: scenePrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.videoUrl) setVideoUrl(data.videoUrl)
      else if (data.requestId) {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 5000))
          const poll = await fetch(`/api/generate/omnihuman?requestId=${data.requestId}`)
          const pd = await poll.json()
          if (pd.status === 'completed' && pd.videoUrl) { setVideoUrl(pd.videoUrl); break }
          if (pd.status === 'failed') throw new Error('Generation failed')
        }
      }
    } catch (e) { alert(`Error: ${(e as Error).message}`) }
    finally { setVideoLoading(false) }
  }

  async function run() {
    setLoading(true); setOutput('')
    try {
      if (tab === 'single') setOutput(await callAPI('generate/cineflow', { tool: 'lipsync', character, context: scriptContext }))
      else if (tab === 'multi') setOutput(await callAPI('generate/cineflow', { tool: 'multi', c1Name, c1Desc, c2Name, c2Desc, context: scriptContext }))
      else if (tab === 'voice') setOutput(await callAPI('generate/cineflow', { tool: 'voicescript', character, context: scriptContext }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  const tabs = [
    { id: 'single', label: '◈ Single Character' },
    { id: 'multi', label: '⊹ Multi-Character' },
    { id: 'voice', label: '◷ Voice Script' },
    { id: 'omnihuman', label: '✦ OmniHuman Studio' },
    { id: 'videosync', label: '⊳ Video Lip Sync' },
  ]

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Lip Sync <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Write scripts, generate dialogue, and create OmniHuman lip sync videos.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {tabs.map(t => <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : 'inactive'}`} onClick={() => { setTab(t.id); setOutput('') }}>{t.label}</button>)}
      </div>

      {tab !== 'omnihuman' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card hi">
            {tab === 'single' && <>
              <div className="ftitle">Single Character Script</div>
              <F label="Character"><select className="fsel" value={character} onChange={e => setCharacter(e.target.value)}>{['Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs', 'Nova Star — AI pop artist, 23, glamorous performer', 'Baddie Nova — streetwear creator, 24, bold energy', 'Marcus Reed — drama lead, 32, commanding presence'].map(c => <option key={c}>{c}</option>)}</select></F>
              <F label="Scene context"><textarea className="fta" placeholder="What is this character talking about? What scene is this?" value={scriptContext} onChange={e => setScriptContext(e.target.value)} /></F>
            </>}
            {tab === 'multi' && <>
              <div className="ftitle">Multi-Character Dialogue</div>
              <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '0.5px solid rgba(0,100,180,0.15)' }}>
                <div style={{ fontSize: '10px', color: 'var(--blue)', fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>CHARACTER 1</div>
                <F label="Name"><input className="finp" placeholder="e.g. Luxe Envi" value={c1Name} onChange={e => setC1Name(e.target.value)} /></F>
                <F label="Description"><input className="finp" placeholder="e.g. Bold, luxury boss, sarcastic" value={c1Desc} onChange={e => setC1Desc(e.target.value)} /></F>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '0.5px solid rgba(0,100,180,0.15)' }}>
                <div style={{ fontSize: '10px', color: 'var(--blue)', fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>CHARACTER 2</div>
                <F label="Name"><input className="finp" placeholder="e.g. Marcus Reed" value={c2Name} onChange={e => setC2Name(e.target.value)} /></F>
                <F label="Description"><input className="finp" placeholder="e.g. Intense, commanding, mysterious" value={c2Desc} onChange={e => setC2Desc(e.target.value)} /></F>
              </div>
              <F label="Scene context"><textarea className="fta" placeholder="What is this scene about?" value={scriptContext} onChange={e => setScriptContext(e.target.value)} /></F>
            </>}
            {tab === 'voice' && <>
              <div className="ftitle">Voice Script Generator</div>
              <F label="Character"><input className="finp" placeholder="Character name and personality" value={character} onChange={e => setCharacter(e.target.value)} /></F>
              <F label="Script context"><textarea className="fta" placeholder="What should this voice script be about?" value={scriptContext} onChange={e => setScriptContext(e.target.value)} /></F>
            </>}
            <button className="ai-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Generating…' : '✦ Generate Script ↗'}
            </button>
            <Output text={output} loading={loading} />
          </div>
          <div className="card">
            <div className="ftitle">ElevenLabs Integration</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '16px' }}>
              Generate your script here → take it to ElevenLabs → generate the voice → bring the audio back for OmniHuman lip sync.
            </div>
            <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="ai-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '12px', fontSize: '12px' }}>
              Open ElevenLabs ↗
            </a>
            <div style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", lineHeight: '1.8' }}>
              1. Copy your script ↗<br />
              2. Paste into ElevenLabs<br />
              3. Select your voice<br />
              4. Download the MP3<br />
              5. Upload to Google Drive → get shareable link<br />
              6. Paste URL into OmniHuman Studio
            </div>
          </div>
        </div>
      )}

      {tab === 'omnihuman' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div className="card hi" style={{ marginBottom: '14px' }}>
              <div className="ftitle">Character Photo</div>
              <DragDrop label="Drag your character photo" sub="From Flow, Consistent Characters, or any AI tool" currentImage={characterPhoto} onImage={setCharacterPhoto} onClear={() => setCharacterPhoto(null)} height={150} />
            </div>
            <div className="card hi" style={{ marginBottom: '14px' }}>
              <div className="ftitle">Audio File</div>
              <F label="ElevenLabs audio URL">
                <input className="finp" placeholder="https://... (paste Google Drive or cloud storage link)" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} />
              </F>
            </div>
            <div className="card hi">
              <div className="ftitle">Scene Direction</div>
              <F label="Describe movement and energy">
                <textarea className="fta" placeholder="e.g. Powerful Black woman in designer clothes, dramatic gestures, reality TV aesthetic..." value={scenePrompt} onChange={e => setScenePrompt(e.target.value)} />
              </F>
              <button className="ai-btn" onClick={generateOmniHuman} disabled={videoLoading} style={{ width: '100%' }}>
                {videoLoading ? 'Generating — 1–3 minutes…' : '✦ Generate OmniHuman Video'}
              </button>
            </div>
          </div>
          <div className="card accent">
            <div className="ftitle">Generated Video</div>
            <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid rgba(0,100,180,0.15)' }}>
              {videoLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.4 }}>✦</div>
                  <div style={{ fontSize: '13px', color: 'var(--blue)', marginBottom: '8px' }}>OmniHuman generating…</div>
                  <div className="lbar" style={{ width: '120px', margin: '0 auto' }}><div className="lbar-fill" /></div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '8px' }}>Full body movement + lip sync · 1–3 min</div>
                </div>
              ) : videoUrl ? (
                <video src={videoUrl} controls autoPlay loop style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.15 }}>✦</div>
                  <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Video appears here</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Upload photo + audio → Generate</div>
                </div>
              )}
            </div>
            {videoUrl && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={videoUrl} download target="_blank" rel="noreferrer" className="ai-btn" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '12px', padding: '9px' }}>⬇ Download</a>
                <button onClick={() => setVideoUrl(null)} className="del-btn" style={{ padding: '9px 12px' }}>✕</button>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === 'videosync' && (
        <div>
          <div style={{ background: 'rgba(0,212,255,0.06)', border: '0.5px solid rgba(0,212,255,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: 'var(--blue)', fontFamily: "'DM Mono',monospace" }}>
            ✦ Powered by Sync.so + Higgsfield · Upload video + audio → perfect lip sync in minutes
          </div>
          <VideoLipSyncStudio />
        </div>
      )}
    </div>
  )
}
// ── SHOW PRODUCTION ───────────────────────────────────────────
function ShowProduction() {
  const [showType, setShowType] = useState('Reality TV')
  const [tab, setTab] = useState('script')
  const [title, setTitle] = useState('')
  const [premise, setPremise] = useState('')
  const [cast, setCast] = useState('')
  const [episode, setEpisode] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const showTypes = ['Reality TV', 'Sitcom', 'Talk Show', 'News Broadcast', 'Podcast Video', 'Drama Series', 'Documentary', 'Variety Show', 'Anime/Animation']
  const tabs = [['script', 'Script'], ['episode', 'Episode Plan'], ['characters', 'Character Bios'], ['logline', 'Logline & Pitch'], ['network', 'Network Guide']]

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/show', { showType, tab, title, premise, cast, episode })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Show <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Production</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Build your AI show — reality TV, sitcoms, talk shows, news, podcasts, and more.</div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>Show Type</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {showTypes.map(t => (
            <button key={t} onClick={() => setShowType(t)} className={`tab-btn ${showType === t ? 'active' : 'inactive'}`} style={{ fontSize: '10px', padding: '5px 10px' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {tabs.map(([id, label]) => <button key={id} className={`tab-btn ${tab === id ? 'active' : 'inactive'}`} onClick={() => { setTab(id); setOutput('') }}>{label}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">{showType} — {tab}</div>
          <F label="Show title"><input className="finp" placeholder="e.g. Baddie House, The Envi Lee Network" value={title} onChange={e => setTitle(e.target.value)} /></F>
          <F label="Show premise"><textarea className="fta" placeholder={`What is this ${showType} about? Who are the main characters? What's the drama?`} value={premise} onChange={e => setPremise(e.target.value)} /></F>
          <F label="Main cast"><input className="finp" placeholder="e.g. Luxe Envi, Marcus Reed, Nova Star" value={cast} onChange={e => setCast(e.target.value)} /></F>
          {tab === 'script' && <F label="Episode number/focus"><input className="finp" placeholder="e.g. Episode 1 — First arrivals" value={episode} onChange={e => setEpisode(e.target.value)} /></F>}
          <button className="ai-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Writing…' : `✦ Write ${tab.charAt(0).toUpperCase() + tab.slice(1)} ↗`}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Show Quick-starts</div>
          {[
            { type: 'Reality TV', title: 'Baddie House', premise: '4 Black women AI influencers move into a luxury LA mansion. Mix of drama, business, and sisterhood.' },
            { type: 'Drama Series', title: 'The Empire Files', premise: 'A young Black woman builds a billion-dollar AI empire while navigating betrayal, love, and power.' },
            { type: 'Talk Show', title: 'The Envi Lee Show', premise: 'AI host interviews AI celebrities, entrepreneurs, and cultural icons about success, love, and impact.' },
            { type: 'Anime/Animation', title: 'Creator Chronicles', premise: 'A group of AI creators with special digital powers protect the creative world from copycats and villains.' },
          ].map(q => (
            <button key={q.title} onClick={() => { setShowType(q.type); setTitle(q.title); setPremise(q.premise) }}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '10px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.15)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--blue)', marginBottom: '2px' }}>{q.type} — {q.title}</div>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', lineHeight: '1.4' }}>{q.premise.slice(0, 80)}…</div>
            </button>
          ))}
          <div style={{ marginTop: '16px' }}>
            <div className="ftitle">The Envi Lee AI Network</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.7' }}>
              Finish your show → submit to The Network tab → get featured on the Envi Lee AI Network platform. Your students' best work could be seen by thousands.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ANIMATION STUDIO ──────────────────────────────────────────
function AnimationStudio() {
  const [style, setStyle] = useState('Anime')
  const [concept, setConcept] = useState('')
  const [characters, setCharacters] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/show', { showType: style, tab: 'script', title: style + ' Project', premise: concept, cast: characters, episode: 'Episode 1' })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  const styles = ['Anime', 'Cartoon', '2D Animation', '3D Animation', 'Stop Motion', 'Motion Graphics', 'Character Design']

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Animation <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Create anime, cartoons, and animated content — scripts, character designs, and scene prompts.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {styles.map(s => <button key={s} className={`tab-btn ${style === s ? 'active' : 'inactive'}`} onClick={() => setStyle(s)} style={{ fontSize: '11px' }}>{s}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">{style} Creator</div>
          <F label="Concept"><textarea className="fta" placeholder={`Describe your ${style} concept, world, and story...`} value={concept} onChange={e => setConcept(e.target.value)} /></F>
          <F label="Main characters"><input className="finp" placeholder="e.g. Zara — a creator with digital powers" value={characters} onChange={e => setCharacters(e.target.value)} /></F>
          <button className="ai-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating…' : `✦ Create ${style} Project ↗`}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Animation Tools</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '16px', lineHeight: '1.7' }}>
            Use these tools to bring your animations to life after generating your scripts and character designs here.
          </div>
          {[
            { name: 'Kling AI', url: 'https://klingai.com', desc: 'Turn still images into animated sequences' },
            { name: 'Pika Labs', url: 'https://pika.art', desc: 'AI video and animation generator' },
            { name: 'D-ID', url: 'https://d-id.com', desc: 'Animated talking characters' },
            { name: 'Adobe Firefly', url: 'https://firefly.adobe.com', desc: 'AI illustration and animation tools' },
            { name: 'Canva Animate', url: 'https://canva.com', desc: 'Easy animation for any design' },
          ].map(t => (
            <a key={t.name} href={t.url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.1)', borderRadius: '8px', marginBottom: '7px', textDecoration: 'none', transition: 'border .2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,100,180,0.1)')}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--w)', fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '1px' }}>{t.desc}</div>
              </div>
              <span style={{ color: 'var(--blue)', fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>Open ↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── IMAGE GENERATOR ───────────────────────────────────────────
function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [size, setSize] = useState('landscape')
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [faceLocked, setFaceLocked] = useState(false)

  async function generate() {
    if (!prompt.trim()) { alert('Please enter a prompt'); return }
    setLoading(true); setImageUrl(null)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size, facePhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImageUrl(data.imageUrl)
      if (data.faceLocked) setFaceLocked(true)
    } catch (e) { alert(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  function save() {
    if (!imageUrl) return
    const existing = JSON.parse(localStorage.getItem('aiStudiosSaved') || '[]')
    existing.unshift({ id: Date.now(), type: 'image', content: '', imageUrl, prompt, savedAt: new Date().toISOString() })
    localStorage.setItem('aiStudiosSaved', JSON.stringify(existing.slice(0, 100)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Image <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Generator</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Generate cinematic still images — drag a character photo to lock their face into every image.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Face Reference (Optional)</div>
            <DragDrop label="Drag character photo to lock face" sub="Uses Gemini 3 Pro Image for consistency" currentImage={facePhoto}
              onImage={url => { setFacePhoto(url); setFaceLocked(true) }}
              onClear={() => { setFacePhoto(null); setFaceLocked(false) }} height={130} />
            {facePhoto && <div style={{ fontSize: '10px', color: 'var(--blue)', fontFamily: "'DM Mono',monospace", marginTop: '8px', textAlign: 'center' }}>🔒 Face reference locked in</div>}
          </div>
          <div className="card hi">
            <div className="ftitle">Image Details</div>
            <F label="Prompt"><textarea className="fta" placeholder="e.g. Black woman in luxury crop tee on NYC rooftop at golden hour, cinematic film still..." value={prompt} onChange={e => setPrompt(e.target.value)} /></F>
            <F label="Style"><select className="fsel" value={style} onChange={e => setStyle(e.target.value)}>{['cinematic', 'fashion', 'luxury', 'streetwear', 'portrait', 'dramatic', 'vibrant'].map(s => <option key={s}>{s}</option>)}</select></F>
            <F label="Size"><select className="fsel" value={size} onChange={e => setSize(e.target.value)}>{[['landscape', 'Landscape 16:9'], ['portrait', 'Portrait 3:4'], ['tiktok', 'TikTok 9:16'], ['square', 'Square 1:1']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></F>
            <button className="ai-btn" onClick={generate} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Generating…' : '✦ Generate Image'}
            </button>
          </div>
        </div>
        <div className="card accent">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,100,180,0.15)' }}>
            <div className="ftitle" style={{ margin: 0, padding: 0, border: 'none' }}>Generated Image</div>
            {faceLocked && <div style={{ fontSize: '9px', color: 'var(--blue)', fontFamily: "'DM Mono',monospace", padding: '2px 8px', background: 'var(--blue3)', border: '0.5px solid var(--blue-border)', borderRadius: '4px' }}>🔒 Face Locked</div>}
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid rgba(0,100,180,0.1)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="lbar" style={{ width: '100px', margin: '0 auto 10px' }}><div className="lbar-fill" /></div>
                <div style={{ fontSize: '13px', color: 'var(--blue)' }}>Generating…</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '6px' }}>Usually 5–15 seconds</div>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="generated" style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.1 }}>◈</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Image appears here</div>
              </div>
            )}
          </div>
          {imageUrl && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={imageUrl} download target="_blank" rel="noreferrer" className="ai-btn" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '12px', padding: '9px' }}>⬇ Download</a>
              <button onClick={save} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: `0.5px solid ${saved ? 'var(--blue)' : 'rgba(0,100,180,0.2)'}`, background: saved ? 'var(--blue3)' : 'var(--s1)', color: saved ? 'var(--blue)' : 'var(--mu3)', fontSize: '12px', cursor: 'pointer' }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
              <button onClick={generate} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: '0.5px solid rgba(0,100,180,0.15)', background: 'var(--s1)', color: 'var(--blue)', fontSize: '12px', cursor: 'pointer' }}>↺ Redo</button>
              <button onClick={() => setImageUrl(null)} className="del-btn" style={{ padding: '9px 12px' }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── VIDEO GENERATOR ───────────────────────────────────────────
function VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState('kling')
  const [duration, setDuration] = useState('5')
  const [ratio, setRatio] = useState('9:16')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function generate() {
    if (!prompt.trim()) { alert('Please enter a prompt'); return }
    setLoading(true); setVideoUrl(null)
    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, duration, aspectRatio: ratio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVideoUrl(data.videoUrl)
    } catch (e) { alert(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  function save() {
    if (!videoUrl) return
    const existing = JSON.parse(localStorage.getItem('aiStudiosSaved') || '[]')
    existing.unshift({ id: Date.now(), type: 'video', content: '', imageUrl: videoUrl, prompt, savedAt: new Date().toISOString() })
    localStorage.setItem('aiStudiosSaved', JSON.stringify(existing.slice(0, 100)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Video <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Generator</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Generate AI videos with Kling AI, Higgsfield, and Google Veo 3.1.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Video Details</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
            {[['kling', 'Kling AI', '#00d4ff'], ['higgsfield', 'Higgsfield', '#0099ff'], ['veo', 'Veo 3.1', '#0066ff']].map(([id, name, color]) => (
              <button key={id} onClick={() => setProvider(id)}
                style={{ padding: '7px 14px', borderRadius: '7px', border: `0.5px solid ${provider === id ? color : 'rgba(0,100,180,0.15)'}`, background: provider === id ? `${color}15` : 'var(--s1)', color: provider === id ? color : 'var(--mu3)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                {name}
              </button>
            ))}
          </div>
          <F label="Prompt"><textarea className="fta" placeholder="e.g. Black woman in luxury crop tee on NYC rooftop, golden hour, slow cinematic push-in..." value={prompt} onChange={e => setPrompt(e.target.value)} /></F>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Duration"><select className="fsel" value={duration} onChange={e => setDuration(e.target.value)}>{['3', '5', '8', '10'].map(d => <option key={d}>{d}s</option>)}</select></F>
            <F label="Aspect ratio"><select className="fsel" value={ratio} onChange={e => setRatio(e.target.value)}>{['9:16', '16:9', '1:1', '4:3'].map(r => <option key={r}>{r}</option>)}</select></F>
          </div>
          <button className="ai-btn" onClick={generate} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating — this takes a minute…' : '⊳ Generate Video'}
          </button>
        </div>
        <div className="card accent">
          <div className="ftitle">Generated Video</div>
          <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid rgba(0,100,180,0.1)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="lbar" style={{ width: '100px', margin: '0 auto 10px' }}><div className="lbar-fill" /></div>
                <div style={{ fontSize: '13px', color: 'var(--blue)' }}>{provider === 'kling' ? 'Kling AI' : provider === 'higgsfield' ? 'Higgsfield' : 'Veo 3.1'} generating…</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '6px' }}>Usually 1–3 minutes</div>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay loop style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.1 }}>⊳</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Video appears here</div>
              </div>
            )}
          </div>
          {videoUrl && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={videoUrl} download target="_blank" rel="noreferrer" className="ai-btn" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '12px', padding: '9px' }}>⬇ Download</a>
              <button onClick={save} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: `0.5px solid ${saved ? 'var(--blue)' : 'rgba(0,100,180,0.2)'}`, background: saved ? 'var(--blue3)' : 'var(--s1)', color: saved ? 'var(--blue)' : 'var(--mu3)', fontSize: '12px', cursor: 'pointer' }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
              <button onClick={generate} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: '0.5px solid rgba(0,100,180,0.15)', background: 'var(--s1)', color: 'var(--blue)', fontSize: '12px', cursor: 'pointer' }}>↺ Redo</button>
              <button onClick={() => setVideoUrl(null)} className="del-btn" style={{ padding: '9px 12px' }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── THE NETWORK ───────────────────────────────────────────────
function TheNetwork() {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Reality Show')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    if (!title.trim()) { alert('Please add a title'); return }
    setSubmitted(true)
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Envi Lee <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Network</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Submit your finished work — the best student projects get featured on the Envi Lee AI Network.</div>

      <div style={{ background: 'rgba(0,212,255,0.04)', border: '0.5px solid var(--blue-border)', borderRadius: '14px', padding: '24px', marginBottom: '28px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '8px' }}>
          Your Work. <span style={{ color: 'var(--blue)' }}>Our Network.</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto' }}>
          The Envi Lee AI Network is being built to feature AI shows, movies, music videos, and content created by students like you. Submit your best work to be considered for the network.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Submit Your Work</div>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✦</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--blue)', marginBottom: '8px' }}>Submitted!</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7' }}>Your work has been submitted for review. Envi Lee reviews all submissions and will reach out if selected for the network.</div>
              <button onClick={() => setSubmitted(false)} className="ai-btn" style={{ marginTop: '16px', fontSize: '12px' }}>Submit Another ↗</button>
            </div>
          ) : (
            <>
              <F label="Project title"><input className="finp" placeholder="e.g. Baddie House Season 1" value={title} onChange={e => setTitle(e.target.value)} /></F>
              <F label="Content type"><select className="fsel" value={type} onChange={e => setType(e.target.value)}>{['Reality Show', 'Music Video', 'Short Film', 'Sitcom', 'Talk Show', 'Animation', 'Documentary', 'Podcast'].map(t => <option key={t}>{t}</option>)}</select></F>
              <F label="Description"><textarea className="fta" placeholder="Describe your project, what you created, and why it should be featured..." value={description} onChange={e => setDescription(e.target.value)} /></F>
              <button className="ai-btn" onClick={submit} style={{ width: '100%' }}>Submit to The Network ↗</button>
            </>
          )}
        </div>
        <div className="card">
          <div className="ftitle">How to Build Your Own Network</div>
          {[
            ['Step 1 — Pick your niche', 'Decide what kind of AI content your network will feature. Reality TV? Music? Drama? Niche networks build loyal audiences faster.'],
            ['Step 2 — Build your catalog', 'Create 3-5 shows or videos before launching. A network with content is more credible than an empty platform.'],
            ['Step 3 — Choose your platform', 'YouTube, TikTok, Patreon, or your own website. Start where your audience already is.'],
            ['Step 4 — Feature other creators', 'Partner with your classmates. A network is stronger with multiple creators contributing content.'],
            ['Step 5 — Monetize', 'Brand deals, subscriptions, merchandise, licensing — AI network content can generate real income.'],
          ].map(([t, d]) => (
            <div key={t} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--blue)', marginBottom: '3px' }}>{t}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.6' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SAVED WORK ────────────────────────────────────────────────
function SavedWork() {
  const [items, setItems] = useState<Array<{ id: number; content: string; imageUrl?: string; prompt?: string; savedAt: string }>>([])

  useState(() => {
    setItems(JSON.parse(localStorage.getItem('aiStudiosSaved') || '[]'))
  })

  function del(id: number) {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('aiStudiosSaved', JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Saved <span style={{ background: 'var(--ai-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Work</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>All your saved scripts, images, and videos from AI Studios.</div>
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>◌</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No saved work yet</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Use any tool and click Save to see your work here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {items.map(item => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                <button onClick={() => del(item.id)} className="del-btn">Delete</button>
              </div>
              {item.imageUrl && (
                item.imageUrl.includes('.mp4') || item.imageUrl.startsWith('https') ?
                  <video src={item.imageUrl} controls style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', maxHeight: '200px' }} /> :
                  <img src={item.imageUrl} alt="saved" style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', maxHeight: '200px', objectFit: 'cover' }} />
              )}
              {item.content && <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', maxHeight: '100px', overflow: 'hidden' }}>{item.content}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AI BOT ────────────────────────────────────────────────────
function AIBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "I'm your AI Studios assistant! Ask me anything about creating shows, writing scripts, generating videos, building your AI network, or any other AI Studios tools." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are an AI Studios assistant for Envi Lee AI Studios. Help with: creating AI shows and movies, writing scripts, generating video prompts, building AI networks, content strategy, lip sync, and all AI creative tools. Be specific, creative, and inspiring. Question: ${msg}` })
      setMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '340px', background: '#030508', border: '0.5px solid var(--blue-border)', borderRadius: '16px', boxShadow: '0 0 40px rgba(0,212,255,0.08)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'rgba(0,212,255,0.06)', borderBottom: '0.5px solid rgba(0,150,220,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--blue)', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span className="ai-dot" />AI Studios Assistant
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '88%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(0,212,255,0.1)' : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? 'var(--blue-border)' : 'rgba(0,100,180,0.15)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: 'var(--blue)', alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px', border: '0.5px solid rgba(0,100,180,0.15)' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '0.5px solid rgba(0,100,180,0.15)', display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid rgba(0,100,180,0.2)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'var(--ai-grad)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── SIDEBAR NAV ───────────────────────────────────────────────
const NAV: { tool: StudioTool; label: string; icon: string }[] = [
  { tool: 'dashboard', label: 'Dashboard', icon: '◉' },
  { tool: 'content', label: 'Content Studio', icon: '✦' },
  { tool: 'cineflow', label: 'CineFlow AI™', icon: '⊳' },
  { tool: 'lipsync', label: 'Lip Sync Studio', icon: '◈' },
  { tool: 'show', label: 'Show Production', icon: '◷' },
  { tool: 'animation', label: 'Animation Studio', icon: '◉' },
  { tool: 'image', label: 'Image Generator', icon: '⊹' },
  { tool: 'video', label: 'Video Generator', icon: '◌' },
  { tool: 'network', label: 'The Network', icon: '★' },
  { tool: 'saved', label: 'Saved Work', icon: '◎' },
]

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function AIStudiosPage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<StudioTool>('dashboard')
  const [hovered, setHovered] = useState<StudioTool | null>(null)
  const [botOpen, setBotOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

          {/* SIDEBAR */}
          <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(0,80,150,0.15)', padding: 0, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(0,80,150,0.15)' }}>
              <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg,#00d4ff,#0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>⊳</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800, color: 'var(--w)' }}>AI Studios™</div>
                  <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px' }}>Envi Lee</div>
                </div>
              </div>
            </div>

            {user && (
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(0,80,150,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(0,212,255,0.05)', borderRadius: '8px', border: '0.5px solid var(--blue-border)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Creator'}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(0,212,255,0.5)', fontFamily: "'DM Mono',monospace" }}>All Access</div>
                  </div>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                </div>
              </div>
            )}

            <div style={{ padding: '10px', flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Tools</div>
              {NAV.map(({ tool, label, icon }) => (
                <button key={tool} onClick={() => setActive(tool)}
                  onMouseEnter={() => setHovered(tool)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'var(--blue-border)' : 'transparent'}`, background: active === tool ? 'rgba(0,212,255,0.07)' : hovered === tool ? 'rgba(0,212,255,0.03)' : 'none', color: active === tool ? 'var(--blue)' : hovered === tool ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(0,80,150,0.15)' }}>
              <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.8px' }}>Quick Links</div>
              {[
                { label: 'ElevenLabs', url: 'https://elevenlabs.io' },
                { label: 'Kling AI', url: 'https://klingai.com' },
                { label: 'Google Flow', url: 'https://labs.google/flow' },
                { label: 'CapCut', url: 'https://capcut.com' },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: 'block', padding: '5px 8px', fontSize: '11px', color: 'var(--mu3)', textDecoration: 'none', fontFamily: "'DM Mono',monospace", borderRadius: '5px', marginBottom: '2px', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--mu3)')}>
                  {l.label} ↗
                </a>
              ))}
            </div>
          </aside>

          {/* MAIN */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '28px', position: 'relative', background: 'radial-gradient(ellipse at 80% 0%, rgba(0,100,200,0.04) 0%, transparent 50%)' }}>
            {active === 'dashboard' && <Dashboard setTool={setActive} />}
            {active === 'content' && <ContentStudio />}
            {active === 'cineflow' && <CineFlowAI />}
            {active === 'lipsync' && <LipSyncStudio />}
            {active === 'show' && <ShowProduction />}
            {active === 'animation' && <AnimationStudio />}
            {active === 'image' && <ImageGenerator />}
            {active === 'video' && <VideoGenerator />}
            {active === 'network' && <TheNetwork />}
            {active === 'saved' && <SavedWork />}
          </main>

          {/* BOT */}
          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#0066ff)', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,212,255,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botOpen ? '✕' : '⊳'}
          </button>
          {botOpen && <AIBot onClose={() => setBotOpen(false)} />}
        </div>
      </SignedIn>
    </>
  )
}
