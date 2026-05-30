'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type SuiteTool = 'dashboard' | 'characters' | 'tryon' | 'calculator' | 'saved' | 'pricing' | 'admin'

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

const css = `
  :root {
    --bg: #000;
    --bg2: #020a04;
    --bg3: #051008;
    --s1: #081408;
    --s2: #0f1e0f;
    --w: #e8fff0;
    --w2: #c0f0d0;
    --mu: #0a2010;
    --mu2: #1a4020;
    --mu3: #4a8060;
    --r: 8px; --r2: 12px; --r3: 16px;
    --green: #00ff88;
    --green2: #00cc66;
    --green3: rgba(0,255,136,0.07);
    --gb: rgba(0,255,136,0.25);
    --gg: rgba(0,255,136,0.1);
    --g-grad: linear-gradient(135deg, #00ff88, #00cc66);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #0a1a0a; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--g-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .g-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(0,200,100,0.12); border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: rgba(0,255,136,0.2); }
  .card.accent { border-color: var(--gb); background: var(--green3); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--green); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(0,200,100,0.12); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(0,200,100,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: var(--gb); }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(0,200,100,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(0,200,100,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .g-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--g-grad); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(0,255,136,0.2); }
  .g-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(0,255,136,0.35); }
  .g-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-btn { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--gb); background: transparent; color: var(--green); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-btn:hover { background: var(--green3); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .ai-out { background: var(--bg3); border: 0.5px solid rgba(0,200,100,0.15); border-radius: var(--r2); padding: 14px; margin-top: 12px; }
  .ai-out-text { font-size: 12px; color: var(--w2); line-height: 1.85; white-space: pre-wrap; }

  .char-card { background: var(--s1); border: 0.5px solid rgba(0,200,100,0.12); border-radius: var(--r2); overflow: hidden; cursor: pointer; transition: all .2s; }
  .char-card:hover { border-color: rgba(0,255,136,0.3); }
  .char-card.locked { border-color: rgba(0,255,136,0.35); box-shadow: 0 0 15px rgba(0,255,136,0.08); }

  .drag-zone { border: 1.5px dashed rgba(0,200,100,0.2); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all .2s; background: var(--green3); position: relative; }
  .drag-zone:hover { border-color: var(--green); background: rgba(0,255,136,0.05); }
  .drag-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .tab-btn { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .tab-btn.active { background: var(--green3); border: 0.5px solid var(--gb); color: var(--green); }
  .tab-btn.inactive { background: transparent; border: 0.5px solid rgba(0,200,100,0.08); color: var(--mu3); }
`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

function DragDrop({ onImage, currentImage, onClear, label = 'Drag photo here', sub = 'Any image', height = 130 }: {
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
          <img src={currentImage} alt="uploaded" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
            <button onClick={e => { e.stopPropagation(); ref.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'var(--green)', fontSize: '10px', cursor: 'pointer' }}>Replace</button>
            {onClear && <button onClick={e => { e.stopPropagation(); onClear() }} className="del-btn" style={{ padding: '4px 10px' }}>Clear</button>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '6px', opacity: 0.4 }}>◈</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '3px' }}>{label}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu2)' }}>{sub}</div>
        </div>
      )}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ setTool }: { setTool: (t: SuiteTool) => void }) {
  const { user } = useUser()
  const chars = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('savedCharacters') || '[]' : '[]')
  const saved = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('savedWork') || '[]' : '[]')

  const tools = [
    { id: 'characters', icon: '◉', label: 'Consistent Characters', desc: 'Your private AI character library', color: 'var(--green)' },
    { id: 'tryon', icon: '◈', label: 'Creator Try-On', desc: 'FASHN AI virtual try-on studio', color: '#00cc88' },
    { id: 'calculator', icon: '✦', label: 'Profit Calculator', desc: 'Calculate your POD and creator earnings', color: '#00ff88' },
    { id: 'saved', icon: '⊹', label: 'Saved Work', desc: 'All your saved outputs across every tool', color: '#00dd77' },
    { id: 'pricing', icon: '⊳', label: 'Pricing & Plans', desc: 'Manage your subscription', color: '#00cc66' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(0,255,136,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Creator Suite Dashboard</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Welcome, <span style={{ background: 'var(--g-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'Creator'}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Your all-access creator hub.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '36px' }}>
        {[
          { label: 'Characters Saved', value: String(chars.length), color: 'var(--green)' },
          { label: 'Saved Outputs', value: String(saved.length), color: '#00cc88' },
          { label: 'Apps Access', value: '5', color: '#00ff88' },
          { label: 'Status', value: 'Active', color: '#00dd77' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(0,255,136,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Tools</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {tools.map(t => (
          <div key={t.id} className="card" style={{ cursor: 'pointer', transition: 'all .2s', borderColor: `${t.color}22` }}
            onClick={() => setTool(t.id as SuiteTool)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${t.color}55`; (e.currentTarget as HTMLElement).style.background = `${t.color}08` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${t.color}22`; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ fontSize: '22px', color: t.color, marginBottom: '8px' }}>{t.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{t.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '10px' }}>{t.desc}</div>
            <div style={{ fontSize: '10px', color: t.color, fontFamily: "'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CONSISTENT CHARACTERS ─────────────────────────────────────
interface Character {
  id: number; name: string; age: string; appearance: string; style: string;
  personality: string; backstory: string; imagePrompt: string; videoSeed: string;
  voiceNotes: string; phrases: string; consistencyRule: string; savedAt: string;
  photo?: string; locked?: boolean; color?: string;
}

function ConsistentCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [view, setView] = useState<'library' | 'create' | 'detail'>('library')
  const [selected, setSelected] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [charColor, setCharColor] = useState('#00ff88')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [appearance, setAppearance] = useState('')
  const [style, setStyle] = useState('')
  const [personality, setPersonality] = useState('')
  const [backstory, setBackstory] = useState('')

  useEffect(() => {
    try { setCharacters(JSON.parse(localStorage.getItem('savedCharacters') || '[]')) } catch { setCharacters([]) }
  }, [])

  function save(char: Character) {
    const existing = JSON.parse(localStorage.getItem('savedCharacters') || '[]')
    const filtered = existing.filter((c: Character) => c.id !== char.id)
    filtered.unshift(char)
    const updated = filtered.slice(0, 50)
    localStorage.setItem('savedCharacters', JSON.stringify(updated))
    setCharacters(updated)
  }

  function del(id: number) {
    const char = characters.find(c => c.id === id)
    if (char?.locked) { alert('Unlock this character first to delete.'); return }
    const updated = characters.filter(c => c.id !== id)
    setCharacters(updated); localStorage.setItem('savedCharacters', JSON.stringify(updated))
  }

  function toggleLock(id: number) {
    const updated = characters.map(c => c.id === id ? { ...c, locked: !c.locked } : c)
    setCharacters(updated); localStorage.setItem('savedCharacters', JSON.stringify(updated))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, locked: !prev.locked } : null)
  }

  async function generate() {
    if (!name.trim()) { setOutput('Please enter a character name first'); return }
    setLoading(true); setOutput('')
    try {
      const result = await callAPI('generate/studios', { tool: 'character', name, age: age || '28', appearance: appearance || 'Black woman, natural hair, confident energy', style: style || 'luxury fashion', personality: personality || 'bold, ambitious', backstory: backstory || 'building an empire' })
      setOutput(result)
      const char: Character = {
        id: Date.now(), name, age, appearance, style, personality, backstory,
        imagePrompt: extract(result, 'APPEARANCE PROMPT'), videoSeed: extract(result, 'VIDEO SEED'),
        voiceNotes: extract(result, 'VOICE NOTES'), phrases: extract(result, 'SIGNATURE PHRASES'),
        consistencyRule: extract(result, 'CONSISTENCY RULE'), savedAt: new Date().toISOString(),
        photo: photo ?? undefined, color: charColor, locked: false,
      }
      save(char); reset(); setView('library')
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  function saveManual() {
    if (!name.trim()) { alert('Please enter a character name'); return }
    const char: Character = {
      id: Date.now(), name, age, appearance, style, personality, backstory,
      imagePrompt: appearance, videoSeed: `${name}, ${appearance}, ${style}, consistent character`,
      voiceNotes: personality, phrases: '', consistencyRule: `${name}: ${appearance?.split(',').slice(0, 3).join(', ')}`,
      savedAt: new Date().toISOString(), photo: photo ?? undefined, color: charColor, locked: false,
    }
    save(char); reset(); setView('library')
  }

  function reset() { setName(''); setAge(''); setAppearance(''); setStyle(''); setPersonality(''); setBackstory(''); setPhoto(null); setCharColor('#00ff88'); setOutput('') }
  function extract(text: string, section: string): string {
    const match = text.match(new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i'))
    return match?.[1]?.trim() ?? ''
  }
  function copy(text: string, field: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(field); setTimeout(() => setCopied(null), 2000) })
  }

  const colors = ['#00ff88', '#9b6dff', '#00d4ff', '#ffe600', '#ff6b6b', '#ff6fd8', '#b06cff', '#ffffff']

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Consistent <span style={{ color: 'var(--green)' }}>Characters</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px', lineHeight: '1.6' }}>
        Your private AI character library. Save once — use everywhere across all 5 apps.
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[['library', '◌ My Characters'], ['create', '✦ Create / Upload']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${view === id ? 'active' : 'inactive'}`} onClick={() => setView(id as 'library' | 'create')}>{label}</button>
        ))}
      </div>

      {/* LIBRARY */}
      {view === 'library' && (
        characters.length === 0 ? (
          <div className="card accent" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>◉</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--green)', marginBottom: '6px' }}>No characters saved yet</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '16px', lineHeight: '1.6' }}>Upload your AI twin, your team, or create new characters. Lock them to protect your identity.</div>
            <button className="g-btn" onClick={() => setView('create')} style={{ fontSize: '12px', padding: '9px 18px' }}>Add your first character ↗</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {characters.map(char => (
              <div key={char.id} className={`char-card${char.locked ? ' locked' : ''}`}
                style={{ borderColor: char.locked ? (char.color ?? 'var(--green)') : undefined, boxShadow: char.locked ? `0 0 15px ${char.color ?? 'var(--green)'}22` : undefined }}
                onClick={() => { setSelected(char); setView('detail') }}>
                <div style={{ height: '140px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {char.photo ? <img src={char.photo} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '32px', marginBottom: '4px', opacity: 0.2 }}>◉</div><div style={{ fontSize: '10px', color: 'var(--mu3)' }}>No photo</div></div>
                  )}
                  {char.locked && <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', color: char.color ?? 'var(--green)', fontFamily: "'DM Mono',monospace" }}>🔒</div>}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800, color: char.color ?? 'var(--green)', marginBottom: '2px' }}>{char.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu3)', marginBottom: '8px' }}>{char.age}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={e => { e.stopPropagation(); toggleLock(char.id) }}
                      style={{ flex: 1, padding: '5px', borderRadius: '6px', border: `0.5px solid ${char.locked ? (char.color ?? 'var(--green)') : 'rgba(0,200,100,0.2)'}`, background: char.locked ? `${char.color ?? 'var(--green)'}22` : 'var(--s2)', color: char.locked ? (char.color ?? 'var(--green)') : 'var(--mu3)', fontSize: '10px', cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>
                      {char.locked ? '🔒' : '🔓'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); del(char.id) }} className="del-btn" style={{ padding: '5px 8px' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* DETAIL */}
      {view === 'detail' && selected && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => setView('library')} className="ghost-btn">← Library</button>
            <button onClick={() => toggleLock(selected.id)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `0.5px solid ${selected.locked ? (selected.color ?? 'var(--green)') : 'rgba(0,200,100,0.2)'}`, background: selected.locked ? `${selected.color ?? 'var(--green)'}22` : 'var(--s2)', color: selected.locked ? (selected.color ?? 'var(--green)') : 'var(--mu3)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              {selected.locked ? '🔒 Unlock' : '🔓 Lock character'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ width: '200px', height: '240px', background: 'var(--bg3)', borderRadius: 'var(--r2)', overflow: 'hidden', border: `0.5px solid ${selected.color ?? 'var(--green)'}44`, boxShadow: `0 0 20px ${selected.color ?? 'var(--green)'}15` }}>
                {selected.photo ? <img src={selected.photo} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '40px', opacity: 0.1 }}>◉</span></div>
                )}
              </div>
              {selected.locked && <div style={{ marginTop: '8px', padding: '8px', background: `${selected.color ?? 'var(--green)'}22`, border: `0.5px solid ${selected.color ?? 'var(--green)'}44`, borderRadius: '8px', fontSize: '11px', color: selected.color ?? 'var(--green)', textAlign: 'center', fontFamily: "'DM Mono',monospace" }}>🔒 Locked</div>}
            </div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '26px', fontWeight: 800, color: selected.color ?? 'var(--green)', marginBottom: '4px' }}>{selected.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>{selected.age}</div>
              <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', marginBottom: '12px' }}>{selected.appearance}</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>{selected.personality}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Image Prompt', value: selected.imagePrompt, color: 'var(--green)', use: 'Midjourney · Gemini · Image Generator' },
              { label: 'Video Seed', value: selected.videoSeed, color: '#00cc88', use: 'Kling AI · Higgsfield · Veo 3.1' },
              { label: 'Voice Notes', value: selected.voiceNotes, color: '#00ff88', use: 'ElevenLabs · HeyGen' },
              { label: 'Signature Phrases', value: selected.phrases, color: '#00dd77', use: 'Scripts · Lip Sync · Dialogue' },
              { label: 'Consistency Rule', value: selected.consistencyRule, color: '#00cc66', use: 'Add to every prompt for same face' },
              { label: 'Backstory', value: selected.backstory, color: 'var(--mu3)', use: 'Context for all tools' },
            ].filter(s => s.value).map(s => (
              <div key={s.label} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: s.color, fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px' }}>{s.label}</div>
                  <button onClick={() => copy(s.value, s.label)} className="ghost-btn" style={{ fontSize: '10px', padding: '3px 10px' }}>{copied === s.label ? '✓ Copied!' : 'Copy'}</button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', marginBottom: '4px' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace" }}>→ {s.use}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE */}
      {view === 'create' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div className="card hi" style={{ marginBottom: '14px' }}>
              <div className="ftitle">Upload character photo</div>
              <DragDrop label="Drag your AI character photo" sub="From Flow, Midjourney, Leonardo, or any AI tool" currentImage={photo} onImage={setPhoto} onClear={() => setPhoto(null)} height={140} />
              <F label="Color accent">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginTop: '4px' }}>
                  {colors.map(c => <div key={c} onClick={() => setCharColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: charColor === c ? '2px solid #fff' : '2px solid transparent', boxShadow: charColor === c ? `0 0 8px ${c}` : 'none', transition: 'all .2s' }} />)}
                </div>
              </F>
            </div>
            <div className="card hi">
              <div className="ftitle">Character details</div>
              <F label="Name"><input className="finp" placeholder="e.g. Luxe Envi, Nova Star, My AI Twin" value={name} onChange={e => setName(e.target.value)} /></F>
              <F label="Age and vibe"><input className="finp" placeholder="e.g. 28, luxury lifestyle creator" value={age} onChange={e => setAge(e.target.value)} /></F>
              <F label="Appearance"><input className="finp" placeholder="e.g. Black woman, deep brown skin, natural locs" value={appearance} onChange={e => setAppearance(e.target.value)} /></F>
              <F label="Style"><input className="finp" placeholder="e.g. luxury streetwear, designer pieces" value={style} onChange={e => setStyle(e.target.value)} /></F>
              <F label="Personality"><input className="finp" placeholder="e.g. bold, ambitious, charismatic" value={personality} onChange={e => setPersonality(e.target.value)} /></F>
              <F label="Backstory"><input className="finp" placeholder="e.g. Built a POD empire from nothing" value={backstory} onChange={e => setBackstory(e.target.value)} /></F>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <button className="g-btn" onClick={generate} disabled={loading} style={{ fontSize: '12px', padding: '10px' }}>{loading ? 'Generating…' : '✦ AI Build + Save'}</button>
                <button onClick={saveManual} style={{ padding: '10px', borderRadius: '7px', border: '0.5px solid var(--gb)', background: 'var(--s2)', color: 'var(--green)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Save manually</button>
              </div>
              {(output || loading) && (
                <div className="ai-out" style={{ marginTop: '10px' }}>
                  {loading && <div className="lbar" style={{ marginBottom: '8px' }}><div className="lbar-fill" /></div>}
                  {output && <div className="ai-out-text">{output}</div>}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="card" style={{ marginBottom: '14px' }}>
              <div className="ftitle">Quick-starts</div>
              {[
                { name: 'Luxe Envi', age: '28, luxury lifestyle AI creator', appearance: 'Black woman, deep brown skin, natural locs, 5ft7, slender athletic', style: 'luxury streetwear, designer pieces, gold jewelry', personality: 'bold, ambitious, charismatic, commanding, magnetic' },
                { name: 'Nova Star', age: '23, AI pop artist', appearance: 'Black woman, deep melanin skin, long black hair, 5ft5, model physique', style: 'futuristic designer fashion, avant-garde couture', personality: 'glamorous, confident, magnetic, mysterious' },
                { name: 'Marcus Reed', age: '32, drama lead', appearance: 'Black man, deep dark skin, short fade, 6ft2, athletic muscular build', style: 'designer suits, luxury casual, power dressing', personality: 'commanding, intelligent, intense, protective' },
              ].map(q => (
                <button key={q.name} onClick={() => { setName(q.name); setAge(q.age); setAppearance(q.appearance); setStyle(q.style); setPersonality(q.personality) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,200,100,0.1)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>
                  {q.name} ↗
                </button>
              ))}
            </div>
            <div className="card">
              <div className="ftitle">Free character creation tools</div>
              {[
                ['Leonardo AI', 'leonardo.ai', 'Free · 150 credits/day · Best for consistent faces'],
                ['Adobe Firefly', 'firefly.adobe.com', 'Free tier · Photorealistic faces'],
                ['Google Gemini', 'gemini.google.com', 'Free image generation · Good portraits'],
                ['Canva AI', 'canva.com', 'Free tier · Easy for beginners'],
                ['Microsoft Designer', 'designer.microsoft.com', 'Free with Microsoft account'],
              ].map(([n, url, d]) => (
                <a key={n} href={`https://${url}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(0,200,100,0.08)', borderRadius: '7px', marginBottom: '6px', textDecoration: 'none', transition: 'border .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gb)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,200,100,0.08)')}>
                  <div><div style={{ fontSize: '12px', color: 'var(--w)', fontWeight: 500 }}>{n}</div><div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '1px' }}>{d}</div></div>
                  <span style={{ color: 'var(--green)', fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>Free ↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CREATOR TRY-ON ────────────────────────────────────────────
function CreatorTryOn() {
  const [modelImage, setModelImage] = useState<string | null>(null)
  const [garmentImage, setGarmentImage] = useState<string | null>(null)
  const [category, setCategory] = useState('tops')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imageUrl?: string; message?: string } | null>(null)

  async function generate() {
    if (!modelImage) { alert('Please upload a model or person photo'); return }
    if (!garmentImage) { alert('Please upload a clothing image'); return }
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage: modelImage, garmentImage, category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e) { setResult({ message: `Error: ${(e as Error).message}` }) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Creator <span style={{ color: 'var(--green)' }}>Try-On Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px' }}>Upload a model and clothing — FASHN AI places the garment on the model realistically.</div>
      <div style={{ background: 'var(--green3)', border: '0.5px solid var(--gb)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: 'var(--green)', fontFamily: "'DM Mono',monospace" }}>
        ✦ Powered by FASHN AI · Requires FASHN_API_KEY · TRYON_PROVIDER=fashn in Vercel
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Model / person photo</div>
            <DragDrop label="Drag model or AI twin photo" sub="Front-facing, arms away from body works best" currentImage={modelImage} onImage={setModelImage} onClear={() => setModelImage(null)} height={150} />
          </div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Clothing / garment image</div>
            <DragDrop label="Drag clothing image" sub="Flat lay or on hanger, clear and well-lit" currentImage={garmentImage} onImage={setGarmentImage} onClear={() => setGarmentImage(null)} height={150} />
          </div>
          <div className="card hi">
            <div className="ftitle">Garment category</div>
            <F label="Type of clothing">
              <select className="fsel" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="tops">Tops — t-shirts, blouses, crop tops</option>
                <option value="bottoms">Bottoms — pants, skirts, shorts</option>
                <option value="one-pieces">One pieces — dresses, jumpsuits</option>
              </select>
            </F>
            <button className="g-btn" onClick={generate} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'FASHN AI generating — 15–30 seconds…' : '✦ Generate Try-On'}
            </button>
          </div>
        </div>

        <div className="card accent">
          <div className="ftitle">Try-On Result</div>
          <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid rgba(0,200,100,0.1)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="lbar" style={{ width: '100px', margin: '0 auto 10px' }}><div className="lbar-fill" /></div>
                <div style={{ fontSize: '13px', color: 'var(--green)' }}>FASHN AI generating…</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '6px' }}>Usually 15–30 seconds</div>
              </div>
            ) : result?.imageUrl ? (
              <img src={result.imageUrl} alt="try-on" style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
            ) : result?.message ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '11px', color: '#ff6b9d', lineHeight: '1.6' }}>{result.message}</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.1 }}>◈</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Try-on appears here</div>
              </div>
            )}
          </div>
          {result?.imageUrl && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={result.imageUrl} download target="_blank" rel="noreferrer" className="g-btn" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '12px', padding: '9px' }}>⬇ Download</a>
              <button onClick={() => setResult(null)} className="del-btn" style={{ padding: '9px 12px' }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PROFIT CALCULATOR ─────────────────────────────────────────
function ProfitCalculator() {
  const [sellPrice, setSellPrice] = useState(35)
  const [printCost, setPrintCost] = useState(12)
  const [monthlySales, setMonthlySales] = useState(50)
  const [platformFee, setPlatformFee] = useState(6.5)
  const [shippingCredit, setShippingCredit] = useState(0)

  const revenuePerSale = sellPrice - printCost - (sellPrice * platformFee / 100) + shippingCredit
  const monthlyRevenue = revenuePerSale * monthlySales
  const yearlyRevenue = monthlyRevenue * 12

  const Slider = ({ label, value, min, max, step = 1, prefix = '', suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; prefix?: string; suffix?: string; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px' }}>{label}</label>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne',sans-serif" }}>{prefix}{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer', height: '4px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>{prefix}{min}{suffix}</span>
        <span style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>{prefix}{max}{suffix}</span>
      </div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Profit <span style={{ color: 'var(--green)' }}>Calculator</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Calculate your POD earnings — slide the values to see your potential income.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card hi">
          <div className="ftitle">Your numbers</div>
          <Slider label="Sell price" value={sellPrice} min={15} max={150} prefix="$" onChange={setSellPrice} />
          <Slider label="Print cost" value={printCost} min={5} max={60} prefix="$" onChange={setPrintCost} />
          <Slider label="Monthly sales" value={monthlySales} min={1} max={1000} onChange={setMonthlySales} suffix=" units" />
          <Slider label="Platform fee" value={platformFee} min={0} max={20} step={0.5} onChange={setPlatformFee} suffix="%" />
        </div>

        <div>
          <div className="card accent" style={{ marginBottom: '14px', textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Profit per sale</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '48px', fontWeight: 800, color: revenuePerSale > 0 ? 'var(--green)' : '#ff6b9d', marginBottom: '4px' }}>
              ${revenuePerSale.toFixed(2)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '6px' }}>Monthly</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>${monthlyRevenue.toFixed(0)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '6px' }}>Yearly</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>${yearlyRevenue.toFixed(0)}</div>
            </div>
          </div>
          <div className="card">
            <div className="ftitle">Breakdown</div>
            {[
              { label: 'Sell price', value: `$${sellPrice}`, color: 'var(--green)' },
              { label: 'Print cost', value: `-$${printCost}`, color: '#ff6b9d' },
              { label: `Platform fee (${platformFee}%)`, value: `-$${(sellPrice * platformFee / 100).toFixed(2)}`, color: '#ff6b9d' },
              { label: 'Profit per sale', value: `$${revenuePerSale.toFixed(2)}`, color: 'var(--green)', bold: true },
              { label: `× ${monthlySales} sales/month`, value: `= $${monthlyRevenue.toFixed(0)}/mo`, color: 'var(--green)', bold: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid rgba(0,200,100,0.08)' }}>
                <span style={{ fontSize: '12px', color: 'var(--mu3)' }}>{row.label}</span>
                <span style={{ fontSize: row.bold ? '14px' : '13px', fontWeight: row.bold ? 700 : 400, color: row.color, fontFamily: "'Syne',sans-serif" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SAVED WORK ────────────────────────────────────────────────
function SavedWork() {
  const { user } = useUser()
  const [items, setItems] = useState<Array<{ id: string | number; tool: string; content: string; prompt?: string; imageUrl?: string; savedAt: string }>>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | number | null>(null)

  async function load() {
    setLoading(true)
    try {
      if (user?.id) {
        const res = await fetch(`/api/save?userId=${user.id}`)
        const data = await res.json()
        if (data.items?.length > 0) { setSaved(data.items); setLoading(false); return }
      }
      setSaved(JSON.parse(localStorage.getItem('savedWork') || '[]'))
    } catch { setSaved(JSON.parse(localStorage.getItem('savedWork') || '[]')) }
    setLoading(false)
  }

  function setSaved(data: typeof items) { setItems(data) }

  async function del(id: string | number) {
    try {
      if (user?.id) await fetch('/api/save', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, itemId: String(id) }) })
      const updated = items.filter(i => i.id !== id)
      setItems(updated); localStorage.setItem('savedWork', JSON.stringify(updated))
    } catch { const updated = items.filter(i => i.id !== id); setItems(updated) }
  }

  function copy(text: string, id: string | number) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000) })
  }

  useEffect(() => { load() }, [user?.id])

  const tools = ['all', ...Array.from(new Set(items.map(i => i.tool)))]
  const filtered = filter === 'all' ? items : items.filter(i => i.tool === filter)

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Saved <span style={{ color: 'var(--green)' }}>Work</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px' }}>All your saved outputs from every app — synced across devices.</div>
      <div style={{ background: 'var(--green3)', border: '0.5px solid var(--gb)', borderRadius: '8px', padding: '8px 14px', marginBottom: '16px', fontSize: '11px', color: 'var(--green)', fontFamily: "'DM Mono',monospace" }}>
        ✦ Cloud saved — access from any device
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        <button onClick={load} className="ghost-btn" style={{ fontSize: '11px' }}>{loading ? 'Loading…' : '↺ Refresh'}</button>
        {tools.map(t => <button key={t} className={`tab-btn ${filter === t ? 'active' : 'inactive'}`} onClick={() => setFilter(t)} style={{ textTransform: 'capitalize' as const }}>{t}</button>)}
        {items.length > 0 && <button onClick={() => { if (confirm('Clear all saved work?')) { setItems([]); localStorage.removeItem('savedWork') } }} className="del-btn" style={{ marginLeft: 'auto' }}>Clear all</button>}
      </div>
      {filtered.length === 0 ? (
        <div className="card accent" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>◌</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No saved work yet</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Use any tool and click Save</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {filtered.map(item => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--green3)', color: 'var(--green)', borderRadius: '4px', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const }}>{item.tool}</span>
                  <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                </div>
                <button onClick={() => del(item.id)} className="del-btn">Delete</button>
              </div>
              {item.imageUrl && <img src={item.imageUrl} alt="saved" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
              {item.prompt && <div style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '8px', padding: '8px', background: 'var(--bg3)', borderRadius: '6px' }}>Prompt: {String(item.prompt).slice(0, 120)}…</div>}
              {item.content && <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', maxHeight: '120px', overflow: 'hidden' }}>{item.content}</div>}
              {item.content && (
                <button onClick={() => copy(item.content, item.id)} className="ghost-btn" style={{ marginTop: '10px', fontSize: '11px' }}>{copied === item.id ? '✓ Copied!' : 'Copy ↗'}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PRICING PAGE ──────────────────────────────────────────────
function PricingPage() {
  const plans = [
    { name: 'Starter', price: 19, id: 'starter', features: ['All 5 apps access', 'POD Studios', 'AI Studios', 'Music Studios', '50 AI generations/month'] },
    { name: 'Creator', price: 39, id: 'creator', features: ['Everything in Starter', 'Academy Studios', '200 AI generations/month', 'Priority support', 'Save up to 500 outputs'], popular: true },
    { name: 'Pro', price: 69, id: 'pro', features: ['Everything in Creator', 'Unlimited generations', 'FASHN Try-On credits', 'OmniHuman Studio access', 'Advanced video generation'] },
    { name: 'Agency', price: 149, id: 'agency', features: ['Everything in Pro', 'Up to 5 team members', 'Custom branding tools', 'White label options', 'Priority 1-on-1 support'] },
  ]

  async function checkout(plan: string) {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Checkout failed')
    } catch { alert('Checkout failed. Try again.') }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Plans & <span style={{ color: 'var(--green)' }}>Pricing</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '32px' }}>All plans include a 7-day free trial. Cancel anytime.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {plans.map(plan => (
          <div key={plan.id} className="card" style={{ border: `0.5px solid ${plan.popular ? 'var(--gb)' : 'rgba(0,200,100,0.12)'}`, background: plan.popular ? 'var(--green3)' : 'var(--s1)', position: 'relative' }}>
            {plan.popular && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--g-grad)', color: '#000', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>Most Popular</div>}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--green)', marginBottom: '4px' }}>{plan.name}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', marginBottom: '16px' }}>${plan.price}<span style={{ fontSize: '14px', color: 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>/mo</span></div>
            <div style={{ marginBottom: '20px' }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--green)', fontSize: '12px' }}>✓</span>
                  <span style={{ fontSize: '12px', color: 'var(--w2)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button className="g-btn" onClick={() => checkout(plan.id)} style={{ width: '100%', fontSize: '12px' }}>
              Start Free Trial ↗
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ADMIN ─────────────────────────────────────────────────────
function AdminPanel() {
  const { user } = useUser()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === adminId

  const [email, setEmail] = useState('')
  const [students, setStudents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/students').then(r => r.json()).then(d => setStudents(d.students || []))
  }, [])

  async function add() {
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', email: email.trim() }) })
      const data = await res.json()
      if (data.students) { setStudents(data.students); setEmail('') }
    } catch { }
    setLoading(false)
  }

  async function remove(e: string) {
    const res = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', email: e }) })
    const data = await res.json()
    if (data.students) setStudents(data.students)
  }

  if (!isAdmin) return (
    <div className="pg-in">
      <div className="card accent" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--green)', marginBottom: '8px' }}>Admin Access Only</div>
        <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>This section is restricted to Envi Lee.</div>
      </div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Admin <span style={{ color: 'var(--green)' }}>Dashboard</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Manage academy student access.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Add Academy Student</div>
          <F label="Student email">
            <input className="finp" placeholder="student@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          </F>
          <button className="g-btn" onClick={add} disabled={loading} style={{ width: '100%' }}>{loading ? 'Adding…' : '+ Add Student ↗'}</button>
        </div>
        <div className="card">
          <div className="ftitle">Academy Students — {students.length}</div>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mu3)', fontSize: '12px' }}>No students added yet</div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {students.map(s => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid rgba(0,200,100,0.08)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--w2)' }}>{s}</span>
                  <button onClick={() => remove(s)} className="del-btn" style={{ fontSize: '10px' }}>Remove</button>
                </div>
              ))}
            </div>
          )}
          {students.length > 0 && (
            <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(students)); alert('Copied! Paste into Vercel as ACADEMY_STUDENTS') }}
              className="ghost-btn" style={{ width: '100%', marginTop: '10px', fontSize: '11px' }}>
              Copy for Vercel ↗
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SUITE BOT ─────────────────────────────────────────────────
function SuiteBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "I'm your Creator Suite assistant! Ask me about consistent characters, the try-on studio, profit calculations, or anything else in the suite." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are the Creator Suite assistant for Envi Lee Creator Studios. Help with: consistent AI characters, virtual try-on with FASHN AI, profit calculations for POD business, saving and organizing work, and navigating all 5 apps. Be helpful and specific. Question: ${msg}` })
      setMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '340px', background: 'var(--bg2)', border: '0.5px solid var(--gb)', borderRadius: '16px', boxShadow: '0 0 40px rgba(0,255,136,0.08)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'var(--green3)', borderBottom: '0.5px solid var(--gb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--green)', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span className="g-dot" />Suite Assistant
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '88%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'var(--green3)' : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? 'var(--gb)' : 'rgba(0,200,100,0.1)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: 'var(--green)', alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '0.5px solid rgba(0,200,100,0.1)', display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid rgba(0,200,100,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'var(--g-grad)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── SIDEBAR ───────────────────────────────────────────────────
const NAV: { tool: SuiteTool; label: string; icon: string }[] = [
  { tool: 'dashboard', label: 'Dashboard', icon: '◉' },
  { tool: 'characters', label: 'Consistent Characters', icon: '◈' },
  { tool: 'tryon', label: 'Creator Try-On', icon: '⊹' },
  { tool: 'calculator', label: 'Profit Calculator', icon: '✦' },
  { tool: 'saved', label: 'Saved Work', icon: '◌' },
  { tool: 'pricing', label: 'Pricing & Plans', icon: '⊳' },
  { tool: 'admin', label: 'Admin', icon: '⊗' },
]

// ── MAIN ──────────────────────────────────────────────────────
export default function CreatorSuitePage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<SuiteTool>('dashboard')
  const [hovered, setHovered] = useState<SuiteTool | null>(null)
  const [botOpen, setBotOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
          <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(0,200,100,0.1)', padding: 0, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(0,200,100,0.1)' }}>
              <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--g-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>◉</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800, color: 'var(--w)' }}>Creator Suite™</div>
                  <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px' }}>Envi Lee</div>
                </div>
              </div>
            </div>

            {user && (
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(0,200,100,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--green3)', borderRadius: '8px', border: '0.5px solid var(--gb)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Creator'}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(0,255,136,0.5)', fontFamily: "'DM Mono',monospace" }}>All Access</div>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'var(--gb)' : 'transparent'}`, background: active === tool ? 'var(--green3)' : hovered === tool ? 'rgba(0,255,136,0.03)' : 'none', color: active === tool ? 'var(--green)' : hovered === tool ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'radial-gradient(ellipse at 80% 0%, rgba(0,100,50,0.04) 0%, transparent 50%)' }}>
            {active === 'dashboard' && <Dashboard setTool={setActive} />}
            {active === 'characters' && <ConsistentCharacters />}
            {active === 'tryon' && <CreatorTryOn />}
            {active === 'calculator' && <ProfitCalculator />}
            {active === 'saved' && <SavedWork />}
            {active === 'pricing' && <PricingPage />}
            {active === 'admin' && <AdminPanel />}
          </main>

          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--g-grad)', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,255,136,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botOpen ? '✕' : '◉'}
          </button>
          {botOpen && <SuiteBot onClose={() => setBotOpen(false)} />}
        </div>
      </SignedIn>
    </>
  )
}
