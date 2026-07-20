'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type SparkleRoom = 'globe' | 'world' | 'suite' | 'patterns' | 'workshops' | 'vision' | 'admin'

interface SparkleWorld {
  id: string; name: string; icon: string; color: string
  desc: string; tutorials: Tutorial[]; posts: Post[]
  position: { x: number; y: number } // position on globe
}

interface Tutorial {
  id: string; title: string; worldId: string
  videoUrl: string; thumbnail: string; duration: string
  steps: string[]; supplyList: string[]; difficulty: string
  approved: boolean; uploadedBy: string; isAdmin: boolean
  createdAt: string; views: number; likes: number
}

interface Post {
  id: string; worldId: string; userId: string; userName: string
  content: string; images: string[]; videoUrl: string
  likes: number; comments: number; approved: boolean
  createdAt: string
}

interface Pattern {
  id: string; name: string; type: string; userId: string
  imageUrl: string; pdfUrl: string; isPublic: boolean
  price: number; downloads: number; createdAt: string
}

// ── DEFAULT WORLDS ─────────────────────────────────────────────
const DEFAULT_WORLDS: SparkleWorld[] = [
  { id: 'balloon', name: 'Balloon Column World', icon: '🎈', color: '#FF006E', desc: 'Master balloon columns, arches, and bouquets for every occasion', tutorials: [], posts: [], position: { x: 25, y: 35 } },
  { id: 'garden', name: 'Garden World', icon: '🌸', color: '#22C55E', desc: 'Beautiful garden crafts, floral arrangements, and nature-inspired creations', tutorials: [], posts: [], position: { x: 60, y: 25 } },
  { id: 'graduation', name: 'Graduation Day World', icon: '🎓', color: '#F9F900', desc: 'Custom graduation décor, gifts, and celebration crafts', tutorials: [], posts: [], position: { x: 75, y: 40 } },
  { id: 'lipgloss', name: 'Lip Gloss World', icon: '💄', color: '#FF69B4', desc: 'Create your own lip gloss, lip butter, and beauty products from scratch', tutorials: [], posts: [], position: { x: 40, y: 60 } },
  { id: 'baby', name: 'Baby World', icon: '👶', color: '#93C5FD', desc: 'Custom baby shower crafts, nursery décor, and precious keepsakes', tutorials: [], posts: [], position: { x: 20, y: 65 } },
  { id: 'kids', name: 'Kids World', icon: '👧', color: '#FB923C', desc: 'Fun crafts and creative projects designed for and with children', tutorials: [], posts: [], position: { x: 55, y: 70 } },
  { id: 'woodworking', name: 'Woodworking World', icon: '🪵', color: '#92400E', desc: 'Custom furniture, playhouses, signs, and wooden décor masterpieces', tutorials: [], posts: [], position: { x: 80, y: 60 } },
  { id: 'resin', name: 'Resin World', icon: '🫙', color: '#A78BFA', desc: 'Resin art, clay creations, and cement pieces for home décor and gifts', tutorials: [], posts: [], position: { x: 35, y: 45 } },
  { id: 'sewing', name: 'Sewing World', icon: '🧵', color: '#EC4899', desc: 'Custom clothing, accessories, fabric designs, and wearable art', tutorials: [], posts: [], position: { x: 65, y: 50 } },
  { id: 'pod', name: 'Print On Demand World', icon: '🖨️', color: '#06B6D4', desc: 'Personalized cups, tumblers, apparel, and custom home goods', tutorials: [], posts: [], position: { x: 45, y: 30 } },
  { id: 'diy', name: 'DIY Kit World', icon: '🧰', color: '#F59E0B', desc: 'Interactive DIY kits and step-by-step project builds for every skill level', tutorials: [], posts: [], position: { x: 15, y: 50 } },
  { id: 'magical', name: 'Magical Spaces World', icon: '✨', color: '#9B59B6', desc: 'Custom playhouses, magical rooms, and enchanted spaces for children', tutorials: [], posts: [], position: { x: 70, y: 75 } },
  { id: 'pattern', name: 'Pattern Design World', icon: '🩱', color: '#C9A0DC', desc: 'Create clothing, swimwear, tumbler, and fabric patterns — print and share', tutorials: [], posts: [], position: { x: 50, y: 55 } },
  { id: 'bouquet', name: 'Bouquet World', icon: '💐', color: '#F472B6', desc: 'Balloon bouquets, candy bouquets, and gift arrangements for every occasion', tutorials: [], posts: [], position: { x: 30, y: 75 } },
  { id: 'carpet', name: 'Carpet World', icon: '🪞', color: '#8B5CF6', desc: 'Unique custom carpet designs, rugs, and textile art tailored to your vision', tutorials: [], posts: [], position: { x: 85, y: 30 } },
]

// ── STYLES ─────────────────────────────────────────────────────
const css = `
  :root {
    --bg:#000;--bg2:#06000a;--bg3:#0d0015;--s1:#100020;--s2:#1a003a;
    --w:#fff8ff;--w2:#e8d0ff;--mu:#300060;--mu2:#5000a0;--mu3:#9060c0;
    --purple:#9B59B6;--lilac:#C9A0DC;--yellow:#F9F900;--pink:#FF006E;
    --purple2:#C084FC;--lilac2:#E9C8F8;
    --pb:rgba(155,89,182,0.4);--yb:rgba(249,249,0,0.4);--pkb:rgba(255,0,110,0.4);
    --pg:rgba(155,89,182,0.08);--yg:rgba(249,249,0,0.08);--pkg:rgba(255,0,110,0.08);
    --s-grad:linear-gradient(135deg,#9B59B6,#C9A0DC,#FF006E,#F9F900);
    --p-grad:linear-gradient(135deg,#9B59B6,#C084FC,#C9A0DC);
    --g-grad:linear-gradient(135deg,#F9F900,#FFE500);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:var(--bg);color:var(--w);font-family:'DM Sans',sans-serif;min-height:100vh;overflow-x:hidden;}
  select,input,textarea{color-scheme:dark;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#300060;border-radius:2px;}

  @keyframes lbar{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes pgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{from{transform:rotateY(0deg)}to{transform:rotateY(360deg)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes sparkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.5)}}
  @keyframes portal{0%{transform:scale(0) rotate(0deg);opacity:0}50%{transform:scale(1.5) rotate(180deg);opacity:1}100%{transform:scale(0) rotate(360deg);opacity:0}}
  @keyframes glitter{0%{opacity:0;transform:translateY(0) rotate(0deg)}50%{opacity:1}100%{opacity:0;transform:translateY(-100px) rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes worldGlow{0%,100%{box-shadow:0 0 10px currentColor}50%{box-shadow:0 0 30px currentColor,0 0 60px currentColor}}

  .pg-in{animation:pgIn .5s ease;}
  .lbar{height:2px;background:var(--s2);overflow:hidden;border-radius:1px;}
  .lbar-fill{height:100%;background:var(--s-grad);background-size:200% 100%;animation:lbar 2s linear infinite;}

  .card{background:var(--s1);border:0.5px solid rgba(155,89,182,0.2);border-radius:14px;padding:18px;}
  .card.hi{border-color:rgba(155,89,182,0.35);}
  .card.gold{border-color:rgba(249,249,0,0.3);background:var(--yg);}
  .card.pink{border-color:rgba(255,0,110,0.3);background:var(--pkg);}

  .ftitle{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;color:var(--lilac);text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px;padding-bottom:10px;border-bottom:0.5px solid rgba(155,89,182,0.15);}
  .flabel{font-size:9px;font-weight:600;color:var(--mu3);text-transform:uppercase;letter-spacing:.7px;font-family:'DM Mono',monospace;display:block;margin-bottom:5px;}
  .finp{background:var(--bg3);border:0.5px solid rgba(155,89,182,0.2);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;}
  .finp:focus{border-color:rgba(155,89,182,0.5);}
  .fsel{background:var(--bg3);border:0.5px solid rgba(155,89,182,0.2);border-radius:7px;padding:8px 10px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;}
  .fta{background:var(--bg3);border:0.5px solid rgba(155,89,182,0.2);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;resize:vertical;min-height:80px;line-height:1.6;}

  .s-btn{padding:11px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:var(--s-grad);color:#000;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 0 20px rgba(155,89,182,0.3);}
  .s-btn:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(249,249,0,0.3);}
  .s-btn:disabled{opacity:0.5;cursor:default;transform:none;}
  .ghost-s{padding:7px 14px;border-radius:8px;font-size:11px;cursor:pointer;border:0.5px solid var(--pb);background:transparent;color:var(--purple2);font-family:'DM Sans',sans-serif;transition:all .2s;}
  .ghost-s:hover{background:var(--pg);}
  .ghost-y{padding:7px 14px;border-radius:8px;font-size:11px;cursor:pointer;border:0.5px solid var(--yb);background:transparent;color:var(--yellow);font-family:'DM Sans',sans-serif;transition:all .2s;}

  .tag-s{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--pg);color:var(--purple2);border:0.5px solid var(--pb);}
  .tag-y{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--yg);color:var(--yellow);border:0.5px solid var(--yb);}
  .tag-p{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--pkg);color:var(--pink);border:0.5px solid var(--pkb);}

  /* ── GLOBE ── */
  .globe-container{position:relative;width:100%;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at center,#0d0020 0%,#000 70%);}
  .stars{position:absolute;inset:0;pointer-events:none;}
  .star{position:absolute;border-radius:50%;animation:sparkle var(--dur,2s) ease infinite var(--delay,0s);}
  .glitter-particle{position:absolute;width:4px;height:4px;border-radius:50%;pointer-events:none;animation:glitter 3s ease infinite;}

  .globe-sphere{position:relative;width:500px;height:500px;border-radius:50%;cursor:pointer;transition:transform .3s;flex-shrink:0;}
  @media(max-width:700px){.globe-sphere{width:320px;height:320px;}}
  .globe-sphere:hover{transform:scale(1.02);}

  .world-dot{position:absolute;transform:translate(-50%,-50%);cursor:pointer;transition:all .3s;z-index:10;}
  .world-dot-inner{border-radius:50%;display:flex;align-items:center;justify-content:center;animation:worldGlow 2s ease infinite;transition:all .3s;}
  .world-dot:hover .world-dot-inner{transform:scale(1.4);}
  .world-label{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-family:'DM Mono',monospace;font-weight:600;padding:3px 8px;border-radius:20px;background:rgba(0,0,0,0.85);pointer-events:none;opacity:0;transition:opacity .2s;margin-top:4px;top:100%;}
  .world-dot:hover .world-label{opacity:1;}

  .portal-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);pointer-events:none;}
  .portal-ring{border-radius:50%;border:4px solid;animation:portal 1.5s ease forwards;}

  /* ── WORLD INTERIOR ── */
  .world-header{padding:28px 28px 0;border-bottom:0.5px solid rgba(155,89,182,0.15);margin-bottom:0;}
  .world-tabs{display:flex;gap:4px;padding:0 28px;margin-top:16px;overflow-x:auto;}
  .world-tab{padding:8px 16px;border-radius:8px 8px 0 0;font-size:11px;cursor:pointer;border:0.5px solid transparent;font-family:'DM Sans',sans-serif;transition:all .2s;white-space:nowrap;}
  .world-tab.active{border-color:rgba(155,89,182,0.3);background:var(--pg);color:var(--purple2);}
  .world-tab:not(.active){color:var(--mu3);}
  .world-content{padding:28px;}

  /* ── VIDEO CARD ── */
  .video-card{background:var(--s1);border:0.5px solid rgba(155,89,182,0.15);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .25s;}
  .video-card:hover{border-color:rgba(249,249,0,0.3);transform:translateY(-3px);box-shadow:0 8px 30px rgba(155,89,182,0.15);}

  /* ── PATTERN GRID ── */
  .pattern-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;}
  .pattern-card{background:var(--s1);border:0.5px solid rgba(155,89,182,0.15);border-radius:10px;overflow:hidden;cursor:pointer;transition:all .2s;}
  .pattern-card:hover{border-color:rgba(249,249,0,0.3);transform:translateY(-2px);}
`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

// ── SPARKLE GLOBE ──────────────────────────────────────────────
function SparkleGlobe({ worlds, onEnterWorld }: { worlds: SparkleWorld[]; onEnterWorld: (w: SparkleWorld) => void }) {
  const [hoveredWorld, setHoveredWorld] = useState<string | null>(null)
  const [enteringWorld, setEnteringWorld] = useState<SparkleWorld | null>(null)
  const [portalActive, setPortalActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const rotationRef = useRef(0)

  // Draw animated globe on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const r = Math.min(W, H) / 2 - 10

      ctx.clearRect(0, 0, W, H)

      // Base sphere gradient
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r)
      grad.addColorStop(0, '#1a0040')
      grad.addColorStop(0.4, '#0d001a')
      grad.addColorStop(0.7, '#060010')
      grad.addColorStop(1, '#000')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Atmosphere glow
      const atmGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.15)
      atmGrad.addColorStop(0, 'rgba(155,89,182,0)')
      atmGrad.addColorStop(0.5, 'rgba(155,89,182,0.08)')
      atmGrad.addColorStop(1, 'rgba(201,160,220,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2)
      ctx.fillStyle = atmGrad
      ctx.fill()

      // Clip to sphere
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      // Animated continent shapes (abstract)
      rotationRef.current += 0.001
      const ro = rotationRef.current

      const continents = [
        { x: 0.3, y: 0.3, w: 0.25, h: 0.2, color: 'rgba(155,89,182,0.3)' },
        { x: 0.55, y: 0.2, w: 0.2, h: 0.25, color: 'rgba(201,160,220,0.25)' },
        { x: 0.15, y: 0.5, w: 0.15, h: 0.3, color: 'rgba(155,89,182,0.2)' },
        { x: 0.6, y: 0.55, w: 0.25, h: 0.2, color: 'rgba(249,249,0,0.08)' },
        { x: 0.35, y: 0.65, w: 0.2, h: 0.15, color: 'rgba(255,0,110,0.1)' },
        { x: 0.7, y: 0.35, w: 0.15, h: 0.18, color: 'rgba(201,160,220,0.2)' },
      ]

      continents.forEach(c => {
        const ox = Math.sin(ro + c.x * 10) * 8
        ctx.beginPath()
        ctx.ellipse(cx + (c.x - 0.5) * r * 2 + ox, cy + (c.y - 0.5) * r * 2, c.w * r, c.h * r, ro, 0, Math.PI * 2)
        ctx.fillStyle = c.color
        ctx.fill()
      })

      // Grid lines
      ctx.strokeStyle = 'rgba(155,89,182,0.1)'
      ctx.lineWidth = 0.5
      for (let lat = -80; lat <= 80; lat += 30) {
        const y = cy + (lat / 90) * r
        const w = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)))
        ctx.beginPath()
        ctx.ellipse(cx, y, w, w * 0.1, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      for (let lon = 0; lon < 180; lon += 30) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, r * Math.abs(Math.cos((lon + ro * 50) * Math.PI / 180)), r, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Highlight
      const hlGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.7)
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.08)')
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = hlGrad
      ctx.fill()

      ctx.restore()

      // Ring
      ctx.beginPath()
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(201,160,220,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  function enterWorld(world: SparkleWorld) {
    setEnteringWorld(world)
    setPortalActive(true)
    setTimeout(() => {
      setPortalActive(false)
      setEnteringWorld(null)
      onEnterWorld(world)
    }, 1800)
  }

  const size = typeof window !== 'undefined' && window.innerWidth < 700 ? 320 : 500

  return (
    <div className="globe-container">
      {/* Stars */}
      <div className="stars">
        {Array(80).fill(null).map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
            background: ['#fff', '#C9A0DC', '#F9F900', '#FF006E'][Math.floor(Math.random() * 4)],
            '--dur': `${Math.random() * 3 + 1}s`, '--delay': `${Math.random() * 3}s`,
          } as React.CSSProperties} />
        ))}
      </div>

      {/* Glitter particles */}
      {Array(20).fill(null).map((_, i) => (
        <div key={i} className="glitter-particle" style={{
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          background: ['#9B59B6', '#F9F900', '#FF006E', '#C9A0DC'][Math.floor(Math.random() * 4)],
          animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 2 + 2}s`,
        }} />
      ))}

      {/* Globe */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width={size} height={size} className="globe-sphere" />

        {/* World dots on globe */}
        {worlds.map(world => (
          <div key={world.id} className="world-dot"
            style={{ left: `${world.position.x}%`, top: `${world.position.y}%` }}
            onMouseEnter={() => setHoveredWorld(world.id)}
            onMouseLeave={() => setHoveredWorld(null)}
            onClick={() => enterWorld(world)}>
            <div className="world-dot-inner" style={{
              width: hoveredWorld === world.id ? '36px' : '28px',
              height: hoveredWorld === world.id ? '36px' : '28px',
              background: world.color,
              color: world.color,
              fontSize: hoveredWorld === world.id ? '16px' : '12px',
              boxShadow: `0 0 ${hoveredWorld === world.id ? '20px' : '10px'} ${world.color}`,
            }}>
              {world.icon}
            </div>
            <div className="world-label" style={{ color: world.color, border: `0.5px solid ${world.color}40` }}>
              {world.name}
            </div>
          </div>
        ))}
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'rgba(201,160,220,0.5)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>Envi Lee</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(28px,5vw,48px)', fontWeight: 400, background: 'var(--s-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
          World of Sparkle™
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(201,160,220,0.5)', marginTop: '4px' }}>Click a world to enter</div>
      </div>

      {/* Portal overlay */}
      {portalActive && enteringWorld && (
        <div className="portal-overlay">
          <div style={{ textAlign: 'center' }}>
            <div className="portal-ring" style={{
              width: '200px', height: '200px',
              borderColor: enteringWorld.color,
              boxShadow: `0 0 60px ${enteringWorld.color}`,
            }} />
            <div style={{ fontSize: '48px', marginTop: '-124px', animation: 'float 0.5s ease infinite' }}>{enteringWorld.icon}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', color: '#fff', marginTop: '80px' }}>
              Entering <span style={{ color: enteringWorld.color }}>{enteringWorld.name}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontFamily: "'DM Mono',monospace", letterSpacing: '2px' }}>
              TRANSPORTING YOU NOW...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── WORLD INTERIOR ─────────────────────────────────────────────
function WorldInterior({ world, onBack, userId }: { world: SparkleWorld; onBack: () => void; userId: string }) {
  const [tab, setTab] = useState<'tutorials' | 'patterns' | 'community' | 'coach' | 'kits'>('tutorials')
  const [coachMsg, setCoachMsg] = useState('')
  const [coachReply, setCoachReply] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [uploadImage, setUploadImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function askCoach() {
    if (!coachMsg.trim()) return
    setCoachLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 600,
          messages: [{ role: 'user', content: `You are Envi Lee's AI Craft Coach specializing in ${world.name}. A student needs help. Respond in Envi Lee's warm, encouraging, expert teaching style. Be specific and practical.

World: ${world.name}
Student question: ${coachMsg}
${uploadImage ? 'Student has uploaded a photo of their project.' : ''}

Give clear, friendly troubleshooting advice as if you are Envi Lee herself helping a student at 9pm when their hands are covered in craft materials.` }],
        }),
      })
      const data = await res.json()
      setCoachReply(data.content?.[0]?.text || 'Let me help you with that!')
    } catch { setCoachReply('Having trouble connecting right now — try again in a moment!') }
    setCoachLoading(false)
  }

  const tabs = [
    { id: 'tutorials', label: '📹 Tutorials' },
    { id: 'patterns', label: '🎨 Patterns' },
    { id: 'community', label: '👥 Community' },
    { id: 'coach', label: '🤖 AI Coach' },
    { id: 'kits', label: '🛒 Kit Shop' },
  ]

  return (
    <div className="pg-in" style={{ minHeight: '100vh' }}>
      {/* World header */}
      <div className="world-header" style={{ background: `linear-gradient(135deg, ${world.color}15, transparent)`, borderBottom: `0.5px solid ${world.color}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(201,160,220,0.5)', fontFamily: "'DM Mono',monospace", padding: 0 }}>← Globe</button>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: world.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: `0 0 20px ${world.color}60` }}>
            {world.icon}
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff' }}>
              <span style={{ color: world.color }}>{world.name}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(201,160,220,0.5)' }}>{world.desc}</div>
          </div>
        </div>

        <div className="world-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`world-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id as 'tutorials' | 'patterns' | 'community' | 'coach' | 'kits')}
              style={{ color: tab === t.id ? world.color : 'var(--mu3)', borderColor: tab === t.id ? `${world.color}40` : 'transparent', background: tab === t.id ? `${world.color}10` : 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="world-content">
        {/* TUTORIALS */}
        {tab === 'tutorials' && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: `${world.color}80`, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
              {world.name} Tutorials
            </div>
            {world.tutorials.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderColor: `${world.color}20` }}>
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📹</div>
                <div style={{ fontSize: '14px', color: 'var(--mu3)', marginBottom: '6px' }}>Tutorials coming soon</div>
                <div style={{ fontSize: '12px', color: 'var(--mu2)' }}>Envi Lee is crafting something amazing for this world</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {world.tutorials.filter(t => t.approved).map(tutorial => (
                  <div key={tutorial.id} className="video-card">
                    <div style={{ height: '160px', background: `linear-gradient(135deg, ${world.color}30, var(--bg3))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      {world.icon}
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{tutorial.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mu3)' }}>
                        <span>{tutorial.difficulty}</span>
                        <span>{tutorial.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload project video */}
            <div className="card hi" style={{ marginTop: '24px', borderColor: `${world.color}25` }}>
              <div className="ftitle" style={{ color: world.color }}>📤 Share Your Project</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '12px' }}>Made something in this world? Share your project video with the community — pending admin approval.</div>
              <button className="s-btn" style={{ fontSize: '12px' }}>Upload My Project Video</button>
            </div>
          </div>
        )}

        {/* PATTERNS */}
        {tab === 'patterns' && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: `${world.color}80`, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
              {world.name} Patterns
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
              <button className="s-btn" style={{ fontSize: '12px' }}>+ Create New Pattern</button>
              <button className="ghost-s" style={{ fontSize: '12px' }}>↑ Upload Pattern</button>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderColor: `${world.color}20` }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🎨</div>
              <div style={{ fontSize: '14px', color: 'var(--mu3)', marginBottom: '6px' }}>Pattern Designer</div>
              <div style={{ fontSize: '12px', color: 'var(--mu2)' }}>Design, download, and share patterns for {world.name}</div>
            </div>
          </div>
        )}

        {/* COMMUNITY */}
        {tab === 'community' && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: `${world.color}80`, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
              {world.name} Community
            </div>
            <div className="card hi" style={{ marginBottom: '16px', borderColor: `${world.color}25` }}>
              <div className="ftitle" style={{ color: world.color }}>Share Your Work</div>
              <textarea className="fta" placeholder={`Share what you made in ${world.name}...`} style={{ marginBottom: '10px' }} />
              <button className="s-btn" style={{ fontSize: '12px' }}>Post to Community</button>
            </div>
            {world.posts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px', borderColor: `${world.color}15` }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>👥</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Be the first to share in {world.name}!</div>
              </div>
            ) : null}
          </div>
        )}

        {/* AI COACH */}
        {tab === 'coach' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
                AI Craft <span style={{ color: world.color }}>Coach™</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Envi Lee's AI assistant — available 24/7 even when your hands are covered in {world.name === 'Resin World' ? 'resin' : 'glue'}.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div className="card hi" style={{ marginBottom: '14px', borderColor: `${world.color}25` }}>
                  <div className="ftitle" style={{ color: world.color }}>Ask Envi Lee's AI Coach</div>
                  <textarea className="fta" style={{ minHeight: '100px', marginBottom: '10px' }}
                    placeholder={`e.g. My ${world.id === 'resin' ? 'resin isn\'t curing' : world.id === 'sewing' ? 'seams are puckering' : world.id === 'balloon' ? 'balloon arch keeps drooping' : 'project isn\'t turning out right'}...`}
                    value={coachMsg} onChange={e => setCoachMsg(e.target.value)} />
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button onClick={() => fileRef.current?.click()} className="ghost-s" style={{ fontSize: '11px' }}>📸 Upload Photo</button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadImage(ev.target?.result as string); r.readAsDataURL(f) } }} />
                  </div>
                  {uploadImage && <img src={uploadImage} alt="project" style={{ width: '100%', borderRadius: '8px', marginBottom: '10px', maxHeight: '150px', objectFit: 'cover' }} />}
                  <button className="s-btn" onClick={askCoach} disabled={coachLoading || !coachMsg.trim()} style={{ width: '100%', fontSize: '12px' }}>
                    {coachLoading ? '⟳ Coach is thinking…' : '🤖 Ask the Coach'}
                  </button>
                  {coachLoading && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
                </div>

                <div className="card" style={{ borderColor: `${world.color}15` }}>
                  <div className="ftitle">Common {world.name} Questions</div>
                  {[
                    world.id === 'resin' ? 'Why is my resin still sticky?' : world.id === 'balloon' ? 'How do I make a balloon column?' : world.id === 'sewing' ? 'How do I fix puckering seams?' : world.id === 'lipgloss' ? 'What base do I use for lip gloss?' : 'How do I start this project?',
                    'What supplies do I need?',
                    'How long does this take to dry/set?',
                    'Where do I buy materials?',
                  ].map(q => (
                    <div key={q} onClick={() => setCoachMsg(q)}
                      onMouseEnter={e => (e.currentTarget.style.borderLeft = `3px solid ${world.color}`)}
                      onMouseLeave={e => (e.currentTarget.style.borderLeft = '3px solid transparent')}
                      style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: '6px', marginBottom: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--w2)', borderLeft: '3px solid transparent', transition: 'all .2s' }}>
                      {q}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {coachReply ? (
                  <div className="card hi" style={{ borderColor: `${world.color}30` }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${world.color}, #C9A0DC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>✨</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: world.color }}>Envi Lee's AI Coach</div>
                        <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{world.name} Expert</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--w2)', lineHeight: '1.8', background: 'var(--bg3)', padding: '16px', borderRadius: '10px' }}>{coachReply}</div>
                    <button className="ghost-s" onClick={() => { setCoachMsg(''); setCoachReply(''); setUploadImage(null) }} style={{ marginTop: '12px', fontSize: '11px' }}>Ask another question</button>
                  </div>
                ) : (
                  <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderColor: `${world.color}15`, height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'float 3s ease infinite' }}>🤖</div>
                    <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Ask the coach anything about {world.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '6px' }}>Available 24/7 — even at 9pm!</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KIT SHOP */}
        {tab === 'kits' && (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '6px' }}>
              <span style={{ color: world.color }}>{world.name}</span> Kit Shop
            </div>
            <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '24px' }}>Everything you need to complete your {world.name} projects — curated by Envi Lee.</div>
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderColor: `${world.color}15` }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🛒</div>
              <div style={{ fontSize: '14px', color: 'var(--mu3)', marginBottom: '12px' }}>DIY Kits for {world.name} coming soon</div>
              <a href="https://worldofsparkle.com" target="_blank" rel="noreferrer" className="s-btn" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '12px' }}>
                Shop World of Sparkle Store →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── PRIVATE SUITE ──────────────────────────────────────────────
function PrivateSuite({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'saved' | 'badges' | 'patterns' | 'inventory' | 'history'>('saved')
  const badges = JSON.parse(localStorage.getItem(`sparkle_badges_${userId}`) || '[]')
  const history = JSON.parse(localStorage.getItem(`sparkle_history_${userId}`) || '[]')

  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(155,89,182,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>My Space</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          My Sparkle <span style={{ background: 'var(--s-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Suite™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Your private creative space — all your work, badges, and progress in one place.</div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {[['saved','💾 Saved'],['badges','🏆 Badges'],['patterns','🎨 My Patterns'],['inventory','🧰 Supplies'],['history','🌍 World History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'saved'|'badges'|'patterns'|'inventory'|'history')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${tab===id?'var(--pb)':'rgba(155,89,182,0.1)'}`, background: tab===id?'var(--pg)':'transparent', color: tab===id?'var(--purple2)':'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'badges' && (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(155,89,182,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>My Sparkle Badges ({badges.length})</div>
          {badges.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🏆</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Complete tutorials to earn sparkle badges</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {badges.map((b: Record<string, string>, i: number) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '16px', borderColor: `${b.color}30` }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>{b.icon}</div>
                  <div style={{ fontSize: '11px', color: b.color, fontWeight: 600 }}>{b.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'inventory' && (
        <div>
          <div className="card hi" style={{ marginBottom: '16px' }}>
            <div className="ftitle">My Craft Supplies</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '12px' }}>Tell us what you have — we'll suggest what you can make tonight</div>
            <textarea className="fta" placeholder="e.g. Resin, glitter, silicone molds, UV lamp, isopropyl alcohol..." style={{ minHeight: '100px', marginBottom: '10px' }} />
            <button className="s-btn" style={{ fontSize: '12px' }}>Save My Supplies + Get Suggestions</button>
          </div>
        </div>
      )}

      {(tab === 'saved' || tab === 'patterns' || tab === 'history') && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>
            {tab === 'saved' ? '💾' : tab === 'patterns' ? '🎨' : '🌍'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>
            {tab === 'saved' ? 'Save tutorials to find them here' : tab === 'patterns' ? 'Your created and saved patterns appear here' : 'Worlds you visit are tracked here'}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ACCESS GATE ────────────────────────────────────────────────
function AccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [status, setStatus] = useState<'loading' | 'vip' | 'member' | 'none'>('loading')

  useEffect(() => {
    async function check() {
      if (!user) { setStatus('none'); return }
      try {
        const res = await fetch(`/api/access/sparkle?userId=${user.id}`)
        const data = await res.json()
        setStatus(data.status || 'none')
      } catch { setStatus('none') }
    }
    check()
  }, [user])

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000' }}>
      <div className="lbar" style={{ width: '120px' }}><div className="lbar-fill" /></div>
    </div>
  )

  if (status === 'none') return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at center, #0d0020, #000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '500px', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'float 3s ease infinite' }}>✨</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: '#fff', marginBottom: '8px' }}>
          World of <span style={{ background: 'var(--s-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sparkle™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(201,160,220,0.6)', marginBottom: '28px', lineHeight: '1.7' }}>
          Join through the World of Sparkle website to access this creative universe.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderColor: 'rgba(155,89,182,0.3)' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 900, background: 'var(--s-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>$19<span style={{ fontSize: '12px' }}>/mo</span></div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px' }}>Member Access</div>
            <div style={{ fontSize: '11px', color: 'var(--w2)' }}>All worlds, tutorials, AI Coach, community</div>
          </div>
          <div className="card gold" style={{ padding: '20px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 900, color: 'var(--yellow)', marginBottom: '4px' }}>$29<span style={{ fontSize: '12px' }}> once</span></div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px' }}>VIP Lifetime ⭐</div>
            <div style={{ fontSize: '11px', color: 'var(--w2)' }}>Everything forever + early access to new worlds</div>
          </div>
        </div>
        <a href="https://worldofsparkle.com" target="_blank" rel="noreferrer" className="s-btn" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '14px', padding: '14px 32px' }}>
          Join World of Sparkle →
        </a>
        <div style={{ marginTop: '16px' }}>
          <a href="/sign-in?redirect_url=/sparkle" style={{ fontSize: '12px', color: 'rgba(155,89,182,0.5)', textDecoration: 'none' }}>Already a member? Sign in →</a>
        </div>
      </div>
    </div>
  )

  return <>{children}</>
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function WorldOfSparklePage() {
  const { user } = useUser()
  const router = useRouter()
  const [room, setRoom] = useState<SparkleRoom>('globe')
  const [activeWorld, setActiveWorld] = useState<SparkleWorld | null>(null)
  const [worlds, setWorlds] = useState<SparkleWorld[]>(DEFAULT_WORLDS)

  useEffect(() => {
    const saved = localStorage.getItem('sparkle_worlds')
    if (saved) {
      const savedWorlds = JSON.parse(saved)
      setWorlds([...DEFAULT_WORLDS, ...savedWorlds.filter((w: SparkleWorld) => !DEFAULT_WORLDS.find(d => d.id === w.id))])
    }
  }, [])

  function enterWorld(world: SparkleWorld) {
    setActiveWorld(world)
    setRoom('world')
    const history = JSON.parse(localStorage.getItem(`sparkle_history_${user?.id}`) || '[]')
    if (!history.find((h: Record<string, string>) => h.id === world.id)) {
      history.unshift({ id: world.id, name: world.name, icon: world.icon, color: world.color, visitedAt: new Date().toISOString() })
      localStorage.setItem(`sparkle_history_${user?.id}`, JSON.stringify(history.slice(0, 20)))
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <AccessGate>
          <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' as const }}>
            {/* Top nav */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', borderBottom: '0.5px solid rgba(155,89,182,0.15)', backdropFilter: 'blur(10px)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: 'rgba(201,160,220,0.4)', fontFamily: "'DM Mono',monospace" }}>← Empire</button>
                <button onClick={() => { setRoom('globe'); setActiveWorld(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800, background: 'var(--s-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>World of Sparkle™</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[['globe','🌍 Globe'],['suite','✨ My Suite'],['workshops','📅 Workshops']].map(([r, label]) => (
                  <button key={r} onClick={() => { setRoom(r as SparkleRoom); if (r !== 'world') setActiveWorld(null) }}
                    style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${room===r?'var(--pb)':'rgba(155,89,182,0.1)'}`, background: room===r?'var(--pg)':'transparent', color: room===r?'var(--purple2)':'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
                    {label}
                  </button>
                ))}
                <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '28px', height: '28px' } } }} />
              </div>
            </div>

            {/* Main content */}
            <div style={{ paddingTop: room === 'globe' ? 0 : '52px' }}>
              {room === 'globe' && <SparkleGlobe worlds={worlds} onEnterWorld={enterWorld} />}
              {room === 'world' && activeWorld && <WorldInterior world={activeWorld} onBack={() => { setRoom('globe'); setActiveWorld(null) }} userId={user?.id || ''} />}
              {room === 'suite' && <PrivateSuite userId={user?.id || ''} />}
              {room === 'workshops' && (
                <div className="pg-in" style={{ padding: '28px', maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: '#fff', marginBottom: '8px' }}>
                    Workshop <span style={{ background: 'var(--s-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>World™</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '24px' }}>Book live virtual or in-person workshops with Envi Lee.</div>
                  <div className="card" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.6 }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                    <div style={{ fontSize: '14px', color: 'var(--w)', marginBottom: '8px' }}>Workshop schedule coming soon</div>
                    <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Check back for upcoming live craft sessions with Envi Lee</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AccessGate>
      </SignedIn>
    </>
  )
}
