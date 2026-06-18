'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type Room = 'library' | 'admin' | 'suite'
type ActiveTab = 'prompts' | 'generate' | 'calendar' | 'stacks' | 'dna' | 'twins' | 'aigenerator' | 'reverse'

// ── VIDEO APPS ────────────────────────────────────────────────
const VIDEO_APPS = [
  { name: 'Midjourney', url: 'https://midjourney.com', icon: '🎨', format: 'midjourney' },
  { name: 'Kling AI', url: 'https://klingai.com', icon: '🎬', format: 'kling' },
  { name: 'Veo', url: 'https://labs.google/veo', icon: '🌐', format: 'veo' },
  { name: 'Runway', url: 'https://runwayml.com', icon: '✈️', format: 'runway' },
  { name: 'Hailuo', url: 'https://hailuoai.com', icon: '🌊', format: 'hailuo' },
  { name: 'Luma AI', url: 'https://lumalabs.ai', icon: '💡', format: 'luma' },
  { name: 'PixVerse', url: 'https://pixverse.ai', icon: '✨', format: 'pixverse' },
  { name: 'Higgsfield', url: 'https://higgsfield.ai', icon: '⚡', format: 'higgsfield' },
  { name: 'Sora', url: 'https://sora.com', icon: '🌅', format: 'sora' },
  { name: 'CapCut', url: 'https://capcut.com', icon: '✂️', format: 'capcut' },
  { name: 'Pika Labs', url: 'https://pika.art', icon: '🔥', format: 'pika' },
  { name: 'Stable Video', url: 'https://stability.ai', icon: '🎭', format: 'stable' },
]

const CATEGORIES = [
  'Baddie Selfies', 'Luxury Lifestyle', 'Fashion Influencer', 'Travel Vlogs',
  'GRWM', 'Beauty Content', 'Gym Girl Content', 'CEO Baddie',
  'Rich Girl Energy', 'Soft Life Content', 'Luxury Hotel Content',
  'AI Boyfriend Content', 'Couple Content', 'Motherhood Content',
  'Brand Content', 'Product Ads', 'Viral TikTok Content', 'YouTube Shorts',
  'Instagram Reels', 'Faceless Content', 'Friend Content', 'Night Out Content',
  'Boss Era', 'Transformation Content', 'Aesthetic Day Content',
  'POV Content', 'Storytime Content', 'Healing Era Content', 'Glow Up Content',
]

const VIDEO_FORMATS: Record<string, string> = {
  midjourney: '/imagine prompt: [PROMPT], 4K, photorealistic, cinematic lighting, --ar 9:16 --v 6.1 --style raw',
  kling: '[PROMPT]. Cinematic motion, 4K quality, smooth camera movement, professional lighting.',
  veo: 'Video of [PROMPT]. High quality, cinematic, professional production value.',
  runway: '[PROMPT] | cinematic | 4K | professional | smooth motion | film quality',
  hailuo: '[PROMPT], ultra HD, cinematic quality, dynamic movement, professional videography',
  luma: 'Cinematic shot of [PROMPT]. 4K, photorealistic, smooth motion, luxury aesthetic.',
  pixverse: '[PROMPT] | 4K cinematic | smooth motion | professional lighting | high quality',
  higgsfield: '[PROMPT]. Photorealistic, cinematic motion, 4K resolution, luxury aesthetic.',
  sora: 'A cinematic video of [PROMPT]. High quality, realistic, smooth camera movement.',
  capcut: '[PROMPT] - Use Auto-Enhance, 4K export, color grading: Luxury preset',
  pika: '[PROMPT], cinematic style, 4K, smooth motion, luxury aesthetic, professional',
  stable: '[PROMPT] | motion:smooth | quality:4K | style:cinematic | lighting:professional',
}

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
const BASE_CSS = `
  :root {
    --bg: #000;
    --bg2: #06020a;
    --bg3: #0d0415;
    --s1: #110520;
    --s2: #180830;
    --w: #fff0ff;
    --w2: #f0c0f8;
    --mu: #2a0840;
    --mu2: #4a1060;
    --mu3: #8a40a0;

    --pink: #ff6fd8;
    --pink2: #ff9ee8;
    --lilac: #c084fc;
    --lilac2: #a855f7;
    --pb: rgba(255,111,216,0.3);
    --lb: rgba(192,132,252,0.3);
    --pg: rgba(255,111,216,0.08);
    --lg: rgba(192,132,252,0.08);
    --p-grad: linear-gradient(135deg, #ff6fd8, #c084fc, #a855f7);
    --p-grad2: linear-gradient(135deg, #ff0080, #ff6fd8, #c084fc);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1a0530; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--p-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .p-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--pink); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 14px; padding: 18px; }
  .card.hi { border-color: rgba(255,111,216,0.25); }
  .card.accent { border-color: var(--pb); background: var(--pg); }
  .card.lilac { border-color: var(--lb); background: var(--lg); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--pink); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(192,132,252,0.12); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .p-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--p-grad); color: #fff; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(192,132,252,0.25); }
  .p-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(255,111,216,0.4); }
  .p-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-p { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--pb); background: transparent; color: var(--pink); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-p:hover { background: var(--pg); }
  .ghost-l { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--lb); background: transparent; color: var(--lilac); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-l:hover { background: var(--lg); }
  .del-btn { padding: 5px 10px; border-radius: 6px; border: 0.5px solid rgba(255,45,120,0.3); background: transparent; color: #ff6b9d; font-size: 11px; cursor: pointer; }

  .prompt-card { background: var(--s1); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 12px; overflow: hidden; transition: all .2s; cursor: pointer; }
  .prompt-card:hover { border-color: rgba(255,111,216,0.4); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(192,132,252,0.1); }

  .cat-pill { padding: 5px 12px; border-radius: 20px; font-size: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; font-weight: 500; }
  .cat-pill.on { background: var(--pg); border: 0.5px solid var(--pb); color: var(--pink); }
  .cat-pill.off { background: var(--s2); border: 0.5px solid rgba(192,132,252,0.1); color: var(--mu3); }
  .cat-pill.off:hover { border-color: var(--lb); color: var(--lilac); }

  .image-window { background: var(--bg3); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 10px; overflow: hidden; aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; position: relative; }
  .image-window img { width: 100%; height: 100%; object-fit: cover; }
  .image-window .placeholder { text-align: center; opacity: 0.3; }

  .video-app-btn { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--s2); border: 0.5px solid rgba(192,132,252,0.1); border-radius: 8px; cursor: pointer; transition: all .2s; width: 100%; text-decoration: none; }
  .video-app-btn:hover { border-color: var(--pb); background: var(--pg); }
  .video-app-btn.selected { border-color: var(--pb); background: var(--pg); }

  .output-box { background: var(--bg3); border: 0.5px solid rgba(192,132,252,0.15); border-radius: 10px; padding: 14px; }
  .output-text { font-size: 12px; color: var(--w2); line-height: 1.85; white-space: pre-wrap; }

  .tab-pill { padding: 7px 16px; border-radius: 20px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; border: 0.5px solid transparent; }
  .tab-pill.on { background: var(--p-grad); color: #fff; box-shadow: 0 0 15px rgba(192,132,252,0.2); }
  .tab-pill.off { background: var(--s2); color: var(--mu3); border-color: rgba(192,132,252,0.1); }

  .dna-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-family: 'DM Mono', monospace; font-weight: 500; }
  .badge-pink { background: var(--pg); color: var(--pink); border: 0.5px solid var(--pb); border-radius: 20px; padding: 2px 8px; font-size: 9px; font-family: 'DM Mono', monospace; }
  .badge-lilac { background: var(--lg); color: var(--lilac); border: 0.5px solid var(--lb); border-radius: 20px; padding: 2px 8px; font-size: 9px; font-family: 'DM Mono', monospace; }
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

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
      className="ghost-p" style={{ fontSize: '10px', padding: '4px 10px' }}>
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

function ImageWindow({ src, loading, index }: { src?: string; loading?: boolean; index: number }) {
  return (
    <div className="image-window">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="lbar" style={{ width: '60px', margin: '0 auto 8px' }}><div className="lbar-fill" /></div>
          <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Generating {index + 1}…</div>
        </div>
      ) : src ? (
        <img src={src} alt={`Generated ${index + 1}`} />
      ) : (
        <div className="placeholder">
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>◈</div>
          <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Image {index + 1}</div>
        </div>
      )}
      {src && (
        <div style={{ position: 'absolute', bottom: '6px', right: '6px' }}>
          <a href={src} download style={{ padding: '3px 8px', borderRadius: '5px', background: 'rgba(0,0,0,0.7)', color: 'var(--pink)', fontSize: '10px', textDecoration: 'none' }}>⬇</a>
        </div>
      )}
    </div>
  )
}

// ── PAYWALL CHECK ─────────────────────────────────────────────
function PaywallGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      if (!user) { setHasAccess(false); return }
      try {
        const res = await fetch('/api/access/prompts')
        const data = await res.json()
        setHasAccess(data.hasAccess)
      } catch { setHasAccess(false) }
    }
    check()
  }, [user])

  if (hasAccess === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div className="lbar" style={{ width: '100px' }}><div className="lbar-fill" /></div>
    </div>
  )

  if (!hasAccess) return (
    <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
      {/* Preview teaser */}
      <div style={{ background: 'var(--s1)', border: '0.5px solid rgba(192,132,252,0.2)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: 'var(--p-grad)', padding: '2px' }} />
        <div style={{ padding: '28px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,111,216,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Preview</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: 'var(--w)', marginBottom: '8px' }}>
            Baddie Prompt <span style={{ background: 'var(--p-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bank™</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '20px' }}>
            The Netflix of AI influencer prompts. Generate a full month of luxury, realistic, baddie content with one click.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
            {['Baddie DNA™ — prompts match YOUR AI twin', 'One click = 4 images + full content package', '30-day content calendar auto-generated', '27+ baddie content categories', 'Private suite — your own creative space', 'All video gen apps in one place'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--w2)' }}>
                <span style={{ color: 'var(--pink)', flexShrink: 0 }}>✦</span>{f}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: 'var(--s1)', border: '0.5px solid var(--pb)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--pink)', marginBottom: '4px' }}>$27<span style={{ fontSize: '14px', color: 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>/mo</span></div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--w)', marginBottom: '8px' }}>Prompt Bank Only</div>
          <button className="p-btn" onClick={() => window.location.href = '/api/stripe/checkout?plan=prompts'} style={{ width: '100%', fontSize: '12px', padding: '9px' }}>Get Access ↗</button>
        </div>
        <div style={{ background: 'var(--s1)', border: '0.5px solid var(--lb)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--lilac)', marginBottom: '4px' }}>$47<span style={{ fontSize: '14px', color: 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>/mo</span></div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--w)', marginBottom: '8px' }}>Both Apps Bundle</div>
          <button className="p-btn" onClick={() => window.location.href = '/api/stripe/checkout?plan=bundle'} style={{ width: '100%', fontSize: '12px', padding: '9px' }}>Get Bundle ↗</button>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--mu3)' }}>
        Already an Envi Lee student? <a href="/sign-in" style={{ color: 'var(--pink)', textDecoration: 'none' }}>Sign in →</a>
      </div>
    </div>
  )

  return <>{children}</>
}

// ── ONE CLICK GENERATION ──────────────────────────────────────
interface GeneratedContent {
  imagePrompt: string
  images: (string | null)[]
  videoPrompt: string
  reelScript: string
  tiktokCaption: string
  youtubeCaption: string
  voiceoverScript: string
  thumbnailPrompt: string
  calendar: string
  hashtags: string
  ctas: string
  trendingAudio: string
}

function OneClickGeneration({ dna, category, onGenerated }: {
  dna?: DNA
  category?: string
  onGenerated?: (content: GeneratedContent) => void
}) {
  const [selectedCat, setSelectedCat] = useState(category || 'Luxury Lifestyle')
  const [selectedApp, setSelectedApp] = useState('kling')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [scriptType, setScriptType] = useState<'voiceover' | 'lipsync'>('voiceover')
  const [calendarType, setCalendarType] = useState<'week' | '30day'>('week')

  async function generate() {
    setLoading(true); setContent(null)
    try {
      const dnaContext = dna ? `Creator DNA: skin tone ${dna.skinTone}, hair ${dna.hairTexture} ${dna.hairColor}, body type ${dna.bodyType}, style ${dna.stylePreference}, vibe ${dna.vibe}. ` : ''

      const result = await callAPI('generate/prompts', {
        tool: 'oneclick',
        category: selectedCat,
        dnaContext,
        scriptType,
        calendarType,
        videoApp: selectedApp,
      })

      const parsed = JSON.parse(result)
      const videoFormat = VIDEO_FORMATS[selectedApp] || '[PROMPT]'
      const videoPrompt = videoFormat.replace('[PROMPT]', parsed.imagePrompt || '')

      const newContent: GeneratedContent = {
        imagePrompt: parsed.imagePrompt || '',
        images: [null, null, null, null],
        videoPrompt,
        reelScript: parsed.reelScript || '',
        tiktokCaption: parsed.tiktokCaption || '',
        youtubeCaption: parsed.youtubeCaption || '',
        voiceoverScript: parsed.voiceoverScript || '',
        thumbnailPrompt: parsed.thumbnailPrompt || '',
        calendar: parsed.calendar || '',
        hashtags: parsed.hashtags || '',
        ctas: parsed.ctas || '',
        trendingAudio: parsed.trendingAudio || '',
      }
      setContent(newContent)
      onGenerated?.(newContent)

      // Generate images
      for (let i = 0; i < 4; i++) {
        try {
          const imgRes = await fetch('/api/generate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: newContent.imagePrompt, style: 'luxury', size: 'portrait' }),
          })
          const imgData = await imgRes.json()
          if (imgData.imageUrl) {
            setContent(prev => prev ? { ...prev, images: prev.images.map((img, idx) => idx === i ? imgData.imageUrl : img) } : null)
          }
        } catch { }
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  function updateVideoPrompt(app: string) {
    setSelectedApp(app)
    if (content) {
      const fmt = VIDEO_FORMATS[app] || '[PROMPT]'
      setContent(prev => prev ? { ...prev, videoPrompt: fmt.replace('[PROMPT]', prev.imagePrompt) } : null)
    }
  }

  return (
    <div>
      {/* Category selector */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Choose Category</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`cat-pill ${selectedCat === cat ? 'on' : 'off'}`} onClick={() => setSelectedCat(cat)}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        <div>
          <div className="flabel">Script type</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['voiceover', 'Voiceover'], ['lipsync', 'Lip Sync']].map(([id, label]) => (
              <button key={id} className={`tab-pill ${scriptType === id ? 'on' : 'off'}`} style={{ fontSize: '10px', padding: '5px 12px' }} onClick={() => setScriptType(id as 'voiceover' | 'lipsync')}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="flabel">Calendar</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['week', '1 Week'], ['30day', '30 Days']].map(([id, label]) => (
              <button key={id} className={`tab-pill ${calendarType === id ? 'on' : 'off'}`} style={{ fontSize: '10px', padding: '5px 12px' }} onClick={() => setCalendarType(id as 'week' | '30day')}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <button className="p-btn" onClick={generate} disabled={loading} style={{ width: '100%', marginBottom: '20px', fontSize: '14px', padding: '13px' }}>
        {loading ? '✦ Generating your content package…' : `✦ One Click Generate — ${selectedCat}`}
      </button>

      {loading && <div className="lbar" style={{ marginBottom: '20px' }}><div className="lbar-fill" /></div>}

      {content && (
        <div>
          {/* 4 Image windows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {content.images.map((img, i) => <ImageWindow key={i} src={img || undefined} loading={loading && !img} index={i} />)}
          </div>

          {/* Image prompt */}
          <div className="output-box" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px' }}>◈ Image Prompt</div>
              <CopyBtn text={content.imagePrompt} />
            </div>
            <div className="output-text">{content.imagePrompt}</div>
          </div>

          {/* Video prompt with app selector */}
          <div className="card hi" style={{ marginBottom: '12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>⊳ Video Prompt — Select Your App</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px', marginBottom: '12px' }}>
              {VIDEO_APPS.map(app => (
                <a key={app.format} className={`video-app-btn ${selectedApp === app.format ? 'selected' : ''}`}
                  onClick={e => { e.preventDefault(); updateVideoPrompt(app.format) }}
                  href={app.url} target="_blank" rel="noreferrer"
                  onContextMenu={e => { e.preventDefault(); window.open(app.url, '_blank') }}>
                  <span style={{ fontSize: '14px' }}>{app.icon}</span>
                  <span style={{ fontSize: '11px', color: selectedApp === app.format ? 'var(--pink)' : 'var(--mu3)', fontWeight: selectedApp === app.format ? 600 : 400 }}>{app.name}</span>
                </a>
              ))}
            </div>
            <div className="output-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--lilac)', fontFamily: "'DM Mono',monospace" }}>Formatted for {VIDEO_APPS.find(a => a.format === selectedApp)?.name}</span>
                <CopyBtn text={content.videoPrompt} />
              </div>
              <div className="output-text">{content.videoPrompt}</div>
            </div>
          </div>

          {/* All outputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {[
              { label: 'Reel Script', key: 'reelScript', icon: '🎬' },
              { label: 'TikTok Caption', key: 'tiktokCaption', icon: '🎵' },
              { label: 'YouTube Caption', key: 'youtubeCaption', icon: '▶️' },
              { label: scriptType === 'voiceover' ? 'Voiceover Script' : 'Lip Sync Script', key: 'voiceoverScript', icon: '🎙️' },
              { label: 'Thumbnail Prompt', key: 'thumbnailPrompt', icon: '🖼️' },
              { label: 'Trending Audio', key: 'trendingAudio', icon: '🎵' },
              { label: 'Hashtags', key: 'hashtags', icon: '#️⃣' },
              { label: 'CTAs', key: 'ctas', icon: '📣' },
            ].map(item => (
              <div key={item.key} className="output-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--lilac)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px' }}>{item.icon} {item.label}</div>
                  <CopyBtn text={content[item.key as keyof GeneratedContent] as string} />
                </div>
                <div className="output-text" style={{ maxHeight: '100px', overflow: 'hidden' }}>{content[item.key as keyof GeneratedContent] as string}</div>
              </div>
            ))}
          </div>

          {/* Content Calendar */}
          <div className="output-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px' }}>📅 {calendarType === 'week' ? '7-Day' : '30-Day'} Content Calendar</div>
              <CopyBtn text={content.calendar} />
            </div>
            <div className="output-text">{content.calendar}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── BADDIE DNA™ ────────────────────────────────────────────────
interface DNA {
  id: string; name: string; skinTone: string; hairColor: string; hairTexture: string
  eyeColor: string; bodyType: string; faceShape: string; stylePreference: string; vibe: string
  niche: string; platform: string; createdAt: string
}

function BaddieDNA({ onDNASelect, selectedDNA }: { onDNASelect: (dna: DNA) => void; selectedDNA?: DNA | null }) {
  const { user } = useUser()
  const [dnas, setDnas] = useState<DNA[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Partial<DNA>>({})

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`dna_${user?.id}`) || '[]')
    setDnas(saved)
  }, [user?.id])

  function save() {
    const newDNA: DNA = {
      id: Date.now().toString(),
      name: form.name || 'My AI Twin',
      skinTone: form.skinTone || '',
      hairColor: form.hairColor || '',
      hairTexture: form.hairTexture || '',
      eyeColor: form.eyeColor || '',
      bodyType: form.bodyType || '',
      faceShape: form.faceShape || '',
      stylePreference: form.stylePreference || '',
      vibe: form.vibe || '',
      niche: form.niche || '',
      platform: form.platform || '',
      createdAt: new Date().toISOString(),
    }
    const updated = [...dnas, newDNA]
    setDnas(updated)
    localStorage.setItem(`dna_${user?.id}`, JSON.stringify(updated))
    onDNASelect(newDNA)
    setCreating(false); setForm({})
  }

  function del(id: string) {
    const updated = dnas.filter(d => d.id !== id)
    setDnas(updated)
    localStorage.setItem(`dna_${user?.id}`, JSON.stringify(updated))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--w)' }}>Baddie DNA™</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginTop: '3px' }}>Your AI twin profile — every prompt auto-matches your character</div>
        </div>
        <button className="p-btn" onClick={() => setCreating(true)} style={{ fontSize: '12px', padding: '9px 16px' }}>+ Add DNA Profile</button>
      </div>

      {creating && (
        <div className="card hi" style={{ marginBottom: '20px' }}>
          <div className="ftitle">Create DNA Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="AI Twin Name"><input className="finp" placeholder="e.g. Luxe Envi, Nova Star" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></F>
            <F label="Niche"><input className="finp" placeholder="e.g. Luxury lifestyle, CEO Baddie" value={form.niche || ''} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} /></F>
            <F label="Skin Tone"><select className="fsel" value={form.skinTone || ''} onChange={e => setForm(f => ({ ...f, skinTone: e.target.value }))}>
              <option value="">Select...</option>
              {['Fair', 'Light brown', 'Medium brown', 'Warm brown', 'Deep brown', 'Rich dark brown', 'Deep ebony'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Hair Color"><select className="fsel" value={form.hairColor || ''} onChange={e => setForm(f => ({ ...f, hairColor: e.target.value }))}>
              <option value="">Select...</option>
              {['Black', 'Dark brown', 'Medium brown', 'Auburn', 'Blonde', 'Platinum blonde', 'Burgundy', 'Silver'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Hair Texture"><select className="fsel" value={form.hairTexture || ''} onChange={e => setForm(f => ({ ...f, hairTexture: e.target.value }))}>
              <option value="">Select...</option>
              {['Natural coils', 'Natural curls', 'Straight', 'Wavy', 'Kinky coils', 'Locs', 'Box braids', 'Knotless braids'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Eye Color"><select className="fsel" value={form.eyeColor || ''} onChange={e => setForm(f => ({ ...f, eyeColor: e.target.value }))}>
              <option value="">Select...</option>
              {['Dark brown', 'Medium brown', 'Honey brown', 'Hazel', 'Grey', 'Deep black'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Body Type"><select className="fsel" value={form.bodyType || ''} onChange={e => setForm(f => ({ ...f, bodyType: e.target.value }))}>
              <option value="">Select...</option>
              {['Curvy hourglass', 'Slim and toned', 'Athletic', 'Petite', 'Thick and curvy', 'Plus size goddess', 'Tall and lean'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Face Shape"><select className="fsel" value={form.faceShape || ''} onChange={e => setForm(f => ({ ...f, faceShape: e.target.value }))}>
              <option value="">Select...</option>
              {['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Oblong'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Style Preference"><input className="finp" placeholder="e.g. Luxury streetwear, designer pieces" value={form.stylePreference || ''} onChange={e => setForm(f => ({ ...f, stylePreference: e.target.value }))} /></F>
            <F label="Vibe / Energy"><input className="finp" placeholder="e.g. Bold, magnetic, mysterious" value={form.vibe || ''} onChange={e => setForm(f => ({ ...f, vibe: e.target.value }))} /></F>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="p-btn" onClick={save} style={{ flex: 1, fontSize: '12px' }}>Save DNA Profile ✦</button>
            <button className="ghost-p" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {dnas.length === 0 && !creating ? (
        <div className="card accent" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>◉</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--pink)', marginBottom: '6px' }}>No DNA profiles yet</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '16px' }}>Create your Baddie DNA™ so every prompt auto-matches your AI twin</div>
          <button className="p-btn" onClick={() => setCreating(true)} style={{ fontSize: '12px', padding: '9px 16px' }}>Create DNA Profile ↗</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {dnas.map(dna => (
            <div key={dna.id} className="card hi" style={{ cursor: 'pointer', border: `0.5px solid ${selectedDNA?.id === dna.id ? 'var(--pb)' : 'rgba(192,132,252,0.15)'}`, background: selectedDNA?.id === dna.id ? 'var(--pg)' : 'var(--s1)' }}
              onClick={() => onDNASelect(dna)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--pink)' }}>{dna.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{dna.niche}</div>
                </div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {selectedDNA?.id === dna.id && <span className="badge-pink">Active</span>}
                  <button className="del-btn" onClick={e => { e.stopPropagation(); del(dna.id) }} style={{ fontSize: '10px', padding: '3px 8px' }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
                {[dna.skinTone, dna.hairTexture, dna.bodyType, dna.vibe].filter(Boolean).map(tag => (
                  <span key={tag} className="dna-tag" style={{ background: 'var(--pg)', color: 'var(--pink)', border: '0.5px solid var(--pb)', fontSize: '9px' }}>{tag}</span>
                ))}
              </div>
              {selectedDNA?.id === dna.id && (
                <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>✦ Active — prompts match this twin</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AI TWIN VERSIONS ──────────────────────────────────────────
function AITwinVersions({ selectedDNA }: { selectedDNA?: DNA | null }) {
  const { user } = useUser()
  const [versions, setVersions] = useState<Array<{ id: string; type: string; description: string; active: boolean }>>([])
  const [vType, setVType] = useState('Luxury Version')
  const [vDesc, setVDesc] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`versions_${user?.id}`) || '[]')
    setVersions(saved)
  }, [user?.id])

  function save() {
    const updated = versions.map(v => ({ ...v, active: false }))
    const newV = { id: Date.now().toString(), type: vType, description: vDesc, active: true }
    const final = [...updated, newV]
    setVersions(final)
    localStorage.setItem(`versions_${user?.id}`, JSON.stringify(final))
    setAdding(false); setVDesc('')
  }

  function activate(id: string) {
    const updated = versions.map(v => ({ ...v, active: v.id === id }))
    setVersions(updated)
    localStorage.setItem(`versions_${user?.id}`, JSON.stringify(updated))
  }

  const versionTypes = ['Luxury Version', 'Travel Version', 'Business Version', 'Gym Version', 'Night Out Version', 'Soft Life Version', 'Boss Era Version', 'Street Style Version']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--w)' }}>AI Twin Versions</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginTop: '3px' }}>Build multiple versions of {selectedDNA?.name || 'your AI twin'} — one click to switch</div>
        </div>
        <button className="p-btn" onClick={() => setAdding(true)} style={{ fontSize: '12px', padding: '9px 16px' }}>+ Add Version</button>
      </div>

      {adding && (
        <div className="card hi" style={{ marginBottom: '16px' }}>
          <div className="ftitle">Add Twin Version</div>
          <F label="Version type">
            <select className="fsel" value={vType} onChange={e => setVType(e.target.value)}>
              {versionTypes.map(v => <option key={v}>{v}</option>)}
            </select>
          </F>
          <F label="Description"><textarea className="fta" placeholder="Describe this version — wardrobe, vibe, locations, energy..." value={vDesc} onChange={e => setVDesc(e.target.value)} /></F>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="p-btn" onClick={save} style={{ flex: 1, fontSize: '12px' }}>Save Version</button>
            <button className="ghost-p" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {versions.map(v => (
          <div key={v.id} className={`card ${v.active ? 'accent' : ''}`} style={{ cursor: 'pointer' }} onClick={() => activate(v.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: v.active ? 'var(--pink)' : 'var(--w)' }}>{v.type}</div>
              {v.active && <span className="badge-pink">Active</span>}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{v.description.slice(0, 80)}{v.description.length > 80 ? '…' : ''}</div>
            {!v.active && <div style={{ fontSize: '10px', color: 'var(--lilac)', marginTop: '8px', fontFamily: "'DM Mono',monospace" }}>Click to activate →</div>}
          </div>
        ))}
        {versions.length === 0 && !adding && (
          <div className="card" style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
            <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>◈</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>No versions yet</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AI PROMPT GENERATOR TAB ───────────────────────────────────
function AIPromptGenerator({ dna }: { dna?: DNA | null }) {
  const [age, setAge] = useState('')
  const [hairTone, setHairTone] = useState('')
  const [skinTone, setSkinTone] = useState(dna?.skinTone || '')
  const [location, setLocation] = useState('')
  const [outfitType, setOutfitType] = useState('')
  const [contentType, setContentType] = useState('Luxury Lifestyle')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true); setOutput('')
    try {
      setOutput(await callAPI('generate/prompts', {
        tool: 'aigenerator',
        age, hairTone: hairTone || dna?.hairColor || '', skinTone: skinTone || dna?.skinTone || '',
        location, outfitType, contentType,
        dnaContext: dna ? `Hair: ${dna.hairTexture} ${dna.hairColor}, Body: ${dna.bodyType}, Style: ${dna.stylePreference}` : '',
      }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>AI Prompt Generator</div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Enter your details and AI generates image prompt, video prompt, thumbnail, caption, hashtags, hooks and CTAs.</div>
      {dna && (
        <div style={{ background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '11px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>
          ✦ Baddie DNA™ active — {dna.name} · {dna.skinTone} · {dna.bodyType}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <F label="Age"><input className="finp" placeholder="e.g. 28" value={age} onChange={e => setAge(e.target.value)} /></F>
        <F label="Skin tone"><input className="finp" placeholder={dna?.skinTone || 'e.g. Deep brown'} value={skinTone} onChange={e => setSkinTone(e.target.value)} /></F>
        <F label="Hair tone / style"><input className="finp" placeholder={dna ? `${dna.hairTexture} ${dna.hairColor}` : 'e.g. Natural locs, black'} value={hairTone} onChange={e => setHairTone(e.target.value)} /></F>
        <F label="Location"><input className="finp" placeholder="e.g. NYC rooftop, luxury hotel" value={location} onChange={e => setLocation(e.target.value)} /></F>
        <F label="Outfit type"><input className="finp" placeholder="e.g. Luxury crop set, designer blazer" value={outfitType} onChange={e => setOutfitType(e.target.value)} /></F>
        <F label="Content type">
          <select className="fsel" value={contentType} onChange={e => setContentType(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </F>
      </div>
      <button className="p-btn" onClick={generate} disabled={loading} style={{ width: '100%', marginBottom: '14px' }}>
        {loading ? 'Generating…' : '✦ Generate Full Content Package'}
      </button>
      {loading && <div className="lbar" style={{ marginBottom: '10px' }}><div className="lbar-fill" /></div>}
      {output && (
        <div className="output-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace', textTransform: 'uppercase', letterSpacing: '.7px" }}>Generated Package</span>
            <CopyBtn text={output} label="Copy All" />
          </div>
          <div className="output-text">{output}</div>
        </div>
      )}
    </div>
  )
}

// ── PROMPT STACKS (ADMIN ONLY) ────────────────────────────────
function PromptStacks() {
  const [idea, setIdea] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStack, setSelectedStack] = useState('All Stacks')

  const stackTypes = [
    'All Stacks', 'Midjourney Prompts', 'Kling Prompts', 'Veo Prompts',
    'TikTok Captions', 'YouTube Short Descriptions', 'Instagram Captions', 'Thumbnail Prompts',
  ]

  async function generate() {
    if (!idea.trim()) return
    setLoading(true); setOutput('')
    try {
      setOutput(await callAPI('generate/prompts', {
        tool: 'stacks',
        idea,
        stackType: selectedStack,
      }))
    } catch (e) { setOutput(`Error: ${(e as Error).message}`) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Prompt Stacks</div>
      <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Generate exclusive prompt stacks from one idea — ready to sell or use for your content.</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
        {stackTypes.map(s => (
          <button key={s} className={`tab-pill ${selectedStack === s ? 'on' : 'off'}`} style={{ fontSize: '10px', padding: '5px 12px' }} onClick={() => setSelectedStack(s)}>{s}</button>
        ))}
      </div>
      <F label="Your idea"><textarea className="fta" placeholder="Enter any concept, scene, or content idea and AI generates the full prompt stack..." value={idea} onChange={e => setIdea(e.target.value)} /></F>
      <button className="p-btn" onClick={generate} disabled={loading} style={{ width: '100%', marginBottom: '14px' }}>
        {loading ? 'Generating stacks…' : `✦ Generate ${selectedStack}`}
      </button>
      {loading && <div className="lbar" style={{ marginBottom: '10px' }}><div className="lbar-fill" /></div>}
      {output && (
        <div className="output-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>Your Prompt Stack</span>
            <CopyBtn text={output} label="Copy All" />
          </div>
          <div className="output-text">{output}</div>
        </div>
      )}
    </div>
  )
}

// ── STUDENT SUITE CUSTOMIZATION ───────────────────────────────
interface SuiteTheme {
  primaryColor: string
  accentColor: string
  bgColor: string
  fontFamily: string
  suiteName: string
}

const DEFAULT_THEME: SuiteTheme = {
  primaryColor: '#ff6fd8',
  accentColor: '#c084fc',
  bgColor: '#06020a',
  fontFamily: "'DM Sans', sans-serif",
  suiteName: 'My Baddie Suite',
}

function SuiteCustomizer({ theme, onUpdate }: { theme: SuiteTheme; onUpdate: (t: SuiteTheme) => void }) {
  const fonts = ["'DM Sans', sans-serif", "'Syne', sans-serif", "'Cormorant Garamond', serif", "'DM Mono', monospace", "'Georgia', serif", "Arial, sans-serif", "'Futura', sans-serif"]

  return (
    <div className="card hi" style={{ marginBottom: '20px' }}>
      <div className="ftitle">✦ Customize Your Suite</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <div>
          <label className="flabel">Suite Name</label>
          <input className="finp" value={theme.suiteName} onChange={e => onUpdate({ ...theme, suiteName: e.target.value })} />
        </div>
        <div>
          <label className="flabel">Primary Color</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="color" value={theme.primaryColor} onChange={e => onUpdate({ ...theme, primaryColor: e.target.value })} style={{ width: '36px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
            <input className="finp" value={theme.primaryColor} onChange={e => onUpdate({ ...theme, primaryColor: e.target.value })} style={{ flex: 1 }} placeholder="#ff6fd8" />
          </div>
        </div>
        <div>
          <label className="flabel">Accent Color</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="color" value={theme.accentColor} onChange={e => onUpdate({ ...theme, accentColor: e.target.value })} style={{ width: '36px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
            <input className="finp" value={theme.accentColor} onChange={e => onUpdate({ ...theme, accentColor: e.target.value })} style={{ flex: 1 }} placeholder="#c084fc" />
          </div>
        </div>
        <div>
          <label className="flabel">Background Color</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="color" value={theme.bgColor} onChange={e => onUpdate({ ...theme, bgColor: e.target.value })} style={{ width: '36px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
            <input className="finp" value={theme.bgColor} onChange={e => onUpdate({ ...theme, bgColor: e.target.value })} style={{ flex: 1 }} placeholder="#06020a" />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <label className="flabel">Font</label>
        <select className="fsel" value={theme.fontFamily} onChange={e => onUpdate({ ...theme, fontFamily: e.target.value })}>
          {fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0].replace(/'/g, '')}</option>)}
        </select>
      </div>
    </div>
  )
}

// ── ADMIN ROOM ────────────────────────────────────────────────
function AdminRoom({ isAdmin }: { isAdmin: boolean }) {
  const [adminTab, setAdminTab] = useState<ActiveTab>('generate')
  const [myDNA, setMyDNA] = useState<DNA | null>(null)
  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState('Luxury Lifestyle')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [reversePrompt, setReversePrompt] = useState('')
  const [reversing, setReversing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<{ prompt: string; images: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reverseEngineer() {
    if (!uploadedImage) return
    setReversing(true)
    try {
      const res = await callAPI('generate/prompts', { tool: 'reverse', imageData: uploadedImage })
      setReversePrompt(res)
    } catch { }
    finally { setReversing(false) }
  }

  function publishToLibrary() {
    if (!prompt.trim()) return
    const library = JSON.parse(localStorage.getItem('promptLibrary') || '[]')
    library.unshift({ id: Date.now(), prompt, category, publishedAt: new Date().toISOString(), shared: true })
    localStorage.setItem('promptLibrary', JSON.stringify(library))
    setPublishing(false)
    alert('Prompt published to main library!')
  }

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔒</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pink)' }}>Admin Access Only</div>
    </div>
  )

  const tabs = [
    ['generate', '◈ One Click Generate'],
    ['stacks', '✦ Prompt Stacks'],
    ['reverse', '⊹ Reverse Engineer'],
    ['dna', '◉ Baddie DNA™'],
  ] as const

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {tabs.map(([id, label]) => (
          <button key={id} className={`tab-pill ${adminTab === id ? 'on' : 'off'}`} onClick={() => setAdminTab(id as ActiveTab)}>{label}</button>
        ))}
      </div>

      {adminTab === 'generate' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <F label="Add a prompt to publish">
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea className="fta" placeholder="Enter your prompt here, or use One Click Generate below..." value={prompt} onChange={e => setPrompt(e.target.value)} style={{ minHeight: '60px' }} />
              </div>
            </F>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select className="fsel" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: '200px' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button className="p-btn" onClick={publishToLibrary} disabled={!prompt.trim()} style={{ fontSize: '12px', padding: '9px 16px' }}>Publish to Library ↗</button>
            </div>
          </div>
          <OneClickGeneration dna={myDNA || undefined} />
        </div>
      )}

      {adminTab === 'stacks' && <PromptStacks />}

      {adminTab === 'reverse' && (
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--w)', marginBottom: '4px' }}>Reverse Engineer</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '20px' }}>Upload any AI image you created and the AI figures out the prompt that made it.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div className="card hi">
                <div className="ftitle">Upload Image</div>
                <div style={{ border: '1.5px dashed rgba(255,111,216,0.2)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--pg)', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                  onClick={() => !uploadedImage && fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target?.result as string); r.readAsDataURL(f) }
                  }} />
                  {uploadedImage ? <img src={uploadedImage} alt="uploaded" style={{ maxHeight: '200px', borderRadius: '8px' }} /> : (
                    <div style={{ opacity: 0.5 }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div><div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Upload your AI image</div></div>
                  )}
                </div>
                {uploadedImage && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="p-btn" onClick={reverseEngineer} disabled={reversing} style={{ flex: 1, fontSize: '12px' }}>{reversing ? 'Reverse engineering…' : '◈ Reverse Engineer Prompt'}</button>
                    <button className="ghost-p" onClick={() => { setUploadedImage(null); setReversePrompt('') }}>Clear</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              {reversePrompt ? (
                <div className="card hi">
                  <div className="ftitle">Reverse Engineered Prompt</div>
                  <div className="output-box">
                    <div className="output-text">{reversePrompt}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <CopyBtn text={reversePrompt} label="Copy Prompt" />
                    <button className="p-btn" onClick={() => { setPrompt(reversePrompt); setAdminTab('generate') }} style={{ fontSize: '11px', padding: '7px 14px' }}>Publish to Library ↗</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>◈</div>
                  <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Reverse engineered prompt appears here</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'dna' && <BaddieDNA onDNASelect={setMyDNA} selectedDNA={myDNA} />}
    </div>
  )
}

// ── MAIN LIBRARY ROOM ─────────────────────────────────────────
function MainLibraryRoom() {
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedDNA] = useState<DNA | null>(null)
  const [prompts, setPrompts] = useState<Array<{ id: number; prompt: string; category: string; publishedAt: string }>>([])
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('promptLibrary') || '[]')
    if (saved.length === 0) {
      const sample = CATEGORIES.slice(0, 10).map((cat, i) => ({
        id: i + 1,
        prompt: `${cat} content — luxurious ${cat.toLowerCase()} scene with Black woman creator, designer outfit, cinematic lighting, photorealistic, 4K, fashion editorial`,
        category: cat,
        publishedAt: new Date().toISOString(),
      }))
      setPrompts(sample)
    } else {
      setPrompts(saved)
    }
  }, [])

  const filtered = selectedCat === 'All' ? prompts : prompts.filter(p => p.category === selectedCat)

  return (
    <div>
      {/* Category pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '20px' }}>
        <button className={`cat-pill ${selectedCat === 'All' ? 'on' : 'off'}`} onClick={() => setSelectedCat('All')}>All</button>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`cat-pill ${selectedCat === cat ? 'on' : 'off'}`} onClick={() => setSelectedCat(cat)}>{cat}</button>
        ))}
      </div>

      {/* One Click Generate button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>{filtered.length} prompts</div>
        <button className="p-btn" onClick={() => setShowGenerate(!showGenerate)} style={{ fontSize: '12px', padding: '9px 16px' }}>
          {showGenerate ? 'Hide Generator' : '✦ One Click Generate'}
        </button>
      </div>

      {showGenerate && (
        <div className="card hi" style={{ marginBottom: '24px' }}>
          <OneClickGeneration dna={selectedDNA || undefined} category={selectedCat !== 'All' ? selectedCat : undefined} />
        </div>
      )}

      {/* Video apps panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px' }}>
        <div>
          {/* Prompt list */}
          {filtered.map(p => (
            <div key={p.id} className="prompt-card" style={{ marginBottom: '10px' }} onClick={() => setActivePrompt(p.prompt)}>
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge-pink">{p.category}</span>
                  <span style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(p.publishedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--w2)', lineHeight: '1.6', marginBottom: '8px' }}>{p.prompt.slice(0, 120)}…</div>
                {activePrompt === p.prompt && (
                  <div className="output-box" style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>Full Prompt</span>
                      <CopyBtn text={p.prompt} />
                    </div>
                    <div className="output-text">{p.prompt}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Video apps side panel */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="card">
            <div className="ftitle">Video Apps</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {VIDEO_APPS.map(app => (
                <a key={app.format} href={app.url} target="_blank" rel="noreferrer" className="video-app-btn">
                  <span style={{ fontSize: '16px' }}>{app.icon}</span>
                  <span style={{ fontSize: '11px', color: 'var(--w2)' }}>{app.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── STUDENT PRIVATE SUITE ─────────────────────────────────────
function StudentSuite() {
  const { user } = useUser()
  const [theme, setTheme] = useState<SuiteTheme>(DEFAULT_THEME)
  const [selectedDNA, setSelectedDNA] = useState<DNA | null>(null)
  const [suiteTab, setSuiteTab] = useState<'generate' | 'dna' | 'twins' | 'prompts' | 'aigenerator'>('generate')
  const [myPrompts, setMyPrompts] = useState<Array<{ id: number; prompt: string; category: string; shared: boolean }>>([])
  const [newPrompt, setNewPrompt] = useState('')
  const [newCat, setNewCat] = useState('Luxury Lifestyle')
  const [sharePublic, setSharePublic] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem(`suiteTheme_${user?.id}`)
    if (savedTheme) setTheme(JSON.parse(savedTheme))
    const savedPrompts = JSON.parse(localStorage.getItem(`myPrompts_${user?.id}`) || '[]')
    setMyPrompts(savedPrompts)
  }, [user?.id])

  function saveTheme(t: SuiteTheme) {
    setTheme(t)
    localStorage.setItem(`suiteTheme_${user?.id}`, JSON.stringify(t))
  }

  function savePrompt() {
    if (!newPrompt.trim()) return
    const updated = [...myPrompts, { id: Date.now(), prompt: newPrompt, category: newCat, shared: sharePublic }]
    setMyPrompts(updated)
    localStorage.setItem(`myPrompts_${user?.id}`, JSON.stringify(updated))
    if (sharePublic) {
      const library = JSON.parse(localStorage.getItem('promptLibrary') || '[]')
      library.unshift({ id: Date.now(), prompt: newPrompt, category: newCat, publishedAt: new Date().toISOString() })
      localStorage.setItem('promptLibrary', JSON.stringify(library))
    }
    setNewPrompt(''); setSharePublic(false)
  }

  const suiteTabs = [
    ['generate', '◈ One Click Generate'],
    ['dna', '◉ Baddie DNA™'],
    ['twins', '✦ My AI Twins'],
    ['prompts', '⊹ My Prompts'],
    ['aigenerator', '◷ AI Generator'],
  ] as const

  return (
    <div style={{ background: theme.bgColor, minHeight: '100vh', padding: '24px', fontFamily: theme.fontFamily }}>
      {/* Suite header with custom colors */}
      <div style={{ marginBottom: '24px', padding: '20px 24px', background: `${theme.primaryColor}15`, border: `0.5px solid ${theme.primaryColor}40`, borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: `${theme.primaryColor}80`, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>My Private Suite</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: '#fff' }}>
              <span style={{ color: theme.primaryColor }}>{theme.suiteName}</span>
            </div>
          </div>
          {selectedDNA && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: theme.primaryColor, fontFamily: "'DM Mono',monospace" }}>◉ Baddie DNA™ Active</div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{selectedDNA.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Suite customizer */}
      <div style={{ marginBottom: '20px' }}>
        <SuiteCustomizer theme={theme} onUpdate={saveTheme} />
      </div>

      {/* Suite tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {suiteTabs.map(([id, label]) => (
          <button key={id} onClick={() => setSuiteTab(id as 'generate' | 'dna' | 'twins' | 'prompts' | 'aigenerator')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: theme.fontFamily, transition: 'all .2s', whiteSpace: 'nowrap', border: `0.5px solid ${suiteTab === id ? theme.primaryColor : `${theme.primaryColor}20`}`, background: suiteTab === id ? `${theme.primaryColor}20` : 'transparent', color: suiteTab === id ? theme.primaryColor : `${theme.primaryColor}60` }}>
            {label}
          </button>
        ))}
      </div>

      {suiteTab === 'generate' && (
        <div>
          {selectedDNA && (
            <div style={{ background: `${theme.primaryColor}15`, border: `0.5px solid ${theme.primaryColor}40`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '11px', color: theme.primaryColor, fontFamily: "'DM Mono',monospace" }}>
              ✦ Baddie DNA™ active — all prompts match {selectedDNA.name}
            </div>
          )}
          <OneClickGeneration dna={selectedDNA || undefined} />
        </div>
      )}

      {suiteTab === 'dna' && <BaddieDNA onDNASelect={setSelectedDNA} selectedDNA={selectedDNA} />}

      {suiteTab === 'twins' && <AITwinVersions selectedDNA={selectedDNA} />}

      {suiteTab === 'aigenerator' && <AIPromptGenerator dna={selectedDNA} />}

      {suiteTab === 'prompts' && (
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>My Prompt Collection</div>
          <div className="card hi" style={{ marginBottom: '20px' }}>
            <F label="Add a prompt">
              <textarea className="fta" placeholder="Write or paste a prompt you want to save..." value={newPrompt} onChange={e => setNewPrompt(e.target.value)} />
            </F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center' }}>
              <select className="fsel" value={newCat} onChange={e => setNewCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                <input type="checkbox" checked={sharePublic} onChange={e => setSharePublic(e.target.checked)} />
                Share to main library
              </label>
              <button className="p-btn" onClick={savePrompt} style={{ fontSize: '12px', padding: '9px 16px' }}>Save ↗</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {myPrompts.map(p => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: `${theme.primaryColor}20`, color: theme.primaryColor, borderRadius: '20px', fontFamily: "'DM Mono',monospace" }}>{p.category}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {p.shared && <span style={{ fontSize: '9px', color: '#00ff88', fontFamily: "'DM Mono',monospace" }}>Shared ✓</span>}
                    <CopyBtn text={p.prompt} />
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{p.prompt}</div>
              </div>
            ))}
            {myPrompts.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No prompts saved yet</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── PROMPT BOT ────────────────────────────────────────────────
function PromptBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "I'm your Baddie Prompt Bank AI! I can generate image prompts, video prompts, captions, hashtags, hooks, CTAs, and thumbnail ideas for any content type. What do you need?" }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await callAPI('generate/cineflow', { tool: 'bot', message: `You are the Baddie Prompt Bank AI assistant for Envi Lee Creator Studios. Help with: AI image prompts for Black women creators, video generation prompts for Kling/Veo/Runway/Higgsfield, TikTok captions, Instagram captions, YouTube descriptions, thumbnail prompts, hashtags, hooks, CTAs, and content ideas for luxury lifestyle, fashion, CEO baddie, and other content niches. Be specific and give prompts they can immediately use. Question: ${msg}` })
      setMessages(m => [...m, { role: 'bot', text: res }])
    } catch { setMessages(m => [...m, { role: 'bot', text: 'Connection error. Try again.' }]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '24px', width: '360px', background: '#06020a', border: '0.5px solid rgba(255,111,216,0.3)', borderRadius: '16px', boxShadow: '0 0 40px rgba(192,132,252,0.1)', zIndex: 200, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'rgba(255,111,216,0.08)', borderBottom: '0.5px solid rgba(255,111,216,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: '#ff6fd8', letterSpacing: '.8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
          <span className="p-dot" />Prompt AI Bot
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu3)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ height: '300px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: '90%', padding: '9px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'rgba(255,111,216,0.1)' : '#110520', border: `0.5px solid ${m.role === 'user' ? 'rgba(255,111,216,0.3)' : 'rgba(192,132,252,0.15)'}`, fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>{m.text}</div>
        ))}
        {loading && <div style={{ fontSize: '12px', color: '#ff6fd8', alignSelf: 'flex-start' as const, padding: '8px 12px', background: '#110520', borderRadius: '12px' }}>thinking…</div>}
      </div>
      <div style={{ padding: '12px', borderTop: '0.5px solid rgba(192,132,252,0.1)', display: 'flex', gap: '8px' }}>
        <input style={{ flex: 1, background: '#0d0415', border: '0.5px solid rgba(192,132,252,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--w)', fontFamily: "'DM Sans',sans-serif", outline: 'none' }} placeholder="Ask for any prompt…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#ff6fd8,#c084fc)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function PromptBankPage() {
  const { user } = useUser()
  const router = useRouter()
  const [room, setRoom] = useState<Room>('library')
  const [botOpen, setBotOpen] = useState(false)
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === adminId

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <PaywallGate>
          <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '220px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(192,132,252,0.12)', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(192,132,252,0.1)' }}>
                <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
                </button>
                <div style={{ padding: '12px', background: 'rgba(255,111,216,0.08)', border: '0.5px solid rgba(255,111,216,0.25)', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'var(--p-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800 }}>Baddie Prompt</div>
                  <div style={{ background: 'var(--p-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 800 }}>Bank™</div>
                  <div style={{ fontSize: '9px', color: 'rgba(192,132,252,0.5)', fontFamily: "'DM Mono',monospace", marginTop: '2px' }}>ENVI LEE</div>
                </div>
              </div>

              {user && (
                <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(192,132,252,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,111,216,0.08)', borderRadius: '8px', border: '0.5px solid rgba(255,111,216,0.25)' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Baddie'}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,111,216,0.5)', fontFamily: "'DM Mono',monospace" }}>{isAdmin ? 'Admin' : 'Member'}</div>
                    </div>
                    <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 10px', flex: 1 }}>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 10px', fontFamily: "'DM Mono',monospace" }}>Rooms</div>

                {[
                  { id: 'library', label: '✦ Prompt Library', desc: 'Main room' },
                  { id: 'suite', label: '◈ My Private Suite', desc: 'Your space' },
                  ...(isAdmin ? [{ id: 'admin', label: '⊗ Admin Room', desc: 'Envi Lee only' }] : []),
                ].map(r => (
                  <button key={r.id} onClick={() => setRoom(r.id as Room)}
                    style={{ display: 'flex', flexDirection: 'column' as const, padding: '9px 10px', borderRadius: '9px', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', marginBottom: '4px', border: `0.5px solid ${room === r.id ? 'rgba(255,111,216,0.3)' : 'transparent'}`, background: room === r.id ? 'rgba(255,111,216,0.08)' : 'none' }}>
                    <span style={{ fontSize: '12px', color: room === r.id ? 'var(--pink)' : 'var(--mu3)', fontWeight: room === r.id ? 600 : 400 }}>{r.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--mu2)', marginTop: '2px', fontFamily: "'DM Mono',monospace" }}>{r.desc}</span>
                  </button>
                ))}

                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--mu2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '4px 6px 8px', fontFamily: "'DM Mono',monospace" }}>Video Apps</div>
                  {VIDEO_APPS.slice(0, 6).map(app => (
                    <a key={app.format} href={app.url} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', textDecoration: 'none', transition: 'background .15s', marginBottom: '2px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,111,216,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <span style={{ fontSize: '14px' }}>{app.icon}</span>
                      <span style={{ fontSize: '11px', color: 'var(--mu3)' }}>{app.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            {/* MAIN */}
            <main style={{ flex: 1, overflowY: 'auto', background: 'radial-gradient(ellipse at 80% 0%, rgba(192,132,252,0.05) 0%, transparent 50%)' }}>
              {room !== 'suite' && (
                <div style={{ padding: '24px 28px' }}>
                  {/* Room header */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(255,111,216,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {room === 'library' ? 'Main Prompt Library' : 'Admin Room'}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)' }}>
                      {room === 'library' ? <>Baddie <span style={{ color: 'var(--pink)' }}>Prompt Bank™</span></> : <>Admin <span style={{ color: 'var(--pink)' }}>Room</span></>}
                    </div>
                  </div>

                  {room === 'library' && <MainLibraryRoom />}
                  {room === 'admin' && <AdminRoom isAdmin={isAdmin} />}
                </div>
              )}

              {room === 'suite' && <StudentSuite />}
            </main>

            {/* Bot */}
            <button onClick={() => setBotOpen(!botOpen)}
              style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6fd8,#c084fc,#a855f7)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', boxShadow: '0 0 20px rgba(192,132,252,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {botOpen ? '✕' : '◈'}
            </button>
            {botOpen && <PromptBot onClose={() => setBotOpen(false)} />}
          </div>
        </PaywallGate>
      </SignedIn>
    </>
  )
}
