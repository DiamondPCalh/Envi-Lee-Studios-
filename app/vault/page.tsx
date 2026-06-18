'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type VaultRoom = 'main' | 'detail' | 'suite' | 'editor' | 'admin'

const CATEGORIES = [
  'Baddie Selfies', 'Luxury Lifestyle', 'Fashion Influencer', 'Travel Vlogs',
  'GRWM', 'Beauty Content', 'Gym Girl Content', 'CEO Baddie',
  'Rich Girl Energy', 'Soft Life Content', 'AI Luxury Commercials',
  'UGC Commercials', 'UGC Content', 'AI Mini Movies', 'AI Music Video',
  'AI Podcast Clips', 'AI Podcasts', 'AI Reality Shows', 'AI Vlogs',
  'AI Fashion Show', 'AI Product Content', 'AI TV Series Episodes',
  'Couple Content', 'Motherhood Content', 'Brand Content',
  'Viral TikTok Content', 'YouTube Shorts', 'Instagram Reels', 'Faceless Content',
]

const CAMERA_ANGLES = [
  'Wide Shot', 'Medium Shot', 'Close Up', 'Extreme Close Up',
  'Low Angle', 'High Angle', 'Bird\'s Eye View', 'Dutch Angle',
  'Over the Shoulder', 'POV Shot', 'Tracking Shot', 'Dolly Movement',
  'Slow Push-In', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down',
  'Crane Shot', 'Handheld', 'Static Shot', 'Zoom In', 'Zoom Out',
]

const DIFFICULTY = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const AI_TOOLS = [
  'Google Flow', 'Higgsfield', 'Kling AI', 'Veo 3', 'Runway',
  'Midjourney', 'Luma AI', 'Pika Labs', 'CapCut', 'ElevenLabs',
  'Sync.so', 'Soul ID', 'fal.ai', 'Replicate', 'Adobe Firefly',
  'Leonardo AI', 'D-ID', 'HeyGen', 'Canva', 'DaVinci Resolve',
]

interface Scene {
  id: string
  stillPrompt: string
  videoPrompt: string
  cameraAngle: string
  referenceImage?: string
  backgroundImage?: string
  voiceUsed?: string
  notes?: string
}

interface VideoPost {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  thumbnail?: string
  videoUrl?: string
  tools: string[]
  workflow: string
  scenes: Scene[]
  voiceUsed?: string
  musicUsed?: string
  creatorName: string
  creatorId: string
  likes: number
  saves: number
  comments: number
  rating: number
  createdAt: string
  approved: boolean
}

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
    --bg2: #02080a;
    --bg3: #041015;
    --s1: #061520;
    --s2: #0a2030;
    --w: #f0fff8;
    --w2: #c0f0e8;
    --mu: #082030;
    --mu2: #103040;
    --mu3: #406080;
    --r: 8px; --r2: 12px; --r3: 16px;

    --yellow: #ffe600;
    --cyan: #00cfff;
    --cyan2: #0099cc;
    --yb: rgba(255,230,0,0.3);
    --cb: rgba(0,207,255,0.3);
    --yg: rgba(255,230,0,0.07);
    --cg: rgba(0,207,255,0.07);
    --vc-grad: linear-gradient(135deg, #ffe600, #00cfff);
    --vc-grad2: linear-gradient(135deg, #ffd700, #00cfff, #0066ff);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #0a2030; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--vc-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .vc-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--yellow); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(0,207,255,0.12); border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: rgba(0,207,255,0.25); }
  .card.yellow { border-color: rgba(255,230,0,0.25); }
  .card.accent { border-color: var(--cb); background: var(--cg); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--cyan); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(0,207,255,0.12); }
  .ftitle-y { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--yellow); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(255,230,0,0.12); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(0,207,255,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(0,207,255,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(0,207,255,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .vc-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--vc-grad); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(0,207,255,0.2); }
  .vc-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(255,230,0,0.3); }
  .vc-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-y { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--yb); background: transparent; color: var(--yellow); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-y:hover { background: var(--yg); }
  .ghost-c { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--cb); background: transparent; color: var(--cyan); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-c:hover { background: var(--cg); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .video-card { background: var(--s1); border: 0.5px solid rgba(0,207,255,0.1); border-radius: 12px; overflow: hidden; cursor: pointer; transition: all .25s; break-inside: avoid; margin-bottom: 14px; }
  .video-card:hover { border-color: rgba(255,230,0,0.4); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,207,255,0.1); }

  .cat-pill { padding: 5px 12px; border-radius: 20px; font-size: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; font-weight: 500; }
  .cat-pill.on { background: var(--yg); border: 0.5px solid var(--yb); color: var(--yellow); }
  .cat-pill.off { background: var(--s2); border: 0.5px solid rgba(0,207,255,0.1); color: var(--mu3); }

  .scene-card { background: var(--bg3); border: 0.5px solid rgba(0,207,255,0.15); border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .tab-pill { padding: 7px 16px; border-radius: 20px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; border: 0.5px solid transparent; }
  .tab-pill.on { background: var(--vc-grad); color: #000; }
  .tab-pill.off { background: var(--s2); color: var(--mu3); border-color: rgba(0,207,255,0.1); }

  .drag-zone { border: 1.5px dashed rgba(0,207,255,0.2); border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; background: var(--cg); position: relative; transition: all .2s; }
  .drag-zone:hover { border-color: var(--cyan); }
  .drag-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .locked-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 300; display: flex; align-items: center; justify-content: center; }
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

function DragDrop({ onFile, currentSrc, onClear, label = 'Upload', sub = 'Any format', height = 100, accept = 'image/*' }: {
  onFile: (url: string) => void; currentSrc?: string; onClear?: () => void; label?: string; sub?: string; height?: number; accept?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onFile(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div className="drag-zone" style={{ minHeight: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: currentSrc ? '0' : '16px' }}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onDragOver={e => e.preventDefault()}
      onClick={() => !currentSrc && ref.current?.click()}>
      <input ref={ref} type="file" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {currentSrc ? (
        <div style={{ width: '100%', position: 'relative' }}>
          {accept.includes('video') ? (
            <video src={currentSrc} style={{ width: '100%', maxHeight: '200px', display: 'block' }} controls />
          ) : (
            <img src={currentSrc} alt="upload" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '5px' }}>
            <button onClick={e => { e.stopPropagation(); ref.current?.click() }} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'var(--cyan)', fontSize: '10px', cursor: 'pointer' }}>Replace</button>
            {onClear && <button onClick={e => { e.stopPropagation(); onClear() }} className="del-btn" style={{ padding: '3px 8px' }}>Clear</button>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>📁</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu2)' }}>{sub}</div>
        </div>
      )}
    </div>
  )
}

// ── ACCESS LOCK SYSTEM ────────────────────────────────────────
function AccessLockScreen({ onRequestAccess }: { onRequestAccess: () => void }) {
  return (
    <div className="locked-overlay">
      <div style={{ maxWidth: '480px', width: '90%', background: 'var(--s1)', border: '0.5px solid rgba(255,230,0,0.3)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--yellow)', marginBottom: '8px' }}>Vault Access Required</div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '24px' }}>
          To maintain access to the Baddie Content Vault, you must submit a minimum of <strong style={{ color: 'var(--cyan)' }}>2 completed videos</strong> with full step-by-step breakdowns.
        </div>
        <div style={{ background: 'var(--yg)', border: '0.5px solid var(--yb)', borderRadius: '10px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', color: 'var(--yellow)', fontWeight: 600, marginBottom: '8px' }}>To regain access:</div>
          {['Submit 2 videos with complete scene breakdowns', 'Include prompts, tools used, and workflow steps', 'Videos will be reviewed by Envi Lee', 'Access granted after approval'].map(step => (
            <div key={step} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', color: 'var(--w2)' }}>
              <span style={{ color: 'var(--yellow)', flexShrink: 0 }}>✓</span>{step}
            </div>
          ))}
        </div>
        <button className="vc-btn" onClick={onRequestAccess} style={{ width: '100%', fontSize: '13px' }}>
          Submit Videos to Regain Access ↗
        </button>
      </div>
    </div>
  )
}

// ── PAYWALL GATE ──────────────────────────────────────────────
function VaultPaywallGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    async function check() {
      if (!user) { setHasAccess(false); return }
      try {
        const res = await fetch(`/api/access/vault?userId=${user.id}`)
        const data = await res.json()
        setHasAccess(data.hasAccess)
        setIsLocked(data.locked === true)
      } catch { setHasAccess(false) }
    }
    check()
  }, [user])

  if (hasAccess === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="lbar" style={{ width: '120px' }}><div className="lbar-fill" /></div>
    </div>
  )

  if (isLocked) return (
    <>
      {children}
      <AccessLockScreen onRequestAccess={() => window.location.href = '/vault?room=suite'} />
    </>
  )

  if (!hasAccess) return (
    <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
      <div style={{ background: 'var(--s1)', border: '0.5px solid rgba(0,207,255,0.2)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: 'var(--vc-grad)', padding: '3px' }} />
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,230,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Preview</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '8px' }}>
            Baddie Content <span style={{ background: 'var(--vc-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vault™</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '20px' }}>
            The Netflix of AI creator content. Watch real AI videos, get step-by-step breakdowns of exactly how they were made, and create your own.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px', textAlign: 'left' }}>
            {[
              'Pinterest layout — browse 100s of AI videos',
              'Scene-by-scene production breakdowns',
              'Every prompt, tool, and workflow revealed',
              'Build your own AI content with the pipeline',
              'AI Movies, Reality TV, Podcasts & more',
              '29+ AI creator content categories',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--w2)' }}>
                <span style={{ color: 'var(--yellow)', flexShrink: 0 }}>✦</span>{f}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: 'var(--s1)', border: '0.5px solid var(--cb)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--cyan)', marginBottom: '4px' }}>
          $47<span style={{ fontSize: '14px', color: 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>/mo</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--w2)', marginBottom: '8px' }}>Prompt Bank + Content Vault Bundle</div>
        <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '16px' }}>Envi Lee students get access FREE</div>
        <button className="vc-btn" onClick={() => window.location.href = '/api/stripe/checkout?plan=bundle'} style={{ width: '100%' }}>
          Get Access ↗
        </button>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--mu3)' }}>
          Already a student? <a href="/sign-in" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Sign in →</a>
        </div>
      </div>
    </div>
  )

  return <>{children}</>
}

// ── VIDEO CARD (Pinterest style) ──────────────────────────────
function VideoCard({ post, onClick }: { post: VideoPost; onClick: () => void }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="video-card" onClick={onClick}>
      {/* Thumbnail */}
      <div style={{ background: 'linear-gradient(135deg, #061520, #0a2030)', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {post.thumbnail ? (
          <img src={post.thumbnail} alt={post.title} style={{ width: '100%', display: 'block' }} />
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.3 }}>
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>⊳</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>No thumbnail</div>
          </div>
        )}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
          <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(0,0,0,0.8)', color: 'var(--yellow)', border: '0.5px solid rgba(255,230,0,0.3)', borderRadius: '20px', fontFamily: "'DM Mono',monospace" }}>{post.category}</span>
        </div>
        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
          <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(0,0,0,0.8)', color: 'var(--cyan)', borderRadius: '20px', fontFamily: "'DM Mono',monospace" }}>{post.difficulty}</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)' }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,230,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#000' }}>⊳</div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px', lineHeight: '1.3' }}>{post.title}</div>
        <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '8px' }}>by {post.creatorName}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '8px' }}>
          {post.tools.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: '9px', padding: '2px 7px', background: 'var(--cg)', border: '0.5px solid var(--cb)', borderRadius: '4px', color: 'var(--cyan)', fontFamily: "'DM Mono',monospace" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={e => { e.stopPropagation(); setLiked(!liked) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: liked ? 'var(--yellow)' : 'var(--mu3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              ♥ {post.likes + (liked ? 1 : 0)}
            </button>
            <button onClick={e => { e.stopPropagation(); setSaved(!saved) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: saved ? 'var(--cyan)' : 'var(--mu3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              ◈ {post.saves + (saved ? 1 : 0)}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '10px', color: s <= post.rating ? 'var(--yellow)' : 'var(--mu2)' }}>★</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── VIDEO DETAIL ROOM ─────────────────────────────────────────
function VideoDetailRoom({ post, onBack, onOpenInSuite }: { post: VideoPost; onBack: () => void; onOpenInSuite: () => void }) {
  const [activeScene, setActiveScene] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<string[]>([])
  const [rating, setRating] = useState(0)

  return (
    <div className="pg-in">
      <button onClick={onBack} className="ghost-c" style={{ marginBottom: '20px' }}>← Back to Vault</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* LEFT */}
        <div>
          {/* Video player */}
          <div style={{ background: 'var(--bg3)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '0.5px solid rgba(0,207,255,0.15)', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {post.videoUrl ? (
              <video src={post.videoUrl} controls style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.3 }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>⊳</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Video preview</div>
              </div>
            )}
          </div>

          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>{post.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '16px' }}>by {post.creatorName} · {post.category} · {post.difficulty}</div>

          {/* Elite Features button */}
          <button className="vc-btn" onClick={onOpenInSuite} style={{ marginBottom: '20px', fontSize: '12px', padding: '9px 18px' }}>
            ✦ Open Full Pipeline in My Suite →
          </button>

          {/* Scene breakdown */}
          <div className="card hi" style={{ marginBottom: '20px' }}>
            <div className="ftitle">Scene-by-Scene Breakdown</div>
            {post.scenes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: '12px', color: 'var(--mu3)' }}>No scenes added</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
                  {post.scenes.map((_, i) => (
                    <button key={i} className={`tab-pill ${activeScene === i ? 'on' : 'off'}`} style={{ fontSize: '10px', padding: '5px 12px' }} onClick={() => setActiveScene(i)}>
                      Scene {i + 1}
                    </button>
                  ))}
                </div>
                {post.scenes[activeScene] && (
                  <div className="scene-card">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        {post.scenes[activeScene].referenceImage && (
                          <div style={{ marginBottom: '12px' }}>
                            <div className="flabel">Reference Image</div>
                            <img src={post.scenes[activeScene].referenceImage} alt="ref" style={{ width: '100%', borderRadius: '8px' }} />
                          </div>
                        )}
                        <div style={{ marginBottom: '10px' }}>
                          <div className="flabel">Camera Angle</div>
                          <div style={{ fontSize: '12px', color: 'var(--cyan)' }}>{post.scenes[activeScene].cameraAngle}</div>
                        </div>
                        {post.scenes[activeScene].voiceUsed && (
                          <div>
                            <div className="flabel">Voice Used</div>
                            <div style={{ fontSize: '12px', color: 'var(--w2)' }}>{post.scenes[activeScene].voiceUsed}</div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <div className="flabel">Still Photo Prompt</div>
                          <div style={{ background: 'var(--bg3)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--w2)', lineHeight: '1.6' }}>{post.scenes[activeScene].stillPrompt || '—'}</div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div className="flabel">Video Clip Prompt</div>
                          <div style={{ background: 'var(--bg3)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: 'var(--w2)', lineHeight: '1.6' }}>{post.scenes[activeScene].videoPrompt || '—'}</div>
                        </div>
                        {post.scenes[activeScene].notes && (
                          <div>
                            <div className="flabel">Notes</div>
                            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{post.scenes[activeScene].notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Workflow */}
          <div className="card hi" style={{ marginBottom: '20px' }}>
            <div className="ftitle">Full Workflow & Steps</div>
            <div style={{ fontSize: '13px', color: 'var(--w2)', lineHeight: '1.85', whiteSpace: 'pre-wrap' }}>{post.workflow || 'No workflow documented'}</div>
          </div>

          {/* Community */}
          <div className="card">
            <div className="ftitle">Community</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: s <= rating ? 'var(--yellow)' : 'var(--mu2)' }}>★</button>
              ))}
              {rating > 0 && <span style={{ fontSize: '12px', color: 'var(--mu3)', alignSelf: 'center' }}>Your rating saved ✓</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input className="finp" placeholder="Leave a comment…" value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && comment.trim() && (setComments(c => [...c, comment]), setComment(''))} />
              <button className="vc-btn" onClick={() => { if (comment.trim()) { setComments(c => [...c, comment]); setComment('') } }} style={{ fontSize: '12px', padding: '9px 14px' }}>Post</button>
            </div>
            {comments.map((c, i) => (
              <div key={i} style={{ padding: '9px 12px', background: 'var(--bg3)', borderRadius: '8px', fontSize: '12px', color: 'var(--w2)', marginBottom: '6px' }}>{c}</div>
            ))}
          </div>
        </div>

        {/* RIGHT sidebar */}
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Tools Used</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {post.tools.map(t => (
                <div key={t} style={{ padding: '7px 12px', background: 'var(--bg3)', border: '0.5px solid var(--cb)', borderRadius: '7px', fontSize: '12px', color: 'var(--cyan)' }}>{t}</div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Project Details</div>
            {[
              ['Category', post.category],
              ['Difficulty', post.difficulty],
              ['Scenes', String(post.scenes.length)],
              ['Creator', post.creatorName],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid rgba(0,207,255,0.08)', fontSize: '12px' }}>
                <span style={{ color: 'var(--mu3)' }}>{label}</span>
                <span style={{ color: 'var(--w2)' }}>{value}</span>
              </div>
            ))}
            {post.voiceUsed && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid rgba(0,207,255,0.08)', fontSize: '12px' }}>
                <span style={{ color: 'var(--mu3)' }}>Voice</span>
                <span style={{ color: 'var(--w2)' }}>{post.voiceUsed}</span>
              </div>
            )}
            {post.musicUsed && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '12px' }}>
                <span style={{ color: 'var(--mu3)' }}>Music</span>
                <span style={{ color: 'var(--w2)' }}>{post.musicUsed}</span>
              </div>
            )}
          </div>

          <div className="card yellow">
            <div className="ftitle-y">Description</div>
            <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7' }}>{post.description}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── STUDENT VIDEO EDITOR ──────────────────────────────────────
function StudentVideoEditor({ pipeline, onSubmit }: { pipeline?: VideoPost | null; onSubmit: (post: VideoPost) => void }) {
  const { user } = useUser()
  const [step, setStep] = useState<'edit' | 'preview' | 'confirm'>('edit')
  const [title, setTitle] = useState(pipeline?.title || '')
  const [description, setDescription] = useState(pipeline?.description || '')
  const [category, setCategory] = useState(pipeline?.category || 'Luxury Lifestyle')
  const [difficulty, setDifficulty] = useState(pipeline?.difficulty || 'Beginner')
  const [workflow, setWorkflow] = useState(pipeline?.workflow || '')
  const [tools, setTools] = useState<string[]>(pipeline?.tools || [])
  const [voiceUsed, setVoiceUsed] = useState(pipeline?.voiceUsed || '')
  const [musicUsed, setMusicUsed] = useState(pipeline?.musicUsed || '')
  const [thumbnail, setThumbnail] = useState(pipeline?.thumbnail || '')
  const [videoSrc, setVideoSrc] = useState(pipeline?.videoUrl || '')
  const [scenes, setScenes] = useState<Scene[]>(pipeline?.scenes || [{ id: '1', stillPrompt: '', videoPrompt: '', cameraAngle: 'Wide Shot' }])
  const [submitting, setSubmitting] = useState(false)

  function addScene() {
    setScenes(s => [...s, { id: Date.now().toString(), stillPrompt: '', videoPrompt: '', cameraAngle: 'Wide Shot' }])
  }

  function updateScene(id: string, key: keyof Scene, value: string) {
    setScenes(s => s.map(sc => sc.id === id ? { ...sc, [key]: value } : sc))
  }

  function removeScene(id: string) {
    if (scenes.length <= 1) return
    setScenes(s => s.filter(sc => sc.id !== id))
  }

  function toggleTool(tool: string) {
    setTools(t => t.includes(tool) ? t.filter(x => x !== tool) : [...t, tool])
  }

  async function handleSubmit() {
    if (!title.trim()) { alert('Please add a title'); return }
    if (!workflow.trim()) { alert('Please document your workflow'); return }
    if (tools.length === 0) { alert('Please select at least one tool used'); return }

    setSubmitting(true)
    const post: VideoPost = {
      id: Date.now().toString(),
      title, description, category, difficulty, workflow, tools,
      voiceUsed, musicUsed,
      thumbnail, videoUrl: videoSrc,
      scenes,
      creatorName: user?.firstName || 'Creator',
      creatorId: user?.id || '',
      likes: 0, saves: 0, comments: 0, rating: 0,
      createdAt: new Date().toISOString(),
      approved: false,
    }

    // Save to pending
    const pending = JSON.parse(localStorage.getItem('pendingVideos') || '[]')
    pending.unshift(post)
    localStorage.setItem('pendingVideos', JSON.stringify(pending))

    // Track student submission count
    const count = parseInt(localStorage.getItem(`submitCount_${user?.id}`) || '0') + 1
    localStorage.setItem(`submitCount_${user?.id}`, String(count))

    onSubmit(post)
    setSubmitting(false)
  }

  if (step === 'preview') return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Preview Your <span style={{ color: 'var(--yellow)' }}>Video</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Watch your video before submitting. Make any final edits if needed.</div>
      <div style={{ background: 'var(--bg3)', borderRadius: '12px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '20px', border: '0.5px solid rgba(0,207,255,0.15)' }}>
        {videoSrc ? <video src={videoSrc} controls autoPlay style={{ width: '100%', display: 'block', borderRadius: '12px' }} /> : (
          <div style={{ textAlign: 'center', opacity: 0.4 }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⊳</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>No video uploaded yet</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="ghost-c" onClick={() => setStep('edit')}>← Edit</button>
        <button className="vc-btn" onClick={() => setStep('confirm')} style={{ flex: 1, fontSize: '13px' }}>Looks Good — Continue to Submit ↗</button>
      </div>
    </div>
  )

  if (step === 'confirm') return (
    <div className="pg-in">
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ background: 'var(--yg)', border: '0.5px solid var(--yb)', borderRadius: '14px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--yellow)', marginBottom: '8px' }}>Ready to Submit?</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7' }}>
            Once submitted your video goes to the main page after Envi Lee approves it. <strong style={{ color: 'var(--w)' }}>You cannot keep it private.</strong> All vault submissions are public.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ghost-c" onClick={() => setStep('preview')} style={{ flex: 1 }}>← Go Back</button>
          <button className="vc-btn" onClick={handleSubmit} disabled={submitting} style={{ flex: 2, fontSize: '13px' }}>
            {submitting ? 'Submitting…' : '✦ Submit to Main Vault ↗'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        My Content <span style={{ color: 'var(--yellow)' }}>Editor</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Document every step of how you made your content. The more detail, the more valuable it is to other creators.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          {/* Basic info */}
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Project Details</div>
            <F label="Title"><input className="finp" placeholder="e.g. My Luxury Lifestyle Reel" value={title} onChange={e => setTitle(e.target.value)} /></F>
            <F label="Description"><textarea className="fta" placeholder="Describe your project..." value={description} onChange={e => setDescription(e.target.value)} /></F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <F label="Category">
                <select className="fsel" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Difficulty">
                <select className="fsel" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
                </select>
              </F>
            </div>
            <F label="Voice used (optional)"><input className="finp" placeholder="e.g. ElevenLabs — Rachel voice" value={voiceUsed} onChange={e => setVoiceUsed(e.target.value)} /></F>
            <F label="Music used (optional)"><input className="finp" placeholder="e.g. No music / Artist name — Song title" value={musicUsed} onChange={e => setMusicUsed(e.target.value)} /></F>
          </div>

          {/* Media */}
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Upload Your Work</div>
            <F label="Thumbnail">
              <DragDrop label="Upload thumbnail" sub="JPG, PNG" currentSrc={thumbnail || undefined} onFile={setThumbnail} onClear={() => setThumbnail('')} height={100} />
            </F>
            <F label="Video file">
              <DragDrop label="Upload your finished video" sub="MP4, MOV" currentSrc={videoSrc || undefined} onFile={setVideoSrc} onClear={() => setVideoSrc('')} height={100} accept="video/*" />
            </F>
          </div>

          {/* Tools */}
          <div className="card hi">
            <div className="ftitle">Tools Used</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
              {AI_TOOLS.map(t => (
                <button key={t} onClick={() => toggleTool(t)}
                  style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', border: `0.5px solid ${tools.includes(t) ? 'var(--cb)' : 'rgba(0,207,255,0.1)'}`, background: tools.includes(t) ? 'var(--cg)' : 'var(--s2)', color: tools.includes(t) ? 'var(--cyan)' : 'var(--mu3)' }}>
                  {tools.includes(t) ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Workflow */}
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Step-by-Step Workflow</div>
            <textarea className="fta" style={{ minHeight: '160px' }}
              placeholder="Document every step you took to create this content. Be specific:&#10;&#10;Step 1: Generated base image in Midjourney with prompt...&#10;Step 2: Upscaled in...&#10;Step 3: Animated using Kling AI...&#10;Step 4: Added voice in ElevenLabs..."
              value={workflow} onChange={e => setWorkflow(e.target.value)} />
          </div>

          {/* Scenes */}
          <div className="card hi">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,207,255,0.12)' }}>
              <div className="ftitle" style={{ margin: 0, padding: 0, border: 'none' }}>Scene Breakdown</div>
              <button className="ghost-c" onClick={addScene} style={{ fontSize: '11px', padding: '5px 10px' }}>+ Add Scene</button>
            </div>
            {scenes.map((scene, i) => (
              <div key={scene.id} className="scene-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan)', fontFamily: "'DM Mono',monospace" }}>SCENE {i + 1}</div>
                  {scenes.length > 1 && <button className="del-btn" onClick={() => removeScene(scene.id)} style={{ fontSize: '10px', padding: '2px 8px' }}>✕</button>}
                </div>
                <F label="Still photo prompt">
                  <textarea className="fta" style={{ minHeight: '60px' }} placeholder="The exact prompt you used to generate the still image for this scene..." value={scene.stillPrompt} onChange={e => updateScene(scene.id, 'stillPrompt', e.target.value)} />
                </F>
                <F label="Video clip prompt">
                  <textarea className="fta" style={{ minHeight: '60px' }} placeholder="The prompt you used to animate this scene (Kling, Veo, Runway, etc)..." value={scene.videoPrompt} onChange={e => updateScene(scene.id, 'videoPrompt', e.target.value)} />
                </F>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <F label="Camera angle">
                    <select className="fsel" value={scene.cameraAngle} onChange={e => updateScene(scene.id, 'cameraAngle', e.target.value)}>
                      {CAMERA_ANGLES.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </F>
                  <F label="Voice used (optional)">
                    <input className="finp" placeholder="ElevenLabs voice ID or name" value={scene.voiceUsed || ''} onChange={e => updateScene(scene.id, 'voiceUsed', e.target.value)} />
                  </F>
                </div>
                <F label="Notes (optional)">
                  <input className="finp" placeholder="Any extra notes about this scene..." value={scene.notes || ''} onChange={e => updateScene(scene.id, 'notes', e.target.value)} />
                </F>
                <F label="Reference image (optional)">
                  <DragDrop label="Upload reference" sub="Any image used as reference for this scene" currentSrc={scene.referenceImage} onFile={url => updateScene(scene.id, 'referenceImage', url)} onClear={() => updateScene(scene.id, 'referenceImage', '')} height={80} />
                </F>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button className="vc-btn" onClick={() => setStep('preview')} style={{ flex: 1, fontSize: '13px' }}>
          Preview Video Before Submitting →
        </button>
      </div>
    </div>
  )
}

// ── STUDENT SUITE ─────────────────────────────────────────────
function StudentSuite({ pipeline, onBack }: { pipeline?: VideoPost | null; onBack: () => void }) {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'editor' | 'mywork'>('pipeline')
  const [submitted, setSubmitted] = useState(false)
  const [myWork, setMyWork] = useState<VideoPost[]>([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('pendingVideos') || '[]')
    setMyWork(saved.filter((p: VideoPost) => p.creatorId === user?.id))
  }, [user?.id])

  function handleSubmit(post: VideoPost) {
    setSubmitted(true)
    setMyWork(w => [post, ...w])
    setTimeout(() => { setSubmitted(false); setActiveTab('mywork') }, 2000)
  }

  return (
    <div className="pg-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onBack} className="ghost-c" style={{ fontSize: '11px' }}>← Main Vault</button>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--w)' }}>
          My <span style={{ color: 'var(--yellow)' }}>Private Suite</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          ['pipeline', '✦ Elite Pipeline'],
          ['editor', '◈ Content Editor'],
          ['mywork', '⊹ My Submissions'],
        ].map(([id, label]) => (
          <button key={id} className={`tab-pill ${activeTab === id ? 'on' : 'off'}`} onClick={() => setActiveTab(id as 'pipeline' | 'editor' | 'mywork')}>{label}</button>
        ))}
      </div>

      {submitted && (
        <div style={{ background: 'rgba(0,255,136,0.08)', border: '0.5px solid rgba(0,255,136,0.3)', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', fontSize: '13px', color: '#00ff88', fontFamily: "'DM Mono',monospace" }}>
          ✓ Submitted! Envi Lee will review and approve your video.
        </div>
      )}

      {activeTab === 'pipeline' && pipeline && (
        <div>
          <div style={{ background: 'var(--yg)', border: '0.5px solid var(--yb)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: 'var(--yellow)' }}>
            ✦ Full production pipeline from: <strong>{pipeline.title}</strong> — use this to recreate with your own AI twin
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { title: 'Scripts & Dialogue', content: pipeline.workflow?.slice(0, 200) + '…' },
              { title: 'Scene Prompts', content: pipeline.scenes.map((s, i) => `Scene ${i+1}: ${s.stillPrompt}`).join('\n') },
              { title: 'Video Prompts', content: pipeline.scenes.map((s, i) => `Scene ${i+1}: ${s.videoPrompt}`).join('\n') },
              { title: 'Tools Pipeline', content: pipeline.tools.join(' → ') },
              { title: 'Camera Directions', content: pipeline.scenes.map((s, i) => `Scene ${i+1}: ${s.cameraAngle}`).join('\n') },
              { title: 'Voice & Audio', content: `Voice: ${pipeline.voiceUsed || 'Not specified'}\nMusic: ${pipeline.musicUsed || 'Not specified'}` },
            ].map(item => (
              <div key={item.title} className="card hi">
                <div className="ftitle">{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{item.content || 'No data'}</div>
                <button onClick={() => navigator.clipboard?.writeText(item.content || '')} className="ghost-c" style={{ marginTop: '10px', fontSize: '10px', padding: '4px 10px' }}>Copy</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px' }}>
            <button className="vc-btn" onClick={() => setActiveTab('editor')} style={{ fontSize: '13px', padding: '12px 24px' }}>
              Use This Pipeline in My Editor ↗
            </button>
          </div>
        </div>
      )}

      {activeTab === 'pipeline' && !pipeline && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
          <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>✦</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No pipeline loaded</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Go to the main vault, click a video, then click Open in My Suite</div>
        </div>
      )}

      {activeTab === 'editor' && <StudentVideoEditor pipeline={pipeline} onSubmit={handleSubmit} />}

      {activeTab === 'mywork' && (
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--w)', marginBottom: '16px' }}>My Submissions</div>
          {myWork.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>◌</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No submissions yet</div>
              <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Submit 2 videos to maintain vault access</div>
            </div>
          ) : (
            myWork.map(post => (
              <div key={post.id} className="card" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yellow)', marginBottom: '2px' }}>{post.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{post.category} · {new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: post.approved ? 'rgba(0,255,136,0.1)' : 'rgba(255,230,0,0.1)', color: post.approved ? '#00ff88' : 'var(--yellow)', border: `0.5px solid ${post.approved ? 'rgba(0,255,136,0.3)' : 'rgba(255,230,0,0.3)'}`, fontFamily: "'DM Mono',monospace" }}>
                  {post.approved ? '✓ Live' : '⏳ Pending'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── ADMIN ROOM ────────────────────────────────────────────────
function AdminRoom() {
  const { user } = useUser()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === adminId
  const [pending, setPending] = useState<VideoPost[]>([])
  const [approved, setApproved] = useState<VideoPost[]>([])
  const [categories, setCategories] = useState(CATEGORIES)
  const [newCat, setNewCat] = useState('')
  const [uploading, setUploading] = useState(false)
  const [newPost, setNewPost] = useState<Partial<VideoPost>>({})

  useEffect(() => {
    setPending(JSON.parse(localStorage.getItem('pendingVideos') || '[]'))
    setApproved(JSON.parse(localStorage.getItem('approvedVideos') || '[]'))
  }, [])

  function approve(post: VideoPost) {
    const updatedPending = pending.filter(p => p.id !== post.id)
    const updatedApproved = [{ ...post, approved: true }, ...approved]
    setPending(updatedPending); setApproved(updatedApproved)
    localStorage.setItem('pendingVideos', JSON.stringify(updatedPending))
    localStorage.setItem('approvedVideos', JSON.stringify(updatedApproved))
  }

  function reject(id: string) {
    const updated = pending.filter(p => p.id !== id)
    setPending(updated); localStorage.setItem('pendingVideos', JSON.stringify(updated))
  }

  function removeApproved(id: string) {
    const updated = approved.filter(p => p.id !== id)
    setApproved(updated); localStorage.setItem('approvedVideos', JSON.stringify(updated))
  }

  function addCategory() {
    if (!newCat.trim()) return
    setCategories(c => [...c, newCat.trim()]); setNewCat('')
  }

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔒</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cyan)' }}>Admin Access Only</div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '24px' }}>
        Vault <span style={{ color: 'var(--yellow)' }}>Admin</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Pending Review', value: String(pending.length), color: 'var(--yellow)' },
          { label: 'Live Videos', value: String(approved.length), color: '#00ff88' },
          { label: 'Categories', value: String(categories.length), color: 'var(--cyan)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.6px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          {/* Pending */}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--yellow)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Pending Review — {pending.length}
          </div>
          {pending.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
              <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>No pending submissions</div>
            </div>
          ) : pending.map(post => (
            <div key={post.id} className="card hi" style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--yellow)', marginBottom: '3px' }}>{post.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '10px' }}>by {post.creatorName} · {post.category} · {new Date(post.createdAt).toLocaleDateString()}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="vc-btn" onClick={() => approve(post)} style={{ fontSize: '11px', padding: '7px 14px' }}>✓ Approve</button>
                <button className="del-btn" onClick={() => reject(post.id)} style={{ fontSize: '11px', padding: '7px 14px' }}>✕ Reject</button>
              </div>
            </div>
          ))}

          {/* Add category */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="ftitle">Add Category</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="finp" placeholder="New category name" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
              <button className="vc-btn" onClick={addCategory} style={{ fontSize: '12px', padding: '9px 14px' }}>Add</button>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap' as const, gap: '5px' }}>
              {categories.map(c => (
                <span key={c} style={{ fontSize: '10px', padding: '3px 10px', background: 'var(--cg)', border: '0.5px solid var(--cb)', borderRadius: '20px', color: 'var(--cyan)', fontFamily: "'DM Mono',monospace" }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Approved */}
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Live — {approved.length}
          </div>
          {approved.slice(0, 10).map(post => (
            <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--s1)', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '10px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--w)' }}>{post.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{post.creatorName} · {post.category}</div>
              </div>
              <button className="del-btn" onClick={() => removeApproved(post.id)} style={{ fontSize: '10px' }}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ContentVaultPage() {
  const { user } = useUser()
  const router = useRouter()
  const [room, setRoom] = useState<VaultRoom>('main')
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedPost, setSelectedPost] = useState<VideoPost | null>(null)
  const [suitePipeline, setSuitePipeline] = useState<VideoPost | null>(null)
  const [botOpen, setBotOpen] = useState(false)
  const [botMessages, setBotMessages] = useState([{ role: 'bot', text: "I'm your Content Vault AI! Ask me for content ideas, help planning your AI video, scene direction, tool recommendations, or anything about creating AI content." }])
  const [botInput, setBotInput] = useState('')
  const [botLoading, setBotLoading] = useState(false)
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === adminId

  const [posts, setPosts] = useState<VideoPost[]>([])
  useEffect(() => {
    const approved = JSON.parse(localStorage.getItem('approvedVideos') || '[]')
    if (approved.length === 0) {
      // Sample posts
      const samples: VideoPost[] = [
        { id: '1', title: 'Luxury Lifestyle Day Vlog', description: 'A full day in my luxury AI life', category: 'Luxury Lifestyle', difficulty: 'Intermediate', tools: ['Google Flow', 'Kling AI', 'ElevenLabs'], workflow: 'Step 1: Generated character in Flow with consistent face...\nStep 2: Created 6 scenes using Kling AI...', scenes: [{ id: 's1', stillPrompt: 'Black woman in luxury penthouse, designer outfit, golden hour', videoPrompt: 'Slow dolly forward, Black woman looking out at city', cameraAngle: 'Dolly Movement', notes: 'Keep lighting warm' }], voiceUsed: 'ElevenLabs Rachel', musicUsed: 'Lo-fi luxury beats', creatorName: 'Nova Star', creatorId: '1', likes: 48, saves: 23, comments: 12, rating: 5, thumbnail: '', videoUrl: '', createdAt: new Date().toISOString(), approved: true },
        { id: '2', title: 'CEO Baddie Morning Routine', description: 'How a boss starts her day', category: 'CEO Baddie', difficulty: 'Beginner', tools: ['Midjourney', 'Runway', 'CapCut'], workflow: 'Step 1: Created base images in Midjourney...', scenes: [{ id: 's2', stillPrompt: 'Black woman CEO in luxury office, power suit', videoPrompt: 'Pan right slowly, morning light', cameraAngle: 'Pan Right' }], creatorName: 'Luxe B', creatorId: '2', likes: 62, saves: 31, comments: 8, rating: 4, thumbnail: '', videoUrl: '', createdAt: new Date().toISOString(), approved: true },
        { id: '3', title: 'AI Reality Show Episode 1', description: 'First episode of Baddie House', category: 'AI Reality Shows', difficulty: 'Expert', tools: ['Google Flow', 'Higgsfield', 'Sync.so', 'ElevenLabs', 'CapCut'], workflow: 'This was a 12-scene production...', scenes: [{ id: 's3', stillPrompt: 'Two Black women AI influencers in luxury mansion', videoPrompt: 'Wide establishing shot, house reveal', cameraAngle: 'Wide Shot' }], creatorName: 'EmpireCreator', creatorId: '3', likes: 124, saves: 67, comments: 34, rating: 5, thumbnail: '', videoUrl: '', createdAt: new Date().toISOString(), approved: true },
      ]
      setPosts(samples)
    } else {
      setPosts(approved)
    }
  }, [])

  const filtered = selectedCat === 'All' ? posts : posts.filter(p => p.category === selectedCat)

  function openDetail(post: VideoPost) { setSelectedPost(post); setRoom('detail') }
  function openInSuite(post: VideoPost) { setSuitePipeline(post); setRoom('suite') }

  async function sendBot() {
    if (!botInput.trim()) return
    const msg = botInput.trim(); setBotInput('')
    setBotMessages(m => [...m, { role: 'user', text: msg }])
    setBotLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are the Baddie Content Vault AI for Envi Lee Creator Studios. Help AI video creators with: content ideas, AI video production workflows, scene direction, camera angles, tool recommendations (Kling, Flow, Higgsfield, Runway, ElevenLabs, CapCut), prompt writing, editing tips, and how to create realistic AI content. Be specific and inspiring. Question: ${msg}` })
      setBotMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setBotMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setBotLoading(false)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <VaultPaywallGate>
          <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '220px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(0,207,255,0.1)', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(0,207,255,0.1)' }}>
                <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
                </button>
                <div style={{ padding: '12px', background: 'rgba(255,230,0,0.06)', border: '0.5px solid rgba(255,230,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'var(--vc-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800 }}>Baddie Content</div>
                  <div style={{ background: 'var(--vc-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800 }}>Vault™</div>
                  <div style={{ fontSize: '9px', color: 'rgba(0,207,255,0.5)', fontFamily: "'DM Mono',monospace", marginTop: '2px' }}>ENVI LEE</div>
                </div>
              </div>

              {user && (
                <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(0,207,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,230,0,0.06)', borderRadius: '8px', border: '0.5px solid rgba(255,230,0,0.2)' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Creator'}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,230,0,0.5)', fontFamily: "'DM Mono',monospace" }}>{isAdmin ? 'Admin' : 'Member'}</div>
                    </div>
                    <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 10px', flex: 1 }}>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 10px', fontFamily: "'DM Mono',monospace" }}>Vault Rooms</div>
                {[
                  { id: 'main', label: '⊳ Main Vault', desc: 'Browse all content' },
                  { id: 'suite', label: '◈ My Suite', desc: 'Private editor' },
                  ...(isAdmin ? [{ id: 'admin', label: '⊗ Admin', desc: 'Manage content' }] : []),
                ].map(r => (
                  <button key={r.id} onClick={() => setRoom(r.id as VaultRoom)}
                    style={{ display: 'flex', flexDirection: 'column' as const, padding: '9px 10px', borderRadius: '9px', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', marginBottom: '4px', border: `0.5px solid ${room === r.id ? 'rgba(255,230,0,0.3)' : 'transparent'}`, background: room === r.id ? 'rgba(255,230,0,0.06)' : 'none' }}>
                    <span style={{ fontSize: '12px', color: room === r.id ? 'var(--yellow)' : 'var(--mu3)', fontWeight: room === r.id ? 600 : 400 }}>{r.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--mu2)', marginTop: '2px', fontFamily: "'DM Mono',monospace" }}>{r.desc}</span>
                  </button>
                ))}

                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Categories</div>
                  {['All', ...CATEGORIES].map(cat => (
                    <button key={cat} onClick={() => { setSelectedCat(cat); setRoom('main') }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '4px 8px', borderRadius: '5px', border: 'none', background: selectedCat === cat ? 'rgba(255,230,0,0.06)' : 'none', color: selectedCat === cat ? 'var(--yellow)' : 'var(--mu3)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif', marginBottom: '1px", transition: 'all .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--w)')}
                      onMouseLeave={e => (e.currentTarget.style.color = selectedCat === cat ? 'var(--yellow)' : 'var(--mu3)')}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* MAIN */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'radial-gradient(ellipse at 80% 0%, rgba(255,230,0,0.04) 0%, transparent 50%)' }}>
              {room === 'main' && (
                <div className="pg-in">
                  {/* Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,230,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {selectedCat === 'All' ? 'All Categories' : selectedCat}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)' }}>
                      Baddie Content <span style={{ background: 'var(--vc-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vault™</span>
                    </div>
                  </div>

                  {/* Category pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '24px' }}>
                    <button className={`cat-pill ${selectedCat === 'All' ? 'on' : 'off'}`} onClick={() => setSelectedCat('All')}>All</button>
                    {CATEGORIES.map(cat => (
                      <button key={cat} className={`cat-pill ${selectedCat === cat ? 'on' : 'off'}`} onClick={() => setSelectedCat(cat)}>{cat}</button>
                    ))}
                  </div>

                  {/* Pinterest grid */}
                  <div style={{ columns: '3', gap: '14px' }}>
                    {filtered.map(post => (
                      <VideoCard key={post.id} post={post} onClick={() => openDetail(post)} />
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⊳</div>
                      <div style={{ fontSize: '14px', color: 'var(--mu3)' }}>No videos in this category yet</div>
                      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginTop: '4px' }}>Be the first to submit in {selectedCat}!</div>
                    </div>
                  )}
                </div>
              )}

              {room === 'detail' && selectedPost && (
                <VideoDetailRoom
                  post={selectedPost}
                  onBack={() => setRoom('main')}
                  onOpenInSuite={() => openInSuite(selectedPost)}
                />
              )}

              {room === 'suite' && (
                <StudentSuite pipeline={suitePipeline} onBack={() => setRoom('main')} />
              )}

              {room === 'admin' && <AdminRoom />}
            </main>

            {/* BOT */}
            <button onClick={() => setBotOpen(!botOpen)}
              style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--vc-grad)', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,230,0,0.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {botOpen ? '✕' : '⊳'}
            </button>
            {botOpen && (
              <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '360px', background: 'var(--bg2)', border: '0.5px solid rgba(255,230,0,0.25)', borderRadius: '16px', boxShadow: '0 0 40px rgba(0,207,255,0.1)', zIndex: 200, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: 'rgba(255,230,0,0.06)', borderBottom: '0.5px solid rgba(255,230,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--yellow)', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                    <span className="vc-dot" />Content AI
                  </div>
                  <button onClick={() => setBotOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
                <div style={{ height: '300px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  {botMessages.map((m, i) => (
                    <div key={i} style={{ maxWidth: '90%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(255,230,0,0.08)' : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? 'rgba(255,230,0,0.25)' : 'rgba(0,207,255,0.1)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
                  ))}
                  {botLoading && <div style={{ fontSize: '12px', color: 'var(--yellow)', alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px' }}>thinking…</div>}
                </div>
                <div style={{ padding: '12px', borderTop: '0.5px solid rgba(0,207,255,0.1)', display: 'flex', gap: '8px' }}>
                  <input style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid rgba(0,207,255,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask for content help…" value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendBot()} />
                  <button onClick={sendBot} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'var(--vc-grad)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
                </div>
              </div>
            )}
          </div>
        </VaultPaywallGate>
      </SignedIn>
    </>
  )
}
