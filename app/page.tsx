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
  const [audience, setAudience] = useState('Women aged 22–40 who lov
