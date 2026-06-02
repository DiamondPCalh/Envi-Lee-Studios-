'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type StoreTool = 'home' | 'envi' | 'pod' | 'lifestyle' | 'ugc' | 'social' | 'submit' | 'admin'

// ── STYLES ────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #000;
    --bg2: #080305;
    --bg3: #100508;
    --s1: #150508;
    --s2: #1e0810;
    --w: #fff0f8;
    --w2: #f0c0d8;
    --mu: #2a0818;
    --mu2: #4a1030;
    --mu3: #8a4060;
    --r: 8px; --r2: 12px; --r3: 16px;

    --pink: #ff2d78;
    --pink2: #ff6fa8;
    --pink3: rgba(255,45,120,0.08);
    --pb: rgba(255,45,120,0.3);
    --pg: rgba(255,45,120,0.12);

    /* Pink ombré gradient */
    --ombre: linear-gradient(135deg, #ff0080, #ff4da6, #ff80c0, #ffb3d9);
    --ombre2: linear-gradient(135deg, #ff0080, #ff2d78);
    --ombre3: linear-gradient(180deg, #ff0080 0%, #ff4da6 50%, #ff80c0 100%);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1a0510; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--ombre); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .p-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--pink); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(255,45,120,0.12); border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: rgba(255,45,120,0.25); }
  .card.accent { border-color: var(--pb); background: var(--pink3); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--pink); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(255,45,120,0.12); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(255,45,120,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: var(--pb); }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(255,45,120,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(255,45,120,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .pink-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--ombre); color: #fff; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(255,45,120,0.25); }
  .pink-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(255,45,120,0.4); }
  .pink-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-btn { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--pb); background: transparent; color: var(--pink); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-btn:hover { background: var(--pink3); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .product-card { background: var(--s1); border: 0.5px solid rgba(255,45,120,0.12); border-radius: var(--r2); overflow: hidden; transition: all .2s; cursor: pointer; }
  .product-card:hover { border-color: rgba(255,45,120,0.35); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,45,120,0.1); }

  .social-card { background: var(--s1); border: 0.5px solid rgba(255,45,120,0.12); border-radius: var(--r2); padding: 14px 16px; display: flex; align-items: center; gap: 12px; transition: all .2s; text-decoration: none; }
  .social-card:hover { border-color: var(--pb); background: var(--pink3); }

  .nav-tab { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; border: 0.5px solid transparent; }
  .nav-tab.active { background: var(--pink3); border-color: var(--pb); color: var(--pink); }
  .nav-tab.inactive { color: var(--mu3); }
  .nav-tab.inactive:hover { color: var(--w); background: rgba(255,45,120,0.04); }

  .drag-zone { border: 1.5px dashed rgba(255,45,120,0.2); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all .2s; background: var(--pink3); position: relative; }
  .drag-zone:hover { border-color: var(--pink); box-shadow: 0 0 20px rgba(255,45,120,0.08); }
  .drag-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 9px; font-family: 'DM Mono', monospace; font-weight: 500; text-transform: uppercase; letter-spacing: .6px; }
  .badge.live { background: rgba(0,255,136,0.1); color: #00ff88; border: 0.5px solid rgba(0,255,136,0.3); }
  .badge.pending { background: rgba(255,230,0,0.1); color: #ffe600; border: 0.5px solid rgba(255,230,0,0.3); }
  .badge.coming { background: rgba(255,45,120,0.1); color: var(--pink); border: 0.5px solid rgba(255,45,120,0.3); }
  .badge.envi { background: var(--pink3); color: var(--pink); border: 0.5px solid var(--pb); }
`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

function DragDrop({ onImage, currentImage, onClear, label = 'Drag image here', sub = 'JPG, PNG, WebP', height = 140 }: {
  onImage: (url: string) => void; currentImage?: string | null; onClear?: () => void; label?: string; sub?: string; height?: number
}) {
  const ref = useRef<HTMLInputElement>(null)
  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div className="drag-zone" style={{ minHeight: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: currentImage ? '0' : '20px' }}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onDragOver={e => e.preventDefault()}
      onClick={() => !currentImage && ref.current?.click()}>
      <input ref={ref} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {currentImage ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <img src={currentImage} alt="upload" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
            <button onClick={e => { e.stopPropagation(); ref.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'var(--pink)', fontSize: '10px', cursor: 'pointer' }}>Replace</button>
            {onClear && <button onClick={e => { e.stopPropagation(); onClear() }} className="del-btn" style={{ padding: '4px 10px' }}>Clear</button>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.4 }}>🛍</div>
          <div style={{ fontSize: '12px', color: 'var(--w2)', marginBottom: '3px' }}>{label}</div>
          <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{sub}</div>
        </div>
      )}
    </div>
  )
}

// ── SAMPLE DATA ───────────────────────────────────────────────
const ENVI_PRODUCTS = [
  { id: 1, name: 'Luxe Crop Set', price: 89, category: 'Clothing', image: null, badge: 'New', desc: 'Premium ribbed crop top and matching shorts. Elevated everyday luxury.' },
  { id: 2, name: 'Empire Blazer', price: 145, category: 'Clothing', image: null, badge: 'Bestseller', desc: 'Oversized white power blazer. Command every room you enter.' },
  { id: 3, name: 'Baddie Lounge Set', price: 75, category: 'Clothing', image: null, badge: 'New', desc: 'Matching lounge set in luxury fabric. Comfort meets confidence.' },
  { id: 4, name: 'Queen Chain Necklace', price: 45, category: 'Accessories', image: null, badge: 'Limited', desc: 'Gold-toned layered chain. Stack it or wear it solo.' },
]

const POD_PRODUCTS = [
  { id: 1, name: 'Baddie Era Tee', seller: 'Nova Creates', price: 35, link: 'https://etsy.com', image: null, category: 'T-Shirt', platform: 'Etsy' },
  { id: 2, name: 'Empire Hoodie', seller: 'Luxe Prints', price: 65, link: 'https://shopify.com', image: null, category: 'Hoodie', platform: 'Shopify' },
  { id: 3, name: 'Queen Mug', seller: 'QueenMade', price: 22, link: 'https://amazon.com', image: null, category: 'Mug', platform: 'Amazon' },
]

const UGC_STORES = [
  { name: 'Amazon', url: 'https://amazon.com', icon: '📦', desc: 'Shop products for your UGC content', color: '#ff9900' },
  { name: 'TikTok Shop', url: 'https://shop.tiktok.com', icon: '🎵', desc: 'TikTok affiliate products', color: '#ff2d78' },
  { name: 'Target', url: 'https://target.com', icon: '🎯', desc: 'Lifestyle and fashion UGC', color: '#cc0000' },
  { name: 'Walmart', url: 'https://walmart.com', icon: '⭐', desc: 'Everyday UGC products', color: '#0071ce' },
  { name: 'Ulta Beauty', url: 'https://ulta.com', icon: '💄', desc: 'Beauty and skincare UGC', color: '#e91e8c' },
  { name: 'Fashion Nova', url: 'https://fashionnova.com', icon: '👗', desc: 'Fashion affiliate content', color: '#ff2d78' },
  { name: 'SHEIN', url: 'https://shein.com', icon: '✨', desc: 'Affordable fashion hauls', color: '#ff6b35' },
  { name: 'Sephora', url: 'https://sephora.com', icon: '🌹', desc: 'Luxury beauty UGC', color: '#000000' },
]

// ── STORE HOME ────────────────────────────────────────────────
function StoreHome({ setTool }: { setTool: (t: StoreTool) => void }) {
  return (
    <div className="pg-in">
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 20px', marginBottom: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,45,120,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,45,120,0.6)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
          Now Open
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(36px,6vw,72px)', fontWeight: 300, color: 'var(--w)', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '12px' }}>
          Envi Lee<br /><span style={{ background: 'var(--ombre)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Virtual Store™</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--mu3)', marginBottom: '32px', lineHeight: '1.7' }}>
          Shop exclusive Envi Lee designs, student POD collections, and lifestyle pieces for your AI twin.
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <button className="pink-btn" onClick={() => setTool('envi')} style={{ fontSize: '14px', padding: '12px 28px' }}>Shop Envi Lee ↗</button>
          <button onClick={() => setTool('pod')} style={{ padding: '12px 28px', borderRadius: '9px', border: '0.5px solid var(--pb)', background: 'transparent', color: 'var(--pink)', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            Student POD →
          </button>
        </div>
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '48px' }}>
        {[
          { id: 'envi', icon: '✦', label: 'Envi Lee Collection', desc: 'Exclusive designs by Envi Lee — clothing, accessories, and lifestyle', badge: 'New Arrivals', color: 'var(--pink)' },
          { id: 'pod', icon: '◈', label: 'Student POD Shop', desc: 'Print-on-demand products created by Envi Lee students', badge: 'Community', color: '#ff6fa8' },
          { id: 'lifestyle', icon: '◉', label: 'Lifestyle Store', desc: 'Houses, rooms, cars, and props for your AI twin', badge: 'Coming Soon', color: '#ff80c0' },
          { id: 'ugc', icon: '⊹', label: 'UGC Shopping', desc: 'Amazon, TikTok Shop, and more for your content', badge: 'All Platforms', color: '#ffb3d9' },
        ].map(cat => (
          <div key={cat.id} className="product-card" onClick={() => setTool(cat.id as StoreTool)} style={{ padding: '24px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--ombre)', opacity: 0.4 }} />
            <div style={{ fontSize: '24px', color: cat.color, marginBottom: '10px' }}>{cat.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{cat.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '12px' }}>{cat.desc}</div>
            <span className={`badge ${cat.badge === 'Coming Soon' ? 'coming' : 'envi'}`}>{cat.badge}</span>
          </div>
        ))}
      </div>

      {/* Featured */}
      <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: 400, color: 'var(--w)' }}>
          Featured <span style={{ color: 'var(--pink)' }}>Pieces</span>
        </div>
        <button className="ghost-btn" onClick={() => setTool('envi')}>View all →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {ENVI_PRODUCTS.slice(0, 4).map(p => (
          <div key={p.id} className="product-card">
            <div style={{ height: '180px', background: 'linear-gradient(135deg, #1e0810, #2a0818)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                <div style={{ textAlign: 'center', opacity: 0.3 }}><div style={{ fontSize: '40px' }}>✦</div></div>
              )}
              <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                <span className="badge envi">{p.badge}</span>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--w)', marginBottom: '2px' }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '8px' }}>{p.category}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--pink)' }}>${p.price}</div>
                <button className="pink-btn" style={{ fontSize: '10px', padding: '6px 12px' }}>Shop →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ENVI LEE COLLECTION ───────────────────────────────────────
function EnviCollection() {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Clothing', 'Accessories', 'Lifestyle', 'Digital']
  const filtered = filter === 'All' ? ENVI_PRODUCTS : ENVI_PRODUCTS.filter(p => p.category === filter)

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)' }}>
            Envi Lee <span style={{ color: 'var(--pink)' }}>Collection</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginTop: '4px' }}>Exclusive designs — real and AI-generated pieces curated by Envi Lee</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' as const, marginTop: '16px' }}>
        {categories.map(c => (
          <button key={c} className={`nav-tab ${filter === c ? 'active' : 'inactive'}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card accent" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.2 }}>✦</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--pink)', marginBottom: '8px' }}>Collection dropping soon</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Envi Lee is curating the collection. Check back soon.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filtered.map(p => (
            <div key={p.id} className="product-card">
              <div style={{ height: '220px', background: 'linear-gradient(135deg, #1e0810, #2a0818)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                  <div style={{ textAlign: 'center', opacity: 0.2 }}><div style={{ fontSize: '48px' }}>✦</div><div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '8px' }}>Photo coming soon</div></div>
                )}
                <div style={{ position: 'absolute', top: '8px', left: '8px' }}><span className="badge envi">{p.badge}</span></div>
              </div>
              <div style={{ padding: '14px' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--w)', marginBottom: '3px' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '8px', lineHeight: '1.5' }}>{p.desc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--pink)' }}>${p.price}</div>
                  <button className="pink-btn" style={{ fontSize: '11px', padding: '8px 16px' }}>Shop →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── STUDENT POD SHOP ──────────────────────────────────────────
function StudentPOD({ setTool }: { setTool: (t: StoreTool) => void }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'T-Shirt', 'Hoodie', 'Mug', 'Bag', 'Phone Case', 'Leggings']
  const filtered = filter === 'All' ? POD_PRODUCTS : POD_PRODUCTS.filter(p => p.category === filter)

  return (
    <div className="pg-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)' }}>
            Student <span style={{ color: 'var(--pink)' }}>POD Shop</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginTop: '4px' }}>Print-on-demand products created by Envi Lee students — all approved by Envi Lee</div>
        </div>
        <button className="pink-btn" onClick={() => setTool('submit')} style={{ fontSize: '12px', padding: '9px 16px', flexShrink: 0 }}>
          + List Your Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {categories.map(c => (
          <button key={c} className={`nav-tab ${filter === c ? 'active' : 'inactive'}`} onClick={() => setFilter(c)} style={{ fontSize: '11px' }}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {filtered.map(p => (
          <div key={p.id} className="product-card">
            <div style={{ height: '200px', background: 'linear-gradient(135deg, #1e0810, #2a0818)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                <div style={{ textAlign: 'center', opacity: 0.2 }}><div style={{ fontSize: '40px' }}>◈</div></div>
              )}
              <div style={{ position: 'absolute', top: '8px', left: '8px' }}><span className="badge live">Live</span></div>
              <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', padding: '2px 7px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{p.platform}</div>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--w)', marginBottom: '2px' }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '8px' }}>by {p.seller}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--pink)' }}>${p.price}</div>
                <a href={p.link} target="_blank" rel="noreferrer" className="pink-btn" style={{ fontSize: '11px', padding: '7px 14px', textDecoration: 'none', display: 'inline-block' }}>
                  Shop on {p.platform} →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card accent" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>◈</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No products in this category yet</div>
        </div>
      )}
    </div>
  )
}

// ── SUBMIT LISTING ────────────────────────────────────────────
function SubmitListing({ setTool }: { setTool: (t: StoreTool) => void }) {
  const { user } = useUser()
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('T-Shirt')
  const [platform, setPlatform] = useState('Etsy')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    if (!productName.trim() || !link.trim()) { alert('Please add a product name and shop link'); return }
    const pending = JSON.parse(localStorage.getItem('pendingListings') || '[]')
    pending.unshift({
      id: Date.now(),
      productName, price, category, platform, link, description,
      image, seller: user?.firstName || 'Creator',
      email: user?.emailAddresses?.[0]?.emailAddress || '',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    })
    localStorage.setItem('pendingListings', JSON.stringify(pending))
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="pg-in">
      <div className="card accent" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✦</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--pink)', marginBottom: '10px' }}>Submitted!</div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '24px' }}>
          Your listing has been submitted for review. Envi Lee will review and approve it before it goes live in the store. You'll be notified when it's approved.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="pink-btn" onClick={() => { setSubmitted(false); setProductName(''); setPrice(''); setLink(''); setDescription(''); setImage(null) }}>Submit Another</button>
          <button className="ghost-btn" onClick={() => setTool('pod')}>View Store →</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
        List Your <span style={{ color: 'var(--pink)' }}>Product</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px' }}>Submit your POD product for review. Envi Lee approves all listings before they go live.</div>
      <div style={{ background: 'var(--pink3)', border: '0.5px solid var(--pb)', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '11px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>
        ✦ Must be an Envi Lee student · All listings reviewed before going live · Physical and digital products welcome
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Product details</div>
            <F label="Product name"><input className="finp" placeholder="e.g. Baddie Era Graphic Tee" value={productName} onChange={e => setProductName(e.target.value)} /></F>
            <F label="Price"><input className="finp" placeholder="e.g. 35" value={price} onChange={e => setPrice(e.target.value)} type="number" /></F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <F label="Category">
                <select className="fsel" value={category} onChange={e => setCategory(e.target.value)}>
                  {['T-Shirt', 'Hoodie', 'Sweatshirt', 'Leggings', 'Swimsuit', 'Hat', 'Bag', 'Phone Case', 'Mug', 'Laptop Sleeve', 'Pajamas', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Platform">
                <select className="fsel" value={platform} onChange={e => setPlatform(e.target.value)}>
                  {['Etsy', 'Shopify', 'Amazon', 'TikTok Shop', 'WooCommerce', 'Other'].map(p => <option key={p}>{p}</option>)}
                </select>
              </F>
            </div>
            <F label="Your shop link"><input className="finp" placeholder="https://etsy.com/shop/yourshop/listing/..." value={link} onChange={e => setLink(e.target.value)} /></F>
            <F label="Product description"><textarea className="fta" placeholder="Describe your product — material, colors, sizing, what makes it special..." value={description} onChange={e => setDescription(e.target.value)} /></F>
          </div>
          <button className="pink-btn" onClick={submit} style={{ width: '100%' }}>
            Submit for Review ↗
          </button>
        </div>
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Product photo</div>
            <DragDrop label="Drag your product photo" sub="Clear, high quality photo · Square preferred" currentImage={image} onImage={setImage} onClear={() => setImage(null)} height={200} />
          </div>
          <div className="card">
            <div className="ftitle">Listing guidelines</div>
            {[
              ['Must be a student', 'Only enrolled Envi Lee students can list products'],
              ['Your own designs only', 'No reselling — only original designs you created'],
              ['High quality photos', 'Clear product photos only — no blurry or watermarked images'],
              ['Accurate pricing', 'List the actual price customers pay on your platform'],
              ['Working links only', 'Your shop link must be live and working'],
              ['Review takes 24-48hrs', 'Envi Lee reviews all listings before they go live'],
            ].map(([t, d]) => (
              <div key={t} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--pink)', marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.4' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── LIFESTYLE STORE ───────────────────────────────────────────
function LifestyleStore() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
        Lifestyle <span style={{ color: 'var(--pink)' }}>Store</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Houses, rooms, cars, and props for styling your AI twin.</div>

      <div style={{ background: 'var(--pink3)', border: '0.5px solid var(--pb)', borderRadius: '14px', padding: '32px', textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: 'var(--w)', marginBottom: '8px' }}>
          Coming <span style={{ color: 'var(--pink)' }}>Soon</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '400px', margin: '0 auto' }}>
          Envi Lee is building the lifestyle collection — luxury homes, exotic cars, and premium props for your AI twin content.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {['Luxury Houses', 'Dream Cars', 'Designer Furniture', 'Exotic Locations', 'Luxury Accessories', 'Private Jets'].map(cat => (
          <div key={cat} className="card" style={{ textAlign: 'center', opacity: 0.4, cursor: 'not-allowed' }}>
            <div style={{ height: '100px', background: 'linear-gradient(135deg, #1e0810, #2a0818)', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '32px', opacity: 0.3 }}>🔒</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w2)' }}>{cat}</div>
            <span className="badge coming" style={{ marginTop: '8px', display: 'inline-flex' }}>Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── UGC SHOPPING ──────────────────────────────────────────────
function UGCShopping() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
        UGC <span style={{ color: 'var(--pink)' }}>Shopping</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Shop products to feature in your UGC content — all major platforms in one place.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {UGC_STORES.map(store => (
          <a key={store.name} href={store.url} target="_blank" rel="noreferrer" className="social-card" style={{ textDecoration: 'none' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${store.color}22`, border: `0.5px solid ${store.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
              {store.icon}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--w)', marginBottom: '2px' }}>{store.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{store.desc}</div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'var(--pink)', fontSize: '16px', flexShrink: 0 }}>→</div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── SOCIAL MEDIA ──────────────────────────────────────────────
function SocialMedia() {
  const { user } = useUser()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === adminId
  const [socials, setSocials] = useState<Array<{ id: number; platform: string; handle: string; url: string; icon: string }>>([])
  const [platform, setPlatform] = useState('Instagram')
  const [handle, setHandle] = useState('')
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('enviSocials') || '[]')
    if (saved.length > 0) setSocials(saved)
    else setSocials([
      { id: 1, platform: 'Instagram', handle: '@envi.lee', url: 'https://instagram.com/envi.lee', icon: '📸' },
      { id: 2, platform: 'TikTok', handle: '@envilee', url: 'https://tiktok.com/@envilee', icon: '🎵' },
      { id: 3, platform: 'Skool', handle: 'Envi Lee Academy', url: 'https://skool.com', icon: '🎓' },
    ])
  }, [])

  function save() {
    if (!handle.trim() || !url.trim()) return
    const icons: Record<string, string> = { Instagram: '📸', TikTok: '🎵', YouTube: '▶️', Twitter: '✕', Facebook: '👥', Pinterest: '📌', Skool: '🎓', Linktree: '🌿', Discord: '💬', LinkedIn: '💼', Other: '🔗' }
    const updated = [...socials, { id: Date.now(), platform, handle, url, icon: icons[platform] ?? '🔗' }]
    setSocials(updated)
    localStorage.setItem('enviSocials', JSON.stringify(updated))
    setHandle(''); setUrl('')
  }

  function remove(id: number) {
    const updated = socials.filter(s => s.id !== id)
    setSocials(updated)
    localStorage.setItem('enviSocials', JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
        Connect with <span style={{ color: 'var(--pink)' }}>Envi Lee</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Follow all Envi Lee platforms and stay connected to the empire.</div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin && editing ? '1fr 1fr' : '1fr', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' }}>
            {socials.map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="social-card">
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--pink3)', border: '0.5px solid var(--pb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pink)' }}>{s.platform}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>{s.handle}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--pink)', fontSize: '16px', flexShrink: 0 }}>→</div>
                {isAdmin && editing && (
                  <button onClick={e => { e.preventDefault(); e.stopPropagation(); remove(s.id) }} className="del-btn" style={{ flexShrink: 0 }}>✕</button>
                )}
              </a>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setEditing(!editing)} className="ghost-btn">
              {editing ? 'Done editing' : '+ Manage social links'}
            </button>
          )}
        </div>

        {isAdmin && editing && (
          <div className="card hi">
            <div className="ftitle">Add social media link</div>
            <F label="Platform">
              <select className="fsel" value={platform} onChange={e => setPlatform(e.target.value)}>
                {['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'Pinterest', 'Skool', 'Linktree', 'Discord', 'LinkedIn', 'Other'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Handle or display name"><input className="finp" placeholder="e.g. @envilee" value={handle} onChange={e => setHandle(e.target.value)} /></F>
            <F label="Full URL"><input className="finp" placeholder="https://instagram.com/envilee" value={url} onChange={e => setUrl(e.target.value)} /></F>
            <button className="pink-btn" onClick={save} style={{ width: '100%' }}>Add Link ↗</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ADMIN PANEL ───────────────────────────────────────────────
function StoreAdmin() {
  const { user } = useUser()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === adminId
  const [pending, setPending] = useState<Array<Record<string, string>>>([])
  const [approved, setApproved] = useState<Array<Record<string, string>>>([])

  useEffect(() => {
    setPending(JSON.parse(localStorage.getItem('pendingListings') || '[]'))
    setApproved(JSON.parse(localStorage.getItem('approvedListings') || '[]'))
  }, [])

  function approve(item: Record<string, string>) {
    const newPending = pending.filter(p => p.id !== item.id)
    const newApproved = [{ ...item, status: 'approved', approvedAt: new Date().toISOString() }, ...approved]
    setPending(newPending); setApproved(newApproved)
    localStorage.setItem('pendingListings', JSON.stringify(newPending))
    localStorage.setItem('approvedListings', JSON.stringify(newApproved))
  }

  function reject(id: string) {
    const updated = pending.filter(p => p.id !== id)
    setPending(updated); localStorage.setItem('pendingListings', JSON.stringify(updated))
  }

  function removeApproved(id: string) {
    const updated = approved.filter(a => a.id !== id)
    setApproved(updated); localStorage.setItem('approvedListings', JSON.stringify(updated))
  }

  if (!isAdmin) return (
    <div className="pg-in">
      <div className="card accent" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--pink)', marginBottom: '8px' }}>Admin Access Only</div>
        <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>This section is restricted to Envi Lee.</div>
      </div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Store <span style={{ color: 'var(--pink)' }}>Admin</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Review and approve student product listings.</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Pending Review', value: String(pending.length), color: '#ffe600' },
          { label: 'Approved Live', value: String(approved.length), color: '#00ff88' },
          { label: 'Total Products', value: String(pending.length + approved.length), color: 'var(--pink)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending listings */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#ffe600', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Pending Review — {pending.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {pending.map(item => (
              <div key={item.id} className="card hi" style={{ display: 'grid', gridTemplateColumns: item.image ? '80px 1fr auto' : '1fr auto', gap: '14px', alignItems: 'center' }}>
                {item.image && <img src={item.image} alt={item.productName} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />}
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '2px' }}>{item.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '4px' }}>by {item.seller} · {item.platform} · ${item.price} · {item.category}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '4px' }}>{item.description?.slice(0, 80)}...</div>
                  <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>{item.link?.slice(0, 50)}…</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                  <button className="pink-btn" onClick={() => approve(item)} style={{ fontSize: '11px', padding: '7px 14px' }}>✓ Approve</button>
                  <button className="del-btn" onClick={() => reject(item.id)} style={{ fontSize: '11px', padding: '7px 14px' }}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved listings */}
      {approved.length > 0 && (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Approved & Live — {approved.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {approved.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--s1)', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--w)', marginRight: '8px' }}>{item.productName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--mu3)' }}>by {item.seller} · {item.platform}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge live">Live</span>
                  <button className="del-btn" onClick={() => removeApproved(item.id)} style={{ fontSize: '10px' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>◈</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No listings submitted yet</div>
        </div>
      )}
    </div>
  )
}

// ── SIDEBAR NAV ───────────────────────────────────────────────
const NAV: { tool: StoreTool; label: string; icon: string }[] = [
  { tool: 'home', label: 'Store Home', icon: '✦' },
  { tool: 'envi', label: 'Envi Lee Collection', icon: '◉' },
  { tool: 'pod', label: 'Student POD Shop', icon: '◈' },
  { tool: 'lifestyle', label: 'Lifestyle Store', icon: '⊹' },
  { tool: 'ugc', label: 'UGC Shopping', icon: '⊳' },
  { tool: 'social', label: 'Connect with Envi Lee', icon: '★' },
  { tool: 'submit', label: 'List Your Product', icon: '+' },
  { tool: 'admin', label: 'Admin', icon: '⊗' },
]

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function StorePage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<StoreTool>('home')
  const [hovered, setHovered] = useState<StoreTool | null>(null)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* SIDEBAR */}
        <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(255,45,120,0.12)', padding: 0, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(255,45,120,0.1)' }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
              <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
            </button>
            {/* Pink ombré logo */}
            <div style={{ padding: '12px', background: 'var(--pink3)', border: '0.5px solid var(--pb)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '8px', color: 'rgba(255,45,120,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>Envi Lee</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '18px', fontWeight: 400, background: 'var(--ombre)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>Virtual Store™</div>
            </div>
          </div>

          {/* User profile */}
          {user && (
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(255,45,120,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--pink3)', borderRadius: '8px', border: '0.5px solid var(--pb)' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Shopper'}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,45,120,0.5)', fontFamily: "'DM Mono',monospace" }}>Envi Lee Store</div>
                </div>
                <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
              </div>
            </div>
          )}

          {/* Nav */}
          <div style={{ padding: '10px', flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Shop</div>
            {NAV.map(({ tool, label, icon }) => (
              <button key={tool} onClick={() => setActive(tool)}
                onMouseEnter={() => setHovered(tool)}
                onMouseLeave={() => setHovered(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'var(--pb)' : 'transparent'}`, background: active === tool ? 'var(--pink3)' : hovered === tool ? 'rgba(255,45,120,0.03)' : 'none', color: active === tool ? 'var(--pink)' : hovered === tool ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Bottom */}
          <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(255,45,120,0.1)' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--pink3)', borderRadius: '8px', border: '0.5px solid var(--pb)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace", marginBottom: '4px' }}>Envi Lee Empire</div>
              <div style={{ fontSize: '9px', color: 'var(--mu3)' }}>envileecreatorstudios.com</div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'radial-gradient(ellipse at 80% 0%, rgba(255,45,120,0.04) 0%, transparent 50%)' }}>
          {active === 'home' && <StoreHome setTool={setActive} />}
          {active === 'envi' && <EnviCollection />}
          {active === 'pod' && <StudentPOD setTool={setActive} />}
          {active === 'lifestyle' && <LifestyleStore />}
          {active === 'ugc' && <UGCShopping />}
          {active === 'social' && <SocialMedia />}
          {active === 'submit' && <SubmitListing setTool={setActive} />}
          {active === 'admin' && <StoreAdmin />}
        </main>
      </div>
    </>
  )
}
