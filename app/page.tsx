'use client'
import { useState } from 'react'
 
type Tool = 'mockup' | 'listing' | 'description' | 'image-prompt' | 'tryon' | 'cineflow' | 'studios'
 
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
    --stu:rgba(255,255,255,0.85);--stu2:rgba(255,255,255,0.08);--stub:rgba(255,255,255,0.2);
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
  .lbar-fill-stu{height:100%;border-radius:1px;background:linear-gradient(90deg,rgba(255,255,255,0.5),rgba(255,255,255,0.9),rgba(255,255,255,0.5));background-size:200% 100%;animation:lbar 1.6s linear infinite}
  .ai-pulse{width:6px;height:6px;border-radius:50%;background:var(--pn);display:inline-block;animation:aip 1.8s ease infinite;margin-right:7px;box-shadow:0 0 6px rgba(155,109,255,0.5)}
  .ai-pulse-cf{width:6px;height:6px;border-radius:50%;background:var(--cf);display:inline-block;animation:aip 1.8s ease infinite;margin-right:7px}
  .ai-pulse-stu{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.8);display:inline-block;animation:aip 1.8s ease infinite;margin-right:7px}
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
 
function PTitle({ children, cf, stu }: { children: React.ReactNode; cf?: boolean; stu?: boolean }) {
  return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', fontWeight: 500, color: cf ? 'var(--cf)' : stu ? 'rgba(255,255,255,0.6)' : 'var(--pn)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>{children}</div>
}
 
function Panel({ children, hi, mb, cf, neon, stu }: { children: React.ReactNode; hi?: boolean; mb?: boolean; cf?: boolean; neon?: boolean; stu?: boolean }) {
  return <div style={{ background: 'var(--s1)', border: `0.5px solid ${neon ? 'rgba(155,109,255,0.3)' : cf ? 'rgba(0,200,83,0.2)' : stu ? 'rgba(255,255,255,0.1)' : hi ? 'var(--b2)' : 'var(--b)'}`, borderRadius: 'var(--r2)', padding: '18px', marginBottom: mb ? '14px' : 0 }}>{children}</div>
}
 
function GenBtn({ loading, onClick, children, cf, stu }: { loading: boolean; onClick: () => void; children: React.ReactNode; cf?: boolean; stu?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', border: 'none', background: loading ? 'rgba(155,109,255,0.3)' : cf ? 'var(--cf)' : stu ? 'rgba(255,255,255,0.9)' : 'linear-gradient(135deg,var(--c),var(--pn))', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: loading ? 'none' : cf ? '0 0 15px rgba(0,200,83,0.3)' : stu ? '0 0 15px rgba(255,255,255,0.15)' : '0 0 20px rgba(155,109,255,0.3)' }}>
      {loading ? 'Generating…' : children}
    </button>
  )
}
 
function Output({ text, loading, cf, stu }: { text: string; loading: boolean; cf?: boolean; stu?: boolean }) {
  if (!text && !loading) return null
  return (
    <div style={{ background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', padding: '14px', marginTop: '12px' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: cf ? 'var(--cf)' : stu ? 'rgba(255,255,255,0.6)' : 'var(--pn)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '9px', display: 'flex', alignItems: 'center' }}>
        {cf ? <span className="ai-pulse-cf" /> : stu ? <span className="ai-pulse-stu" /> : <span className="ai-pulse" />}AI Output
      </div>
      {loading && <div style={{ height: '2px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden', margin: '8px 0', borderRadius: '1px' }}>{cf ? <div className="lbar-fill-cf" /> : stu ? <div className="lbar-fill-stu" /> : <div className="lbar-fill" />}</div>}
      {text && <>
        <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.85', whiteSpace: 'pre-wrap' as const }}>{text}</div>
        <button onClick={() => navigator.clipboard.writeText(text)}
          style={{ marginTop: '10px', padding: '7px 14px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid var(--b2)', background: 'var(--s2)', color: cf ? 'var(--cf)' : stu ? 'rgba(255,255,255,0.7)' : 'var(--pn)', fontFamily: "'DM Sans',sans-serif" }}>
          Copy ↗
        </button>
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
              {['Etsy','Shopify','TikTok Shop','Amazon'].map(p => <option key={p}>{p}</option>)}
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
          <Panel neon mb>
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
  const [vpType, setVpType] = useState('UGC product showcase')
  const [vpSubject, setVpSubject] = useState('')
  const [vpCharacter, setVpCharacter] = useState('Black woman, confident, stylish, natural hair')
  const [vpSetting, setVpSetting] = useState('')
  const [vpPlatform, setVpPlatform] = useState('TikTok')
  const [calNiche, setCalNiche] = useState('POD fashion business')
  const [calPlatform, setCalPlatform] = useState('TikTok')
  const [calDays, setCalDays] = useState('7')
  const [calGoal, setCalGoal] = useState('Grow followers and drive sales')
  const [hkNiche, setHkNiche] = useState('POD business')
  const [hkStyle, setHkStyle] = useState('Income reveal')
  const [capTopic, setCapTopic] = useState('')
  const [capPlatform, setCapPlatform] = useState('TikTok')
  const [ugcProduct, setUgcProduct] = useState('')
  const [ugcPlatform, setUgcPlatform] = useState('TikTok')
  const [ugcBrand, setUgcBrand] = useState('Envi Lee')
  const [botMessages, setBotMessages] = useState([{ role: 'bot', text: "Hey! I'm your CineFlow AI assistant. Ask me anything about content, video ideas, or what to post today." }])
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
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {cfTabs.map(t => (
          <button key={t.id} onClick={() => { setActiveCF(t.id); setOutput('') }}
            style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeCF === t.id ? 'var(--cfb)' : 'var(--b)'}`, background: activeCF === t.id ? 'var(--cf2)' : 'var(--s1)', color: activeCF === t.id ? 'var(--cf)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>
 
      {activeCF === 'prompt' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel cf>
            <PTitle cf>Cinematic Prompt Builder</PTitle>
            <F label="Content type">
              <select style={sel} value={vpType} onChange={e => setVpType(e.target.value)}>
                {['UGC product showcase','POV lifestyle moment','AI Influencer cinematic','Black Film cinematic','Reality show scene','Music video sequence','Brand commercial','TikTok viral format','Emotional storytelling','Concert / performance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Subject / scene"><textarea style={ta} placeholder="What happens in the video?" value={vpSubject} onChange={e => setVpSubject(e.target.value)} /></F>
            <F label="Character / model"><input style={inp} value={vpCharacter} onChange={e => setVpCharacter(e.target.value)} /></F>
            <F label="Setting and lighting"><input style={inp} placeholder="e.g. NYC rooftop, golden hour" value={vpSetting} onChange={e => setVpSetting(e.target.value)} /></F>
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
            {[['Video concept','Specific idea for your niche'],['Hook','First 2 seconds that stop the scroll'],['Caption','Ready-to-post with CTA'],['Video prompt','Kling AI/Runway ready'],['Hashtags','5 relevant tags'],['Post time','Best time to post']].map(([l,d]) => (
              <div key={l} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cf)', marginBottom: '2px' }}>{l}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{d}</div>
              </div>
            ))}
          </Panel>
        </div>
      )}
 
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
            <PTitle cf>Hook types</PTitle>
            {[['Income reveal','"I made $X in X days with zero inventory"'],['Pattern interrupt','"Stop scrolling — this is not what you think"'],['POV opener','"POV: You just got your first $1k sale"'],['Curiosity gap','"The one tool Black creators are sleeping on"'],['Hot take','"Etsy is dead — here is where to sell instead"']].map(([t,e]) => (
              <div key={t} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cf)', marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', fontStyle: 'italic' }}>{e}</div>
              </div>
            ))}
          </Panel>
        </div>
      )}
 
      {activeCF === 'caption' && (
        <Panel cf>
          <PTitle cf>Caption Writer</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="What the video is about"><textarea style={ta} placeholder="e.g. How I made $10k with POD using AI tools..." value={capTopic} onChange={e => setCapTopic(e.target.value)} /></F>
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
 
      {activeCF === 'bot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel cf>
            <PTitle cf>AI Content Assistant</PTitle>
            <div className="chat-wrap">
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
            {['What should I post today on TikTok for my POD business?','Give me 5 viral TikTok hooks for a POD fashion brand','Write a 30-second TikTok script about building a POD business with AI','How do I make my AI-generated videos look more cinematic?','What content performs best for Black women entrepreneurs on TikTok?','How do I repurpose one video across TikTok, Instagram, and YouTube?'].map(q => (
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
 
// ── AI STUDIOS ────────────────────────────────────────────────
 
function StudiosTool() {
  const [activeStu, setActiveStu] = useState('script')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
 
  // Script
  const [scriptType, setScriptType] = useState('Reality TV episode')
  const [scriptTitle, setScriptTitle] = useState('')
  const [scriptCast, setScriptCast] = useState('')
  const [scriptStory, setScriptStory] = useState('')
  const [scriptTone, setScriptTone] = useState('Dramatic and tense')
 
  // Character
  const [charName, setCharName] = useState('')
  const [charAge, setCharAge] = useState('')
  const [charAppearance, setCharAppearance] = useState('')
  const [charStyle, setCharStyle] = useState('')
  const [charPersonality, setCharPersonality] = useState('')
  const [charBackstory, setCharBackstory] = useState('')
 
  // Scene
  const [sceneChars, setSceneChars] = useState('')
  const [sceneSetting, setSceneSetting] = useState('')
  const [sceneAction, setSceneAction] = useState('')
 
  // Podcast
  const [podType, setPodType] = useState('Podcast episode')
  const [podShow, setPodShow] = useState('')
  const [podTopic, setPodTopic] = useState('')
 
  // Lip Sync Single
  const [lsCharacter, setLsCharacter] = useState('Luxe Envi — Black woman, 28, luxury lifestyle creator, confident and powerful')
  const [lsPurpose, setLsPurpose] = useState('TikTok promotional video')
  const [lsTopic, setLsTopic] = useState('')
  const [lsLength, setLsLength] = useState('30 seconds')
  const [lsTone, setLsTone] = useState('Confident and empowering')
 
  // Multi Character
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
    { id: 'character', label: '◉ Characters' },
    { id: 'scene', label: '◈ Scene Builder' },
    { id: 'podcast', label: '◷ Podcast' },
    { id: 'lipsync', label: '✦ Lip Sync' },
    { id: 'multichar', label: '◎ Multi-Character' },
  ]
 
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>AI <span style={{ color: 'rgba(255,255,255,0.7)' }}>Studios™</span></div>
      <div style={{ fontSize: '12px', color: 'var(--mu2)', marginBottom: '16px', lineHeight: '1.6' }}>Scripts, characters, scenes, podcasts, lip sync, and multi-character dialogue — your Hollywood in a browser.</div>
 
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {stuTabs.map(t => (
          <button key={t.id} onClick={() => { setActiveStu(t.id); setOutput('') }}
            style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeStu === t.id ? 'rgba(255,255,255,0.3)' : 'var(--b)'}`, background: activeStu === t.id ? 'rgba(255,255,255,0.08)' : 'var(--s1)', color: activeStu === t.id ? 'rgba(255,255,255,0.9)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>
 
      {/* SCRIPT WRITER */}
      {activeStu === 'script' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel stu>
            <PTitle stu>Script Writer</PTitle>
            <F label="Script type">
              <select style={sel} value={scriptType} onChange={e => setScriptType(e.target.value)}>
                {['Reality TV episode','Movie script (short film)','Documentary','Music video concept','Talk show episode','Podcast episode'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Title / show name"><input style={inp} placeholder="e.g. Baddie House, The Luxe Life" value={scriptTitle} onChange={e => setScriptTitle(e.target.value)} /></F>
            <F label="Characters / cast"><input style={inp} placeholder="e.g. Luxe Envi, Marcus Reed, Nova Star" value={scriptCast} onChange={e => setScriptCast(e.target.value)} /></F>
            <F label="Story / arc"><textarea style={ta} placeholder="What happens? Who is involved? What is the drama or message?" value={scriptStory} onChange={e => setScriptStory(e.target.value)} /></F>
            <F label="Tone">
              <select style={sel} value={scriptTone} onChange={e => setScriptTone(e.target.value)}>
                {['Dramatic and tense','Glamorous and aspirational','Funny and chaotic','Emotional and moving','Mysterious and cinematic'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <GenBtn stu loading={loading} onClick={() => gen({ tool: 'script', type: scriptType, title: scriptTitle, cast: scriptCast, story: scriptStory, tone: scriptTone })}>Generate script ↗</GenBtn>
            <Output stu text={output} loading={loading} />
          </Panel>
          <div>
            <Panel stu mb>
              <PTitle stu>Quick-starts</PTitle>
              {[
                { label: 'Baddie House drama', type: 'Reality TV episode', title: 'Baddie House', cast: 'Luxe Envi, Marcus Reed, Jade', story: 'Luxe confronts Marcus about leaking her business plans — receipts come out, chaos ensues', tone: 'Dramatic and tense' },
                { label: 'Music video concept', type: 'Music video concept', title: 'Nova Star — Flawless', cast: 'Nova Star', story: 'A Black female AI pop star performs in a futuristic cityscape — cuts between concert stage and fashion moments', tone: 'Glamorous and aspirational' },
                { label: 'Creator documentary', type: 'Documentary', title: 'The Come Up', cast: 'Envi Lee', story: 'A documentary following a young Black woman building her POD empire and AI creator brand from zero', tone: 'Emotional and moving' },
              ].map(q => (
                <button key={q.label} onClick={() => { setScriptType(q.type); setScriptTitle(q.title); setScriptCast(q.cast); setScriptStory(q.story); setScriptTone(q.tone); gen({ tool: 'script', ...q }) }}
                  style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                  {q.label} ↗
                </button>
              ))}
            </Panel>
            <Panel stu>
              <PTitle stu>Video prompt export</PTitle>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.8', marginBottom: '10px' }}>After generating your script, copy any scene description and paste it into CineFlow to turn it into a cinematic video prompt for Kling AI or Runway.</div>
              <button onClick={() => {}} style={{ padding: '9px 14px', borderRadius: '7px', border: '0.5px solid rgba(0,200,83,0.3)', background: 'rgba(0,200,83,0.08)', color: 'var(--cf)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", width: '100%' }}>Open CineFlow → Video Prompts ↗</button>
            </Panel>
          </div>
        </div>
      )}
 
      {/* CHARACTER BUILDER */}
      {activeStu === 'character' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel stu>
            <PTitle stu>AI Character Builder</PTitle>
            <F label="Character name"><input style={inp} placeholder="e.g. Luxe Envi, Nova Star, Marcus Reed" value={charName} onChange={e => setCharName(e.target.value)} /></F>
            <F label="Age and vibe"><input style={inp} placeholder="e.g. 28, luxury lifestyle creator, powerful energy" value={charAge} onChange={e => setCharAge(e.target.value)} /></F>
            <F label="Appearance"><input style={inp} placeholder="e.g. Black woman, deep brown skin, natural locs, 5 foot 7" value={charAppearance} onChange={e => setCharAppearance(e.target.value)} /></F>
            <F label="Style and fashion"><input style={inp} placeholder="e.g. luxury streetwear, designer pieces, bold accessories" value={charStyle} onChange={e => setCharStyle(e.target.value)} /></F>
            <F label="Personality"><input style={inp} placeholder="e.g. bold, ambitious, charismatic, commanding, witty" value={charPersonality} onChange={e => setCharPersonality(e.target.value)} /></F>
            <F label="Backstory"><input style={inp} placeholder="e.g. Built a POD empire from nothing, now an AI influencer" value={charBackstory} onChange={e => setCharBackstory(e.target.value)} /></F>
            <GenBtn stu loading={loading} onClick={() => gen({ tool: 'character', name: charName, age: charAge, appearance: charAppearance, style: charStyle, personality: charPersonality, backstory: charBackstory })}>Build character profile ↗</GenBtn>
            <Output stu text={output} loading={loading} />
          </Panel>
          <Panel stu>
            <PTitle stu>Preset characters</PTitle>
            {[
              { label: 'Luxe Envi', name: 'Luxe Envi', age: '28, luxury lifestyle creator, powerful commanding energy', appearance: 'Black woman, deep brown skin, natural coils, 5 foot 7, elegant bone structure', style: 'Luxury streetwear, designer pieces, gold jewelry, bold accessories', personality: 'Bold, ambitious, charismatic, commanding, witty, unapologetically confident', backstory: 'Built a POD empire from nothing, now a luxury AI influencer and course creator' },
              { label: 'Nova Star', name: 'Nova Star', age: '23, AI pop artist, magnetic and glamorous', appearance: 'Black woman, rich dark skin, short natural hair, tall and statuesque', style: 'Sequined performance outfits, avant-garde fashion, statement pieces', personality: 'Magnetic, emotional, captivating, vulnerable but powerful on stage', backstory: 'An AI-generated pop star who became real through her music and connection with fans' },
              { label: 'Marcus Reed', name: 'Marcus Reed', age: '32, drama lead, deep voice, commanding presence', appearance: 'Black man, 6 foot 2, deep brown skin, sharp features, close cut fade', style: 'Designer suits for business scenes, luxury streetwear for casual', personality: 'Calculated, charming, complex — can be villain or hero depending on the scene', backstory: 'Self-made entrepreneur with secrets that make every scene electric' },
              { label: 'Baddie Nova', name: 'Baddie Nova', age: '24, streetwear POD brand owner, bold and real', appearance: 'Black woman, 24, natural hair in puff, melanin-rich skin, streetwear aesthetic', style: 'Streetwear, sneakers, hoodies, bold graphic tees from her own POD brand', personality: 'Real, funny, hustler energy, authentic and relatable to creators', backstory: 'Started her POD brand with $50 and built it to six figures using AI tools' },
            ].map(q => (
              <button key={q.label} onClick={() => { setCharName(q.name); setCharAge(q.age); setCharAppearance(q.appearance); setCharStyle(q.style); setCharPersonality(q.personality); setCharBackstory(q.backstory); gen({ tool: 'character', ...q }) }}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 11px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                {q.label} ↗
              </button>
            ))}
          </Panel>
        </div>
      )}
 
      {/* SCENE BUILDER */}
      {activeStu === 'scene' && (
        <Panel stu>
          <PTitle stu>Scene Builder</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Characters in the scene"><input style={inp} placeholder="e.g. Luxe Envi and Marcus Reed" value={sceneChars} onChange={e => setSceneChars(e.target.value)} /></F>
              <F label="Setting and mood"><input style={inp} placeholder="e.g. NYC rooftop, golden hour, dramatic and tense" value={sceneSetting} onChange={e => setSceneSetting(e.target.value)} /></F>
              <F label="What happens"><textarea style={ta} placeholder="Describe the scene — what do they say and do? What is the conflict or connection?" value={sceneAction} onChange={e => setSceneAction(e.target.value)} /></F>
              <GenBtn stu loading={loading} onClick={() => gen({ tool: 'scene', characters: sceneChars, setting: sceneSetting, action: sceneAction })}>Build scene + video prompt ↗</GenBtn>
            </div>
            <Output stu text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* PODCAST */}
      {activeStu === 'podcast' && (
        <Panel stu>
          <PTitle stu>Podcast / Talk Show Script</PTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <F label="Show type">
                <select style={sel} value={podType} onChange={e => setPodType(e.target.value)}>
                  {['Podcast episode','Talk show episode'].map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
              <F label="Show name and host"><input style={inp} placeholder="e.g. The Creator Files, hosted by Luxe Envi" value={podShow} onChange={e => setPodShow(e.target.value)} /></F>
              <F label="Episode topic"><input style={inp} placeholder="e.g. How I made $10k with POD and AI in 90 days" value={podTopic} onChange={e => setPodTopic(e.target.value)} /></F>
              <GenBtn stu loading={loading} onClick={() => gen({ tool: 'podcast', type: podType, show: podShow, topic: podTopic })}>Generate episode script ↗</GenBtn>
            </div>
            <Output stu text={output} loading={loading} />
          </div>
        </Panel>
      )}
 
      {/* LIP SYNC */}
      {activeStu === 'lipsync' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel stu>
            <PTitle stu>Single Character Lip Sync</PTitle>
            <F label="Character">
              <select style={sel} value={lsCharacter} onChange={e => setLsCharacter(e.target.value)}>
                {['Luxe Envi — Black woman, 28, luxury lifestyle creator, confident and powerful','Baddie Nova — streetwear POD brand owner, 24, bold and real','Nova Star — AI pop artist, 23, glamorous performer','Marcus Reed — drama lead, 32, deep voice, commanding','Custom character — describe in topic field'].map(c => <option key={c}>{c}</option>)}
              </select>
            </F>
            <F label="Video purpose">
              <select style={sel} value={lsPurpose} onChange={e => setLsPurpose(e.target.value)}>
                {['TikTok promotional video','Instagram Reel','Product launch announcement','Brand deal sponsored content','Course or academy intro','Reality show monologue','Music video lip sync','AI influencer talking head'].map(p => <option key={p}>{p}</option>)}
              </select>
            </F>
            <F label="Topic / message"><textarea style={ta} placeholder="What does the character say? What is the video about?" value={lsTopic} onChange={e => setLsTopic(e.target.value)} /></F>
            <F label="Video length">
              <select style={sel} value={lsLength} onChange={e => setLsLength(e.target.value)}>
                {['15 seconds','30 seconds','60 seconds','90 seconds','2 to 3 minutes'].map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <F label="Tone">
              <select style={sel} value={lsTone} onChange={e => setLsTone(e.target.value)}>
                {['Confident and empowering','Luxury and aspirational','Fun and energetic','Emotional and personal','Professional and authoritative','Hype and excited'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <GenBtn stu loading={loading} onClick={() => gen({ tool: 'lipsync', character: lsCharacter, purpose: lsPurpose, topic: lsTopic, length: lsLength, tone: lsTone })}>Generate lip sync package ↗</GenBtn>
            <Output stu text={output} loading={loading} />
          </Panel>
          <Panel stu>
            <PTitle stu>Lip sync tools</PTitle>
            {[['HeyGen','heygen.com','Best quality AI lip sync'],['D-ID','d-id.com','Talking avatar creator'],['Runway','runwayml.com','Cinematic video + lip sync'],['ElevenLabs','elevenlabs.io','AI voice cloning for characters']].map(([n,u,d]) => (
              <a key={n} href={`https://${u}`} target="_blank" rel="noreferrer"
                style={{ padding: '10px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: 'var(--r)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div><div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--w)' }}>{n}</div><div style={{ fontSize: '10px', color: 'var(--mu3)', marginTop: '2px' }}>{d}</div></div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace" }}>Free ↗</span>
              </a>
            ))}
            <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '0.5px solid var(--b)', fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.9', fontFamily: "'DM Mono',monospace" }}>
              Step 1 — Generate script here<br/>
              Step 2 — Go to HeyGen or D-ID<br/>
              Step 3 — Upload character image<br/>
              Step 4 — Paste script as text<br/>
              Step 5 — Pick a voice → Generate
            </div>
          </Panel>
        </div>
      )}
 
      {/* MULTI CHARACTER */}
      {activeStu === 'multichar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Panel stu>
            <PTitle stu>Multi-Character Dialogue</PTitle>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '12px', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>Character 1</div>
              <F label="Name"><input style={inp} value={mc1Name} onChange={e => setMc1Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={mc1Desc} onChange={e => setMc1Desc(e.target.value)} /></F>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '12px', border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>Character 2</div>
              <F label="Name"><input style={inp} value={mc2Name} onChange={e => setMc2Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} value={mc2Desc} onChange={e => setMc2Desc(e.target.value)} /></F>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px', marginBottom: '12px', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>Character 3 (optional)</div>
              <F label="Name"><input style={inp} placeholder="Leave blank if only 2 characters" value={mc3Name} onChange={e => setMc3Name(e.target.value)} /></F>
              <F label="Description"><input style={inp} placeholder="e.g. Nova Star, AI pop artist, 23" value={mc3Desc} onChange={e => setMc3Desc(e.target.value)} /></F>
            </div>
            <F label="Scene type">
              <select style={sel} value={mcScene} onChange={e => setMcScene(e.target.value)}>
                {['Reality TV confrontation / drama','Friendship conversation','Business negotiation','Romantic tension','Comedy dialogue','Interview / podcast','Mentor and student','Music video dialogue','Motivational conversation','Argument / conflict'].map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Setting"><input style={inp} placeholder="e.g. rooftop NYC, luxury penthouse, boardroom" value={mcSetting} onChange={e => setMcSetting(e.target.value)} /></F>
            <F label="What happens"><textarea style={ta} placeholder="Describe the situation and what you want to happen..." value={mcStory} onChange={e => setMcStory(e.target.value)} /></F>
            <F label="Dialogue length">
              <select style={sel} value={mcLength} onChange={e => setMcLength(e.target.value)}>
                {['Short — 6 to 8 exchanges (30 sec)','Medium — 10 to 14 exchanges (60 sec)','Long — 16 to 20 exchanges (90 sec)'].map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <GenBtn stu loading={loading} onClick={() => gen({ tool: 'multichar', char1name: mc1Name, char1desc: mc1Desc, char2name: mc2Name, char2desc: mc2Desc, char3name: mc3Name, char3desc: mc3Desc, sceneType: mcScene, setting: mcSetting, story: mcStory, length: mcLength })}>Generate multi-character dialogue ↗</GenBtn>
            <Output stu text={output} loading={loading} />
          </Panel>
          <Panel stu>
            <PTitle stu>Quick-starts</PTitle>
            {[
              { label: 'Baddie House rooftop drama', char1name: 'Luxe Envi', char1desc: 'Black woman, 28, luxury lifestyle creator, confident and powerful', char2name: 'Marcus Reed', char2desc: 'Black man, 32, drama lead, deep voice, commanding', char3name: '', char3desc: '', sceneType: 'Reality TV confrontation / drama', setting: 'luxury rooftop penthouse, NYC night skyline', story: 'Luxe confronts Marcus about leaking her business plans to a competitor', length: 'Medium — 10 to 14 exchanges (60 sec)' },
              { label: 'Mentor and student', char1name: 'Luxe Envi', char1desc: 'Black woman, 28, powerful mentor energy', char2name: 'Jade', char2desc: 'Black woman, 22, aspiring creator, eager to learn', char3name: '', char3desc: '', sceneType: 'Mentor and student', setting: 'modern coworking space, floor to ceiling windows', story: 'Luxe mentors Jade on building her AI influencer brand and stopping playing small', length: 'Medium — 10 to 14 exchanges (60 sec)' },
              { label: '3-character podcast roundtable', char1name: 'Luxe Envi', char1desc: 'Black woman, 28, luxury creator', char2name: 'Baddie Nova', char2desc: 'Black woman, 24, POD brand owner', char3name: 'Nova Star', char3desc: 'AI pop artist, 23, glamorous', sceneType: 'Interview / podcast', setting: 'podcast studio, moody lighting', story: 'Three creators doing a roundtable on how they built their AI empires', length: 'Long — 16 to 20 exchanges (90 sec)' },
            ].map(q => (
              <button key={q.label} onClick={() => { setMc1Name(q.char1name); setMc1Desc(q.char1desc); setMc2Name(q.char2name); setMc2Desc(q.char2desc); setMc3Name(q.char3name); setMc3Desc(q.char3desc); setMcScene(q.sceneType); setMcSetting(q.setting); setMcStory(q.story); setMcLength(q.length); gen({ tool: 'multichar', ...q }) }}
                style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", lineHeight: '1.4' }}>
                {q.label} ↗
              </button>
            ))}
            <Panel stu>
              <PTitle stu>Multi-character tools</PTitle>
              {[['InfiniteTalk Multi','infinitetalk.net'],['Dzine AI','dzine.ai'],['Vozo AI','vozo.ai']].map(([n,u]) => (
                <a key={n} href={`https://${u}`} target="_blank" rel="noreferrer"
                  style={{ padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: 'var(--r)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--w)' }}>{n}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>Free ↗</span>
                </a>
              ))}
            </Panel>
          </Panel>
        </div>
      )}
    </div>
  )
}
 
// ── SIDEBAR + PAGE ────────────────────────────────────────────
 
const TOOLS: { label: string; icon: string; tool: Tool; isNew?: boolean }[] = [
  { label: 'Mockup Generator', icon: '◈', tool: 'mockup' },
  { label: 'Product Listing', icon: '⊹', tool: 'listing' },
  { label: 'Description Writer', icon: '◷', tool: 'description' },
  { label: 'AI Image Prompts', icon: '◉', tool: 'image-prompt' },
  { label: 'Creator Try-On Studio', icon: '✦', tool: 'tryon', isNew: true },
  { label: 'CineFlow AI™', icon: '⊳', tool: 'cineflow', isNew: true },
  { label: 'AI Studios™', icon: '◎', tool: 'studios', isNew: true },
]
 
export default function Page() {
  const [active, setActive] = useState<Tool>('mockup')
  const [hovered, setHovered] = useState<Tool | null>(null)
 
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <aside style={{ width: '224px', background: 'var(--bg2)', borderRight: '0.5px solid var(--b)', padding: '14px 10px', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ padding: '10px 10px 14px', borderBottom: '0.5px solid var(--b)', marginBottom: '8px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800, color: 'var(--w)' }}>Envi Lee <span style={{ color: 'var(--pn)' }}>Creator Suite™</span></div>
            <div style={{ fontSize: '9px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>AI-Powered Tools</div>
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 10px 8px', fontFamily: "'DM Mono',monospace" }}>Tools</div>
          {TOOLS.map(({ label, icon, tool, isNew }) => (
            <button key={tool} onClick={() => setActive(tool)}
              onMouseEnter={() => setHovered(tool)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? (tool === 'cineflow' ? 'var(--cfb)' : tool === 'studios' ? 'rgba(255,255,255,0.2)' : 'rgba(155,109,255,0.4)') : 'transparent'}`, background: active === tool ? (tool === 'cineflow' ? 'var(--cf2)' : tool === 'studios' ? 'rgba(255,255,255,0.06)' : 'var(--pn3)') : hovered === tool ? 'var(--s1)' : 'none', color: active === tool ? (tool === 'cineflow' ? 'var(--cf)' : tool === 'studios' ? 'rgba(255,255,255,0.9)' : 'var(--pn)') : hovered === tool ? 'var(--w)' : 'var(--mu2)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
              <span style={{ fontFamily: "'DM Mono',monospace" }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {isNew && <span style={{ fontSize: '9px', padding: '1px 5px', background: active === tool ? 'rgba(0,0,0,0.2)' : 'var(--pn3)', color: active === tool ? '#fff' : 'var(--pn)', borderRadius: '4px', fontFamily: "'DM Mono',monospace" }}>New</span>}
            </button>
          ))}
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '14px 10px 8px', fontFamily: "'DM Mono',monospace" }}>Coming Soon</div>
          {['Brand Deals','Lip Sync Studio'].map(l => (
            <button key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', fontSize: '12px', border: '0.5px solid transparent', background: 'none', color: 'var(--mu)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", opacity: 0.4, cursor: 'default' }}>◌ {l}</button>
          ))}
        </aside>
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {active === 'mockup' && <MockupTool />}
          {active === 'listing' && <ListingTool />}
          {active === 'description' && <DescriptionTool />}
          {active === 'image-prompt' && <ImagePromptTool />}
          {active === 'tryon' && <TryOnTool />}
          {active === 'cineflow' && <CineFlowTool />}
          {active === 'studios' && <StudiosTool />}
        </main>
      </div>
    </>
  )
}
