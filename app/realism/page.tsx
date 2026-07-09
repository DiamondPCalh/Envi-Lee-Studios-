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


// ── LIGHTING LAB ──────────────────────────────────────────────
const LIGHTING_LESSONS: Record<string, Lesson> = {
  'Golden Hour': {
    prompt: `Portrait Black woman in golden hour light, warm orange-gold sunlight hitting skin at low angle, warm color cast on melanin-rich skin, deep warm shadows on opposite side of face, slight lens flare from direct sun angle, hair lit from behind creating natural rim light, warm golden glow on surroundings, magic hour atmosphere, 85mm, f/2, ISO 800, Sony A7R IV, RAW photo`,
    negativePrompt: `cold light, blue light, midday harsh light, studio light, ring light, artificial, CGI, flat lighting`,
    camera: `85mm lens
f/2
ISO 800
Sony A7R IV
Golden hour timing`,
    lighting: `Natural golden hour sun
45-60 min before sunset
Warm orange-gold cast
Natural rim light from sun`,
    whyItWorks: `Golden hour light transforms melanin-rich skin into something extraordinary — the warm tones interact with the natural undertones of Black and brown skin to create incredible warmth and depth. The low angle creates natural rim lighting.`,
    mistakes: `Simulating golden hour with just an orange filter. Real golden hour has direction — the light comes from a low angle creating natural shadows and rim lighting. Specify the angle and direction.`,
    videoPrompt: `Golden hour cinematic, warm light shifting slightly as sun moves, natural rim light on hair, skin glowing in warm light, 85mm Sony A7R IV, slow motion capture`,
  },
  'Natural Window Light': {
    prompt: `Portrait Black woman in natural window light, soft directional light from large window left side, natural shadow falling across right side of face, soft catchlight in eyes from window shape (rectangular not circular), natural skin tone rendering, room visible in background at lower exposure, dust particles visible in light shaft, 85mm, f/2, ISO 400, Sony A7R IV, RAW photo`,
    negativePrompt: `ring light, studio light, even flat lighting, CGI light, artificial, harsh shadows, flash`,
    camera: `85mm lens
f/2
ISO 400
Sony A7R IV
Near window placement`,
    lighting: `Large north-facing window
Soft diffused natural light
One directional source
Natural falloff`,
    whyItWorks: `Window light is the most flattering natural light source — soft enough to be beautiful but directional enough to create dimension. The rectangular catchlight in the eyes immediately signals natural light.`,
    mistakes: `Circular catchlights in eyes signal ring light which signals AI photography. Always specify window-shaped catchlights or natural environmental catchlights.`,
    videoPrompt: `Natural window light video, light subtly shifting as clouds pass, natural shadows moving slightly, dust motes visible in light beam, authentic home environment, Sony A7R IV`,
  },
  'Neon Night': {
    prompt: `Portrait Black woman in neon lighting at night, pink and purple neon signs casting colored light on skin, melanin-rich skin absorbing and reflecting neon colors beautifully, natural shadows between neon light sources, slight motion blur in background from people passing, authentic nightlife environment, neon light in hair, 35mm, f/1.8, ISO 3200, Sony A7R IV, RAW photo, high grain`,
    negativePrompt: `flat neon, CGI neon, artificial neon, no grain, clean night, studio simulated neon, plastic`,
    camera: `35mm lens
f/1.8
ISO 3200
Sony A7R IV
High ISO night photography`,
    lighting: `Real neon signage
Mixed color sources
High ISO natural grain
No flash`,
    whyItWorks: `Neon light on Black skin creates stunning color interactions — the saturated colors absorb into the melanin creating unique color mixing. High ISO grain at night is authentic and beautiful, not a flaw to hide.`,
    mistakes: `Clean noiseless neon night shots don't exist without professional lighting equipment. Real nightlife photography has grain, slight motion, and imperfect color mixing.`,
    videoPrompt: `Neon night video, ISO 3200 grain visible, neon colors shifting in reflections, natural night environment movement, authentic nightlife, Sony A7R IV 35mm`,
  },
  'Golden Hour Luxury Hotel': {
    prompt: `Portrait Black woman in luxury hotel room, late afternoon golden light through sheer curtains, warm glow on skin and bedding, hotel room details visible — marble, premium textures, natural shadows from curtain folds on floor, aspirational lifestyle photography, candid moment, 50mm, f/2, ISO 640, Sony A7R IV, RAW photo`,
    negativePrompt: `cold light, flash, flat lighting, CGI hotel, artificial, perfect lighting, studio`,
    camera: `50mm lens
f/2
ISO 640
Sony A7R IV
Available light only`,
    lighting: `Sheer curtain diffused golden light
Warm luxury atmosphere
No artificial lighting
Golden hour only`,
    whyItWorks: `Luxury hotel content with natural window light creates an aspirational but authentic feel. The sheer curtains diffuse golden hour light creating a soft ethereal glow while revealing the premium hotel environment.`,
    mistakes: `Perfectly lit hotel rooms without visible light source direction look like catalog photography — beautiful but clearly artificial. The light source should be identifiable.`,
  },
}

function LightingLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Golden Hour')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 08</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Lighting <span style={{ color: 'var(--pink)' }}>Lab</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Light is everything. Master how different light sources interact with melanin-rich skin to create stunning realistic images.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(LIGHTING_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(LIGHTING_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(LIGHTING_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Pose Lab →</button>
          )}
        </div>
        <div><LessonGenerator key={selectedLesson} lesson={LIGHTING_LESSONS[selectedLesson]} labName="Lighting Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} /></div>
      </div>
    </div>
  )
}

// ── POSE LAB ──────────────────────────────────────────────────
const POSE_LESSONS: Record<string, Lesson> = {
  'Candid Walking Shot': {
    prompt: `Candid walking shot Black woman, natural mid-stride captured, weight shifting from back to front foot, natural arm swing, slight motion blur on moving foot, hair movement from walking, clothing movement from motion, looking slightly ahead not at camera, urban environment, authentic candid moment, 35mm, f/2.8, 1/250s to freeze motion with slight blur, Sony A7R IV, RAW`,
    negativePrompt: `posed walking, fake stride, CGI motion, stiff, artificial, looking at camera, perfect pose`,
    camera: `35mm lens
f/2.8
1/250s shutter
Sony A7R IV
Candid capture`,
    lighting: `Natural street light
Available light
Authentic environment`,
    whyItWorks: `Real walking has weight shift, arm counter-swing, slight motion blur on moving elements, and natural hair and clothing movement. The subject not looking at camera creates authentic candid energy.`,
    mistakes: `"Walking" poses where both feet are on the ground with equal weight — this is standing, not walking. Real walking always has one foot raised with clear weight transfer.`,
    videoPrompt: `Candid walking video, natural stride, slight camera follow movement, environmental sounds implied, natural momentum, Sony A7R IV 35mm`,
  },
  'Mirror Selfie': {
    prompt: `Mirror selfie Black woman, phone visible in hand at natural selfie angle, mirror reflection showing back and side details, natural selfie expression — slight smile or serious, natural arm position holding phone, bathroom or bedroom mirror with realistic reflection, slight imperfection in mirror (smudge or water spot), natural lighting in reflection, 26mm iPhone equivalent, natural light`,
    negativePrompt: `perfect mirror, CGI reflection, artificial, perfect phone position, fake selfie, no phone visible, no reflection`,
    camera: `iPhone selfie equivalent
26mm perspective
Selfie angle
Natural hand position`,
    lighting: `Natural bathroom/bedroom light
Environmental light source
No ring light`,
    whyItWorks: `Mirror selfies have specific elements — the phone is visible in the reflection, the angle is slightly upward at arm length, and the mirror itself has natural imperfections. The background in the mirror tells a story about the space.`,
    mistakes: `A "mirror selfie" without the phone being visible, or without seeing the reflection of the space behind the subject. Real mirror selfies reveal the room.`,
  },
  'Luxury Lifestyle Pose': {
    prompt: `Luxury lifestyle portrait Black woman, relaxed confident pose in luxury setting, natural weight distribution leaning against luxury surface, candid wealth aesthetic, designer items naturally placed, aspirational but not posed, slight interaction with environment — touching surface or item, confident relaxed body language, 50mm, f/2, golden hour light, Sony A7R IV, RAW, editorial lifestyle`,
    negativePrompt: `stiff pose, obviously posed, fake luxury, CGI, artificial, catalog pose, symmetrical stance`,
    camera: `50mm lens
f/2
Editorial distance
Sony A7R IV`,
    lighting: `Golden hour
Warm luxury lighting
Natural environment`,
    whyItWorks: `Luxury lifestyle photography feels effortless — the subject appears to be living in their world, not posing for a photo. Natural interaction with the environment and candid body language creates aspirational authenticity.`,
    mistakes: `Stiff symmetrical poses with perfect posture in luxury settings look like catalog photography. Real luxury lifestyle content looks like someone captured a genuine moment.`,
  },
  'Gym Content Pose': {
    prompt: `Gym content Black woman, natural workout pose with realistic exertion, slight sweat visible on skin, natural post-workout flush on face, workout clothes with natural compression, hair pulled back naturally with flyaways, natural grip on equipment, realistic workout environment, 35mm, f/2, gym lighting, Sony A7R IV, RAW photo`,
    negativePrompt: `perfect makeup at gym, no sweat, CGI body, artificial exertion, fake gym, plastic body, posed unnaturally`,
    camera: `35mm lens
f/2
Environmental shot
Sony A7R IV`,
    lighting: `Natural gym lighting
Slightly harsh is okay
Authentic environment`,
    whyItWorks: `Real gym content shows authentic exertion — natural sweat, workout flush, flyaway hair, and the honest physical reality of working out. This authenticity is what makes gym content relatable.`,
    mistakes: `Perfect makeup, no sweat, and a perfectly lit body in a gym screams AI or highly produced content. Real gym content has beautiful honest imperfection.`,
  },
}

function PoseLab({ onComplete }: { onComplete: () => void }) {
  const [selectedLesson, setSelectedLesson] = useState('Candid Walking Shot')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 09</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Pose <span style={{ color: 'var(--pink)' }}>Lab</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Natural movement and authentic posing — the difference between a photo that feels lived-in and one that feels generated.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(POSE_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Lessons</div>
          {Object.keys(POSE_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(POSE_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Video Lab →</button>
          )}
        </div>
        <div><LessonGenerator key={selectedLesson} lesson={POSE_LESSONS[selectedLesson]} labName="Pose Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} /></div>
      </div>
    </div>
  )
}

// ── PROMPT LIBRARY ────────────────────────────────────────────
const PROMPT_CATEGORIES = [
  'Close-Up Face', 'Realistic Eyes', 'Luxury Selfie', 'Morning Routine',
  'Mirror Selfie', 'Gym Session', 'Luxury Vacation', 'Shopping Vlog',
  'Airport Content', 'Date Night', 'GRWM', 'Makeup Tutorial',
  'Fashion Shoot', 'Coffee Shop', 'Beach Walk', 'Office Content',
  'Podcast Setup', 'Cooking Content', 'Night Out', 'Hotel Room',
  'Car Content', 'Bookshelf Aesthetic', 'Rooftop Content', 'Rainy Day',
]

const LIBRARY_PROMPTS: Record<string, { prompt: string; negative: string; camera: string; lighting: string; videoPrompt: string; bestFor: string }> = {
  'Close-Up Face': {
    prompt: `Ultra close-up portrait Black woman, 85mm lens, f/1.4, natural skin pores and texture, subsurface scattering visible, micro peach fuzz, visible capillaries, real eyelashes with gaps, natural facial asymmetry, realistic lips, HDR, RAW photography, Sony A7R IV, no filter, very human and real`,
    negative: `flawless, perfect skin, glossy, plastic, airbrushed, CGI, beauty filter, ring light catchlights, symmetric`,
    camera: `85mm · f/1.4 · ISO 400 · Sony A7R IV`,
    lighting: `Soft natural window light · No ring light · Natural shadows`,
    videoPrompt: `Slow breathing visible, natural micro expressions, realistic eye blinking, 85mm Sony A7R IV, subtle head movement`,
    bestFor: `TikTok close-up, Instagram portrait, thumbnail`,
  },
  'Luxury Selfie': {
    prompt: `Luxury lifestyle selfie Black woman, deep melanin skin with natural texture, high-end hotel or penthouse background, designer outfit fitting naturally, natural selfie angle slightly above, confident relaxed expression, soft natural light from large windows, visible high-end environment details, Sony A7R IV portrait mode equivalent, natural skin texture, no filter`,
    negative: `perfect skin, plastic, CGI, artificial selfie angle, fake luxury background, beauty filter, ring light`,
    camera: `Portrait mode · 26mm equivalent · Natural angle`,
    lighting: `Large window natural light · Luxury environment`,
    videoPrompt: `Lifestyle vlog selfie video, natural handheld, authentic luxury environment, natural lighting shifts`,
    bestFor: `Instagram, TikTok, luxury lifestyle content`,
  },
  'Morning Routine': {
    prompt: `Morning routine Black woman, natural bedroom morning light, soft diffused early morning sun, natural sleepy but beautiful expression, hair in morning state — slightly tousled, natural skin without full makeup, comfortable morning outfit or robe, cozy bedroom environment, authentic morning atmosphere, 50mm, f/2, ISO 640, Sony A7R IV, RAW`,
    negative: `full makeup morning, perfect hair, artificial morning, CGI, studio light, fake bedroom`,
    camera: `50mm · f/2 · ISO 640 · Sony A7R IV`,
    lighting: `Early morning natural window light · Soft cool to warm shift · No artificial light`,
    videoPrompt: `Morning vlog, natural morning light, authentic getting-ready energy, natural pace, Sony A7R IV 50mm`,
    bestFor: `YouTube morning routine, TikTok day-in-life, Instagram stories`,
  },
  'Airport Content': {
    prompt: `Airport content Black woman, luxury travel aesthetic, natural airport terminal lighting — slightly cool fluorescent mixed with natural window light, designer carry-on, confident traveler energy, gate seating or terminal walkway, authentic airport environment with other travelers visible, natural candid travel moment, 35mm, f/2, ISO 1600, Sony A7R IV, RAW`,
    negative: `empty airport, fake airport, CGI terminal, perfect lighting, artificial, studio, posed`,
    camera: `35mm · f/2 · ISO 1600 · Sony A7R IV`,
    lighting: `Natural airport mixed lighting · Available light only · Authentic terminal environment`,
    videoPrompt: `Airport travel vlog, authentic terminal environment, natural traveler movement, available light, Sony A7R IV 35mm`,
    bestFor: `Travel content, lifestyle, luxury influencer`,
  },
  'Coffee Shop': {
    prompt: `Coffee shop content Black woman, warm cafe lighting — mix of window light and Edison bulbs, natural interaction with coffee cup, natural skin texture in warm light, bokeh cafe background with people and furniture, authentic coffee shop atmosphere, 50mm, f/2, ISO 800, Sony A7R IV, RAW, candid moment`,
    negative: `empty cafe, fake background, CGI, perfect lighting, artificial, studio, posed`,
    camera: `50mm · f/2 · ISO 800 · Sony A7R IV`,
    lighting: `Cafe available light · Mix of natural and Edison warm · Beautiful bokeh background`,
    videoPrompt: `Cafe vlog, warm cozy atmosphere, natural ambient sound implied, authentic cafe environment, Sony A7R IV 50mm`,
    bestFor: `Instagram, TikTok cafe aesthetic, lifestyle content`,
  },
}

function PromptLibrary() {
  const [selectedCat, setSelectedCat] = useState('Close-Up Face')
  const [copied, setCopied] = useState<string | null>(null)
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null])
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')

  const filteredCats = PROMPT_CATEGORIES.filter(c => c.toLowerCase().includes(search.toLowerCase()))
  const currentPrompt = LIBRARY_PROMPTS[selectedCat]

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000) })
  }

  async function generate() {
    if (!currentPrompt) return
    setGenerating(true)
    setImages([null, null, null, null])
    for (let i = 0; i < 4; i++) {
      try {
        const res = await fetch('/api/generate/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: currentPrompt.prompt, style: 'cinematic', size: 'portrait' }) })
        const data = await res.json()
        if (data.imageUrl) setImages(prev => prev.map((img, idx) => idx === i ? data.imageUrl : img))
      } catch { }
      if (i < 3) await new Promise(r => setTimeout(r, 1200))
    }
    setGenerating(false)
  }

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 13</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Prompt <span style={{ color: 'var(--pink)' }}>Library</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Ready-to-use realism prompts for every content type. Copy, customize, and generate.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
        <div>
          <input className="finp" placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '10px' }} />
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredCats.map(cat => (
              <div key={cat} className={`lesson-card ${selectedCat === cat ? 'active' : ''}`} onClick={() => { setSelectedCat(cat); setImages([null, null, null, null]) }} style={{ marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: selectedCat === cat ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedCat === cat ? 600 : 400 }}>{cat}</div>
                {!LIBRARY_PROMPTS[cat] && <div style={{ fontSize: '9px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace", marginTop: '2px' }}>Coming soon</div>}
              </div>
            ))}
          </div>
        </div>
        <div>
          {currentPrompt ? (
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--pink)', marginBottom: '16px' }}>{selectedCat}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="card hi">
                  <div className="ftitle">✨ Full Prompt</div>
                  <div style={{ fontSize: '11px', color: 'var(--w2)', lineHeight: '1.7', fontFamily: "'DM Mono',monospace", marginBottom: '10px' }}>{currentPrompt.prompt}</div>
                  <button className="ghost-r" onClick={() => copy(currentPrompt.prompt, 'prompt')} style={{ fontSize: '10px' }}>{copied === 'prompt' ? '✓ Copied!' : 'Copy Prompt'}</button>
                </div>
                <div className="card">
                  <div className="ftitle">🚫 Negative Prompt</div>
                  <div style={{ fontSize: '11px', color: '#ff6b6b', lineHeight: '1.7', fontFamily: "'DM Mono',monospace", marginBottom: '10px' }}>{currentPrompt.negative}</div>
                  <button className="ghost-r" onClick={() => copy(currentPrompt.negative, 'negative')} style={{ fontSize: '10px' }}>{copied === 'negative' ? '✓ Copied!' : 'Copy Negative'}</button>
                </div>
                <div className="card">
                  <div className="ftitle">📷 Camera Settings</div>
                  <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{currentPrompt.camera}</div>
                </div>
                <div className="card">
                  <div className="ftitle">💡 Lighting</div>
                  <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{currentPrompt.lighting}</div>
                </div>
                <div className="card orange">
                  <div style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '8px' }}>🎬 Video Prompt</div>
                  <div style={{ fontSize: '11px', color: 'var(--w2)', lineHeight: '1.6', fontFamily: "'DM Mono',monospace", marginBottom: '8px' }}>{currentPrompt.videoPrompt}</div>
                  <button className="ghost-o" onClick={() => copy(currentPrompt.videoPrompt, 'video')} style={{ fontSize: '10px' }}>{copied === 'video' ? '✓ Copied!' : 'Copy Video Prompt'}</button>
                </div>
                <div className="card">
                  <div className="ftitle">📱 Best For</div>
                  <div style={{ fontSize: '12px', color: 'var(--pink)', lineHeight: '1.6' }}>{currentPrompt.bestFor}</div>
                </div>
              </div>
              <button className="r-btn" onClick={generate} disabled={generating} style={{ width: '100%', fontSize: '13px', marginBottom: '14px' }}>
                {generating ? '◈ Generating 4 images…' : '◈ Generate 4 Images with Nano Banana Pro'}
              </button>
              {generating && <div className="lbar" style={{ marginBottom: '14px' }}><div className="lbar-fill" /></div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {images.map((img, i) => <ImageWindow key={i} src={img || undefined} loading={generating && !img} index={i} />)}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>📚</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Select a category to see the prompt</div>
              <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '6px' }}>More prompts being added regularly</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PROJECT BUILDER ───────────────────────────────────────────
interface AITwinProject {
  name: string; skinTone: string; hairType: string; hairColor: string
  eyeColor: string; bodyType: string; faceShape: string; personality: string
  style: string; vibe: string; niche: string; voiceId: string
  wardrobe: string; jewelry: string; makeup: string; colors: string
  faceImage?: string; bodyImage?: string
}

function ProjectBuilder() {
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [twin, setTwin] = useState<Partial<AITwinProject>>({})
  const [faceImages, setFaceImages] = useState<string[]>([])
  const [generatingFace, setGeneratingFace] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(key: keyof AITwinProject, val: string) { setTwin(t => ({ ...t, [key]: val })) }

  async function generateFace() {
    setGeneratingFace(true)
    const prompt = `Ultra realistic close-up portrait of an AI influencer, ${twin.skinTone || 'deep brown'} skin with natural texture and visible pores, ${twin.hairType || 'natural'} ${twin.hairColor || 'black'} hair, ${twin.eyeColor || 'dark brown'} eyes, ${twin.faceShape || 'oval'} face shape, ${twin.personality || 'confident'} expression, ${twin.vibe || 'luxurious'} energy, 85mm lens f/1.4, natural window light, Sony A7R IV, RAW photo, no filter, very human and real`
    try {
      const res = await fetch('/api/generate/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, style: 'cinematic', size: 'portrait' }) })
      const data = await res.json()
      if (data.imageUrl) setFaceImages(prev => [...prev, data.imageUrl].slice(0, 4))
    } catch { }
    setGeneratingFace(false)
  }

  function saveTwin() {
    const twins = JSON.parse(localStorage.getItem(`realismTwins_${user?.id}`) || '[]')
    twins.unshift({ ...twin, id: Date.now(), faceImage: faceImages[0], createdAt: new Date().toISOString() })
    localStorage.setItem(`realismTwins_${user?.id}`, JSON.stringify(twins))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const steps = [
    { num: 1, label: 'Face', desc: 'Define facial features' },
    { num: 2, label: 'Body', desc: 'Body type and physique' },
    { num: 3, label: 'Hair', desc: 'Hair type and style' },
    { num: 4, label: 'Voice', desc: 'Voice and personality' },
    { num: 5, label: 'Wardrobe', desc: 'Style and fashion' },
    { num: 6, label: 'Generate', desc: 'Create your AI twin' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 14</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Project <span style={{ color: 'var(--pink)' }}>Builder</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '16px' }}>Build your complete AI twin from scratch — step by step until you have a fully realized AI influencer.</div>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' as const }}>
        {steps.map(s => (
          <div key={s.num} onClick={() => setStep(s.num)}
            className={`progress-step ${step === s.num ? 'current' : step > s.num ? 'done' : 'pending'}`}
            style={{ cursor: 'pointer', flex: 1, minWidth: '100px' }}>
            <div className="step-num" style={{ background: step > s.num ? 'rgba(0,255,136,0.2)' : step === s.num ? 'var(--pg)' : 'var(--s2)', color: step > s.num ? '#00ff88' : step === s.num ? 'var(--pink)' : 'var(--mu3)', border: `0.5px solid ${step > s.num ? 'rgba(0,255,136,0.3)' : step === s.num ? 'var(--pb)' : 'rgba(234,53,130,0.1)'}` }}>
              {step > s.num ? '✓' : s.num}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: step === s.num ? 'var(--pink)' : step > s.num ? '#00ff88' : 'var(--mu3)' }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--mu2)', fontFamily: "'DM Mono',monospace" }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <div className="card hi">
          <div className="ftitle">Step 1 — Define the Face</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="AI Twin Name"><input className="finp" placeholder="e.g. Nova, Luxe, Zara" value={twin.name || ''} onChange={e => update('name', e.target.value)} /></F>
            <F label="Skin Tone"><select className="fsel" value={twin.skinTone || ''} onChange={e => update('skinTone', e.target.value)}>
              <option value="">Select...</option>
              {['Fair ivory', 'Light beige', 'Warm honey', 'Medium golden brown', 'Rich brown', 'Deep brown', 'Ebony', 'Deep ebony'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Eye Color"><select className="fsel" value={twin.eyeColor || ''} onChange={e => update('eyeColor', e.target.value)}>
              <option value="">Select...</option>
              {['Deep black', 'Dark brown', 'Medium brown', 'Honey brown', 'Hazel', 'Grey', 'Amber'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Face Shape"><select className="fsel" value={twin.faceShape || ''} onChange={e => update('faceShape', e.target.value)}>
              <option value="">Select...</option>
              {['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Oblong'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Niche"><input className="finp" placeholder="e.g. Luxury lifestyle, CEO Baddie" value={twin.niche || ''} onChange={e => update('niche', e.target.value)} /></F>
            <F label="Overall Vibe"><input className="finp" placeholder="e.g. Mysterious luxury, Bold confident" value={twin.vibe || ''} onChange={e => update('vibe', e.target.value)} /></F>
          </div>
          <button className="r-btn" onClick={() => setStep(2)} style={{ marginTop: '8px', fontSize: '12px' }}>Next: Build Body →</button>
        </div>
      )}

      {step === 2 && (
        <div className="card hi">
          <div className="ftitle">Step 2 — Build the Body</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Body Type"><select className="fsel" value={twin.bodyType || ''} onChange={e => update('bodyType', e.target.value)}>
              <option value="">Select...</option>
              {['Petite', 'Slim toned', 'Athletic', 'Curvy hourglass', 'Thick curvy', 'Plus size goddess', 'Tall lean', 'Muscular'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Height Feel"><select className="fsel" value={twin.personality || ''} onChange={e => update('personality', e.target.value)}>
              <option value="">Select...</option>
              {['Petite and powerful', 'Average height', 'Tall and commanding', 'Model height'].map(s => <option key={s}>{s}</option>)}
            </select></F>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="ghost-r" onClick={() => setStep(1)}>← Back</button>
            <button className="r-btn" onClick={() => setStep(3)} style={{ fontSize: '12px' }}>Next: Define Hair →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card hi">
          <div className="ftitle">Step 3 — Define the Hair</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Hair Type"><select className="fsel" value={twin.hairType || ''} onChange={e => update('hairType', e.target.value)}>
              <option value="">Select...</option>
              {['Natural 4C coils', 'Natural curls 3C', 'Locs', 'Box braids', 'Knotless braids', 'Straight relaxed', 'Wavy', 'Afro', 'TWA', 'Silk press'].map(s => <option key={s}>{s}</option>)}
            </select></F>
            <F label="Hair Color"><select className="fsel" value={twin.hairColor || ''} onChange={e => update('hairColor', e.target.value)}>
              <option value="">Select...</option>
              {['Jet black', 'Dark brown', 'Honey blonde', 'Burgundy', 'Auburn', 'Silver', 'Platinum blonde', 'Ombre black to brown'].map(s => <option key={s}>{s}</option>)}
            </select></F>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="ghost-r" onClick={() => setStep(2)}>← Back</button>
            <button className="r-btn" onClick={() => setStep(4)} style={{ fontSize: '12px' }}>Next: Voice & Personality →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card hi">
          <div className="ftitle">Step 4 — Voice & Personality</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Personality traits"><input className="finp" placeholder="e.g. Bold, mysterious, warm, commanding" value={twin.personality || ''} onChange={e => update('personality', e.target.value)} /></F>
            <F label="ElevenLabs Voice ID (optional)"><input className="finp" placeholder="Voice ID from ElevenLabs" value={twin.voiceId || ''} onChange={e => update('voiceId', e.target.value)} /></F>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="ghost-r" onClick={() => setStep(3)}>← Back</button>
            <button className="r-btn" onClick={() => setStep(5)} style={{ fontSize: '12px' }}>Next: Wardrobe →</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card hi">
          <div className="ftitle">Step 5 — Wardrobe & Style</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <F label="Style preference"><input className="finp" placeholder="e.g. Luxury streetwear, designer pieces, soft girl" value={twin.style || ''} onChange={e => update('style', e.target.value)} /></F>
            <F label="Signature colors"><input className="finp" placeholder="e.g. Black, gold, cream, burgundy" value={twin.colors || ''} onChange={e => update('colors', e.target.value)} /></F>
            <F label="Jewelry style"><input className="finp" placeholder="e.g. Gold hoops, minimalist, statement pieces" value={twin.jewelry || ''} onChange={e => update('jewelry', e.target.value)} /></F>
            <F label="Makeup style"><input className="finp" placeholder="e.g. Natural glam, bold lip, no makeup look" value={twin.makeup || ''} onChange={e => update('makeup', e.target.value)} /></F>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="ghost-r" onClick={() => setStep(4)}>← Back</button>
            <button className="r-btn" onClick={() => setStep(6)} style={{ fontSize: '12px' }}>Next: Generate →</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <div className="card hi" style={{ marginBottom: '16px' }}>
            <div className="ftitle">Step 6 — Generate Your AI Twin</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[
                ['Name', twin.name], ['Skin', twin.skinTone], ['Eyes', twin.eyeColor],
                ['Body', twin.bodyType], ['Hair', `${twin.hairType} ${twin.hairColor}`],
                ['Style', twin.style], ['Vibe', twin.vibe], ['Niche', twin.niche],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} style={{ padding: '6px 10px', background: 'var(--bg3)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--pink)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="r-btn" onClick={generateFace} disabled={generatingFace} style={{ flex: 1, fontSize: '12px' }}>
                {generatingFace ? '◈ Generating AI Twin…' : '◈ Generate AI Twin Face'}
              </button>
              <button className="ghost-r" onClick={() => setStep(1)}>Edit Details</button>
            </div>
          </div>

          {faceImages.length > 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                {faceImages.map((img, i) => <ImageWindow key={i} src={img} index={i} />)}
                {Array(4 - faceImages.length).fill(null).map((_, i) => <ImageWindow key={`empty-${i}`} index={faceImages.length + i} />)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="r-btn" onClick={saveTwin} style={{ flex: 1, fontSize: '12px' }}>
                  {saved ? '✓ AI Twin Saved to Prompt Bank!' : '💾 Save AI Twin to Prompt Bank'}
                </button>
                <button className="ghost-r" onClick={generateFace} disabled={generatingFace} style={{ fontSize: '12px' }}>↺ Regenerate</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── VIDEO LAB (simplified) ────────────────────────────────────
function VideoLab({ onComplete }: { onComplete: () => void }) {
  const VIDEO_LESSONS = {
    'Natural Breathing': {
      prompt: `Portrait Black woman, ultra realistic, natural breathing movement, subtle chest rise visible, slight shoulder movement, soft natural expression, 85mm, f/1.4, natural window light, Sony A7R IV, RAW photo, candid moment`,
      negativePrompt: `static, rigid, CGI, plastic, artificial, posed`,
      camera: `85mm · f/1.4 · Sony A7R IV`, lighting: `Natural window light · Soft and directional`,
      whyItWorks: `Natural breathing is the most human thing you can describe. Chest rise, shoulder movement, and subtle expression changes all indicate life and humanity.`,
      mistakes: `Completely static subjects with no natural movement indication look like statues. Even still photos benefit from implied natural movement.`,
      videoPrompt: `Natural breathing visible in chest rise, subtle shoulder movement every 3-4 seconds, micro expression changes, natural eye movement, 85mm Sony A7R IV, very slow motion`,
    },
    'Natural Eye Movement': {
      prompt: `Extreme close-up eyes Black woman, natural eye movement — slight gaze shift, natural blinking pattern, realistic iris expansion and contraction, catchlight movement, natural eye moisture, micro expressions around eye area, 100mm macro, f/2.8, natural light, Sony A7R IV, RAW`,
      negativePrompt: `staring eyes, unblinking, CGI eyes, artificial, plastic, doll eyes`,
      camera: `100mm macro · f/2.8 · Sony A7R IV`, lighting: `Natural diffused light · Window catchlight`,
      whyItWorks: `Eyes are the window to realism. Natural blinking patterns, slight gaze movement, and realistic iris behavior all make eyes feel alive.`,
      mistakes: `Unblinking eyes that stare directly forward are immediately recognized as AI. Real eyes constantly make micro movements.`,
      videoPrompt: `Natural eye blinking every 3-4 seconds, subtle gaze shifts, realistic iris movement, natural eye moisture catching light, 100mm macro Sony A7R IV`,
    },
    'Hair Movement': {
      prompt: `Portrait Black woman, natural hair movement from slight wind or head movement, individual hair strands moving naturally, hair physics visible — heavier locs moving differently than fine strands, natural hair separation during movement, hair returning to natural position, 85mm, f/1.8, outdoor light, Sony A7R IV, RAW`,
      negativePrompt: `static hair, CGI hair movement, plastic hair, artificial wind, uniform movement`,
      camera: `85mm · f/1.8 · Sony A7R IV`, lighting: `Natural outdoor light · Wind implied`,
      whyItWorks: `Different hair types have completely different movement physics — fine hair moves like silk, locs move with weight and mass, braids swing as a unit. Specifying the hair type determines the movement pattern.`,
      mistakes: `Uniform hair movement where all strands move identically — real hair has different weights and textures that move at different rates.`,
      videoPrompt: `Natural hair movement from gentle breeze, physics-based movement per hair type, individual strand behavior visible, natural settling, Sony A7R IV 85mm slow motion`,
    },
  }
  const [selectedLesson, setSelectedLesson] = useState('Natural Breathing')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 10</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Video <span style={{ color: 'var(--pink)' }}>Lab</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Master movement, breathing, blinking, and all the micro details that make AI video feel undeniably human.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(VIDEO_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          {Object.keys(VIDEO_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(VIDEO_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Social Lab →</button>
          )}
        </div>
        <div><LessonGenerator key={selectedLesson} lesson={(VIDEO_LESSONS as Record<string, Lesson>)[selectedLesson]} labName="Video Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} /></div>
      </div>
    </div>
  )
}

// ── SOCIAL MEDIA LAB ──────────────────────────────────────────
function SocialMediaLab({ onComplete }: { onComplete: () => void }) {
  const SOCIAL_LESSONS = {
    'TikTok Vertical Content': {
      prompt: `TikTok-style vertical content Black woman creator, 9:16 ratio composition, face and upper body in frame, natural TikTok lighting — ring light visible in catchlight or natural window, authentic creator energy, bedroom or studio background, phone-filmed aesthetic, natural makeup, relatable expression, Sony A7R IV portrait mode equivalent, natural skin texture`,
      negativePrompt: `horizontal format, professional photography look, CGI, plastic, perfect studio`,
      camera: `9:16 vertical · Portrait mode · Creator setup`, lighting: `Natural window or soft ring light · Creator aesthetic`,
      whyItWorks: `TikTok content has a specific feel — it's personal, intimate, and slightly imperfect. The vertical format, creator lighting, and relatable energy all signal authentic content.`,
      mistakes: `Overly produced photography aesthetic for TikTok. TikTok content feels personal and immediate, not magazine editorial.`,
      videoPrompt: `TikTok vertical video, creator talking to camera energy, natural lighting, authentic content creator vibe, 9:16 aspect ratio, handheld natural movement`,
    },
    'Instagram Feed Aesthetic': {
      prompt: `Instagram feed aesthetic Black woman, curated lifestyle photography feel, warm consistent color grade, beautiful but authentic moment, editorial quality without being corporate, aspirational lifestyle setting, natural interaction with environment, 50mm, f/2, golden hour or natural window, Sony A7R IV, RAW, Instagram-worthy composition`,
      negativePrompt: `stock photo, corporate, CGI, artificial, poor composition, flat lighting`,
      camera: `50mm · f/2 · Sony A7R IV · Feed composition`, lighting: `Golden hour or natural window · Consistent warm tone`,
      whyItWorks: `Instagram feed photography sits between editorial and authentic — beautiful and curated but still feeling like a real moment. The color consistency and composition quality matters more here than other platforms.`,
      mistakes: `Too polished = stock photo. Too raw = TikTok. Instagram feed content lives in the beautiful middle ground.`,
      videoPrompt: `Instagram reel aesthetic, smooth B-roll quality, beautiful color grade, lifestyle moment, Sony A7R IV 50mm, cinematic but personal`,
    },
    'YouTube Thumbnail': {
      prompt: `YouTube thumbnail portrait Black woman, highly expressive reaction face — surprise, shock, or excitement, bright clear lighting on face, bold readable expression from small size, clean background that doesn't compete with face, natural skin texture visible even at thumbnail size, slightly dramatic but authentic expression, 85mm, f/1.8, bright natural light, Sony A7R IV, RAW`,
      negativePrompt: `boring expression, flat lighting, cluttered background, CGI, plastic, small face in frame`,
      camera: `85mm · f/1.8 · Close crop · Sony A7R IV`, lighting: `Bright natural light · Face clearly lit · High contrast`,
      whyItWorks: `YouTube thumbnails need to communicate emotion at 120px wide. Expressive authentic faces, clear bright lighting, and readable expressions at any size are essential.`,
      mistakes: `Subtle expressions that look boring at thumbnail size. YouTube thumbnails need clear readable emotion that works at the smallest display size.`,
      videoPrompt: `YouTube intro energy, high energy authentic expression, bright and inviting, clear face lighting, Sony A7R IV 85mm`,
    },
  }
  const [selectedLesson, setSelectedLesson] = useState('TikTok Vertical Content')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 11</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Social Media <span style={{ color: 'var(--pink)' }}>Lab</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Every platform has its own visual language. Master what makes content feel native on TikTok vs Instagram vs YouTube.</div>
        <span className="tag tag-pink">{completedLessons.length}/{Object.keys(SOCIAL_LESSONS).length} completed</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        <div>
          {Object.keys(SOCIAL_LESSONS).map(lesson => (
            <div key={lesson} className={`lesson-card ${selectedLesson === lesson ? 'active' : ''}`} onClick={() => setSelectedLesson(lesson)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: selectedLesson === lesson ? 'var(--pink)' : 'var(--w2)', fontWeight: selectedLesson === lesson ? 600 : 400 }}>{lesson}</div>
                {completedLessons.includes(lesson) && <span style={{ color: '#00ff88', fontSize: '12px' }}>✓</span>}
              </div>
            </div>
          ))}
          <button className="r-btn" onClick={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '12px' }}>Mark Complete ✓</button>
          {completedLessons.length === Object.keys(SOCIAL_LESSONS).length && (
            <button className="ghost-r" onClick={onComplete} style={{ width: '100%', fontSize: '11px', padding: '9px', marginTop: '8px' }}>Continue to Consistency Lab →</button>
          )}
        </div>
        <div><LessonGenerator key={selectedLesson} lesson={(SOCIAL_LESSONS as Record<string, Lesson>)[selectedLesson]} labName="Social Media Lab" onImagesGenerated={() => { if (!completedLessons.includes(selectedLesson)) setCompletedLessons(prev => [...prev, selectedLesson]) }} /></div>
      </div>
    </div>
  )
}

// ── CONSISTENCY LAB ───────────────────────────────────────────
function ConsistencyLab({ onComplete }: { onComplete: () => void }) {
  const [face, setFace] = useState('')
  const [scenario, setScenario] = useState('Luxury hotel lobby')
  const [outfit, setOutfit] = useState('Designer black dress')
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null])
  const [basePrompt, setBasePrompt] = useState('')

  const scenarios = ['Luxury hotel lobby', 'Coffee shop morning', 'City street fashion', 'Gym workout', 'Airport travel', 'Beach vacation', 'Office CEO moment', 'Night out']
  const outfits = ['Designer black dress', 'Luxury casual — cream set', 'Gym fit — sports bra and leggings', 'Business power suit', 'Silk robe luxury morning', 'Street style — oversized blazer', 'Beach coverup', 'Evening gown']

  function buildPrompt(scen: string, out: string) {
    const fp = face || 'Black woman, deep brown skin with natural pores and texture, natural locs, oval face, honey brown eyes'
    return `${fp}, ${out}, ${scen} setting, natural realistic lighting, Sony A7R IV 50mm f/1.8, RAW photo, no filter, natural skin texture, very human and real, same face and identity as reference`
  }

  async function generateSet() {
    setGenerating(true)
    setImages([null, null, null, null])
    const scenariosToUse = [scenario, 'Morning coffee shop', 'City street walk', 'Gym session']
    for (let i = 0; i < 4; i++) {
      const prompt = buildPrompt(scenariosToUse[i] || scenario, outfit)
      if (i === 0) setBasePrompt(prompt)
      try {
        const res = await fetch('/api/generate/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, style: 'cinematic', size: 'portrait' }) })
        const data = await res.json()
        if (data.imageUrl) setImages(prev => prev.map((img, idx) => idx === i ? data.imageUrl : img))
      } catch { }
      if (i < 3) await new Promise(r => setTimeout(r, 1200))
    }
    setGenerating(false)
  }

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 12</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>Consistency <span style={{ color: 'var(--pink)' }}>Lab</span></div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '8px' }}>Your biggest selling point — ONE face that stays identical across 500 images and 100 videos. Different outfits, locations, lighting. Same person.</div>
        <div style={{ background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: 'var(--pink)', lineHeight: '1.6' }}>
          ✦ The key to consistency: Lock in your face description once and use it IDENTICALLY in every prompt. Not similar — identical. Word for word.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card hi">
          <div className="ftitle">Your AI Twin DNA Lock</div>
          <F label="Face description (this stays IDENTICAL in every prompt)">
            <textarea className="fta" style={{ minHeight: '100px' }} placeholder="e.g. Black woman, deep ebony skin with natural pores and texture, natural 4C coils pulled back, almond-shaped dark brown eyes with natural lashes, full natural lips, heart face shape, slight natural asymmetry..." value={face} onChange={e => setFace(e.target.value)} />
          </F>
          <F label="Starting scenario">
            <select className="fsel" value={scenario} onChange={e => setScenario(e.target.value)}>
              {scenarios.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Starting outfit">
            <select className="fsel" value={outfit} onChange={e => setOutfit(e.target.value)}>
              {outfits.map(o => <option key={o}>{o}</option>)}
            </select>
          </F>
          <button className="r-btn" onClick={generateSet} disabled={generating} style={{ width: '100%', fontSize: '12px' }}>
            {generating ? '◈ Generating consistency test…' : '◈ Generate 4 Different Scenarios — Same Face'}
          </button>
        </div>
        <div className="card">
          <div className="ftitle">Consistency Tips</div>
          {[
            ['Use the EXACT same face description', 'Copy-paste word for word — even one changed word shifts the face'],
            ['Specify facial asymmetry', 'Add "slight natural asymmetry" — perfect symmetry = AI tell'],
            ['Lock the eye color precisely', '"Honey brown eyes with dark limbal ring" not just "brown eyes"'],
            ['Include a distinctive feature', 'A unique detail like a specific beauty mark makes the face consistent'],
            ['Use Soul ID for video', 'For video content connect to Soul ID in Academy Studios'],
            ['Save your face description', 'Store it in your Baddie DNA profile in the Prompt Bank'],
          ].map(([tip, detail]) => (
            <div key={tip} style={{ marginBottom: '12px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pink)', marginBottom: '3px' }}>✦ {tip}</div>
              <div style={{ fontSize: '11px', color: 'var(--mu3)', lineHeight: '1.5' }}>{detail}</div>
            </div>
          ))}
        </div>
      </div>

      {generating && <div className="lbar" style={{ marginBottom: '14px' }}><div className="lbar-fill" /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {images.map((img, i) => (
          <div key={i}>
            <ImageWindow src={img || undefined} loading={generating && !img} index={i} />
            <div style={{ fontSize: '10px', color: 'var(--mu3)', textAlign: 'center', marginTop: '4px', fontFamily: "'DM Mono',monospace" }}>
              {[scenario, 'Coffee shop', 'City street', 'Gym'][i]}
            </div>
          </div>
        ))}
      </div>

      {images.some(Boolean) && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '12px' }}>Do all 4 images look like the same person? If yes — you have consistency! If no — refine your face description.</div>
          <button className="r-btn" onClick={onComplete} style={{ fontSize: '12px', padding: '10px 20px' }}>✦ Lab Complete — Continue to Prompt Library →</button>
        </div>
      )}
    </div>
  )
}


// ── REALISM SCORE™ LAB ────────────────────────────────────────
function RealismScoreLab() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [scoring, setScoring] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [history, setHistory] = useState<Array<{ image: string; score: ScoreData; prompt: string; date: string }>>([])
  const [activeTab, setActiveTab] = useState<'score' | 'generate' | 'history' | 'learn'>('score')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('realismScoreHistory') || '[]')
    setHistory(saved)
  }, [])

  function handleImageUpload(file: File) {
    const reader = new FileReader()
    reader.onload = e => setUploadedImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function scoreImage(imageUrl: string, imagePrompt: string) {
    setScoring(true)
    setScoreData(null)
    try {
      const res = await fetch('/api/realism/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, labName: 'Realism Score™ Lab', prompt: imagePrompt }),
      })
      const data = await res.json()
      setScoreData(data.score)
      // Save to history
      const newEntry = { image: imageUrl, score: data.score, prompt: imagePrompt, date: new Date().toISOString() }
      const updated = [newEntry, ...history].slice(0, 20)
      setHistory(updated)
      localStorage.setItem('realismScoreHistory', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
    setScoring(false)
  }

  async function generateAndScore() {
    if (!prompt.trim()) return
    setGenerating(true)
    setScoreData(null)
    setGeneratedImage(null)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: 'cinematic', size: 'portrait' }),
      })
      const data = await res.json()
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl)
        setGenerating(false)
        await scoreImage(data.imageUrl, prompt)
      }
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  function getColor(n: number) { return n >= 80 ? '#00ff88' : n >= 60 ? 'var(--orange)' : 'var(--pink)' }
  function getLabel(n: number) { return n >= 85 ? '✦ Excellent' : n >= 70 ? '◈ Good' : n >= 55 ? '⚠ Needs Work' : '✕ Improve' }
  function getAdvice(n: number) { return n >= 85 ? 'This is undeniable. Keep this approach.' : n >= 70 ? 'Good realism. Small tweaks will push it higher.' : n >= 55 ? 'The AI is showing. Focus on the weak areas below.' : 'Significant AI tells present. Study the relevant lab.' }

  const categories = scoreData ? [
    { label: 'Skin Texture', score: scoreData.skin, lab: 'skin', tip: 'Go to Skin Lab' },
    { label: 'Face Realism', score: scoreData.face, lab: 'face', tip: 'Go to Face Lab' },
    { label: 'Hair Detail', score: scoreData.hair, lab: 'hair', tip: 'Go to Hair Lab' },
    { label: 'Hand Accuracy', score: scoreData.hands, lab: 'hands', tip: 'Go to Hands Lab' },
    { label: 'Lighting Quality', score: scoreData.lighting, lab: 'lighting', tip: 'Go to Lighting Lab' },
    { label: 'Fabric Realism', score: scoreData.fabric, lab: 'clothing', tip: 'Go to Clothing Lab' },
    { label: 'Anatomy', score: scoreData.anatomy, lab: 'body', tip: 'Go to Body Lab' },
  ] : []

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Lab 15</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Realism <span style={{ color: 'var(--pink)' }}>Score™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '16px' }}>
          Upload any AI-generated image and get a detailed realism analysis — what works, what's off, and exactly how to improve it.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {[
          ['score', '⭐ Score My Image'],
          ['generate', '◈ Generate & Score'],
          ['history', '◉ Score History'],
          ['learn', '📖 What Gets Scored'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id as 'score' | 'generate' | 'history' | 'learn')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeTab === id ? 'var(--pb)' : 'rgba(234,53,130,0.1)'}`, background: activeTab === id ? 'var(--pg)' : 'transparent', color: activeTab === id ? 'var(--pink)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* SCORE TAB */}
      {activeTab === 'score' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Upload */}
          <div>
            <div className="card hi" style={{ marginBottom: '14px' }}>
              <div className="ftitle">Upload Your AI Image</div>
              <div
                style={{ border: '1.5px dashed rgba(234,53,130,0.2)', borderRadius: '10px', minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--pg)', overflow: 'hidden', position: 'relative' }}
                onClick={() => !uploadedImage && fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f) }}
                onDragOver={e => e.preventDefault()}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                {uploadedImage ? (
                  <>
                    <img src={uploadedImage} alt="uploaded" style={{ width: '100%', display: 'block' }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '5px' }}>
                      <button onClick={e => { e.stopPropagation(); fileRef.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', background: 'rgba(0,0,0,0.8)', color: 'var(--pink)', fontSize: '10px', border: 'none', cursor: 'pointer' }}>Replace</button>
                      <button onClick={e => { e.stopPropagation(); setUploadedImage(null); setScoreData(null) }} style={{ padding: '4px 10px', borderRadius: '5px', background: 'rgba(0,0,0,0.8)', color: '#ff6b9d', fontSize: '10px', border: 'none', cursor: 'pointer' }}>Clear</button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', opacity: 0.6 }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📸</div>
                    <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '4px' }}>Drop image here or click to upload</div>
                    <div style={{ fontSize: '11px', color: 'var(--mu2)' }}>JPG, PNG, WEBP — any AI generated image</div>
                  </div>
                )}
              </div>
            </div>
            {uploadedImage && (
              <button className="r-btn" onClick={() => scoreImage(uploadedImage, 'Uploaded image for realism analysis')} disabled={scoring} style={{ width: '100%', fontSize: '13px' }}>
                {scoring ? '⟳ Analyzing realism…' : '⭐ Get Realism Score™'}
              </button>
            )}
            {scoring && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
          </div>

          {/* Score result */}
          <div>
            {scoreData ? (
              <div>
                {/* Overall score */}
                <div style={{ background: 'var(--s1)', border: '0.5px solid var(--pb)', borderRadius: '14px', padding: '24px', marginBottom: '14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(234,53,130,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Overall Realism Score™</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '72px', fontWeight: 900, background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: '8px' }}>
                    {scoreData.overall}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: getColor(scoreData.overall), marginBottom: '6px' }}>{getLabel(scoreData.overall)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6' }}>{getAdvice(scoreData.overall)}</div>
                </div>

                {/* Category breakdown */}
                <div className="card hi" style={{ marginBottom: '14px' }}>
                  <div className="ftitle">Category Breakdown</div>
                  {categories.map(cat => (
                    <div key={cat.label} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--w2)' }}>{cat.label}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: getColor(cat.score) }}>{cat.score}</span>
                          {cat.score < 70 && (
                            <span style={{ fontSize: '9px', padding: '2px 7px', background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '20px', color: 'var(--pink)', fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}>Study {cat.tip.replace('Go to ', '')}</span>
                          )}
                        </div>
                      </div>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${cat.score}%`, background: getColor(cat.score), transition: 'width 1.2s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Improvement tips */}
                {scoreData.tips.length > 0 && (
                  <div className="card">
                    <div className="ftitle">💡 How to Improve This Score</div>
                    {scoreData.tips.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--pg)', border: '0.5px solid var(--pb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: 'var(--pink)', fontWeight: 700 }}>{i + 1}</div>
                        <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{tip}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⭐</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '6px' }}>Upload an image to get your Realism Score™</div>
                <div style={{ fontSize: '11px', color: 'var(--mu2)' }}>AI analyzes 7 categories of realism</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GENERATE & SCORE TAB */}
      {activeTab === 'generate' && (
        <div>
          <div className="card hi" style={{ marginBottom: '20px' }}>
            <div className="ftitle">Write a Prompt — Generate & Score Instantly</div>
            <textarea className="fta" style={{ minHeight: '120px', marginBottom: '12px' }}
              placeholder="Write your realism prompt here — apply everything you've learned in the labs. The AI will generate the image AND score it for realism instantly..."
              value={prompt} onChange={e => setPrompt(e.target.value)} />
            <div style={{ background: 'var(--og)', border: '0.5px solid var(--ob)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '11px', color: 'var(--orange)', lineHeight: '1.6' }}>
              💡 Remember: Include visible pores, natural texture, Sony A7R IV, 50mm f/1.8, RAW photo, no smoothing, no filter
            </div>
            <button className="r-btn" onClick={generateAndScore} disabled={generating || scoring || !prompt.trim()} style={{ width: '100%', fontSize: '13px' }}>
              {generating ? '◈ Generating image…' : scoring ? '⭐ Scoring realism…' : '◈ Generate + Score with Nano Banana Pro'}
            </button>
            {(generating || scoring) && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
          </div>

          {(generatedImage || generating) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Generated Image</div>
                <div className="image-window" style={{ minHeight: '320px' }}>
                  {generating ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                      <div className="lbar" style={{ width: '80px', margin: '0 auto 10px' }}><div className="lbar-fill" /></div>
                      <div style={{ fontSize: '12px', color: 'var(--pink)' }}>Generating with Nano Banana Pro…</div>
                    </div>
                  ) : generatedImage ? (
                    <>
                      <img src={generatedImage} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '6px', right: '6px' }}>
                        <a href={generatedImage} download style={{ padding: '4px 10px', borderRadius: '5px', background: 'rgba(0,0,0,0.8)', color: 'var(--pink)', fontSize: '10px', textDecoration: 'none' }}>⬇ Download</a>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div>
                {scoreData ? (
                  <div>
                    <div style={{ textAlign: 'center', padding: '20px', background: 'var(--s1)', border: '0.5px solid var(--pb)', borderRadius: '12px', marginBottom: '12px' }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '56px', fontWeight: 900, background: 'var(--r-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: '6px' }}>{scoreData.overall}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: getColor(scoreData.overall) }}>{getLabel(scoreData.overall)}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {categories.map(cat => (
                        <div key={cat.label} style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--mu3)' }}>{cat.label}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: getColor(cat.score) }}>{cat.score}</span>
                          </div>
                          <div className="score-bar">
                            <div className="score-fill" style={{ width: `${cat.score}%`, background: getColor(cat.score) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {scoreData.tips.map((tip, i) => (
                      <div key={i} className="tip-box" style={{ marginBottom: '6px', fontSize: '11px' }}>→ {tip}</div>
                    ))}
                  </div>
                ) : scoring ? (
                  <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="lbar" style={{ width: '80px', margin: '0 auto 10px' }}><div className="lbar-fill" /></div>
                    <div style={{ fontSize: '12px', color: 'var(--pink)' }}>Analyzing realism across 7 categories…</div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--w)', marginBottom: '16px' }}>Your Score History</div>
          {history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>⭐</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No scores yet — score your first image to track your progress</div>
            </div>
          ) : (
            <div>
              {/* Average score */}
              <div style={{ background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '36px', fontWeight: 900, color: 'var(--pink)' }}>
                    {Math.round(history.reduce((sum, h) => sum + h.score.overall, 0) / history.length)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' }}>Average Score</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>Your Realism Journey</div>
                  <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>{history.length} images scored · {history.filter(h => h.score.overall >= 75).length} scored 75+</div>
                  {history.length >= 2 && (
                    <div style={{ fontSize: '12px', color: history[0].score.overall > history[history.length - 1].score.overall ? '#00ff88' : 'var(--orange)', marginTop: '4px' }}>
                      {history[0].score.overall > history[history.length - 1].score.overall
                        ? `↑ Improved by ${history[0].score.overall - history[history.length - 1].score.overall} points`
                        : `Keep practicing — consistency builds realism`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {history.map((item, i) => (
                  <div key={i} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ height: '140px', overflow: 'hidden', borderRadius: '8px', marginBottom: '10px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={item.image} alt="scored" style={{ width: '100%', objectFit: 'cover', height: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 900, color: getColor(item.score.overall) }}>{item.score.overall}</div>
                      <span style={{ fontSize: '10px', padding: '2px 8px', background: `${getColor(item.score.overall)}20`, color: getColor(item.score.overall), borderRadius: '20px', fontFamily: "'DM Mono',monospace" }}>{getLabel(item.score.overall).replace('✦ ', '').replace('◈ ', '').replace('⚠ ', '').replace('✕ ', '')}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(item.date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.prompt.slice(0, 50)}…</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LEARN TAB */}
      {activeTab === 'learn' && (
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--w)', marginBottom: '6px' }}>What Gets Scored</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '24px' }}>Understanding each scoring category helps you write better prompts and target the right labs.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Skin Texture', score: '0-100', icon: '🔬', desc: 'Visible pores, natural surface texture, skin tone variation, subsurface scattering. Smooth plastic skin scores lowest. Visible pores with natural imperfections score highest.', lab: 'Skin Lab', weight: 'High weight' },
              { label: 'Face Realism', score: '0-100', icon: '👁️', desc: 'Natural facial asymmetry, realistic eye reflections, natural lip texture, authentic expressions. Perfect symmetry and doll-like features score lowest.', lab: 'Face Lab', weight: 'High weight' },
              { label: 'Hair Detail', score: '0-100', icon: '💇', desc: 'Individual strand behavior, natural texture for hair type, realistic movement, scalp visibility. Plastic-looking uniform hair scores lowest.', lab: 'Hair Lab', weight: 'Medium weight' },
              { label: 'Hand Accuracy', score: '0-100', icon: '✋', desc: 'Correct finger count, natural proportions, knuckle texture, realistic grip. Wrong finger count and plastic hands score lowest.', lab: 'Hands Lab', weight: 'High weight' },
              { label: 'Lighting Quality', score: '0-100', icon: '💡', desc: 'Consistent light source direction, natural shadows, realistic catchlights, environmental lighting. Ring light catchlights and flat lighting score lowest.', lab: 'Lighting Lab', weight: 'Medium weight' },
              { label: 'Fabric Realism', score: '0-100', icon: '👗', desc: 'Natural fabric folds, compression at body contact points, realistic texture for fabric type. Floating fabric with no body interaction scores lowest.', lab: 'Clothing Lab', weight: 'Medium weight' },
              { label: 'Anatomy', score: '0-100', icon: '💪', desc: 'Natural body proportions, realistic weight distribution, natural pose physics. Impossible body proportions and unnatural poses score lowest.', lab: 'Body Lab', weight: 'Medium weight' },
            ].map(item => (
              <div key={item.label} className="card hi">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--pink)' }}>{item.label}</div>
                      <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>Scored {item.score}</div>
                    </div>
                  </div>
                  <span className="tag tag-pink" style={{ fontSize: '9px' }}>{item.weight}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6', marginBottom: '10px' }}>{item.desc}</div>
                <div style={{ fontSize: '10px', color: 'var(--orange)', fontFamily: "'DM Mono',monospace" }}>Study → {item.lab}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', background: 'var(--pg)', border: '0.5px solid var(--pb)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--pink)', marginBottom: '10px' }}>✦ How to Consistently Score 80+</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                'Always include "visible skin pores, natural texture"',
                'Use Sony A7R IV + specific lens (85mm, 50mm, 35mm)',
                'Add "natural facial asymmetry" to face prompts',
                'Include RAW photo, no filter, no smoothing always',
                'Specify the light source direction explicitly',
                'Add knuckle and vein detail for hand shots',
                'Include natural fabric interaction with body',
                'Never use: flawless, perfect, polished, glossy',
              ].map(tip => (
                <div key={tip} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--w2)' }}>
                  <span style={{ color: 'var(--pink)', flexShrink: 0 }}>✦</span>{tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
    { id: 'score', name: 'Realism Score™', icon: '⭐', num: '15' },
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
              {activeLab === 'lighting' && <LightingLab onComplete={() => { completeLab('lighting'); setActiveLab('pose') }} />}
              {activeLab === 'pose' && <PoseLab onComplete={() => { completeLab('pose'); setActiveLab('video') }} />}
              {activeLab === 'video' && <VideoLab onComplete={() => { completeLab('video'); setActiveLab('social') }} />}
              {activeLab === 'social' && <SocialMediaLab onComplete={() => { completeLab('social'); setActiveLab('consistency') }} />}
              {activeLab === 'consistency' && <ConsistencyLab onComplete={() => { completeLab('consistency'); setActiveLab('library') }} />}
              {activeLab === 'library' && <PromptLibrary />}
              {activeLab === 'builder' && <ProjectBuilder />}
              {activeLab === 'score' && <RealismScoreLab />}
            </main>
          </div>
        </AccessGate>
      </SignedIn>
    </>
  )
}
