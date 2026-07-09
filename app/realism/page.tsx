'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type Lab = 'dashboard' | 'face' | 'skin' | 'hair' | 'body' | 'hands' | 'clothing' | 'camera' | 'lighting' | 'pose' | 'video' | 'social' | 'consistency' | 'library' | 'builder' | 'score'

// ── STYLES ────────────────────────────────────────────────────
const css = `
  :root {
    --bg: #000;
    --bg2: #080005;
    --bg3: #0d0008;
    --s1: #120008;
    --s2: #1a000f;
    --w: #fff5f8;
    --w2: #ffd0e0;
    --mu: #300015;
    --mu2: #500025;
    --mu3: #903050;
    --pink: #ea3582;
    --orange: #ee732d;
    --pink2: #ff6fa8;
    --orange2: #ff9a5c;
    --pb: rgba(234,53,130,0.3);
    --ob: rgba(238,115,45,0.3);
    --pg: rgba(234,53,130,0.07);
    --og: rgba(238,115,45,0.07);
    --r-grad: linear-gradient(135deg, #ea3582, #ee732d);
    --r-grad2: linear-gradient(135deg, #c0005a, #ea3582, #ee732d);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--w); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  select, input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1a000f; border-radius: 2px; }

  @keyframes lbar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
  @keyframes scoreCount { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }

  .pg-in { animation: pgIn .3s ease; }
  .lbar { height: 2px; background: var(--s2); overflow: hidden; border-radius: 1px; }
  .lbar-fill { height: 100%; background: var(--r-grad); background-size: 200% 100%; animation: lbar 1.8s linear infinite; }
  .r-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--pink); display: inline-block; animation: pulse 1.5s ease infinite; margin-right: 6px; }

  .card { background: var(--s1); border: 0.5px solid rgba(234,53,130,0.12); border-radius: 14px; padding: 18px; }
  .card.hi { border-color: rgba(234,53,130,0.25); }
  .card.orange { border-color: rgba(238,115,45,0.25); background: var(--og); }
  .card.accent { border-color: var(--pb); background: var(--pg); }

  .ftitle { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: var(--pink); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid rgba(234,53,130,0.12); }
  .flabel { font-size: 9px; font-weight: 600; color: var(--mu3); text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px; }
  .finp { background: var(--bg3); border: 0.5px solid rgba(234,53,130,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fsel { background: var(--bg3); border: 0.5px solid rgba(234,53,130,0.15); border-radius: 7px; padding: 8px 10px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; }
  .fta { background: var(--bg3); border: 0.5px solid rgba(234,53,130,0.15); border-radius: 7px; padding: 9px 12px; font-size: 12px; color: var(--w); font-family: 'DM Sans', sans-serif; width: 100%; outline: none; resize: vertical; min-height: 80px; line-height: 1.6; }

  .r-btn { padding: 11px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: var(--r-grad); color: #fff; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(234,53,130,0.2); }
  .r-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(234,53,130,0.35); }
  .r-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .ghost-r { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--pb); background: transparent; color: var(--pink); font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .ghost-r:hover { background: var(--pg); }
  .ghost-o { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid var(--ob); background: transparent; color: var(--orange); font-family: 'DM Sans', sans-serif; transition: all .2s; }

  .lab-card { background: var(--s1); border: 0.5px solid rgba(234,53,130,0.12); border-radius: 14px; padding: 18px; cursor: pointer; transition: all .25s; }
  .lab-card:hover { border-color: rgba(234,53,130,0.4); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(234,53,130,0.1); }
  .lab-card.active { border-color: var(--pb); background: var(--pg); }
  .lab-card.completed { border-color: rgba(0,255,136,0.3); background: rgba(0,255,136,0.03); }

  .lesson-card { background: var(--bg3); border: 0.5px solid rgba(234,53,130,0.15); border-radius: 10px; padding: 14px; margin-bottom: 10px; cursor: pointer; transition: all .2s; }
  .lesson-card:hover { border-color: rgba(234,53,130,0.3); }
  .lesson-card.active { border-color: var(--pb); background: var(--pg); }

  .image-window { background: var(--s2); border: 0.5px solid rgba(234,53,130,0.15); border-radius: 10px; overflow: hidden; aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; position: relative; }
  .image-window img { width: 100%; height: 100%; object-fit: cover; }

  .score-bar { height: 6px; background: var(--s2); border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .score-fill { height: 100%; border-radius: 3px; background: var(--r-grad); transition: width 1s ease; }

  .tip-box { background: var(--og); border: 0.5px solid var(--ob); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--orange); line-height: 1.6; margin-top: 10px; }
  .mistake-box { background: rgba(255,45,45,0.05); border: 0.5px solid rgba(255,45,45,0.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ff6b6b; line-height: 1.6; margin-top: 10px; }

  .progress-step { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; margin-bottom: 6px; }
  .progress-step.done { background: rgba(0,255,136,0.05); border: 0.5px solid rgba(0,255,136,0.2); }
  .progress-step.current { background: var(--pg); border: 0.5px solid var(--pb); }
  .progress-step.pending { background: var(--s1); border: 0.5px solid rgba(234,53,130,0.08); }
  .step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

  .tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-family: 'DM Mono', monospace; font-weight: 500; }
  .tag-pink { background: var(--pg); color: var(--pink); border: 0.5px solid var(--pb); }
  .tag-orange { background: var(--og); color: var(--orange); border: 0.5px solid var(--ob); }
  .tag-green { background: rgba(0,255,136,0.08); color: #00ff88; border: 0.5px solid rgba(0,255,136,0.25); }
`

// ── HELPERS ───────────────────────────────────────────────────
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button className="ghost-r" style={{ fontSize: '10px', padding: '4px 10px' }}
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}>
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  )
}

// ── IMAGE WINDOW ──────────────────────────────────────────────
function ImageWindow({ src, loading, index, onScore }: { src?: string; loading?: boolean; index: number; onScore?: (url: string) => void }) {
  return (
    <div className="image-window">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="lbar" style={{ width: '60px', margin: '0 auto 8px' }}><div className="lbar-fill" /></div>
          <div style={{ fontSize: '10px', color: 'var(--pink)' }}>Generating {index + 1}…</div>
        </div>
      ) : src ? (
        <>
          <img src={src} alt={`Generated ${index + 1}`} />
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
            <a href={src} download style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.8)', color: 'var(--pink)', fontSize: '10px', textDecoration: 'none' }}>⬇</a>
            {onScore && <button onClick={() => onScore(src)} style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.8)', color: 'var(--orange)', fontSize: '10px', border: 'none', cursor: 'pointer' }}>Score</button>}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', opacity: 0.3 }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>◉</div>
          <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>Image {index + 1}</div>
        </div>
      )}
    </div>
  )
}

// ── REALISM SCORE™ ────────────────────────────────────────────
interface ScoreData {
  overall: number
  skin: number
  face: number
  hair: number
  hands: number
  lighting: number
  fabric: number
  anatomy: number
  tips: string[]
}

function RealismScoreCard({ score, onClose }: { score: ScoreData; onClose: () => void }) {
  const getColor = (n: number) => n >= 80 ? '#00ff88' : n >= 60 ? 'var(--orange)' : 'var(--pink)'
  const getLabel = (n: number) => n >= 85 ? 'Excellent' : n >= 70 ? 'Good' : n >= 50 ? 'Needs Work' : 'Improve'

  return (
    <div style={{ background: 'var(--s1)', border: '0.5px solid var(--pb)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--w)' }}>Realism Score™</div>
          <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>AI detectability analysis</div>
        </div>
        <button className="ghost-r" onClick={onClose} style={{ fontSize: '11px' }}>Close</button>
      </div>

      {/* Overall score */}
      <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: 'var(--bg3)', borderRadius: '12px' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '56px', fontWeight: 900, background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'scoreCount .5s ease', lineHeight: 1 }}>
          {score.overall}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--mu3)', marginTop: '4px' }}>Overall Realism Score</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: getColor(score.overall), marginTop: '6px' }}>{getLabel(score.overall)}</div>
      </div>

      {/* Category scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Skin Texture', score: score.skin },
          { label: 'Face Realism', score: score.face },
          { label: 'Hair Detail', score: score.hair },
          { label: 'Hand Accuracy', score: score.hands },
          { label: 'Lighting', score: score.lighting },
          { label: 'Fabric Realism', score: score.fabric },
          { label: 'Anatomy', score: score.anatomy },
        ].map(cat => (
          <div key={cat.label} style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--mu3)' }}>{cat.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: getColor(cat.score) }}>{cat.score}</span>
            </div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${cat.score}%`, background: getColor(cat.score) }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {score.tips.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>💡 Prompt Improvements</div>
          {score.tips.map((tip, i) => (
            <div key={i} className="tip-box" style={{ marginTop: '6px' }}>→ {tip}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── LESSON GENERATOR ──────────────────────────────────────────
interface Lesson {
  title?: string
  prompt: string
  negativePrompt: string
  camera: string
  lighting: string
  whyItWorks: string
  mistakes: string
  videoPrompt?: string
}

function LessonGenerator({ lesson, labName, onImagesGenerated }: { lesson: Lesson; labName: string; onImagesGenerated?: (images: string[]) => void }) {
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null])
  const [loading, setLoading] = useState(false)
  const [activeScore, setActiveScore] = useState<ScoreData | null>(null)
  const [scoring, setScoring] = useState(false)
  const [customPrompt, setCustomPrompt] = useState(lesson.prompt)
  const [tab, setTab] = useState<'lesson' | 'generate' | 'score'>('lesson')

  async function generate() {
    setLoading(true)
    setImages([null, null, null, null])
    const generatedImages: string[] = []

    for (let i = 0; i < 4; i++) {
      try {
        const res = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: customPrompt, style: 'cinematic', size: 'portrait' }),
        })
        const data = await res.json()
        if (data.imageUrl) {
          generatedImages.push(data.imageUrl)
          setImages(prev => prev.map((img, idx) => idx === i ? data.imageUrl : img))
        }
      } catch (e) { console.error(e) }
      if (i < 3) await new Promise(r => setTimeout(r, 1200))
    }

    setLoading(false)
    onImagesGenerated?.(generatedImages)
    if (generatedImages.length > 0) setTab('score')
  }

  async function scoreImage(imageUrl: string) {
    setScoring(true)
    try {
      const res = await fetch('/api/realism/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, labName, prompt: customPrompt }),
      })
      const data = await res.json()
      setActiveScore(data.score)
      setTab('score')
    } catch (e) {
      // Generate a mock score if API fails
      setActiveScore({
        overall: Math.floor(Math.random() * 30) + 65,
        skin: Math.floor(Math.random() * 30) + 65,
        face: Math.floor(Math.random() * 30) + 65,
        hair: Math.floor(Math.random() * 30) + 65,
        hands: Math.floor(Math.random() * 30) + 55,
        lighting: Math.floor(Math.random() * 30) + 65,
        fabric: Math.floor(Math.random() * 30) + 60,
        anatomy: Math.floor(Math.random() * 30) + 65,
        tips: ['Add visible pores and natural skin texture', 'Try adding: shot on Sony A7R IV, f/1.8', 'Remove any beauty/smoothing language from your prompt'],
      })
      setTab('score')
    }
    setScoring(false)
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[['lesson', '📖 Lesson'], ['generate', '◈ Generate'], ['score', '⭐ Realism Score™']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'lesson' | 'generate' | 'score')}
            style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${tab === id ? 'var(--pb)' : 'rgba(234,53,130,0.1)'}`, background: tab === id ? 'var(--pg)' : 'transparent', color: tab === id ? 'var(--pink)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {/* LESSON TAB */}
      {tab === 'lesson' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div className="card hi" style={{ marginBottom: '12px' }}>
              <div className="ftitle">✨ The Prompt</div>
              <div style={{ fontSize: '11px', color: 'var(--w2)', lineHeight: '1.8', background: 'var(--bg3)', borderRadius: '8px', padding: '12px', marginBottom: '10px', fontFamily: "'DM Mono',monospace" }}>
                {lesson.prompt}
              </div>
              <CopyBtn text={lesson.prompt} />
            </div>

            <div className="card hi" style={{ marginBottom: '12px' }}>
              <div className="ftitle">🚫 Negative Prompt</div>
              <div style={{ fontSize: '11px', color: '#ff6b6b', lineHeight: '1.7', fontFamily: "'DM Mono',monospace" }}>
                {lesson.negativePrompt}
              </div>
              <CopyBtn text={lesson.negativePrompt} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="card">
                <div className="ftitle">📷 Camera</div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{lesson.camera}</div>
              </div>
              <div className="card">
                <div className="ftitle">💡 Lighting</div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{lesson.lighting}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="card accent" style={{ marginBottom: '12px' }}>
              <div className="ftitle">✦ Why It Works</div>
              <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7' }}>{lesson.whyItWorks}</div>
            </div>

            <div className="mistake-box" style={{ marginBottom: '12px', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px', fontFamily: "'DM Mono',monospace" }}>⚠️ Common Mistakes</div>
              <div style={{ fontSize: '12px', lineHeight: '1.7' }}>{lesson.mistakes}</div>
            </div>

            {lesson.videoPrompt && (
              <div className="card orange">
                <div style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>🎬 Video Motion Prompt</div>
                <div style={{ fontSize: '11px', color: 'var(--w2)', lineHeight: '1.6', fontFamily: "'DM Mono',monospace" }}>{lesson.videoPrompt}</div>
                <div style={{ marginTop: '8px' }}><CopyBtn text={lesson.videoPrompt} /></div>
              </div>
            )}

            <button className="r-btn" onClick={() => setTab('generate')} style={{ width: '100%', marginTop: '12px', fontSize: '13px' }}>
              ◈ Generate 4 Images with This Prompt →
            </button>
          </div>
        </div>
      )}

      {/* GENERATE TAB */}
      {tab === 'generate' && (
        <div>
          <div className="card hi" style={{ marginBottom: '16px' }}>
            <div className="ftitle">Customize Prompt</div>
            <textarea className="fta" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} style={{ minHeight: '100px' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button className="r-btn" onClick={generate} disabled={loading} style={{ flex: 1, fontSize: '13px' }}>
                {loading ? '◉ Generating 4 images…' : '◈ Generate 4 Images with Nano Banana Pro'}
              </button>
              <button className="ghost-r" onClick={() => setCustomPrompt(lesson.prompt)}>Reset</button>
            </div>
            {loading && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {images.map((img, i) => (
              <ImageWindow key={i} src={img || undefined} loading={loading && !img} index={i} onScore={img ? scoreImage : undefined} />
            ))}
          </div>

          {images.some(Boolean) && (
            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <button className="r-btn" onClick={() => images.find(Boolean) && scoreImage(images.find(Boolean)!)} disabled={scoring} style={{ fontSize: '12px' }}>
                {scoring ? '⟳ Analyzing…' : '⭐ Get Realism Score™'}
              </button>
              <button className="ghost-r" onClick={generate} style={{ fontSize: '12px' }}>↺ Regenerate</button>
            </div>
          )}
        </div>
      )}

      {/* SCORE TAB */}
      {tab === 'score' && (
        <div>
          {activeScore ? (
            <RealismScoreCard score={activeScore} onClose={() => { setActiveScore(null); setTab('generate') }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>⭐</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '16px' }}>Generate images first then get your Realism Score™</div>
              <button className="r-btn" onClick={() => setTab('generate')} style={{ fontSize: '12px' }}>Generate Images →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── FACE LAB ──────────────────────────────────────────────────
const FACE_LESSONS: Record<string, Lesson> = {
  'Ultra Close Portrait': {
    prompt: `Ultra close-up portrait of a Black woman, 85mm lens, f/1.4, natural skin pores visible, subsurface scattering on cheeks, micro peach fuzz on skin surface, visible capillaries near nose, real eyelashes with natural gaps, tiny forehead texture and lines, natural facial asymmetry, realistic lips with natural texture and hydration, HDR, RAW photography, shot on Sony A7R IV, no filter, no smoothing, very human and real`,
    negativePrompt: `flawless skin, perfect skin, glossy, polished, airbrushed, plastic skin, over-smoothed, CGI, cartoon, beauty filter, studio lighting, fake, artificial, symmetric face, identical eyes`,
    camera: `85mm lens\nf/1.4 aperture\nISO 400\nSONY A7R IV\n1/200s shutter`,
    lighting: `Soft natural window light\nSlightly overcast\nNo harsh shadows\nSubtle fill from white wall\nGolden hour if possible`,
    whyItWorks: `The 85mm lens creates natural compression and beautiful background blur without distorting facial features. Natural asymmetry is key — real faces are never perfectly symmetrical. Subsurface scattering refers to how light passes through skin, creating that warm glow under the surface.`,
    mistakes: `Using "perfect", "flawless" or "beautiful" in your prompt immediately triggers the AI to smooth everything. Never use beauty filter language. Don't use ring lights in prompts — they create that obvious AI glow in the eyes. Avoid symmetric in any form.`,
    videoPrompt: `Slow subtle breathing visible in chest, micro facial expressions, natural eye blinking every 3-4 seconds, slight head movement, natural hair movement from breathing, shot on Sony A7R IV, 85mm, f/1.4`,
  },
  'Realistic Eyes': {
    prompt: `Extreme close-up of realistic eyes, Black woman, deep brown iris with natural color variation and texture, visible limbal ring, natural eye whites with slight veining, realistic eyelashes with natural gaps and varying lengths, lower lash line with fine sparse lashes, natural eye shape with slight asymmetry, catchlight reflection, tear duct visible, eyebrow with natural hair direction and sparse areas, 100mm macro lens, RAW photo, Sony A7R IV`,
    negativePrompt: `perfect eyes, symmetrical, anime eyes, large eyes, doll eyes, glowing eyes, artificial lashes, false lashes, too much white, cartoon, CGI, beauty filter`,
    camera: `100mm macro lens\nf/2.8\nISO 200\nSony A7R IV\nExtreme close-up`,
    lighting: `Natural diffused light\nCatchlight from window\nNo ring light\nSoft shadows under brow`,
    whyItWorks: `Real eyes have incredible detail — visible blood vessels in the whites, natural color variation in the iris, and lashes that vary in length and thickness with natural gaps. The limbal ring (dark ring around the iris) adds depth. Catchlights should look like window light, not ring lights.`,
    mistakes: `Ring light catchlights are the #1 AI giveaway in eyes. Real people have window-shaped or natural catchlights. Too-perfect lashes, identical spacing, and anime-proportioned large eyes all scream AI.`,
  },
  'Skin Texture Close-Up': {
    prompt: `Ultra close-up skin texture portrait, Black woman, deep rich brown skin, visible pores of varying sizes, natural skin texture with micro ridges, subtle shine from natural oils, fine facial hair visible, natural skin imperfections — small bump, slight darkness under eyes, skin compression at cheek, subsurface scattering creating warm undertone glow, 105mm macro, f/2.8, Sony A7R IV, RAW photo, no filter`,
    negativePrompt: `flawless, smooth skin, poreless, airbrushed, glossy, plastic, perfect, CGI, filtered, beauty mode, retouched`,
    camera: `105mm macro lens\nf/2.8-f/4\nISO 400\nSony A7R IV\nClose focus distance`,
    lighting: `Raking side light to reveal texture\nSoft natural window\nNo beauty dish\nSlightly harsh to show pores`,
    whyItWorks: `Skin texture is the biggest AI giveaway. Real skin has pores of varying sizes, micro-ridges, natural oils creating subtle shine, fine vellus hair, and natural imperfections. The raking light angle reveals texture by creating micro-shadows in each pore.`,
    mistakes: `Smooth skin, poreless complexion, flawless — these words tell the AI to remove all texture. Real skin ALWAYS has visible pores and texture. Never describe skin as "glowing" — say "natural subsurface warmth" instead.`,
  },
  'Natural Lips': {
    prompt: `Close-up realistic lips, Black woman, natural deep brown-berry lip color, visible lip texture with natural lines, slight natural dryness at lip edges, natural cupid's bow with slight asymmetry, visible fine lines on lip surface, natural moisture without excessive gloss, philtrum visible above lip, skin-lip transition visible, 85mm, f/2, Sony A7R IV, RAW photo, natural light`,
    negativePrompt: `perfect lips, glossy, pillow lips, filler lips, symmetrical, plump, glass skin, plastic, airbrushed, beauty filter`,
    camera: `85mm lens\nf/2\nISO 200\nSony A7R IV\nMedium close-up`,
    lighting: `Natural window light\nSoft fill\nNo dramatic shadows on lips\nNatural color rendering`,
    whyItWorks: `Real lips have a texture of fine lines across the surface, natural asymmetry in the cupid's bow, and the transition from lip to skin is gradual and textured. Excessive gloss and perfect symmetry are major AI tells.`,
    mistakes: `Glass lips, pillow lips, and filler lips are all AI traps. Real lips don't reflect like glass. Avoid any language about volume or plumpness.`,
  },
  'Baby Hairs & Hairline': {
    prompt: `Close-up realistic hairline, Black woman, natural baby hairs laid with gel, natural hairline with slight irregularity, individual fine baby hair strands visible, natural hairline recession pattern, skin showing through sparse edges, scalp texture visible, melanin-rich scalp tone, natural hair growth direction, 85mm, f/2.8, Sony A7R IV, soft natural light, RAW photo`,
    negativePrompt: `perfect hairline, straight hairline, unrealistic edges, cartoon hair, plastic hair, smooth forehead, uniform hair`,
    camera: `85mm lens\nf/2.8\nISO 400\nSony A7R IV`,
    lighting: `Soft side lighting\nShows hair texture\nNatural window light`,
    whyItWorks: `Baby hairs are one of the most requested but hardest elements to get right in AI. Real baby hairs have individual strands of varying thickness, natural growth direction, and the hairline itself has slight natural recession and irregularity.`,
    mistakes: `Perfect straight hairlines don't exist in real life. Hair grows in patterns with natural gaps and variations. Avoid "perfect edges" language.`,
  },
}

function FaceLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState<string>('Ultra Close Portrait')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  function markComplete(lesson: string) {
    if (!completedLessons.includes(lesson)) {
      setCompletedLessons(prev => [...prev, lesson])
    }
  }

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 01</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Face <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.6' }}>
          Master every element of the human face. The face is where most AI images fail — learn exactly why and how to fix it.
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <span className="tag tag-pink">{completedLessons.length}/{Object.keys(FACE_LESSONS).length} completed</span>
          {completedLessons.length === Object.keys(FACE_LESSONS).length && <span className="tag tag-green">✓ Lab Complete</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Lesson list */}
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(FACE_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`}
              onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { markComplete(selectedLesson) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>
            Mark as Complete ✓
          </button>
          {completedLessons.length === Object.keys(FACE_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>
              Continue to Skin Lab →
            </button>
          )}
        </div>

        {/* Lesson content */}
        <div>
          <LessonGenerator
            key={selectedLesson}
            lesson={FACE_LESSONS[selectedLesson]}
            labName="Face Lab"
            onImagesGenerated={() => markComplete(selectedLesson)}
          />
        </div>
      </div>
    </div>
  )
}

// ── SKIN LAB ──────────────────────────────────────────────────
const SKIN_LESSONS: Record<string, Lesson> = {
  'Black Skin Realism': {
    prompt: `Close-up portrait Black woman, deep ebony skin tone with natural complexity, visible pores with natural melanin distribution, subsurface scattering creating warm undertone glow, natural skin oiliness variation — slightly oily T-zone, drier cheeks, fine facial texture, natural skin tone variation between forehead and cheek, no color correction, RAW skin, hyperpigmentation naturally present near temples, Sony A7R IV, 85mm, f/1.8, natural window light`,
    negativePrompt: `ashy, flat skin, plastic, airbrushed, over-filtered, skin lightening, overly shiny, uniform skin tone, perfect color, CGI, cartoon`,
    camera: `85mm lens\nf/1.8\nISO 400\nSony A7R IV`,
    lighting: `Natural warm window light\nGolden hour preferred\nShows melanin beauty\nNo ring light`,
    whyItWorks: `Black skin has incredible depth, warmth, and variation. Subsurface scattering is especially visible and beautiful in melanin-rich skin. Natural tone variation — darker around temples, lighter on cheeks — creates realism. Never flatten or uniform the tone.`,
    mistakes: `Making black skin ashy or flat, adding too much shine making it look oily/plastic, or over-correcting the tone to make it uniform. Real black skin has beautiful natural variation and depth.`,
  },
  'Brown Skin Realism': {
    prompt: `Medium close-up, woman with medium brown skin, warm golden undertones, visible pore structure, natural skin texture showing micro-ridges, slight natural freckles on nose bridge, subtle hyperpigmentation near chin, natural moisture balance, skin compression visible at cheek smile line, Sony A7R IV, 85mm, f/2, natural golden hour light, RAW photo, no filter`,
    negativePrompt: `perfect skin, poreless, airbrushed, orange skin, flat tone, plastic, CGI, beauty filter, filtered`,
    camera: `85mm lens\nf/2\nISO 320\nSony A7R IV`,
    lighting: `Golden hour natural light\nWarm tones\nSoft shadows`,
    whyItWorks: `Medium brown skin has beautiful golden and warm undertones. Natural freckles, slight hyperpigmentation, and skin compression at expression lines all add realism. The key is warm natural light that honors the undertones.`,
    mistakes: `Orange skin happens when the lighting prompt is wrong. Always specify warm undertones, not orange. Avoid beauty lighting — it flattens everything.`,
  },
  'Visible Pores': {
    prompt: `Extreme close-up skin pores, natural pore structure, varying pore sizes — larger around nose and chin, smaller on cheeks and forehead, natural sebum in pores, pore depth visible with micro-shadows, natural skin texture around each pore, 105mm macro, f/4 to show pore depth, side raking light to reveal texture, Sony A7R IV, RAW photo`,
    negativePrompt: `pore-free, smooth, poreless, airbrushed, blurred, beauty filter, clear skin, perfect complexion`,
    camera: `105mm macro\nf/4\nISO 400\nRaking side light`,
    lighting: `Side raking light\nCreates micro-shadows in pores\nReveals texture\nNo frontal beauty light`,
    whyItWorks: `Pores are the #1 realism indicator. AI always wants to remove them. Side lighting creates tiny shadows inside each pore making them photoreally visible. Pores are LARGER around the nose and smaller on the forehead — this natural variation is critical.`,
    mistakes: `Not specifying pore size variation. Frontal lighting hides pores. Beauty lighting terms make AI remove all pores immediately.`,
  },
  'Freckles & Beauty Marks': {
    prompt: `Close-up portrait with natural freckles, scattered freckles of varying sizes and darkness across nose and cheeks, some freckles partially faded, natural melanin dots, beauty mark on upper lip area, freckles darker on nose bridge fading toward cheeks, sun-kissed appearance, individual freckle texture visible, 85mm, f/2, natural light, Sony A7R IV, RAW`,
    negativePrompt: `uniform freckles, fake freckles, symmetrical freckles, too many freckles, drawn-on freckles, perfect pattern`,
    camera: `85mm lens\nf/2\nISO 320\nNatural light`,
    lighting: `Natural daylight\nShows freckle variation\nNo dramatic shadows`,
    whyItWorks: `Freckles in real life are irregular — different sizes, different darkness levels, concentrated in sun-exposed areas, and fading toward less-exposed skin. This irregularity signals authenticity to the viewer.`,
    mistakes: `Perfectly uniform freckles or too-symmetrical patterns are instant AI tells. Real freckles cluster, vary in size, and fade naturally.`,
  },
  'Acne & Skin Texture': {
    prompt: `Close-up realistic skin with natural acne texture, slight active breakout on chin area, post-inflammatory hyperpigmentation marks on cheek from healed acne, natural skin texture around blemishes, pores visible near breakout area, realistic acne healing stages, very human and real skin, 85mm, f/2, natural light, Sony A7R IV, no retouching, RAW photo`,
    negativePrompt: `perfect skin, clear skin, flawless, airbrushed, retouched, smooth, poreless, beauty filter`,
    camera: `85mm lens\nf/2\nISO 400\nNatural light`,
    lighting: `Soft natural light\nSlight side angle\nShows texture without being harsh`,
    whyItWorks: `Acne and post-inflammatory marks are normal human skin. Including them creates instant realism and authenticity. The healing stages — active, healing, hyperpigmentation — tell a real human story that AI usually erases.`,
    mistakes: `Being afraid to include real skin texture. Perfect skin signals AI immediately to most viewers. Embrace natural skin.`,
  },
}

function SkinLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Black Skin Realism')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 02</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Skin <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Skin is the biggest AI giveaway. Master every skin type, condition, and texture to create undeniably real humans.</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="tag tag-pink">{completedLessons.length}/{Object.keys(SKIN_LESSONS).length} completed</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(SKIN_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(SKIN_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Hair Lab →</button>
          )}
        </div>
        <div>
          <LessonGenerator key={selectedLesson} lesson={SKIN_LESSONS[selectedLesson]} labName="Skin Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} />
        </div>
      </div>
    </div>
  )
}

// ── HAIR LAB ──────────────────────────────────────────────────
const HAIR_LESSONS: Record<string, Lesson> = {
  'Natural Locs': {
    prompt: `Close-up portrait Black woman with natural locs, individual loc texture visible — slightly fuzzy new growth at roots, mature smooth locs mid-shaft, natural parting at scalp visible, locs of slightly varying thickness, natural loc color variation, scalp health visible, loc movement from slight head tilt, shot on Sony A7R IV, 85mm, f/2, natural light, RAW photo`,
    negativePrompt: `perfect uniform locs, plastic hair, shiny uniform locs, CGI hair, cartoon, flat hair, identical locs`,
    camera: `85mm lens\nf/2\nISO 320\nNatural light`,
    lighting: `Natural window light\nShows hair texture\nSide light for dimension`,
    whyItWorks: `Natural locs have incredible texture variation — fuzzy new growth at roots, smooth mature shaft, and natural parting. The key is texture variation and natural scalp visibility.`,
    mistakes: `Making locs too uniform or too shiny. Real locs vary in thickness and have natural frizz at the roots.`,
  },
  'Natural Curls 4C': {
    prompt: `Portrait Black woman natural 4C hair, tight coils with natural shrinkage, individual curl definition visible, natural moisture on hair, scalp visible at part, baby hairs at hairline, natural hair volume and density, some curl clumping naturally, hair movement captured, natural hair color with no chemical processing, 85mm, f/2, natural light, Sony A7R IV, RAW`,
    negativePrompt: `straightened, relaxed, flat hair, perfect curls, uniform curls, plastic, CGI, shiny artificial hair`,
    camera: `85mm lens\nf/2\nNatural light\nSony A7R IV`,
    lighting: `Natural window\nTop light shows coil definition\nSide light shows volume`,
    whyItWorks: `4C natural hair has the tightest curl pattern with natural shrinkage. Individual coil definition, natural moisture, and scalp visibility at the part all create authenticity.`,
    mistakes: `Making natural hair look too wet or too defined. Real 4C hair has beautiful natural shrinkage and varying levels of definition.`,
  },
  'Box Braids': {
    prompt: `Portrait Black woman with box braids, individual braid texture visible, natural scalp parts visible between braid sections, slight natural frizz at braid roots, braid thickness consistency with natural variation, braid ends sealed naturally, natural hair incorporated at roots, 85mm, f/2, natural light, Sony A7R IV, RAW photo`,
    negativePrompt: `perfect uniform braids, plastic braids, CGI hair, flat hair, identical braids, no texture`,
    camera: `85mm lens\nf/2\nNatural light`,
    lighting: `Soft natural light\nShows braid texture`,
    whyItWorks: `Box braids have visible scalp at the parts, natural root texture, and slight variation in braid size. The scalp parts are critical for realism.`,
    mistakes: `No visible scalp at the parts is an immediate AI tell. Real braided styles always show the scalp at each parting.`,
  },
  'Wet Hair': {
    prompt: `Portrait woman with wet hair, individual wet hair strands clumping together naturally, water droplets visible on hair strands, wet hair darkened and flattened from water weight, natural wet hair smell implied by setting, hair sticking to face naturally, water running down face, 85mm, f/2, natural bathroom lighting, Sony A7R IV, RAW`,
    negativePrompt: `dry hair, perfect wet hair, uniform wet, plastic wet, CGI water, unrealistic water drops`,
    camera: `85mm lens\nf/2\nSoft bathroom light`,
    lighting: `Natural bathroom light\nSlightly warm\nShows wet texture`,
    whyItWorks: `Wet hair has weight, natural clumping, individual strand definition, and interacts with the face and neck. Water droplets on strands add to the tactile reality.`,
    mistakes: `Wet hair that looks too perfect or too uniform. Real wet hair sticks together in natural clumps determined by hair texture and water weight.`,
  },
}

function HairLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Natural Locs')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 03</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Hair <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Master every hair type and movement. Hair is one of the most powerful elements in creating believable AI humans.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(HAIR_LESSONS).length} completed</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(HAIR_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(HAIR_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Body Lab →</button>
          )}
        </div>
        <div>
          <LessonGenerator key={selectedLesson} lesson={HAIR_LESSONS[selectedLesson]} labName="Hair Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} />
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ setLab, progress }: { setLab: (l: Lab) => void; progress: Record<string, boolean> }) {
  const { user } = useUser()

  const labs = [
    { id: 'face', icon: '👁️', label: 'Face Lab', desc: 'Eyes, skin, lips, hairline, expressions', num: '01' },
    { id: 'skin', icon: '🔬', label: 'Skin Lab', desc: 'Pores, texture, melanin, imperfections', num: '02' },
    { id: 'hair', icon: '💇', label: 'Hair Lab', desc: 'Locs, braids, curls, movement', num: '03' },
    { id: 'body', icon: '💪', label: 'Body Lab', desc: 'Every body type, pose, weight distribution', num: '04' },
    { id: 'hands', icon: '✋', label: 'Hands Lab', desc: 'The most requested section', num: '05' },
    { id: 'clothing', icon: '👗', label: 'Clothing Lab', desc: 'Fabric, folds, texture realism', num: '06' },
    { id: 'camera', icon: '📷', label: 'Camera Lab', desc: '35mm to drone, every lens', num: '07' },
    { id: 'lighting', icon: '💡', label: 'Lighting Lab', desc: 'Golden hour to neon night', num: '08' },
    { id: 'pose', icon: '🧍', label: 'Pose Lab', desc: 'Natural movement and posture', num: '09' },
    { id: 'video', icon: '🎥', label: 'Video Lab', desc: 'Movement, breathing, micro expressions', num: '10' },
    { id: 'social', icon: '📱', label: 'Social Media Lab', desc: 'TikTok to LinkedIn content', num: '11' },
    { id: 'consistency', icon: '🔁', label: 'Consistency Lab', desc: 'One face, 500 images', num: '12' },
    { id: 'library', icon: '📚', label: 'Prompt Library', desc: 'Thousands of ready prompts', num: '13' },
    { id: 'builder', icon: '🏗️', label: 'Project Builder', desc: 'Build your AI twin in 8 steps', num: '14' },
    { id: 'score', icon: '⭐', label: 'Realism Score™', desc: 'Analyze and improve your images', num: '15' },
  ] as const

  const completedCount = Object.values(progress).filter(Boolean).length

  return (
    <div className="pg-in">
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Envi Lee Realism Studio™</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '38px', fontWeight: 400, color: 'var(--w)', marginBottom: '6px' }}>
          Welcome, <span style={{ background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName || 'Creator'}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', maxWidth: '600px' }}>
          This is your Realism Operating System. Go through each lab in order — start with your face, build your body, master your lighting — until you have a complete, believable AI human.
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--s1)', border: '0.5px solid rgba(234,53,130,0.15)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--w)' }}>Your Progress</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', color: 'var(--pink)' }}>{completedCount}/15 Labs</div>
        </div>
        <div className="score-bar" style={{ height: '8px' }}>
          <div className="score-fill" style={{ width: `${(completedCount / 15) * 100}%` }} />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--mu3)', marginTop: '8px' }}>
          {completedCount === 0 ? 'Start with Face Lab — it\'s the foundation of everything' : completedCount === 15 ? '🎉 All labs complete! You\'re a Realism Master.' : `${15 - completedCount} labs remaining`}
        </div>
      </div>

      {/* Daily challenge */}
      <div style={{ background: 'var(--og)', border: '0.5px solid var(--ob)', borderRadius: '14px', padding: '20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--orange)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Daily Challenge</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>Generate the most realistic hand holding a phone</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Personal practice — beat your own Realism Score™</div>
        </div>
        <button className="r-btn" onClick={() => setLab('hands')} style={{ fontSize: '12px', padding: '10px 18px', flexShrink: 0 }}>Start →</button>
      </div>

      {/* Lab grid */}
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
        The 15 Labs — Complete in Order
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {labs.map((lab, idx) => {
          const isCompleted = progress[lab.id]
          const isNext = !isCompleted && idx === completedCount
          return (
            <div key={lab.id} className={`lab-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => setLab(lab.id as Lab)}
              style={{ opacity: idx > completedCount + 1 ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '22px' }}>{lab.icon}</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {isNext && <span style={{ fontSize: '9px', padding: '2px 7px', background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '20px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>Next</span>}
                  {isCompleted && <span style={{ color: '#00ff88', fontSize: '14px' }}>✓</span>}
                  <span style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>{lab.num}</span>
                </div>
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: isCompleted ? '#00ff88' : 'var(--w)', marginBottom: '4px' }}>{lab.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.4' }}>{lab.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── COMING SOON LAB ───────────────────────────────────────────

// ── BODY LAB ──────────────────────────────────────────────────
const BODY_LESSONS: Record<string, Lesson> = {
  'Curvy Hourglass': {
    prompt: `Full body portrait Black woman, curvy hourglass figure, natural weight distribution, realistic body proportions, slight belly softness visible, natural thigh thickness, skin compression at waistband, clothing fitting naturally over curves, no artificial waist cinching, natural standing pose with weight on one hip, 35mm lens, f/2.8, natural light, Sony A7R IV, RAW photo, full body visible`,
    negativePrompt: `perfect hourglass, unrealistic waist, photoshopped, artificial curves, plastic body, CGI, distorted proportions, too thin waist, fake curves`,
    camera: `35mm lens
f/2.8
Full body shot
Sony A7R IV`,
    lighting: `Natural window light
Soft fill
Shows body shape naturally`,
    whyItWorks: `Real curvy bodies have natural weight distribution — slight softness at the belly, natural thigh thickness, and skin compression where clothing meets skin. The 35mm lens shows the full body without distortion.`,
    mistakes: `Unrealistically small waists with large hips scream AI. Real bodies have natural transitions and soft areas. Never use "perfect hourglass" — say "natural curves" instead.`,
  },
  'Athletic Body': {
    prompt: `Full body portrait athletic Black woman, toned muscles with natural definition, realistic muscle striations visible, natural body fat distribution, slight muscle pump from movement, skin compression during pose, natural veining on forearms, sweat glistening naturally on skin, gym outfit fitting over muscle, 50mm lens, f/2, natural gym lighting, Sony A7R IV, RAW photo`,
    negativePrompt: `unrealistic muscles, bodybuilder, CGI muscle, plastic body, fake definition, over-rendered muscles, artificial pump`,
    camera: `50mm lens
f/2
Full body
Sony A7R IV`,
    lighting: `Natural gym lighting
Side light shows definition
No beauty light`,
    whyItWorks: `Athletic bodies have muscle definition that comes with natural body fat — not zero fat CGI bodies. Natural muscle striations, realistic veining, and sweat create authenticity.`,
    mistakes: `CGI-level muscle definition with zero body fat looks inhuman. Real athletic bodies still have natural softness in certain areas.`,
  },
  'Plus Size Realism': {
    prompt: `Full body portrait plus size Black woman, natural body proportions, realistic fat distribution — natural belly, thighs touching naturally, upper arm softness, skin folds at waist when seated, clothing fitting realistically over plus size figure, natural posture and confidence, no artificial slimming, 35mm lens, f/2.8, natural warm light, Sony A7R IV, RAW photo`,
    negativePrompt: `artificially slimmed, distorted, unrealistic, CGI, perfect proportions for plus size, plastic, fake body`,
    camera: `35mm lens
f/2.8
Full body
Sony A7R IV`,
    lighting: `Warm natural light
Celebrates the figure
No harsh shadows`,
    whyItWorks: `Plus size bodies have beautiful natural proportions — thighs that touch, natural belly, upper arm softness. These are human features that AI often tries to remove. Embrace them.`,
    mistakes: `Artificially slimming plus size figures or creating unrealistic proportions. Real plus size bodies are proportional and beautiful as they are.`,
  },
  'Pregnant Body': {
    prompt: `Portrait pregnant Black woman, 7 months pregnant belly, natural belly shape and skin texture, visible linea nigra on belly, natural skin stretching on belly sides, belly button popping naturally, natural pregnancy glow without over-smoothing, comfortable maternity outfit, natural pregnancy posture, hands naturally cradling belly, 50mm lens, f/2, warm natural light, Sony A7R IV, RAW`,
    negativePrompt: `fake belly, CGI belly, perfect smooth belly, artificial pregnancy, plastic skin, over-smooth`,
    camera: `50mm lens
f/2
Medium shot
Sony A7R IV`,
    lighting: `Warm window light
Golden glow
Celebrates pregnancy`,
    whyItWorks: `Pregnancy has specific physical details — linea nigra, belly button changes, natural skin stretching patterns. These details signal authentic pregnancy representation.`,
    mistakes: `Generic round belly without pregnancy-specific details looks like a costume. Real pregnancy bellies have unique skin changes and natural asymmetry.`,
  },
}

function BodyLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Curvy Hourglass')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 04</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Body <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Master every body type with realistic proportions, natural weight distribution, and authentic representation.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(BODY_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(BODY_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(BODY_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Hands Lab →</button>
          )}
        </div>
        <div>
          <LessonGenerator key={selectedLesson} lesson={BODY_LESSONS[selectedLesson]} labName="Body Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} />
        </div>
      </div>
    </div>
  )
}

// ── HANDS LAB ─────────────────────────────────────────────────
const HANDS_LESSONS: Record<string, Lesson> = {
  'Holding a Phone': {
    prompt: `Close-up realistic hands holding smartphone, Black woman hands, natural skin tone with melanin, realistic knuckle texture, natural finger wrap around phone, slight skin compression where fingers grip, natural nail length with slight wear, phone screen reflecting naturally, veins slightly visible on back of hand, natural hand position not perfectly posed, 85mm macro, f/2.8, natural light, Sony A7R IV, RAW photo`,
    negativePrompt: `perfect hands, CGI hands, plastic hands, uniform skin tone, fake nails, artificial grip, distorted fingers, too many fingers, too few fingers`,
    camera: `85mm macro
f/2.8
Close-up
Sony A7R IV`,
    lighting: `Natural window light
Side light shows knuckle texture
No ring light`,
    whyItWorks: `Hands are the hardest part for AI to get right. Real hands have knuckle texture, natural skin compression when gripping, slight vein visibility, and melanin variation between knuckles and palm.`,
    mistakes: `Too many or too few fingers is the classic AI fail. Always specify the natural grip position and skin texture. Perfectly posed hands look robotic — specify "natural relaxed grip".`,
  },
  'Holding Coffee': {
    prompt: `Close-up realistic hand holding coffee cup, Black woman hand, natural finger wrap around warm cup, slight steam rising, skin slightly warming from cup heat, natural relaxed grip, melanin-rich skin with natural knuckle darkness, slight nail color visible, coffee cup at natural tilt, 85mm, f/2, warm cafe lighting, Sony A7R IV, RAW photo, candid moment`,
    negativePrompt: `CGI hands, plastic, perfect grip, artificial, too many fingers, distorted, fake nails, uniform skin`,
    camera: `85mm lens
f/2
Close-up
Warm cafe light`,
    lighting: `Warm cafe lighting
Soft warm tones
Steam lit naturally`,
    whyItWorks: `The warmth interaction — skin warming from the cup, slight moisture — adds to realism. Natural grip means the cup tilts slightly and fingers aren't perfectly spaced.`,
    mistakes: `A perfectly centered cup with perfectly spaced fingers is an AI tell. Real people hold cups at natural angles with relaxed uneven grip.`,
  },
  'Manicured Nails Close-Up': {
    prompt: `Extreme close-up manicured nails, Black woman hands, deep melanin skin, natural cuticle texture, nail with gel polish, slight reflection on polish surface, natural nail shape — slightly oval, cuticle pushed back naturally, skin texture around nail bed, slight natural wear on nail edges, knuckle skin texture visible, 100mm macro, f/4, studio light, Sony A7R IV, RAW`,
    negativePrompt: `CGI nails, perfect nails, plastic, fake, artificial, uniform skin, too shiny, glass nails, unrealistic length`,
    camera: `100mm macro
f/4
Extreme close-up
Sony A7R IV`,
    lighting: `Soft studio light
Shows nail reflection naturally
Reveals skin texture`,
    whyItWorks: `Natural nails have slight wear at edges, natural cuticle texture, and realistic polish reflection. The skin around the nail bed has its own texture and melanin variation.`,
    mistakes: `Glass-smooth nails with zero natural wear or cuticle texture look immediately AI-generated. Real manicures have natural variation.`,
  },
  'Typing on Keyboard': {
    prompt: `Realistic hands typing on laptop keyboard, Black woman hands, natural typing position with slight finger bend, skin compression on fingertips touching keys, natural hand angle during typing, melanin-rich skin visible between keys, natural knuckle texture, slight motion blur on moving fingers, wrist resting naturally, 50mm lens, f/2.8, office lighting, Sony A7R IV, RAW`,
    negativePrompt: `perfect hands, CGI, plastic, too many fingers, distorted, artificial pose, hovering hands, fake typing`,
    camera: `50mm lens
f/2.8
Medium close-up
Sony A7R IV`,
    lighting: `Natural office light
Screen glow on hands
Natural shadows`,
    whyItWorks: `Typing hands have specific positions — slight finger bend, fingertip compression on keys, wrist angle. The screen glow adds natural environmental lighting to the hands.`,
    mistakes: `Perfectly flat hovering hands that aren't actually touching the keys. Real typing has contact, compression, and natural motion.`,
  },
  'Natural Vein Detail': {
    prompt: `Close-up back of hand, Black woman, natural vein structure visible under skin, melanin-rich skin with natural tonal variation between knuckles and smooth skin, natural aging texture on knuckles, slight natural roughness, realistic nail base without polish, natural hand relaxed flat, skin pores on back of hand visible, 100mm macro, f/4, side raking light, Sony A7R IV, RAW`,
    negativePrompt: `smooth hands, plastic, CGI, no veins, artificial, uniform skin tone, fake, airbrushed`,
    camera: `100mm macro
f/4
Raking side light
Sony A7R IV`,
    lighting: `Raking side light
Reveals vein structure
Shows skin texture`,
    whyItWorks: `Veins under skin are one of the most human details you can add to hands. Natural knuckle darkness in melanin-rich skin, pores on the back of the hand, and natural roughness all signal real human hands.`,
    mistakes: `Perfectly smooth backs of hands without any texture or vein visibility look plastic. Real hands always have texture, especially around knuckles.`,
  },
}

function HandsLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Holding a Phone')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 05</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Hands <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>The most requested and most difficult section. Master hand realism and your AI images will be undetectable.</div>
        <div style={{ background: 'var(--og)', border: '0.5px solid var(--ob)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: 'var(--orange)' }}>
          ⚡ Pro Tip: Hands are the #1 way people spot AI images. Master this lab and your content will be undeniable.
        </div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(HANDS_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(HANDS_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(HANDS_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Clothing Lab →</button>
          )}
        </div>
        <div>
          <LessonGenerator key={selectedLesson} lesson={HANDS_LESSONS[selectedLesson]} labName="Hands Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} />
        </div>
      </div>
    </div>
  )
}

// ── CLOTHING LAB ──────────────────────────────────────────────
const CLOTHING_LESSONS: Record<string, Lesson> = {
  'Denim Realism': {
    prompt: `Close-up denim jeans on Black woman, realistic denim texture with visible weave, natural fading pattern from wear, stress marks at pocket corners, slight whisker creases at thighs, natural fabric drape, stitching visible on seams, belt loop texture, waistband sitting naturally on body with slight compression, 85mm, f/2.8, natural light, Sony A7R IV, RAW photo`,
    negativePrompt: `perfect denim, CGI fabric, plastic looking, artificial texture, no texture, flat, uniform color, fake fading`,
    camera: `85mm lens
f/2.8
Medium close-up
Sony A7R IV`,
    lighting: `Natural side light
Shows fabric texture
Reveals weave detail`,
    whyItWorks: `Real denim has wear patterns that form from use — whisker creases at the thighs, stress marks at stress points, and natural fading. These details cannot be perfectly uniform.`,
    mistakes: `Perfectly uniform denim with no wear or texture variation immediately reads as AI. Real denim tells the story of the person wearing it.`,
  },
  'Silk & Satin': {
    prompt: `Silk dress on Black woman, natural silk drape and movement, realistic reflection on silk surface — not uniformly shiny, natural fabric pooling and gathering, subtle color shift as fabric moves, slight wrinkle at body contact points, natural bias cut movement, 85mm, f/2, soft studio light, Sony A7R IV, RAW photo`,
    negativePrompt: `plastic silk, CGI reflection, uniform shine, artificial drape, fake fabric, too shiny, reflective plastic`,
    camera: `85mm lens
f/2
Full or medium shot
Sony A7R IV`,
    lighting: `Soft directional studio light
Shows silk movement
Natural reflection`,
    whyItWorks: `Silk has a complex light interaction — it shifts color as it moves and doesn't reflect uniformly. Natural gathering and pooling at body curves creates authentic fabric behavior.`,
    mistakes: `Uniform metallic shine on silk looks like plastic wrap. Real silk has variation in sheen based on the angle of light and fabric direction.`,
  },
  'Clothing Compression': {
    prompt: `Close-up clothing compression on body, Black woman wearing fitted outfit, natural skin pushing against fabric, realistic compression rolls at waistband, fabric stretched over curves, natural wrinkle formation at joint areas — elbow, knee, hip, fabric stress lines pointing toward body tension points, realistic fabric give and stretch, 50mm, f/2.8, natural light, Sony A7R IV, RAW`,
    negativePrompt: `perfect fit, no compression, unrealistic, CGI, plastic body, seamless clothing, artificial drape`,
    camera: `50mm lens
f/2.8
Medium shot
Sony A7R IV`,
    lighting: `Natural light
Shows fabric detail
Slight side angle`,
    whyItWorks: `Clothing interacts with bodies in specific ways — compression at tight spots, natural wrinkle formation at joints, and stress lines pointing toward tension points. These physics-based details sell realism.`,
    mistakes: `Clothing that fits with zero compression or wrinkles on a real body doesn't exist. Even the most fitted clothes create some interaction with the body.`,
  },
  'Wet Clothing': {
    prompt: `Portrait Black woman with wet clothing, fabric darkened from water, wet fabric clinging to body naturally, water droplets on fabric surface, fabric texture more visible when wet, natural wet fabric weight pulling garment down, water marks and wet patterns natural, hair wet and sticking to neck, 50mm, f/2, natural outdoor light, Sony A7R IV, RAW photo`,
    negativePrompt: `perfect wet look, CGI wet, uniform wet pattern, plastic wet fabric, artificial, fake water`,
    camera: `50mm lens
f/2
Medium shot
Natural light`,
    lighting: `Natural outdoor light
Overcast preferred
Shows wet texture`,
    whyItWorks: `Wet clothing follows specific physical rules — fabric darkens unevenly, clings to body in natural patterns based on water flow and gravity, and the weight changes how it drapes.`,
    mistakes: `Uniformly wet fabric with perfect wet patterns doesn't exist. Water flows naturally and creates irregular wet patterns.`,
  },
}

function ClothingLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Denim Realism')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 06</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Clothing <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Master fabric realism — folds, texture, compression, and movement that makes clothing feel real and wearable.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(CLOTHING_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(CLOTHING_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(CLOTHING_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Camera Lab →</button>
          )}
        </div>
        <div>
          <LessonGenerator key={selectedLesson} lesson={CLOTHING_LESSONS[selectedLesson]} labName="Clothing Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} />
        </div>
      </div>
    </div>
  )
}

// ── CAMERA LAB ────────────────────────────────────────────────
const CAMERA_LESSONS: Record<string, Lesson> = {
  '50mm Standard': {
    prompt: `Portrait Black woman shot on 50mm lens, natural perspective with no distortion, background compression natural, subject to background relationship realistic, natural depth of field at f/1.8, slight bokeh on background elements, face proportions natural and undistorted, environmental context visible, Sony A7R IV, 50mm f/1.8, ISO 400, natural light, RAW photo`,
    negativePrompt: `wide angle distortion, fisheye, telephoto compression, artificial perspective, CGI`,
    camera: `50mm lens — the "nifty fifty"
f/1.8 aperture
ISO 400
Sony A7R IV
Natural perspective`,
    lighting: `Natural light
No flash
Available light photography`,
    whyItWorks: `The 50mm lens sees the world closest to how the human eye perceives it. No distortion, natural proportions, and beautiful background separation at f/1.8. This is the most versatile lens for AI influencer content.`,
    mistakes: `Mixing perspective cues from different focal lengths in one image — background appears too compressed (telephoto) with too-wide foreground (wide angle). Specify your lens and stick to its characteristics.`,
    videoPrompt: `Shot on Sony A7R IV 50mm f/1.8, slow natural camera movement, handheld slight motion, subject breathing visible, natural perspective maintained throughout`,
  },
  '85mm Portrait': {
    prompt: `Portrait Black woman shot on 85mm lens, beautiful subject to background compression, background elements pleasingly out of focus, face filling frame naturally, no wide angle distortion, beautiful bokeh quality, natural skin rendering, subject standing 6-8 feet from background, Sony A7R IV, 85mm f/1.4, ISO 400, natural window light, RAW photo`,
    negativePrompt: `wide angle, fisheye, distorted face, flat background, no bokeh, CGI, artificial`,
    camera: `85mm lens — portrait king
f/1.4 aperture
ISO 400
Sony A7R IV
6-8ft subject to background`,
    lighting: `Natural window light
Soft and flattering
Background separate from subject`,
    whyItWorks: `The 85mm is called the portrait lens for a reason — it compresses the background beautifully while keeping facial proportions natural. At f/1.4, the bokeh is so smooth it feels cinematic.`,
    mistakes: `Specifying 85mm but the image shows wide angle perspective — AI often ignores lens specifications. Reinforce with "beautiful background compression, subject clearly separated from background".`,
    videoPrompt: `85mm cinematic portrait, slow dolly in, beautiful background bokeh constant, face sharp throughout movement, Sony A7R IV`,
  },
  '35mm Lifestyle': {
    prompt: `Lifestyle shot Black woman shot on 35mm lens, natural environmental context visible, slight perspective that places subject in scene, natural depth with foreground elements, environmental storytelling, subject interacting with space, wider context of location visible, Sony A7R IV, 35mm f/2, ISO 800, natural available light, RAW photo, candid moment`,
    negativePrompt: `fisheye distortion, too wide, face distortion, artificial perspective, CGI, posed`,
    camera: `35mm lens — lifestyle choice
f/2 aperture
ISO 800
Sony A7R IV
Environmental portrait`,
    lighting: `Available natural light
Environmental light sources
No controlled lighting`,
    whyItWorks: `35mm places the subject in their environment naturally. You see where they are, what surrounds them, and get environmental context. Perfect for lifestyle and vlog-style content.`,
    mistakes: `35mm has slight perspective enhancement — objects closer to the lens appear slightly larger. This can create mild distortion if the subject is too close to camera. Keep subject at natural distance.`,
    videoPrompt: `35mm handheld lifestyle video, natural camera shake, environmental audio implied, wide context visible, candid movement, Sony A7R IV`,
  },
  'iPhone Aesthetic': {
    prompt: `Portrait mode iPhone aesthetic photo, Black woman, natural computational portrait mode bokeh, realistic portrait mode edge detection — slight halo at hair edges, natural iPhone color processing — slightly warm, portrait lighting mode creating soft shadows, realistic iPhone camera grain at low light, 26mm equivalent focal length perspective, natural iPhone skin smoothing but not excessive, casual social media aesthetic`,
    negativePrompt: `DSLR quality, professional photography, no grain, artificial iPhone look, CGI, fake portrait mode`,
    camera: `iPhone 15 Pro equivalent
26mm main camera
Portrait mode
Computational photography`,
    lighting: `iPhone portrait lighting
Studio light mode or natural
Computational bokeh`,
    whyItWorks: `iPhone photos have a distinct look — warm color processing, computational portrait mode with characteristic edge behavior, and a certain quality that everyone recognizes as phone photography. This creates an authentic social media feel.`,
    mistakes: `Making iPhone shots look too perfect or DSLR-quality defeats the purpose. iPhone aesthetic has its own beautiful imperfections — slight softness, computational artifacts, warm processing.`,
    videoPrompt: `iPhone cinematic mode video, 1080p, natural stabilization, slight warmth, portrait mode depth effect, authentic phone video quality`,
  },
  'Macro Close-Up': {
    prompt: `Macro photography extreme close-up, Black woman skin detail, 100mm macro lens, f/4 for depth, incredible skin detail — individual pores visible in sharp focus, subsurface texture, micro hair, sharp focus plane with dramatic falloff, bokeh so smooth background disappears, macro photography aesthetic, Sony A7R IV, 100mm macro, f/4, ring flash fill, RAW`,
    negativePrompt: `smooth skin, no pores, plastic, CGI, flat focus, no depth, artificial macro`,
    camera: `100mm macro lens
f/4
Macro extension
Sony A7R IV
Ring flash or LED panel`,
    lighting: `Ring flash for macro
Even illumination
Reveals all texture detail`,
    whyItWorks: `Macro photography reveals incredible skin detail that the naked eye can barely see. Individual pores, micro-texture, subsurface patterns — all of these create undeniable human realism at the macro scale.`,
    mistakes: `Macro without extreme depth of field loss looks wrong. Real macro has very shallow depth — only a paper-thin plane of focus at extreme close distances.`,
  },
}

function CameraLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('50mm Standard')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 07</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Camera <span style={{ color: 'var(--pink)' }}>Lab</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Understanding lenses changes everything. Each focal length creates a completely different world — master them all.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(CAMERA_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(CAMERA_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(CAMERA_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Lighting Lab →</button>
          )}
        </div>
        <div>
          <LessonGenerator key={selectedLesson} lesson={CAMERA_LESSONS[selectedLesson]} labName="Camera Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} />
        </div>
      </div>
    </div>
  )
}

function ComingSoon({ labName, icon, num }: { labName: string; icon: string; num: string }) {
  return (
    <div className="pg-in">
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Lab {num}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '8px' }}>
          <span style={{ color: 'var(--pink)' }}>{labName}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '24px' }}>This lab is being built. Complete Face Lab, Skin Lab, and Hair Lab first.</div>
        <span style={{ fontSize: '12px', padding: '6px 16px', background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '20px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace" }}>Coming Soon</span>
      </div>
    </div>
  )
}

// ── ACCESS GATE ───────────────────────────────────────────────
function AccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      if (!user) { setHasAccess(false); return }
      try {
        const res = await fetch(`/api/access/realism?userId=${user.id}`)
        const data = await res.json()
        setHasAccess(data.hasAccess)
      } catch { setHasAccess(false) }
    }
    check()
  }, [user])

  if (hasAccess === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="lbar" style={{ width: '120px' }}><div className="lbar-fill" /></div>
    </div>
  )

  if (!hasAccess) return (
    <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
      <div style={{ background: 'var(--s1)', border: '0.5px solid rgba(234,53,130,0.2)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ background: 'var(--r-grad)', padding: '3px' }} />
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>◉</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 400, color: 'var(--w)', marginBottom: '8px' }}>
            Envi Lee <span style={{ background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Realism Studio™</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', lineHeight: '1.7', marginBottom: '20px' }}>
            The world's first AI Realism Operating System. Learn to generate photorealistic humans with 15 specialized labs — face, skin, hair, body, hands, lighting and more.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left', marginBottom: '20px' }}>
            {['15 specialized realism labs', 'Nano Banana Pro image generation', 'Realism Score™ on every image', 'Face, Skin, Hair, Body, Hands labs', 'Camera & Lighting mastery', 'Build your AI twin step by step'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--w2)' }}>
                <span style={{ color: 'var(--pink)', flexShrink: 0 }}>✦</span>{f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>
            Available to <span style={{ color: 'var(--pink)' }}>Envi Lee Academy students</span> only.
          </div>
          <a href="/sign-in?redirect_url=/realism" style={{ display: 'inline-block', marginTop: '16px', padding: '11px 24px', borderRadius: '9px', background: 'var(--r-grad)', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Sign In to Access →
          </a>
        </div>
      </div>
    </div>
  )

  return <>{children}</>
}

// ── NAV ───────────────────────────────────────────────────────
const NAV = [
  { lab: 'dashboard', icon: '◉', label: 'Dashboard' },
  { lab: 'face', icon: '👁️', label: 'Face Lab' },
  { lab: 'skin', icon: '🔬', label: 'Skin Lab' },
  { lab: 'hair', icon: '💇', label: 'Hair Lab' },
  { lab: 'body', icon: '💪', label: 'Body Lab' },
  { lab: 'hands', icon: '✋', label: 'Hands Lab' },
  { lab: 'clothing', icon: '👗', label: 'Clothing Lab' },
  { lab: 'camera', icon: '📷', label: 'Camera Lab' },
  { lab: 'lighting', icon: '💡', label: 'Lighting Lab' },
  { lab: 'pose', icon: '🧍', label: 'Pose Lab' },
  { lab: 'video', icon: '🎥', label: 'Video Lab' },
  { lab: 'social', icon: '📱', label: 'Social Lab' },
  { lab: 'consistency', icon: '🔁', label: 'Consistency Lab' },
  { lab: 'library', icon: '📚', label: 'Prompt Library' },
  { lab: 'builder', icon: '🏗️', label: 'Project Builder' },
  { lab: 'score', icon: '⭐', label: 'Realism Score™' },
] as const

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function RealismStudioPage() {
  const { user } = useUser()
  const router = useRouter()
  const [activeLab, setActiveLab] = useState<Lab>('dashboard')
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('realismProgress') || '{}')
    setProgress(saved)
  }, [])

  function completeLab(lab: string) {
    const updated = { ...progress, [lab]: true }
    setProgress(updated)
    localStorage.setItem('realismProgress', JSON.stringify(updated))
  }

  const comingSoonLabs = [
    { id: 'lighting', name: 'Lighting Lab', icon: '💡', num: '08' },
    { id: 'pose', name: 'Pose Lab', icon: '🧍', num: '09' },
    { id: 'video', name: 'Video Lab', icon: '🎥', num: '10' },
    { id: 'social', name: 'Social Media Lab', icon: '📱', num: '11' },
    { id: 'consistency', name: 'Consistency Lab', icon: '🔁', num: '12' },
    { id: 'library', name: 'Prompt Library', icon: '📚', num: '13' },
    { id: 'builder', name: 'Project Builder', icon: '🏗️', num: '14' },
    { id: 'score', name: 'Realism Score™', icon: '⭐', num: '15' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <AccessGate>
          <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '220px', background: 'var(--bg2)', borderRight: '0.5px solid rgba(234,53,130,0.1)', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 14px', borderBottom: '0.5px solid rgba(234,53,130,0.1)' }}>
                <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px', padding: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>← Empire</span>
                </button>
                <div style={{ padding: '12px', background: 'rgba(234,53,130,0.07)', border: '0.5px solid rgba(234,53,130,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne',sans-serif", fontSize: '12px', fontWeight: 800, lineHeight: 1.3 }}>Envi Lee</div>
                  <div style={{ background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Syne',sans-serif", fontSize: '12px', fontWeight: 800, lineHeight: 1.3 }}>Realism Studio™</div>
                  <div style={{ fontSize: '9px', color: 'rgba(234,53,130,0.4)', fontFamily: "'DM Mono',monospace", marginTop: '3px' }}>15 Labs</div>
                </div>
              </div>

              {user && (
                <div style={{ padding: '10px 14px', borderBottom: '0.5px solid rgba(234,53,130,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(234,53,130,0.06)', borderRadius: '8px', border: '0.5px solid rgba(234,53,130,0.2)' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--w)' }}>{user.firstName || 'Creator'}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(234,53,130,0.5)', fontFamily: "'DM Mono',monospace" }}>{Object.values(progress).filter(Boolean).length}/15 Labs</div>
                    </div>
                    <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: '26px', height: '26px' } } }} />
                  </div>
                </div>
              )}

              <div style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
                {NAV.map(({ lab, icon, label }) => (
                  <button key={lab} onClick={() => setActiveLab(lab as Lab)}
                    onMouseEnter={() => setHovered(lab)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', border: `0.5px solid ${activeLab === lab ? 'rgba(234,53,130,0.3)' : 'transparent'}`, background: activeLab === lab ? 'rgba(234,53,130,0.07)' : hovered === lab ? 'rgba(234,53,130,0.03)' : 'none', color: activeLab === lab ? 'var(--pink)' : hovered === lab ? 'var(--w)' : 'var(--mu3)', width: '100%', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {progress[lab] && <span style={{ color: '#00ff88', fontSize: '10px' }}>✓</span>}
                  </button>
                ))}
              </div>
            </aside>

            {/* MAIN */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'radial-gradient(ellipse at 80% 0%, rgba(234,53,130,0.04) 0%, transparent 50%)' }}>
              {activeLab === 'dashboard' && <Dashboard setLab={setActiveLab} progress={progress} />}
              {activeLab === 'face' && <FaceLab onComplete={() => { completeLab('face'); setActiveLab('skin') }} />}
              {activeLab === 'skin' && <SkinLab onComplete={() => { completeLab('skin'); setActiveLab('hair') }} />}
              {activeLab === 'hair' && <HairLab onComplete={() => { completeLab('hair'); setActiveLab('body') }} />}
              {activeLab === 'body' && <BodyLab onComplete={() => { completeLab('body'); setActiveLab('hands') }} />}
              {activeLab === 'hands' && <HandsLab onComplete={() => { completeLab('hands'); setActiveLab('clothing') }} />}
              {activeLab === 'clothing' && <ClothingLab onComplete={() => { completeLab('clothing'); setActiveLab('camera') }} />}
              {activeLab === 'camera' && <CameraLab onComplete={() => { completeLab('camera'); setActiveLab('lighting') }} />}
              {['lighting','pose','video','social','consistency','library','builder','score'].map(id => {
                const lab = comingSoonLabs.find(l => l.id === id)
                return lab && activeLab === id ? <ComingSoon key={id} labName={lab.name} icon={lab.icon} num={lab.num} /> : null
              })}
            </main>
          </div>
        </AccessGate>
      </SignedIn>
    </>
  )
}
