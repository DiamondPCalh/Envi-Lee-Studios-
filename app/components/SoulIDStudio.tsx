'use client'
// SoulIDStudio — Higgsfield Soul ID training and generation
// Add this as a tab in Academy Studios and Image Generator
// Students upload 15-20 photos → train their AI twin → generate consistent full body images forever

import { useState, useRef, useEffect } from 'react'

interface SoulID {
  id: string
  name: string
  status: string
  ready: boolean
  createdAt: string
  photoCount: number
}

const css = `
  .soul-upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    margin-top: 10px;
  }
  .soul-photo-thumb {
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    background: #0a0a0a;
    border: 1px solid rgba(0,200,100,0.15);
  }
  .soul-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .soul-photo-thumb .del {
    position: absolute; top: 3px; right: 3px;
    background: rgba(255,45,120,0.85); border: none;
    border-radius: 50%; width: 18px; height: 18px;
    color: #fff; font-size: 9px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .soul-card {
    background: #081408; border: 0.5px solid rgba(0,255,136,0.18);
    border-radius: 14px; padding: 18px; cursor: pointer; transition: all .2s;
  }
  .soul-card:hover { border-color: rgba(0,255,136,0.4); background: rgba(0,255,136,0.04); }
  .soul-card.selected { border-color: #00ff88; box-shadow: 0 0 20px rgba(0,255,136,0.12); background: rgba(0,255,136,0.06); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { animation: spin 1s linear infinite; display: inline-block; }
`

export default function SoulIDStudio() {
  const [tab, setTab] = useState<'train' | 'generate' | 'library'>('library')
  const [photos, setPhotos] = useState<string[]>([])
  const [charName, setCharName] = useState('')
  const [training, setTraining] = useState(false)
  const [trainStatus, setTrainStatus] = useState('')
  const [soulIds, setSoulIds] = useState<SoulID[]>([])
  const [selectedSoul, setSelectedSoul] = useState<SoulID | null>(null)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('4:3')
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSoulIds()
    // Load locally saved soul IDs
    const local = JSON.parse(localStorage.getItem('mySoulIds') || '[]')
    if (local.length > 0) setSoulIds(local)
  }, [])

  async function loadSoulIds() {
    try {
      const res = await fetch('/api/generate/soulid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      })
      const data = await res.json()
      if (data.soulIds && data.soulIds.length > 0) {
        const formatted = data.soulIds.map((s: Record<string, unknown>) => ({
          id: s.id ?? s.soul_id ?? s.reference_id,
          name: s.name ?? 'My AI Twin',
          status: s.status ?? 'ready',
          ready: s.status === 'completed' || s.status === 'ready' || !s.status,
          createdAt: s.created_at ?? new Date().toISOString(),
          photoCount: s.photo_count ?? s.image_count ?? 0,
        }))
        setSoulIds(formatted)
        localStorage.setItem('mySoulIds', JSON.stringify(formatted))
      }
    } catch (e) {
      console.error('Failed to load Soul IDs', e)
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setPhotos(prev => prev.length < 20 ? [...prev, ev.target?.result as string] : prev)
      }
      reader.readAsDataURL(file)
    })
  }

  async function trainSoulId() {
    if (photos.length < 5) { setError('Upload at least 5 photos. 15-20 gives the best results.'); return }
    if (!charName.trim()) { setError('Give your AI twin a name first'); return }
    setTraining(true); setError(''); setTrainStatus('Uploading your photos...')

    try {
      const res = await fetch('/api/generate/soulid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'train', photos, characterName: charName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setTrainStatus(`Training started! Soul ID: ${data.soulId}`)

      // Save locally immediately
      const newSoul: SoulID = {
        id: data.soulId,
        name: charName,
        status: 'training',
        ready: false,
        createdAt: new Date().toISOString(),
        photoCount: photos.length,
      }
      const existing = JSON.parse(localStorage.getItem('mySoulIds') || '[]')
      existing.unshift(newSoul)
      localStorage.setItem('mySoulIds', JSON.stringify(existing))
      setSoulIds(existing)

      // Poll for completion
      setTrainStatus('Training in progress — usually 3-5 minutes...')
      let attempts = 0
      const maxAttempts = 60

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 8000))
        attempts++

        const statusRes = await fetch('/api/generate/soulid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', soulId: data.soulId }),
        })
        const statusData = await statusRes.json()

        if (statusData.ready || statusData.status === 'completed') {
          setTrainStatus('✓ Training complete! Your AI twin is ready.')
          const updated = existing.map((s: SoulID) => s.id === data.soulId ? { ...s, status: 'ready', ready: true } : s)
          setSoulIds(updated)
          localStorage.setItem('mySoulIds', JSON.stringify(updated))
          setPhotos([]); setCharName('')
          setTab('library')
          break
        }

        setTrainStatus(`Training... ${Math.round((attempts / maxAttempts) * 100)}% — ${statusData.status ?? 'processing'}`)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setTraining(false)
    }
  }

  async function generateImage() {
    if (!selectedSoul) { setError('Select an AI twin first'); return }
    if (!prompt.trim()) { setError('Enter a prompt'); return }
    setGenerating(true); setImageUrl(null); setError('')

    try {
      const res = await fetch('/api/generate/soulid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', soulId: selectedSoul.id, prompt, style, aspectRatio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.imageUrl) { setImageUrl(data.imageUrl); setGenerating(false); return }

      if (data.requestId) {
        // Poll for result
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 4000))
          const poll = await fetch(`/api/generate/soulid?requestId=${data.requestId}`)
          const pollData = await poll.json()
          if (pollData.status === 'completed' && pollData.imageUrl) {
            setImageUrl(pollData.imageUrl)
            setGenerating(false)
            return
          }
          if (pollData.status === 'failed') throw new Error('Generation failed')
        }
        throw new Error('Timed out — try again')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const stylePresets = [
    '', 'Amalfi Summer', 'Street Editorial', 'Studio Fashion', 'Golden Hour',
    'Night Out', 'Gym Lifestyle', 'Luxury Interior', 'Urban Street', 'Cinematic',
  ]

  const quickPrompts = [
    'Full body lifestyle shot in a luxury kitchen cooking, wearing a fitted crop set, natural lighting, photorealistic',
    'Walking down a city street in designer streetwear, confident stride, golden hour, full body shot',
    'Standing by a pool in a swimsuit at a luxury resort, editorial fashion photography',
    'Sitting at a restaurant bar holding a wine glass, candid lifestyle, warm lighting',
    'Full body shot in a pink and black kitchen preparing food, casual and authentic',
    'On a rooftop in a crop top and jeans, NYC skyline behind, magic hour light',
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '24px', fontWeight: 800, color: '#e8fff0', marginBottom: '4px' }}>
        Soul ID <span style={{ background: 'linear-gradient(135deg,#00ff88,#00cc66)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: '#4a8060', marginBottom: '8px', lineHeight: '1.6' }}>
        Powered by Higgsfield Soul ID — upload 15-20 photos of your AI twin and train a digital double. Same face, same body, every generation.
      </div>
      <div style={{ background: 'rgba(0,255,136,0.06)', border: '0.5px solid rgba(0,255,136,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: '#00ff88', fontFamily: "'DM Mono',monospace" }}>
        ✦ Higgsfield Soul ID · Full body + face consistency · ~$3 per training · 3-5 min training time
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {([['library', '◉ My AI Twins'], ['train', '✦ Train New Twin'], ['generate', '◈ Generate']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', border: `0.5px solid ${tab === id ? 'rgba(0,255,136,0.4)' : 'rgba(0,200,100,0.1)'}`, background: tab === id ? 'rgba(0,255,136,0.08)' : 'transparent', color: tab === id ? '#00ff88' : '#4a8060' }}>
            {label}
          </button>
        ))}
        <button onClick={loadSoulIds} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid rgba(0,200,100,0.1)', background: 'transparent', color: '#4a8060', fontFamily: "'DM Sans',sans-serif", marginLeft: 'auto' }}>
          ↺ Refresh
        </button>
      </div>

      {/* LIBRARY */}
      {tab === 'library' && (
        <div>
          {soulIds.length === 0 ? (
            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.2 }}>◉</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 700, color: '#00ff88', marginBottom: '8px' }}>No AI twins trained yet</div>
              <div style={{ fontSize: '13px', color: '#4a8060', lineHeight: '1.7', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
                Train your first Soul ID — upload 15-20 photos of your AI character and Higgsfield locks in their exact face and body forever.
              </div>
              <button onClick={() => setTab('train')} style={{ padding: '11px 24px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#00ff88,#00cc66)', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Train Your First AI Twin ↗
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '10px', color: 'rgba(0,255,136,0.4)', fontFamily: "'DM Mono',monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
                {soulIds.length} AI Twin{soulIds.length !== 1 ? 's' : ''} trained
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {soulIds.map(soul => (
                  <div key={soul.id} className={`soul-card${selectedSoul?.id === soul.id ? ' selected' : ''}`}
                    onClick={() => { setSelectedSoul(soul); setTab('generate') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '1.5px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#00ff88' }}>◉</div>
                      <div style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '20px', background: soul.ready ? 'rgba(0,255,136,0.1)' : 'rgba(255,230,0,0.1)', color: soul.ready ? '#00ff88' : '#ffe600', fontFamily: "'DM Mono',monospace", border: `0.5px solid ${soul.ready ? 'rgba(0,255,136,0.3)' : 'rgba(255,230,0,0.3)'}` }}>
                        {soul.ready ? '✓ Ready' : <><span className="spinner">⟳</span> Training</>}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: '#00ff88', marginBottom: '4px' }}>{soul.name}</div>
                    <div style={{ fontSize: '10px', color: '#4a8060', fontFamily: "'DM Mono',monospace", marginBottom: '10px' }}>
                      {soul.photoCount > 0 ? `${soul.photoCount} photos` : 'Soul ID trained'} · {new Date(soul.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#4a8060', fontFamily: "'DM Mono',monospace", background: 'rgba(0,0,0,0.3)', padding: '5px 8px', borderRadius: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {soul.id}
                    </div>
                    <div style={{ marginTop: '12px', padding: '8px 12px', background: soul.ready ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '7px', fontSize: '11px', fontWeight: 600, color: soul.ready ? '#00ff88' : '#4a8060', textAlign: 'center', cursor: soul.ready ? 'pointer' : 'default' }}>
                      {soul.ready ? 'Generate with this twin →' : 'Training in progress...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRAIN */}
      {tab === 'train' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,255,136,0.1)' }}>
                Step 1 — Name Your AI Twin
              </div>
              <input
                style={{ background: '#051008', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e8fff0', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }}
                placeholder="e.g. Luxe Envi, Nova Star, My AI Twin"
                value={charName}
                onChange={e => setCharName(e.target.value)}
              />
            </div>

            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,255,136,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Step 2 — Upload Photos ({photos.length}/20)</span>
                <span style={{ color: photos.length >= 15 ? '#00ff88' : photos.length >= 5 ? '#ffe600' : '#ff6b9d' }}>
                  {photos.length >= 15 ? '✓ Great!' : photos.length >= 5 ? 'Good — add more' : 'Need more'}
                </span>
              </div>

              {/* Upload zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: '1.5px dashed rgba(0,255,136,0.25)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,255,136,0.03)', marginBottom: '10px', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00ff88'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.25)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.03)' }}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoUpload} />
                <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.5 }}>📸</div>
                <div style={{ fontSize: '13px', color: '#c0f0d0', marginBottom: '3px' }}>Click to upload photos</div>
                <div style={{ fontSize: '11px', color: '#4a8060' }}>Select multiple at once · JPG, PNG · Up to 20 photos</div>
              </div>

              {/* Photo grid */}
              {photos.length > 0 && (
                <div className="soul-upload-grid">
                  {photos.map((photo, i) => (
                    <div key={i} className="soul-photo-thumb">
                      <img src={photo} alt={`Photo ${i + 1}`} />
                      <button className="del" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Train button */}
            <button
              onClick={trainSoulId}
              disabled={training || photos.length < 5 || !charName.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: training || photos.length < 5 ? 'rgba(0,255,136,0.15)' : 'linear-gradient(135deg,#00ff88,#00cc66)', color: training || photos.length < 5 ? '#4a8060' : '#000', fontSize: '14px', fontWeight: 700, cursor: training || photos.length < 5 ? 'default' : 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', boxShadow: training ? 'none' : '0 0 20px rgba(0,255,136,0.25)' }}>
              {training ? <><span className="spinner">⟳</span> {trainStatus || 'Training...'}</> : `✦ Train Soul ID — ${charName || 'My AI Twin'}`}
            </button>

            {trainStatus && !training && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(0,255,136,0.06)', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '8px', fontSize: '12px', color: '#00ff88', fontFamily: "'DM Mono',monospace" }}>
                {trainStatus}
              </div>
            )}
            {error && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(255,45,120,0.08)', border: '0.5px solid rgba(255,45,120,0.25)', borderRadius: '8px', fontSize: '12px', color: '#ff6b9d' }}>
                {error}
              </div>
            )}
          </div>

          {/* Tips */}
          <div>
            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,255,136,0.1)' }}>Photo tips for best results</div>
              {[
                ['20 photos is ideal', 'The more photos you upload the more consistent the results. 15-20 is the sweet spot.'],
                ['Include full body shots', 'At least 3-5 photos showing full body so Soul ID learns body proportions'],
                ['Vary the angles', 'Front, side, 3/4 view — give the AI a full picture of your character'],
                ['Different expressions', 'Smiling, serious, looking away — varied expressions = better results'],
                ['Good lighting', 'Avoid heavy shadows, sunglasses, or blurry photos'],
                ['Same person every photo', 'All photos must be the same character — no mixing different people'],
                ['From your AI tools', 'Use photos generated in Flow, Midjourney, or any AI tool — works great'],
              ].map(([t, d]) => (
                <div key={t} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#00ff88', marginBottom: '2px' }}>{t}</div>
                  <div style={{ fontSize: '11px', color: '#4a8060', lineHeight: '1.5' }}>{d}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,255,136,0.1)' }}>What Soul ID does</div>
              <div style={{ fontSize: '12px', color: '#4a8060', lineHeight: '1.8' }}>
                Soul ID creates a permanent digital twin of your AI character. After training, every image you generate will have the <span style={{ color: '#00ff88' }}>exact same face, body type, skin tone, and proportions</span> — regardless of outfit, location, lighting, or scene. <br /><br />
                This is how you create content like the lifestyle cooking photos — same person, different scenes, completely consistent.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE */}
      {tab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            {/* Select Soul ID */}
            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,255,136,0.1)' }}>Select Your AI Twin</div>
              {soulIds.filter(s => s.ready).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#4a8060', fontSize: '12px' }}>
                  No trained twins yet — <button onClick={() => setTab('train')} style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans',sans-serif" }}>train one first ↗</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  {soulIds.filter(s => s.ready).map(soul => (
                    <div key={soul.id} onClick={() => setSelectedSoul(soul)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: selectedSoul?.id === soul.id ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)', border: `0.5px solid ${selectedSoul?.id === soul.id ? '#00ff88' : 'rgba(0,200,100,0.1)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all .2s' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: `1.5px solid ${selectedSoul?.id === soul.id ? '#00ff88' : 'rgba(0,255,136,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#00ff88', flexShrink: 0 }}>◉</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: selectedSoul?.id === soul.id ? '#00ff88' : '#c0f0d0' }}>{soul.name}</div>
                        <div style={{ fontSize: '10px', color: '#4a8060', fontFamily: "'DM Mono',monospace" }}>{soul.photoCount > 0 ? `${soul.photoCount} photos` : 'Trained'} · {new Date(soul.createdAt).toLocaleDateString()}</div>
                      </div>
                      {selectedSoul?.id === soul.id && <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#00ff88' }}>✓ Selected</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid rgba(0,255,136,0.1)' }}>Describe Your Scene</div>
              <textarea
                style={{ background: '#051008', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#e8fff0', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none', resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                placeholder="e.g. Full body lifestyle shot in a luxury kitchen cooking, wearing a fitted crop set, natural lighting, photorealistic, fashion editorial..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: '#4a8060', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '5px' }}>Style preset</label>
                  <select style={{ background: '#051008', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: '#e8fff0', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }} value={style} onChange={e => setStyle(e.target.value)}>
                    {stylePresets.map(s => <option key={s} value={s}>{s || 'No preset'}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: '#4a8060', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '5px' }}>Aspect ratio</label>
                  <select style={{ background: '#051008', border: '0.5px solid rgba(0,255,136,0.15)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: '#e8fff0', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                    {['4:3', '3:4', '16:9', '9:16', '1:1'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={generating || !selectedSoul || !prompt.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: generating || !selectedSoul || !prompt.trim() ? 'rgba(0,255,136,0.1)' : 'linear-gradient(135deg,#00ff88,#00cc66)', color: generating || !selectedSoul || !prompt.trim() ? '#4a8060' : '#000', fontSize: '14px', fontWeight: 700, cursor: generating || !selectedSoul || !prompt.trim() ? 'default' : 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', boxShadow: generating ? 'none' : '0 0 20px rgba(0,255,136,0.25)' }}>
              {generating ? <><span className="spinner">⟳</span> Generating with Soul ID...</> : `✦ Generate with ${selectedSoul?.name ?? 'Soul ID'}`}
            </button>

            {error && <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(255,45,120,0.08)', border: '0.5px solid rgba(255,45,120,0.25)', borderRadius: '8px', fontSize: '12px', color: '#ff6b9d' }}>{error}</div>}

            {/* Quick prompts */}
            <div style={{ marginTop: '14px', background: '#081408', border: '0.5px solid rgba(0,255,136,0.12)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>Quick Prompts</div>
              {quickPrompts.map(q => (
                <button key={q.slice(0, 20)} onClick={() => setPrompt(q)}
                  style={{ display: 'block', width: '100%', marginBottom: '6px', padding: '8px 12px', background: 'rgba(0,255,136,0.03)', border: '0.5px solid rgba(0,200,100,0.1)', borderRadius: '7px', fontSize: '11px', color: '#4a8060', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", lineHeight: '1.4', transition: 'all .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00ff88'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a8060'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,100,0.1)' }}>
                  {q.slice(0, 90)}… ↗
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div>
            <div style={{ background: '#081408', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'rgba(0,255,136,0.04)', borderBottom: '0.5px solid rgba(0,255,136,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '.8px' }}>
                  {selectedSoul ? `◉ ${selectedSoul.name} — Soul ID Locked` : 'Generated Image'}
                </div>
                {imageUrl && <div style={{ fontSize: '9px', color: '#00ff88', fontFamily: "'DM Mono',monospace', background: 'rgba(0,255,136,0.1)', padding: '2px 8px', borderRadius: '4px" }}>🔒 Face + Body Locked</div>}
              </div>
              <div style={{ minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#051008', overflow: 'hidden' }}>
                {generating ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>◉</div>
                    <div style={{ fontSize: '13px', color: '#00ff88', marginBottom: '10px' }}>Soul ID generating...</div>
                    <div style={{ height: '2px', background: '#0a1a0a', overflow: 'hidden', borderRadius: '1px', width: '100px', margin: '0 auto 10px' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(135deg,#00ff88,#00cc66)', backgroundSize: '200% 100%', animation: 'lbar 1.8s linear infinite', borderRadius: '1px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a8060' }}>Usually 15-30 seconds</div>
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Soul ID generation" style={{ width: '100%', display: 'block' }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.1 }}>◉</div>
                    <div style={{ fontSize: '13px', color: '#4a8060' }}>Your image appears here</div>
                    <div style={{ fontSize: '11px', color: '#4a8060', marginTop: '6px' }}>Select a twin → write a prompt → generate</div>
                  </div>
                )}
              </div>
              {imageUrl && (
                <div style={{ padding: '14px', display: 'flex', gap: '8px' }}>
                  <a href={imageUrl} download target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#00ff88,#00cc66)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                    ⬇ Download
                  </a>
                  <button onClick={generateImage} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '0.5px solid rgba(0,255,136,0.25)', background: 'transparent', color: '#00ff88', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>↺ Regenerate</button>
                  <button onClick={() => setImageUrl(null)} style={{ padding: '10px 12px', borderRadius: '8px', border: '0.5px solid rgba(255,45,120,0.25)', background: 'transparent', color: '#ff6b9d', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
