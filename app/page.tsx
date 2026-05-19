'use client'
import { useState } from 'react'

type Tool = 'mockup' | 'listing' | 'description' | 'image-prompt'

async function callAPI(endpoint: Tool, body: Record<string, string>): Promise<string> {
  const res = await fetch(`/api/generate/${endpoint}`, {
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
    --bg:#000;--bg2:#080808;--bg3:#0f0f12;--bg4:#141418;
    --s1:#18181e;--s2:#202028;--s3:#282832;
    --w:#f4f4ff;--w2:#ccccee;--w3:#9898cc;
    --mu:#44445a;--mu2:#66667a;--mu3:#88889a;
    --b:rgba(255,255,255,0.07);--b2:rgba(255,255,255,0.12);
    --c:#00f5ff;--c2:rgba(0,245,255,0.12);--bc:rgba(0,245,255,0.25);
    --r:8px;--r2:12px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:var(--bg);color:var(--w);font-family:'DM Sans',sans-serif;min-height:100vh}
  select,input,textarea{color-scheme:dark}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:var(--bg)}
  ::-webkit-scrollbar-thumb{background:var(--s3);border-radius:2px}
  body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.012) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;z-index:0}
  @keyframes lbar{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes aip{0%,100%{opacity:1}50%{opacity:.2}}
  @keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .pg-in{animation:pgIn .3s ease}
  .lbar-fill{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--c),#0ff4c6,var(--c));background-size:200% 100%;animation:lbar 1.6s linear infinite}
  .ai-pulse{width:6px;height:6px;border-radius:50%;background:var(--c);display:inline-block;animation:aip 1.8s ease infinite;margin-right:7px}
`

const inp: React.CSSProperties = { background: 'var(--bg3)', border: '0.5px solid var(--b)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }
const ta: React.CSSProperties = { ...inp, resize: 'vertical' as const, minHeight: '80px', lineHeight: '1.6' }
const sel: React.CSSProperties = { ...inp, padding: '8px 10px' }

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu3)', textTransform: 'uppercase' as const, letterSpacing: '.7px', fontFamily: "'DM Mono',monospace" }}>{label}</label>
      {children}
    </div>
  )
}

function PTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', fontWeight: 500, color: 'var(--c)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--b)' }}>{children}</div>
}

function Panel({ children, hi, mb }: { children: React.ReactNode; hi?: boolean; mb?: boolean }) {
  return <div style={{ background: 'var(--s1)', border: `0.5px solid ${hi ? 'var(--b2)' : 'var(--b)'}`, borderRadius: 'var(--r2)', padding: '18px', marginBottom: mb ? '14px' : 0 }}>{children}</div>
}

function GenBtn({ loading, onClick, children }: { loading: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: '10px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: loading ? 'default' : 'pointer', border: '0.5px solid var(--c)', background: loading ? 'var(--c2)' : 'var(--c)', color: '#000', fontFamily: "'DM Sans',sans-serif", width: '100%', opacity: loading ? 0.7 : 1, transition: 'all .2s' }}>
      {loading ? 'Generating…' : children}
    </button>
  )
}

function Output({ text, loading }: { text: string; loading: boolean }) {
  if (!text && !loading) return null
  return (
    <div style={{ background: 'var(--bg4)', border: '0.5px solid var(--b2)', borderRadius: 'var(--r2)', padding: '14px', marginTop: '12px' }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: 'var(--c)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '9px', display: 'flex', alignItems: 'center' }}>
        <span className="ai-pulse" />AI Output
      </div>
      {loading && <div style={{ height: '2px', background: 'rgba(0,245,255,0.08)', overflow: 'hidden', margin: '8px 0', borderRadius: '1px' }}><div className="lbar-fill" /></div>}
      {text && <>
        <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.85', whiteSpace: 'pre-wrap' as const }}>{text}</div>
        <button onClick={() => navigator.clipboard.writeText(text)}
          style={{ marginTop: '10px', padding: '7px 14px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--w2)', fontFamily: "'DM Sans',sans-serif" }}>
          Copy ↗
        </button>
      </>}
    </div>
  )
}

function MockupTool() {
  const [product, setProduct] = useState('T-Shirt')
  const [design, setDesign] = useState('')
  const [setting, setSetting] = useState('Black woman — natural hair, confident, luxury lifestyle setting')
  const [style, setStyle] = useState('Editorial fashion photography')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(body?: Record<string, string>) {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('mockup', body ?? { product, design, setting, style })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Mockup <span style={{ color: 'var(--c)' }}>Generator</span></div>
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
    try { setOutput(await callAPI('listing', { productName, details, platform, targetAudience: audience })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Product <span style={{ color: 'var(--c)' }}>Listing Writer</span></div>
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
    try { setOutput(await callAPI('description', { product, niche, tone, audience })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Description <span style={{ color: 'var(--c)' }}>Writer</span></div>
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
    try { setOutput(await callAPI('image-prompt', { subject, style, mood, platform, extras })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>AI Image <span style={{ color: 'var(--c)' }}>Prompt Builder</span></div>
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
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--c)', marginBottom: '2px', fontFamily: "'DM Mono',monospace" }}>{n}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{t}</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

const TOOLS: { label: string; icon: string; tool: Tool }[] = [
  { label: 'Mockup Generator', icon: '◈', tool: 'mockup' },
  { label: 'Product Listing', icon: '⊹', tool: 'listing' },
  { label: 'Description Writer', icon: '◷', tool: 'description' },
  { label: 'AI Image Prompts', icon: '◉', tool: 'image-prompt' },
]

export default function Page() {
  const [active, setActive] = useState<Tool>('mockup')
  const [hovered, setHovered] = useState<Tool | null>(null)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <aside style={{ width: '220px', background: 'var(--bg2)', borderRight: '0.5px solid var(--b)', padding: '14px 10px', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ padding: '10px 10px 14px', borderBottom: '0.5px solid var(--b)', marginBottom: '8px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800, color: 'var(--w)' }}>POD Pro <span style={{ color: 'var(--c)' }}>Studio™</span></div>
            <div style={{ fontSize: '9px', color: 'var(--mu)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Envi Lee AI Creator Suite</div>
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 10px 8px', fontFamily: "'DM Mono',monospace" }}>Tools</div>
          {TOOLS.map(({ label, icon, tool }) => (
            <button key={tool} onClick={() => setActive(tool)}
              onMouseEnter={() => setHovered(tool)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'var(--bc)' : 'transparent'}`, background: active === tool ? 'var(--c2)' : hovered === tool ? 'var(--s1)' : 'none', color: active === tool ? 'var(--c)' : hovered === tool ? 'var(--w)' : 'var(--mu2)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
              <span style={{ fontFamily: "'DM Mono',monospace" }}>{icon}</span>{label}
            </button>
          ))}
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '14px 10px 8px', fontFamily: "'DM Mono',monospace" }}>Coming Soon</div>
          {['Collection Builder','Profit Calculator','Brand Deals'].map(l => (
            <button key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', fontSize: '12px', border: '0.5px solid transparent', background: 'none', color: 'var(--mu)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", opacity: 0.4, cursor: 'default' }}>◌ {l}</button>
          ))}
        </aside>
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {active === 'mockup' && <MockupTool />}
          {active === 'listing' && <ListingTool />}
          {active === 'description' && <DescriptionTool />}
          {active === 'image-prompt' && <ImagePromptTool />}
        </main>
      </div>
    </>
  )
}
