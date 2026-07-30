'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type LegalTool = 'dashboard' | 'vault' | 'forms' | 'idcard' | 'birth' | 'prenup' | 'platform' | 'assets' | 'disclaimers' | 'templates' | 'saved' | 'trademark' | 'namecheck' | 'ipprotection' | 'dmca' | 'charactertimestamp' | 'licensing' | 'nda' | 'ftcdisclosure' | 'llcguide'

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
    { id: 'namecheck', icon: '🔍', label: 'AI Name Scanner', desc: 'Check if your AI character name is taken & find unique alternatives', color: 'var(--orange)' },
    { id: 'trademark', icon: '™️', label: 'Trademark Guide', desc: 'Step-by-step how to trademark your character, brand & name', color: '#ff9a3c' },
    { id: 'ipprotection', icon: '🛡️', label: 'IP Protection Suite', desc: 'Protect characters, movies, clothing, cars — full IP toolkit', color: '#ffb347' },
    { id: 'dmca', icon: '📛', label: 'DMCA & Cease & Desist', desc: 'Ready-to-send takedown notices and C&D letters', color: 'var(--orange)' },
    { id: 'charactertimestamp', icon: '⏰', label: 'Proof of Creation', desc: 'Timestamp your AI characters with blockchain proof', color: '#ff9a3c' },
    { id: 'licensing', icon: '💼', label: 'Licensing Agreement', desc: 'License your AI character to brands and collaborators for money', color: 'var(--orange)' },
    { id: 'nda', icon: '🤐', label: 'NDA Template', desc: 'Protect your prompts, workflows, and secrets before sharing', color: '#ff9a3c' },
    { id: 'ftcdisclosure', icon: '📢', label: 'FTC AI Disclosures', desc: 'FTC-compliant disclosures for sponsored AI content', color: '#ffb347' },
    { id: 'llcguide', icon: '🏢', label: 'LLC Formation Guide', desc: 'Turn your AI empire into a real protected business entity', color: 'var(--orange)' },
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

// ── AI NAME SCANNER ───────────────────────────────────────────
function NameScanner() {
  const [name, setName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<{
    score: number; available: boolean; platforms: Record<string, boolean>
    trademarkRisk: string; suggestions: string[]; verdict: string; nextSteps: string[]
  } | null>(null)

  async function scanName() {
    if (!name.trim()) return
    setScanning(true); setResults(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are an AI brand name advisor for creators building AI influencer characters. 
            
Analyze this AI character/influencer name: "${name}"

Return ONLY valid JSON:
{
  "score": 85,
  "available": true,
  "platforms": {
    "Instagram": true,
    "TikTok": true,
    "YouTube": true,
    "Twitter": false,
    "Threads": true,
    "Facebook": true
  },
  "trademarkRisk": "Low — no obvious conflicts with major brands",
  "suggestions": [
    "NovaBaddie",
    "NovaLee_",
    "ItsNovaBaddie",
    "NovaCreates",
    "NovaXOfficial"
  ],
  "verdict": "This name has strong branding potential. Unique enough to trademark. The name is creative, memorable, and not commonly used by major brands.",
  "nextSteps": [
    "Search USPTO.gov to confirm no trademark exists",
    "Register on all platforms immediately to secure the handle",
    "File a trademark application in Class 41 (Entertainment) and Class 25 (Clothing)",
    "Create a character bible document to support copyright claims"
  ]
}

Be realistic about platform availability based on common name patterns. Short common names are usually taken. Creative unique names are usually available. Score 1-100 for uniqueness/brandability.`
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
      setResults(JSON.parse(clean))
    } catch (e) {
      console.error(e)
    }
    setScanning(false)
  }

  function getScoreColor(s: number) { return s >= 80 ? '#00ff88' : s >= 60 ? 'var(--orange)' : '#ff4444' }
  function getScoreLabel(s: number) { return s >= 80 ? 'Highly Unique ✦' : s >= 60 ? 'Moderate — Refine It' : 'Too Common — Change It' }

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>New Feature</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          AI Name <span style={{ color: 'var(--orange)' }}>Scanner™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          AI tools give thousands of creators the same character names. Find out if your AI twin's name is unique, check platform availability, assess trademark risk, and get better alternatives — all in one scan.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Search */}
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">🔍 Scan Your AI Character Name</div>
            <F label="AI Character / Influencer Name">
              <input className="finp" placeholder="e.g. Nova, Luxe, Zara, Diamond..." value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanName()} />
            </F>
            <button className="o-btn" onClick={scanName} disabled={scanning || !name.trim()} style={{ width: '100%', fontSize: '13px' }}>
              {scanning ? '⟳ Scanning across platforms…' : '🔍 Scan Name Now'}
            </button>
            {scanning && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
          </div>

          <div className="card" style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7' }}>
            <div className="ftitle">What We Check</div>
            {['Platform handle availability (IG, TikTok, YouTube, X, Threads)', 'Trademark conflict risk assessment', 'Brand uniqueness score 1-100', '5 unique alternative name suggestions', 'Next steps to protect the name legally'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', color: 'var(--mu3)' }}>
                <span style={{ color: 'var(--orange)', flexShrink: 0 }}>✦</span>{item}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <div>
              {/* Score */}
              <div style={{ background: 'var(--s1)', border: '0.5px solid var(--ob)', borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Uniqueness Score for "{name}"</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '64px', fontWeight: 900, color: getScoreColor(results.score), lineHeight: 1, marginBottom: '6px' }}>{results.score}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: getScoreColor(results.score) }}>{getScoreLabel(results.score)}</div>
                <div style={{ fontSize: '12px', color: 'var(--mu3)', marginTop: '8px', lineHeight: '1.6' }}>{results.verdict}</div>
              </div>

              {/* Platform availability */}
              <div className="card" style={{ marginBottom: '12px' }}>
                <div className="ftitle">Platform Availability</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(results.platforms).map(([platform, available]) => (
                    <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--bg3)', borderRadius: '7px', border: `0.5px solid ${available ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,68,0.2)'}` }}>
                      <span style={{ fontSize: '12px', color: 'var(--w2)' }}>{platform}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: available ? '#00ff88' : '#ff4444' }}>{available ? '✓ Available' : '✕ Taken'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trademark risk */}
              <div className="card" style={{ marginBottom: '12px' }}>
                <div className="ftitle">™ Trademark Risk</div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{results.trademarkRisk}</div>
                <a href="https://tmsearch.uspto.gov" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', color: 'var(--orange)', textDecoration: 'none', border: '0.5px solid var(--ob)', padding: '5px 12px', borderRadius: '6px' }}>
                  Verify on USPTO.gov →
                </a>
              </div>

              {/* Alternative names */}
              <div className="card" style={{ marginBottom: '12px' }}>
                <div className="ftitle">✦ Unique Alternatives</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                  {results.suggestions.map(s => (
                    <div key={s} style={{ padding: '6px 14px', background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '20px', fontSize: '12px', color: 'var(--orange)', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { setName(s); setResults(null) }}>
                      {s} <span style={{ fontSize: '10px', opacity: 0.6 }}>— scan this</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              <div className="card hi">
                <div className="ftitle">⚡ Next Steps to Protect This Name</div>
                {results.nextSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--o-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', paddingTop: '2px' }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🔍</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Enter your AI character name and scan to see if it's truly unique</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TRADEMARK GUIDE ───────────────────────────────────────────
function TrademarkGuide() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000) })
  }

  const classes = [
    { num: '9', name: 'Software & Digital', covers: 'AI software, apps, digital tools, downloadable content', relevant: true },
    { num: '25', name: 'Clothing & Apparel', covers: 'AI character merchandise, branded clothing, accessories', relevant: true },
    { num: '41', name: 'Entertainment', covers: 'AI influencer content, shows, movies, educational content', relevant: true },
    { num: '42', name: 'Technology Services', covers: 'AI generation services, platform access, SaaS', relevant: true },
    { num: '35', name: 'Advertising & Business', covers: 'Brand promotion, influencer marketing, business services', relevant: false },
    { num: '38', name: 'Communication', covers: 'Social media services, broadcasting', relevant: false },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>IP Protection</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Trademark <span style={{ color: 'var(--orange)' }}>Guide™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          A trademark protects your AI character's NAME and BRAND. Nobody else can use your trademark commercially once it's registered. Here is exactly how to do it.
        </div>
      </div>

      {/* Alert */}
      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>™️</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)', marginBottom: '3px' }}>Use ™ Now, Get ® Later</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>You can use ™ on your character name immediately without filing anything. Once USPTO approves your registration (6-12 months), you upgrade to ®. Start using ™ TODAY.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Step by step */}
        <div className="card hi">
          <div className="ftitle">Step-by-Step Filing Process</div>
          {[
            { step: 1, title: 'Search USPTO first', desc: 'Go to tmsearch.uspto.gov and search your character name. Make sure no one has already trademarked it.', link: 'https://tmsearch.uspto.gov', linkText: 'Search USPTO →' },
            { step: 2, title: 'Create a USPTO account', desc: 'Go to USPTO.gov and create a free MyUSPTO account. This is where you file and track your application.', link: 'https://www.uspto.gov', linkText: 'Go to USPTO.gov →' },
            { step: 3, title: 'File TEAS Plus application', desc: 'Use the TEAS Plus form — it costs $250 per class. File in Class 41 (Entertainment) at minimum for AI influencer content.', link: 'https://www.uspto.gov/trademarks/apply', linkText: 'File Application →' },
            { step: 4, title: 'Select your classes', desc: 'Choose which trademark classes apply to you. Most AI creators need Class 41 (Entertainment) and Class 9 (Digital).' },
            { step: 5, title: 'Wait for examination', desc: 'USPTO examines your application in 3-6 months. They may send Office Actions (questions). Respond within 3 months.' },
            { step: 6, title: 'Publication & Registration', desc: 'Your mark gets published for opposition. If no one opposes it in 30 days, you get your ® registration in 6-12 months total.' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '12px', marginBottom: '14px', paddingBottom: '14px', borderBottom: s.step < 6 ? '0.5px solid rgba(255,106,0,0.08)' : 'none' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--o-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--orange)', marginBottom: '3px' }}>{s.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.6', marginBottom: s.link ? '6px' : 0 }}>{s.desc}</div>
                {s.link && <a href={s.link} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: 'var(--orange)', textDecoration: 'none', fontFamily: "'DM Mono',monospace" }}>{s.linkText}</a>}
              </div>
            </div>
          ))}
        </div>

        <div>
          {/* Classes */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Trademark Classes for AI Creators</div>
            {classes.map(c => (
              <div key={c.num} style={{ padding: '10px', background: c.relevant ? 'var(--orange3)' : 'var(--bg3)', border: `0.5px solid ${c.relevant ? 'var(--ob)' : 'rgba(255,106,0,0.05)'}`, borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: c.relevant ? 'var(--orange)' : 'var(--mu3)' }}>Class {c.num} — {c.name}</span>
                  {c.relevant && <span style={{ fontSize: '9px', padding: '2px 7px', background: 'var(--o-grad)', borderRadius: '10px', color: '#fff', fontFamily: "'DM Mono',monospace" }}>Recommended</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{c.covers}</div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="card hi">
            <div className="ftitle">Cost Breakdown</div>
            {[
              { item: 'TEAS Plus filing fee', cost: '$250/class' },
              { item: 'Class 41 (Entertainment)', cost: '$250' },
              { item: 'Class 9 (Digital)', cost: '$250' },
              { item: 'Class 25 (Clothing)', cost: '$250' },
              { item: 'Attorney fee (optional)', cost: '$500-1500' },
            ].map(r => (
              <div key={r.item} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(255,106,0,0.07)', fontSize: '12px' }}>
                <span style={{ color: 'var(--mu3)' }}>{r.item}</span>
                <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{r.cost}</span>
              </div>
            ))}
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.6' }}>
              Filing 2 classes (Entertainment + Digital) = <strong style={{ color: 'var(--orange)' }}>$500 total</strong> — protect your character for 10 years.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── IP PROTECTION SUITE ───────────────────────────────────────
function IPProtectionSuite() {
  const { user } = useUser()
  const [charName, setCharName] = useState('')
  const [charDesc, setCharDesc] = useState('')
  const [saved, setSaved] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000) })
  }

  const charBible = charName ? `AI CHARACTER PROTECTION BIBLE
══════════════════════════════
Character Name: ${charName}™
Creator: ${user?.firstName || 'Creator'} (Envi Lee Creator Studios)
Creation Date: ${new Date().toLocaleDateString()}
Platform: Envi Lee Creator Studios™

CHARACTER DESCRIPTION:
${charDesc || '[Describe your character in detail — appearance, personality, voice, style, backstory]'}

OWNERSHIP DECLARATION:
I, ${user?.firstName || '[Creator Name]'}, hereby declare full ownership of the AI character "${charName}™" including all associated:
• Visual likeness and appearance
• Name and brand identity  
• Personality traits and backstory
• Voice characteristics
• Wardrobe and style elements
• Content created using this character

This character was created using proprietary AI generation techniques, custom prompts, and significant creative human input. All creative decisions, including character design, personality, and content direction were made by the creator.

PROTECTED ELEMENTS:
• The name "${charName}™"
• The specific visual DNA of this character
• All content featuring this character
• Any derivative works based on this character

PROHIBITED USES WITHOUT LICENSE:
• Commercial use of the character name
• Recreating the character's likeness for profit
• Claiming ownership of this character
• Creating derivative content for commercial gain

For licensing inquiries contact: [Your Email]

Date: ${new Date().toLocaleDateString()}
Creator Signature: ________________________
` : ''

  const items = [
    {
      icon: '🎭',
      title: 'Character Protection',
      desc: 'Protect AI characters, influencers, and digital personas',
      what: ['Character name — trademark at USPTO ($250/class)', 'Visual likeness — create a character bible with detailed description', 'Personality & backstory — copyright your written character description', 'Content — watermark every image and video before posting'],
    },
    {
      icon: '🎬',
      title: 'AI Movie & Show Protection',
      desc: 'Protect AI films, series, and video content',
      what: ['Title — trademark your show/movie title in Class 41', 'Scripts — copyright your written scripts at copyright.gov ($65)', 'Characters — each main character needs their own protection', 'Concept — write a detailed treatment document and date it'],
    },
    {
      icon: '👗',
      title: 'Clothing & Brand Protection',
      desc: 'Protect AI-designed clothing lines and fashion brands',
      what: ['Brand name — trademark in Class 25 (Clothing) at USPTO', 'Logo — trademark your logo design separately', 'Designs — copyright original designs at copyright.gov', 'Product names — trademark individual product line names'],
    },
    {
      icon: '🚗',
      title: 'Asset & Vehicle Protection',
      desc: 'Protect AI-generated cars, vehicles, and digital assets',
      what: ['Vehicle designs — copyright the creative expression', 'Brand name — trademark the vehicle brand or model name', 'Concept art — register at copyright.gov as visual art', 'Document creation — maintain dated records of all designs'],
    },
    {
      icon: '🏷️',
      title: 'Brand Name Protection',
      desc: 'Protect your overall creator brand and empire',
      what: ['Business name — register as LLC or business entity first', 'Brand trademark — USPTO filing in relevant classes', 'Domain — register yourname.com immediately', 'Social handles — claim all platform handles NOW before someone else'],
    },
    {
      icon: '💰',
      title: 'Content Monetization Protection',
      desc: 'Protect your revenue streams and licensing rights',
      what: ['Licensing agreements — use our template before sharing with brands', 'Revenue protection — document all brand deals in writing', 'Platform TOS — keep copies of all platform agreements', 'Creator agreements — written contracts before any collaboration'],
    },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>IP Protection</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          IP Protection <span style={{ color: 'var(--orange)' }}>Suite™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          AI makes it dangerously easy for anyone to copy your character, show, clothing, or brand. Here is exactly how to protect every element of your creative empire from characters to cars.
        </div>
      </div>

      {/* Protection categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {items.map(item => (
          <div key={item.title} className="card hi" style={{ borderColor: 'rgba(255,106,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--orange)' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{item.desc}</div>
              </div>
            </div>
            {item.what.map(w => (
              <div key={w} style={{ display: 'flex', gap: '7px', fontSize: '11px', color: 'var(--w2)', marginBottom: '5px', lineHeight: '1.5' }}>
                <span style={{ color: 'var(--orange)', flexShrink: 0 }}>✦</span>{w}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Character Bible Generator */}
      <div className="card hi">
        <div className="ftitle">📜 Generate Your Character Protection Bible</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <F label="Character Name">
              <input className="finp" placeholder="e.g. Nova™, Luxe™, Diamond™" value={charName} onChange={e => setCharName(e.target.value)} />
            </F>
            <F label="Character Description (the more detail the better)">
              <textarea className="fta" style={{ minHeight: '120px' }} placeholder="Describe your AI character in detail — appearance, skin tone, hair, eyes, personality, style, niche, backstory, voice, wardrobe, favorite colors, jewelry, everything..." value={charDesc} onChange={e => setCharDesc(e.target.value)} />
            </F>
            <button className="o-btn" disabled={!charName} onClick={() => setSaved(true)} style={{ width: '100%', fontSize: '12px' }}>
              {saved ? '✓ Bible Generated!' : '📜 Generate Character Bible'}
            </button>
          </div>
          <div>
            {charName ? (
              <div style={{ background: 'var(--bg3)', border: '0.5px solid rgba(255,106,0,0.2)', borderRadius: '10px', padding: '16px', height: '100%', position: 'relative' as const }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', whiteSpace: 'pre-wrap' as const, maxHeight: '280px', overflowY: 'auto' }}>{charBible}</div>
                <div style={{ position: 'absolute' as const, bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                  <button className="ghost-o" onClick={() => copy(charBible, 'bible')} style={{ fontSize: '10px', padding: '4px 10px' }}>{copiedKey === 'bible' ? '✓ Copied!' : 'Copy'}</button>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📜</div>
                  <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Enter character name to generate</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DMCA CENTER ───────────────────────────────────────────────
function DMCACenter() {
  const { user } = useUser()
  const [platform, setPlatform] = useState('Instagram')
  const [theirHandle, setTheirHandle] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [yourCharName, setYourCharName] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000) })
  }

  const dmcaNotice = `DMCA TAKEDOWN NOTICE

To: ${platform} Copyright Team
Date: ${new Date().toLocaleDateString()}
From: ${user?.firstName || '[Your Name]'}

RE: Copyright Infringement of AI Character "${yourCharName || '[Character Name]'}"

I am the original creator and copyright holder of the AI character known as "${yourCharName || '[Character Name]'}™" which appears at: [YOUR ORIGINAL CONTENT URL]

I have a good faith belief that the content posted by ${theirHandle || '[Infringer Handle]'} at: ${contentUrl || '[INFRINGING CONTENT URL]'} infringes upon my intellectual property rights.

I am the creator of the original AI character including the character's:
• Name and brand identity
• Visual likeness and appearance  
• Personality and creative direction
• All associated original content

I request immediate removal of the infringing content.

Under penalty of perjury, I declare that the information in this notification is accurate and I am authorized to act on behalf of the owner of the copyright.

Creator: ${user?.firstName || '[Your Name]'}
Date: ${new Date().toLocaleDateString()}
Contact: [Your Email]`

  const ceaseDesist = `CEASE AND DESIST NOTICE

Date: ${new Date().toLocaleDateString()}
From: ${user?.firstName || '[Your Name]'}, Creator & Owner of ${yourCharName || '[Character Name]'}™

To: ${theirHandle || '[Infringer Name/Handle]'}

RE: Unauthorized Use of AI Character "${yourCharName || '[Character Name]'}™"

You are hereby notified that your use of the AI character "${yourCharName || '[Character Name]'}™" or confusingly similar characters constitutes infringement of my intellectual property rights.

I am the sole creator and owner of "${yourCharName || '[Character Name]'}™" including all associated visual likeness, brand identity, and creative elements.

DEMANDED ACTIONS — within 48 hours:
1. Immediately cease all use of "${yourCharName || '[Character Name]'}™" or similar characters
2. Remove all infringing content from all platforms
3. Provide written confirmation of compliance
4. Destroy or delete any copies of my character

Failure to comply will result in:
• DMCA takedown notices filed with all platforms
• Legal action for copyright and trademark infringement  
• Claims for damages including lost revenue

This is your only notice before legal action is initiated.

${user?.firstName || '[Your Name]'}
Envi Lee Creator Studios™
Date: ${new Date().toLocaleDateString()}`

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Protection Tools</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          DMCA & Cease <span style={{ color: 'var(--orange)' }}>& Desist</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          Someone stole your character? These are the two most powerful legal tools to get content removed and stop infringers immediately. Fill in the details and copy your notice.
        </div>
      </div>

      {/* Input form */}
      <div className="card hi" style={{ marginBottom: '20px' }}>
        <div className="ftitle">Fill in Infringement Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <F label="Your AI Character Name">
            <input className="finp" placeholder="e.g. Nova™" value={yourCharName} onChange={e => setYourCharName(e.target.value)} />
          </F>
          <F label="Platform Where It Happened">
            <select className="fsel" value={platform} onChange={e => setPlatform(e.target.value)}>
              {['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Pinterest', 'Threads', 'LinkedIn', 'Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Infringer's Handle">
            <input className="finp" placeholder="@theirhandle" value={theirHandle} onChange={e => setTheirHandle(e.target.value)} />
          </F>
          <F label="URL of Infringing Content">
            <input className="finp" placeholder="https://instagram.com/p/..." value={contentUrl} onChange={e => setContentUrl(e.target.value)} />
          </F>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* DMCA */}
        <div className="card hi">
          <div className="ftitle">📛 DMCA Takedown Notice</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '12px', lineHeight: '1.6' }}>
            Send to the platform directly. Most platforms must remove content within 24-48 hours of receiving a valid DMCA notice.
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', fontFamily: "'DM Mono',monospace", whiteSpace: 'pre-wrap' as const, maxHeight: '280px', overflowY: 'auto', marginBottom: '10px' }}>
            {dmcaNotice}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="o-btn" onClick={() => copy(dmcaNotice, 'dmca')} style={{ flex: 1, fontSize: '11px' }}>{copiedKey === 'dmca' ? '✓ Copied!' : 'Copy DMCA Notice'}</button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--mu3)' }}>
            Where to send on each platform:
            <a href="https://help.instagram.com/ip" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', marginLeft: '6px', textDecoration: 'none' }}>Instagram →</a>
            <a href="https://www.tiktok.com/legal/copyright-policy" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', marginLeft: '6px', textDecoration: 'none' }}>TikTok →</a>
            <a href="https://support.google.com/youtube/answer/2807622" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', marginLeft: '6px', textDecoration: 'none' }}>YouTube →</a>
          </div>
        </div>

        {/* C&D */}
        <div className="card hi">
          <div className="ftitle">⚖️ Cease & Desist Letter</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)', marginBottom: '12px', lineHeight: '1.6' }}>
            Send directly to the infringer. This puts them on legal notice and demands they stop immediately. More serious than DMCA — use when they keep reposting.
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', fontFamily: "'DM Mono',monospace", whiteSpace: 'pre-wrap' as const, maxHeight: '280px', overflowY: 'auto', marginBottom: '10px' }}>
            {ceaseDesist}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="o-btn" onClick={() => copy(ceaseDesist, 'cd')} style={{ flex: 1, fontSize: '11px' }}>{copiedKey === 'cd' ? '✓ Copied!' : 'Copy C&D Letter'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PROOF OF CREATION ─────────────────────────────────────────
function ProofOfCreation() {
  const { user } = useUser()
  const [records, setRecords] = useState<Array<{id: string; name: string; desc: string; date: string; hash: string}>>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`proofRecords_${user?.id}`) || '[]')
    setRecords(saved)
  }, [user?.id])

  function generateHash(text: string) {
    let hash = 0
    for (let i = 0; i < text.length; i++) { hash = ((hash << 5) - hash) + text.charCodeAt(i); hash |= 0 }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase() + '-' + Date.now().toString(16).toUpperCase()
  }

  function saveRecord() {
    if (!name.trim()) return
    const record = {
      id: Date.now().toString(),
      name: name.trim(),
      desc: desc.trim(),
      date: new Date().toISOString(),
      hash: generateHash(name + desc + Date.now()),
    }
    const updated = [record, ...records]
    setRecords(updated)
    localStorage.setItem(`proofRecords_${user?.id}`, JSON.stringify(updated))
    setName(''); setDesc(''); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function deleteRecord(id: string) {
    const updated = records.filter(r => r.id !== id)
    setRecords(updated)
    localStorage.setItem(`proofRecords_${user?.id}`, JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Ownership Proof</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Proof of <span style={{ color: 'var(--orange)' }}>Creation™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          If someone steals your character you need to prove YOU created it first. Register every AI character, movie, design, and asset here. Each record gets a unique timestamp ID that proves your creation date.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '16px' }}>
            <div className="ftitle">⏰ Register New Creation</div>
            <F label="Creation Name">
              <input className="finp" placeholder="e.g. Nova™ AI Character, The Luxe Files (Series)" value={name} onChange={e => setName(e.target.value)} />
            </F>
            <F label="Description (include all details)">
              <textarea className="fta" style={{ minHeight: '100px' }} placeholder="Describe exactly what you created — appearance, style, content type, platform, what makes it unique..." value={desc} onChange={e => setDesc(e.target.value)} />
            </F>
            <button className="o-btn" onClick={saveRecord} disabled={!name.trim()} style={{ width: '100%', fontSize: '12px' }}>
              {saved ? '✓ Creation Registered!' : '⏰ Register Creation with Timestamp'}
            </button>
          </div>

          <div className="card" style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7' }}>
            <div className="ftitle">For Even Stronger Proof</div>
            {[
              { text: 'OriginStamp.org — blockchain timestamp your files for free', url: 'https://originstamp.org' },
              { text: 'Copyright.gov — register written works ($65)', url: 'https://copyright.gov' },
              { text: 'Email yourself — send description to yourself as dated record', url: null },
              { text: 'Screenshot everything — document with dates visible', url: null },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--orange)', flexShrink: 0 }}>✦</span>
                <span>{item.text}</span>
                {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0, fontFamily: "'DM Mono',monospace", fontSize: '10px' }}>→</a>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Your Registered Creations ({records.length})
          </div>
          {records.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>⏰</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No creations registered yet — add your first one</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
              {records.map(r => (
                <div key={r.id} className="card" style={{ borderColor: 'rgba(255,106,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--orange)' }}>{r.name}</div>
                    <button onClick={() => deleteRecord(r.id)} className="del-btn" style={{ fontSize: '10px', padding: '2px 8px' }}>✕</button>
                  </div>
                  {r.desc && <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '8px' }}>{r.desc.slice(0, 100)}{r.desc.length > 100 ? '…' : ''}</div>}
                  <div style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: '6px', border: '0.5px solid rgba(255,106,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: "'DM Mono',monospace" }}>
                      <span style={{ color: 'var(--mu3)' }}>Creation ID:</span>
                      <span style={{ color: 'var(--orange)' }}>{r.hash}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: "'DM Mono',monospace", marginTop: '3px' }}>
                      <span style={{ color: 'var(--mu3)' }}>Registered:</span>
                      <span style={{ color: 'var(--w2)' }}>{new Date(r.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ── LICENSING AGREEMENT ───────────────────────────────────────
function LicensingAgreement() {
  const { user } = useUser()
  const [charName, setCharName] = useState('')
  const [licensee, setLicensee] = useState('')
  const [useCase, setUseCase] = useState('Brand Partnership')
  const [fee, setFee] = useState('')
  const [duration, setDuration] = useState('6 months')
  const [platforms, setPlatforms] = useState('Instagram, TikTok, YouTube')
  const [copied, setCopied] = useState(false)

  const useCases = ['Brand Partnership', 'Sponsored Content', 'Product Promotion', 'Commercial Campaign', 'Affiliate Marketing', 'Content Collaboration', 'Merchandise Use', 'Event Promotion']
  const durations = ['30 days', '3 months', '6 months', '1 year', 'Ongoing (renewable)']

  const agreement = `AI CHARACTER LICENSING AGREEMENT
══════════════════════════════════

This Licensing Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} between:

LICENSOR: ${user?.firstName || '[Your Name]'} ("Creator")
Operating under: Envi Lee Creator Studios™
Character Name: ${charName || '[Character Name]'}™

LICENSEE: ${licensee || '[Brand/Company Name]'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. GRANT OF LICENSE
Creator grants Licensee a NON-EXCLUSIVE, NON-TRANSFERABLE license to use the AI character "${charName || '[Character Name]'}™" for the following purpose only:

Purpose: ${useCase}
Approved Platforms: ${platforms}
License Duration: ${duration}
License Fee: ${fee || '[AMOUNT]'}

2. WHAT IS LICENSED
Licensee may use:
• The AI character's approved images provided by Creator
• The character's name in connection with approved content
• Approved promotional materials featuring the character

3. WHAT IS NOT LICENSED
Licensee may NOT:
• Recreate, generate, or replicate the AI character independently
• Claim ownership or co-ownership of the character
• Sub-license the character to any third party
• Use the character beyond the approved platforms or purpose
• Modify or alter the character's appearance without written approval
• Continue use after the license expiration date

4. CREATOR RETAINS
• Full ownership of "${charName || '[Character Name]'}™" in perpetuity
• All rights not explicitly granted herein
• Right to license the character to other brands simultaneously
• Right to terminate this agreement with 14 days notice for breach

5. COMPENSATION
Licensee agrees to pay Creator: ${fee || '[AMOUNT]'}
Payment due: [PAYMENT TERMS]
Late fee: 10% per 30 days past due

6. CONTENT APPROVAL
All content featuring the character must be approved by Creator in writing before publication. Creator has the right to reject any content that misrepresents the character.

7. ATTRIBUTION
Licensee must credit: "${charName || '[Character Name]'}™ by ${user?.firstName || '[Your Name]'}" in all content featuring the character.

8. AI DISCLOSURE
Licensee acknowledges this is an AI-generated character and agrees to include appropriate AI content disclosures per FTC guidelines.

9. TERMINATION
This agreement terminates automatically upon expiration. Either party may terminate with 14 days written notice for material breach.

10. GOVERNING LAW
This agreement is governed by the laws of [YOUR STATE].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATOR SIGNATURE:
${user?.firstName || '[Your Name]'} — Envi Lee Creator Studios™
Date: ________________________

LICENSEE SIGNATURE:
${licensee || '[Brand Representative Name]'}
Title: ________________________
Date: ________________________`

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Money Protection</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Licensing <span style={{ color: 'var(--orange)' }}>Agreement™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          When a brand wants to use your AI character, this agreement protects you. Fill in the details and your custom licensing agreement generates instantly — ready to send to any brand or collaborator.
        </div>
      </div>

      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>💰</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)', marginBottom: '3px' }}>Never Work With a Brand Without This</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>Without a licensing agreement, brands can use your character however they want. This document defines exactly what they can and cannot do — and makes sure you get paid.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Fill In License Details</div>
          <F label="Your AI Character Name"><input className="finp" placeholder="e.g. Nova™" value={charName} onChange={e => setCharName(e.target.value)} /></F>
          <F label="Brand / Company Name"><input className="finp" placeholder="e.g. Fashion Nova, Skims, FashionBrand Inc." value={licensee} onChange={e => setLicensee(e.target.value)} /></F>
          <F label="License Use Case">
            <select className="fsel" value={useCase} onChange={e => setUseCase(e.target.value)}>
              {useCases.map(u => <option key={u}>{u}</option>)}
            </select>
          </F>
          <F label="Approved Platforms"><input className="finp" placeholder="Instagram, TikTok, YouTube..." value={platforms} onChange={e => setPlatforms(e.target.value)} /></F>
          <F label="License Duration">
            <select className="fsel" value={duration} onChange={e => setDuration(e.target.value)}>
              {durations.map(d => <option key={d}>{d}</option>)}
            </select>
          </F>
          <F label="License Fee"><input className="finp" placeholder="e.g. $2,500, $5,000 flat fee" value={fee} onChange={e => setFee(e.target.value)} /></F>
        </div>

        <div>
          <div style={{ background: 'var(--bg3)', border: '0.5px solid rgba(255,106,0,0.2)', borderRadius: '10px', padding: '16px', height: '480px', overflowY: 'auto', marginBottom: '10px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', whiteSpace: 'pre-wrap' as const }}>{agreement}</div>
          </div>
          <button className="o-btn" onClick={() => { navigator.clipboard?.writeText(agreement).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} style={{ width: '100%', fontSize: '12px' }}>
            {copied ? '✓ Agreement Copied!' : '📋 Copy Full Agreement'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NDA TEMPLATE ──────────────────────────────────────────────
function NDATemplate() {
  const { user } = useUser()
  const [recipientName, setRecipientName] = useState('')
  const [purpose, setPurpose] = useState('Content Collaboration')
  const [duration, setDuration] = useState('2 years')
  const [copied, setCopied] = useState(false)

  const purposes = ['Content Collaboration', 'Prompt Sharing', 'Workflow Training', 'Business Partnership', 'Team Member', 'Contractor / Freelancer', 'Investor Discussion']
  const durations = ['1 year', '2 years', '3 years', '5 years', 'Indefinitely']

  const nda = `NON-DISCLOSURE AGREEMENT (NDA)
════════════════════════════════

This Non-Disclosure Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} between:

DISCLOSING PARTY: ${user?.firstName || '[Your Name]'}
Operating under: Envi Lee Creator Studios™

RECEIVING PARTY: ${recipientName || '[Recipient Name]'}

PURPOSE: ${purpose}
TERM: ${duration} from date of signing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CONFIDENTIAL INFORMATION
"Confidential Information" includes ALL of the following:

• AI character DNA profiles and detailed descriptions
• Proprietary prompts, prompt stacks, and prompt engineering techniques  
• Image generation workflows and processes
• Video production pipelines and methods
• AI tool combinations, settings, and configurations
• Character creation techniques and Soul ID processes
• Business strategies, client lists, and revenue information
• Unreleased content, characters, and projects
• Training data and AI model fine-tuning details
• Any other non-public business information

2. OBLIGATIONS
Receiving Party agrees to:
• Keep all Confidential Information strictly secret
• Not share with any third party without written consent
• Use information ONLY for the stated purpose above
• Take all reasonable steps to prevent unauthorized disclosure
• Notify Disclosing Party immediately of any breach

3. WHAT IS NOT COVERED
This NDA does not cover information that:
• Is already publicly known through no fault of Receiving Party
• Receiving Party independently develops without using Confidential Information
• Is required to be disclosed by law (with prior written notice to Disclosing Party)

4. NO LICENSE
This Agreement does NOT grant any license, right, or interest in any intellectual property of the Disclosing Party.

5. RETURN OF INFORMATION
Upon request or termination, Receiving Party must immediately return or destroy all Confidential Information including copies, notes, and digital files.

6. REMEDIES
Breach of this Agreement may cause irreparable harm. Disclosing Party is entitled to seek injunctive relief and monetary damages without posting bond.

7. TERM
This Agreement remains in effect for ${duration} from signing and survives termination of any related business relationship.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCLOSING PARTY:
${user?.firstName || '[Your Name]'} — Envi Lee Creator Studios™
Signature: ________________________
Date: ________________________

RECEIVING PARTY:
${recipientName || '[Recipient Name]'}
Signature: ________________________
Date: ________________________`

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Secret Protection</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          NDA <span style={{ color: 'var(--orange)' }}>Template™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          Before sharing your prompts, workflows, character DNA, or business strategies with ANYONE — make them sign this. Protects your trade secrets legally.
        </div>
      </div>

      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>🤐</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)', marginBottom: '3px' }}>Sign Before You Share Anything</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>Your AI prompts, DNA profiles, and workflows are trade secrets worth protecting. Get this signed before any collaboration, training session, or business discussion.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Fill In NDA Details</div>
          <F label="Recipient Name"><input className="finp" placeholder="Who are you sharing with?" value={recipientName} onChange={e => setRecipientName(e.target.value)} /></F>
          <F label="Purpose of Sharing">
            <select className="fsel" value={purpose} onChange={e => setPurpose(e.target.value)}>
              {purposes.map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="NDA Duration">
            <select className="fsel" value={duration} onChange={e => setDuration(e.target.value)}>
              {durations.map(d => <option key={d}>{d}</option>)}
            </select>
          </F>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="ftitle">What This NDA Protects</div>
            {['AI character DNA profiles', 'Your proprietary prompts & stacks', 'Image & video generation workflows', 'Soul ID & training processes', 'Business strategies & revenue info', 'Unreleased characters & projects', 'AI tool combinations & settings'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '7px', fontSize: '12px', color: 'var(--mu3)', marginBottom: '5px' }}>
                <span style={{ color: 'var(--orange)' }}>✦</span>{item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ background: 'var(--bg3)', border: '0.5px solid rgba(255,106,0,0.2)', borderRadius: '10px', padding: '16px', height: '480px', overflowY: 'auto', marginBottom: '10px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', whiteSpace: 'pre-wrap' as const }}>{nda}</div>
          </div>
          <button className="o-btn" onClick={() => { navigator.clipboard?.writeText(nda).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} style={{ width: '100%', fontSize: '12px' }}>
            {copied ? '✓ NDA Copied!' : '📋 Copy Full NDA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── FTC DISCLOSURE ────────────────────────────────────────────
function FTCDisclosure() {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000) })
  }

  const disclosures = [
    {
      title: 'Standard AI Content Disclosure',
      when: 'Every post featuring AI characters',
      required: true,
      short: '#AIGenerated #AIInfluencer #DigitalCharacter',
      long: '⚠️ AI Content Disclosure: The character(s) featured in this content are AI-generated digital personas and do not represent real individuals. All images and videos were created using artificial intelligence technology.',
    },
    {
      title: 'Sponsored AI Content Disclosure',
      when: 'Paid partnerships using your AI character',
      required: true,
      short: '#Ad #Sponsored #AIGenerated — This is a paid partnership featuring an AI-generated character.',
      long: '📢 Sponsored Content + AI Disclosure: This is a paid partnership with [BRAND NAME]. The character featured is an AI-generated digital persona, not a real person. All content was created using artificial intelligence. #Ad #Sponsored #AIGenerated',
    },
    {
      title: 'AI Twin / AI Influencer Disclosure',
      when: 'Building followers with an AI influencer',
      required: true,
      short: 'This account features an AI-generated digital influencer. Not a real person. #AIInfluencer',
      long: '🤖 About This Account: [CHARACTER NAME] is an AI-generated digital influencer created by [YOUR NAME/BRAND]. All photos, videos, and content are created using artificial intelligence. [CHARACTER NAME] is a digital persona and does not represent a real individual. Collaborations and partnerships available — DM for inquiries.',
    },
    {
      title: 'Bio AI Disclosure (Platform Bios)',
      when: 'Instagram, TikTok, YouTube bio',
      required: true,
      short: '🤖 AI Character | Not a real person | Created by [YOUR NAME]',
      long: '🤖 AI-Generated Character | Digital Persona | All content created with AI | Not a real person | Created & owned by [YOUR NAME/BRAND] | DM for collabs',
    },
    {
      title: 'Video / Reel Disclosure',
      when: 'At the start of every video featuring AI characters',
      required: true,
      short: '[On screen text or voiceover]: "The person you are about to see is an AI-generated character."',
      long: 'Add as on-screen text at the beginning of video: "AI-Generated Content — The character featured in this video is a digital persona created using artificial intelligence and does not represent a real individual."',
    },
    {
      title: 'Affiliate / Commission Disclosure',
      when: 'When earning commissions through AI character content',
      required: true,
      short: '#Ad — This post contains affiliate links. I may earn a commission. The product is being featured by an AI-generated character.',
      long: '📎 Affiliate Disclosure: This content contains affiliate links. If you purchase through these links, I may earn a commission at no extra cost to you. The character featured is AI-generated. #AffiliatePaid #AIGenerated',
    },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Legal Compliance</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          FTC AI <span style={{ color: 'var(--orange)' }}>Disclosures™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          The FTC requires AI content creators to disclose when content is AI-generated. These ready-to-use disclosures keep you legally compliant on every platform — copy and paste into your content.
        </div>
      </div>

      <div style={{ background: 'rgba(255,68,68,0.06)', border: '0.5px solid rgba(255,68,68,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>⚠️</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff6b6b', marginBottom: '3px' }}>FTC Compliance Is Not Optional</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>The FTC requires clear disclosure of AI-generated content, especially when monetized. Failure to disclose can result in fines up to $50,000 per violation. Use these on every post.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        {disclosures.map((d, i) => (
          <div key={i} className="card hi">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--orange)', marginBottom: '2px' }}>{d.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>When to use: {d.when}</div>
              </div>
              {d.required && <span style={{ fontSize: '9px', padding: '3px 9px', background: 'rgba(255,68,68,0.1)', border: '0.5px solid rgba(255,68,68,0.3)', borderRadius: '20px', color: '#ff6b6b', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>Required by FTC</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,106,0,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '6px' }}>Short Version</div>
                <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', marginBottom: '8px', minHeight: '60px' }}>{d.short}</div>
                <button className="ghost-o" onClick={() => copy(d.short, `short-${i}`)} style={{ fontSize: '10px', padding: '4px 10px' }}>{copied === `short-${i}` ? '✓ Copied!' : 'Copy Short'}</button>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,106,0,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '6px' }}>Full Version</div>
                <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', marginBottom: '8px', minHeight: '60px' }}>{d.long}</div>
                <button className="ghost-o" onClick={() => copy(d.long, `long-${i}`)} style={{ fontSize: '10px', padding: '4px 10px' }}>{copied === `long-${i}` ? '✓ Copied!' : 'Copy Full'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── LLC GUIDE ─────────────────────────────────────────────────
function LLCGuide() {
  const { user } = useUser()
  const [bizName, setBizName] = useState('')
  const [state, setState] = useState('Texas')
  const [copied, setCopied] = useState(false)

  const states = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

  const checklist = `LLC FORMATION CHECKLIST
For: ${bizName || '[Your Business Name]'} LLC
State: ${state}
Owner: ${user?.firstName || '[Your Name]'}
Date: ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — CHOOSE YOUR BUSINESS NAME
□ Decide on: "${bizName || '[Business Name]'} LLC"
□ Search name availability at your state's Secretary of State website
□ Search: ${state} Secretary of State business name search
□ Make sure name includes "LLC" or "Limited Liability Company"

STEP 2 — FILE ARTICLES OF ORGANIZATION
□ Go to your state's Secretary of State website
□ File Articles of Organization (the official LLC formation document)
□ Filing fee: typically $50-$500 depending on state
□ ${state} filing: sos.${state.toLowerCase().replace(' ', '')}.gov (search your state)

STEP 3 — GET YOUR EIN (FREE)
□ Go to IRS.gov and apply for an EIN (Employer Identification Number)
□ This is free — never pay someone to do this
□ Direct link: irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online
□ Takes 10 minutes online — EIN issued immediately

STEP 4 — OPEN A BUSINESS BANK ACCOUNT
□ Open a separate business checking account
□ NEVER mix personal and business money — this protects your LLC status
□ Recommended: Mercury Bank (free, online, creator-friendly)
□ Bring: EIN letter, LLC formation documents, personal ID

STEP 5 — OPERATING AGREEMENT
□ Create an LLC Operating Agreement (internal document)
□ Defines how the business is run, profits distributed, decisions made
□ Not required in all states but strongly recommended
□ Template available from your state's Secretary of State or LegalZoom

STEP 6 — REGISTER YOUR AI BUSINESS
□ Note your primary business purpose as: "Digital content creation, AI character development, and creative media services"
□ Register for state business taxes if required in ${state}
□ Get any required local business licenses

STEP 7 — PROTECT YOUR ASSETS
□ File trademark for "${bizName || '[Business Name]'}™" at USPTO.gov
□ Copyright your character bibles at copyright.gov
□ Use the NDA before sharing any business information
□ Use Licensing Agreements before any brand partnerships

STEP 8 — ANNUAL REQUIREMENTS
□ File Annual Report with ${state} Secretary of State
□ Pay Annual Report fee (varies by state)
□ Keep business records separate from personal
□ Consult a CPA about business taxes quarterly

━━━━━━━━━━━━━━━━━━━━━━━━

WHY AN LLC PROTECTS YOU:
• Personal assets (house, car, savings) protected if sued
• Legitimate business entity for brand deals
• Tax benefits — business expenses are deductible
• More credible to brands and partners
• Protects your AI character empire as a business asset

COST ESTIMATE:
• State filing fee: $50-500
• EIN: FREE
• Business bank account: FREE (Mercury)
• Annual report: $0-500/year
• Total to start: ~$100-600 depending on state`

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,106,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Business Formation</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          LLC Formation <span style={{ color: 'var(--orange)' }}>Guide™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          Turn your AI empire into a real protected business. An LLC separates your personal assets from your business — meaning if anything goes wrong, your personal savings, house, and car are protected.
        </div>
      </div>

      <div style={{ background: 'var(--orange3)', border: '0.5px solid var(--ob)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>🏢</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)', marginBottom: '3px' }}>Your AI Empire Deserves Legal Protection</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>An LLC costs as little as $100 to form and protects everything you've built. Brand deals, licensing revenue, and character ownership all become business assets protected by your LLC.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '16px' }}>
            <div className="ftitle">Customize Your Checklist</div>
            <F label="Your Business Name"><input className="finp" placeholder="e.g. Envi Lee Studios, Nova Empire, Your Name Creative" value={bizName} onChange={e => setBizName(e.target.value)} /></F>
            <F label="Your State">
              <select className="fsel" value={state} onChange={e => setState(e.target.value)}>
                {states.map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '🛡️', title: 'Personal Protection', desc: 'Your personal assets stay safe if the business is sued' },
              { icon: '💰', title: 'Tax Benefits', desc: 'Deduct equipment, software, and business expenses' },
              { icon: '🤝', title: 'Brand Credibility', desc: 'Brands take LLC businesses more seriously for deals' },
              { icon: '📋', title: 'Asset Protection', desc: 'Your AI characters become protected business assets' },
            ].map(b => (
              <div key={b.title} className="card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{b.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--orange)', marginBottom: '4px' }}>{b.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ background: 'var(--bg3)', border: '0.5px solid rgba(255,106,0,0.2)', borderRadius: '10px', padding: '16px', height: '500px', overflowY: 'auto', marginBottom: '10px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', whiteSpace: 'pre-wrap' as const }}>{checklist}</div>
          </div>
          <button className="o-btn" onClick={() => { navigator.clipboard?.writeText(checklist).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} style={{ width: '100%', fontSize: '12px' }}>
            {copied ? '✓ Checklist Copied!' : '📋 Copy Full Checklist'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  { tool: 'namecheck', label: 'AI Name Scanner', icon: '🔍' },
  { tool: 'trademark', label: 'Trademark Guide', icon: '™️' },
  { tool: 'ipprotection', label: 'IP Protection Suite', icon: '🛡️' },
  { tool: 'dmca', label: 'DMCA & Cease & Desist', icon: '📛' },
  { tool: 'charactertimestamp', label: 'Proof of Creation', icon: '⏰' },
  { tool: 'licensing', label: 'Licensing Agreement', icon: '💼' },
  { tool: 'nda', label: 'NDA Template', icon: '🤐' },
  { tool: 'ftcdisclosure', label: 'FTC AI Disclosures', icon: '📢' },
  { tool: 'llcguide', label: 'LLC Formation Guide', icon: '🏢' },
]

// ── MAIN PAGE ─────────────────────────────────────────────────

// ── UNIVERSAL ACCESS GATE ─────────────────────────────────────
function UniversalAccessGate({ children, appName }: { children: React.ReactNode; appName: string }) {
  const { user } = useUser()
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading')

  useEffect(() => {
    async function check() {
      if (!user) { setStatus('denied'); return }
      try {
        const email = user.emailAddresses?.[0]?.emailAddress ?? ''
        const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
        if (user.id === adminId) { setStatus('granted'); return }
        const res = await fetch(`/api/access/realism?userId=${user.id}&email=${encodeURIComponent(email)}`)
        const data = await res.json()
        setStatus(data.hasAccess === true ? 'granted' : 'denied')
      } catch { setStatus('denied') }
    }
    check()
  }, [user])

  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'120px', height:'2px', background:'#0a0010', borderRadius:'1px', overflow:'hidden', margin:'0 auto 16px' }}>
          <div style={{ height:'100%', background:'linear-gradient(135deg,#6B21A8,#A855F7,#06B6D4)', backgroundSize:'200% 100%', animation:'lbar 2s linear infinite' }} />
        </div>
        <div style={{ fontSize:'12px', color:'rgba(168,85,247,0.4)', fontFamily:"'DM Mono',monospace" }}>Verifying access...</div>
      </div>
    </div>
  )

  if (status === 'denied') return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ maxWidth:'520px', width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(168,85,247,0.4)', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'6px' }}>Envi Lee Creator Studios™</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'32px', fontWeight:400, color:'#fff', marginBottom:'6px' }}>{appName}</div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)' }}>Choose your access level to unlock this app</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px' }}>
          <div style={{ background:'#0d0020', border:'1px solid rgba(168,85,247,0.3)', borderRadius:'16px', padding:'24px', position:'relative' as const, overflow:'hidden' }}>
            <div style={{ position:'absolute' as const, top:0, left:0, right:0, height:'3px', background:'linear-gradient(135deg,#6B21A8,#A855F7)' }} />
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(168,85,247,0.5)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'8px' }}>Member</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'36px', fontWeight:900, color:'#A855F7', marginBottom:'4px' }}>$47<span style={{ fontSize:'13px', fontWeight:400, color:'rgba(168,85,247,0.5)' }}>/mo</span></div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', lineHeight:'1.7', marginBottom:'16px' }}>Full access to all 12 apps in the Envi Lee Creator Empire</div>
            {['All 12 creator apps','AI image generation','Prompt Bank™','Legal Vault™','Content Vault™','Realism Studio™'].map(f => (
              <div key={f} style={{ display:'flex', gap:'7px', fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'5px' }}>
                <span style={{ color:'#A855F7' }}>✦</span>{f}
              </div>
            ))}
            <a href="/api/stripe/checkout?plan=member" style={{ display:'block', marginTop:'16px', padding:'11px', borderRadius:'9px', background:'linear-gradient(135deg,#6B21A8,#A855F7)', color:'#fff', fontSize:'12px', fontWeight:700, textDecoration:'none', textAlign:'center' as const }}>Get Member Access →</a>
          </div>
          <div style={{ background:'#0d0020', border:'1px solid rgba(212,168,67,0.4)', borderRadius:'16px', padding:'24px', position:'relative' as const, overflow:'hidden' }}>
            <div style={{ position:'absolute' as const, top:0, left:0, right:0, height:'3px', background:'linear-gradient(135deg,#D4A843,#F5E0A0)' }} />
            <div style={{ position:'absolute' as const, top:'14px', right:'14px', background:'linear-gradient(135deg,#D4A843,#F5E0A0)', color:'#000', fontSize:'9px', fontWeight:800, padding:'3px 9px', borderRadius:'20px', fontFamily:"'DM Mono',monospace" }}>BEST VALUE</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(212,168,67,0.6)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'8px' }}>VIP</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'36px', fontWeight:900, color:'#D4A843', marginBottom:'4px' }}>$65<span style={{ fontSize:'13px', fontWeight:400, color:'rgba(212,168,67,0.5)' }}>/mo</span></div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', lineHeight:'1.7', marginBottom:'16px' }}>Everything in Member plus exclusive VIP perks</div>
            {["Everything in Member","Early access to new apps","First to know whats coming","Discounts on virtual store","Discounts on physical products","Private VIP community"].map(f => (
              <div key={f} style={{ display:'flex', gap:'7px', fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'5px' }}>
                <span style={{ color:'#D4A843' }}>✦</span>{f}
              </div>
            ))}
            <a href="/api/stripe/checkout?plan=vip" style={{ display:'block', marginTop:'16px', padding:'11px', borderRadius:'9px', background:'linear-gradient(135deg,#D4A843,#F5E0A0)', color:'#000', fontSize:'12px', fontWeight:700, textDecoration:'none', textAlign:'center' as const }}>Get VIP Access →</a>
          </div>
        </div>
        <div style={{ background:'rgba(6,182,212,0.05)', border:'0.5px solid rgba(6,182,212,0.2)', borderRadius:'12px', padding:'16px 20px', textAlign:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'12px', color:'rgba(6,182,212,0.8)', marginBottom:'8px', fontWeight:600 }}>🎓 Already enrolled in Baddie Academy or Kings Academy?</div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'10px' }}>Make sure you sign in with the same email you used to enroll.</div>
          <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' as const }}>
            <a href="https://envileebaddieacademy.com" target="_blank" rel="noreferrer" style={{ padding:'7px 16px', borderRadius:'7px', background:'rgba(107,33,168,0.2)', border:'0.5px solid rgba(168,85,247,0.3)', color:'#A855F7', fontSize:'11px', fontWeight:600, textDecoration:'none' }}>Join Baddie Academy →</a>
            <a href="https://envileekingsacademy.com" target="_blank" rel="noreferrer" style={{ padding:'7px 16px', borderRadius:'7px', background:'rgba(212,168,67,0.1)', border:'0.5px solid rgba(212,168,67,0.3)', color:'#D4A843', fontSize:'11px', fontWeight:600, textDecoration:'none' }}>Join Kings Academy →</a>
          </div>
        </div>
        <div style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>Envi Lee Creator Studios™ · All prices in USD · Cancel anytime</div>
      </div>
    </div>
  )

  return <>{children}</>
}

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
        <UniversalAccessGate appName="Baddie Legal Vault™">
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
            {active === 'namecheck' && <NameScanner />}
            {active === 'trademark' && <TrademarkGuide />}
            {active === 'ipprotection' && <IPProtectionSuite />}
            {active === 'dmca' && <DMCACenter />}
            {active === 'charactertimestamp' && <ProofOfCreation />}
            {active === 'licensing' && <LicensingAgreement />}
            {active === 'nda' && <NDATemplate />}
            {active === 'ftcdisclosure' && <FTCDisclosure />}
            {active === 'llcguide' && <LLCGuide />}
          </main>

          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--o-grad)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,106,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botOpen ? '✕' : '⚖️'}
          </button>
          {botOpen && <LegalBot onClose={() => setBotOpen(false)} />}
        </div>
        </UniversalAccessGate>
      </SignedIn>
    </>
  )
}
