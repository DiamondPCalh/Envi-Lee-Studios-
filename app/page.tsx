'use client'
import { useState, useEffect } from 'react'
import { UserButton, useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
 
type Tool = 'mockup' | 'listing' | 'description' | 'image-prompt' | 'tryon' | 'cineflow' | 'studios' | 'deals' | 'lipsync' | 'collection' | 'profit' | 'imagegen' | 'saved' | 'video'
 
async function callAPI(endpoint: string, body: Record<string, string>, method = 'POST'): Promise<string> {
  const res = await fetch(`/api/${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Generation failed')
  return data.result
}
 
async function callTryOn(body: Record<string, string>) {
  const res = await fetch('/api/tryon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return await res.json()
}
 
const css = `
  :root {
    --bg:#000;--bg2:#05020a;--bg3:#0a0510;--bg4:#0f0818;
    --s1:#130d1a;--s2:#1a1224;--s3:#21182e;
    --w:#f8f0ff;--w2:#d8c8f0;--w3:#a888cc;
    --mu:#3a2850;--mu2:#5a4070;--mu3:#8060a0;
    --b:rgba(108,86,126,0.15);--b2:rgba(108,86,126,0.3);--b3:rgba(108,86,126,0.5);
    --c:#6c567e;--c2:rgba(108,86,126,0.15);--bc:rgba(108,86,126,0.4);
    --pn:#9b6dff;--pn2:rgba(155,109,255,0.15);--pn3:rgba(155,109,255,0.08);
    --cf:#00c853;--cf2:rgba(0,200,83,0.12);--cfb:rgba(0,200,83,0.3);
    --r:8px;--r2:12px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:var(--bg);color:var(--w);font-family:'DM Sans',sans-serif;min-height:100vh}
  select,input,textarea{color-scheme:dark}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:var(--bg)}
  ::-webkit-scrollbar-thumb{background:var(--s3);border-radius:2px}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 20%,rgba(108,86,126,0.1) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(155,109,255,0.07) 0%,transparent 50%);pointer-events:none;z-index:0}
  body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(108,86,126,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,86,126,0.04) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;z-index:0}
  @keyframes lbar{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes aip{0%,100%{opacity:1}50%{opacity:.2}}
  @keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .pg-in{animation:pgIn .3s ease}
  .lbar-fill{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--c),var(--pn),var(--c));background-size:200% 100%;animation:lbar 1.6s linear infinite}
  .lbar-fill-cf{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--cf),#69f0ae,var(--cf));background-size:200% 100%;animation:lbar 1.6s linear infinite}
  .ai-pulse{width:6px;height:6px;border-radius:50%;background:var(--pn);display:inline-block;animation:aip 1.8s ease infinite;margin-right:7px;box-shadow:0 0 6px rgba(155,109,255,0.5)}
  .ai-pulse-cf{width:6px;height:6px;border-radius:50%;background:var(--cf);display:inline-block;animation:aip 1.8s ease infinite;margin-right:7px}
  .upload-zone{border:1.5px dashed var(--b2);border-radius:10px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg3);position:relative}
  .upload-zone:hover{border-color:var(--pn);background:var(--pn3)}
  .upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
  .preview-img{width:100%;border-radius:8px;object-fit:cover;max-height:180px;margin-top:8px}
  .chat-wrap{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;margin-bottom:10px}
  .msg{max-width:86%;padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.6}
  .msg.user{background:rgba(0,200,83,0.12);border:0.5px solid rgba(0,200,83,0.3);color:var(--w2);align-self:flex-end;border-radius:12px 12px 2px 12px;margin-left:auto}
  .msg.bot{background:var(--s2);border:0.5px solid var(--b);color:var(--w2);align-self:flex-start;border-radius:12px 12px 12px 2px}
`
 
const inp: React.CSSProperties = { background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, resize: 'vertical' as const, minHeight: '78px', lineHeight: '1.6' }
const sel: React.CSSProperties = { ...inp, padding: '8px 10px' }
 
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu3)', textTransform: 'uppercase' as const, letterSpacing: '.7px', fontFamily: "'DM Mono',monospace" }}>{label}</label>
      {children}
    </div>
  )
}
 
function PTitle({ children, cf }: { children: React.ReactNode; cf?: boolean }) {
  return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', fontWeight: 500, color: cf ? 'var(--cf)' : 'var(--pn)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>{children}</div>
}
 
function Panel({ children, hi, mb, cf, neon }: { children: React.ReactNode; hi?: boolean; mb?: boolean; cf?: boolean; neon?: boolean }) {
  return <div style={{ background: 'var(--s1)', border: `0.5px solid ${neon ? "rgba(155,109,255,0.3)" : cf ? "rgba(0,200,83,0.2)" : hi ? "var(--b2)" : "var(--b)"}`, borderRadius: 'var(--r2)', padding: '18px', marginBottom: mb ? '14px' : 0 }}>{children}</div>
}
 
function GenBtn({ loading, onClick, children, cf }: { loading: boolean; onClick: () => void; children: React.ReactNode; cf?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(155,109,255,0.3)' : cf ? 'var(--cf)' : 'linear-gradient(135deg,var(--c),var(--pn))', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : cf ? '0 0 15px rgba(0,200,83,0.3)' : '0 0 20px rgba(155,109,255,0.3)' }}>
      {loading ? 'Generating…' : children}
    </button>
  )
}
 
function Output({ text, loading, cf, tool, prompt }: { text: string; loading: boolean; cf?: boolean; tool?: string; prompt?: string }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
 
  function copy() {
    if (!text) return
    // Method 1: Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => fallbackCopy())
    } else {
      fallbackCopy()
    }
  }
 
  function fallbackCopy() {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
 
  async function save() {
    if (!text) return
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: tool || 'output', content: text, prompt: prompt || '' }),
      })
      if (res.ok) {
        // Also save to localStorage as backup
        const existing = JSON.parse(localStorage.getItem('savedWork') || '[]')
        existing.unshift({ id: Date.now(), tool: tool || 'output', content: text, prompt: prompt || '', savedAt: new Date().toISOString() })
        localStorage.setItem('savedWork', JSON.stringify(existing.slice(0, 100)))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // Fallback to localStorage only
      const existing = JSON.parse(localStorage.getItem('savedWork') || '[]')
      existing.unshift({ id: Date.now(), tool: tool || 'output', content: text, prompt: prompt || '', savedAt: new Date().toISOString() })
      localStorage.setItem('savedWork', JSON.stringify(existing.slice(0, 100)))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }
 
  if (!text && !loading) return null
  return (
    <div style={{ background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', padding: '14px', marginTop: '12px' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: cf ? 'var(--cf)' : 'var(--pn)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '9px', display: 'flex', alignItems: 'center' }}>
        {cf ? <span className="ai-pulse-cf" /> : <span className="ai-pulse" />}AI Output
      </div>
      {loading && <div style={{ height: '2px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden', margin: '8px 0', borderRadius: '1px' }}>{cf ? <div className="lbar-fill-cf" /> : <div className="lbar-fill" />}</div>}
      {text && <>
        <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.85', whiteSpace: 'pre-wrap' as const }}>{text}</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button onClick={copy}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${copied ? 'var(--cf)' : 'var(--b2)'}`, background: copied ? 'var(--cf2)' : 'var(--s2)', color: copied ? 'var(--cf)' : cf ? 'var(--cf)' : 'var(--pn)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {copied ? '✓ Copied!' : 'Copy ↗'}
          </button>
          <button onClick={save}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${saved ? 'var(--pn)' : 'var(--b2)'}`, background: saved ? 'var(--pn3)' : 'var(--s2)', color: saved ? 'var(--pn)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {saved ? '✓ Saved!' : '⊹ Save'}
          </button>
        </div>
      </>}
    </div>
  )
}
 
// ── POD TOOLS ─────────────────────────────────────────────────
 
function MockupTool() {
  const [product, setProduct] = useState('T-Shirt')
  const [design, setDesign] = useState('')
  const [setting, setSetting] = useState('Black woman — natural hair, confident, luxury lifestyle setting')
  const [style, setStyle] = useState('Editorial fashion photography')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  async function run(body?: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/mockup', body ?? { product, design, setting, style })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Mockup <span style={{ color: 'var(--pn)' }}>Generator</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>Describe your product — AI writes a complete prompt package for Midjourney, DALL-E, and Kling AI.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel hi>
          <PTitle>Product details</PTitle>
          <F label="Product type">
            <select style={sel} value={product} onChange={e => setProduct(e.target.value)}>
              {['T-Shirt','Hoodie','Swimwear','Leggings','Hat','Bag','Tumbler','Shoes'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Design description"><textarea style={ta} placeholder="Colors, graphics, patterns, text, vibe..." value={design} onChange={e => setDesign(e.target.value)} /></F>
          <F label="Model / setting">
            <select style={sel} value={setting} onChange={e => setSetting(e.target.value)}>
              {['Black woman — natural hair, confident, luxury lifestyle setting','Black woman — beachside, swimwear shoot, golden hour','Black woman — urban street style, NYC vibes','Flat lay — clean marble surface, minimal props','Outdoor editorial — natural light, aspirational'].map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Visual style">
            <select style={sel} value={style} onChange={e => setStyle(e.target.value)}>
              {['Editorial fashion photography','Luxury lifestyle campaign','Streetwear urban aesthetic','Minimal studio flat lay','Cinematic film still'].map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <GenBtn loading={loading} onClick={() => run()}>Generate mockup prompts ↗</GenBtn>
          <Output text={output} loading={loading} />
        </Panel>
        <div>
          <Panel mb>
            <PTitle>Quick-starts</PTitle>
            {[
              { label: 'Luxury swim set', product: 'Swimwear', design: 'Tropical floral, black and gold, minimal', setting: 'Black woman, poolside luxury resort, Maldives', style: 'Luxury lifestyle campaign' },
              { label: 'Streetwear hoodie', product: 'Hoodie', design: 'Bold city skyline, oversized, vintage worn', setting: 'Black woman, NYC street, urban autumn', style: 'Streetwear urban aesthetic' },
              { label: 'Clean studio tee', product: 'T-Shirt', design: 'Minimal embroidered logo, white tee', setting: 'Flat lay — clean marble surface, minimal props', style: 'Minimal studio flat lay' },
            ].map(q => (
              <button key={q.label} onClick={() => run(q)}
                style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                {q.label} ↗
              </button>
            ))}
          </Panel>
          <Panel>
            <PTitle>Works with</PTitle>
            {['Midjourney v6','DALL-E 3','Kling AI (video)','Runway Gen-3','Stable Diffusion XL'].map(p => (
              <div key={p} style={{ padding: '7px 10px', background: 'var(--bg3)', borderRadius: 'var(--r)', fontSize: '12px', color: 'var(--mu3)', marginBottom: '6px', fontFamily: "'DM Mono',monospace" }}>◈ {p}</div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}
 
function ListingTool() {
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
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Product <span style={{ color: 'var(--pn)' }}>Listing Writer</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>AI writes your full title, description, bullet points, SEO tags, and TikTok caption in one click.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel hi>
          <PTitle>Product details</PTitle>
          <F label="Product name"><input style={inp} placeholder="e.g. Luxe Floral Crop Tee" value={productName} onChange={e => setProductName(e.target.value)} /></F>
          <F label="Details"><textarea style={ta} placeholder="Material, colors, style, what makes it special..." value={details} onChange={e => setDetails(e.target.value)} /></F>
          <F label="Platform">
            <select style={sel} value={platform} onChange={e => setPlatform(e.target.value)}>
              {['Etsy','Shopify','TikTok Shop','Amazon','WooCommerce/WordPress'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Target audience"><input style={inp} value={audience} onChange={e => setAudience(e.target.value)} /></F>
          <GenBtn loading={loading} onClick={run}>Write full listing ↗</GenBtn>
          <Output text={output} loading={loading} />
        </Panel>
        <Panel>
          <PTitle>What gets written</PTitle>
          {[['Title','SEO-optimised platform-specific title'],['Description','Lifestyle-led copy that converts'],['Key Features','5 benefit-first bullet points'],['SEO Tags','13 search tags or keywords'],['TikTok Caption','Hook + product + CTA']].map(([l,d]) => (
            <div key={l} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w)', marginBottom: '2px' }}>{l}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
 
function DescriptionTool() {
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
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Description <span style={{ color: 'var(--pn)' }}>Writer</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>Three description variants plus a power tagline in one click.</div>
      <Panel hi>
        <PTitle>Your product</PTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <F label="Product"><input style={inp} placeholder="e.g. Luxe Floral Crop Tee" value={product} onChange={e => setProduct(e.target.value)} /></F>
          <F label="Niche"><input style={inp} value={niche} onChange={e => setNiche(e.target.value)} /></F>
          <F label="Brand tone"><input style={inp} value={tone} onChange={e => setTone(e.target.value)} /></F>
          <F label="Target audience"><input style={inp} value={audience} onChange={e => setAudience(e.target.value)} /></F>
        </div>
        <GenBtn loading={loading} onClick={run}>Write 3 descriptions + tagline ↗</GenBtn>
        <Output text={output} loading={loading} />
      </Panel>
    </div>
  )
}
 
function ImagePromptTool() {
  const [subject, setSubject] = useState('')
  const [style, setStyle] = useState('editorial fashion photography, luxury aesthetic')
  const [mood, setMood] = useState('powerful, confident, aspirational')
  const [platform, setPlatform] = useState('midjourney')
  const [extras, setExtras] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/image-prompt', { subject, style, mood, platform, extras })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>AI Image <span style={{ color: 'var(--pn)' }}>Prompt Builder</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>Describe your scene — AI writes a complete prompt for your chosen platform.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel hi>
          <PTitle>Prompt setup</PTitle>
          <F label="Subject / scene"><textarea style={ta} placeholder="e.g. Black woman in a white luxury crop tee, NYC rooftop at golden hour" value={subject} onChange={e => setSubject(e.target.value)} /></F>
          <F label="Visual style"><input style={inp} value={style} onChange={e => setStyle(e.target.value)} /></F>
          <F label="Mood"><input style={inp} value={mood} onChange={e => setMood(e.target.value)} /></F>
          <F label="Target platform">
            <select style={sel} value={platform} onChange={e => setPlatform(e.target.value)}>
              {[['midjourney','Midjourney v6'],['dalle','DALL-E 3'],['kling','Kling AI (video)'],['runway','Runway Gen-3'],['stable','Stable Diffusion XL']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Extra details"><input style={inp} placeholder="Props, camera settings, references..." value={extras} onChange={e => setExtras(e.target.value)} /></F>
          <GenBtn loading={loading} onClick={run}>Build image prompt ↗</GenBtn>
          <Output text={output} loading={loading} />
        </Panel>
        <Panel>
          <PTitle>Platform guide</PTitle>
          {[['Midjourney v6','Best for fashion mockups. Includes --ar and --v 6 flags.'],['DALL-E 3','Natural language. No comma tags needed.'],['Kling AI','Best for video. Focus on motion and camera movement.'],['Runway Gen-3','Cinematic transitions and lighting changes.'],['Stable Diffusion','Keyword-dense. Quality boosters included.']].map(([n,t]) => (
            <div key={n} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--pn)', marginBottom: '2px', fontFamily: "'DM Mono',monospace" }}>{n}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{t}</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
 
// ── TRY-ON TOOL ───────────────────────────────────────────────
 
function TryOnTool() {
  const [modelImage, setModelImage] = useState<string | null>(null)
  const [garmentImage, setGarmentImage] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [brand, setBrand] = useState('Custom Design')
  const [platform, setPlatform] = useState('TikTok')
  const [result, setResult] = useState<{message?: string; imageUrl?: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [contentOutput, setContentOutput] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [activeContent, setActiveContent] = useState('caption')
 
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'model' | 'garment') {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (type === 'model') setModelImage(ev.target?.result as string)
      else setGarmentImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
 
  async function generateTryOn() {
    if (!modelImage) { alert('Please upload a model or person photo'); return }
    setLoading(true); setResult(null)
    try {
      const data = await callTryOn({ personImage: modelImage, garmentImage: garmentImage ?? '', productName, brand })
      setResult(data)
    } catch(e) {
      setResult({ message: `Error: ${(e as Error).message}` })
    } finally { setLoading(false) }
  }
 
  async function generateContent(type: string) {
    setContentLoading(true); setContentOutput(''); setActiveContent(type)
    try { setContentOutput(await callAPI('tryon', { productName: productName || 'Fashion item', brand, platform, contentType: type }, 'PUT')) }
    catch(e) { setContentOutput(`Error: ${(e as Error).message}`) }
    finally { setContentLoading(false) }
  }
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Creator <span style={{ color: 'var(--pn)' }}>Try-On Studio</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '8px', lineHeight: '1.6' }}>Upload a model + clothing image, generate try-on photos, and create captions, hashtags, scripts, and product descriptions.</div>
      <div style={{ background: 'var(--pn3)', border: '0.5px solid rgba(155,109,255,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: 'var(--pn)', fontFamily: "'DM Mono',monospace" }}>
        ✦ Connect FASHN, Genlook, or OpenArt in Vercel env vars for real try-on · Content generation works now
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <Panel hi mb>
            <PTitle>Model / person photo</PTitle>
            <div className="upload-zone">
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'model')} />
              {!modelImage ? (
                <div><div style={{ fontSize: '28px', marginBottom: '6px' }}>🤳</div><div style={{ fontSize: '12px', color: 'var(--w2)', marginBottom: '3px' }}>Upload model or AI twin photo</div><div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Real model, AI character, or influencer</div></div>
              ) : <img src={modelImage} className="preview-img" alt="model" />}
            </div>
          </Panel>
          <Panel hi>
            <PTitle>Clothing / garment image</PTitle>
            <div className="upload-zone">
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'garment')} />
              {!garmentImage ? (
                <div><div style={{ fontSize: '28px', marginBottom: '6px' }}>👗</div><div style={{ fontSize: '12px', color: 'var(--w2)', marginBottom: '3px' }}>Upload clothing image</div><div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Product photo, screenshot, or flat lay</div></div>
              ) : <img src={garmentImage} className="preview-img" alt="garment" />}
            </div>
            <div style={{ marginTop: '12px' }}>
              <F label="Product name"><input style={inp} placeholder="e.g. Luxe Floral Crop Tee" value={productName} onChange={e => setProductName(e.target.value)} /></F>
              <F label="Brand / source">
                <select style={sel} value={brand} onChange={e => setBrand(e.target.value)}>
                  {['Envi Lee','TikTok Shop','Amazon','Fashion Nova','Instagram Brand','Custom Design','Other'].map(b => <option key={b}>{b}</option>)}
                </select>
              </F>
            </div>
            <GenBtn loading={loading} onClick={generateTryOn}>✦ Generate Try-On</GenBtn>
          </Panel>
        </div>
        <div>
          <Panel mb neon>
            <PTitle>Try-on preview</PTitle>
            <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--b2)', marginBottom: '12px', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>✦</div>
                  <div style={{ fontSize: '13px', color: 'var(--pn)', marginBottom: '8px' }}>Generating try-on…</div>
                  <div style={{ height: '2px', background: 'rgba(155,109,255,0.1)', overflow: 'hidden', borderRadius: '1px', width: '120px', margin: '0 auto' }}><div className="lbar-fill" /></div>
                </div>
              ) : result ? (
                <div style={{ width: '100%', padding: '16px' }}>
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="try-on result" style={{ width: '100%', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✦</div>
                      <div style={{ fontSize: '13px', color: 'var(--pn)', marginBottom: '8px', fontWeight: 600 }}>Demo Mode Active</div>
                      <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '12px' }}>{result.message}</div>
                      <div style={{ background: 'var(--pn3)', border: '0.5px solid rgba(155,109,255,0.3)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--pn)', fontFamily: "'DM Mono',monospace", textAlign: 'left', lineHeight: '1.8' }}>
                        Product: {productName || 'Not set'}<br/>Brand: {brand}<br/>Model: {modelImage ? '✓ Uploaded' : '✗ Missing'}<br/>Garment: {garmentImage ? '✓ Uploaded' : '✗ Missing'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--mu3)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>✦</div>
                  <div style={{ fontSize: '13px', color: 'var(--pn)' }}>Try-on will appear here</div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>Upload photos and click Generate</div>
                </div>
              )}
            </div>
          </Panel>
          <Panel>
            <PTitle>Connect a try-on API</PTitle>
            {[['FASHN','fashn.ai','FASHN_API_KEY'],['Genlook','genlook.ai','GENLOOK_API_KEY'],['OpenArt','openart.ai','OPENART_API_KEY']].map(([name,url,key]) => (
              <div key={name} style={{ padding: '9px 12px', background: 'var(--bg3)', borderRadius: 'var(--r)', marginBottom: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w)' }}>{name}</div><div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{key}</div></div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{url}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
      <Panel neon>
        <PTitle>Content generator</PTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <F label="Platform">
              <select style={sel} value={platform} onChange={e => setPlatform(e.target.value)}>
                {['TikTok','Instagram','Amazon','TikTok Shop','Pinterest'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[['caption','Caption'],['hashtags','Hashtags'],['script','TikTok Script'],['description','Description']].map(([type, label]) => (
                <button key={type} onClick={() => generateContent(type)}
                  style={{ padding: '10px', borderRadius: '7px', border: `0.5px solid ${activeContent === type ? 'rgba(155,109,255,0.5)' : 'var(--b)'}`, background: activeContent === type ? 'var(--pn3)' : 'var(--bg3)', color: activeContent === type ? 'var(--pn)' : 'var(--mu3)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  {label} ↗
                </button>
              ))}
            </div>
          </div>
          <Output text={contentOutput} loading={contentLoading} />
        </div>
      </Panel>
    </div>
  )
}
 
// ── CINEFLOW AI ───────────────────────────────────────────────
 
function CineFlowTool() {
  const [activeCF, setActiveCF] = useState('prompt')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  // Prompt builder
  const [vpType, setVpType] = useState('UGC product showcase')
  const [vpSubject, setVpSubject] = useState('')
  const [vpCharacter, setVpCharacter] = useState('Black woman, confident, stylish, natural hair')
  const [vpSetting, setVpSetting] = useState('')
  const [vpPlatform, setVpPlatform] = useState('TikTok')
 
  // Calendar
  const [calNiche, setCalNiche] = useState('POD fashion business')
  const [calPlatform, setCalPlatform] = useState('TikTok')
  const [calDays, setCalDays] = useState('7')
  const [calGoal, setCalGoal] = useState('Grow followers and drive sales')
 
  // Hooks
  const [hkNiche, setHkNiche] = useState('POD business')
  const [hkStyle, setHkStyle] = useState('Income reveal')
 
  // Caption
  const [capTopic, setCapTopic] = useState('')
  const [capPlatform, setCapPlatform] = useState('TikTok')
 
  // UGC
  const [ugcProduct, setUgcProduct] = useState('')
  const [ugcPlatform, setUgcPlatform] = useState('TikTok')
  const [ugcBrand, setUgcBrand] = useState('Envi Lee')
 
  // Bot
  const [botMessages, setBotMessages] = useState([{ role: 'bot', text: 'Hey! I\'m your CineFlow AI assistant. Ask me anything about content, video ideas, or what to post today.' }])
  const [botInput, setBotInput] = useState('')
  const [botLoading, setBotLoading] = useState(false)
 
  async function gen(params: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/cineflow', params)) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  async function sendBot() {
    if (!botInput.trim()) return
    const msg = botInput.trim()
    setBotInput('')
    setBotMessages(m => [...m, { role: 'user', text: msg }])
    setBotLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: msg })
      setBotMessages(m => [...m, { role: 'bot', text: res }])
    } catch(e) {
      setBotMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }])
    }
    setBotLoading(false)
  }
 
  const cfTabs = [
    { id: 'prompt', label: '◈ Video Prompt' },
    { id: 'calendar', label: '◷ Calendar' },
    { id: 'hooks', label: '⊳ Hooks' },
    { id: 'caption', label: '⊹ Caption' },
    { id: 'ugc', label: '◉ UGC Ad' },
    { id: 'bot', label: '✦ AI Bot' },
  ]
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>CineFlow <span style={{ color: 'var(--cf)' }}>AI™</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '16px', lineHeight: '1.6' }}>Cinematic prompts, content calendars, hooks, UGC ads, captions, and your AI content assistant.</div>
 
      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {cfTabs.map(t => (
          <button key={t.id} onClick={() => { setActiveCF(t.id); setOutput('') }}
            style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeCF === t.id ? 'var(--cfb)' : 'var(--b)'}`, background: activeCF === t.id ? 'var(--cf2)' : 'var(--s1)', color: activeCF === t.id ? 'var(--cf)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>
 
      {/* VIDEO PROMPT */}
      {activeCF === 'prompt' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel cf>
            <PTitle cf>Cinematic Prompt Builder</PTitle>
            <F label="Content type">
              <select style={sel} value={vpType} onChange={e => setVpType(e.target.value)}>
                {['UGC product showcase','POV lifestyle moment','AI Influencer cinematic','Black Film cinematic','Reality show scene','Music video sequence','Brand commercial','TikTok viral format','Emotional storytelling','Concert / performance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Subject / scene"><textarea style={ta} placeholder="What happens in the video? Who is in it?" value={vpSubject} onChange={e => setVpSubject(e.target.value)} /></F>
            <F label="Character / model"><input style={inp} value={vpCharacter} onChange={e => setVpCharacter(e.target.value)} /></F>
            <F label="Setting & lighting"><input style={inp} placeholder="e.g. NYC rooftop, golden hour, warm cinematic light" value={vpSetting} onChange={e => setVpSetting(e.target.value)} /></F>
            <F label="Platform">
              <select style={sel} value={vpPlatform} onChange={e => setVpPlatform(e.target.value)}>
                {['TikTok (vertical 9:16)','Instagram Reels','YouTube (16:9)','All platforms'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <GenBtn cf loading={loading} onClick={() => gen({ tool: 'prompt', type: vpType, subject: vpSubject, character: vpCharacter, setting: vpSetting, platform: vpPlatform })}>Generate cinematic prompt ↗</GenBtn>
            <Output cf text={output} loading={loading} />
          </Panel>
          <div>
            <Panel cf mb>
              <PTitle cf>Quick-starts</PTitle>
              {[
                { label: 'AI influencer walk', type: 'AI Influencer cinematic', subject: 'A luxury AI influencer walking through a high-end fashion district', character: 'Black woman, deep brown skin, natural locs, designer streetwear', setting: 'Paris fashion week street, midday golden light' },
                { label: 'Cinematic confrontation', type: 'Black Film cinematic', subject: 'Two characters face off in a dramatic rooftop confrontation', character: 'Black woman and Black man, designer clothes, intense energy', setting: 'NYC rooftop, night, city lights, dramatic shadows' },
                { label: 'Concert performance', type: 'Concert / performance', subject: 'Solo female artist performing on a massive concert stage', character: 'Black woman, pop star energy, sequin outfit, commanding presence', setting: 'Concert arena, dramatic stage lighting, fog effects' },
                { label: 'Viral POV reaction', type: 'TikTok viral format', subject: 'POV: you just got your first POD sale notification', character: 'Black woman, home office, reacting to phone with pure joy', setting: 'Home office, ring light, warm cozy vibes' },
              ].map(q => (
                <button key={q.label} onClick={() => { setVpType(q.type); setVpSubject(q.subject); setVpCharacter(q.character); setVpSetting(q.setting); gen({ tool: 'prompt', ...q, platform: vpPlatform }) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                  {q.label} ↗
                </button>
              ))}
            </Panel>
            <Panel cf>
              <PTitle cf>Paste your prompt into</PTitle>
              {[['Kling AI','kling.ai','Free tier'],['Runway Gen-3','runwayml.com','Free credits'],['Pika','pika.art','Free tier']].map(([n,u,t]) => (
                <a key={n} href={`https://${u}`} target="_blank" rel="noreferrer"
                  style={{ padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: 'var(--r)', fontSize: '12px', color: 'var(--w2)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <span>{n}</span><span style={{ color: 'var(--cf)', fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>{t} ↗</span>
                </a>
              ))}
            </Panel>
          </div>
        </div>
      )}
 
      {/* CALENDAR */}
      {activeCF === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel cf>
            <PTitle cf>Content Calendar Builder</PTitle>
            <F label="Your niche">
              <select style={sel} value={calNiche} onChange={e => setCalNiche(e.target.value)}>
                {['POD fashion business','AI influencer creator','Luxury lifestyle','Black women entrepreneurship','Digital products and courses','Behind the scenes creator life'].map(n => <option key={n}>{n}</option>)}
              </select>
            </F>
            <F label="Platform">
              <select style={sel} value={calPlatform} onChange={e => setCalPlatform(e.target.value)}>
                {['TikTok','Instagram Reels','TikTok + Instagram','YouTube Shorts'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Calendar length">
              <select style={sel} value={calDays} onChange={e => setCalDays(e.target.value)}>
                <option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
              </select>
            </F>
            <F label="Goal">
              <select style={sel} value={calGoal} onChange={e => setCalGoal(e.target.value)}>
                {['Grow followers and drive sales','Drive product sales','Build brand awareness','Launch a new product'].map(g => <option key={g}>{g}</option>)}
              </select>
            </F>
            <GenBtn cf loading={loading} onClick={() => gen({ tool: 'calendar', niche: calNiche, platform: calPlatform, days: calDays, goal: calGoal })}>Build content calendar ↗</GenBtn>
            <Output cf text={output} loading={loading} />
          </Panel>
          <Panel cf>
            <PTitle cf>What you get per day</PTitle>
            {[['Video concept','Specific idea tailored to your niche'],['Hook','The first 2 seconds that stop the scroll'],['Caption','Ready-to-post with CTA'],['Video prompt','Kling AI/Runway ready'],['Hashtags','5 relevant tags'],['Post time','Best time to post']].map(([l,d]) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cf)', marginBottom: '2px' }}>{l}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{d}</div>
              </div>
            ))}
          </Panel>
        </div>
      )}
 
      {/* HOOKS */}
      {activeCF === 'hooks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel cf>
            <PTitle cf>Hook Generator</PTitle>
            <F label="Your niche">
              <select style={sel} value={hkNiche} onChange={e => setHkNiche(e.target.value)}>
                {['POD business','AI influencer','Income and side hustle','Luxury lifestyle','Black women entrepreneurship'].map(n => <option key={n}>{n}</option>)}
              </select>
            </F>
            <F label="Hook style">
              <select style={sel} value={hkStyle} onChange={e => setHkStyle(e.target.value)}>
                {['Income reveal','Pattern interrupt','POV opener','Curiosity gap','Hot take'].map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
            <GenBtn cf loading={loading} onClick={() => gen({ tool: 'hooks', niche: hkNiche, style: hkStyle })}>Generate 10 hooks ↗</GenBtn>
            <Output cf text={output} loading={loading} />
          </Panel>
          <Panel cf>
            <PTitle cf>Hook types explained</PTitle>
            {[['Income reveal','"I made $X in X days with zero inventory"'],['Pattern interrupt','"Stop scrolling — this is not what you think"'],['POV opener','"POV: You just got your first $1k sale"'],['Curiosity gap','"The one tool Black creators are sleeping on"'],['Hot take','"Etsy is dead — here is where to sell instead"']].map(([t,e]) => (
              <div key={t} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cf)', marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', fontStyle: 'italic' }}>{e}</div>
              </div>
            ))}
          </Panel>
        </div>
      )}
 
      {/* CAPTION */}
      {activeCF === 'caption' && (
        <Panel cf>
          <PTitle cf>Caption Writer</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="What the video is about"><textarea style={ta} placeholder="e.g. How I made $10k with POD using AI tools, no inventory needed..." value={capTopic} onChange={e => setCapTopic(e.target.value)} /></F>
              <F label="Platform">
                <select style={sel} value={capPlatform} onChange={e => setCapPlatform(e.target.value)}>
                  {['TikTok','Instagram Reels','Instagram post','All platforms'].map(p => <option key={p}>{p}</option>)}
                </select>
              </F>
              <GenBtn cf loading={loading} onClick={() => gen({ tool: 'caption', topic: capTopic, platform: capPlatform })}>Write caption ↗</GenBtn>
            </div>
            <Output cf text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* UGC AD */}
      {activeCF === 'ugc' && (
        <Panel cf>
          <PTitle cf>UGC Ad Builder</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Product"><input style={inp} placeholder="e.g. Luxe Floral Crop Tee" value={ugcProduct} onChange={e => setUgcProduct(e.target.value)} /></F>
              <F label="Brand"><input style={inp} value={ugcBrand} onChange={e => setUgcBrand(e.target.value)} /></F>
              <F label="Platform">
                <select style={sel} value={ugcPlatform} onChange={e => setUgcPlatform(e.target.value)}>
                  {['TikTok','Instagram','TikTok Shop','Amazon'].map(p => <option key={p}>{p}</option>)}
                </select>
              </F>
              <GenBtn cf loading={loading} onClick={() => gen({ tool: 'ugc', product: ugcProduct, brand: ugcBrand, platform: ugcPlatform })}>Build UGC ad ↗</GenBtn>
            </div>
            <Output cf text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* AI BOT */}
      {activeCF === 'bot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel cf>
            <PTitle cf>AI Content Assistant</PTitle>
            <div className="chat-wrap" id="cf-chat">
              {botMessages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>{m.text}</div>
              ))}
              {botLoading && <div className="msg bot" style={{ color: 'var(--cf)' }}>thinking…</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Ask anything…" value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendBot()} />
              <button onClick={sendBot} style={{ padding: '9px 16px', borderRadius: '7px', border: 'none', background: 'var(--cf)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>↑</button>
            </div>
          </Panel>
          <Panel cf>
            <PTitle cf>Quick questions</PTitle>
            {[
              'What should I post today on TikTok for my POD business?',
              'Give me 5 viral TikTok hooks for a POD fashion brand',
              'Write a 30-second TikTok script about building a POD business with AI',
              'How do I make my AI-generated videos look more cinematic?',
              'What type of content performs best for Black women entrepreneurs on TikTok?',
              'How do I repurpose one video across TikTok, Instagram, and YouTube?',
            ].map(q => (
              <button key={q} onClick={() => { setBotInput(q); sendBot() }}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", lineHeight: '1.4' }}>
                {q} ↗
              </button>
            ))}
          </Panel>
        </div>
      )}
    </div>
  )
}
 
// ── AI STUDIOS ───────────────────────────────────────────────
 
function AIStudiosTool() {
  const [activeStu, setActiveStu] = useState('script')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  // Script
  const [ssType, setSsType] = useState('Reality TV episode')
  const [ssTitle, setSsTitle] = useState('')
  const [ssCast, setSsCast] = useState('')
  const [ssStory, setSsStory] = useState('')
  const [ssTone, setSsTone] = useState('Dramatic and tense')
 
  // Character
  const [scName, setScName] = useState('')
  const [scAge, setScAge] = useState('')
  const [scAppearance, setScAppearance] = useState('')
  const [scStyle, setScStyle] = useState('')
  const [scPersonality, setScPersonality] = useState('')
  const [scBackstory, setScBackstory] = useState('')
 
  // Scene
  const [snCharacters, setSnCharacters] = useState('')
  const [snSetting, setSnSetting] = useState('')
  const [snAction, setSnAction] = useState('')
 
  // Podcast
  const [pdType, setPdType] = useState('Podcast episode')
  const [pdShow, setPdShow] = useState('The Creator Files hosted by Luxe Envi')
  const [pdTopic, setPdTopic] = useState('')
 
  // Lip Sync
  const [lsCharacter, setLsCharacter] = useState('Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs')
  const [lsPurpose, setLsPurpose] = useState('TikTok promotional video')
  const [lsTopic, setLsTopic] = useState('')
  const [lsLength, setLsLength] = useState('30 seconds')
  const [lsTone, setLsTone] = useState('Confident and empowering')
 
  // Multi-character
  const [mc1Name, setMc1Name] = useState('Luxe Envi')
  const [mc1Desc, setMc1Desc] = useState('Black woman, 28, luxury lifestyle creator, confident and powerful')
  const [mc2Name, setMc2Name] = useState('Marcus Reed')
  const [mc2Desc, setMc2Desc] = useState('Black man, 32, drama lead, deep voice, commanding')
  const [mc3Name, setMc3Name] = useState('')
  const [mc3Desc, setMc3Desc] = useState('')
  const [mcScene, setMcScene] = useState('Reality TV confrontation / drama')
  const [mcSetting, setMcSetting] = useState('')
  const [mcStory, setMcStory] = useState('')
  const [mcLength, setMcLength] = useState('Medium — 10 to 14 exchanges')
 
  async function gen(params: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/studios', params)) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  const stuTabs = [
    { id: 'script', label: '⊳ Script Writer' },
    { id: 'character', label: '◉ Character Builder' },
    { id: 'scene', label: '◈ Scene Builder' },
    { id: 'podcast', label: '◷ Podcast / Talk Show' },
    { id: 'lipsync', label: '✦ Lip Sync' },
    { id: 'multichar', label: '⊹ Multi-Character' },
  ]
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>AI <span style={{ color: 'var(--pn)' }}>Studios™</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '16px', lineHeight: '1.6' }}>Write reality shows, build AI characters, create cinematic scenes, podcasts, lip sync scripts, and multi-character dialogues.</div>
 
      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {stuTabs.map(t => (
          <button key={t.id} onClick={() => { setActiveStu(t.id); setOutput('') }}
            style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeStu === t.id ? 'rgba(155,109,255,0.4)' : 'var(--b)'}`, background: activeStu === t.id ? 'var(--pn3)' : 'var(--s1)', color: activeStu === t.id ? 'var(--pn)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>
 
      {/* SCRIPT WRITER */}
      {activeStu === 'script' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel hi>
            <PTitle>Script Writer</PTitle>
            <F label="Script type">
              <select style={sel} value={ssType} onChange={e => setSsType(e.target.value)}>
                {['Reality TV episode','Movie script (short film)','Documentary','Music video concept','Talk show episode','Podcast episode'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Title / show name"><input style={inp} placeholder="e.g. Baddie House, The Luxe Life, The Creator Files" value={ssTitle} onChange={e => setSsTitle(e.target.value)} /></F>
            <F label="Characters / cast"><input style={inp} placeholder="e.g. Luxe Envi, Marcus Reed, Nova Star" value={ssCast} onChange={e => setSsCast(e.target.value)} /></F>
            <F label="Story / what happens"><textarea style={ta} placeholder="What happens? Who is involved? What is the drama or message?" value={ssStory} onChange={e => setSsStory(e.target.value)} /></F>
            <F label="Tone">
              <select style={sel} value={ssTone} onChange={e => setSsTone(e.target.value)}>
                {['Dramatic and tense','Glamorous and aspirational','Funny and chaotic','Emotional and moving','Mysterious and cinematic'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <GenBtn loading={loading} onClick={() => gen({ tool: 'script', type: ssType, title: ssTitle, cast: ssCast, story: ssStory, tone: ssTone })}>Generate script ↗</GenBtn>
            <Output text={output} loading={loading} />
          </Panel>
          <div>
            <Panel mb>
              <PTitle>Quick-starts</PTitle>
              {[
                { label: 'Baddie House drama', type: 'Reality TV episode', title: 'Baddie House', cast: 'Luxe Envi, Marcus Reed, Jade', story: 'Luxe confronts Marcus about leaking her business plans — receipts get pulled, chaos ensues', tone: 'Dramatic and tense' },
                { label: 'Music video concept', type: 'Music video concept', title: 'Nova Star — Flawless', cast: 'Nova Star', story: 'A Black female AI pop star performs in a futuristic cityscape, cuts between stage and fashion moments', tone: 'Glamorous and aspirational' },
                { label: 'Creator documentary', type: 'Documentary', title: 'The Come Up', cast: 'Envi Lee', story: 'A documentary following a young Black woman building her POD empire and AI creator brand from zero', tone: 'Emotional and moving' },
                { label: 'Podcast episode', type: 'Podcast episode', title: 'The Creator Files', cast: 'Luxe Envi', story: 'How I made my first 10k with POD and AI tools — breaking down exactly what worked', tone: 'Glamorous and aspirational' },
              ].map(q => (
                <button key={q.label} onClick={() => { setSsType(q.type); setSsTitle(q.title); setSsCast(q.cast); setSsStory(q.story); setSsTone(q.tone); gen({ tool: 'script', ...q }) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                  {q.label} ↗
                </button>
              ))}
            </Panel>
            <Panel>
              <PTitle>Export to video</PTitle>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.8', marginBottom: '10px' }}>After generating your script use CineFlow to turn any scene into a cinematic video prompt then paste into Kling AI or Runway.</div>
              <button onClick={() => {
                // This will be handled by the parent Page component
                const event = new CustomEvent('switchTool', { detail: 'cineflow' })
                window.dispatchEvent(event)
              }} style={{ padding: '9px 12px', background: 'var(--cf2)', border: '0.5px solid var(--cfb)', borderRadius: '7px', fontSize: '12px', color: 'var(--cf)', cursor: 'pointer', width: '100%', fontFamily: "'DM Sans',sans-serif" }}>Open CineFlow → Make video prompts ↗</button>
            </Panel>
          </div>
        </div>
      )}
 
      {/* CHARACTER BUILDER */}
      {activeStu === 'character' && (
        <Panel hi>
          <PTitle>Character Builder</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Character name"><input style={inp} placeholder="e.g. Luxe Envi, Nova Star, Marcus Reed" value={scName} onChange={e => setScName(e.target.value)} /></F>
              <F label="Age and vibe"><input style={inp} placeholder="e.g. 28, luxury lifestyle creator, powerful energy" value={scAge} onChange={e => setScAge(e.target.value)} /></F>
              <F label="Appearance"><input style={inp} placeholder="e.g. Black woman, deep brown skin, natural locs, 5 foot 7" value={scAppearance} onChange={e => setScAppearance(e.target.value)} /></F>
              <F label="Style and fashion"><input style={inp} placeholder="e.g. luxury streetwear, designer pieces, bold accessories" value={scStyle} onChange={e => setScStyle(e.target.value)} /></F>
              <F label="Personality"><input style={inp} placeholder="e.g. bold, ambitious, charismatic, commanding, witty" value={scPersonality} onChange={e => setScPersonality(e.target.value)} /></F>
              <F label="Backstory"><input style={inp} placeholder="e.g. Built a POD empire from nothing, now an AI influencer" value={scBackstory} onChange={e => setScBackstory(e.target.value)} /></F>
              <GenBtn loading={loading} onClick={() => gen({ tool: 'character', name: scName, age: scAge, appearance: scAppearance, style: scStyle, personality: scPersonality, backstory: scBackstory })}>Build character profile ↗</GenBtn>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* SCENE BUILDER */}
      {activeStu === 'scene' && (
        <Panel hi>
          <PTitle>Scene Builder</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Characters in this scene"><input style={inp} placeholder="e.g. Luxe Envi and Marcus Reed" value={snCharacters} onChange={e => setSnCharacters(e.target.value)} /></F>
              <F label="Setting and mood"><input style={inp} placeholder="e.g. rooftop penthouse NYC at night, tense energy" value={snSetting} onChange={e => setSnSetting(e.target.value)} /></F>
              <F label="What happens"><textarea style={ta} placeholder="Describe the action, dialogue, conflict or connection in this scene..." value={snAction} onChange={e => setSnAction(e.target.value)} /></F>
              <GenBtn loading={loading} onClick={() => gen({ tool: 'scene', characters: snCharacters, setting: snSetting, action: snAction })}>Build scene + video prompt ↗</GenBtn>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* PODCAST */}
      {activeStu === 'podcast' && (
        <Panel hi>
          <PTitle>Podcast / Talk Show Script</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Format">
                <select style={sel} value={pdType} onChange={e => setPdType(e.target.value)}>
                  {['Podcast episode','Talk show episode','Interview','Roundtable discussion','Solo monologue'].map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
              <F label="Show and host"><input style={inp} value={pdShow} onChange={e => setPdShow(e.target.value)} /></F>
              <F label="Episode topic"><textarea style={ta} placeholder="What is this episode about? Key points you want to cover?" value={pdTopic} onChange={e => setPdTopic(e.target.value)} /></F>
              <GenBtn loading={loading} onClick={() => gen({ tool: 'podcast', type: pdType, show: pdShow, topic: pdTopic })}>Write episode script ↗</GenBtn>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* LIP SYNC */}
      {activeStu === 'lipsync' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel hi>
            <PTitle>Lip Sync Script Generator</PTitle>
            <F label="Character">
              <select style={sel} value={lsCharacter} onChange={e => setLsCharacter(e.target.value)}>
                {['Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs','Baddie Nova — streetwear and POD, 24, bold and confident','Nova Star — AI pop artist, 23, glamorous performer','Marcus Reed — drama lead, 32, deep voice, commanding'].map(c => <option key={c}>{c}</option>)}
              </select>
            </F>
            <F label="Video purpose">
              <select style={sel} value={lsPurpose} onChange={e => setLsPurpose(e.target.value)}>
                {['TikTok promotional video','Instagram Reel','Product launch announcement','Brand deal sponsored content','Course or academy intro','Reality show monologue','Music video lip sync','AI influencer talking head','Sales page video'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Topic / message"><textarea style={ta} placeholder="What does the character say? What is the video about?" value={lsTopic} onChange={e => setLsTopic(e.target.value)} /></F>
            <F label="Length">
              <select style={sel} value={lsLength} onChange={e => setLsLength(e.target.value)}>
                {['15 seconds','30 seconds','60 seconds','90 seconds','2-3 minutes'].map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <F label="Tone">
              <select style={sel} value={lsTone} onChange={e => setLsTone(e.target.value)}>
                {['Confident and empowering','Luxury and aspirational','Fun and energetic','Emotional and personal','Professional and authoritative','Hype and excited'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <GenBtn loading={loading} onClick={() => gen({ tool: 'lipsync', character: lsCharacter, purpose: lsPurpose, topic: lsTopic, length: lsLength, tone: lsTone })}>Generate lip sync package ↗</GenBtn>
            <Output text={output} loading={loading} />
          </Panel>
          <Panel>
            <PTitle>Free lip sync tools</PTitle>
            {[['HeyGen','heygen.com','Best quality AI lip sync'],['D-ID','d-id.com','Talking avatar creator'],['Runway','runwayml.com','Cinematic lip sync'],['ElevenLabs','elevenlabs.io','AI voice cloning']].map(([n,u,d]) => (
              <a key={n} href={`https://${u}`} target="_blank" rel="noreferrer"
                style={{ padding: '10px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: 'var(--r)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--w)', fontWeight: 500 }}>{n}</div><div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '2px' }}>{d}</div></div>
                <span style={{ color: 'var(--pn)', fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>Free ↗</span>
              </a>
            ))}
          </Panel>
        </div>
      )}
 
      {/* MULTI-CHARACTER */}
      {activeStu === 'multichar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel hi>
            <PTitle>Multi-Character Dialogue</PTitle>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '12px', border: '0.5px solid rgba(155,109,255,0.15)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pn)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '8px' }}>Character 1</div>
              <F label="Name"><input style={inp} value={mc1Name} onChange={e => setMc1Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={mc1Desc} onChange={e => setMc1Desc(e.target.value)} /></F>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '12px', border: '0.5px solid rgba(155,109,255,0.15)' }}>
              <div style={{ fontSize: '10px', color: 'var(--pn)', fontFamily: "'DM Mono',monospace", letterSpacing: '.7px', marginBottom: '8px' }}>Character 2</div>
              <F label="Name"><input style={inp} value={mc2Name} onChange={e => setMc2Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={mc2Desc} onChange={e => setMc2Desc(e.target.value)} /></F>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '12px', border: '0.5px solid var(--b)' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", letterSpacing: '.7px', marginBottom: '8px' }}>Character 3 (optional)</div>
              <F label="Name"><input style={inp} placeholder="Leave blank if only 2 characters" value={mc3Name} onChange={e => setMc3Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} placeholder="e.g. Nova Star, AI pop artist, 23, glamorous" value={mc3Desc} onChange={e => setMc3Desc(e.target.value)} /></F>
            </div>
            <F label="Scene type">
              <select style={sel} value={mcScene} onChange={e => setMcScene(e.target.value)}>
                {['Reality TV confrontation / drama','Friendship conversation','Business negotiation','Romantic tension','Comedy / funny dialogue','Interview / podcast','Mentor and student','Music video interlude','Motivational conversation','Argument / conflict'].map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Setting"><input style={inp} placeholder="e.g. rooftop party NYC, luxury penthouse, backstage concert" value={mcSetting} onChange={e => setMcSetting(e.target.value)} /></F>
            <F label="What happens"><textarea style={ta} placeholder="Describe the situation and what you want to happen..." value={mcStory} onChange={e => setMcStory(e.target.value)} /></F>
            <F label="Dialogue length">
              <select style={sel} value={mcLength} onChange={e => setMcLength(e.target.value)}>
                {['Short — 6 to 8 exchanges (30 sec)','Medium — 10 to 14 exchanges (60 sec)','Long — 16 to 20 exchanges (90 sec)'].map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <GenBtn loading={loading} onClick={() => gen({ tool: 'multichar', char1name: mc1Name, char1desc: mc1Desc, char2name: mc2Name, char2desc: mc2Desc, char3name: mc3Name, char3desc: mc3Desc, sceneType: mcScene, setting: mcSetting, story: mcStory, length: mcLength })}>Generate multi-character dialogue ↗</GenBtn>
            <Output text={output} loading={loading} />
          </Panel>
          <Panel>
            <PTitle>Multi-character workflow</PTitle>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '2.2', fontFamily: "'DM Mono',monospace", marginBottom: '14px' }}>
              <span style={{ color: 'var(--pn)' }}>Step 1</span> — Generate dialogue here<br/>
              <span style={{ color: 'var(--pn)' }}>Step 2</span> — Generate character images in Midjourney<br/>
              <span style={{ color: 'var(--pn)' }}>Step 3</span> — Generate audio per character in ElevenLabs<br/>
              <span style={{ color: 'var(--pn)' }}>Step 4</span> — Upload to InfiniteTalk Multi or Dzine AI<br/>
              <span style={{ color: 'var(--pn)' }}>Step 5</span> — Generate → download → post
            </div>
            <PTitle>Best tools</PTitle>
            {[['InfiniteTalk Multi','infinitetalk.net','2-character lip sync'],['Dzine AI','dzine.ai','Multi-face animation'],['Runway Gen-3','runwayml.com','Multi-face lip sync'],['Vozo AI','vozo.ai','Auto-detects speakers']].map(([n,u,d]) => (
              <a key={n} href={`https://${u}`} target="_blank" rel="noreferrer"
                style={{ padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: 'var(--r)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--w)', fontWeight: 500 }}>{n}</div><div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '2px' }}>{d}</div></div>
                <span style={{ color: 'var(--pn)', fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>Free ↗</span>
              </a>
            ))}
          </Panel>
        </div>
      )}
    </div>
  )
}
 
// ── BRAND DEALS ──────────────────────────────────────────────
 
function BrandDealsTool() {
  const [activeTab, setActiveTab] = useState('pitch')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  // Pitch
  const [brand, setBrand] = useState('')
  const [dealType, setDealType] = useState('Sponsored content (paid posts)')
  const [audience, setAudience] = useState('TikTok 85k, Instagram 42k, avg 8% engagement')
  const [rate, setRate] = useState('')
  const [fit, setFit] = useState('')
  const [tone, setTone] = useState('Confident and professional')
 
  // Rate card
  const [platforms, setPlatforms] = useState('TikTok 85k, Instagram 42k')
  const [niche, setNiche] = useState('POD fashion and AI influencer creator')
 
  // Follow up
  const [fuBrand, setFuBrand] = useState('')
  const [fuPrevious, setFuPrevious] = useState('sent initial pitch 1 week ago')
  const [fuTone, setFuTone] = useState('Confident and professional')
 
  // Counter
  const [coBrand, setCoBrand] = useState('')
  const [coOffer, setCoOffer] = useState('')
  const [coCounter, setCoCounter] = useState('')
  const [coTone, setCoTone] = useState('Confident and professional')
 
  // Contract
  const [ctBrand, setCtBrand] = useState('')
  const [ctType, setCtType] = useState('Sponsored content')
  const [ctRate, setCtRate] = useState('')
  const [ctDeliverables, setCtDeliverables] = useState('')
 
  async function gen(params: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/deals', params)) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  const tabs = [
    { id: 'pitch', label: '◎ Pitch Email' },
    { id: 'ratecard', label: '⊹ Rate Card' },
    { id: 'followup', label: '◷ Follow Up' },
    { id: 'counter', label: '⊳ Counter Offer' },
    { id: 'contract', label: '◈ Contract' },
  ]
 
  const goldStyle = { color: '#e8c76a' }
  const goldBorder = { borderColor: 'rgba(232,199,106,0.3)' }
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Brand <span style={{ color: '#e8c76a' }}>Deals</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '16px', lineHeight: '1.6' }}>Pitch emails, rate cards, follow-ups, counter offers, and contract outlines. Close deals like a pro.</div>
 
      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setOutput('') }}
            style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeTab === t.id ? 'rgba(232,199,106,0.4)' : 'var(--b)'}`, background: activeTab === t.id ? 'rgba(232,199,106,0.1)' : 'var(--s1)', color: activeTab === t.id ? '#e8c76a' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>
 
      {/* PITCH EMAIL */}
      {activeTab === 'pitch' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel hi>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', fontWeight: 500, color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Pitch Email Generator</div>
            <F label="Brand name"><input style={inp} placeholder="e.g. FashionNova, Target, Shein, Nike" value={brand} onChange={e => setBrand(e.target.value)} /></F>
            <F label="Deal type">
              <select style={sel} value={dealType} onChange={e => setDealType(e.target.value)}>
                {['Sponsored content (paid posts)','Brand ambassador','Collection collaboration','UGC content package','Affiliate partnership'].map(d => <option key={d}>{d}</option>)}
              </select>
            </F>
            <F label="Your audience and platforms"><input style={inp} value={audience} onChange={e => setAudience(e.target.value)} /></F>
            <F label="Your rate ask"><input style={inp} placeholder="e.g. $2,500 per post, $5k for 3-post campaign" value={rate} onChange={e => setRate(e.target.value)} /></F>
            <F label="Why this brand fits your audience"><input style={inp} placeholder="e.g. My audience is 80% Black women 25-40 who love fashion" value={fit} onChange={e => setFit(e.target.value)} /></F>
            <F label="Tone">
              <select style={sel} value={tone} onChange={e => setTone(e.target.value)}>
                {['Confident and professional','Warm and personal','Bold and direct'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <button onClick={() => gen({ tool: 'pitch', brand, type: dealType, audience, rate, fit, tone })} disabled={loading}
              style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(232,199,106,0.2)' : '#e8c76a', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : '0 0 20px rgba(232,199,106,0.3)' }}>
              {loading ? 'Writing…' : 'Generate pitch email ↗'}
            </button>
            <Output text={output} loading={loading} />
          </Panel>
          <div>
            <Panel mb>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Quick-starts</div>
              {[
                { label: 'FashionNova pitch', brand: 'FashionNova', type: 'Sponsored content (paid posts)', audience: 'TikTok 85k, Instagram 42k, 8% engagement', rate: '$3,500 for 4-post monthly campaign', fit: 'My audience is 80% Black women 25-40 who love fast fashion trends', tone: 'Confident and professional' },
                { label: 'Printify ambassador', brand: 'Printify', type: 'Brand ambassador', audience: 'TikTok 85k, POD creator audience', rate: '$2,000 per month plus affiliate commission', fit: 'My entire audience are POD sellers — they are your perfect customer', tone: 'Warm and personal' },
                { label: 'Shein collab', brand: 'Shein', type: 'Collection collaboration', audience: 'TikTok 85k, Instagram 42k', rate: '$5,800 flat for campaign', fit: 'My aesthetic and audience aligns perfectly with Shein target demographic', tone: 'Bold and direct' },
              ].map(q => (
                <button key={q.label} onClick={() => { setBrand(q.brand); setDealType(q.type); setAudience(q.audience); setRate(q.rate); setFit(q.fit); setTone(q.tone); gen({ tool: 'pitch', ...q }) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                  {q.label} ↗
                </button>
              ))}
            </Panel>
            <Panel>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Deal tips</div>
              {[['Always state your rate upfront','Never ask what their budget is — you set the price'],['Lead with your audience','Brands care about who watches you, not just how many'],['Follow up exactly once','Wait 7 days then send one confident follow-up'],['Counter every low offer','Never accept the first offer — always counter']].map(([t,d]) => (
                <div key={t} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#e8c76a', marginBottom: '2px' }}>{t}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}
 
      {/* RATE CARD */}
      {activeTab === 'ratecard' && (
        <Panel hi>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Rate Card Builder</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Your platforms and following"><input style={inp} value={platforms} onChange={e => setPlatforms(e.target.value)} /></F>
              <F label="Your niche"><input style={inp} value={niche} onChange={e => setNiche(e.target.value)} /></F>
              <button onClick={() => gen({ tool: 'ratecard', platforms, niche })} disabled={loading}
                style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(232,199,106,0.2)' : '#e8c76a', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s' }}>
                {loading ? 'Building…' : 'Build my rate card ↗'}
              </button>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* FOLLOW UP */}
      {activeTab === 'followup' && (
        <Panel hi>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Follow Up Email</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Brand name"><input style={inp} placeholder="e.g. FashionNova" value={fuBrand} onChange={e => setFuBrand(e.target.value)} /></F>
              <F label="Previous contact"><input style={inp} value={fuPrevious} onChange={e => setFuPrevious(e.target.value)} /></F>
              <F label="Tone">
                <select style={sel} value={fuTone} onChange={e => setFuTone(e.target.value)}>
                  {['Confident and professional','Warm and personal','Bold and direct'].map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
              <button onClick={() => gen({ tool: 'followup', brand: fuBrand, previous: fuPrevious, tone: fuTone })} disabled={loading}
                style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(232,199,106,0.2)' : '#e8c76a', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s' }}>
                {loading ? 'Writing…' : 'Write follow up ↗'}
              </button>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* COUNTER OFFER */}
      {activeTab === 'counter' && (
        <Panel hi>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Counter Offer Email</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Brand name"><input style={inp} placeholder="e.g. FashionNova" value={coBrand} onChange={e => setCoBrand(e.target.value)} /></F>
              <F label="Their offer"><input style={inp} placeholder="e.g. $500 for 2 posts" value={coOffer} onChange={e => setCoOffer(e.target.value)} /></F>
              <F label="Your counter"><input style={inp} placeholder="e.g. $2,500 for 2 posts" value={coCounter} onChange={e => setCoCounter(e.target.value)} /></F>
              <F label="Tone">
                <select style={sel} value={coTone} onChange={e => setCoTone(e.target.value)}>
                  {['Confident and professional','Warm and personal','Bold and direct'].map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
              <button onClick={() => gen({ tool: 'counter', brand: coBrand, offer: coOffer, counter: coCounter, tone: coTone })} disabled={loading}
                style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(232,199,106,0.2)' : '#e8c76a', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s' }}>
                {loading ? 'Writing…' : 'Write counter offer ↗'}
              </button>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* CONTRACT */}
      {activeTab === 'contract' && (
        <Panel hi>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#e8c76a', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Contract Outline</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Brand name"><input style={inp} placeholder="e.g. FashionNova" value={ctBrand} onChange={e => setCtBrand(e.target.value)} /></F>
              <F label="Deal type">
                <select style={sel} value={ctType} onChange={e => setCtType(e.target.value)}>
                  {['Sponsored content','Brand ambassador','Collection collaboration','UGC package','Affiliate deal'].map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
              <F label="Agreed rate"><input style={inp} placeholder="e.g. $3,500 for 4 posts" value={ctRate} onChange={e => setCtRate(e.target.value)} /></F>
              <F label="Deliverables"><input style={inp} placeholder="e.g. 4 TikTok videos, 2 Instagram Reels over 30 days" value={ctDeliverables} onChange={e => setCtDeliverables(e.target.value)} /></F>
              <button onClick={() => gen({ tool: 'contract', brand: ctBrand, type: ctType, rate: ctRate, deliverables: ctDeliverables })} disabled={loading}
                style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(232,199,106,0.2)' : '#e8c76a', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s' }}>
                {loading ? 'Writing…' : 'Generate contract outline ↗'}
              </button>
              <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(232,199,106,0.08)', border: '0.5px solid rgba(232,199,106,0.2)', borderRadius: 'var(--r)', fontSize: '11px', color: '#e8c76a', lineHeight: '1.6' }}>
                ⚠ This is a template outline for reference only. Always have a lawyer review any contract before signing.
              </div>
            </div>
            <Output text={output} loading={loading} />
          </div>
        </Panel>
      )}
    </div>
  )
}
 
// ── LIP SYNC STUDIO ──────────────────────────────────────────
 
function LipSyncTool() {
  const [activeTab, setActiveTab] = useState('single')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  // Single character
  const [character, setCharacter] = useState('Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs')
  const [purpose, setPurpose] = useState('TikTok promotional video')
  const [topic, setTopic] = useState('')
  const [length, setLength] = useState('30 seconds')
  const [tone, setTone] = useState('Confident and empowering')
 
  // Multi character
  const [c1Name, setC1Name] = useState('Luxe Envi')
  const [c1Desc, setC1Desc] = useState('Black woman, 28, luxury lifestyle creator, confident and powerful')
  const [c2Name, setC2Name] = useState('Marcus Reed')
  const [c2Desc, setC2Desc] = useState('Black man, 32, drama lead, deep voice, commanding')
  const [c3Name, setC3Name] = useState('')
  const [c3Desc, setC3Desc] = useState('')
  const [mcScene, setMcScene] = useState('Reality TV confrontation / drama')
  const [mcSetting, setMcSetting] = useState('')
  const [mcStory, setMcStory] = useState('')
  const [mcLength, setMcLength] = useState('Medium — 10 to 14 exchanges')
 
  // Voice script
  const [voiceType, setVoiceType] = useState('Confident Black woman — warm, powerful, commanding')
  const [voicePurpose, setVoicePurpose] = useState('TikTok voiceover')
  const [voiceMessage, setVoiceMessage] = useState('')
 
  async function gen(params: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/lipsync', params)) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  const lsTabs = [
    { id: 'single', label: '◈ Single Character' },
    { id: 'multi', label: '⊹ Multi-Character' },
    { id: 'voice', label: '◷ Voice Script' },
  ]
 
  const purpleNeon = '#b06cff'
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Lip Sync <span style={{ color: purpleNeon }}>Studio</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '16px', lineHeight: '1.6' }}>Generate scripts, voice packages, and multi-character dialogues ready for HeyGen, D-ID, ElevenLabs, and InfiniteTalk.</div>
 
      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {lsTabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setOutput('') }}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeTab === t.id ? 'rgba(176,108,255,0.4)' : 'var(--b)'}`, background: activeTab === t.id ? 'rgba(176,108,255,0.12)' : 'var(--s1)', color: activeTab === t.id ? purpleNeon : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>
 
      {/* SINGLE CHARACTER */}
      {activeTab === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel hi>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Lip Sync Script Generator</div>
            <F label="Character">
              <select style={sel} value={character} onChange={e => setCharacter(e.target.value)}>
                {['Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs','Baddie Nova — streetwear and POD, 24, bold and confident','Nova Star — AI pop artist, 23, glamorous performer','Marcus Reed — drama lead, 32, deep voice, commanding'].map(c => <option key={c}>{c}</option>)}
              </select>
            </F>
            <F label="Video purpose">
              <select style={sel} value={purpose} onChange={e => setPurpose(e.target.value)}>
                {['TikTok promotional video','Instagram Reel','Product launch announcement','Brand deal sponsored content','Course or academy intro','Reality show monologue','Music video lip sync','AI influencer talking head','Sales page video'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Topic / message"><textarea style={ta} placeholder="What does the character say? What is the video about?" value={topic} onChange={e => setTopic(e.target.value)} /></F>
            <F label="Length">
              <select style={sel} value={length} onChange={e => setLength(e.target.value)}>
                {['15 seconds','30 seconds','60 seconds','90 seconds','2-3 minutes'].map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <F label="Tone">
              <select style={sel} value={tone} onChange={e => setTone(e.target.value)}>
                {['Confident and empowering','Luxury and aspirational','Fun and energetic','Emotional and personal','Professional and authoritative','Hype and excited'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <button onClick={() => gen({ tool: 'single', character, purpose, topic, length, tone })} disabled={loading}
              style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(176,108,255,0.2)' : purpleNeon, color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : '0 0 20px rgba(176,108,255,0.3)' }}>
              {loading ? 'Generating…' : 'Generate lip sync package ↗'}
            </button>
            <Output text={output} loading={loading} />
          </Panel>
          <div>
            <Panel mb>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Quick-starts</div>
              {[
                { label: 'Luxe Envi — product promo', character: 'Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs', purpose: 'TikTok promotional video', topic: 'Promoting my POD fashion collection — luxury swim set just dropped, link in bio to shop', length: '30 seconds', tone: 'Confident and empowering' },
                { label: 'Nova Star — music video', character: 'Nova Star — AI pop artist, 23, glamorous performer', purpose: 'Music video lip sync', topic: 'Singing the chorus of a brand new pop anthem about being unstoppable and living in luxury', length: '30 seconds', tone: 'Hype and excited' },
                { label: 'Academy welcome video', character: 'Luxe Envi — luxury lifestyle creator, 28, Black woman, natural locs', purpose: 'Course or academy intro', topic: 'Welcome to Baddie Academy — inside you will learn how to build a POD business and AI influencer brand from scratch', length: '60 seconds', tone: 'Professional and authoritative' },
                { label: 'Brand deal content', character: 'Baddie Nova — streetwear and POD, 24, bold and confident', purpose: 'Brand deal sponsored content', topic: 'Talking about a fashion brand partnership — authentic, showing off the product naturally', length: '30 seconds', tone: 'Fun and energetic' },
              ].map(q => (
                <button key={q.label} onClick={() => { setCharacter(q.character); setPurpose(q.purpose); setTopic(q.topic); setLength(q.length); setTone(q.tone); gen({ tool: 'single', ...q }) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                  {q.label} ↗
                </button>
              ))}
            </Panel>
            <Panel>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Free lip sync tools</div>
              {[['HeyGen','heygen.com','Best quality AI lip sync'],['D-ID','d-id.com','Talking avatar creator'],['Runway Gen-3','runwayml.com','Cinematic lip sync'],['ElevenLabs','elevenlabs.io','AI voice cloning']].map(([n,u,d]) => (
                <a key={n} href={`https://${u}`} target="_blank" rel="noreferrer"
                  style={{ padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: 'var(--r)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--w)', fontWeight: 500 }}>{n}</div><div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '2px' }}>{d}</div></div>
                  <span style={{ color: purpleNeon, fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>Free ↗</span>
                </a>
              ))}
            </Panel>
          </div>
        </div>
      )}
 
      {/* MULTI CHARACTER */}
      {activeTab === 'multi' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel hi>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Multi-Character Dialogue</div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '10px', border: '0.5px solid rgba(176,108,255,0.15)' }}>
              <div style={{ fontSize: '10px', color: purpleNeon, fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>CHARACTER 1</div>
              <F label="Name"><input style={inp} value={c1Name} onChange={e => setC1Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={c1Desc} onChange={e => setC1Desc(e.target.value)} /></F>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '10px', border: '0.5px solid rgba(176,108,255,0.15)' }}>
              <div style={{ fontSize: '10px', color: purpleNeon, fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>CHARACTER 2</div>
              <F label="Name"><input style={inp} value={c2Name} onChange={e => setC2Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={c2Desc} onChange={e => setC2Desc(e.target.value)} /></F>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '10px', border: '0.5px solid var(--b)' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>CHARACTER 3 (optional)</div>
              <F label="Name"><input style={inp} placeholder="Leave blank if only 2 characters" value={c3Name} onChange={e => setC3Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={c3Desc} onChange={e => setC3Desc(e.target.value)} /></F>
            </div>
            <F label="Scene type">
              <select style={sel} value={mcScene} onChange={e => setMcScene(e.target.value)}>
                {['Reality TV confrontation / drama','Friendship conversation','Business negotiation','Romantic tension','Comedy / funny dialogue','Interview / podcast','Mentor and student','Music video interlude','Motivational conversation','Argument / conflict'].map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Setting"><input style={inp} placeholder="e.g. rooftop party NYC, luxury penthouse, backstage concert" value={mcSetting} onChange={e => setMcSetting(e.target.value)} /></F>
            <F label="What happens"><textarea style={ta} placeholder="Describe the situation and what you want to happen..." value={mcStory} onChange={e => setMcStory(e.target.value)} /></F>
            <F label="Length">
              <select style={sel} value={mcLength} onChange={e => setMcLength(e.target.value)}>
                {['Short — 6 to 8 exchanges (30 sec)','Medium — 10 to 14 exchanges (60 sec)','Long — 16 to 20 exchanges (90 sec)'].map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <button onClick={() => gen({ tool: 'multi', c1name: c1Name, c1desc: c1Desc, c2name: c2Name, c2desc: c2Desc, c3name: c3Name, c3desc: c3Desc, scene: mcScene, setting: mcSetting, story: mcStory, length: mcLength })} disabled={loading}
              style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(176,108,255,0.2)' : purpleNeon, color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : '0 0 20px rgba(176,108,255,0.3)' }}>
              {loading ? 'Generating…' : 'Generate multi-character dialogue ↗'}
            </button>
            <Output text={output} loading={loading} />
          </Panel>
          <div>
            <Panel mb>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Quick-starts</div>
              {[
                { label: 'Baddie House rooftop drama', c1name: 'Luxe Envi', c1desc: 'Black woman, 28, luxury lifestyle creator, confident and powerful', c2name: 'Marcus Reed', c2desc: 'Black man, 32, drama lead, deep voice, commanding', c3name: '', c3desc: '', scene: 'Reality TV confrontation / drama', setting: 'luxury rooftop penthouse NYC night', story: 'Luxe confronts Marcus about leaking her business plans to a competitor — tension is high', length: 'Medium — 10 to 14 exchanges (60 sec)' },
                { label: 'Mentor and student', c1name: 'Luxe Envi', c1desc: 'Black woman, 28, powerful mentor energy', c2name: 'Jade', c2desc: 'Black woman, 22, aspiring creator, eager to learn', c3name: '', c3desc: '', scene: 'Mentor and student', setting: 'modern coworking space with floor to ceiling windows', story: 'Luxe mentors Jade on how to build her AI influencer brand and stop playing small', length: 'Medium — 10 to 14 exchanges (60 sec)' },
                { label: '3-character podcast', c1name: 'Luxe Envi', c1desc: 'Black woman, 28, warm and inspiring host', c2name: 'Baddie Nova', c2desc: 'Black woman, 24, bold and real', c3name: 'Nova Star', c3desc: 'AI pop artist, 23, glamorous and energetic', scene: 'Interview / podcast', setting: 'podcast studio with moody lighting and ring lights', story: 'Roundtable on how they each built their AI empires and what advice they would give other Black women creators', length: 'Long — 16 to 20 exchanges (90 sec)' },
              ].map(q => (
                <button key={q.label} onClick={() => { setC1Name(q.c1name); setC1Desc(q.c1desc); setC2Name(q.c2name); setC2Desc(q.c2desc); setC3Name(q.c3name); setC3Desc(q.c3desc); setMcScene(q.scene); setMcSetting(q.setting); setMcStory(q.story); setMcLength(q.length); gen({ tool: 'multi', c1name: q.c1name, c1desc: q.c1desc, c2name: q.c2name, c2desc: q.c2desc, c3name: q.c3name, c3desc: q.c3desc, scene: q.scene, setting: q.setting, story: q.story, length: q.length }) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                  {q.label} ↗
                </button>
              ))}
            </Panel>
            <Panel>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Multi-character workflow</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '2.2', fontFamily: "'DM Mono',monospace" }}>
                <span style={{ color: purpleNeon }}>Step 1</span> — Generate dialogue here<br/>
                <span style={{ color: purpleNeon }}>Step 2</span> — Generate character images in Midjourney<br/>
                <span style={{ color: purpleNeon }}>Step 3</span> — Generate audio per character in ElevenLabs<br/>
                <span style={{ color: purpleNeon }}>Step 4</span> — Upload to InfiniteTalk Multi or Dzine AI<br/>
                <span style={{ color: purpleNeon }}>Step 5</span> — Generate → download → post
              </div>
            </Panel>
          </div>
        </div>
      )}
 
      {/* VOICE SCRIPT */}
      {activeTab === 'voice' && (
        <Panel hi>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: purpleNeon, textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>Voice Script Generator</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Voice type">
                <select style={sel} value={voiceType} onChange={e => setVoiceType(e.target.value)}>
                  {['Confident Black woman — warm, powerful, commanding','Luxurious female — soft, elevated, aspirational','Energetic creator — fun, fast, relatable','Male — deep, authoritative, calm','Young female — bright, excited, trendy'].map(v => <option key={v}>{v}</option>)}
                </select>
              </F>
              <F label="Purpose"><input style={inp} placeholder="e.g. TikTok voiceover, podcast intro, ad narration" value={voicePurpose} onChange={e => setVoicePurpose(e.target.value)} /></F>
              <F label="Key message"><textarea style={ta} placeholder="What do you want the voiceover to say? Key points, feeling, CTA..." value={voiceMessage} onChange={e => setVoiceMessage(e.target.value)} /></F>
              <button onClick={() => gen({ tool: 'voice', voice: voiceType, purpose: voicePurpose, message: voiceMessage })} disabled={loading}
                style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(176,108,255,0.2)' : purpleNeon, color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : '0 0 20px rgba(176,108,255,0.3)' }}>
                {loading ? 'Writing…' : 'Generate voice script ↗'}
              </button>
            </div>
            <div>
              <Output text={output} loading={loading} />
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(176,108,255,0.08)', border: '0.5px solid rgba(176,108,255,0.2)', borderRadius: 'var(--r)', fontSize: '11px', color: purpleNeon, lineHeight: '1.8' }}>
                <strong>ElevenLabs tip:</strong><br/>
                Copy your script → go to elevenlabs.io → paste into the text box → pick a voice or clone your own → generate → download the audio → use in your videos.
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}
 
// ── COLLECTION BUILDER ───────────────────────────────────────
 
function CollectionTool() {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('luxury fashion')
  const [audience, setAudience] = useState('Black women aged 22–40')
  const [season, setSeason] = useState('All season')
  const [pieces, setPieces] = useState('6')
  const [priceRange, setPriceRange] = useState('$30–$100')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  async function run(body?: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/tools', body ?? { tool: 'collection', name, theme, audience, season, pieces, priceRange })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Collection <span style={{ color: 'var(--pn)' }}>Builder</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>Plan a complete POD collection — name ideas, pieces, color palette, pricing, and a full launch strategy.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel hi>
          <PTitle>Collection details</PTitle>
          <F label="Collection name (or leave blank for AI to suggest)"><input style={inp} placeholder="e.g. Baddie Summer, Luxe Noir, The Come Up" value={name} onChange={e => setName(e.target.value)} /></F>
          <F label="Theme or vibe"><input style={inp} value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. luxury fashion, streetwear, beach vibes" /></F>
          <F label="Target audience"><input style={inp} value={audience} onChange={e => setAudience(e.target.value)} /></F>
          <F label="Season or occasion">
            <select style={sel} value={season} onChange={e => setSeason(e.target.value)}>
              {['All season','Summer','Winter','Spring','Fall','Holiday','Valentine\'s Day','Birthday','Graduation','Wedding'].map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Number of pieces">
            <select style={sel} value={pieces} onChange={e => setPieces(e.target.value)}>
              {['4','6','8','10','12'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Price range">
            <select style={sel} value={priceRange} onChange={e => setPriceRange(e.target.value)}>
              {['$20–$50','$30–$80','$40–$100','$50–$150','$75–$200'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <GenBtn loading={loading} onClick={() => run()}>Build collection plan ↗</GenBtn>
          <Output text={output} loading={loading} />
        </Panel>
        <div>
          <Panel mb>
            <PTitle>Quick-starts</PTitle>
            {[
              { label: 'Baddie Summer collection', name: 'Baddie Summer', theme: 'luxury beach and summer lifestyle', audience: 'Black women aged 22–40', season: 'Summer', pieces: '6', priceRange: '$30–$80' },
              { label: 'Luxe Noir collection', name: 'Luxe Noir', theme: 'all black luxury streetwear', audience: 'Black women aged 25–45', season: 'All season', pieces: '8', priceRange: '$50–$150' },
              { label: 'Holiday Glam collection', name: 'Holiday Glam', theme: 'festive luxury holiday fashion', audience: 'Black women aged 22–40', season: 'Holiday', pieces: '6', priceRange: '$40–$100' },
              { label: 'The Come Up collection', name: 'The Come Up', theme: 'boss babe entrepreneur aesthetic', audience: 'Black women entrepreneurs aged 25–40', season: 'All season', pieces: '6', priceRange: '$35–$90' },
            ].map(q => (
              <button key={q.label} onClick={() => run({ tool: 'collection', ...q })}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                {q.label} ↗
              </button>
            ))}
          </Panel>
          <Panel>
            <PTitle>What you get</PTitle>
            {[
              ['Collection overview','The story and vision behind your collection'],
              ['5 name ideas','Creative names that fit the vibe'],
              ['Full piece list','Every item with description, price, and platform'],
              ['Color palette','5 hex codes that define the collection'],
              ['Launch strategy','5 steps to launch on TikTok and Etsy'],
              ['Collection hashtags','15 tags ready to use'],
            ].map(([l, d]) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--pn)', marginBottom: '2px' }}>{l}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}
 
// ── PROFIT CALCULATOR ─────────────────────────────────────────
 
function ProfitTool() {
  const [product, setProduct] = useState('T-Shirt')
  const [sellPrice, setSellPrice] = useState('35')
  const [baseCost, setBaseCost] = useState('12')
  const [platform, setPlatform] = useState('Etsy')
  const [monthlySales, setMonthlySales] = useState('50')
  const [shipping, setShipping] = useState('4.99')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/tools', { tool: 'profit', product, sellPrice, baseCost, platform, monthlySales, shipping })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }
 
  const profitEstimate = Math.max(0, parseFloat(sellPrice || '0') - parseFloat(baseCost || '0') - (parseFloat(sellPrice || '0') * 0.065) - (parseFloat(sellPrice || '0') * 0.03)).toFixed(2)
  const monthlyEstimate = (parseFloat(profitEstimate) * parseInt(monthlySales || '0')).toFixed(2)
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Profit <span style={{ color: 'var(--pn)' }}>Calculator</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '24px', lineHeight: '1.6' }}>Calculate your real profit per sale, monthly income projections, and get a scale strategy to hit your revenue goals.</div>
 
      {/* QUICK ESTIMATE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Est. profit per sale', value: `$${profitEstimate}`, color: 'var(--pn)' },
          { label: 'Est. monthly profit', value: `$${monthlyEstimate}`, color: '#e8c76a' },
          { label: 'Est. yearly profit', value: `$${(parseFloat(monthlyEstimate) * 12).toFixed(0)}`, color: 'var(--cf)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--s1)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', padding: '16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '26px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</div>
          </div>
        ))}
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel hi>
          <PTitle>Your numbers</PTitle>
          <F label="Product type">
            <select style={sel} value={product} onChange={e => setProduct(e.target.value)}>
              {['T-Shirt','Hoodie','Swimwear','Leggings','Hat','Bag','Tumbler','Shoes','Dress','Jacket'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Your selling price ($)"><input style={inp} type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="35" /></F>
          <F label="Printify base cost ($)"><input style={inp} type="number" value={baseCost} onChange={e => setBaseCost(e.target.value)} placeholder="12" /></F>
          <F label="Shipping charge to customer ($)"><input style={inp} type="number" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="4.99" /></F>
          <F label="Selling platform">
            <select style={sel} value={platform} onChange={e => setPlatform(e.target.value)}>
              {['Etsy','Shopify','TikTok Shop','Amazon','Your own website'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Monthly sales goal (units)"><input style={inp} type="number" value={monthlySales} onChange={e => setMonthlySales(e.target.value)} placeholder="50" /></F>
          <GenBtn loading={loading} onClick={run}>Calculate full profit breakdown ↗</GenBtn>
          <Output text={output} loading={loading} />
        </Panel>
        <div>
          <Panel mb>
            <PTitle>Platform fee guide</PTitle>
            {[
              ['Etsy','6.5% transaction + $0.20 listing + 3% payment'],
              ['Shopify','2.9% + $0.30 per transaction'],
              ['TikTok Shop','5–8% commission per sale'],
              ['Amazon','8–15% referral fee depending on category'],
              ['Your own website','Only payment processing 2.9% + $0.30'],
            ].map(([p, f]) => (
              <div key={p} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--pn)', marginBottom: '2px' }}>{p}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{f}</div>
              </div>
            ))}
          </Panel>
          <Panel>
            <PTitle>Printify average base costs</PTitle>
            {[
              ['T-Shirt','$8–$14'],
              ['Hoodie','$18–$28'],
              ['Swimwear','$22–$35'],
              ['Leggings','$18–$26'],
              ['Hat','$12–$18'],
              ['Tumbler','$14–$20'],
            ].map(([item, cost]) => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg3)', borderRadius: 'var(--r)', marginBottom: '5px', fontSize: '12px' }}>
                <span style={{ color: 'var(--w2)' }}>{item}</span>
                <span style={{ color: 'var(--pn)', fontFamily: "'DM Mono',monospace" }}>{cost}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}
 
// ── IMAGE GENERATOR ───────────────────────────────────────────
 
function ImageGenTool() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('fashion')
  const [size, setSize] = useState('portrait')
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, ugly, watermark')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
 
  async function generate() {
    if (!prompt.trim()) { setError('Please enter a prompt first'); return }
    setLoading(true); setError(''); setImageUrl(null)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size, negativePrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Image generation failed')
      setImageUrl(data.imageUrl)
    } catch (e) {
      setError((e as Error).message)
    } finally { setLoading(false) }
  }
 
  async function saveImage() {
    if (!imageUrl) return
    const existing = JSON.parse(localStorage.getItem('savedWork') || '[]')
    existing.unshift({ id: Date.now(), tool: 'Image Generator', content: '', prompt, imageUrl, savedAt: new Date().toISOString() })
    localStorage.setItem('savedWork', JSON.stringify(existing.slice(0, 100)))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
 
  function download() {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `envi-lee-image-${Date.now()}.jpg`
    a.target = '_blank'
    a.click()
  }
 
  const quickPrompts = [
    { label: 'Luxury swim set model', prompt: 'Black woman with deep brown skin and natural hair, wearing a black and gold luxury floral swimsuit, standing at a poolside luxury resort in the Maldives, golden hour warm light, editorial fashion photography' },
    { label: 'Streetwear hoodie', prompt: 'Black woman in an oversized city skyline graphic hoodie, NYC street style, autumn afternoon, confident pose, urban editorial photography' },
    { label: 'AI influencer portrait', prompt: 'Black woman AI influencer, natural locs, wearing designer luxury streetwear, dramatic studio lighting, powerful confident gaze, high fashion editorial' },
    { label: 'Product flat lay', prompt: 'Luxury fashion flat lay, white crop tee with minimal gold embroidery, marble surface, gold jewelry props, clean minimal product photography' },
  ]
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Image <span style={{ color: 'var(--pn)' }}>Generator</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '8px', lineHeight: '1.6' }}>Generate real AI images directly inside your suite — fashion mockups, model shots, product photos, and more.</div>
      <div style={{ background: 'var(--pn3)', border: '0.5px solid rgba(155,109,255,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: 'var(--pn)', fontFamily: "'DM Mono',monospace" }}>
        ✦ Powered by FLUX via fal.ai · FAL_API_KEY required in Vercel env vars
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel hi>
          <PTitle>Image details</PTitle>
          <F label="Prompt — describe your image"><textarea style={{ ...ta, minHeight: '100px' }} placeholder="e.g. Black woman wearing a luxury floral crop tee, NYC rooftop at golden hour, editorial fashion photography..." value={prompt} onChange={e => setPrompt(e.target.value)} /></F>
          <F label="Style">
            <select style={sel} value={style} onChange={e => setStyle(e.target.value)}>
              {[['fashion','Fashion Editorial'],['luxury','Luxury Lifestyle'],['streetwear','Streetwear Urban'],['product','Product Photography'],['cinematic','Cinematic Film'],['portrait','Portrait']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Size">
            <select style={sel} value={size} onChange={e => setSize(e.target.value)}>
              {[['portrait','Portrait (3:4) — best for fashion'],['square','Square (1:1) — Instagram'],['tiktok','TikTok (9:16) — vertical'],['landscape','Landscape (4:3) — banner']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </F>
          <F label="Negative prompt (what to exclude)"><input style={inp} value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} /></F>
 
          <GenBtn loading={loading} onClick={generate}>
            {loading ? 'Generating image…' : '✦ Generate Image'}
          </GenBtn>
 
          {error && <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,45,120,0.1)', border: '0.5px solid rgba(255,45,120,0.3)', borderRadius: '7px', fontSize: '12px', color: '#ff6b9d' }}>{error}</div>}
 
          {/* IMAGE RESULT */}
          {loading && (
            <div style={{ marginTop: '12px', background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', padding: '30px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>✦</div>
              <div style={{ fontSize: '13px', color: 'var(--pn)', marginBottom: '8px' }}>Generating your image…</div>
              <div style={{ height: '2px', background: 'rgba(155,109,255,0.1)', overflow: 'hidden', borderRadius: '1px', width: '120px', margin: '0 auto' }}><div className="lbar-fill" /></div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '8px' }}>Usually takes 5–15 seconds</div>
            </div>
          )}
 
          {imageUrl && !loading && (
            <div style={{ marginTop: '12px', background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
              <img src={imageUrl} alt="Generated" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                <button onClick={download} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,var(--c),var(--pn))', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>⬇ Download</button>
                <button onClick={saveImage} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: `0.5px solid ${saved ? 'var(--pn)' : 'var(--b2)'}`, background: saved ? 'var(--pn3)' : 'var(--s2)', color: saved ? 'var(--pn)' : 'var(--mu3)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
                <button onClick={generate} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--pn)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>↺ Regenerate</button>
              </div>
            </div>
          )}
        </Panel>
 
        <div>
          <Panel mb>
            <PTitle>Quick-starts</PTitle>
            {quickPrompts.map(q => (
              <button key={q.label} onClick={() => setPrompt(q.prompt)}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                {q.label} ↗
              </button>
            ))}
          </Panel>
          <Panel mb>
            <PTitle>Prompt tips</PTitle>
            {[
              ['Be specific about the person','Include skin tone, hair type, height, expression'],
              ['Describe the garment clearly','Colors, style, fit, fabric, any graphics or text'],
              ['Set the scene','Location, time of day, lighting direction, background'],
              ['Add style keywords','Editorial, cinematic, commercial, lifestyle, runway'],
              ['Use quality boosters','Already added automatically based on your style choice'],
            ].map(([t,d]) => (
              <div key={t} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--pn)', marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
              </div>
            ))}
          </Panel>
          <Panel>
            <PTitle>Use with AI Image Prompts</PTitle>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '10px' }}>Generate a detailed prompt in the AI Image Prompts tool first, then paste it here to generate the actual image.</div>
            <button onClick={() => {}} style={{ padding: '9px 12px', background: 'var(--pn3)', border: '0.5px solid rgba(155,109,255,0.3)', borderRadius: '7px', fontSize: '12px', color: 'var(--pn)', cursor: 'pointer', width: '100%', fontFamily: "'DM Sans',sans-serif" }}>
              ◉ Go to AI Image Prompts ↗
            </button>
          </Panel>
        </div>
      </div>
    </div>
  )
}
 
// ── SAVED WORK ────────────────────────────────────────────────
 
function SavedWorkTool() {
  const [savedItems, setSavedItems] = useState<Array<{id: number; tool: string; content: string; prompt: string; imageUrl: string; savedAt: string}>>([])
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState<number | null>(null)
 
  function load() {
    try {
      const items = JSON.parse(localStorage.getItem('savedWork') || '[]')
      setSavedItems(items)
    } catch { setSavedItems([]) }
  }
 
  function deleteItem(id: number) {
    const updated = savedItems.filter(i => i.id !== id)
    setSavedItems(updated)
    localStorage.setItem('savedWork', JSON.stringify(updated))
  }
 
  function copy(text: string, id: number) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
      }).catch(() => fallbackCopy(text, id))
    } else {
      fallbackCopy(text, id)
    }
  }
 
  function fallbackCopy(text: string, id: number) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }
 
  function clearAll() {
    if (confirm('Delete all saved work? This cannot be undone.')) {
      setSavedItems([])
      localStorage.removeItem('savedWork')
    }
  }
 
  // Load on mount
  useEffect(() => { load() }, [])
 
  const tools = ['all', ...Array.from(new Set(savedItems.map(i => i.tool)))]
  const filtered = filter === 'all' ? savedItems : savedItems.filter(i => i.tool === filter)
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Saved <span style={{ color: 'var(--pn)' }}>Work</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '20px', lineHeight: '1.6' }}>All your saved outputs, prompts, and generated images in one place.</div>
 
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <button onClick={load} style={{ padding: '7px 14px', borderRadius: '7px', border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--pn)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>↺ Refresh</button>
        {tools.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${filter === t ? 'rgba(155,109,255,0.4)' : 'var(--b)'}`, background: filter === t ? 'var(--pn3)' : 'var(--s1)', color: filter === t ? 'var(--pn)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize' as const }}>
            {t}
          </button>
        ))}
        {savedItems.length > 0 && (
          <button onClick={clearAll} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid rgba(255,45,120,0.3)', background: 'rgba(255,45,120,0.08)', color: '#ff6b9d', fontFamily: "'DM Sans',sans-serif" }}>
            Clear all
          </button>
        )}
      </div>
 
      {filtered.length === 0 ? (
        <Panel>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>◌</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--pn)', marginBottom: '6px' }}>No saved work yet</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>Use any tool and click the Save button to save your outputs here. Your work is stored in your browser.</div>
          </div>
        </Panel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background: 'var(--s1)', border: '0.5px solid var(--b)', borderRadius: 'var(--r2)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--pn3)', color: 'var(--pn)', borderRadius: '4px', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const }}>{item.tool}</span>
                  <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                </div>
                <button onClick={() => deleteItem(item.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid rgba(255,45,120,0.2)', background: 'transparent', color: '#ff6b9d', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Delete</button>
              </div>
              {item.imageUrl && <img src={item.imageUrl} alt="saved" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
              {item.prompt && <div style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginBottom: '8px', padding: '8px', background: 'var(--bg3)', borderRadius: '6px' }}>Prompt: {item.prompt.slice(0, 120)}{item.prompt.length > 120 ? '…' : ''}</div>}
              {item.content && <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', maxHeight: '120px', overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>{item.content}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {item.content && <button onClick={() => copy(item.content, item.id)} style={{ padding: '6px 12px', borderRadius: '7px', border: `0.5px solid ${copied === item.id ? 'var(--cf)' : 'var(--b2)'}`, background: copied === item.id ? 'var(--cf2)' : 'var(--s2)', color: copied === item.id ? 'var(--cf)' : 'var(--pn)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>{copied === item.id ? '✓ Copied!' : 'Copy ↗'}</button>}
                {item.imageUrl && <a href={item.imageUrl} download target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: '7px', border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--pn)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textDecoration: 'none' }}>⬇ Download</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
 
// ── VIDEO GENERATOR ───────────────────────────────────────────
 
function VideoGenTool() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('5')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [mode, setMode] = useState('standard')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
 
  async function generate() {
    if (!prompt.trim()) { setError('Please enter a prompt first'); return }
    setLoading(true); setError(''); setVideoUrl(null)
    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration, aspectRatio, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Video generation failed')
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
      } else if (data.requestId) {
        await pollForVideo(data.requestId)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally { setLoading(false) }
  }
 
  async function pollForVideo(requestId: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        const res = await fetch(`/api/generate/video?requestId=${requestId}`)
        const data = await res.json()
        if (data.status === 'completed' && data.videoUrl) { setVideoUrl(data.videoUrl); return }
        if (data.status === 'failed') throw new Error('Video generation failed')
      } catch (e) { setError((e as Error).message); return }
    }
    setError('Timed out — try again')
  }
 
  function saveVideo() {
    if (!videoUrl) return
    const existing = JSON.parse(localStorage.getItem('savedWork') || '[]')
    existing.unshift({ id: Date.now(), tool: 'Video Generator', content: '', prompt, imageUrl: videoUrl, savedAt: new Date().toISOString() })
    localStorage.setItem('savedWork', JSON.stringify(existing.slice(0, 100)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
 
  const quickPrompts = [
    { label: 'AI influencer walk', prompt: 'Black woman with natural locs wearing luxury designer streetwear, walking confidently through a high-end fashion district in Paris, golden hour sunlight, slow cinematic push-in, 8 seconds' },
    { label: 'Product reveal', prompt: 'Elegant hands slowly unfolding a luxury black and gold swimsuit against a marble surface, soft studio lighting, product reveal shot, cinematic close-up, 6 seconds' },
    { label: 'Rooftop drama scene', prompt: 'Two Black characters in designer clothes face off on an NYC rooftop at night, city lights behind them, dramatic shadows, intense eye contact, slow zoom in, cinematic film quality, 8 seconds' },
    { label: 'Concert performance', prompt: 'Black female pop star in a sequin outfit performing on a massive concert stage, spectacular lighting show, fog effects, crowd cheering, wide cinematic shot pulling back, 10 seconds' },
    { label: 'TikTok lifestyle POV', prompt: 'POV shot walking into a luxury hotel lobby, marble floors, warm golden lighting, smooth handheld camera, aspirational lifestyle, 6 seconds' },
  ]
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Video <span style={{ color: 'var(--cf)' }}>Generator</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '8px', lineHeight: '1.6' }}>Generate cinematic AI videos using Kling AI — fashion content, reality scenes, product reveals, and music videos.</div>
      <div style={{ background: 'rgba(0,200,83,0.08)', border: '0.5px solid rgba(0,200,83,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: 'var(--cf)', fontFamily: "'DM Mono',monospace" }}>
        ✦ Powered by Kling AI via fal.ai · FAL_API_KEY required · ~$0.40–$1.12 per video
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel cf>
          <PTitle cf>Video details</PTitle>
          <F label="Prompt"><textarea style={{ ...ta, minHeight: '120px' }} placeholder="e.g. Black woman in luxury crop tee on NYC rooftop, golden hour, slow cinematic push-in, 8 seconds..." value={prompt} onChange={e => setPrompt(e.target.value)} /></F>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <F label="Duration">
              <select style={sel} value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
              </select>
            </F>
            <F label="Format">
              <select style={sel} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                <option value="9:16">9:16 TikTok</option>
                <option value="16:9">16:9 YouTube</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </F>
            <F label="Quality">
              <select style={sel} value={mode} onChange={e => setMode(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
              </select>
            </F>
          </div>
          <button onClick={generate} disabled={loading}
            style={{ padding: '12px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(0,200,83,0.2)' : 'var(--cf)', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.8 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : '0 0 20px rgba(0,200,83,0.3)' }}>
            {loading ? 'Generating video — takes 1–3 minutes…' : '⊳ Generate Video'}
          </button>
          {loading && (
            <div style={{ marginTop: '12px', background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⊳</div>
              <div style={{ fontSize: '13px', color: 'var(--cf)', marginBottom: '6px', fontWeight: 600 }}>Kling AI is generating your video</div>
              <div style={{ height: '2px', background: 'rgba(0,200,83,0.1)', overflow: 'hidden', borderRadius: '1px', width: '140px', margin: '0 auto 8px' }}><div className="lbar-fill-cf" /></div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>Usually 1–3 minutes. Stay on this page.</div>
            </div>
          )}
          {error && <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,45,120,0.1)', border: '0.5px solid rgba(255,45,120,0.3)', borderRadius: '7px', fontSize: '12px', color: '#ff6b9d' }}>{error}</div>}
          {videoUrl && !loading && (
            <div style={{ marginTop: '12px', background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
              <video src={videoUrl} controls autoPlay loop style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                <a href={videoUrl} download target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', background: 'var(--cf)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', textDecoration: 'none', display: 'block' }}>⬇ Download</a>
                <button onClick={saveVideo} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: `0.5px solid ${saved ? 'var(--cf)' : 'var(--b2)'}`, background: saved ? 'var(--cf2)' : 'var(--s2)', color: saved ? 'var(--cf)' : 'var(--mu3)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
                <button onClick={generate} style={{ flex: 1, padding: '9px', borderRadius: '7px', border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--cf)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>↺ Regenerate</button>
              </div>
            </div>
          )}
        </Panel>
        <div>
          <Panel cf mb>
            <PTitle cf>Quick-starts</PTitle>
            {quickPrompts.map(q => (
              <button key={q.label} onClick={() => setPrompt(q.prompt)}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                {q.label} ↗
              </button>
            ))}
          </Panel>
          <Panel cf mb>
            <PTitle cf>Prompt tips</PTitle>
            {[['Describe movement','Slow push-in, orbit, handheld, zoom out'],['Specify duration','End with "6 seconds" or "10 seconds"'],['Include lighting','Golden hour, dramatic shadows, neon'],['Set the mood','Cinematic, aspirational, dramatic, energetic'],['Use CineFlow first','Generate prompt in CineFlow then paste here']].map(([t,d]) => (
              <div key={t} style={{ marginBottom: '9px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cf)', marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{d}</div>
              </div>
            ))}
          </Panel>
          <Panel cf>
            <PTitle cf>Estimated costs</PTitle>
            {[['5 sec Standard','~$0.40'],['10 sec Standard','~$0.84'],['5 sec Pro','~$0.56'],['10 sec Pro','~$1.12']].map(([t,c]) => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg3)', borderRadius: 'var(--r)', marginBottom: '5px', fontSize: '12px' }}>
                <span style={{ color: 'var(--w2)' }}>{t}</span>
                <span style={{ color: 'var(--cf)', fontFamily: "'DM Mono',monospace" }}>{c}</span>
              </div>
            ))}
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.6' }}>Charges apply to your fal.ai account.</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
 
// ── SIDEBAR + PAGE ────────────────────────────────────────────
 
const TOOLS: { label: string; icon: string; tool: Tool; isNew?: boolean }[] = [
  { label: 'Mockup Generator', icon: '◈', tool: 'mockup' },
  { label: 'Product Listing', icon: '⊹', tool: 'listing' },
  { label: 'Description Writer', icon: '◷', tool: 'description' },
  { label: 'AI Image Prompts', icon: '◉', tool: 'image-prompt' },
  { label: 'Image Generator', icon: '✦', tool: 'imagegen', isNew: true },
  { label: 'Video Generator', icon: '⊳', tool: 'video', isNew: true },
  { label: 'Creator Try-On Studio', icon: '✦', tool: 'tryon' },
  { label: 'CineFlow AI™', icon: '⊳', tool: 'cineflow' },
  { label: 'AI Studios™', icon: '◉', tool: 'studios' },
  { label: 'Brand Deals', icon: '◎', tool: 'deals' },
  { label: 'Lip Sync Studio', icon: '◈', tool: 'lipsync' },
  { label: 'Collection Builder', icon: '⊹', tool: 'collection' },
  { label: 'Profit Calculator', icon: '◷', tool: 'profit' },
  { label: 'Saved Work', icon: '◌', tool: 'saved', isNew: true },
]
 
export default function Page() {
  const { user } = useUser()
  const [active, setActive] = useState<Tool>('mockup')
  const [hovered, setHovered] = useState<Tool | null>(null)
 
  // Listen for cross-tool navigation events
  useEffect(() => {
    const handler = (e: Event) => {
      const tool = (e as CustomEvent).detail as Tool
      setActive(tool)
    }
    window.addEventListener('switchTool', handler)
    return () => window.removeEventListener('switchTool', handler)
  })
 
  return (
    <>
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <aside style={{ width: '224px', background: 'var(--bg2)', borderRight: '0.5px solid var(--b)', padding: '14px 10px', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ padding: '10px 10px 14px', borderBottom: '0.5px solid var(--b)', marginBottom: '8px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800, color: 'var(--w)' }}>Envi Lee <span style={{ color: 'var(--pn)' }}>Creator Suite™</span></div>
            <div style={{ fontSize: '9px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>AI-Powered Tools</div>
          </div>
          {user && (
            <div style={{ padding: '8px 10px', marginBottom: '8px', background: 'var(--pn3)', borderRadius: 'var(--r)', border: '0.5px solid rgba(155,109,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)', marginBottom: '1px' }}>{user.firstName || 'Creator'}</div>
                <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>Creator Plan</div>
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          )}
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 10px 8px', fontFamily: "'DM Mono',monospace" }}>Tools</div>
          {TOOLS.map(({ label, icon, tool, isNew }) => (
            <button key={tool} onClick={() => setActive(tool)}
              onMouseEnter={() => setHovered(tool)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? (tool === 'cineflow' ? 'var(--cfb)' : 'rgba(155,109,255,0.4)') : 'transparent'}`, background: active === tool ? (tool === 'cineflow' ? 'var(--cf2)' : 'var(--pn3)') : hovered === tool ? 'var(--s1)' : 'none', color: active === tool ? (tool === 'cineflow' ? 'var(--cf)' : 'var(--pn)') : hovered === tool ? 'var(--w)' : 'var(--mu2)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
              <span style={{ fontFamily: "'DM Mono',monospace" }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {isNew && <span style={{ fontSize: '9px', padding: '1px 5px', background: active === tool ? 'rgba(0,0,0,0.2)' : 'var(--pn3)', color: active === tool ? '#fff' : 'var(--pn)', borderRadius: '4px', fontFamily: "'DM Mono',monospace" }}>New</span>}
            </button>
          ))}
        </aside>
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {active === 'mockup' && <MockupTool />}
          {active === 'listing' && <ListingTool />}
          {active === 'description' && <DescriptionTool />}
          {active === 'image-prompt' && <ImagePromptTool />}
          {active === 'tryon' && <TryOnTool />}
          {active === 'cineflow' && <CineFlowTool />}
          {active === 'studios' && <AIStudiosTool />}
          {active === 'deals' && <BrandDealsTool />}
          {active === 'lipsync' && <LipSyncTool />}
          {active === 'collection' && <CollectionTool />}
          {active === 'profit' && <ProfitTool />}
          {active === 'imagegen' && <ImageGenTool />}
          {active === 'video' && <VideoGenTool />}
          {active === 'saved' && <SavedWorkTool />}
        </main>
      </div>
      </SignedIn>
    </>
  )
}
