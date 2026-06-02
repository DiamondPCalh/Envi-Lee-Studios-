'use client'
// VideoLipSyncStudio — add as a tab in AI Studios Lip Sync section
// Upload a video + audio → Sync.so or Higgsfield syncs the lips
// Supports: MP4 video, MP3/WAV audio or ElevenLabs URL

import { useState, useRef } from 'react'

const css = `
  .vls-drag { border: 1.5px dashed rgba(0,212,255,0.2); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all .2s; background: rgba(0,212,255,0.03); position: relative; min-height: 120px; display: flex; align-items: center; justify-content: center; }
  .vls-drag:hover { border-color: #00d4ff; background: rgba(0,212,255,0.05); }
  .vls-drag input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .vls-card { background: #060a10; border: 0.5px solid rgba(0,212,255,0.15); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
  .vls-btn { padding: 12px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: linear-gradient(135deg, #00d4ff, #0066ff); color: #000; font-family: 'DM Sans', sans-serif; transition: all .2s; box-shadow: 0 0 20px rgba(0,212,255,0.2); width: 100%; }
  .vls-btn:hover { transform: translateY(-1px); box-shadow: 0 0 35px rgba(0,212,255,0.35); }
  .vls-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
  .vls-ghost { padding: 8px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid rgba(0,212,255,0.3); background: transparent; color: #00d4ff; font-family: 'DM Sans', sans-serif; transition: all .2s; }
  .vls-tab { padding: 7px 14px; border-radius: 7px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; border: 0.5px solid transparent; }
  .vls-tab.on { background: rgba(0,212,255,0.08); border-color: rgba(0,212,255,0.3); color: #00d4ff; }
  .vls-tab.off { color: #3a5060; }
  @keyframes vls-bar { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .vls-lbar { height: 2px; background: #060a10; overflow: hidden; border-radius: 1px; width: 120px; margin: 0 auto 8px; }
  .vls-lbar-fill { height: 100%; background: linear-gradient(135deg,#00d4ff,#0066ff); background-size: 200% 100%; animation: vls-bar 1.8s linear infinite; }
`

export default function VideoLipSyncStudio() {
  const [provider, setProvider] = useState<'synclabs' | 'higgsfield'>('synclabs')
  const [model, setModel] = useState('lipsync-2')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  const syncModels = [
    { id: 'lipsync-2', label: 'lipsync-2', desc: 'Most natural · Best for AI characters · $0.04/sec' },
    { id: 'lipsync-2-pro', label: 'lipsync-2-pro', desc: 'Studio grade · Preserves facial details · $0.08/sec' },
    { id: 'sync-3', label: 'sync-3', desc: 'Most powerful · 4K native · Any angle · $0.133/sec' },
  ]

  async function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function generate() {
    const hasVideo = videoFile || videoUrl.trim()
    const hasAudio = audioFile || audioUrl.trim()
    if (!hasVideo) { setError('Please upload a video or enter a video URL'); return }
    if (!hasAudio) { setError('Please upload audio or enter an ElevenLabs URL'); return }

    setLoading(true); setError(''); setResultUrl(null); setStatus('Preparing files...')

    try {
      // Build request body
      const body: Record<string, string> = {
        provider,
        model: provider === 'synclabs' ? model : 'higgsfield-speak',
      }

      if (videoFile) {
        setStatus('Uploading video...')
        body.videoData = await toBase64(videoFile)
      } else {
        body.videoUrl = videoUrl.trim()
      }

      if (audioFile) {
        setStatus('Uploading audio...')
        body.audioData = await toBase64(audioFile)
      } else {
        body.audioUrl = audioUrl.trim()
      }

      setStatus('Submitting to ' + (provider === 'synclabs' ? 'Sync.so' : 'Higgsfield') + '...')

      const res = await fetch('/api/generate/lipsync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { jobId } = data
      setStatus('Processing lip sync — usually 1-3 minutes...')

      // Poll for result
      for (let i = 0; i < 90; i++) {
        await new Promise(r => setTimeout(r, 4000))
        const poll = await fetch(`/api/generate/lipsync?jobId=${jobId}&provider=${provider}`)
        const pollData = await poll.json()

        if (pollData.status === 'completed' && pollData.videoUrl) {
          setResultUrl(pollData.videoUrl)
          setStatus('✓ Lip sync complete!')
          setLoading(false)
          return
        }
        if (pollData.status === 'failed') {
          throw new Error(pollData.error ?? 'Lip sync generation failed')
        }

        const elapsed = Math.round((i + 1) * 4)
        setStatus(`Processing... ${elapsed}s elapsed · ${pollData.syncStatus ?? 'working'}`)
      }

      throw new Error('Timed out — try again or use a shorter video')

    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: '#e8f4ff', marginBottom: '4px' }}>
        Video <span style={{ background: 'linear-gradient(135deg,#00d4ff,#0066ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lip Sync Studio</span>
      </div>
      <div style={{ fontSize: '12px', color: '#3a5060', marginBottom: '8px', lineHeight: '1.6' }}>
        Upload a video of your AI character and audio from ElevenLabs — AI syncs the lips to the voice perfectly.
      </div>
      <div style={{ background: 'rgba(0,212,255,0.06)', border: '0.5px solid rgba(0,212,255,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: '#00d4ff', fontFamily: "'DM Mono',monospace" }}>
        ✦ Powered by Sync.so + Higgsfield Speak · Upload video + audio → perfect lip sync in minutes
      </div>

      {/* Provider selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        <button className={`vls-tab ${provider === 'synclabs' ? 'on' : 'off'}`} onClick={() => setProvider('synclabs')}>
          ◈ Sync.so — Most Realistic
        </button>
        <button className={`vls-tab ${provider === 'higgsfield' ? 'on' : 'off'}`} onClick={() => setProvider('higgsfield')}>
          ⊳ Higgsfield Speak — Cinematic
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* LEFT — inputs */}
        <div>
          {/* Video upload */}
          <div className="vls-card">
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00d4ff', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid rgba(0,212,255,0.1)' }}>
              Step 1 — Your Video
            </div>
            <div className="vls-drag" onClick={() => !videoFile && videoRef.current?.click()}>
              <input ref={videoRef} type="file" accept="video/*" onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f) }} />
              {videoFile ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎬</div>
                  <div style={{ fontSize: '12px', color: '#00d4ff', marginBottom: '3px' }}>✓ {videoFile.name}</div>
                  <div style={{ fontSize: '10px', color: '#3a5060' }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  <button onClick={e => { e.stopPropagation(); setVideoFile(null) }} style={{ marginTop: '8px', padding: '3px 10px', borderRadius: '5px', border: '0.5px solid rgba(255,45,120,0.3)', background: 'transparent', color: '#ff6b9d', fontSize: '10px', cursor: 'pointer' }}>Remove</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.4 }}>🎬</div>
                  <div style={{ fontSize: '12px', color: '#6080a0', marginBottom: '3px' }}>Drag & drop your video</div>
                  <div style={{ fontSize: '10px', color: '#3a5060' }}>MP4, MOV, WebM · AI character or real video</div>
                </div>
              )}
            </div>
            {!videoFile && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '9px', color: '#3a5060', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '5px' }}>— or paste a video URL —</div>
                <input style={{ background: '#060a10', border: '0.5px solid rgba(0,212,255,0.15)', borderRadius: '7px', padding: '8px 12px', fontSize: '12px', color: '#e8f4ff', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }} placeholder="https://..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
              </div>
            )}
          </div>

          {/* Audio upload */}
          <div className="vls-card">
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00d4ff', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid rgba(0,212,255,0.1)' }}>
              Step 2 — Your Audio (from ElevenLabs)
            </div>
            <div className="vls-drag" onClick={() => !audioFile && audioRef.current?.click()}>
              <input ref={audioRef} type="file" accept="audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) setAudioFile(f) }} />
              {audioFile ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎵</div>
                  <div style={{ fontSize: '12px', color: '#00d4ff', marginBottom: '3px' }}>✓ {audioFile.name}</div>
                  <div style={{ fontSize: '10px', color: '#3a5060' }}>{(audioFile.size / 1024).toFixed(0)} KB</div>
                  <button onClick={e => { e.stopPropagation(); setAudioFile(null) }} style={{ marginTop: '8px', padding: '3px 10px', borderRadius: '5px', border: '0.5px solid rgba(255,45,120,0.3)', background: 'transparent', color: '#ff6b9d', fontSize: '10px', cursor: 'pointer' }}>Remove</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.4 }}>🎵</div>
                  <div style={{ fontSize: '12px', color: '#6080a0', marginBottom: '3px' }}>Drag & drop your audio</div>
                  <div style={{ fontSize: '10px', color: '#3a5060' }}>MP3, WAV, M4A · From ElevenLabs or any source</div>
                </div>
              )}
            </div>
            {!audioFile && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '9px', color: '#3a5060', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.7px', marginBottom: '5px' }}>— or paste an audio URL —</div>
                <input style={{ background: '#060a10', border: '0.5px solid rgba(0,212,255,0.15)', borderRadius: '7px', padding: '8px 12px', fontSize: '12px', color: '#e8f4ff', fontFamily: "'DM Sans',sans-serif", width: '100%', outline: 'none' }} placeholder="https://... (Google Drive, Dropbox, ElevenLabs link)" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} />
              </div>
            )}
          </div>

          {/* Model selector for Sync.so */}
          {provider === 'synclabs' && (
            <div className="vls-card">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00d4ff', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid rgba(0,212,255,0.1)' }}>
                Step 3 — Choose Model
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                {syncModels.map(m => (
                  <div key={m.id} onClick={() => setModel(m.id)}
                    style={{ padding: '10px 12px', background: model === m.id ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.3)', border: `0.5px solid ${model === m.id ? 'rgba(0,212,255,0.4)' : 'rgba(0,100,180,0.15)'}`, borderRadius: '9px', cursor: 'pointer', transition: 'all .2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: model === m.id ? '#00d4ff' : '#c0d8f0', fontFamily: "'DM Mono',monospace" }}>{m.label}</div>
                      {model === m.id && <div style={{ fontSize: '9px', color: '#00d4ff', fontFamily: "'DM Mono',monospace" }}>Selected ✓</div>}
                    </div>
                    <div style={{ fontSize: '10px', color: '#3a5060', marginTop: '3px' }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <button className="vls-btn" onClick={generate} disabled={loading}>
            {loading ? `${status || 'Processing...'}` : `✦ Generate Lip Sync with ${provider === 'synclabs' ? 'Sync.so' : 'Higgsfield'}`}
          </button>
          {error && (
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(255,45,120,0.08)', border: '0.5px solid rgba(255,45,120,0.25)', borderRadius: '8px', fontSize: '12px', color: '#ff6b9d' }}>
              {error}
            </div>
          )}
        </div>

        {/* RIGHT — result */}
        <div>
          <div className="vls-card" style={{ marginBottom: '14px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00d4ff', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '8px', borderBottom: '0.5px solid rgba(0,212,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Lip Synced Result</span>
              {resultUrl && <span style={{ fontSize: '9px', background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '0.5px solid rgba(0,255,136,0.3)', padding: '2px 8px', borderRadius: '4px' }}>✓ Complete</span>}
            </div>
            <div style={{ background: '#030810', borderRadius: '10px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '0.5px solid rgba(0,100,180,0.1)' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◈</div>
                  <div style={{ fontSize: '13px', color: '#00d4ff', marginBottom: '10px' }}>
                    {provider === 'synclabs' ? 'Sync.so' : 'Higgsfield'} processing...
                  </div>
                  <div className="vls-lbar"><div className="vls-lbar-fill" /></div>
                  <div style={{ fontSize: '11px', color: '#3a5060', marginTop: '6px' }}>{status}</div>
                  <div style={{ fontSize: '10px', color: '#2a3a4a', marginTop: '4px', fontFamily: "'DM Mono',monospace" }}>Usually 1-3 minutes</div>
                </div>
              ) : resultUrl ? (
                <video src={resultUrl} controls autoPlay loop style={{ width: '100%', display: 'block', borderRadius: '10px' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.1 }}>◈</div>
                  <div style={{ fontSize: '13px', color: '#3a5060' }}>Your lip synced video appears here</div>
                  <div style={{ fontSize: '11px', color: '#2a3a4a', marginTop: '6px' }}>Upload video + audio → click Generate</div>
                </div>
              )}
            </div>
            {resultUrl && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={resultUrl} download target="_blank" rel="noreferrer"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#00d4ff,#0066ff)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  ⬇ Download
                </a>
                <button onClick={generate} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '0.5px solid rgba(0,212,255,0.3)', background: 'transparent', color: '#00d4ff', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>↺ Redo</button>
                <button onClick={() => setResultUrl(null)} style={{ padding: '10px 12px', borderRadius: '8px', border: '0.5px solid rgba(255,45,120,0.3)', background: 'transparent', color: '#ff6b9d', fontSize: '12px', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="vls-card">
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: '#00d4ff', textTransform: 'uppercase' as const, letterSpacing: '.8px', marginBottom: '14px', paddingBottom: '8px', borderBottom: '0.5px solid rgba(0,212,255,0.1)' }}>
              Tips for best results
            </div>
            {[
              ['Video requirements', 'The person in the video must be facing forward and speaking or have natural mouth motion. Sync.so sync-3 can handle extreme angles.'],
              ['Audio from ElevenLabs', 'Generate your voice in ElevenLabs → download MP3 → upload here. The voice will sync perfectly to your character.'],
              ['Video length', 'Keep videos under 2 minutes for best results. Longer videos = higher cost.'],
              ['Sync.so vs Higgsfield', 'Use Sync.so lipsync-2-pro for AI characters. Use Higgsfield for cinematic, branded content.'],
              ['Soul ID workflow', 'Generate your character image with Soul ID → animate with OmniHuman → lip sync here → done.'],
            ].map(([t, d]) => (
              <div key={t} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#00d4ff', marginBottom: '2px' }}>{t}</div>
                <div style={{ fontSize: '11px', color: '#3a5060', lineHeight: '1.5' }}>{d}</div>
              </div>
            ))}
            <a href="https://elevenlabs.io" target="_blank" rel="noreferrer"
              style={{ display: 'block', marginTop: '12px', padding: '9px 14px', background: 'rgba(0,212,255,0.06)', border: '0.5px solid rgba(0,212,255,0.2)', borderRadius: '8px', fontSize: '12px', color: '#00d4ff', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
              Generate Voice in ElevenLabs ↗
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
