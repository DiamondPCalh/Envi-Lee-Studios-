'use client'
import { useState, useRef, useEffect } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type MusicTool = 'dashboard' | 'lyrics' | 'viral' | 'voice' | 'artist' | 'covers' | 'community' | 'video' | 'saved'

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

const css = `
  :root {
    --bg: #000;
    --bg2: #060500;
    --bg3: #0c0a00;
    --s1: #111000;
    --s2: #1a1800;
    --w: #fff9e6;
    --w2: #f0e8c0;
    --mu: #2a2500;
    --mu2: #4a4200;
    --mu3: #8a7a30;
    --r: 8px; --r2: 12px; --r3: 16px;
    --yellow: #ffe600;
    --yellow2: #ffaa00;
    --yellow3: rgba(255,230,0,0.08);
    --yb: rgba(255,230,0,0.25);
    --yg: rgba(255,230,0,0.1);
    --ygr: linear-gradient(135deg, #ffe600, #ff8800);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1a1800; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes beat { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--ygr); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .y-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--yellow); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(255,180,0,0.1); border-radius: var(--r3); padding: 20px; }
  .card.hi { border-color: rgba(255,200,0,0.18); }
  .card.accent { border-color: var(--yb); background: var(--yellow3); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--yellow); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(255,180,0,0.1); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(255,180,0,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .finp:focus { border-color: var(--yb); }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(255,180,0,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(255,180,0,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 90px; line-height: 1.6; }

  .y-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--ygr); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(255,230,0,0.2); }
  .y-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(255,230,0,0.35); }
  .y-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-btn { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--yb); background: transparent; color: var(--yellow); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-btn:hover { background: var(--yellow3); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .ai-out { background: var(--bg3); border: 0.5px solid rgba(255,180,0,0.15); border-radius: var(--r2); padding: 14px; margin-top: 12px; }
  .ai-out-text { font-size: 12px; color: var(--w2); line-height: 1.85; white-space: pre-wrap; }

  .tab-btn { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; }
  .tab-btn.active { background: var(--yellow3); border: 0.5px solid var(--yb); color: var(--yellow); }
  .tab-btn.inactive { background: transparent; border: 0.5px solid rgba(255,180,0,0.08); color: var(--mu3); }

  .beat-bar { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
  .beat-bar span { width: 3px; background: var(--yellow); border-radius: 2px; animation: beat 0.8s ease infinite; }
  .beat-bar span:nth-child(2) { animation-delay: 0.1s; }
  .beat-bar span:nth-child(3) { animation-delay: 0.2s; }
  .beat-bar span:nth-child(4) { animation-delay: 0.3s; }
  .beat-bar span:nth-child(5) { animation-delay: 0.15s; }

  .community-card { background: var(--s1); border: 0.5px solid rgba(255,180,0,0.1); border-radius: var(--r2); padding: 14px; transition: all .2s; }
  .community-card:hover { border-color: var(--yb); }
`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

function Output({ text, loading, onSave }: { text: string; loading: boolean; onSave?: (t: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  function copy() {
    if (!text) return
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function save() {
    if (!text) return
    onSave?.(text)
    const existing = JSON.parse(localStorage.getItem('musicSaved') || '[]')
    existing.unshift({ id: Date.now(), content: text, savedAt: new Date().toISOString() })
    localStorage.setItem('musicSaved', JSON.stringify(existing.slice(0, 100)))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (!text && !loading) return null
  return (
    <div className="ai-out">
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '9px', color: 'var(--yellow)', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
        <span className="y-dot" />Output
      </div>
      {loading && <div className="lbar" style={{ marginBottom: '8px' }}><div className="lbar-fill" /></div>}
      {text && (
        <>
          <div className="ai-out-text">{text}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={copy} className="ghost-btn">{copied ? '✓ Copied!' : 'Copy ↗'}</button>
            <button onClick={save} className="ghost-btn" style={{ borderColor: 'rgba(0,200,83,0.3)', color: '#00c853' }}>{saved ? '✓ Saved!' : '⊹ Save'}</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ setTool }: { setTool: (t: MusicTool) => void }) {
  const { user } = useUser()

  const studios = [
    { id: 'lyrics', icon: '♪', label: 'Lyrics & Hooks', desc: 'AI lyrics, viral hooks, songwriting assistant', color: '#ffe600' },
    { id: 'viral', icon: '★', label: 'Viral Song Generator', desc: 'Turn your ideas into Suno-ready songs', color: '#ffaa00' },
    { id: 'voice', icon: '◈', label: 'Voice Studios', desc: 'Voice cloning, voiceover, audio sync', color: '#ffcc00' },
    { id: 'artist', icon: '◉', label: 'Artist Development', desc: 'Branding, marketing, streaming growth', color: '#ff8800' },
    { id: 'covers', icon: '⊹', label: 'Cover Art & Visuals', desc: 'AI album art, promo graphics, branding kits', color: '#ffd700' },
    { id: 'community', icon: '⊳', label: 'Community', desc: 'Share music, get feedback, challenges', color: '#ffb300' },
    { id: 'video', icon: '◷', label: 'Music Video Studio', desc: 'AI music video creation and direction', color: '#ff9500' },
    { id: 'saved', icon: '◌', label: 'Saved Work', desc: 'All your saved lyrics, ideas, and assets', color: '#ffaa00' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,230,0,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Music Studios Dashboard</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Welcome, <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'Artist'}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Write hits, build your brand, grow your music career.</div>
      </div>

      {/* Beat visualizer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '16px 20px', background: 'var(--yellow3)', border: '0.5px solid var(--yb)', borderRadius: 'var(--r2)' }}>
        <div className="beat-bar">
          {[12, 20, 16, 24, 18, 22, 14, 20, 16, 12].map((h, i) => (
            <span key={i} style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--yellow)' }}>Music Studios™</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>AI-powered music creation, artist development, and community</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '36px' }}>
        {[
          { label: 'AI Tools', value: '20+', color: 'var(--yellow)' },
          { label: 'Song Formats', value: '8+', color: '#ffaa00' },
          { label: 'Voice Types', value: '∞', color: '#ffcc00' },
          { label: 'Community', value: 'Live', color: '#ff8800' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,230,0,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>Studios</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {studios.map(s => (
          <div key={s.id} className="card" style={{ cursor: 'pointer', transition: 'all .2s', borderColor: `${s.color}22` }}
            onClick={() => setTool(s.id as MusicTool)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}55`; (e.currentTarget as HTMLElement).style.background = `${s.color}08` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}22`; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
            <div style={{ fontSize: '22px', color: s.color, marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5', marginBottom: '10px' }}>{s.desc}</div>
            <div style={{ fontSize: '10px', color: s.color, fontFamily: "'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>

      {/* External links */}
      <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {[
          { name: 'Suno AI', url: 'https://suno.com', desc: 'Turn your lyrics into real songs', icon: '♪' },
          { name: 'DistroKid', url: 'https://distrokid.com', desc: 'Upload your music to all platforms', icon: '⊳' },
          { name: 'ElevenLabs', url: 'https://elevenlabs.io', desc: 'Advanced voice cloning and generation', icon: '◈' },
          { name: 'Udio', url: 'https://udio.com', desc: 'AI music generation', icon: '◉' },
        ].map(l => (
          <a key={l.name} href={l.url} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--s1)', border: '0.5px solid rgba(255,180,0,0.1)', borderRadius: 'var(--r2)', textDecoration: 'none', transition: 'all .2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--yb)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,180,0,0.1)')}>
            <div style={{ fontSize: '20px', color: 'var(--yellow)', flexShrink: 0 }}>{l.icon}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yellow)' }}>{l.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{l.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── LYRICS & HOOKS ────────────────────────────────────────────
function LyricsHooks() {
  const [tab, setTab] = useState('lyrics')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const [lTopic, setLTopic] = useState('')
  const [lMood, setLMood] = useState('Confident and powerful')
  const [lGenre, setLGenre] = useState('R&B / Soul')
  const [lStyle, setLStyle] = useState('Modern trap soul')
  const [lPov, setLPov] = useState('First person — female artist')

  const [hConcept, setHConcept] = useState('')
  const [hVibe, setHVibe] = useState('Catchy and viral')
  const [hGenre, setHGenre] = useState('Pop / R&B')

  const [sLyrics, setSLyrics] = useState('')
  const [sStuck, setSStuck] = useState('I need a bridge')

  async function run() {
    setLoading(true); setOutput('')
    try {
      if (tab === 'lyrics') setOutput(await callAPI('generate/music', { tool: 'lyrics', topic: lTopic, mood: lMood, genre: lGenre, style: lStyle, pov: lPov }))
      else if (tab === 'hooks') setOutput(await callAPI('generate/music', { tool: 'hooks', concept: hConcept, vibe: hVibe, genre: hGenre }))
      else if (tab === 'assistant') setOutput(await callAPI('generate/music', { tool: 'assistant', lyrics: sLyrics, stuck: sStuck }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Lyrics & <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hooks</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Write full songs, viral hooks, and get help when you're stuck.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {[['lyrics', '♪ Full Lyrics'], ['hooks', '★ Hook Generator'], ['assistant', '◈ Writing Assistant']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : 'inactive'}`} onClick={() => { setTab(id); setOutput('') }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          {tab === 'lyrics' && <>
            <div className="ftitle">Full Song Lyrics</div>
            <F label="Song topic or story"><textarea className="fta" placeholder="e.g. Rising up from nothing to build an empire, leaving someone behind who didn't believe in me..." value={lTopic} onChange={e => setLTopic(e.target.value)} /></F>
            <F label="Mood"><select className="fsel" value={lMood} onChange={e => setLMood(e.target.value)}>{['Confident and powerful', 'Heartbroken but healing', 'Celebratory and hype', 'Mysterious and dark', 'Soft and vulnerable', 'Angry and unbothered', 'Romantic and sensual'].map(m => <option key={m}>{m}</option>)}</select></F>
            <F label="Genre"><select className="fsel" value={lGenre} onChange={e => setLGenre(e.target.value)}>{['R&B / Soul', 'Hip Hop / Trap', 'Pop', 'Afrobeats', 'Gospel / Inspirational', 'Country Soul', 'EDM / Dance', 'Neo Soul', 'Drill', 'Dancehall'].map(g => <option key={g}>{g}</option>)}</select></F>
            <F label="Style reference"><input className="finp" placeholder="e.g. Beyoncé meets SZA, or early Drake vibes" value={lStyle} onChange={e => setLStyle(e.target.value)} /></F>
            <F label="Point of view"><select className="fsel" value={lPov} onChange={e => setLPov(e.target.value)}>{['First person — female artist', 'First person — male artist', 'Second person', 'Third person narrative'].map(p => <option key={p}>{p}</option>)}</select></F>
          </>}
          {tab === 'hooks' && <>
            <div className="ftitle">Viral Hook Generator</div>
            <F label="Song concept"><textarea className="fta" placeholder="e.g. A woman who finally chose herself, now unbothered and winning..." value={hConcept} onChange={e => setHConcept(e.target.value)} /></F>
            <F label="Hook vibe"><select className="fsel" value={hVibe} onChange={e => setHVibe(e.target.value)}>{['Catchy and viral', 'Emotional and moving', 'Hype and energetic', 'Smooth and melodic', 'Sassy and bold', 'Soft and intimate'].map(v => <option key={v}>{v}</option>)}</select></F>
            <F label="Genre"><select className="fsel" value={hGenre} onChange={e => setHGenre(e.target.value)}>{['Pop / R&B', 'Hip Hop', 'Afrobeats', 'Soul', 'Gospel', 'Country Soul', 'EDM'].map(g => <option key={g}>{g}</option>)}</select></F>
          </>}
          {tab === 'assistant' && <>
            <div className="ftitle">Songwriting Assistant</div>
            <div style={{ background: 'var(--yellow3)', border: '0.5px solid var(--yb)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '11px', color: 'var(--yellow)' }}>
              Paste what you have — the bot helps you finish it.
            </div>
            <F label="Your lyrics so far"><textarea className="fta" style={{ minHeight: '120px' }} placeholder="Paste your verse, chorus, or whatever you have written..." value={sLyrics} onChange={e => setSLyrics(e.target.value)} /></F>
            <F label="Where you're stuck"><select className="fsel" value={sStuck} onChange={e => setSStuck(e.target.value)}>{['I need a bridge', 'I need a second verse', 'I need a pre-chorus', 'I need a better hook', 'I need an outro', 'I need the whole thing finished', 'Help me rhyme this line', 'Make this stronger'].map(s => <option key={s}>{s}</option>)}</select></F>
          </>}
          <button className="y-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Writing…' : '♪ Generate ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Suno Formatting Tips</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '16px' }}>
            After generating your lyrics, copy them into Suno AI to turn them into a real song. Here's how to format them for the best results:
          </div>
          {[
            ['[Verse 1]', 'Start each section with a tag in brackets'],
            ['[Pre-Chorus]', 'Optional but helps Suno understand song structure'],
            ['[Chorus]', 'Your main hook — Suno will repeat this naturally'],
            ['[Bridge]', 'A contrasting section that adds depth'],
            ['[Outro]', 'Closing section — can be a fade or a final statement'],
          ].map(([tag, desc]) => (
            <div key={tag} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '11px', color: 'var(--yellow)', fontFamily: "'DM Mono',monospace", minWidth: '90px', marginTop: '1px' }}>{tag}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{desc}</div>
            </div>
          ))}
          <a href="https://suno.com" target="_blank" rel="noreferrer" className="y-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '16px', fontSize: '12px' }}>
            Open Suno AI ↗
          </a>
          <div style={{ marginTop: '20px' }}>
            <div className="ftitle">Quick-starts</div>
            {[
              { label: 'Empire anthem — Boss babe R&B', topic: 'Building my empire from nothing, proving everyone wrong, now I am untouchable', mood: 'Confident and powerful', genre: 'R&B / Soul' },
              { label: 'Heartbreak era — Neo soul', topic: 'Choosing to walk away from someone I loved because they could not match my energy', mood: 'Heartbroken but healing', genre: 'Neo Soul' },
              { label: 'Viral hook — Afrobeats hype', topic: 'Living my best life, unbothered, glowing up every single day', mood: 'Celebratory and hype', genre: 'Afrobeats' },
            ].map(q => (
              <button key={q.label} onClick={() => { setLTopic(q.topic); setLMood(q.mood); setLGenre(q.genre); setTab('lyrics') }}
                style={{ display: 'block', width: '100%', marginBottom: '7px', padding: '8px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(255,180,0,0.1)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left' }}>
                {q.label} ↗
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── VIRAL SONG GENERATOR ──────────────────────────────────────
function ViralSongGenerator() {
  const [concept, setConcept] = useState('')
  const [genre, setGenre] = useState('R&B / Pop')
  const [mood, setMood] = useState('Confident and empowering')
  const [artist, setArtist] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/music', { tool: 'viral', concept, genre, mood, artistStyle: artist })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Viral Song <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Generator</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Tell us your idea — AI writes a complete viral song with hook, verses, bridge, and Suno-ready formatting.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Your Song Concept</div>
          <F label="What is this song about?">
            <textarea className="fta" style={{ minHeight: '100px' }} placeholder="e.g. A woman who built her empire alone, no one believed in her but now she is on top and she did it in silence..." value={concept} onChange={e => setConcept(e.target.value)} />
          </F>
          <F label="Genre"><select className="fsel" value={genre} onChange={e => setGenre(e.target.value)}>{['R&B / Pop', 'Hip Hop / Trap', 'Afrobeats', 'Gospel / Inspirational', 'Soul / Neo Soul', 'Pop / Dance', 'Country Soul', 'Drill / UK Drill', 'Dancehall'].map(g => <option key={g}>{g}</option>)}</select></F>
          <F label="Mood"><select className="fsel" value={mood} onChange={e => setMood(e.target.value)}>{['Confident and empowering', 'Heartbroken and healing', 'Celebratory and joyful', 'Mysterious and seductive', 'Angry and unbothered', 'Soft and romantic', 'Inspirational and faith-driven'].map(m => <option key={m}>{m}</option>)}</select></F>
          <F label="Artist style reference (optional)"><input className="finp" placeholder="e.g. Beyoncé, SZA, Cardi B, Drake — for tone reference only" value={artist} onChange={e => setArtist(e.target.value)} /></F>
          <button className="y-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Writing your hit…' : '★ Generate Full Viral Song ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">What you get</div>
          {[
            ['Viral Hook', 'A catchy, memorable hook built to be shared and repeated'],
            ['Verse 1', 'Storytelling verse that sets up the song'],
            ['Pre-Chorus', 'The buildup that leads into the hook'],
            ['Chorus', 'The main hook — repeated and memorable'],
            ['Verse 2', 'Deeper storytelling building on verse 1'],
            ['Bridge', 'A contrasting moment of vulnerability or power'],
            ['Outro', 'Closing statement that lands the message'],
            ['Suno Prompt', 'A ready-to-paste prompt for Suno AI to generate the actual song'],
          ].map(([t, d]) => (
            <div key={t} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--yellow)', fontFamily: "'DM Mono',monospace", minWidth: '100px', flexShrink: 0, marginTop: '1px' }}>{t}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <div className="ftitle">Inspiration</div>
            {[
              { concept: 'A woman who moved in silence, built her empire, and now everyone wants access she no longer gives for free', genre: 'R&B / Pop', mood: 'Confident and empowering' },
              { concept: 'Breaking generational poverty through AI, creativity, and relentless belief in yourself when no one else did', genre: 'Gospel / Inspirational', mood: 'Inspirational and faith-driven' },
              { concept: 'Being so unbothered after a breakup that you accidentally glowed up into your best self', genre: 'Afrobeats', mood: 'Celebratory and joyful' },
            ].map((q, i) => (
              <button key={i} onClick={() => { setConcept(q.concept); setGenre(q.genre); setMood(q.mood) }}
                style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(255,180,0,0.1)', borderRadius: '7px', fontSize: '11px', color: 'var(--mu3)', cursor: 'pointer', textAlign: 'left', lineHeight: '1.5' }}>
                {q.concept.slice(0, 80)}… ↗
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── VOICE STUDIOS ─────────────────────────────────────────────
function VoiceStudios() {
  const [tab, setTab] = useState('script')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [vScript, setVScript] = useState('')
  const [vVoice, setVVoice] = useState('Female — warm and confident')
  const [vProduct, setVProduct] = useState('')

  async function run() {
    setLoading(true); setOutput('')
    try {
      if (tab === 'script') setOutput(await callAPI('generate/music', { tool: 'voicescript', script: vScript, voice: vVoice, product: vProduct }))
      else if (tab === 'clone') setOutput(await callAPI('generate/music', { tool: 'voiceclone', voice: vVoice }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Voice <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studios</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Generate voiceover scripts, voice directions, and sync to your music and videos.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[['script', '◈ Voice Script'], ['clone', '⊹ Voice Clone Guide'], ['sync', '◷ Sync Guide']].map(([id, label]) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : 'inactive'}`} onClick={() => { setTab(id); setOutput('') }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          {tab === 'script' && <>
            <div className="ftitle">Voice Script Writer</div>
            <F label="What is the voiceover for?"><input className="finp" placeholder="e.g. Product intro, song intro, podcast opening" value={vProduct} onChange={e => setVProduct(e.target.value)} /></F>
            <F label="Script notes or key points"><textarea className="fta" placeholder="What should the voiceover say? Key messages, tone, story..." value={vScript} onChange={e => setVScript(e.target.value)} /></F>
            <F label="Voice type"><select className="fsel" value={vVoice} onChange={e => setVVoice(e.target.value)}>{['Female — warm and confident', 'Female — sultry and mysterious', 'Female — bright and energetic', 'Male — deep and commanding', 'Male — smooth and charismatic', 'Neutral — professional'].map(v => <option key={v}>{v}</option>)}</select></F>
          </>}
          {tab === 'clone' && <>
            <div className="ftitle">Voice Clone Setup Guide</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '12px' }}>
              Clone your own voice legally using ElevenLabs. Your voice, your brand, forever.
            </div>
            <F label="Your voice description"><textarea className="fta" placeholder="Describe your voice — tone, accent, energy, unique qualities..." value={vScript} onChange={e => setVScript(e.target.value)} /></F>
          </>}
          {tab === 'sync' && (
            <div className="card">
              <div className="ftitle">Auto Sync Voice to Video</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7' }}>
                Here's the workflow to sync your ElevenLabs voice to your AI videos:
              </div>
              {[
                ['Step 1', 'Generate your script in Voice Script above'],
                ['Step 2', 'Copy script → paste into ElevenLabs → generate audio'],
                ['Step 3', 'Download the MP3 from ElevenLabs'],
                ['Step 4', 'Upload to Google Drive → get shareable link'],
                ['Step 5', 'Go to AI Studios → Lip Sync → OmniHuman → paste link'],
                ['Step 6', 'OmniHuman syncs the voice to your AI character video'],
              ].map(([s, d]) => (
                <div key={s} style={{ display: 'flex', gap: '10px', marginBottom: '10px', marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--yellow)', fontFamily: "'DM Mono',monospace", minWidth: '50px', flexShrink: 0 }}>{s}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
                </div>
              ))}
            </div>
          )}
          {tab !== 'sync' && (
            <button className="y-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Generating…' : '◈ Generate ↗'}
            </button>
          )}
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">ElevenLabs Integration</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '16px' }}>
            ElevenLabs is the gold standard for AI voice generation. Use it with your scripts from Voice Studios.
          </div>
          <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="y-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '16px', fontSize: '12px' }}>
            Open ElevenLabs ↗
          </a>
          {[
            ['Free tier', '10,000 characters per month — enough for 3-4 songs or voiceovers'],
            ['Voice cloning', 'Upload 1-3 minutes of clean audio to clone any voice legally'],
            ['Instant voice design', 'Design a completely new AI voice from scratch with no recording'],
            ['Download formats', 'MP3, WAV, PCM — compatible with all video editors'],
            ['Sync to OmniHuman', 'Use the audio URL in OmniHuman Studio for lip sync videos'],
          ].map(([t, d]) => (
            <div key={t} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yellow)', marginBottom: '2px' }}>{t}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── ARTIST DEVELOPMENT ────────────────────────────────────────
function ArtistDevelopment() {
  const [tab, setTab] = useState('brand')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [artistName, setArtistName] = useState('')
  const [genre, setGenre] = useState('R&B / Soul')
  const [vibe, setVibe] = useState('Luxury and mysterious')
  const [goals, setGoals] = useState('')
  const [platforms, setPlatforms] = useState('TikTok, Instagram, Spotify')

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/music', { tool: tab, artistName, genre, vibe, goals, platforms })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  const tabs = [
    ['brand', '◉ Artist Brand'],
    ['marketing', '★ Music Marketing'],
    ['streaming', '⊳ Streaming Growth'],
    ['promo', '⊹ Promo Content'],
    ['label', '◷ Record Label'],
  ]

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Artist <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Development</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Build your brand, grow your streams, create your promo content, and build your record label.</div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {tabs.map(([id, label]) => <button key={id} className={`tab-btn ${tab === id ? 'active' : 'inactive'}`} onClick={() => { setTab(id); setOutput('') }}>{label}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">{tabs.find(t => t[0] === tab)?.[1] ?? 'Artist'}</div>
          <F label="Artist name or AI name"><input className="finp" placeholder="e.g. Nova Star, Luxe, your AI artist name" value={artistName} onChange={e => setArtistName(e.target.value)} /></F>
          <F label="Genre"><select className="fsel" value={genre} onChange={e => setGenre(e.target.value)}>{['R&B / Soul', 'Hip Hop', 'Pop', 'Afrobeats', 'Gospel', 'Country Soul', 'EDM', 'Neo Soul'].map(g => <option key={g}>{g}</option>)}</select></F>
          <F label="Artist vibe / aesthetic"><input className="finp" value={vibe} onChange={e => setVibe(e.target.value)} /></F>
          {tab !== 'label' && <F label="Main platforms"><input className="finp" value={platforms} onChange={e => setPlatforms(e.target.value)} /></F>}
          {tab === 'streaming' && <F label="Current goals"><input className="finp" placeholder="e.g. Hit 10k Spotify streams, grow TikTok to 50k" value={goals} onChange={e => setGoals(e.target.value)} /></F>}
          <button className="y-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating…' : `✦ Generate ${tabs.find(t => t[0] === tab)?.[1].split(' ').slice(-1)[0] ?? 'Plan'} ↗`}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Advanced Features</div>
          {[
            { label: 'AI Artist Avatar', desc: 'Build a full AI persona for your artist — separate from you, fully independent', coming: false },
            { label: 'Virtual Concerts', desc: 'Host AI-generated virtual concert experiences for your fanbase', coming: true },
            { label: 'Music NFT Collectibles', desc: 'Turn your AI music into collectible digital assets', coming: true },
            { label: 'Producer Marketplace', desc: 'Buy and sell beats, collaborate with other producers', coming: true },
            { label: 'Royalty Splitting', desc: 'Automatic royalty tracking and splitting for collaborations', coming: true },
            { label: 'Virtual Try-On Merch', desc: 'Let fans virtually try on your artist merch before buying', coming: true },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(255,180,0,0.08)', borderRadius: '8px', marginBottom: '7px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: f.coming ? 'var(--mu3)' : 'var(--yellow)', marginBottom: '1px' }}>{f.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu2)', lineHeight: '1.4' }}>{f.desc}</div>
              </div>
              {f.coming && <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", padding: '2px 6px', background: 'var(--s2)', borderRadius: '4px', flexShrink: 0, marginLeft: '8px' }}>Soon</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── COVER ART & VISUALS ───────────────────────────────────────
function CoverArt() {
  const [artistName, setArtistName] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [vibe, setVibe] = useState('Luxury and mysterious')
  const [colors, setColors] = useState('Black and gold')
  const [style, setStyle] = useState('Cinematic portrait')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)

  async function generatePrompt() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/music', { tool: 'coverart', artistName, songTitle, vibe, colors, style })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  async function generateImage() {
    if (!output) { alert('Generate prompt first'); return }
    setImgLoading(true)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: output.slice(0, 400), style, size: 'square' }),
      })
      const data = await res.json()
      setImageUrl(data.imageUrl)
    } catch (e) { console.error(e) }
    finally { setImgLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Cover Art <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>& Visuals</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Generate album art, single covers, EP art, and visual branding kits for your music.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Cover Art Generator</div>
          <F label="Artist name"><input className="finp" placeholder="e.g. Nova Star, Luxe" value={artistName} onChange={e => setArtistName(e.target.value)} /></F>
          <F label="Song or album title"><input className="finp" placeholder="e.g. Empire Era, Flawless, The Come Up" value={songTitle} onChange={e => setSongTitle(e.target.value)} /></F>
          <F label="Vibe / aesthetic"><input className="finp" value={vibe} onChange={e => setVibe(e.target.value)} /></F>
          <F label="Color palette"><input className="finp" value={colors} onChange={e => setColors(e.target.value)} /></F>
          <F label="Art style"><select className="fsel" value={style} onChange={e => setStyle(e.target.value)}>{['Cinematic portrait', 'Abstract luxury', 'Streetwear editorial', 'Minimal and bold', 'Vintage soul', 'Futuristic neon', 'Black and gold luxury'].map(s => <option key={s}>{s}</option>)}</select></F>
          <button className="y-btn" onClick={generatePrompt} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Generating…' : '⊹ Generate Cover Art Prompt ↗'}
          </button>
          <Output text={output} loading={loading} />
          {output && (
            <button className="y-btn" onClick={generateImage} disabled={imgLoading} style={{ width: '100%', marginTop: '10px', opacity: imgLoading ? 0.7 : 1 }}>
              {imgLoading ? 'Generating image…' : '◈ Generate Cover Art Image'}
            </button>
          )}
        </div>
        <div className="card accent">
          <div className="ftitle">Cover Art Preview</div>
          <div style={{ background: 'var(--bg3)', borderRadius: '10px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid rgba(255,180,0,0.1)', aspectRatio: '1' }}>
            {imgLoading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="lbar" style={{ width: '80px', margin: '0 auto 10px' }}><div className="lbar-fill" /></div>
                <div style={{ fontSize: '13px', color: 'var(--yellow)' }}>Generating…</div>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="cover art" style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.1 }}>♪</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Cover art appears here</div>
              </div>
            )}
          </div>
          {imageUrl && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={imageUrl} download target="_blank" rel="noreferrer" className="y-btn" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '12px', padding: '9px' }}>⬇ Download</a>
              <button onClick={() => setImageUrl(null)} className="del-btn" style={{ padding: '9px 12px' }}>✕</button>
            </div>
          )}
          <div style={{ marginTop: '16px' }}>
            <div className="ftitle">Cover Art Specs</div>
            {[
              ['Spotify / Apple Music', '3000×3000px JPG/PNG minimum'],
              ['SoundCloud', '1400×1400px minimum'],
              ['YouTube Thumbnail', '1280×720px JPG/PNG'],
              ['Instagram Post', '1080×1080px JPG/PNG'],
              ['DistroKid Upload', '1400×1400px JPG — no blurry edges'],
            ].map(([p, s]) => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <div style={{ fontSize: '11px', color: 'var(--w2)' }}>{p}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── COMMUNITY ─────────────────────────────────────────────────
function Community() {
  const { user } = useUser()
  const [posts, setPosts] = useState([
    { id: 1, name: 'Nova Star', title: 'Empire Era — Full Demo', genre: 'R&B / Soul', likes: 24, comments: 8, shared: true, avatar: '★' },
    { id: 2, name: 'Luxe B', title: 'Unbothered Hook (WIP)', genre: 'Hip Hop', likes: 18, comments: 5, shared: true, avatar: '◈' },
    { id: 3, name: 'Music King', title: 'The Come Up Beat', genre: 'Trap', likes: 31, comments: 12, shared: true, avatar: '♪' },
  ])
  const [myTitle, setMyTitle] = useState('')
  const [myGenre, setMyGenre] = useState('R&B / Soul')
  const [sharing, setSharing] = useState(false)

  function share() {
    if (!myTitle.trim()) { alert('Add a title first'); return }
    const newPost = { id: Date.now(), name: user?.firstName || 'Creator', title: myTitle, genre: myGenre, likes: 0, comments: 0, shared: true, avatar: '◉' }
    setPosts(p => [newPost, ...p])
    setMyTitle(''); setSharing(false)
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Music <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Community</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Share your music, get feedback from the community, and join challenges.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          {/* Share button */}
          <div style={{ marginBottom: '20px' }}>
            {!sharing ? (
              <button className="y-btn" onClick={() => setSharing(true)} style={{ fontSize: '12px' }}>
                ♪ Share Your Music ↗
              </button>
            ) : (
              <div className="card hi" style={{ marginBottom: '14px' }}>
                <div className="ftitle">Share Your Work</div>
                <F label="Track or project title"><input className="finp" placeholder="e.g. Empire Era Demo, My New Hook" value={myTitle} onChange={e => setMyTitle(e.target.value)} /></F>
                <F label="Genre"><select className="fsel" value={myGenre} onChange={e => setMyGenre(e.target.value)}>{['R&B / Soul', 'Hip Hop', 'Pop', 'Afrobeats', 'Gospel', 'Neo Soul', 'Trap', 'Dancehall'].map(g => <option key={g}>{g}</option>)}</select></F>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="y-btn" onClick={share} style={{ flex: 1, fontSize: '12px' }}>Share ↗</button>
                  <button className="ghost-btn" onClick={() => setSharing(false)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Community feed */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {posts.map(post => (
              <div key={post.id} className="community-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--yellow3)', border: '1.5px solid var(--yb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'var(--yellow)', flexShrink: 0 }}>{post.avatar}</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--w)' }}>{post.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{post.genre}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--yellow)', marginBottom: '10px' }}>{post.title}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPosts(p => p.map(x => x.id === post.id ? { ...x, likes: x.likes + 1 } : x))}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '0.5px solid rgba(255,180,0,0.15)', background: 'transparent', color: 'var(--yellow)', fontSize: '11px', cursor: 'pointer' }}>
                    ♥ {post.likes}
                  </button>
                  <button style={{ padding: '6px 12px', borderRadius: '6px', border: '0.5px solid rgba(255,180,0,0.1)', background: 'transparent', color: 'var(--mu3)', fontSize: '11px', cursor: 'pointer' }}>
                    ◈ {post.comments} comments
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Challenges</div>
            {[
              { label: '30-Day Song Challenge', desc: 'Write and generate one song per day for 30 days', active: true },
              { label: 'Viral Hook Battle', desc: 'Who can write the catchiest hook this week?', active: true },
              { label: 'Cover Art Contest', desc: 'Best AI album cover wins a feature on the network', active: false },
            ].map(c => (
              <div key={c.label} style={{ padding: '10px 12px', background: 'var(--bg3)', border: `0.5px solid ${c.active ? 'var(--yb)' : 'rgba(255,180,0,0.08)'}`, borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: c.active ? 'var(--yellow)' : 'var(--mu3)' }}>{c.label}</div>
                  {c.active && <div style={{ fontSize: '9px', color: 'var(--yellow)', fontFamily: "'DM Mono',monospace", padding: '2px 6px', background: 'var(--yellow3)', borderRadius: '4px' }}>LIVE</div>}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--mu2)', lineHeight: '1.4' }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="ftitle">Quick Access</div>
            {[
              { name: 'DistroKid', url: 'https://distrokid.com', desc: 'Upload music to all platforms' },
              { name: 'Spotify for Artists', url: 'https://artists.spotify.com', desc: 'Manage your Spotify profile' },
              { name: 'TuneCore', url: 'https://tunecore.com', desc: 'Alternative music distribution' },
            ].map(l => (
              <a key={l.name} href={l.url} target="_blank" rel="noreferrer"
                style={{ display: 'block', padding: '9px 12px', background: 'var(--bg3)', border: '0.5px solid rgba(255,180,0,0.08)', borderRadius: '8px', marginBottom: '7px', textDecoration: 'none', transition: 'border .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--yb)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,180,0,0.08)')}>
                <div style={{ fontSize: '12px', color: 'var(--yellow)', fontWeight: 500, marginBottom: '1px' }}>{l.name} ↗</div>
                <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{l.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MUSIC VIDEO STUDIO ────────────────────────────────────────
function MusicVideoStudio() {
  const [songTitle, setSongTitle] = useState('')
  const [genre, setGenre] = useState('R&B / Soul')
  const [concept, setConcept] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true); setOutput('')
    try { setOutput(await callAPI('generate/music', { tool: 'musicvideo', songTitle, genre, concept })) }
    catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Music Video <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>Plan and script your AI music video — scene by scene with cinematic directions and AI video prompts.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Music Video Director</div>
          <F label="Song title"><input className="finp" placeholder="e.g. Empire Era, Flawless, The Come Up" value={songTitle} onChange={e => setSongTitle(e.target.value)} /></F>
          <F label="Genre"><select className="fsel" value={genre} onChange={e => setGenre(e.target.value)}>{['R&B / Soul', 'Hip Hop / Trap', 'Pop', 'Afrobeats', 'Gospel', 'Neo Soul'].map(g => <option key={g}>{g}</option>)}</select></F>
          <F label="Video concept"><textarea className="fta" placeholder="e.g. Artist rises from humble beginnings to luxury — intercut between past and present, flashy and emotional..." value={concept} onChange={e => setConcept(e.target.value)} /></F>
          <button className="y-btn" onClick={run} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Directing…' : '◷ Generate Music Video Plan ↗'}
          </button>
          <Output text={output} loading={loading} />
        </div>
        <div className="card">
          <div className="ftitle">Music Video Workflow</div>
          {[
            ['Step 1 — Plan here', 'Generate your scene-by-scene plan with AI video prompts for each scene'],
            ['Step 2 — Generate images', 'Take your scene prompts to Image Generator → create storyboard images'],
            ['Step 3 — Generate video clips', 'Take each scene to Video Generator → Kling AI or Veo 3.1'],
            ['Step 4 — Add your song', 'Import video clips + your Suno song into CapCut'],
            ['Step 5 — Edit and sync', 'Cut to the beat, add text overlays, color grade'],
            ['Step 6 — Export and share', 'Export 1080p → upload to YouTube, TikTok, Instagram Reels'],
          ].map(([t, d]) => (
            <div key={t} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yellow)', marginBottom: '2px' }}>{t}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{d}</div>
            </div>
          ))}
          <div style={{ marginTop: '16px' }}>
            <a href="https://capcut.com" target="_blank" rel="noreferrer" className="y-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontSize: '12px' }}>
              Open CapCut ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SAVED WORK ────────────────────────────────────────────────
function SavedWork() {
  const [items, setItems] = useState<Array<{ id: number; content: string; imageUrl?: string; savedAt: string }>>([])

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('musicSaved') || '[]'))
  }, [])

  function del(id: number) {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    localStorage.setItem('musicSaved', JSON.stringify(updated))
  }

  return (
    <div className="pg-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>
        Saved <span style={{ background: 'var(--ygr)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Work</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '24px' }}>All your saved lyrics, hooks, scripts, and cover art.</div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.2 }}>♪</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No saved work yet</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Use any tool and click Save</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {items.map(item => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                <button onClick={() => del(item.id)} className="del-btn">Delete</button>
              </div>
              {item.imageUrl && <img src={item.imageUrl} alt="saved" style={{ width: '200px', borderRadius: '8px', marginBottom: '8px' }} />}
              {item.content && <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7', maxHeight: '150px', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{item.content}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MUSIC BOT ─────────────────────────────────────────────────
function MusicBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "I'm your Music Studios assistant! Ask me anything about songwriting, music production, growing your streams, artist branding, or using AI music tools." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are a music industry assistant for Envi Lee Music Studios. Help with: songwriting, AI music tools (Suno, Udio, ElevenLabs), artist development, streaming growth, music marketing, DistroKid, building a record label, music video creation, and voice cloning. Be specific and inspiring. Question: ${msg}` })
      setMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '340px', background: '#060500', border: '0.5px solid var(--yb)', borderRadius: '16px', boxShadow: '0 0 40px rgba(255,230,0,0.08)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'var(--yellow3)', borderBottom: '0.5px solid var(--yb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: 'var(--yellow)', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span className="y-dot" />Music Assistant
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '88%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'var(--yellow3)' : 'var(--s1)', border: `0.5px solid ${m.role === 'user' ? 'var(--yb)' : 'rgba(255,180,0,0.1)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: 'var(--yellow)', alignSelf: 'flex-start' as const, padding: '8px 12px', background: 'var(--s1)', borderRadius: '12px', border: '0.5px solid rgba(255,180,0,0.1)' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '0.5px solid rgba(255,180,0,0.1)', display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: 'var(--bg3)', border: '0.5px solid rgba(255,180,0,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'var(--ygr)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── SIDEBAR NAV ───────────────────────────────────────────────
const NAV: { tool: MusicTool; label: string; icon: string }[] = [
  { tool: 'dashboard', label: 'Dashboard', icon: '◉' },
  { tool: 'lyrics', label: 'Lyrics & Hooks', icon: '♪' },
  { tool: 'viral', label: 'Viral Song Generator', icon: '★' },
  { tool: 'voice', label: 'Voice Studios', icon: '◈' },
  { tool: 'artist', label: 'Artist Development', icon: '⊹' },
  { tool: 'covers', label: 'Cover Art & Visuals', icon: '◷' },
  { tool: 'community', label: 'Community', icon: '⊳' },
  { tool: 'video', label: 'Music Video Studio', icon: '◌' },
  { tool: 'saved', label: 'Saved Work', icon: '◎' },
]

// ── MAIN ──────────────────────────────────────────────────────
export default function MusicStudiosPage() {
  const { user } = useUser()
  const router = useRouter()
  const [active, setActive] = useState<MusicTool>('dashboard')
  const [hovered, setHovered] = useState<MusicTool | null>(null)
  const [botOpen, setBotOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
          <aside style={{ width: '230px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(255,180,0,0.1)', padding: 0, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(255,180,0,0.1)' }}>
              <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--ygr)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>♪</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 800, color: 'var(--w)' }}>Music Studios™</div>
                  <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px' }}>Envi Lee</div>
                </div>
              </div>
            </div>

            {user && (
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(255,180,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--yellow3)', borderRadius: '8px', border: '0.5px solid var(--yb)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Artist'}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,230,0,0.5)', fontFamily: "'DM Mono',monospace" }}>Music Plan</div>
                  </div>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                </div>
              </div>
            )}

            <div style={{ padding: '10px', flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Studios</div>
              {NAV.map(({ tool, label, icon }) => (
                <button key={tool} onClick={() => setActive(tool)}
                  onMouseEnter={() => setHovered(tool)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', border: `0.5px solid ${active === tool ? 'var(--yb)' : 'transparent'}`, background: active === tool ? 'var(--yellow3)' : hovered === tool ? 'rgba(255,230,0,0.03)' : 'none', color: active === tool ? 'var(--yellow)' : hovered === tool ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(255,180,0,0.1)' }}>
              <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.8px' }}>Quick Links</div>
              {[{ label: 'Suno AI', url: 'https://suno.com' }, { label: 'DistroKid', url: 'https://distrokid.com' }, { label: 'ElevenLabs', url: 'https://elevenlabs.io' }, { label: 'Udio', url: 'https://udio.com' }].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: 'block', padding: '5px 8px', fontSize: '11px', color: 'var(--mu3)', textDecoration: 'none', fontFamily: "'DM Mono',monospace", borderRadius: '5px', marginBottom: '2px', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--yellow)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--mu3)')}>
                  {l.label} ↗
                </a>
              ))}
            </div>
          </aside>

          <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'radial-gradient(ellipse at 80% 0%, rgba(255,150,0,0.03) 0%, transparent 50%)' }}>
            {active === 'dashboard' && <Dashboard setTool={setActive} />}
            {active === 'lyrics' && <LyricsHooks />}
            {active === 'viral' && <ViralSongGenerator />}
            {active === 'voice' && <VoiceStudios />}
            {active === 'artist' && <ArtistDevelopment />}
            {active === 'covers' && <CoverArt />}
            {active === 'community' && <Community />}
            {active === 'video' && <MusicVideoStudio />}
            {active === 'saved' && <SavedWork />}
          </main>

          <button onClick={() => setBotOpen(!botOpen)}
            style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--ygr)', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,230,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {botOpen ? '✕' : '♪'}
          </button>
          {botOpen && <MusicBot onClose={() => setBotOpen(false)} />}
        </div>
      </SignedIn>
    </>
  )
}
