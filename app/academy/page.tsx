'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type AcademySide = 'choose' | 'baddie' | 'kings'
type AcademyTool = 'dashboard' | 'builder' | 'auren' | 'cinematic' | 'store' | 'portfolio' | 'protection' | 'saved'

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
    --bg2: #050308;
    --bg3: #0a0610;
    --s1: #0e0a18;
    --s2: #160f22;
    --w: #f8f0ff;
    --w2: #e0c8ff;
    --mu: #2a1a3a;
    --mu2: #3a2a50;
    --mu3: #7a5a9a;
    --r: 8px; --r2: 12px; --r3: 16px;

    /* Baddie */
    --baddie: #b06cff;
    --baddie2: #7c3aed;
    --baddie3: rgba(176,108,255,0.08);
    --bb: rgba(176,108,255,0.25);
    --bg-grad: linear-gradient(135deg, #7c3aed, #b06cff);

    /* Kings */
    --kings: #e8c76a;
    --kings2: #c4973a;
    --kings3: rgba(232,199,106,0.08);
    --kb: rgba(232,199,106,0.25);
    --kg-grad: linear-gradient(135deg, #c4973a, #e8c76a);

    /* Ombre lilac buttons */
    --lilac: linear-gradient(135deg, #c084fc, #a855f7, #7c3aed);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1a0a2a; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(176,108,255,0.2); } 50% { box-shadow: 0 0 40px rgba(176,108,255,0.4); } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill-b { height: 100%; background: var(--bg-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .lbar-fill-k { height: 100%; background: var(--kg-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .b-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--baddie); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }
  .k-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--kings); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border-radius: var(--r3); padding: 20px; }
  .card.b { border: 0.5px solid rgba(176,108,255,0.15); }
  .card.k { border: 0.5px solid rgba(232,199,106,0.15); }
  .card.b.hi { border-color: rgba(176,108,255,0.3); }
  .card.k.hi { border-color: rgba(232,199,106,0.3); }
  .card.b.accent { border-color: var(--bb); background: var(--baddie3); }
  .card.k.accent { border-color: var(--kb); background: var(--kings3); }

  .ftitle-b { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--baddie); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(176,108,255,0.15); }
  .ftitle-k { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--kings); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(232,199,106,0.15); }

  .finp { background: var(--bg3); border: 0.5px solid rgba(176,108,255,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: var(--bb); }
  .finp-k { background: var(--bg3); border: 0.5px solid rgba(232,199,106,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(176,108,255,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fsel-k { background: var(--bg3); border: 0.5px solid rgba(232,199,106,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(176,108,255,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .lilac-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--lilac); color: #fff; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(176,108,255,0.25); }
  .lilac-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(176,108,255,0.4); }
  .lilac-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .gold-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--kg-grad); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(232,199,106,0.25); }
  .gold-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(232,199,106,0.4); }
  .gold-btn:disabled { opacity: 0.5; cursor: default; transform: none; }
  .ghost-b { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--bb); background: transparent; color: var(--baddie); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-b:hover { background: var(--baddie3); }
  .ghost-k { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--kb); background: transparent; color: var(--kings); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-k:hover { background: var(--kings3); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .ai-out { background: var(--bg3); border: 0.5px solid rgba(176,108,255,0.15); border-radius: var(--r2); padding: 14px; margin-top: 12px; }
  .ai-out-k { background: var(--bg3); border: 0.5px solid rgba(232,199,106,0.15); border-radius: var(--r2); padding: 14px; margin-top: 12px; }
  .ai-out-text { font-size: 12px; color: var(--w2); line-height: 1.85; white-space: pre-wrap; }

  .tab-b { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; }
  .tab-b.active { background: var(--baddie3); border: 0.5px solid var(--bb); color: var(--baddie); }
  .tab-b.inactive { background: transparent; border: 0.5px solid rgba(176,108,255,0.08); color: var(--mu3); }
  .tab-k { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; }
  .tab-k.active { background: var(--kings3); border: 0.5px solid var(--kb); color: var(--kings); }
  .tab-k.inactive { background: transparent; border: 0.5px solid rgba(232,199,106,0.08); color: var(--mu3); }

  .drag-zone { border: 1.5px dashed rgba(176,108,255,0.2); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all .2s; background: rgba(176,108,255,0.03); position: relative; }
  .drag-zone:hover, .drag-zone.drag { border-color: var(--baddie); background: var(--baddie3); }
  .drag-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .drag-zone-k { border: 1.5px dashed rgba(232,199,106,0.2); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all .2s; background: rgba(232,199,106,0.03); position: relative; }
  .drag-zone-k:hover { border-color: var(--kings); background: var(--kings3); }
  .drag-zone-k input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .live-preview { background: var(--bg3); border: 1.5px solid rgba(176,108,255,0.2); border-radius: var(--r3); overflow: hidden; position: sticky; top: 20px; }
  .live-preview-k { background: var(--bg3); border: 1.5px solid rgba(232,199,106,0.2); border-radius: var(--r3); overflow: hidden; position: sticky; top: 20px; }
  .preview-header { padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; }

  .scene-card { background: var(--s1); border: 0.5px solid rgba(176,108,255,0.15); border-radius: var(--r2); overflow: hidden; }
  .scene-card-k { background: var(--s1); border: 0.5px solid rgba(232,199,106,0.15); border-radius: var(--r2); overflow: hidden; }
`

// ── HELPERS ───────────────────────────────────────────────────
function F({ label, children, side = 'baddie' }: { label: string; children: React.ReactNode; side?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label style={{ fontSize: '9px', fontWeight: 600, color: side === 'kings' ? 'var(--mu3)' : 'var(--mu3)', textTransform: 'uppercase' as const, letterSpacing: '.7px', fontFamily: "'DM Mono', monospace" }}>{label}</label>
      {children}
    </div>
  )
}

function DragDrop({ onImage, currentImage, onClear, label = 'Drag photo here', sub = 'Any image', height = 130, side = 'baddie' }: {
  onImage: (url: string) => void; currentImage?: string | null; onClear?: () => void; label?: string; sub?: string; height?: number; side?: string
}) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  const cls = side === 'kings' ? 'drag-zone-k' : `drag-zone${dragging ? ' drag' : ''}`
  return (
    <div className={cls} style={{ minHeight: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: currentImage ? '0' : '20px' }}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !currentImage && ref.current?.click()}>
      <input ref={ref} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {currentImage ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <img src={currentImage} alt="uploaded" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
            <button onClick={e => { e.stopPropagation(); ref.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: 'rgba(0,0,0,0.8)', color: side === 'kings' ? 'var(--kings)' : 'var(--baddie)', fontSize: '10px', cursor: 'pointer' }}>Replace</button>
            {onClear && <button onClick={e => { e.stopPropagation(); onClear() }} className="del-btn" style={{ padding: '4px 10px' }}>Clear</button>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '6px', opacity: 0.4 }}>📸</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '3px' }}>{label}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu2)' }}>{sub}</div>
        </div>
      )}
    </div>
  )
}

// ── SCHOOL CHOOSER ────────────────────────────────────────────
function SchoolChooser({ setSide }: { setSide: (s: AcademySide) => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(196,151,58,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />

      {/* Empire logo */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(176,108,255,0.5)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
          Envi Lee · Academy Studios
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 300, color: 'var(--w)', letterSpacing: '2px' }}>
          Choose Your Academy
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '700px', width: '100%' }}>

        {/* Baddie Academy */}
        <div onClick={() => setSide('baddie')}
          style={{ background: 'rgba(124,58,237,0.06)', border: '0.5px solid rgba(176,108,255,0.3)', borderRadius: '20px', padding: '36px 28px', cursor: 'pointer', textAlign: 'center', transition: 'all .3s', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(176,108,255,0.6)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(176,108,255,0.15)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(176,108,255,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--baddie), transparent)' }} />

          {/* Baddie Academy Logo */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: '13px', fontStyle: 'italic', color: '#fff', marginBottom: '2px', letterSpacing: '1px' }}>Envi Lee</div>
            <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '28px', fontWeight: 900, color: 'var(--baddie)', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1 }}>BADDIE</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: '13px', fontStyle: 'italic', color: '#fff', letterSpacing: '1px', marginTop: '2px' }}>Academy</div>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(220,180,255,0.7)', lineHeight: '1.7', marginBottom: '20px' }}>
            Build your AI twin, AI influencer, and luxury digital brand. For women creators.
          </div>
          <div style={{ padding: '10px 20px', background: 'var(--lilac)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', display: 'inline-block' }}>
            Enter Baddie Academy →
          </div>
        </div>

        {/* Kings Academy */}
        <div onClick={() => setSide('kings')}
          style={{ background: 'rgba(196,151,58,0.06)', border: '0.5px solid rgba(232,199,106,0.3)', borderRadius: '20px', padding: '36px 28px', cursor: 'pointer', textAlign: 'center', transition: 'all .3s', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,199,106,0.6)'; (e.currentTarget as HTMLElement).style.background = 'rgba(196,151,58,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(232,199,106,0.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,199,106,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(196,151,58,0.06)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--kings), transparent)' }} />

          {/* Kings Academy Logo */}
          <div style={{ marginBottom: '20px' }}>
            {/* Crown SVG */}
            <svg width="44" height="32" viewBox="0 0 100 70" style={{ marginBottom: '6px' }}>
              <polyline points="10,60 25,20 50,50 75,20 90,60" fill="none" stroke="#e8c76a" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx="10" cy="60" r="5" fill="#e8c76a" />
              <circle cx="50" cy="20" r="5" fill="#e8c76a" />
              <circle cx="90" cy="60" r="5" fill="#e8c76a" />
            </svg>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--kings)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '3px' }}>ENVI LEE</div>
            <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '2px', lineHeight: 1 }}>KING'S</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--kings)', letterSpacing: '6px', textTransform: 'uppercase', marginTop: '3px' }}>ACADEMY</div>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(240,220,160,0.7)', lineHeight: '1.7', marginBottom: '20px' }}>
            Build your AI twin, AI influencer, and luxury digital empire. For men creators.
          </div>
          <div style={{ padding: '10px 20px', background: 'var(--kg-grad)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#000', display: 'inline-block' }}>
            Enter King's Academy →
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', fontSize: '11px', color: 'rgba(176,108,255,0.4)', fontFamily: "'DM Mono',monospace", letterSpacing: '1px', textAlign: 'center' }}>
        Both academies follow the AUREN framework · Build · Grow · Scale
      </div>
    </div>
  )
}

// ── AI TWIN BUILDER ───────────────────────────────────────────
function AITwinBuilder({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const btn = isBaddie ? 'lilac-btn' : 'gold-btn'
  const inp = isBaddie ? 'finp' : 'finp-k'
  const sel = isBaddie ? 'fsel' : 'fsel-k'
  const lbarFill = isBaddie ? 'lbar-fill-b' : 'lbar-fill-k'

  // Basic identity
  const [twinName, setTwinName] = useState('')
  const [twinAge, setTwinAge] = useState('28')
  const [twinPersonality, setTwinPersonality] = useState('')
  const [twinBackstory, setTwinBackstory] = useState('')
  const [twinGoals, setTwinGoals] = useState('')

  // Appearance tabs
  const [appearanceTab, setAppearanceTab] = useState('skin')
  const [facePhoto, setFacePhoto] = useState<string | null>(null)
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)

  // Appearance selections
  const [eyeColor, setEyeColor] = useState('Dark brown')
  const [eyeShape, setEyeShape] = useState('Almond')
  const [hairColor, setHairColor] = useState('Black')
  const [hairTexture, setHairTexture] = useState('Natural coils')
  const [hairstyle, setHairstyle] = useState('Natural locs')
  const [skinTone, setSkinTone] = useState('Deep brown')
  const [skinUndertone, setSkinUndertone] = useState('Warm golden')
  const [lipSize, setLipSize] = useState('Full')
  const [lipShape, setLipShape] = useState('Cupid bow')
  const [noseShape, setNoseShape] = useState('Broad and regal')
  const [bodyType, setBodyType] = useState(isBaddie ? 'Curvy hourglass' : 'Athletic muscular')
  const [nosePiercing, setNosePiercing] = useState('None')
  const [bodyPiercing, setBodyPiercing] = useState('None')
  const [tattoos, setTattoos] = useState('None')

  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const appearanceTabs = [
    ['skin', '✦ Skin'],
    ['eyes', '◈ Eyes'],
    ['hair', '◷ Hair'],
    ['face', '⊹ Face'],
    ['body', '◉ Body'],
    ['extras', '⊳ Extras'],
  ]

  async function buildTwin() {
    setLoading(true); setOutput('')
    try {
      setOutput(await callAPI('generate/academy', {
        tool: 'build',
        side,
        name: twinName || (isBaddie ? 'Luxe' : 'King'),
        age: twinAge,
        personality: twinPersonality,
        backstory: twinBackstory,
        goals: twinGoals,
        skinTone, eyeColor, eyeShape, hairColor, hairTexture, hairstyle,
        lipSize, lipShape, noseShape, bodyType, nosePiercing, bodyPiercing, tattoos,
        skinUndertone,
      }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  async function generatePreview() {
    setImgLoading(true)
    try {
      const prompt = `${isBaddie ? 'Black woman' : 'Black man'}, ${skinTone} skin with ${skinUndertone} undertones, ${eyeShape} ${eyeColor} eyes, ${hairstyle} ${hairColor} hair, ${lipSize} ${lipShape} lips, ${noseShape} nose, ${bodyType} build${nosePiercing !== 'None' ? ', ' + nosePiercing + ' nose piercing' : ''}${tattoos !== 'None' ? ', ' + tattoos + ' tattoos' : ''}, ${twinPersonality || 'confident and powerful'} energy, luxury lifestyle creator, photorealistic portrait, professional photography, cinematic lighting`
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: 'luxury', size: 'portrait', facePhoto }),
      })
      const data = await res.json()
      setGeneratedPreview(data.imageUrl ?? null)
    } catch (e) { console.error(e) }
    finally { setImgLoading(false) }
  }

  function saveTwin() {
    const twin = { id: Date.now(), side, name: twinName, age: twinAge, skinTone, hairColor, hairstyle, bodyType, personality: twinPersonality, backstory: twinBackstory, photo: generatedPreview ?? facePhoto, savedAt: new Date().toISOString() }
    const existing = JSON.parse(localStorage.getItem('academyTwins') || '[]')
    existing.unshift(twin)
    localStorage.setItem('academyTwins', JSON.stringify(existing.slice(0, 20)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        AI Twin <span style={{ color: accent }}>Builder</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px', lineHeight: '1.6' }}>
        Build your {isBaddie ? 'AI influencer' : 'AI king'} step by step. The live preview on the right updates as you build.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* LEFT — Builder */}
        <div>
          {/* Step 1 — Photo */}
          <div className={`card ${isBaddie ? 'b hi' : 'k hi'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Step 1 — Upload Your Reference Photo (Optional)</div>
            <DragDrop
              label={`Drag your AI ${isBaddie ? 'model' : 'king'} photo here`}
              sub="From Flow, Midjourney, or any AI tool — locks this face into generations"
              currentImage={facePhoto}
              onImage={setFacePhoto}
              onClear={() => setFacePhoto(null)}
              height={120}
              side={side}
            />
          </div>

          {/* Step 2 — Identity */}
          <div className={`card ${isBaddie ? 'b hi' : 'k hi'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Step 2 — Identity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <F label={`${isBaddie ? 'Her' : 'His'} name`} side={side}><input className={inp} placeholder={isBaddie ? 'e.g. Luxe, Nova, Empress' : 'e.g. King, Rex, Ace'} value={twinName} onChange={e => setTwinName(e.target.value)} /></F>
              <F label="Age" side={side}><input className={inp} placeholder="e.g. 28" value={twinAge} onChange={e => setTwinAge(e.target.value)} /></F>
            </div>
            <F label={`${isBaddie ? 'Her' : 'His'} personality`} side={side}><input className={inp} placeholder={isBaddie ? 'e.g. Bold, magnetic, unbothered, commands every room' : 'e.g. Commanding, strategic, silent power, magnetic'} value={twinPersonality} onChange={e => setTwinPersonality(e.target.value)} /></F>
            <F label="Backstory" side={side}><textarea className="fta" placeholder={`Where did ${isBaddie ? 'she' : 'he'} come from? What built ${isBaddie ? 'her' : 'him'}?`} value={twinBackstory} onChange={e => setTwinBackstory(e.target.value)} /></F>
            <F label="Goals and brand vision" side={side}><input className={inp} placeholder={`What is ${isBaddie ? 'her' : 'his'} mission? What empire is ${isBaddie ? 'she' : 'he'} building?`} value={twinGoals} onChange={e => setTwinGoals(e.target.value)} /></F>
          </div>

          {/* Step 3 — Appearance */}
          <div className={`card ${isBaddie ? 'b hi' : 'k hi'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Step 3 — Appearance Builder</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
              {appearanceTabs.map(([id, label]) => (
                <button key={id} className={`tab-${isBaddie ? 'b' : 'k'} ${appearanceTab === id ? 'active' : 'inactive'}`} style={{ fontSize: '10px', padding: '5px 10px' }}
                  onClick={() => setAppearanceTab(id)}>{label}</button>
              ))}
            </div>

            {appearanceTab === 'skin' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Skin tone" side={side}>
                  <select className={sel} value={skinTone} onChange={e => setSkinTone(e.target.value)}>
                    {['Fair', 'Light brown', 'Medium brown', 'Warm brown', 'Deep brown', 'Rich dark brown', 'Deep ebony'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Undertone" side={side}>
                  <select className={sel} value={skinUndertone} onChange={e => setSkinUndertone(e.target.value)}>
                    {['Warm golden', 'Cool ashy', 'Neutral', 'Deep warm', 'Reddish warm', 'Olive cool'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
            )}
            {appearanceTab === 'eyes' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Eye color" side={side}>
                  <select className={sel} value={eyeColor} onChange={e => setEyeColor(e.target.value)}>
                    {['Dark brown', 'Medium brown', 'Honey brown', 'Hazel', 'Grey', 'Deep black', 'Light brown'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Eye shape" side={side}>
                  <select className={sel} value={eyeShape} onChange={e => setEyeShape(e.target.value)}>
                    {['Almond', 'Round', 'Hooded', 'Upturned', 'Downturned', 'Monolid', 'Wide-set'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
            )}
            {appearanceTab === 'hair' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Hair color" side={side}>
                  <select className={sel} value={hairColor} onChange={e => setHairColor(e.target.value)}>
                    {['Black', 'Dark brown', 'Medium brown', 'Auburn', 'Blonde', 'Platinum blonde', 'Silver', 'Burgundy', 'Ombre black to brown'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Hair texture" side={side}>
                  <select className={sel} value={hairTexture} onChange={e => setHairTexture(e.target.value)}>
                    {['Natural coils', 'Natural curls', 'Straight', 'Wavy', 'Kinky coils', 'Relaxed', 'Low cut / fade'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Hairstyle" side={side}>
                  <select className={sel} value={hairstyle} onChange={e => setHairstyle(e.target.value)}>
                    {isBaddie
                      ? ['Natural locs', 'Box braids', 'Knotless braids', 'Long straight weave', 'Short cut', 'Natural afro', 'Bantu knots', 'Half up half down', 'Sleek ponytail', 'Butterfly locs', 'Passion twists']
                      : ['Low fade with waves', 'High top fade', 'Locs', 'Short natural', 'Bald', 'Shape up', 'Braids', 'Temp fade', 'Curly natural']
                    }.map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
            )}
            {appearanceTab === 'face' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Lip size" side={side}>
                  <select className={sel} value={lipSize} onChange={e => setLipSize(e.target.value)}>
                    {['Full', 'Medium', 'Thin', 'Very full', 'Asymmetric'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Lip shape" side={side}>
                  <select className={sel} value={lipShape} onChange={e => setLipShape(e.target.value)}>
                    {['Cupid bow', 'Round', 'Wide', 'Pouty', 'Thin upper full lower'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Nose shape" side={side}>
                  <select className={sel} value={noseShape} onChange={e => setNoseShape(e.target.value)}>
                    {['Broad and regal', 'Medium button', 'Narrow bridge', 'Wide and flat', 'Rounded tip', 'Pointed', 'Nubian'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
            )}
            {appearanceTab === 'body' && (
              <F label={isBaddie ? 'Female body type' : 'Male body type'} side={side}>
                <select className={sel} value={bodyType} onChange={e => setBodyType(e.target.value)}>
                  {isBaddie
                    ? ['Curvy hourglass', 'Slim and toned', 'Athletic', 'Petite', 'Thick and curvy', 'Plus size goddess', 'Tall and lean', 'Fit and voluptuous']
                    : ['Athletic muscular', 'Lean and toned', 'Stocky and powerful', 'Tall and slender', 'Bodybuilder', 'Fit medium build', 'Slim athletic']
                  }.map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
            )}
            {appearanceTab === 'extras' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <F label="Nose piercing" side={side}>
                  <select className={sel} value={nosePiercing} onChange={e => setNosePiercing(e.target.value)}>
                    {['None', 'Left nostril stud', 'Right nostril stud', 'Septum ring', 'Both nostrils'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Body piercings" side={side}>
                  <select className={sel} value={bodyPiercing} onChange={e => setBodyPiercing(e.target.value)}>
                    {['None', 'Belly button', 'Ear lobes', 'Multiple ear piercings', 'Eyebrow', 'Tongue'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Tattoos" side={side}>
                  <select className={sel} value={tattoos} onChange={e => setTattoos(e.target.value)}>
                    {['None', 'Small neck tattoo', 'Sleeve tattoo', 'Hand tattoos', 'Chest tattoo', 'Full sleeve', 'Subtle wrist tattoo', 'Back tattoo'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <button className={btn} onClick={generatePreview} disabled={imgLoading} style={{ fontSize: '12px' }}>
              {imgLoading ? 'Generating preview…' : '◈ Generate Live Preview'}
            </button>
            <button className={btn} onClick={buildTwin} disabled={loading} style={{ fontSize: '12px' }}>
              {loading ? 'Building profile…' : '✦ Build Full Profile'}
            </button>
          </div>
          <button className={isBaddie ? 'ghost-b' : 'ghost-k'} onClick={saveTwin} style={{ width: '100%' }}>
            {saved ? '✓ Twin Saved!' : `⊹ Save ${isBaddie ? 'Her' : 'His'} Profile`}
          </button>

          {/* Output */}
          {(output || loading) && (
            <div className={isBaddie ? 'ai-out' : 'ai-out-k'} style={{ marginTop: '14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: accent, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                <span className={isBaddie ? 'b-dot' : 'k-dot'} />AI Twin Profile
              </div>
              {loading && <div className="lbar" style={{ marginBottom: '8px' }}><div className={lbarFill} /></div>}
              {output && <div className="ai-out-text">{output}</div>}
              {output && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => navigator.clipboard?.writeText(output)} className={isBaddie ? 'ghost-b' : 'ghost-k'} style={{ fontSize: '10px', padding: '5px 10px' }}>Copy ↗</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Live Preview */}
        <div>
          <div className={isBaddie ? 'live-preview' : 'live-preview-k'}>
            <div className="preview-header" style={{ background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', borderBottom: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}` }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: accent, textTransform: 'uppercase' as const, letterSpacing: '.8px', display: 'flex', alignItems: 'center' }}>
                <span className={isBaddie ? 'b-dot' : 'k-dot'} />Live Preview
              </div>
              {(generatedPreview || facePhoto) && (
                <button onClick={() => { setGeneratedPreview(null); setFacePhoto(null) }} className="del-btn" style={{ fontSize: '10px', padding: '3px 8px' }}>Clear</button>
              )}
            </div>

            {/* Preview image */}
            <div style={{ aspectRatio: '3/4', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {imgLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="lbar" style={{ width: '80px', margin: '0 auto 10px' }}><div className={lbarFill} /></div>
                  <div style={{ fontSize: '12px', color: accent }}>Generating preview…</div>
                </div>
              ) : generatedPreview ? (
                <img src={generatedPreview} alt="AI Twin Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : facePhoto ? (
                <img src={facePhoto} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.1 }}>{isBaddie ? '◉' : '★'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Build your twin to see a preview</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu2)', marginTop: '6px' }}>or upload a reference photo</div>
                </div>
              )}
            </div>

            {/* Twin info */}
            <div style={{ padding: '14px' }}>
              {twinName && <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: accent, marginBottom: '4px' }}>{twinName}</div>}
              {twinAge && <div style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>Age {twinAge}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px', marginBottom: '10px' }}>
                {[skinTone, hairTexture, eyeColor, bodyType].map(attr => (
                  <span key={attr} style={{ fontSize: '9px', padding: '2px 7px', background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, borderRadius: '4px', color: accent, fontFamily: "'DM Mono',monospace" }}>{attr}</span>
                ))}
              </div>
              {nosePiercing !== 'None' && <div style={{ fontSize: '10px', color: 'var(--mu3)', marginBottom: '3px' }}>Piercing: {nosePiercing}</div>}
              {tattoos !== 'None' && <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Tattoos: {tattoos}</div>}
            </div>

            {/* LoRA training */}
            <div style={{ padding: '12px 14px', background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', borderTop: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}` }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: accent, marginBottom: '4px', fontFamily: "'DM Mono',monospace" }}>✦ Train a Custom LoRA Model</div>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', lineHeight: '1.6', marginBottom: '8px' }}>Upload 20-30 photos of your AI twin to train a model that locks their exact face into every generation.</div>
              <a href="https://fal.ai/models/fal-ai/flux-lora-fast-training" target="_blank" rel="noreferrer"
                style={{ display: 'block', padding: '7px 12px', background: isBaddie ? 'var(--bg-grad)' : 'var(--kg-grad)', borderRadius: '7px', fontSize: '11px', fontWeight: 700, color: isBaddie ? '#fff' : '#000', textDecoration: 'none', textAlign: 'center' }}>
                Train on fal.ai ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AUREN FRAMEWORK ───────────────────────────────────────────
function AURENFramework({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const btn = isBaddie ? 'lilac-btn' : 'gold-btn'
  const [activeLesson, setActiveLesson] = useState('A')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [input1, setInput1] = useState('')
  const [input2, setInput2] = useState('')

  const auren = [
    { letter: 'A', title: 'Avatar & Identity', subtitle: 'Build the look, personality, lifestyle, and story', color: accent, workshop: `Build ${isBaddie ? 'Her' : 'His'} Look, Personality, Lifestyle, and Story` },
    { letter: 'U', title: 'Upgrade Realism', subtitle: 'Content mastery and authentic storytelling', color: accent, workshop: 'Content creation workflow and realism techniques' },
    { letter: 'R', title: 'Revenue Setup', subtitle: 'Monetization strategy and income streams', color: accent, workshop: 'Brand deals, POD, affiliates, and digital products' },
    { letter: 'E', title: 'Expansion System', subtitle: 'Automation and scaling your presence', color: accent, workshop: 'Systems, tools, and automation for scale' },
    { letter: 'N', title: 'Network & Scale', subtitle: 'Community, legacy, and long-term vision', color: accent, workshop: 'Building your network and lasting legacy' },
  ]

  async function runWorkshop() {
    setLoading(true); setOutput('')
    const lesson = auren.find(a => a.letter === activeLesson)
    try {
      setOutput(await callAPI('generate/academy', {
        tool: 'auren',
        side,
        letter: activeLesson,
        lesson: lesson?.title || '',
        name: name || (isBaddie ? 'my AI twin' : 'my AI king'),
        input1,
        input2,
      }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  const lesson = auren.find(a => a.letter === activeLesson)

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        AUREN <span style={{ color: accent }}>Framework</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>
        The 5-step system for building a powerful AI creator brand.
      </div>

      {/* AUREN tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '24px' }}>
        {auren.map(a => (
          <div key={a.letter} onClick={() => { setActiveLesson(a.letter); setOutput('') }}
            className={`card ${isBaddie ? 'b' : 'k'}`}
            style={{ cursor: 'pointer', textAlign: 'center', padding: '14px 8px', borderColor: activeLesson === a.letter ? (isBaddie ? 'var(--bb)' : 'var(--kb)') : undefined, background: activeLesson === a.letter ? (isBaddie ? 'var(--baddie3)' : 'var(--kings3)') : undefined, transition: 'all .2s' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: accent, marginBottom: '4px' }}>{a.letter}</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--w)', fontFamily: "'Syne',sans-serif" }}>{a.title.split(' ')[0]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className={`card ${isBaddie ? 'b hi' : 'k hi'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>{lesson?.letter} — {lesson?.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--w2)', marginBottom: '4px', fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{lesson?.subtitle}</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6', marginBottom: '16px' }}>Workshop: {lesson?.workshop}</div>
            <F label={`${isBaddie ? 'Her' : 'His'} name`} side={side}>
              <input className={isBaddie ? 'finp' : 'finp-k'} placeholder={isBaddie ? 'e.g. Luxe, Nova, Empress' : 'e.g. King, Rex, Ace'} value={name} onChange={e => setName(e.target.value)} />
            </F>
            {activeLesson === 'A' && <>
              <F label="Her/His core personality traits" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Bold, magnetic, mysterious, luxury-driven" value={input1} onChange={e => setInput1(e.target.value)} /></F>
              <F label="Her/His brand story" side={side}><textarea className="fta" placeholder="Where did they come from? What is their rise story?" value={input2} onChange={e => setInput2(e.target.value)} /></F>
            </>}
            {activeLesson === 'U' && <>
              <F label="Content style" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Luxury lifestyle, fashion, AI education" value={input1} onChange={e => setInput1(e.target.value)} /></F>
              <F label="Target audience" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Black women 22-40, aspiring creators" value={input2} onChange={e => setInput2(e.target.value)} /></F>
            </>}
            {activeLesson === 'R' && <>
              <F label="Current income streams" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. POD, brand deals, course sales" value={input1} onChange={e => setInput1(e.target.value)} /></F>
              <F label="Revenue goal" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. $5k/month in 90 days" value={input2} onChange={e => setInput2(e.target.value)} /></F>
            </>}
            {activeLesson === 'E' && <>
              <F label="What takes most of your time" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Creating content, responding to DMs" value={input1} onChange={e => setInput1(e.target.value)} /></F>
              <F label="Platforms you want to scale" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. TikTok, Instagram, Etsy" value={input2} onChange={e => setInput2(e.target.value)} /></F>
            </>}
            {activeLesson === 'N' && <>
              <F label="Community or network vision" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Build a community of AI creators" value={input1} onChange={e => setInput1(e.target.value)} /></F>
              <F label="Legacy goal" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Build the first Black AI creator network" value={input2} onChange={e => setInput2(e.target.value)} /></F>
            </>}
            <button className={btn} onClick={runWorkshop} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Running workshop…' : `✦ Run ${activeLesson} Workshop ↗`}
            </button>
            {(output || loading) && (
              <div className={isBaddie ? 'ai-out' : 'ai-out-k'} style={{ marginTop: '12px' }}>
                {loading && <div className="lbar" style={{ marginBottom: '8px' }}><div className={isBaddie ? 'lbar-fill-b' : 'lbar-fill-k'} /></div>}
                {output && <div className="ai-out-text">{output}</div>}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={`card ${isBaddie ? 'b' : 'k'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>The AUREN System</div>
            {auren.map(a => (
              <div key={a.letter} style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: `0.5px solid ${activeLesson === a.letter ? (isBaddie ? 'var(--bb)' : 'var(--kb)') : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}
                onClick={() => setActiveLesson(a.letter)}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: 400, color: accent, lineHeight: 1, flexShrink: 0 }}>{a.letter}</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--w)', marginBottom: '2px' }}>{a.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.4' }}>{a.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`card ${isBaddie ? 'b' : 'k'}`}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Skool Course Access</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '12px' }}>
              The full AUREN curriculum lives in your Skool community. Complete the lessons there and bring your work back here to build.
            </div>
            <a href="https://skool.com" target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: '10px', background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, borderRadius: '8px', fontSize: '12px', color: accent, textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
              Go to Skool Course ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CINEMATIC CONTENT SHOP ────────────────────────────────────
function CinematicContentShop({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const btn = isBaddie ? 'lilac-btn' : 'gold-btn'

  const [scenes, setScenes] = useState<Array<{ id: number; prompt: string; description: string; imageUrl: string | null; loading: boolean }>>([])
  const [sceneDesc, setSceneDesc] = useState('')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function addScene() {
    if (!sceneDesc.trim()) return
    const newScene = { id: Date.now(), prompt: sceneDesc, description: sceneDesc, imageUrl: null, loading: true }
    setScenes(prev => [...prev, newScene])
    setSceneDesc('')

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sceneDesc,
          style: 'cinematic',
          size: 'landscape',
          facePhoto: characterPhoto,
        }),
      })
      const data = await res.json()
      setScenes(prev => prev.map(s => s.id === newScene.id ? { ...s, imageUrl: data.imageUrl, loading: false } : s))
    } catch {
      setScenes(prev => prev.map(s => s.id === newScene.id ? { ...s, loading: false } : s))
    }
  }

  function removeScene(id: number) {
    setScenes(prev => prev.filter(s => s.id !== id))
  }

  async function generateAllScenes() {
    setGenerating(true)
    try {
      const res = await callAPI('generate/academy', {
        tool: 'scenes',
        side,
        context: `Generate 4 cinematic still photo scene prompts for an AI ${isBaddie ? 'influencer/model' : 'male influencer'} content shoot`,
      })
      const lines = res.split('\n').filter(l => l.trim() && l.length > 20).slice(0, 4)
      for (const line of lines) {
        const cleanLine = line.replace(/^\d+\.\s*/, '').trim()
        if (cleanLine) {
          const newScene = { id: Date.now() + Math.random(), prompt: cleanLine, description: cleanLine, imageUrl: null, loading: true }
          setScenes(prev => [...prev, newScene])
          try {
            const imgRes = await fetch('/api/generate/image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: cleanLine, style: 'cinematic', size: 'landscape', facePhoto: characterPhoto }),
            })
            const imgData = await imgRes.json()
            setScenes(prev => prev.map(s => s.id === newScene.id ? { ...s, imageUrl: imgData.imageUrl, loading: false } : s))
          } catch {
            setScenes(prev => prev.map(s => s.id === newScene.id ? { ...s, loading: false } : s))
          }
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Cinematic <span style={{ color: accent }}>Content Shop</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>
        Build your scenes on the left — they stack on the right in order with prompts underneath.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* LEFT — Scene Builder */}
        <div>
          <div className={`card ${isBaddie ? 'b hi' : 'k hi'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Scene Builder</div>

            <F label="Character photo (locks face)" side={side}>
              <DragDrop label="Drag your AI twin photo" sub="Face stays consistent across all scenes" currentImage={characterPhoto} onImage={setCharacterPhoto} onClear={() => setCharacterPhoto(null)} height={100} side={side} />
            </F>

            <F label="Background reference (optional)" side={side}>
              <DragDrop label="Drag a background photo" sub="Sets the scene environment" currentImage={backgroundImage} onImage={setBackgroundImage} onClear={() => setBackgroundImage(null)} height={80} side={side} />
            </F>

            <F label="Describe this scene" side={side}>
              <textarea className="fta" placeholder={`e.g. ${isBaddie ? 'Luxe Envi standing in front of her private jet at golden hour, luxury white blazer, confident pose' : 'King Rex in a luxury penthouse office, navy suit, commanding view of the city skyline'}`} value={sceneDesc} onChange={e => setSceneDesc(e.target.value)} />
            </F>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className={btn} onClick={addScene} disabled={!sceneDesc.trim()} style={{ fontSize: '12px' }}>
                + Add Scene
              </button>
              <button className={btn} onClick={generateAllScenes} disabled={generating} style={{ fontSize: '12px', opacity: generating ? 0.7 : 1 }}>
                {generating ? 'Generating…' : '✦ Auto Generate 4 Scenes'}
              </button>
            </div>
          </div>

          <div className={`card ${isBaddie ? 'b' : 'k'}`}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Scene Quick-starts</div>
            {(isBaddie ? [
              'Luxury lifestyle — walking into a high-rise penthouse lobby at dusk, designer outfit, confident stride',
              'Fashion editorial — sitting in a luxury sports car on a city street, golden hour, power pose',
              'Brand deal — holding up a luxury skincare product in a marble bathroom, natural morning light',
              'Reality TV drama — standing at the edge of a rooftop pool at night, city lights behind her, intense expression',
            ] : [
              'Power mogul — behind a glass desk in a luxury corner office, city skyline at night, serious expression',
              'Luxury lifestyle — walking out of a private plane on a tarmac, designer suit, confident stride',
              'Street royalty — standing in front of a luxury SUV on a quiet city block, urban editorial',
              'Brand presence — sitting at a restaurant bar with a watch visible, casual luxury, magnetic energy',
            ]).map(q => (
              <button key={q.slice(0, 20)} onClick={() => setSceneDesc(q)}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.1)' : 'rgba(232,199,106,0.1)'}`, borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', lineHeight: '1.4' }}>
                {q.slice(0, 80)}… ↗
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — Scene Stack */}
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Scene Stack — {scenes.length} scenes</span>
            {scenes.length > 0 && <button onClick={() => setScenes([])} className="del-btn" style={{ fontSize: '10px' }}>Clear all</button>}
          </div>

          {scenes.length === 0 ? (
            <div className={`card ${isBaddie ? 'b' : 'k'}`} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.15 }}>◈</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Your scenes stack here</div>
              <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Each scene builds on the last</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {scenes.map((scene, i) => (
                <div key={scene.id} className={isBaddie ? 'scene-card' : 'scene-card-k'}>
                  <div style={{ padding: '8px 12px', background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', borderBottom: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: accent, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>SCENE {i + 1}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {scene.imageUrl && <a href={scene.imageUrl} download target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: accent, fontFamily: "'DM Mono',monospace", textDecoration: 'none' }}>⬇</a>}
                      <button onClick={() => removeScene(scene.id)} className="del-btn" style={{ padding: '2px 8px', fontSize: '10px' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ minHeight: '120px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {scene.loading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="lbar" style={{ width: '60px', margin: '0 auto 8px' }}><div className={isBaddie ? 'lbar-fill-b' : 'lbar-fill-k'} /></div>
                        <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Generating…</div>
                      </div>
                    ) : scene.imageUrl ? (
                      <img src={scene.imageUrl} alt={`Scene ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--mu3)', padding: '20px', textAlign: 'center' }}>Generation failed</div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', color: accent, fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '4px' }}>Scene Prompt</div>
                    <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.6' }}>{scene.prompt}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── VIRTUAL STORE ─────────────────────────────────────────────
function VirtualStore({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const [tab, setTab] = useState('envi')

  const categories = [
    { id: 'envi', label: 'Envi Lee Collection', icon: '✦' },
    { id: 'houses', label: 'Luxury Houses', icon: '◉' },
    { id: 'cars', label: 'Dream Cars', icon: '⊳' },
    { id: 'ugc', label: 'UGC Shopping', icon: '⊹' },
  ]

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Virtual <span style={{ color: accent }}>Store</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Shop for your AI twin's wardrobe, lifestyle, and UGC content.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {categories.map(c => (
          <button key={c.id} className={`tab-${isBaddie ? 'b' : 'k'} ${tab === c.id ? 'active' : 'inactive'}`} onClick={() => setTab(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {tab === 'envi' && (
        <div>
          <div style={{ background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: accent, marginBottom: '8px' }}>Envi Lee Collection</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '400px', margin: '0 auto' }}>
              Curated clothing, accessories, and lifestyle pieces for your AI twin. Envi Lee is building the collection — check back soon.
            </div>
            <div style={{ marginTop: '16px', fontSize: '10px', color: accent, fontFamily: "'DM Mono',monospace" }}>✦ Coming Soon — Collection in Curation</div>
          </div>
        </div>
      )}
      {(tab === 'houses' || tab === 'cars') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className={`card ${isBaddie ? 'b' : 'k'}`} style={{ textAlign: 'center', opacity: 0.5, cursor: 'not-allowed' }}>
              <div style={{ height: '120px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '32px', opacity: 0.2 }}>{tab === 'houses' ? '🏠' : '🚗'}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>Coming Soon</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'ugc' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--w2)', marginBottom: '16px' }}>Shop products to feature in your UGC content — Amazon, TikTok Shop, and more.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { name: 'Amazon', url: 'https://amazon.com', desc: 'Shop for UGC products', icon: '📦' },
              { name: 'TikTok Shop', url: 'https://shop.tiktok.com', desc: 'TikTok affiliate products', icon: '🛍' },
              { name: 'Target', url: 'https://target.com', desc: 'Lifestyle and fashion UGC', icon: '🎯' },
              { name: 'Walmart', url: 'https://walmart.com', desc: 'Affordable UGC products', icon: '⭐' },
              { name: 'Ulta Beauty', url: 'https://ulta.com', desc: 'Beauty and skincare UGC', icon: '💄' },
              { name: 'Fashion Nova', url: 'https://fashionnova.com', desc: 'Fashion UGC content', icon: '👗' },
            ].map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                className={`card ${isBaddie ? 'b' : 'k'}`}
                style={{ textDecoration: 'none', display: 'block', textAlign: 'center', transition: 'all .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = isBaddie ? 'var(--bb)' : 'var(--kb)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = isBaddie ? 'rgba(176,108,255,0.15)' : 'rgba(232,199,106,0.15)'}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: accent, marginBottom: '4px' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{s.desc}</div>
                <div style={{ fontSize: '10px', color: accent, marginTop: '8px', fontFamily: "'DM Mono',monospace" }}>Shop ↗</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── PORTFOLIO ─────────────────────────────────────────────────
function Portfolio({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const btn = isBaddie ? 'lilac-btn' : 'gold-btn'
  const [twinName, setTwinName] = useState('')
  const [niche, setNiche] = useState('')
  const [platforms, setPlatforms] = useState('')
  const [achievements, setAchievements] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/academy', { tool: 'mediakit', side, twinName, niche, platforms, achievements })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Portfolio & <span style={{ color: accent }}>Media Kit</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Generate your AI twin's media kit — ready to pitch brands and collaborations.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className={`card ${isBaddie ? 'b hi' : 'k hi'}`}>
          <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Media Kit Generator</div>
          <F label="AI twin name" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder={isBaddie ? 'e.g. Luxe Envi' : 'e.g. King Rex'} value={twinName} onChange={e => setTwinName(e.target.value)} /></F>
          <F label="Niche and content type" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. Luxury lifestyle, fashion, AI creator education" value={niche} onChange={e => setNiche(e.target.value)} /></F>
          <F label="Platforms and audience" side={side}><input className={isBaddie ? 'finp' : 'finp-k'} placeholder="e.g. TikTok 50k, Instagram 30k, YouTube 10k" value={platforms} onChange={e => setPlatforms(e.target.value)} /></F>
          <F label="Key achievements" side={side}><textarea className="fta" placeholder="Brand deals, viral moments, milestones, courses, products..." value={achievements} onChange={e => setAchievements(e.target.value)} /></F>
          <button className={btn} onClick={generate} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating…' : '✦ Generate Media Kit ↗'}
          </button>
          {(output || loading) && (
            <div className={isBaddie ? 'ai-out' : 'ai-out-k'} style={{ marginTop: '12px' }}>
              {loading && <div className="lbar" style={{ marginBottom: '8px' }}><div className={isBaddie ? 'lbar-fill-b' : 'lbar-fill-k'} /></div>}
              {output && <div className="ai-out-text">{output}</div>}
            </div>
          )}
        </div>
        <div>
          <div className={`card ${isBaddie ? 'b' : 'k'}`} style={{ marginBottom: '14px' }}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>What's in your media kit</div>
            {[
              ['Bio', 'Short and long versions for different platforms'],
              ['Stats overview', 'Follower counts, engagement rate, reach'],
              ['Content pillars', 'Your 3-5 core content themes'],
              ['Brand deal experience', 'Past collaborations and results'],
              ['Rate card', 'Your pricing for different content types'],
              ['Contact CTA', 'How brands can reach you for deals'],
            ].map(([t, d]) => (
              <div key={t} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: accent, marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.4' }}>{d}</div>
              </div>
            ))}
          </div>
          <div className={`card ${isBaddie ? 'b' : 'k'}`}>
            <div className={isBaddie ? 'ftitle-b' : 'ftitle-k'}>Saved Twins</div>
            {JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('academyTwins') || '[]' : '[]').slice(0, 4).map((twin: { id: number; name: string; side: string; savedAt: string }) => (
              <div key={twin.id} style={{ padding: '8px 10px', background: 'var(--bg3)', border: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.1)' : 'rgba(232,199,106,0.1)'}`, borderRadius: '7px', marginBottom: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: accent }}>{twin.name || 'Unnamed Twin'}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{twin.side} · {new Date(twin.savedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PROTECTION ────────────────────────────────────────────────
function Protection({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Protection <span style={{ color: accent }}>Module</span>
      </div>
      <div style={{ background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: accent, marginBottom: '8px' }}>🔒 Complete the Skool Course to Unlock</div>
        <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7' }}>
          The protection module contains Envi Lee's proprietary steps for protecting your AI identity, brand, and income. This content is only available after completing the protection lesson in your Skool course.
        </div>
        <a href="https://skool.com" target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', marginTop: '14px', padding: '10px 20px', background: isBaddie ? 'var(--bg-grad)' : 'var(--kg-grad)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: isBaddie ? '#fff' : '#000', textDecoration: 'none' }}>
          Complete Skool Course to Unlock ↗
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {['Watermarking your AI content', 'Copyright basics for digital creators', 'Brand protection steps', 'AI identity legal considerations', 'Platform terms compliance', 'Revenue protection strategies'].map(topic => (
          <div key={topic} className={`card ${isBaddie ? 'b' : 'k'}`} style={{ opacity: 0.4, cursor: 'not-allowed' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w)', marginBottom: '4px' }}>{topic}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>Complete course to unlock</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ACADEMY BOT ───────────────────────────────────────────────
function AcademyBot({ side, onClose }: { side: AcademySide; onClose: () => void }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const [messages, setMessages] = useState([{ role: 'bot', text: `I'm your ${isBaddie ? 'Baddie Academy' : "King's Academy"} assistant! Ask me anything about building your AI twin, the AUREN framework, creating content, brand deals, or growing your digital presence.` }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are the ${isBaddie ? 'Baddie Academy' : "King's Academy"} assistant for Envi Lee Academy Studios. Help with: building AI twins and AI influencers, the AUREN framework (Avatar, Upgrade, Revenue, Expansion, Network), creating cinematic content, brand deals, POD business, luxury lifestyle branding, and growing as an AI creator. Be inspiring, specific, and empowering. Question: ${msg}` })
      setMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '340px', background: 'var(--bg2)', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, borderRadius: '16px', boxShadow: `0 0 40px ${isBaddie ? 'rgba(176,108,255,0.1)' : 'rgba(232,199,106,0.08)'}`, zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', borderBottom: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: accent, letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span className={isBaddie ? 'b-dot' : 'k-dot'} />{isBaddie ? 'Baddie Assistant' : "King's Assistant"}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '88%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? (isBaddie ? 'var(--baddie3)' : 'var(--kings3)') : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? (isBaddie ? 'var(--bb)' : 'var(--kb)') : 'rgba(255,255,255,0.05)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: accent, alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.1)' : 'rgba(232,199,106,0.1)'}`, display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: 'var(--bg3)', border: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.15)' : 'rgba(232,199,106,0.15)'}`, borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: isBaddie ? 'var(--bg-grad)' : 'var(--kg-grad)', color: isBaddie ? '#fff' : '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── SIDEBAR ───────────────────────────────────────────────────
const NAV: { tool: AcademyTool; label: string; icon: string }[] = [
  { tool: 'dashboard', label: 'Dashboard', icon: '◉' },
  { tool: 'builder', label: 'AI Twin Builder', icon: '✦' },
  { tool: 'auren', label: 'AUREN Framework', icon: '◈' },
  { tool: 'cinematic', label: 'Cinematic Content', icon: '⊳' },
  { tool: 'store', label: 'Virtual Store', icon: '⊹' },
  { tool: 'portfolio', label: 'Portfolio & Media Kit', icon: '◷' },
  { tool: 'protection', label: 'Protection Module', icon: '🔒' },
  { tool: 'saved', label: 'Saved Work', icon: '◌' },
]

// ── SAVED WORK ────────────────────────────────────────────────
function SavedWork({ side }: { side: AcademySide }) {
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'
  const [items, setItems] = useState<Array<{ id: number; content: string; savedAt: string }>>([])
  const [twins, setTwins] = useState<Array<{ id: number; name: string; side: string; savedAt: string }>>([])

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('academySaved') || '[]'))
    setTwins(JSON.parse(localStorage.getItem('academyTwins') || '[]'))
  }, [])

  function delItem(id: number) {
    const updated = items.filter(i => i.id !== id)
    setItems(updated); localStorage.setItem('academySaved', JSON.stringify(updated))
  }
  function delTwin(id: number) {
    const updated = twins.filter(t => t.id !== id)
    setTwins(updated); localStorage.setItem('academyTwins', JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Saved <span style={{ color: accent }}>Work</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Your saved twins, profiles, and content.</div>

      {twins.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Saved Twins</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {twins.map(twin => (
              <div key={twin.id} className={`card ${isBaddie ? 'b' : 'k'}`}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: accent, marginBottom: '4px' }}>{twin.name || 'Unnamed'}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '10px' }}>{twin.side} · {new Date(twin.savedAt).toLocaleDateString()}</div>
                <button onClick={() => delTwin(twin.id)} className="del-btn" style={{ width: '100%', fontSize: '10px' }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Saved Content</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {items.map(item => (
              <div key={item.id} className={`card ${isBaddie ? 'b' : 'k'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                  <button onClick={() => delItem(item.id)} className="del-btn">Delete</button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', maxHeight: '100px', overflow: 'hidden' }}>{item.content}</div>
              </div>
            ))}
          </div>
        </div>
      ) : twins.length === 0 && (
        <div className={`card ${isBaddie ? 'b' : 'k'}`} style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.15 }}>◌</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No saved work yet</div>
        </div>
      )}
    </div>
  )
}

// ── ACADEMY DASHBOARD ─────────────────────────────────────────
function AcademyDashboard({ side, setTool }: { side: AcademySide; setTool: (t: AcademyTool) => void }) {
  const { user } = useUser()
  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'

  const sections = [
    { id: 'builder', icon: '✦', label: 'AI Twin Builder', desc: 'Build your look, identity, and live preview', color: accent },
    { id: 'auren', icon: 'A', label: 'AUREN Workshop', desc: '5-step system for building your brand', color: accent },
    { id: 'cinematic', icon: '⊳', label: 'Cinematic Content', desc: 'Scene builder with stacking and prompts', color: accent },
    { id: 'store', icon: '⊹', label: 'Virtual Store', desc: 'Shop for wardrobe, homes, and UGC products', color: accent },
    { id: 'portfolio', icon: '◷', label: 'Media Kit', desc: 'Auto-generated portfolio and brand kit', color: accent },
    { id: 'protection', icon: '🔒', label: 'Protection', desc: 'Complete Skool course to unlock', color: 'var(--mu3)' },
  ]

  return (
    <div className="pg-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: `${accent}80`, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
          {isBaddie ? 'Baddie Academy' : "King's Academy"} · Dashboard
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Welcome, <span style={{ color: accent }}>{user?.firstName || (isBaddie ? 'Baddie' : 'King')}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>
          {isBaddie ? 'Build your AI twin. Own your identity. Monetize your presence.' : 'Build your AI king. Command your empire. Build your legacy.'}
        </div>
      </div>

      {/* AUREN progress */}
      <div style={{ background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}`, borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>AUREN Framework Progress</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {'AUREN'.split('').map((letter, i) => (
            <div key={letter} style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--bg3)', borderRadius: '8px', border: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.15)' : 'rgba(232,199,106,0.15)'}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', fontWeight: 400, color: i === 0 ? accent : 'var(--mu2)', marginBottom: '3px' }}>{letter}</div>
              <div style={{ fontSize: '8px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>{['Avatar', 'Upgrade', 'Revenue', 'Expand', 'Network'][i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section cards */}
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: `${accent}60`, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Your Studios</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {sections.map(s => (
          <div key={s.id} className={`card ${isBaddie ? 'b' : 'k'}`}
            style={{ cursor: 'pointer', transition: 'all .2s' }}
            onClick={() => setTool(s.id as AcademyTool)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = isBaddie ? 'var(--bb)' : 'var(--kb)'; (e.currentTarget as HTMLElement).style.background = isBaddie ? 'var(--baddie3)' : 'var(--kings3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isBaddie ? 'rgba(176,108,255,0.15)' : 'rgba(232,199,106,0.15)'; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ fontSize: '22px', color: s.color, marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '10px' }}>{s.desc}</div>
            <div style={{ fontSize: '10px', color: s.color, fontFamily: "'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function AcademyPage() {
  const { user } = useUser()
  const router = useRouter()
  const [side, setSide] = useState<AcademySide>('choose')
  const [active, setActive] = useState<AcademyTool>('dashboard')
  const [hovered, setHovered] = useState<AcademyTool | null>(null)
  const [botOpen, setBotOpen] = useState(false)

  const isBaddie = side === 'baddie'
  const accent = isBaddie ? 'var(--baddie)' : 'var(--kings)'

  if (side === 'choose') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <SignedOut><RedirectToSignIn /></SignedOut>
        <SignedIn><SchoolChooser setSide={setSide} /></SignedIn>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
          {/* SIDEBAR */}
          <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.12)' : 'rgba(232,199,106,0.12)'}`, padding: 0, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 14px', borderBottom: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.1)' : 'rgba(232,199,106,0.1)'}` }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</button>
                <span style={{ color: 'var(--mu2)', fontSize: '10px' }}>·</span>
                <button onClick={() => setSide('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '10px', color: accent, fontFamily: "'DM Mono',monospace" }}>Switch Academy</button>
              </div>

              {/* Academy logo in sidebar */}
              {isBaddie ? (
                <div style={{ padding: '10px', background: 'var(--baddie3)', border: '0.5px solid var(--bb)', borderRadius: '10px' }}>
                  <div style={{ fontFamily: "'Georgia', serif", fontSize: '10px', fontStyle: 'italic', color: '#fff', letterSpacing: '1px', textAlign: 'center' }}>Envi Lee</div>
                  <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '20px', fontWeight: 900, color: 'var(--baddie)', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1, textAlign: 'center' }}>BADDIE</div>
                  <div style={{ fontFamily: "'Georgia', serif", fontSize: '10px', fontStyle: 'italic', color: '#fff', letterSpacing: '1px', textAlign: 'center' }}>Academy</div>
                </div>
              ) : (
                <div style={{ padding: '10px', background: 'var(--kings3)', border: '0.5px solid var(--kb)', borderRadius: '10px', textAlign: 'center' }}>
                  <svg width="28" height="20" viewBox="0 0 100 70" style={{ display: 'block', margin: '0 auto 4px' }}>
                    <polyline points="10,60 25,20 50,50 75,20 90,60" fill="none" stroke="#e8c76a" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx="10" cy="60" r="5" fill="#e8c76a" />
                    <circle cx="50" cy="20" r="5" fill="#e8c76a" />
                    <circle cx="90" cy="60" r="5" fill="#e8c76a" />
                  </svg>
                  <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '2px', lineHeight: 1 }}>KING'S</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: 'var(--kings)', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '2px' }}>ACADEMY</div>
                </div>
              )}
            </div>

            {user && (
              <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.08)' : 'rgba(232,199,106,0.08)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: isBaddie ? 'var(--baddie3)' : 'var(--kings3)', borderRadius: '8px', border: `0.5px solid ${isBaddie ? 'var(--bb)' : 'var(--kb)'}` }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Creator'}</div>
                    <div style={{ fontSize: '9px', color: `${accent}80`, fontFamily: "'DM Mono',monospace" }}>{isBaddie ? 'Baddie' : "King's"} Plan</div>
                  </div>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                </div>
              </div>
            )}

            <div style={{ padding: '10px', flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Studios</div>
              {NAV.map(({ tool, label, icon }) => (
                <button key={tool} onClick={() => setActive(tool)}
                  onMouseEnter={() => setHovered(tool)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? (isBaddie ? 'var(--bb)' : 'var(--kb)') : 'transparent'}`, background: active === tool ? (isBaddie ? 'var(--baddie3)' : 'var(--kings3)') : hovered === tool ? `${accent}05` : 'none', color: active === tool ? accent : hovered === tool ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${isBaddie ? 'rgba(176,108,255,0.1)' : 'rgba(232,199,106,0.1)'}` }}>
              <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.8px' }}>Quick Links</div>
              {[{ label: 'Skool Course', url: 'https://skool.com' }, { label: 'Google Flow', url: 'https://labs.google/flow' }, { label: 'fal.ai LoRA', url: 'https://fal.ai' }].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: 'block', padding: '5px 8px', fontSize: '11px', color: 'var(--mu3)', textDecoration: 'none', fontFamily: "'DM Mono',monospace", borderRadius: '5px', marginBottom: '2px', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = accent)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--mu3)')}>
                  {l.label} ↗
                </a>
              ))}
            </div>
          </aside>

          {/* MAIN */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: `radial-gradient(ellipse at 80% 0%, ${isBaddie ? 'rgba(124,58,237,0.04)' : 'rgba(196,151,58,0.03)'} 0%, transparent 50%)` }}>
            {active === 'dashboard' && <AcademyDashboard side={side} setTool={setActive} />}
            {active === 'builder' && <AITwinBuilder side={side} />}
            {active === 'auren' && <AURENFramework side={side} />}
            {active === 'cinematic' && <CinematicContentShop side={side} />}
            {active === 'store' && <VirtualStore side={side} />}
            {active === 'portfolio' && <Portfolio side={side} />}
            {active === 'protection' && <Protection side={side} />}
            {active === 'saved' && <SavedWork side={side} />}
          </main>

          {/* BOT */}
          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: isBaddie ? 'var(--bg-grad)' : 'var(--kg-grad)', border: 'none', color: isBaddie ? '#fff' : '#000', fontSize: '20px', cursor: 'pointer', boxShadow: `0 0 20px ${isBaddie ? 'rgba(176,108,255,0.3)' : 'rgba(232,199,106,0.25)'}`, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botOpen ? '✕' : '✦'}
          </button>
          {botOpen && <AcademyBot side={side} onClose={() => setBotOpen(false)} />}
        </div>
      </SignedIn>
    </>
  )
}
