'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type PodTool = 'dashboard' | 'design' | 'mystore' | 'products' | 'marketplace' | 'listings' | 'bot'

// ── STYLES ─────────────────────────────────────────────────────
const css = `
  :root {
    --bg:#000;--bg2:#05000a;--bg3:#0a0005;--s1:#110008;--s2:#1a000f;
    --w:#fff8ff;--w2:#f0d0e0;--mu:#442233;--mu2:#663344;--mu3:#885566;
    --red:#ff2255;--red2:#ff5577;--red3:#ff88aa;
    --orange:#ff6600;--gold:#d4a843;--purple:#7b3fa0;
    --pb:rgba(255,34,85,0.4);--rb:rgba(255,34,85,0.15);
    --pg:rgba(255,34,85,0.06);
    --pod:linear-gradient(135deg,#ff2255,#ff4400,#ff6600,#ff8800,#ffaa00,#ffcc00);
    --pod2:linear-gradient(135deg,#ff0000,#ff6600,#ffcc00,#00cc44,#0088ff,#8833ff,#ff0088);
    --pod-soft:linear-gradient(135deg,rgba(255,34,85,0.15),rgba(255,102,0,0.15),rgba(255,204,0,0.15));
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:var(--bg);color:var(--w);font-family:'DM Sans',sans-serif;min-height:100vh;}
  select,input,textarea{color-scheme:dark;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#330011;border-radius:2px;}

  @keyframes lbar{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes botPop{from{opacity:0;transform:translateY(10px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}

  .pg-in{animation:pgIn .4s ease;}
  .lbar{height:2px;background:var(--s2);overflow:hidden;border-radius:1px;}
  .lbar-fill{height:100%;background:linear-gradient(135deg,#ff0000,#ff6600,#ffcc00,#00cc44,#0088ff,#8833ff,#ff0088);background-size:200% 100%;animation:lbar 2s linear infinite;}

  /* ── CARDS ── */
  .card{background:var(--s1);border:0.5px solid rgba(255,34,85,0.15);border-radius:12px;padding:16px;}
  .card.hi{border-color:rgba(255,34,85,0.3);}
  .card.gold{border-color:rgba(212,168,67,0.3);background:rgba(212,168,67,0.04);}

  /* ── FORM ── */
  .ftitle{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;color:var(--red2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid rgba(255,34,85,0.1);}
  .flabel{font-size:9px;font-weight:600;color:var(--mu3);text-transform:uppercase;letter-spacing:.7px;font-family:'DM Mono',monospace;display:block;margin-bottom:5px;}
  .finp{background:var(--bg3);border:0.5px solid rgba(255,34,85,0.2);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;}
  .finp:focus{border-color:rgba(255,34,85,0.5);}
  .fsel{background:var(--bg3);border:0.5px solid rgba(255,34,85,0.2);border-radius:7px;padding:8px 10px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;}
  .fta{background:var(--bg3);border:0.5px solid rgba(255,34,85,0.2);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;resize:vertical;min-height:80px;line-height:1.6;}

  /* ── BUTTONS ── */
  .pod-btn{padding:11px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,#ff0000,#ff6600,#ffcc00,#00cc44,#0088ff,#8833ff,#ff0088);color:#fff;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 0 20px rgba(255,68,0,0.3);}
  .pod-btn:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(255,34,85,0.3);}
  .pod-btn:disabled{opacity:0.5;cursor:default;transform:none;}
  .ghost-pod{padding:7px 14px;border-radius:8px;font-size:11px;cursor:pointer;border:0.5px solid var(--pb);background:transparent;color:var(--red2);font-family:'DM Sans',sans-serif;transition:all .2s;}
  .ghost-pod:hover{background:var(--pg);}

  /* ── TAGS ── */
  .tag-r{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--pg);color:var(--red2);border:0.5px solid var(--pb);}

  /* ── TOP NAV ── */
  .top-nav{position:sticky;top:0;z-index:100;background:rgba(0,0,0,0.95);border-bottom:0.5px solid rgba(255,34,85,0.15);backdrop-filter:blur(12px);}
  .nav-tabs{display:flex;gap:2px;padding:0 20px;overflow-x:auto;scrollbar-width:none;}
  .nav-tabs::-webkit-scrollbar{display:none;}
  .nav-tab{padding:12px 16px;font-size:12px;cursor:pointer;border:none;background:transparent;color:var(--mu3);font-family:'DM Sans',sans-serif;white-space:nowrap;transition:all .2s;border-bottom:2px solid transparent;font-weight:500;}
  .nav-tab:hover{color:var(--red2);}
  .nav-tab.active{color:#ff6600;border-bottom-color:#ff6600;font-weight:700;background:linear-gradient(135deg,rgba(255,34,85,0.05),rgba(255,170,0,0.05));}

  /* ── FOOTER ── */
  .pod-footer{background:var(--bg2);border-top:0.5px solid rgba(255,34,85,0.1);padding:16px 24px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between;}
  .footer-link{font-size:11px;color:var(--mu3);text-decoration:none;font-family:'DM Mono',monospace;transition:color .15s;}
  .footer-link:hover{color:var(--red2);}

  /* ── BOT ── */
  .bot-fab{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#ff2255,#ff6600,#ffaa00);border:none;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(255,34,85,0.4);z-index:200;transition:all .2s;}
  .bot-fab:hover{transform:scale(1.1);}
  .bot-panel{position:fixed;bottom:86px;right:24px;width:360px;background:var(--s1);border:0.5px solid rgba(255,34,85,0.3);border-radius:16px;z-index:200;animation:botPop .2s ease;box-shadow:0 8px 40px rgba(255,34,85,0.15);}
  @media(max-width:500px){.bot-panel{width:calc(100vw - 32px);right:16px;}}

  /* ── PRODUCT CARD ── */
  .product-card{background:var(--s1);border:0.5px solid rgba(255,34,85,0.15);border-radius:12px;overflow:hidden;transition:all .25s;cursor:pointer;}
  .product-card:hover{border-color:rgba(255,34,85,0.4);transform:translateY(-3px);box-shadow:0 8px 30px rgba(255,34,85,0.1);}

  /* ── STORE CARD ── */
  .store-card{background:var(--s1);border:0.5px solid rgba(255,34,85,0.15);border-radius:14px;overflow:hidden;transition:all .25s;}
  .store-card:hover{border-color:rgba(255,34,85,0.35);box-shadow:0 8px 30px rgba(255,34,85,0.08);}
`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

// ── ACCESS GATE ────────────────────────────────────────────────
function AccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading')
  useEffect(() => {
    async function check() {
      if (!user) { setStatus('denied'); return }
      try {
        const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
        if (user.id === adminId) { setStatus('granted'); return }
        const email = user.emailAddresses?.[0]?.emailAddress ?? ''
        const res = await fetch(`/api/access/realism?userId=${user.id}&email=${encodeURIComponent(email)}`)
        const data = await res.json()
        setStatus(data.hasAccess ? 'granted' : 'denied')
      } catch { setStatus('denied') }
    }
    check()
  }, [user])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="lbar" style={{ width: '120px', margin: '0 auto 12px' }}><div className="lbar-fill" /></div>
        <div style={{ fontSize: '12px', color: 'rgba(255,34,85,0.4)', fontFamily: "'DM Mono',monospace" }}>Verifying access...</div>
      </div>
    </div>
  )

  if (status === 'denied') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,34,85,0.4)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>Envi Lee Creator Studios</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', color: '#fff', marginBottom: '6px' }}>POD Studios™</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Choose your access level to unlock this app</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div style={{ background: '#0d0005', border: '1px solid rgba(255,34,85,0.3)', borderRadius: '16px', padding: '24px', position: 'relative' as const, overflow: 'hidden' }}>
            <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: '3px', background: 'var(--pod)' }} />
            <div style={{ fontSize: '10px', color: 'rgba(255,34,85,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontFamily: "'DM Mono',monospace" }}>Member</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--red)', marginBottom: '4px', fontFamily: "'Syne',sans-serif" }}>$47<span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,34,85,0.5)' }}>/mo</span></div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Full access to all 12 apps</div>
            <a href="/api/stripe/checkout?plan=member" style={{ display: 'block', padding: '11px', borderRadius: '9px', background: 'var(--pod)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>Get Access →</a>
          </div>
          <div style={{ background: '#0d0005', border: '1px solid rgba(212,168,67,0.4)', borderRadius: '16px', padding: '24px', position: 'relative' as const, overflow: 'hidden' }}>
            <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(135deg,#D4A843,#F5E0A0)' }} />
            <div style={{ position: 'absolute' as const, top: '14px', right: '14px', background: 'linear-gradient(135deg,#D4A843,#F5E0A0)', color: '#000', fontSize: '9px', fontWeight: 800, padding: '3px 9px', borderRadius: '20px', fontFamily: "'DM Mono',monospace" }}>BEST VALUE</div>
            <div style={{ fontSize: '10px', color: 'rgba(212,168,67,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontFamily: "'DM Mono',monospace" }}>VIP</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#D4A843', marginBottom: '4px', fontFamily: "'Syne',sans-serif" }}>$65<span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(212,168,67,0.5)' }}>/mo</span></div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Everything + VIP perks</div>
            <a href="/api/stripe/checkout?plan=vip" style={{ display: 'block', padding: '11px', borderRadius: '9px', background: 'linear-gradient(135deg,#D4A843,#F5E0A0)', color: '#000', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>Get VIP →</a>
          </div>
        </div>
        <div style={{ background: 'rgba(255,34,85,0.05)', border: '0.5px solid rgba(255,34,85,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,34,85,0.7)', marginBottom: '8px', fontWeight: 600 }}>Already enrolled in an academy?</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Sign in with the same email you enrolled with.</div>
        </div>
      </div>
    </div>
  )
  return <>{children}</>
}

// ── POD BOT ────────────────────────────────────────────────────
function PodBot({ inline = false }: { inline?: boolean }) {
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([
    { role: 'bot', text: 'Hey! I\'m your POD business assistant. Ask me anything about mockups, listings, pricing, Printful, Printify, Etsy, TikTok Shop, or growing your POD business!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send() {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          messages: [{ role: 'user', content: `You are Envi Lee's POD (Print on Demand) business assistant inside Envi Lee Creator Studios. Help with: mockup creation, product listings, Etsy/Shopify/Amazon/TikTok Shop strategy, pricing strategy, design tips, Printful and Printify specifics, marketing POD products, and growing a POD business. Be specific, practical, and encouraging. Question: ${userMsg}` }],
        }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'bot', text: data.content?.[0]?.text || 'Let me help you with that!' }])
    } catch { setMsgs(prev => [...prev, { role: 'bot', text: 'Having trouble connecting — try again!' }]) }
    setLoading(false)
  }

  const containerStyle = inline
    ? { display: 'flex', flexDirection: 'column' as const, height: '600px' }
    : { display: 'flex', flexDirection: 'column' as const, height: '440px' }

  return (
    <div style={containerStyle}>
      {inline && (
        <div style={{ padding: '20px 20px 0', marginBottom: '16px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
            POD <span style={{ color: 'var(--red)' }}>Business Bot™</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Ask anything about POD business, mockups, listings, pricing, and growing your store.</div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: inline ? '0 20px' : '16px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? 'var(--pod)' : 'var(--s2)', fontSize: '12px', lineHeight: '1.6', color: m.role === 'user' ? '#fff' : 'var(--w2)' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: 'var(--s2)' }}>
              <div className="lbar" style={{ width: '60px' }}><div className="lbar-fill" /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: inline ? '12px 20px 20px' : '12px 16px', borderTop: '0.5px solid rgba(255,34,85,0.1)', display: 'flex', gap: '8px' }}>
        <input className="finp" placeholder="Ask about POD business..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1 }} />
        <button className="pod-btn" onClick={send} disabled={loading || !input.trim()} style={{ padding: '9px 16px', fontSize: '12px' }}>Send</button>
      </div>
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────
function Dashboard({ setActive }: { setActive: (t: PodTool) => void }) {
  const { user } = useUser()
  const tools = [
    { id: 'design', icon: '🎨', label: 'Design Studio', desc: 'AI mockups + exact Printful/Printify mockups', color: '#ff2255' },
    { id: 'mystore', icon: '🏪', label: 'My Store', desc: 'Create or connect your POD store', color: '#ff5577' },
    { id: 'products', icon: '📦', label: 'My Products', desc: 'Manage your product listings', color: '#ff7733' },
    { id: 'marketplace', icon: '🛒', label: 'Marketplace', desc: 'Browse all student stores', color: '#cc0044' },
    { id: 'listings', icon: '✍️', label: 'Listing Writer', desc: 'AI product titles, descriptions, SEO', color: '#ff2255' },
    { id: 'bot', icon: '🤖', label: 'POD Bot', desc: 'Your POD business assistant', color: '#aa0033' },
  ]

  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,34,85,0.4)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>Welcome back</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          POD <span style={{ background: 'linear-gradient(135deg,#ff0000,#ff6600,#ffcc00,#00cc44,#0088ff,#8833ff,#ff0088)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studios™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Your complete print-on-demand business studio — design, store, sell.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {tools.map(t => (
          <div key={t.id} onClick={() => setActive(t.id as PodTool)}
            className="card" style={{ cursor: 'pointer', transition: 'all .25s', padding: '20px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${t.color}50`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,34,85,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{t.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{t.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>{t.desc}</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: t.color }}>Open → </div>
          </div>
        ))}
      </div>

      <div className="card gold" style={{ padding: '20px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(212,168,67,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>Quick Links</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
          {[['Printful', 'https://printful.com'], ['Printify', 'https://printify.com'], ['Etsy', 'https://etsy.com'], ['TikTok Shop', 'https://shop.tiktok.com'], ['Canva', 'https://canva.com'], ['Placeit', 'https://placeit.net']].map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '11px', background: 'rgba(212,168,67,0.08)', border: '0.5px solid rgba(212,168,67,0.2)', color: 'var(--gold)', textDecoration: 'none', transition: 'all .15s' }}>
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── DESIGN STUDIO ──────────────────────────────────────────────
function DesignStudio() {
  const [mode, setMode] = useState<'ai' | 'exact'>('exact')
  const [designImage, setDesignImage] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<{id: number; name: string; icon: string} | null>(null)
  const [variants, setVariants] = useState<Record<string, unknown>[]>([])
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [placement, setPlacement] = useState('front')
  const [mockupImages, setMockupImages] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [polling, setPolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('All')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('fashion')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const PF_POPULAR = [
    { id: 189, name: 'All-Over Print Leggings', icon: '🩱', category: 'Bottoms' },
    { id: 200, name: 'All-Over Print Crop Top', icon: '👚', category: 'Tops' },
    { id: 303, name: 'All-Over Print Crop Tee', icon: '👕', category: 'Tops' },
    { id: 198, name: 'All-Over Print Bodycon Dress', icon: '👗', category: 'Dresses' },
    { id: 589, name: 'All-Over Print Midi Dress', icon: '👗', category: 'Dresses' },
    { id: 83, name: 'All-Over Print Pillow', icon: '🛋️', category: 'Home' },
    { id: 279, name: 'All-Over Print Backpack', icon: '🎒', category: 'Bags' },
    { id: 465, name: 'All-Over Print Duffle Bag', icon: '👜', category: 'Bags' },
    { id: 507, name: 'All-Over Print Biker Shorts', icon: '🩳', category: 'Bottoms' },
    { id: 477, name: 'All-Over Print Sports Bra', icon: '👙', category: 'Tops' },
    { id: 924, name: 'Custom Area Rug', icon: '🪞', category: 'Home' },
  ]
  const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Bags', 'Home']
  const filtered = category === 'All' ? PF_POPULAR : PF_POPULAR.filter(p => p.category === category)

  function handleDesignUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => setDesignImage(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function loadVariants(product: { id: number; name: string; icon: string }) {
    setSelectedProduct(product); setVariants([]); setSelectedVariant(null)
    setLoading(true); setStatus('Loading variants...')
    try {
      const res = await fetch(`/api/generate/printful-catalog?action=variants&productId=${product.id}`)
      const data = await res.json()
      const v = data.variants || []
      setVariants(v)
      if (v.length > 0) setSelectedVariant((v[0] as Record<string, unknown>).id as number)
      setStatus(v.length + ' variants loaded')
    } catch (e) { setStatus('Error: ' + (e as Error).message) }
    setLoading(false)
  }

  async function generateExactMockup() {
    if (!selectedVariant || !selectedProduct) { setStatus('Select a product and variant'); return }
    if (!designImage) { setStatus('Upload your design first'); return }
    setGenerating(true); setMockupImages([])
    try {
      setStatus('Uploading design...')
      const uploadRes = await fetch('/api/generate/printful-mockup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload_design', imageBase64: designImage }),
      })
      const uploadData = await uploadRes.json()
      if (uploadData.error) { setStatus('Upload error: ' + uploadData.error); setGenerating(false); return }
      setStatus('Generating mockup with Printful...')
      const res = await fetch('/api/generate/printful-mockup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_mockup', productId: selectedProduct.id, variantId: selectedVariant, imageUrl: uploadData.imageUrl, placement }),
      })
      const data = await res.json()
      if (data.taskKey) {
        setPolling(true); setStatus('Printful processing...')
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 3000))
          const poll = await fetch('/api/generate/printful-mockup', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_result', taskKey: data.taskKey }),
          })
          const pd = await poll.json()
          if (pd.status === 'completed' && pd.mockups?.length > 0) {
            setMockupImages(pd.mockups); setPolling(false); setStatus('Mockup ready!'); break
          }
          setStatus('Processing... ' + (i + 1) + '/20')
        }
      } else { setStatus('Error: ' + (data.error || 'No task key')) }
    } catch (e) { setStatus('Error: ' + (e as Error).message) }
    setGenerating(false)
  }

  async function generateAIMockup() {
    if (!prompt.trim()) { setStatus('Enter a prompt first'); return }
    setImageLoading(true); setImageUrl(null)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size: 'portrait' }),
      })
      const data = await res.json()
      if (data.imageUrl) setImageUrl(data.imageUrl)
      else setStatus('Error: ' + (data.error || 'No image returned'))
    } catch (e) { setStatus('Error: ' + (e as Error).message) }
    setImageLoading(false)
  }

  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          Design <span style={{ color: 'var(--red)' }}>Studio</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '16px' }}>Generate AI mockups or place your exact design on real Printful products.</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMode('exact')} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${mode === 'exact' ? 'rgba(255,34,85,0.5)' : 'rgba(255,34,85,0.15)'}`, background: mode === 'exact' ? 'rgba(255,34,85,0.1)' : 'transparent', color: mode === 'exact' ? 'var(--red)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            🎯 Exact Mockup (Printful)
          </button>
          <button onClick={() => setMode('ai')} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${mode === 'ai' ? 'rgba(255,34,85,0.5)' : 'rgba(255,34,85,0.15)'}`, background: mode === 'ai' ? 'rgba(255,34,85,0.1)' : 'transparent', color: mode === 'ai' ? 'var(--red)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            🤖 AI Lifestyle Mockup
          </button>
        </div>
      </div>

      {mode === 'exact' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          <div>
            <div className="card hi" style={{ marginBottom: '12px' }}>
              <div className="ftitle">1 — Upload Design</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDesignUpload} />
              <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed rgba(255,34,85,0.25)', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg3)', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {designImage ? <img src={designImage} alt="design" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }} /> : <div><div style={{ fontSize: '24px', opacity: 0.3 }}>🎨</div><div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '6px' }}>Click to upload pattern</div></div>}
              </div>
              {designImage && <button onClick={() => setDesignImage(null)} style={{ fontSize: '10px', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>✕ Remove</button>}
            </div>

            <div className="card hi" style={{ marginBottom: '12px' }}>
              <div className="ftitle">2 — Select Product</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginBottom: '8px' }}>
                {categories.map(c => <button key={c} onClick={() => setCategory(c)} style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', border: `0.5px solid ${category === c ? 'rgba(255,34,85,0.5)' : 'rgba(255,34,85,0.15)'}`, background: category === c ? 'rgba(255,34,85,0.1)' : 'transparent', color: category === c ? 'var(--red)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>{c}</button>)}
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column' as const, gap: '3px' }}>
                {filtered.map(p => <div key={p.id} onClick={() => loadVariants(p)} style={{ padding: '7px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '7px', alignItems: 'center', border: `0.5px solid ${selectedProduct?.id === p.id ? 'rgba(255,34,85,0.4)' : 'rgba(255,34,85,0.08)'}`, background: selectedProduct?.id === p.id ? 'rgba(255,34,85,0.08)' : 'var(--bg3)' }}><span>{p.icon}</span><div style={{ fontSize: '11px', color: selectedProduct?.id === p.id ? 'var(--red)' : 'var(--w2)' }}>{p.name}</div></div>)}
              </div>
              {loading && <div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '6px', textAlign: 'center' }}>Loading...</div>}
            </div>

            {variants.length > 0 && (
              <div className="card hi" style={{ marginBottom: '12px' }}>
                <div className="ftitle">3 — Size / Color</div>
                <select className="fsel" value={selectedVariant || ''} onChange={e => setSelectedVariant(Number(e.target.value))}>
                  {variants.map((v: Record<string, unknown>) => <option key={v.id as number} value={v.id as number}>{String(v.name || v.size || v.id)}</option>)}
                </select>
              </div>
            )}

            <div className="card hi" style={{ marginBottom: '12px' }}>
              <div className="ftitle">4 — Placement</div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
                {['front', 'back', 'left', 'right'].map(p => <button key={p} onClick={() => setPlacement(p)} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', border: `0.5px solid ${placement === p ? 'rgba(255,34,85,0.5)' : 'rgba(255,34,85,0.15)'}`, background: placement === p ? 'rgba(255,34,85,0.1)' : 'transparent', color: placement === p ? 'var(--red)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize' as const }}>{p}</button>)}
              </div>
            </div>

            <button onClick={generateExactMockup} disabled={generating || polling || !selectedVariant || !designImage} className="pod-btn" style={{ width: '100%' }}>
              {generating ? 'Uploading...' : polling ? 'Printful generating...' : '🎯 Generate Exact Mockup'}
            </button>
            {(generating || polling) && <div className="lbar" style={{ marginTop: '8px' }}><div className="lbar-fill" /></div>}
            {status && <div style={{ marginTop: '8px', fontSize: '11px', color: status.startsWith('Error') ? '#ff6b6b' : 'var(--mu3)', textAlign: 'center', fontFamily: "'DM Mono',monospace" }}>{status}</div>}
          </div>

          <div>
            {mockupImages.length === 0 ? (
              <div className="card" style={{ height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ opacity: 0.4 }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
                  <div style={{ fontSize: '16px', color: 'var(--w)', marginBottom: '8px' }}>Your exact mockup appears here</div>
                  <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Upload pattern → Select product → Generate</div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,34,85,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
                  {mockupImages.length} Mockup{mockupImages.length > 1 ? 's' : ''} — {selectedProduct?.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {mockupImages.map((url, i) => (
                    <div key={i} className="product-card">
                      <img src={url} alt={'Mockup ' + (i + 1)} style={{ width: '100%', display: 'block' }} />
                      <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>Mockup {i + 1}</div>
                        <a href={url} download={'mockup_' + (i + 1) + '.jpg'} style={{ padding: '4px 12px', borderRadius: '6px', background: 'var(--pod)', color: '#fff', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>⬇ Save</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          <div>
            <div className="card hi" style={{ marginBottom: '12px' }}>
              <div className="ftitle">AI Lifestyle Mockup</div>
              <F label="Describe the scene">
                <textarea className="fta" style={{ minHeight: '100px' }} placeholder="e.g. Black woman wearing black Halloween pajama set with skeleton graphic, sitting on white bed, warm autumn candles in background..." value={prompt} onChange={e => setPrompt(e.target.value)} />
              </F>
              <F label="Photography Style">
                <select className="fsel" value={style} onChange={e => setStyle(e.target.value)}>
                  {['fashion', 'lifestyle', 'cinematic', 'luxury', 'streetwear'].map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
              <button className="pod-btn" onClick={generateAIMockup} disabled={imageLoading || !prompt.trim()} style={{ width: '100%' }}>
                {imageLoading ? 'Generating...' : '🤖 Generate AI Mockup'}
              </button>
              {imageLoading && <div className="lbar" style={{ marginTop: '8px' }}><div className="lbar-fill" /></div>}
            </div>
          </div>
          <div>
            {imageUrl ? (
              <div>
                <img src={imageUrl} alt="AI mockup" style={{ width: '100%', borderRadius: '12px', marginBottom: '12px' }} />
                <a href={imageUrl} download="mockup.jpg" className="pod-btn" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '12px' }}>⬇ Download</a>
              </div>
            ) : (
              <div className="card" style={{ height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ opacity: 0.4 }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
                  <div style={{ fontSize: '14px', color: 'var(--w)' }}>AI lifestyle mockup appears here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MY STORE ───────────────────────────────────────────────────
function MyStore() {
  const { user } = useUser()
  const [step, setStep] = useState<'setup' | 'connected'>('setup')
  const [provider, setProvider] = useState<'printful' | 'printify'>('printful')
  const [apiKey, setApiKey] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [status, setStatus] = useState('')

  async function connectStore() {
    if (!apiKey.trim() || !storeName.trim()) { setStatus('Store name and API key required'); return }
    setConnecting(true)
    setStatus('Connecting to ' + (provider === 'printful' ? 'Printful' : 'Printify') + '...')
    try {
      const slug = storeSlug || storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      // Save to Redis
      const res = await fetch('/api/store/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, provider, apiKey, storeName, storeSlug: slug, isPublic }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('connected')
        setStatus('Store connected!')
      } else {
        setStatus('Error: ' + (data.error || 'Connection failed'))
      }
    } catch (e) { setStatus('Error: ' + (e as Error).message) }
    setConnecting(false)
  }

  if (step === 'connected') return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          My <span style={{ color: 'var(--red)' }}>Store</span>
        </div>
      </div>
      <div className="card hi" style={{ marginBottom: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--pod)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏪</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{storeName}</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Connected via {provider} · {isPublic ? '🌍 Public' : '🔒 Private'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: '8px', flex: 1 }}>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '4px' }}>YOUR STORE URL</div>
            <div style={{ fontSize: '12px', color: 'var(--red2)' }}>envileecreatorstudios.com/shop/{storeSlug || 'your-store'}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          My <span style={{ color: 'var(--red)' }}>Store</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Connect your existing Printful or Printify store, or create a new one.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Connect Your Store</div>
            <F label="Store Provider">
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['printful', 'printify'] as const).map(p => (
                  <button key={p} onClick={() => setProvider(p)} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${provider === p ? 'rgba(255,34,85,0.5)' : 'rgba(255,34,85,0.15)'}`, background: provider === p ? 'rgba(255,34,85,0.1)' : 'transparent', color: provider === p ? 'var(--red)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize' as const }}>
                    {p}
                  </button>
                ))}
              </div>
            </F>
            <F label="Store Name">
              <input className="finp" placeholder="e.g. Baddie Boutique" value={storeName} onChange={e => { setStoreName(e.target.value); setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')) }} />
            </F>
            <F label="Store URL (auto-generated)">
              <div style={{ padding: '9px 12px', background: 'var(--bg3)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)' }}>
                /shop/{storeSlug || 'your-store-name'}
              </div>
            </F>
            <F label={provider === 'printful' ? 'Printful API Key' : 'Printify API Key'}>
              <input className="finp" type="password" placeholder="Paste your API key..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
              <div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '4px' }}>
                {provider === 'printful' ? 'Get from printful.com → Settings → Stores → API' : 'Get from printify.com → My Account → Connections → API'}
              </div>
            </F>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div onClick={() => setIsPublic(!isPublic)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: isPublic ? 'var(--red)' : 'var(--s2)', cursor: 'pointer', position: 'relative' as const, transition: 'all .2s', border: '0.5px solid rgba(255,34,85,0.3)', flexShrink: 0 }}>
                <div style={{ position: 'absolute' as const, top: '2px', left: isPublic ? '18px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--w)', fontWeight: 600 }}>Make store public</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Public stores appear in the Marketplace</div>
              </div>
            </div>
            <button className="pod-btn" onClick={connectStore} disabled={connecting || !apiKey.trim() || !storeName.trim()} style={{ width: '100%' }}>
              {connecting ? 'Connecting...' : '🏪 Connect My Store'}
            </button>
            {status && <div style={{ marginTop: '8px', fontSize: '11px', color: status.startsWith('Error') ? '#ff6b6b' : 'var(--mu3)', textAlign: 'center', fontFamily: "'DM Mono',monospace" }}>{status}</div>}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div className="ftitle">How It Works</div>
          {[
            ['1', 'Connect your Printful or Printify account using your API key'],
            ['2', 'Your products sync automatically from your store'],
            ['3', 'Get your own public storefront at envileecreatorstudios.com/shop/yourname'],
            ['4', 'Customers can browse and buy directly from your store'],
            ['5', 'Orders are fulfilled automatically by Printful/Printify'],
            ['6', 'Payments go directly to your connected Stripe account'],
          ].map(([num, text]) => (
            <div key={num} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--pod)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{num}</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6', paddingTop: '3px' }}>{text}</div>
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,34,85,0.05)', borderRadius: '8px', border: '0.5px solid rgba(255,34,85,0.15)', fontSize: '11px', color: 'var(--red2)', lineHeight: '1.7' }}>
            🔒 Your API key is encrypted and stored securely. Students are enrolled for free — no commission taken.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MARKETPLACE ────────────────────────────────────────────────
function Marketplace() {
  const [stores, setStores] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/store/marketplace')
        const data = await res.json()
        setStores(data.stores || [])
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = stores.filter(s => {
    const name = String(s.storeName || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' as const, gap: '16px' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
            POD <span style={{ color: 'var(--red)' }}>Marketplace</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Browse stores from Envi Lee Creator Studios students.</div>
        </div>
        <input className="finp" placeholder="Search stores..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '240px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="lbar" style={{ width: '120px', margin: '0 auto' }}><div className="lbar-fill" /></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <div style={{ fontSize: '16px', color: 'var(--w)', marginBottom: '8px' }}>No stores yet</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Be the first to open your store in My Store tab</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((store, i) => (
            <div key={i} className="store-card">
              <div style={{ height: '120px', background: `linear-gradient(135deg, rgba(255,34,85,0.2), rgba(0,0,0,0.8))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                🏪
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{String(store.storeName)}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '12px' }}>via {String(store.provider)}</div>
                <a href={`/shop/${String(store.storeSlug)}`} style={{ display: 'block', padding: '9px', borderRadius: '8px', background: 'var(--pod)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
                  Visit Store →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── LISTING WRITER ─────────────────────────────────────────────
function ListingWriter() {
  const [productName, setProductName] = useState('')
  const [details, setDetails] = useState('')
  const [platform, setPlatform] = useState('Etsy')
  const [audience, setAudience] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate() {
    if (!productName.trim()) return
    setLoading(true); setOutput('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 800,
          messages: [{ role: 'user', content: `Write a complete ${platform} product listing for: ${productName}. Details: ${details}. Target audience: ${audience || 'women 25-45 who love unique personalized gifts'}. Include: title (optimized for ${platform} SEO), description (compelling, benefit-focused), tags/keywords (13 if Etsy), and a short social media caption. Format clearly with sections.` }],
        }),
      })
      const data = await res.json()
      setOutput(data.content?.[0]?.text || '')
    } catch (e) { setOutput('Error: ' + (e as Error).message) }
    setLoading(false)
  }

  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          Listing <span style={{ color: 'var(--red)' }}>Writer</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>AI-powered product titles, descriptions, tags, and social captions for any platform.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        <div>
          <div className="card hi">
            <div className="ftitle">Product Details</div>
            <F label="Product Name">
              <input className="finp" placeholder="e.g. Halloween Skeleton Pajama Set" value={productName} onChange={e => setProductName(e.target.value)} />
            </F>
            <F label="Key Details / Features">
              <textarea className="fta" placeholder="Material, colors, sizes, design details, what makes it special..." value={details} onChange={e => setDetails(e.target.value)} />
            </F>
            <F label="Platform">
              <select className="fsel" value={platform} onChange={e => setPlatform(e.target.value)}>
                {['Etsy', 'Shopify', 'TikTok Shop', 'Amazon', 'Instagram', 'Pinterest'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Target Audience (optional)">
              <input className="finp" placeholder="e.g. Halloween lovers, cozy fashion fans" value={audience} onChange={e => setAudience(e.target.value)} />
            </F>
            <button className="pod-btn" onClick={generate} disabled={loading || !productName.trim()} style={{ width: '100%' }}>
              {loading ? '✍️ Writing...' : '✍️ Write Listing'}
            </button>
            {loading && <div className="lbar" style={{ marginTop: '8px' }}><div className="lbar-fill" /></div>}
          </div>
        </div>

        <div>
          {output ? (
            <div className="card hi" style={{ height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div className="ftitle" style={{ marginBottom: 0 }}>Your Listing</div>
                <button onClick={() => navigator.clipboard?.writeText(output)} className="ghost-pod" style={{ fontSize: '11px' }}>Copy All</button>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--w2)', lineHeight: '1.8', whiteSpace: 'pre-wrap' as const }}>{output}</div>
            </div>
          ) : (
            <div className="card" style={{ height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✍️</div>
                <div style={{ fontSize: '14px', color: 'var(--w)' }}>Your listing appears here</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MY PRODUCTS ────────────────────────────────────────────────
function MyProducts() {
  return (
    <div className="pg-in" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff', marginBottom: '4px' }}>
          My <span style={{ color: 'var(--red)' }}>Products</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Manage your product listings and designs.</div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div style={{ fontSize: '16px', color: 'var(--w)', marginBottom: '8px' }}>Connect your store first</div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Go to My Store tab to connect Printful or Printify — your products will sync here automatically.</div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function PodPage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<PodTool>('dashboard')
  const [botOpen, setBotOpen] = useState(false)

  const tabs: { id: PodTool; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'design', label: 'Design Studio', icon: '🎨' },
    { id: 'mystore', label: 'My Store', icon: '🏪' },
    { id: 'products', label: 'My Products', icon: '📦' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'listings', label: 'Listing Writer', icon: '✍️' },
    { id: 'bot', label: 'POD Bot', icon: '🤖' },
  ]

  const footerLinks = [
    ['Printful', 'https://printful.com'],
    ['Printify', 'https://printify.com'],
    ['Etsy', 'https://etsy.com'],
    ['TikTok Shop', 'https://shop.tiktok.com'],
    ['Canva', 'https://canva.com'],
    ['Placeit', 'https://placeit.net'],
            ['ArtsAdd ✦', 'http://www.artsadd.com/?rf=58671'],
    ['Printful API', 'https://developers.printful.com'],
    ['ArtsAdd ✦', 'http://www.artsadd.com/?rf=58671'],
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <AccessGate>
          <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const }}>

            {/* TOP NAV */}
            <div className="top-nav">
              {/* Brand row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: 'rgba(255,34,85,0.4)', fontFamily: "'DM Mono',monospace" }}>← Empire</button>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 900, background: 'linear-gradient(135deg,#ff0000,#ff6600,#ffcc00,#00cc44,#0088ff,#8833ff,#ff0088)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    POD Studios™
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => { setActive('bot'); setBotOpen(false) }} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid rgba(255,34,85,0.3)', background: 'rgba(255,34,85,0.08)', color: 'var(--red2)', fontFamily: "'DM Sans',sans-serif" }}>
                    🤖 POD Bot
                  </button>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '28px', height: '28px' } } }} />
                </div>
              </div>

              {/* Tab row */}
              <div className="nav-tabs">
                {tabs.map(t => (
                  <button key={t.id} className={`nav-tab ${active === t.id ? 'active' : ''}`} onClick={() => setActive(t.id)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1 }}>
              {active === 'dashboard' && <Dashboard setActive={setActive} />}
              {active === 'design' && <DesignStudio />}
              {active === 'mystore' && <MyStore />}
              {active === 'products' && <MyProducts />}
              {active === 'marketplace' && <Marketplace />}
              {active === 'listings' && <ListingWriter />}
              {active === 'bot' && (
                <div style={{ padding: '28px' }}>
                  <PodBot inline />
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="pod-footer">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,34,85,0.3)', fontFamily: "'DM Mono',monospace" }}>QUICK LINKS:</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const, flex: 1, justifyContent: 'center' }}>
                {footerLinks.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="footer-link">{label} ↗</a>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,34,85,0.2)', fontFamily: "'DM Mono',monospace" }}>Envi Lee Creator Studios™</div>
            </div>

          </div>

          {/* FLOATING BOT */}
          <button className="bot-fab" onClick={() => setBotOpen(!botOpen)}>
            {botOpen ? '✕' : '🤖'}
          </button>
          {botOpen && (
            <div className="bot-panel">
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(255,34,85,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--w)' }}>🤖 POD Bot</div>
                <button onClick={() => setBotOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mu3)', fontSize: '16px' }}>✕</button>
              </div>
              <PodBot />
            </div>
          )}

        </AccessGate>
      </SignedIn>
    </>
  )
}
