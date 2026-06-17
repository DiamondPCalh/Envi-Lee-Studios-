'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type LegalTool = 'dashboard' | 'vault' | 'forms' | 'idcard' | 'birth' | 'prenup' | 'platform' | 'assets' | 'disclaimers' | 'templates' | 'saved'

// ── STYLES ────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #000;
    --bg2: #080400;
    --bg3: #100800;
    --s1: #140900;
    --s2: #1e1000;
    --w: #fff8f0;
    --w2: #f0d8b0;
    --mu: #2a1800;
    --mu2: #4a2800;
    --mu3: #8a5030;
    --r: 8px; --r2: 12px; --r3: 16px;
    --orange: #ff6a00;
    --orange2: #ff9a3c;
    --orange3: rgba(255,106,0,0.08);
    --ob: rgba(255,106,0,0.3);
    --og: rgba(255,106,0,0.12);
    --o-grad: linear-gradient(135deg, #ff6a00, #ff9a3c, #ffb347);
    --o-grad2: linear-gradient(135deg, #ff6a00, #ee0979);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1a0900; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes stamp { 0% { transform: scale(2) rotate(-15deg); opacity: 0; } 100% { transform: scale(1) rotate(-15deg); opacity: 1; } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--o-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .o-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--orange); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(255,106,0,0.12); border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: rgba(255,106,0,0.25); }
  .card.accent { border-color: var(--ob); background: var(--orange3); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--orange); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(255,106,0,0.12); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(255,106,0,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: var(--ob); }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(255,106,0,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(255,106,0,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .o-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--o-grad); color: #fff; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(255,106,0,0.25); }
  .o-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(255,106,0,0.4); }
  .o-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-btn { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--ob); background: transparent; color: var(--orange); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-btn:hover { background: var(--orange3); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .form-field { margin-bottom: 16px; }
  .form-input { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,106,0,0.2); border-radius: 6px; padding: 10px 14px; font-size: 13px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .form-input:focus { border-color: var(--ob); background: rgba(255,106,0,0.04); }
  .form-textarea { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,106,0,0.2); border-radius: 6px; padding: 10px 14px; font-size: 13px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .doc-preview { background: #fff; color: #1a1a1a; border-radius: 8px; padding: 40px; font-family: 'Georgia', serif; position: relative; overflow: hidden; }
  .doc-preview h1 { font-size: 22px; text-align: center; margin-bottom: 6px; color: #000; }
  .doc-preview h2 { font-size: 14px; text-align: center; color: #555; margin-bottom: 24px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; }
  .doc-preview .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .doc-preview .field-box { border-bottom: 1px solid #ccc; padding: 6px 0; }
  .doc-preview .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
  .doc-preview .field-value { font-size: 13px; color: #1a1a1a; min-height: 20px; }
  .doc-preview .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ff6a00; margin: 20px 0 10px; border-bottom: 1px solid #ff6a00; padding-bottom: 4px; }
  .doc-stamp { position: absolute; bottom: 30px; right: 30px; width: 90px; height: 90px; border: 3px solid rgba(255,106,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); opacity: 0.6; }
  .doc-stamp-text { font-size: 9px; font-weight: 700; color: rgba(255,106,0,0.8); text-align: center; text-transform: uppercase; letter-spacing: 1px; line-height: 1.4; }

  .nav-tab { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; border: 0.5px solid transparent; }
  .nav-tab.active { background: var(--orange3); border-color: var(--ob); color: var(--orange); }
  .nav-tab.inactive { color: var(--mu3); }
  .nav-tab.inactive:hover { color: var(--w); background: rgba(255,106,0,0.03); }
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

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ setTool }: { setTool: (t: LegalTool) => void }) {
  const { user } = useUser()

  const tools = [
    { id: 'vault', icon: '🔒', label: 'Private Data Vault', desc: 'Store all AI twin and team information securely', color: 'var(--orange)' },
    { id: 'idcard', icon: '🪪', label: 'AI Twin ID Card', desc: 'Generate official ID cards for your AI twins', color: '#ff9a3c' },
    { id: 'birth', icon: '📜', label: 'Birth Certificate', desc: 'Official creation certificate for your AI twin', color: '#ffb347' },
    { id: 'prenup', icon: '⚖️', label: 'AI Twin Prenup', desc: 'Ownership agreement for teams and influencers', color: 'var(--orange)' },
    { id: 'platform', icon: '🛡️', label: 'Platform Protection', desc: 'Legal disclaimers and platform risk protection', color: '#ff9a3c' },
    { id: 'assets', icon: '💎', label: 'Asset Ownership', desc: 'Licensing and ownership documentation', color: '#ffb347' },
    { id: 'disclaimers', icon: '📋', label: 'Legal Disclaimers', desc: 'Platform usage and content disclaimers', color: 'var(--orange)' },
    { id: 'templates', icon: '📄', label: 'Form Templates', desc: 'All legal templates — fill, download as PDF', color: '#ff9a3c' },
    { id: 'saved', icon: '💾', label: 'Saved Documents', desc: 'All your completed and saved legal docs', color: '#ffb347' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Baddie Legal Vault™</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Welcome, <span style={{ background: 'var(--o-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'Baddie'}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Your AI identity is your empire. Protect it like one.</div>
      </div>

      {/* Alert banner */}
      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '12px', padding: '16px 20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>⚠️</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)', marginBottom: '3px' }}>Protect Your AI Identity Now</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>Your AI twin, influencer, and team are valuable digital assets. Start with your Birth Certificate and ID Card to establish ownership today.</div>
        </div>
        <button className="o-btn" onClick={() => setTool('birth')} style={{ fontSize: '11px', padding: '8px 16px', flexShrink: 0, marginLeft: 'auto' }}>Start Now ↗</button>
      </div>

      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Protection Tools</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {tools.map(t => (
          <div key={t.id} className="card" style={{ cursor: 'pointer', transition: 'all .2s', borderColor: `${t.color === 'var(--orange)' ? 'rgba(255,106,0,0.15)' : 'rgba(255,154,60,0.15)'}` }}
            onClick={() => setTool(t.id as LegalTool)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,106,0,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,106,0,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,106,0,0.12)'; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{t.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '10px' }}>{t.desc}</div>
            <div style={{ fontSize: '10px', color: t.color, fontFamily: "'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PRIVATE DATA VAULT ────────────────────────────────────────
function PrivateDataVault() {
  const { user } = useUser()
  const [twins, setTwins] = useState<Array<Record<string, string>>>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'AI Twin', created: '', platform: '', niche: '', appearance: '', personality: '', voiceId: '', loraId: '', notes: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(`vault_${user?.id}`) || '[]')
    setTwins(data)
  }, [user?.id])

  function save() {
    if (!form.name.trim()) return
    const updated = [...twins, { ...form, id: String(Date.now()), savedAt: new Date().toISOString() }]
    setTwins(updated)
    localStorage.setItem(`vault_${user?.id}`, JSON.stringify(updated))
    setForm({ name: '', type: 'AI Twin', created: '', platform: '', niche: '', appearance: '', personality: '', voiceId: '', loraId: '', notes: '' })
    setAdding(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function del(id: string) {
    const updated = twins.filter(t => t.id !== id)
    setTwins(updated)
    localStorage.setItem(`vault_${user?.id}`, JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Private Data <span style={{ color: 'var(--orange)' }}>Vault</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px', lineHeight: '1.6' }}>
        Store all your AI twin, influencer, and team information securely. This is your private classified record — only you can see it.
      </div>
      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace" }}>
        🔒 Classified · Private to your account · Not shared with anyone
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>{twins.length} AI identities registered</div>
        <button className="o-btn" onClick={() => setAdding(true)} style={{ fontSize: '12px', padding: '9px 16px' }}>+ Register New Identity</button>
      </div>

      {adding && (
        <div className="card hi" style={{ marginBottom: '20px' }}>
          <div className="ftitle">Register AI Identity</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Name"><input className="finp" placeholder="e.g. Luxe Envi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></F>
            <F label="Type">
              <select className="fsel" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['AI Twin', 'AI Influencer', 'AI Team Member', 'AI Character', 'AI Artist', 'AI Model'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Date created"><input className="finp" type="date" value={form.created} onChange={e => setForm(f => ({ ...f, created: e.target.value }))} /></F>
            <F label="Primary platform"><input className="finp" placeholder="e.g. TikTok, Instagram" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} /></F>
            <F label="Niche"><input className="finp" placeholder="e.g. Luxury lifestyle, Fashion" value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} /></F>
            <F label="LoRA model ID (if trained)"><input className="finp" placeholder="fal.ai LoRA ID" value={form.loraId} onChange={e => setForm(f => ({ ...f, loraId: e.target.value }))} /></F>
            <F label="ElevenLabs voice ID"><input className="finp" placeholder="ElevenLabs voice ID" value={form.voiceId} onChange={e => setForm(f => ({ ...f, voiceId: e.target.value }))} /></F>
          </div>
          <F label="Appearance description"><textarea className="fta" placeholder="Physical appearance, style, distinguishing features..." value={form.appearance} onChange={e => setForm(f => ({ ...f, appearance: e.target.value }))} /></F>
          <F label="Personality notes"><textarea className="fta" placeholder="Personality traits, tone, energy..." value={form.personality} onChange={e => setForm(f => ({ ...f, personality: e.target.value }))} /></F>
          <F label="Private notes"><textarea className="fta" placeholder="Any private notes about this AI identity..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></F>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="o-btn" onClick={save} style={{ flex: 1, fontSize: '12px' }}>Save to Vault ↗</button>
            <button className="ghost-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {twins.length === 0 && !adding ? (
        <div className="card accent" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔒</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--orange)', marginBottom: '8px' }}>Vault is empty</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '20px' }}>Register your AI twins, influencers, and team members to protect your digital assets.</div>
          <button className="o-btn" onClick={() => setAdding(true)}>Register Your First AI Identity ↗</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {twins.map(twin => (
            <div key={twin.id} className="card hi">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--orange)' }}>{twin.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{twin.type} · {twin.platform}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '9px', padding: '3px 8px', background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '20px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace" }}>🔒 Classified</span>
                  <button className="del-btn" onClick={() => del(twin.id)} style={{ fontSize: '10px', padding: '3px 8px' }}>✕</button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', marginBottom: '8px' }}>{twin.niche}</div>
              {twin.created && <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>Created: {twin.created}</div>}
              {twin.loraId && <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", marginTop: '4px' }}>LoRA: {twin.loraId}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FILLABLE FORM COMPONENT ───────────────────────────────────
function FillableForm({ title, subtitle, fields, docType, stampText }: {
  title: string
  subtitle: string
  fields: Array<{ label: string; key: string; type?: string; full?: boolean; options?: string[] }>
  docType: string
  stampText: string
}) {
  const { user } = useUser()
  const [values, setValues] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  function setValue(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
  }

  async function downloadPDF() {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType, title, subtitle, fields, values, stampText, userId: user?.id }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${title.replace(/\s+/g, '_')}.pdf`
        a.click(); URL.revokeObjectURL(url)
      }
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  function saveDoc() {
    const docs = JSON.parse(localStorage.getItem('legalDocs') || '[]')
    docs.unshift({ id: Date.now(), docType, title, values, savedAt: new Date().toISOString() })
    localStorage.setItem('legalDocs', JSON.stringify(docs.slice(0, 50)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* LEFT — form */}
      <div>
        <div className="card hi">
          <div className="ftitle">Fill in the details</div>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: '12px', gridColumn: f.full ? 'span 2' : undefined }}>
              <label className="flabel">{f.label}</label>
              {f.options ? (
                <select className="fsel" value={values[f.key] || ''} onChange={e => setValue(f.key, e.target.value)}>
                  <option value="">Select...</option>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea className="fta" value={values[f.key] || ''} onChange={e => setValue(f.key, e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}...`} />
              ) : (
                <input className="finp" type={f.type || 'text'} value={values[f.key] || ''} onChange={e => setValue(f.key, e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}...`} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="o-btn" onClick={downloadPDF} disabled={generating} style={{ flex: 1, fontSize: '12px' }}>
              {generating ? 'Generating PDF…' : '⬇ Download as PDF'}
            </button>
            <button className="ghost-btn" onClick={saveDoc}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
          </div>
        </div>
      </div>

      {/* RIGHT — live preview */}
      <div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>Live Preview</div>
        <div className="doc-preview">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: '#888', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>Envi Lee Creator Studios™</div>
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
            <div style={{ width: '60px', height: '2px', background: '#ff6a00', margin: '0 auto 20px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {fields.map(f => (
              <div key={f.key} className="field-box" style={{ gridColumn: f.full ? 'span 2' : undefined }}>
                <div className="field-label">{f.label}</div>
                <div className="field-value">{values[f.key] || <span style={{ color: '#ccc', fontStyle: 'italic' }}>—</span>}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div className="field-label">Owner Signature</div>
              <div style={{ borderBottom: '1px solid #ccc', height: '30px' }} />
            </div>
            <div>
              <div className="field-label">Date</div>
              <div style={{ borderBottom: '1px solid #ccc', height: '30px', paddingTop: '8px', fontSize: '13px' }}>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div className="doc-stamp">
            <div className="doc-stamp-text">{stampText}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI TWIN BIRTH CERTIFICATE ─────────────────────────────────
function BirthCertificate() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        AI Twin <span style={{ color: 'var(--orange)' }}>Birth Certificate</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>
        Official creation certificate establishing your AI twin's identity and your ownership rights. Fill it out and download as a PDF.
      </div>
      <FillableForm
        title="Certificate of AI Creation"
        subtitle="Official Birth Record & Ownership Declaration"
        docType="birth"
        stampText="Envi Lee™ Certified"
        fields={[
          { label: 'AI Twin Name', key: 'twinName' },
          { label: 'Creator / Owner Name', key: 'ownerName' },
          { label: 'Date of Creation', key: 'creationDate', type: 'date' },
          { label: 'Creation Platform', key: 'platform' },
          { label: 'AI Tools Used', key: 'tools' },
          { label: 'Primary Niche', key: 'niche' },
          { label: 'Owner Email', key: 'email', type: 'email' },
          { label: 'Owner Social Handle', key: 'handle' },
          { label: 'Physical Description', key: 'appearance', type: 'textarea', full: true },
          { label: 'Personality & Brand Voice', key: 'personality', type: 'textarea', full: true },
          { label: 'Ownership Statement', key: 'statement', type: 'textarea', full: true },
        ]}
      />
    </div>
  )
}

// ── AI TWIN ID CARD ───────────────────────────────────────────
function IDCard() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [photo, setPhoto] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function setValue(key: string, val: string) { setValues(v => ({ ...v, [key]: val })) }

  const fields = [
    { label: 'AI Twin Name', key: 'name' },
    { label: 'Creator Name', key: 'creator' },
    { label: 'ID Number', key: 'idNumber' },
    { label: 'Date of Creation', key: 'created', type: 'date' },
    { label: 'Classification', key: 'class', options: ['Official AI Twin', 'AI Influencer', 'AI Team Member', 'AI Character', 'AI Artist'] },
    { label: 'Primary Platform', key: 'platform' },
    { label: 'Niche', key: 'niche' },
    { label: 'Expiry', key: 'expiry', options: ['Never — Permanent', '1 Year', '2 Years', '5 Years'] },
  ]

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        AI Twin <span style={{ color: 'var(--orange)' }}>ID Card</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Generate an official ID card for your AI twin establishing their identity and your ownership.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card hi">
          <div className="ftitle">ID Card Details</div>
          <div style={{ marginBottom: '14px' }}>
            <label className="flabel">AI Twin Photo</label>
            <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed rgba(255,106,0,0.2)', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'var(--orange3)', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setPhoto(ev.target?.result as string); r.readAsDataURL(f) } }} />
              {photo ? <img src={photo} alt="twin" style={{ maxHeight: '100px', borderRadius: '6px' }} /> : <div style={{ color: 'var(--mu3)', fontSize: '12px' }}>Upload AI twin photo</div>}
            </div>
          </div>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: '10px' }}>
              <label className="flabel">{f.label}</label>
              {f.options ? (
                <select className="fsel" value={values[f.key] || ''} onChange={e => setValue(f.key, e.target.value)}>
                  <option value="">Select...</option>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="finp" type={f.type || 'text'} value={values[f.key] || ''} onChange={e => setValue(f.key, e.target.value)} />
              )}
            </div>
          ))}
          <button className="o-btn" style={{ width: '100%', marginTop: '8px', fontSize: '12px' }} disabled={generating}>
            {generating ? 'Generating…' : '⬇ Download ID Card as PDF'}
          </button>
        </div>

        {/* ID Card preview */}
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>ID Card Preview</div>
          <div style={{ background: 'linear-gradient(135deg, #1a0800, #2a1000)', border: '1px solid rgba(255,106,0,0.4)', borderRadius: '16px', padding: '24px', width: '340px', maxWidth: '100%', boxShadow: '0 0 30px rgba(255,106,0,0.15)', position: 'relative', overflow: 'hidden' }}>
            {/* Top stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--o-grad)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,106,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace" }}>Envi Lee Creator Studios™</div>
                <div style={{ fontSize: '8px', color: 'rgba(255,106,0,0.4)', fontFamily: "'DM Mono',monospace" }}>Official AI Identity Card</div>
              </div>
              <div style={{ fontSize: '20px' }}>🔒</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '70px', height: '80px', background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.3)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photo ? <img src={photo} alt="twin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px', opacity: 0.3 }}>◉</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--orange)', marginBottom: '3px' }}>{values.name || 'AI Twin Name'}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,200,100,0.7)', marginBottom: '6px' }}>{values.class || 'Official AI Twin'}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,180,80,0.6)', fontFamily: "'DM Mono',monospace" }}>{values.niche || 'Niche'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Creator', value: values.creator },
                { label: 'Platform', value: values.platform },
                { label: 'Created', value: values.created },
                { label: 'Expiry', value: values.expiry || 'Never' },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,106,0,0.05)', borderRadius: '6px', padding: '6px 8px' }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,106,0,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Mono',monospace" }}>{f.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--w2)', marginTop: '2px' }}>{f.value || '—'}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,106,0,0.4)', fontFamily: "'DM Mono',monospace" }}>ID: {values.idNumber || 'EL-000000'}</div>
              <div style={{ fontSize: '8px', color: 'rgba(255,106,0,0.4)', fontFamily: "'DM Mono',monospace" }}>🛡️ PROTECTED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI TWIN PRENUP ────────────────────────────────────────────
function AIPrenup() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        AI Twin <span style={{ color: 'var(--orange)' }}>Prenup Agreement</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>
        Establish ownership terms before collaborating with teams, brands, or influencers. Protects your AI twin if a partnership ends.
      </div>
      <FillableForm
        title="AI Twin Prenuptial Agreement"
        subtitle="Ownership & Collaboration Protection Document"
        docType="prenup"
        stampText="Legally Protected"
        fields={[
          { label: 'AI Twin Name', key: 'twinName' },
          { label: 'Original Creator / Owner', key: 'owner' },
          { label: 'Collaborator Name (if applicable)', key: 'collaborator' },
          { label: 'Collaboration Type', key: 'collabType', options: ['Brand Partnership', 'Team Collaboration', 'Influencer Collab', 'Agency Agreement', 'Content Creation'] },
          { label: 'Date of Agreement', key: 'date', type: 'date' },
          { label: 'Revenue Split (if applicable)', key: 'split' },
          { label: 'Content Ownership Terms', key: 'ownership', type: 'textarea', full: true },
          { label: 'Usage Rights & Restrictions', key: 'rights', type: 'textarea', full: true },
          { label: 'Termination Terms', key: 'termination', type: 'textarea', full: true },
          { label: 'Additional Terms', key: 'terms', type: 'textarea', full: true },
        ]}
      />
    </div>
  )
}

// ── PLATFORM PROTECTION ───────────────────────────────────────
function PlatformProtection() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Platform <span style={{ color: 'var(--orange)' }}>Risk Protection</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>
        Protect yourself from platform bans, algorithm changes, and account loss. Document your content and assets across platforms.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {[
          { title: 'Platform Risk Awareness', icon: '⚠️', points: ['Never build on one platform only', 'Always own your audience — email list is king', 'Archive all your content regularly', 'Document your AI twin on all platforms', 'Screenshot your analytics monthly'] },
          { title: 'Account Protection Steps', icon: '🛡️', points: ['Enable 2-factor authentication on all accounts', 'Use a dedicated business email', 'Never violate platform terms of service', 'Keep all AI-generated content disclosures', 'Backup content to Google Drive weekly'] },
          { title: 'Content Theft Protection', icon: '🔒', points: ['Watermark all your AI generated content', 'File DMCA takedowns immediately if stolen', 'Keep original files with creation timestamps', 'Register your brand on major platforms early', 'Document your creative process with dates'] },
          { title: 'AI Content Disclosure', icon: '📢', points: ['Disclose AI-generated content on all platforms', 'Use #AIContent or #AIGenerated hashtags', 'Keep records of all tools used', 'Understand each platform\'s AI policy', 'Stay updated on AI regulations'] },
        ].map(s => (
          <div key={s.title} className="card hi">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(255,106,0,0.12)' }}>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--orange)' }}>{s.title}</div>
            </div>
            {s.points.map(p => (
              <div key={p} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--orange)', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                <span style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.5' }}>{p}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <FillableForm
        title="Platform Risk Declaration"
        subtitle="Content & Asset Protection Record"
        docType="platform"
        stampText="Risk Protected"
        fields={[
          { label: 'Creator Name', key: 'creator' },
          { label: 'Brand / Business Name', key: 'brand' },
          { label: 'Primary Platform', key: 'primaryPlatform' },
          { label: 'All Active Platforms', key: 'allPlatforms' },
          { label: 'Backup Email', key: 'backupEmail', type: 'email' },
          { label: 'Content Backup Location', key: 'backup' },
          { label: 'Date of Record', key: 'date', type: 'date' },
          { label: 'Asset Inventory Notes', key: 'assets', type: 'textarea', full: true },
        ]}
      />
    </div>
  )
}

// ── ASSET OWNERSHIP ───────────────────────────────────────────
function AssetOwnership() {
  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        AI Asset <span style={{ color: 'var(--orange)' }}>Ownership & Licensing</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Document all your AI assets and their licensing terms. Protect your creative work from theft and unauthorized use.</div>
      <FillableForm
        title="AI Asset Ownership Declaration"
        subtitle="Digital Asset Inventory & Licensing Record"
        docType="assets"
        stampText="IP Protected"
        fields={[
          { label: 'Creator / Owner', key: 'owner' },
          { label: 'Business Entity (if any)', key: 'entity' },
          { label: 'AI Twin / Asset Name', key: 'assetName' },
          { label: 'Asset Type', key: 'assetType', options: ['AI Twin', 'AI Character', 'AI Voice Clone', 'AI Art Style', 'AI Model', 'Prompt Library', 'Trained LoRA Model'] },
          { label: 'Creation Date', key: 'created', type: 'date' },
          { label: 'Tools & Platforms Used', key: 'tools' },
          { label: 'License Type', key: 'license', options: ['All Rights Reserved', 'Creative Commons CC-BY', 'Commercial Use Only', 'Personal Use Only', 'Limited License'] },
          { label: 'Commercial Use Permitted', key: 'commercial', options: ['Yes — Full Commercial Rights', 'Yes — With Attribution', 'No — Personal Use Only', 'Limited — See Terms'] },
          { label: 'Asset Description', key: 'description', type: 'textarea', full: true },
          { label: 'Usage Restrictions', key: 'restrictions', type: 'textarea', full: true },
          { label: 'Licensing Terms', key: 'terms', type: 'textarea', full: true },
        ]}
      />
    </div>
  )
}

// ── LEGAL DISCLAIMERS ─────────────────────────────────────────
function LegalDisclaimers() {
  const disclaimers = [
    { title: 'AI Content Disclosure', content: 'The content created by [YOUR NAME/BRAND] may include AI-generated images, videos, and audio. All AI-generated content is clearly labeled as such. The AI characters, twins, and influencers featured in this content are digital creations and do not represent real individuals.' },
    { title: 'AI Twin Ownership', content: 'All AI characters, twins, influencers, and digital personas created by [YOUR NAME/BRAND] are original creative works and intellectual property owned exclusively by [YOUR NAME/BRAND]. Unauthorized reproduction, distribution, or commercial use of these digital assets is strictly prohibited.' },
    { title: 'Platform Disclaimer', content: '[YOUR NAME/BRAND] operates across multiple social media platforms. In the event of account suspension, content removal, or platform changes beyond our control, [YOUR NAME/BRAND] maintains ownership of all original creative assets and will continue operations on alternative platforms.' },
    { title: 'Collaboration Terms', content: 'Any collaboration with [YOUR NAME/BRAND] AI twins or influencers requires written agreement. Usage rights, revenue sharing, and content ownership must be established in a signed agreement before collaboration begins. All AI assets remain the sole property of [YOUR NAME/BRAND].' },
    { title: 'Copyright Notice', content: '© [YEAR] [YOUR NAME/BRAND]. All rights reserved. All AI-generated content, prompts, workflows, characters, and creative methodologies are proprietary and protected under applicable copyright and intellectual property laws.' },
    { title: 'DMCA Policy', content: '[YOUR NAME/BRAND] takes intellectual property seriously. If you believe your content has been used without authorization, please contact us immediately. We will investigate and respond to all legitimate DMCA takedown requests within 72 hours.' },
  ]

  const [copied, setCopied] = useState<string | null>(null)

  function copy(content: string, title: string) {
    navigator.clipboard?.writeText(content).then(() => { setCopied(title); setTimeout(() => setCopied(null), 2000) })
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Legal <span style={{ color: 'var(--orange)' }}>Disclaimers</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '8px' }}>Copy these disclaimers and customize with your name/brand. Add them to your profiles, websites, and content.</div>
      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '11px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace" }}>
        Replace [YOUR NAME/BRAND] and [YEAR] with your actual information before using.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        {disclaimers.map(d => (
          <div key={d.title} className="card hi">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--orange)' }}>{d.title}</div>
              <button onClick={() => copy(d.content, d.title)} className="ghost-btn" style={{ fontSize: '10px', padding: '5px 12px' }}>
                {copied === d.title ? '✓ Copied!' : 'Copy ↗'}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.8' }}>{d.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FORM TEMPLATES ────────────────────────────────────────────
function FormTemplates({ setTool }: { setTool: (t: LegalTool) => void }) {
  const forms = [
    { id: 'birth', icon: '📜', label: 'AI Twin Birth Certificate', desc: 'Official creation and ownership record' },
    { id: 'idcard', icon: '🪪', label: 'AI Twin ID Card', desc: 'Identity card for your AI characters' },
    { id: 'prenup', icon: '⚖️', label: 'AI Twin Prenup', desc: 'Collaboration and ownership protection' },
    { id: 'platform', icon: '🛡️', label: 'Platform Risk Declaration', desc: 'Content and asset protection record' },
    { id: 'assets', icon: '💎', label: 'Asset Ownership Declaration', desc: 'Licensing and IP documentation' },
  ]

  const extraForms = [
    { label: 'Brand Deal Contract', desc: 'For paid partnerships and sponsorships', available: false },
    { label: 'NDA Template', desc: 'Non-disclosure for collaborations', available: false },
    { label: 'Cease & Desist', desc: 'For content theft situations', available: false },
    { label: 'Collab Agreement', desc: 'For co-creation projects', available: false },
    { label: 'Digital Asset Transfer', desc: 'When selling or transferring AI assets', available: false },
    { label: 'DMCA Takedown', desc: 'Official content removal request', available: false },
  ]

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Legal <span style={{ color: 'var(--orange)' }}>Form Templates</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>All fillable forms — complete inside the app and download as PDF.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {forms.map(f => (
          <div key={f.id} className="card hi" style={{ cursor: 'pointer', transition: 'all .2s' }} onClick={() => setTool(f.id as LegalTool)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,106,0,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,106,0,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,106,0,0.25)'; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{f.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '12px' }}>{f.desc}</div>
            <div style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace" }}>Fill & Download PDF →</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Coming Soon</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {extraForms.map(f => (
          <div key={f.label} className="card" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>📄</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{f.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '10px' }}>{f.desc}</div>
            <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(255,106,0,0.08)', border: '0.5px solid rgba(255,106,0,0.2)', borderRadius: '20px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace" }}>Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SAVED DOCUMENTS ───────────────────────────────────────────
function SavedDocuments() {
  const [docs, setDocs] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => { setDocs(JSON.parse(localStorage.getItem('legalDocs') || '[]')) }, [])

  function del(id: number) {
    const updated = docs.filter(d => d.id !== id)
    setDocs(updated); localStorage.setItem('legalDocs', JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Saved <span style={{ color: 'var(--orange)' }}>Documents</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>All your saved legal documents.</div>
      {docs.length === 0 ? (
        <div className="card accent" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>📄</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No saved documents yet</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Fill out any form and click Save</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {docs.map(doc => (
            <div key={doc.id as number} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--orange)', marginBottom: '2px' }}>{doc.title as string}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{doc.docType as string} · {new Date(doc.savedAt as string).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ghost-btn" style={{ fontSize: '11px' }}>⬇ PDF</button>
                  <button className="del-btn" onClick={() => del(doc.id as number)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── LEGAL BOT ─────────────────────────────────────────────────
function LegalBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "I'm your Baddie Legal Vault assistant! Ask me anything about protecting your AI twin, content ownership, platform risks, or any legal questions related to your AI creator business." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/generate/cineflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'bot', message: `You are the Baddie Legal Vault assistant for Envi Lee Creator Studios. Help AI creators protect their digital assets, AI twins, content, and brand. Topics: AI content ownership, platform risk, DMCA, licensing, content theft protection, AI disclosure requirements, collaboration agreements, brand protection. Note: You provide general educational information only, not legal advice. Always suggest consulting a real attorney for serious legal matters. Question: ${msg}` }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'bot', text: data.result ?? 'Connection error.' }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '340px', background: 'var(--bg2)', border: '0.5px solid var(--ob)', borderRadius: '16px', boxShadow: '0 0 40px rgba(255,106,0,0.1)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'var(--orange3)', borderBottom: '0.5px solid var(--ob)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--orange)', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span className="o-dot" />Legal Assistant
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '88%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'var(--orange3)' : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? 'var(--ob)' : 'rgba(255,106,0,0.1)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: 'var(--orange)', alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '0.5px solid rgba(255,106,0,0.1)', display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid rgba(255,106,0,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'var(--o-grad)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── SIDEBAR NAV ───────────────────────────────────────────────
const NAV: { tool: LegalTool; label: string; icon: string }[] = [
  { tool: 'dashboard', label: 'Dashboard', icon: '◉' },
  { tool: 'vault', label: 'Private Data Vault', icon: '🔒' },
  { tool: 'forms', label: 'All Forms', icon: '📄' },
  { tool: 'idcard', label: 'AI Twin ID Card', icon: '🪪' },
  { tool: 'birth', label: 'Birth Certificate', icon: '📜' },
  { tool: 'prenup', label: 'AI Twin Prenup', icon: '⚖️' },
  { tool: 'platform', label: 'Platform Protection', icon: '🛡️' },
  { tool: 'assets', label: 'Asset Ownership', icon: '💎' },
  { tool: 'disclaimers', label: 'Legal Disclaimers', icon: '📋' },
  { tool: 'saved', label: 'Saved Documents', icon: '💾' },
]

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function LegalVaultPage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<LegalTool>('dashboard')
  const [hovered, setHovered] = useState<LegalTool | null>(null)
  const [botOpen, setBotOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
          <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(255,106,0,0.1)', padding: 0, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(255,106,0,0.1)' }}>
              <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
              </button>
              <div style={{ padding: '12px', background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚖️</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800, color: 'var(--w)' }}>Baddie Legal Vault™</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,106,0,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px', marginTop: '2px' }}>Envi Lee</div>
              </div>
            </div>

            {user && (
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(255,106,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--orange3)', borderRadius: '8px', border: '0.5px solid var(--ob)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Baddie'}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,106,0,0.5)', fontFamily: "'DM Mono',monospace" }}>Protected ✓</div>
                  </div>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                </div>
              </div>
            )}

            <div style={{ padding: '10px', flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Protection Tools</div>
              {NAV.map(({ tool, label, icon }) => (
                <button key={tool} onClick={() => setActive(tool)}
                  onMouseEnter={() => setHovered(tool)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'var(--ob)' : 'transparent'}`, background: active === tool ? 'var(--orange3)' : hovered === tool ? 'rgba(255,106,0,0.03)' : 'none', color: active === tool ? 'var(--orange)' : hovered === tool ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  <span style={{ fontSize: '14px' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(255,106,0,0.1)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,106,0,0.4)', fontFamily: "'DM Mono',monospace", textAlign: 'center', lineHeight: '1.6' }}>
                For serious legal matters always consult a licensed attorney.
              </div>
            </div>
          </aside>

          <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'radial-gradient(ellipse at 80% 0%, rgba(255,106,0,0.04) 0%, transparent 50%)' }}>
            {active === 'dashboard' && <Dashboard setTool={setActive} />}
            {active === 'vault' && <PrivateDataVault />}
            {active === 'forms' && <FormTemplates setTool={setActive} />}
            {active === 'idcard' && <IDCard />}
            {active === 'birth' && <BirthCertificate />}
            {active === 'prenup' && <AIPrenup />}
            {active === 'platform' && <PlatformProtection />}
            {active === 'assets' && <AssetOwnership />}
            {active === 'disclaimers' && <LegalDisclaimers />}
            {active === 'saved' && <SavedDocuments />}
          </main>

          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--o-grad)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,106,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botOpen ? '✕' : '⚖️'}
          </button>
          {botOpen && <LegalBot onClose={() => setBotOpen(false)} />}
        </div>
      </SignedIn>
    </>
  )
}
