'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// ── TYPES ─────────────────────────────────────────────────────
type PodTool = 'dashboard' | 'mockup' | 'design' | 'listing' | 'collection' | 'export' | 'saved' | 'store'

interface SavedMockup {
  id: number
  name: string
  product: string
  imageUrl: string
  savedAt: string
}

// ── HELPERS ───────────────────────────────────────────────────
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
    --bg2: #050505;
    --bg3: #0a0a0a;
    --s1: #111;
    --s2: #1a1a1a;
    --w: #f8f0ff;
    --w2: #e0d0f0;
    --mu: #444;
    --mu2: #666;
    --mu3: #888;
    --r: 8px;
    --r2: 12px;
    --r3: 16px;

    /* Multicolor accents */
    --red: #ff6b6b;
    --yellow: #ffd93d;
    --green: #6bcb77;
    --blue: #4d96ff;
    --pink: #ff6fd8;
    --orange: #ff9a3c;

    /* POD gradient */
    --pod: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff);
    --pod-border: rgba(255,107,107,0.3);
    --pod-glow: rgba(255,107,107,0.1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes aip { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar-fill { height: 100%; background: var(--pod); background-size: 200% 100%; animation: lbar 1.8s linear infinite; border-radius: 1px; }
  .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); display: inline-block; animation: aip 1.8s ease infinite; margin-right: 6px; }

  .drag-zone { border: 1.5px dashed rgba(255,107,107,0.3); border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; transition: all .2s; background: rgba(255,107,107,0.03); position: relative; }
  .drag-zone:hover, .drag-zone.dragging { border-color: var(--red); background: rgba(255,107,107,0.07); box-shadow: 0 0 20px rgba(255,107,107,0.1); }
  .drag-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .pod-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--pod); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(255,107,107,0.25); }
  .pod-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(255,107,107,0.4); }
  .pod-btn:disabled { opacity: 0.5; cursor: default; transform: none; }
  .ghost-btn { padding: 9px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border: 0.5px solid rgba(255,107,107,0.3); background: transparent; color: var(--red); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-btn:hover { background: rgba(255,107,107,0.08); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .del-btn:hover { background: rgba(255,45,120,0.1); }

  .card { background: var(--s1); border: 0.5px solid #1e1e1e; border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: #2a2a2a; }
  .card.accent { border-color: rgba(255,107,107,0.2); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--red); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid #1e1e1e; }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid #222; border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: rgba(255,107,107,0.4); }
  .fsel { background: var(--bg3); border: 0.5px solid #222; border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid #222; border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .ai-out { background: #0a0a0a; border: 0.5px solid #222; border-radius: var(--r2); padding: 14px; margin-top: 12px; }
  .ai-out-text { font-size: 12px; color: var(--w2); line-height: 1.85; white-space: pre-wrap; }

  .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
  .product-card { background: var(--bg3); border: 1.5px solid #1e1e1e; border-radius: var(--r2); padding: 12px; cursor: pointer; transition: all .2s; text-align: center; }
  .product-card:hover { border-color: rgba(255,107,107,0.4); background: rgba(255,107,107,0.05); }
  .product-card.selected { border-color: var(--red); background: rgba(255,107,107,0.08); box-shadow: 0 0 12px rgba(255,107,107,0.15); }
`

// ── PRODUCT TYPES ─────────────────────────────────────────────
const PRODUCTS = [
  { id: 'tshirt', name: 'T-Shirt', emoji: '👕', desc: 'Classic tee' },
  { id: 'hoodie', name: 'Hoodie', emoji: '🧥', desc: 'Pullover hoodie' },
  { id: 'sweatshirt', name: 'Sweatshirt', emoji: '👔', desc: 'Crewneck' },
  { id: 'leggings', name: 'Leggings', emoji: '🩱', desc: 'Full length' },
  { id: 'swimsuit', name: 'Swimsuit', emoji: '👙', desc: 'One piece/bikini' },
  { id: 'pajamas', name: 'Pajamas', emoji: '🛌', desc: 'PJ set' },
  { id: 'hat', name: 'Hat', emoji: '🧢', desc: 'Cap/beanie' },
  { id: 'bag', name: 'Bag', emoji: '👜', desc: 'Tote/crossbody' },
  { id: 'phonecase', name: 'Phone Case', emoji: '📱', desc: 'All models' },
  { id: 'mug', name: 'Mug', emoji: '☕', desc: '11oz/15oz' },
  { id: 'laptop', name: 'Laptop Sleeve', emoji: '💻', desc: '13-15 inch' },
  { id: 'custom', name: 'Custom', emoji: '✦', desc: 'Describe it' },
]

const PLATFORMS = ['Etsy', 'Shopify', 'TikTok Shop', 'Amazon', 'WooCommerce/WordPress', 'Instagram Shop', 'Pinterest']

// ── FIELD COMPONENT ───────────────────────────────────────────
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

// ── OUTPUT COMPONENT ──────────────────────────────────────────
function Output({ text, loading }: { text: string; loading: boolean }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  function copy() {
    if (!text) return
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    } else {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(ta)
      ta.focus(); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  function save() {
    if (!text) return
    const existing = JSON.parse(localStorage.getItem('podSavedWork') || '[]')
    existing.unshift({ id: Date.now(), content: text, savedAt: new Date().toISOString() })
    localStorage.setItem('podSavedWork', JSON.stringify(existing.slice(0, 100)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (!text && !loading) return null
  return (
    <div className="ai-out">
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: 'var(--red)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '9px', display: 'flex', alignItems: 'center' }}>
        <span className="ai-dot" />AI Output
      </div>
      {loading && <div style={{ height: '2px', background: '#1a1a1a', overflow: 'hidden', margin: '8px 0', borderRadius: '1px' }}><div className="lbar-fill" /></div>}
      {text && <>
        <div className="ai-out-text">{text}</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button onClick={copy} className="ghost-btn" style={{ fontSize: '11px', padding: '6px 12px' }}>{copied ? '✓ Copied!' : 'Copy ↗'}</button>
          <button onClick={save} className="ghost-btn" style={{ fontSize: '11px', padding: '6px 12px', borderColor: 'rgba(107,203,119,0.3)', color: 'var(--green)' }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
        </div>
      </>}
    </div>
  )
}

// ── DRAG DROP ZONE ────────────────────────────────────────────
function DragDrop({ onImage, currentImage, onClear, label = 'Drag & drop your design here', sub = 'PNG, JPG, SVG — transparent background works best', height = 150 }: {
  onImage: (url: string) => void
  currentImage?: string | null
  onClear?: () => void
  label?: string
  sub?: string
  height?: number
}) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className={`drag-zone${dragging ? ' dragging' : ''}`}
      style={{ minHeight: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: currentImage ? '0' : '28px' }}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !currentImage && ref.current?.click()}>
      <input ref={ref} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {currentImage ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <img src={currentImage} alt="uploaded" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block', borderRadius: '8px' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
            <button onClick={e => { e.stopPropagation(); ref.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: 'rgba(0,0,0,0.7)', color: 'var(--red)', fontSize: '10px', cursor: 'pointer' }}>Replace</button>
            {onClear && <button onClick={e => { e.stopPropagation(); onClear() }} className="del-btn" style={{ padding: '4px 10px' }}>Clear</button>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>◈</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: dragging ? 'var(--red)' : 'var(--w2)', marginBottom: '4px' }}>{dragging ? 'Drop it!' : label}</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{sub}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '6px', fontFamily: "'DM Mono',monospace" }}>drag & drop · click to browse</div>
        </div>
      )}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ setActiveTool }: { setActiveTool: (t: PodTool) => void }) {
  const { user } = useUser()
  const [recentMockups] = useState<SavedMockup[]>([])

  const quickActions = [
    { label: 'Create Mockup', icon: '◈', tool: 'mockup' as PodTool, color: 'var(--red)', desc: 'Apply your design to any product' },
    { label: 'Design Studio', icon: '✦', tool: 'design' as PodTool, color: 'var(--yellow)', desc: 'Create and edit designs' },
    { label: 'Write Listing', icon: '⊹', tool: 'listing' as PodTool, color: 'var(--green)', desc: 'AI product descriptions' },
    { label: 'Collection Builder', icon: '◷', tool: 'collection' as PodTool, color: 'var(--blue)', desc: 'Plan your product collection' },
    { label: 'Export & Publish', icon: '⊳', tool: 'export' as PodTool, color: 'var(--pink)', desc: 'Format for every platform' },
    { label: 'Virtual Store', icon: '◎', tool: 'store' as PodTool, color: 'var(--orange)', desc: 'Shop Envi Lee styles' },
  ]

  return (
    <div className="pg-in">
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,107,107,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>POD Studios Dashboard</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Welcome back, <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'Creator'}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu2)' }}>What are we creating today?</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '36px' }}>
        {[
          { label: 'Mockups Created', value: '0', color: 'var(--red)' },
          { label: 'Downloads', value: '0', color: 'var(--yellow)' },
          { label: 'Templates Saved', value: '0', color: 'var(--green)' },
          { label: 'Products', value: '12', color: 'var(--blue)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,107,107,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Quick Start</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '40px' }}>
        {quickActions.map(a => (
          <div key={a.tool} onClick={() => setActiveTool(a.tool)} className="card accent"
            style={{ cursor: 'pointer', transition: 'all .2s', borderColor: `${a.color}22` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${a.color}55`; (e.currentTarget as HTMLElement).style.background = `${a.color}08` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${a.color}22`; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '20px', color: a.color }}>{a.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)' }}>{a.label}</div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{a.desc}</div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: a.color, fontFamily: "'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>

      {/* Recent Mockups */}
      <div className="card">
        <div className="ftitle">Recent Mockups</div>
        {recentMockups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>◈</div>
            <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>No mockups yet</div>
            <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '16px' }}>Create your first product mockup to get started</div>
            <button className="pod-btn" onClick={() => setActiveTool('mockup')} style={{ fontSize: '12px', padding: '9px 18px' }}>
              Create Your First Mockup ↗
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {recentMockups.map(m => (
              <div key={m.id} className="card" style={{ padding: '12px' }}>
                <img src={m.imageUrl} alt={m.name} style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', aspectRatio: '1', objectFit: 'cover' }} />
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w)', marginBottom: '2px' }}>{m.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', marginBottom: '8px' }}>{m.product}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="ghost-btn" style={{ flex: 1, fontSize: '10px', padding: '5px' }}>⬇</button>
                  <button className="del-btn" style={{ flex: 1, fontSize: '10px', padding: '5px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MOCKUP GENERATOR ──────────────────────────────────────────
function MockupGenerator() {
  const [selectedProduct, setSelectedProduct] = useState('tshirt')
  const [designImage, setDesignImage] = useState<string | null>(null)
  const [modelImage, setModelImage] = useState<string | null>(null)
  const [customProduct, setCustomProduct] = useState('')
  const [scene, setScene] = useState('Black woman — natural hair, confident, luxury lifestyle')
  const [style, setStyle] = useState('Editorial fashion photography')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const product = PRODUCTS.find(p => p.id === selectedProduct)

  async function generatePrompts() {
    setLoading(true); setOutput('')
    try {
      const result = await callAPI('generate/mockup', {
        product: selectedProduct === 'custom' ? customProduct : (product?.name ?? 'T-Shirt'),
        design: designImage ? 'Custom uploaded design' : 'text prompt design',
        setting: scene,
        style,
      })
      setOutput(result)
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  async function generateImage() {
    if (!output) { alert('Generate prompts first!'); return }
    setImageLoading(true)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: output.slice(0, 500),
          style: 'fashion',
          size: 'square',
          facePhoto: modelImage ?? null,
        }),
      })
      const data = await res.json()
      setImageUrl(data.imageUrl ?? null)
    } catch (e) { console.error(e) }
    finally { setImageLoading(false) }
  }

  function saveMockup() {
    if (!imageUrl) return
    const existing = JSON.parse(localStorage.getItem('podMockups') || '[]')
    existing.unshift({ id: Date.now(), name: `${product?.name} Mockup`, product: product?.name, imageUrl, savedAt: new Date().toISOString() })
    localStorage.setItem('podMockups', JSON.stringify(existing.slice(0, 50)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Mockup <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Generator</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        Apply your design to any product — AI generates lifestyle mockup prompts and photorealistic images.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* LEFT */}
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Step 1 — Choose Product</div>
            <div className="product-grid">
              {PRODUCTS.map(p => (
                <div key={p.id} className={`product-card${selectedProduct === p.id ? ' selected' : ''}`} onClick={() => setSelectedProduct(p.id)}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{p.emoji}</div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: selectedProduct === p.id ? 'var(--red)' : 'var(--w2)', fontFamily: "'DM Mono',monospace" }}>{p.name}</div>
                </div>
              ))}
            </div>
            {selectedProduct === 'custom' && (
              <div style={{ marginTop: '10px' }}>
                <F label="Describe your product">
                  <input className="finp" placeholder="e.g. Canvas tote bag, 16x14 inches, natural cotton" value={customProduct} onChange={e => setCustomProduct(e.target.value)} />
                </F>
              </div>
            )}
          </div>

          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Step 2 — Upload Your Design</div>
            <DragDrop
              label="Drag & drop your design"
              sub="PNG with transparent background works best · JPG, SVG also accepted"
              currentImage={designImage}
              onImage={setDesignImage}
              onClear={() => setDesignImage(null)}
              height={140}
            />
          </div>

          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Step 3 — AI Model (Optional)</div>
            <DragDrop
              label="Upload your AI model/twin photo"
              sub="Locks their face into every generated image"
              currentImage={modelImage}
              onImage={setModelImage}
              onClear={() => setModelImage(null)}
              height={120}
            />
            <div style={{ marginTop: '10px' }}>
              <F label="Model Scene">
                <select className="fsel" value={scene} onChange={e => setScene(e.target.value)}>
                  {[
                    'Black woman — natural hair, confident, luxury lifestyle',
                    'Black woman — beachside, swimwear shoot, golden hour',
                    'Black woman — urban street style, NYC vibes',
                    'Black woman — studio shoot, clean background',
                    'Flat lay — marble surface, minimal props',
                    'Lifestyle — outdoor, natural light, editorial',
                  ].map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="Visual Style">
                <select className="fsel" value={style} onChange={e => setStyle(e.target.value)}>
                  {['Editorial fashion photography', 'Luxury lifestyle campaign', 'Streetwear urban aesthetic', 'Minimal studio flat lay', 'Cinematic film still'].map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
            </div>
          </div>

          <button className="pod-btn" onClick={generatePrompts} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating prompts…' : `✦ Generate ${product?.name ?? 'Product'} Mockup Prompts`}
          </button>
          <Output text={output} loading={loading} />

          {output && (
            <button className="pod-btn" onClick={generateImage} disabled={imageLoading} style={{ width: '100%', marginTop: '10px', opacity: imageLoading ? 0.7 : 1 }}>
              {imageLoading ? 'Generating image…' : '◈ Generate Mockup Image'}
            </button>
          )}
        </div>

        {/* RIGHT — Image result */}
        <div>
          <div className="card accent" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Mockup Preview</div>
            <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid #222' }}>
              {imageLoading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.5 }}>◈</div>
                  <div style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '8px' }}>Generating your mockup…</div>
                  <div style={{ height: '2px', background: '#1a1a1a', overflow: 'hidden', borderRadius: '1px', width: '120px', margin: '0 auto 8px' }}><div className="lbar-fill" /></div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>Usually 5–15 seconds</div>
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt="mockup" style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.2 }}>{product?.emoji}</div>
                  <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Your mockup appears here</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '4px' }}>Generate prompts then click Generate Image</div>
                </div>
              )}
            </div>
            {imageUrl && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={imageUrl} download target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', background: 'var(--pod)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', textDecoration: 'none', display: 'block' }}>⬇ Download</a>
                <button onClick={saveMockup} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: `0.5px solid ${saved ? 'var(--green)' : '#333'}`, background: saved ? 'rgba(107,203,119,0.1)' : 'var(--s2)', color: saved ? 'var(--green)' : 'var(--mu3)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{saved ? '✓ Saved!' : '⊹ Save Template'}</button>
                <button onClick={() => setImageUrl(null)} className="del-btn">✕</button>
              </div>
            )}
          </div>

          {/* Body Shot Studio */}
          <div className="card">
            <div className="ftitle">Body Shot Studio</div>
            <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '12px', lineHeight: '1.6' }}>
              Generate 4 full-body lifestyle shots of your AI model wearing the selected product — different poses, angles, and scenes.
            </div>
            <button className="pod-btn" onClick={() => alert('Upload your AI model photo above first, then click Generate Mockup Image to start Body Shot Studio')} style={{ width: '100%', fontSize: '12px' }}>
              ⊳ Run Body Shot Studio — 4 Poses
            </button>
            <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '8px', fontFamily: "'DM Mono',monospace", textAlign: 'center' }}>
              Upload AI model photo above first · Same face across all 4 shots
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PRODUCT LISTING WRITER ────────────────────────────────────
function ListingWriter() {
  const [productName, setProductName] = useState('')
  const [details, setDetails] = useState('')
  const [platform, setPlatform] = useState('Etsy')
  const [audience, setAudience] = useState('Women aged 22–40 who love fashion and luxury aesthetics')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/listing', { productName, details, platform, targetAudience: audience })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Product <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Listing Writer</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        AI writes your full title, description, bullet points, SEO tags, and social caption in one click.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Product Details</div>
          <F label="Product name"><input className="finp" placeholder="e.g. Luxe Floral Crop Tee" value={productName} onChange={e => setProductName(e.target.value)} /></F>
          <F label="Description"><textarea className="fta" placeholder="Material, colors, style, what makes it special..." value={details} onChange={e => setDetails(e.target.value)} /></F>
          <F label="Platform">
            <select className="fsel" value={platform} onChange={e => setPlatform(e.target.value)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Target audience"><input className="finp" value={audience} onChange={e => setAudience(e.target.value)} /></F>
          <button className="pod-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Writing…' : 'Write Full Listing ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">What Gets Written</div>
          {[
            ['Title', 'SEO-optimized platform-specific title'],
            ['Description', 'Lifestyle-led copy that converts'],
            ['Key Features', '5 benefit-first bullet points'],
            ['SEO Tags', '13 search tags or keywords'],
            ['Social Caption', 'Hook + product + CTA with hashtags'],
          ].map(([l, d]) => (
            <div key={l} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--red)', marginBottom: '2px' }}>{l}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <div className="ftitle">Supported Platforms</div>
            {PLATFORMS.map(p => (
              <div key={p} style={{ padding: '7px 10px', background: 'var(--bg3)', borderRadius: 'var(--r)', fontSize: '12px', color: 'var(--mu3)', marginBottom: '6px', fontFamily: "'DM Mono',monospace" }}>◈ {p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DESCRIPTION WRITER ────────────────────────────────────────
function DescriptionWriter() {
  const [product, setProduct] = useState('')
  const [niche, setNiche] = useState('luxury fashion')
  const [tone, setTone] = useState('elevated, aspirational, confident')
  const [audience, setAudience] = useState('Black women aged 22–40 who love fashion and lifestyle')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/description', { product, niche, tone, audience })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Description <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Writer</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        Three description variants plus a power tagline in one click.
      </div>
      <div className="card hi">
        <div className="ftitle">Your Product</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <F label="Product"><input className="finp" placeholder="e.g. Luxe Floral Crop Tee" value={product} onChange={e => setProduct(e.target.value)} /></F>
            <F label="Niche"><input className="finp" value={niche} onChange={e => setNiche(e.target.value)} /></F>
          </div>
          <div>
            <F label="Brand tone"><input className="finp" value={tone} onChange={e => setTone(e.target.value)} /></F>
            <F label="Target audience"><input className="finp" value={audience} onChange={e => setAudience(e.target.value)} /></F>
          </div>
        </div>
        <button className="pod-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Writing…' : 'Write 3 Descriptions + Tagline ↗'}
        </button>
        <Output text={output} loading={loading} />
      </div>
    </div>
  )
}

// ── COLLECTION BUILDER ────────────────────────────────────────
function CollectionBuilder() {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('luxury fashion')
  const [audience, setAudience] = useState('Black women aged 22–40')
  const [season, setSeason] = useState('All season')
  const [pieces, setPieces] = useState('6')
  const [priceRange, setPriceRange] = useState('$30–$100')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/tools', { tool: 'collection', name, theme, audience, season, pieces, priceRange })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Collection <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Builder</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        Plan a complete POD collection — name ideas, pieces, color palette, pricing, and launch strategy.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Collection Details</div>
          <F label="Collection name"><input className="finp" placeholder="e.g. Baddie Summer, Luxe Noir" value={name} onChange={e => setName(e.target.value)} /></F>
          <F label="Theme"><input className="finp" value={theme} onChange={e => setTheme(e.target.value)} /></F>
          <F label="Target audience"><input className="finp" value={audience} onChange={e => setAudience(e.target.value)} /></F>
          <F label="Season">
            <select className="fsel" value={season} onChange={e => setSeason(e.target.value)}>
              {['All season', 'Summer', 'Winter', 'Spring', 'Fall', 'Holiday', "Valentine's Day", 'Birthday', 'Graduation'].map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Pieces">
              <select className="fsel" value={pieces} onChange={e => setPieces(e.target.value)}>
                {['4', '6', '8', '10', '12'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Price range">
              <select className="fsel" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                {['$20–$50', '$30–$80', '$40–$100', '$50–$150', '$75–$200'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
          </div>
          <button className="pod-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Building…' : 'Build Collection Plan ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Quick-starts</div>
          {[
            { label: 'Baddie Summer', name: 'Baddie Summer', theme: 'luxury beach and summer lifestyle', season: 'Summer', pieces: '6', priceRange: '$30–$80' },
            { label: 'Luxe Noir', name: 'Luxe Noir', theme: 'all black luxury streetwear', season: 'All season', pieces: '8', priceRange: '$50–$150' },
            { label: 'Holiday Glam', name: 'Holiday Glam', theme: 'festive luxury holiday fashion', season: 'Holiday', pieces: '6', priceRange: '$40–$100' },
            { label: 'The Come Up', name: 'The Come Up', theme: 'boss babe entrepreneur aesthetic', season: 'All season', pieces: '6', priceRange: '$35–$90' },
          ].map(q => (
            <button key={q.label} onClick={() => { setName(q.name); setTheme(q.theme); setSeason(q.season); setPieces(q.pieces); setPriceRange(q.priceRange) }}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid #222', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
              {q.label} ↗
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── EXPORT TOOL ───────────────────────────────────────────────
function ExportTool() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Export <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>& Publish</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        Auto-format your mockups for every platform — download print-ready and web-ready files.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Platform Dimensions</div>
          {[
            { platform: 'Etsy', sizes: '2000×2000px, 800×800px (thumbnail)', format: 'JPG, PNG', note: 'Square format preferred' },
            { platform: 'Shopify', sizes: '2048×2048px (product), 1280×720px (banner)', format: 'JPG, PNG, WebP', note: 'Multiple angles recommended' },
            { platform: 'Amazon', sizes: '1000×1000px minimum, 2000×2000px ideal', format: 'JPG, PNG', note: 'Pure white background' },
            { platform: 'TikTok Shop', sizes: '800×800px', format: 'JPG, PNG', note: 'Square, bright and clean' },
            { platform: 'WooCommerce', sizes: '800×800px (product), 1920×600px (banner)', format: 'JPG, WebP', note: 'Match your theme' },
            { platform: 'Instagram Shop', sizes: '1080×1080px', format: 'JPG, PNG', note: 'Square preferred' },
            { platform: 'Pinterest', sizes: '1000×1500px (pin), 1200×628px (board)', format: 'JPG, PNG', note: 'Vertical performs best' },
          ].map(p => (
            <div key={p.platform} style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '0.5px solid #1e1e1e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)' }}>{p.platform}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{p.format}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--w2)', marginBottom: '2px' }}>{p.sizes}</div>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', fontStyle: 'italic' }}>{p.note}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Export Sizes</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Square', size: '2000×2000px', use: 'Etsy, Shopify, Amazon', color: 'var(--red)' },
                { label: 'Portrait', size: '1000×1500px', use: 'Pinterest, Fashion', color: 'var(--yellow)' },
                { label: 'Landscape', size: '1280×720px', use: 'Banners, YouTube', color: 'var(--green)' },
                { label: 'TikTok', size: '1080×1920px', use: 'TikTok, Stories', color: 'var(--blue)' },
                { label: 'Print Ready', size: '4500×5400px 300dpi', use: 'DTG, Print-on-demand', color: 'var(--pink)' },
                { label: 'Web Optimized', size: '800×800px 72dpi', use: 'Website, Social', color: 'var(--orange)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: `0.5px solid ${s.color}22`, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${s.color}55`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${s.color}22`)}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: s.color, marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '2px' }}>{s.size}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu)' }}>{s.use}</div>
                </div>
              ))}
            </div>
            <button className="pod-btn" style={{ width: '100%', marginTop: '12px', fontSize: '12px' }}
              onClick={() => alert('Upload a mockup in the Mockup Generator to download formatted versions')}>
              ⬇ Download All Sizes
            </button>
          </div>
          <div className="card">
            <div className="ftitle">Direct Social Upload</div>
            {[
              { name: 'Instagram', icon: '📸', status: 'Connect' },
              { name: 'TikTok', icon: '🎵', status: 'Connect' },
              { name: 'Facebook', icon: '👥', status: 'Connect' },
              { name: 'Pinterest', icon: '📌', status: 'Connect' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg3)', borderRadius: '7px', marginBottom: '7px', border: '0.5px solid #1e1e1e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{s.icon}</span>
                  <span style={{ fontSize: '12px', color: 'var(--w2)' }}>{s.name}</span>
                </div>
                <button className="ghost-btn" style={{ fontSize: '10px', padding: '4px 10px' }}>{s.status} →</button>
              </div>
            ))}
            <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '8px', fontFamily: "'DM Mono',monospace", lineHeight: '1.6' }}>
              Connect your social accounts to upload directly from the app
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── VIRTUAL STORE ─────────────────────────────────────────────
function VirtualStore() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Envi Lee <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Virtual Store</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        Shop clothing, accessories, and props for your AI model. Add pieces to your model's wardrobe.
      </div>
      <div style={{ background: 'rgba(255,107,107,0.06)', border: '0.5px solid rgba(255,107,107,0.2)', borderRadius: '10px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🛍</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--red)', marginBottom: '8px' }}>Store Coming Soon</div>
        <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '400px', margin: '0 auto' }}>
          Envi Lee is curating a virtual wardrobe for your AI models. Check back soon for exclusive clothing collections, accessories, and lifestyle props you can add to your mockups.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {['Clothing Collection', 'Accessories', 'Lifestyle Props', 'Backgrounds', 'Houses & Rooms', 'Vehicles'].map(cat => (
          <div key={cat} className="card" style={{ textAlign: 'center', padding: '20px', opacity: 0.4, cursor: 'not-allowed' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w2)' }}>{cat}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '4px', fontFamily: "'DM Mono',monospace" }}>Coming Soon</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SAVED WORK ────────────────────────────────────────────────
function SavedWork() {
  const [items, setItems] = useState<Array<{ id: number; content: string; savedAt: string }>>([])
  const [mockups, setMockups] = useState<SavedMockup[]>([])

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('podSavedWork') || '[]'))
    setMockups(JSON.parse(localStorage.getItem('podMockups') || '[]'))
  }, [])

  function deleteItem(id: number) {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('podSavedWork', JSON.stringify(updated))
  }

  function deleteMockup(id: number) {
    const updated = mockups.filter(m => m.id !== id)
    setMockups(updated)
    localStorage.setItem('podMockups', JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Saved <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Work</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>
        All your saved mockups, templates, and AI-generated content.
      </div>

      {/* Saved Mockups */}
      {mockups.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,107,107,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Saved Mockups</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {mockups.map(m => (
              <div key={m.id} className="card" style={{ padding: '12px' }}>
                <img src={m.imageUrl} alt={m.name} style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', aspectRatio: '1', objectFit: 'cover' }} />
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w)', marginBottom: '2px' }}>{m.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', marginBottom: '8px' }}>{new Date(m.savedAt).toLocaleDateString()}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a href={m.imageUrl} download style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: 'rgba(255,107,107,0.15)', color: 'var(--red)', fontSize: '10px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', textDecoration: 'none', display: 'block' }}>⬇</a>
                  <button onClick={() => deleteMockup(m.id)} className="del-btn" style={{ flex: 1, fontSize: '10px', padding: '6px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Text */}
      {items.length > 0 ? (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,107,107,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Saved Content</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {items.map(item => (
              <div key={item.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                  <button onClick={() => deleteItem(item.id)} className="del-btn">Delete</button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', maxHeight: '100px', overflow: 'hidden' }}>{item.content}</div>
              </div>
            ))}
          </div>
        </div>
      ) : mockups.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>◌</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No saved work yet</div>
          <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '4px' }}>Use any tool and click Save to see your work here</div>
        </div>
      )}
    </div>
  )
}

// ── POD BOT ───────────────────────────────────────────────────
function PodBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "Hey! I'm your POD Assistant. Ask me anything about print-on-demand, mockups, pricing, platforms, or growing your POD business!" }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are a POD (print-on-demand) business assistant for Envi Lee POD Studios. Help with: mockup creation, product listings, Etsy/Shopify/Amazon/TikTok Shop strategy, pricing, design tips, marketing, and growing a POD business. Be specific and helpful. Question: ${msg}` })
      setMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '340px', background: '#0d0a14', border: '0.5px solid rgba(255,107,107,0.3)', borderRadius: '16px', boxShadow: '0 0 40px rgba(255,107,107,0.1)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'rgba(255,107,107,0.08)', borderBottom: '0.5px solid rgba(255,107,107,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--red)', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="ai-dot" />POD Assistant
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '88%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(255,107,107,0.12)' : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? 'rgba(255,107,107,0.25)' : '#1e1e1e'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: 'var(--red)', alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px', border: '0.5px solid #1e1e1e' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '0.5px solid #1e1e1e', display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid #222', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'var(--red)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── SIDEBAR NAV ───────────────────────────────────────────────
const NAV_ITEMS: { tool: PodTool; label: string; icon: string }[] = [
  { tool: 'dashboard', label: 'Dashboard', icon: '◉' },
  { tool: 'mockup', label: 'Mockup Generator', icon: '◈' },
  { tool: 'design', label: 'Design Studio', icon: '✦' },
  { tool: 'listing', label: 'Listing Writer', icon: '⊹' },
  { tool: 'collection', label: 'Collection Builder', icon: '◷' },
  { tool: 'export', label: 'Export & Publish', icon: '⊳' },
  { tool: 'saved', label: 'Saved Work', icon: '◌' },
]

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function PodPage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<PodTool>('dashboard')
  const [hovered, setHovered] = useState<PodTool | null>(null)
  const [botOpen, setBotOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

          {/* SIDEBAR */}
          <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: '0.5px solid #1a1a1a', padding: '0', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '16px 14px', borderBottom: '0.5px solid #1a1a1a' }}>
              <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--pod)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>◈</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800, color: 'var(--w)' }}>POD Studios™</div>
                  <div style={{ fontSize: '9px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px' }}>Envi Lee</div>
                </div>
              </div>
            </div>

            {/* User */}
            {user && (
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #1a1a1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,107,107,0.06)', borderRadius: '8px', border: '0.5px solid rgba(255,107,107,0.15)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Creator'}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,107,107,0.5)', fontFamily: "'DM Mono',monospace" }}>POD Plan</div>
                  </div>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                </div>
              </div>
            )}

            {/* Nav */}
            <div style={{ padding: '10px 10px', flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Tools</div>
              {NAV_ITEMS.map(({ tool, label, icon }) => (
                <button key={tool} onClick={() => setActive(tool)}
                  onMouseEnter={() => setHovered(tool)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'rgba(255,107,107,0.4)' : 'transparent'}`, background: active === tool ? 'rgba(255,107,107,0.08)' : hovered === tool ? '#111' : 'none', color: active === tool ? 'var(--red)' : hovered === tool ? 'var(--w)' : 'var(--mu2)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '13px' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Bottom links */}
            <div style={{ padding: '12px 14px', borderTop: '0.5px solid #1a1a1a' }}>
              <div style={{ fontSize: '9px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace", marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.8px' }}>Quick Access</div>
              {[
                { label: 'Printify', url: 'https://printify.com' },
                { label: 'Canva', url: 'https://canva.com' },
                { label: 'Etsy Seller', url: 'https://sell.etsy.com' },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: 'block', padding: '6px 8px', fontSize: '11px', color: 'var(--mu3)', textDecoration: 'none', fontFamily: "'DM Mono',monospace", borderRadius: '5px', marginBottom: '2px', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--mu3)')}>
                  {l.label} ↗
                </a>
              ))}
            </div>
          </aside>

          {/* MAIN */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '28px', position: 'relative' }}>
            {active === 'dashboard' && <Dashboard setActiveTool={setActive} />}
            {active === 'mockup' && <MockupGenerator />}
            {active === 'listing' && <ListingWriter />}
            {active === 'design' && (
              <div className="pg-in">
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Design <span style={{ background: 'var(--pod)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studio</span></div>
                <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px' }}>Full design editor — coming in the next update. For now use Canva to create your designs.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                  {[
                    { name: 'Canva', url: 'https://canva.com', desc: 'Free and paid design tool', icon: '🎨' },
                    { name: 'Adobe Express', url: 'https://express.adobe.com', desc: 'Professional design suite', icon: '✨' },
                    { name: 'Kittl', url: 'https://kittl.com', desc: 'POD-specific design tool', icon: '◈' },
                    { name: 'Placeit', url: 'https://placeit.net', desc: 'Mockup and design generator', icon: '◉' },
                  ].map(t => (
                    <a key={t.name} href={t.url} target="_blank" rel="noreferrer" className="card" style={{ textDecoration: 'none', transition: 'all .2s', display: 'block' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,107,0.3)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{t.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '4px' }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '10px' }}>{t.desc}</div>
                      <div style={{ fontSize: '10px', color: 'var(--red)', fontFamily: "'DM Mono',monospace" }}>Open ↗</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {active === 'collection' && <CollectionBuilder />}
            {active === 'export' && <ExportTool />}
            {active === 'saved' && <SavedWork />}
          </main>

          {/* BOT BUTTON */}
          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--red)', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,107,107,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
            {botOpen ? '✕' : '◉'}
          </button>
          {botOpen && <PodBot onClose={() => setBotOpen(false)} />}

        </div>
      </SignedIn>
    </>
  )
}
