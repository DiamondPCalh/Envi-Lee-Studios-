'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MODELS = [
  { id: 'gemini-3-pro', label: 'Nano Banana Pro', desc: 'Gemini 3 Pro Image Preview · Best realism', key: 'gemini3pro' },
  { id: 'gemini-flash', label: 'Gemini Flash', desc: 'Gemini 2.5 Flash Image · Fast generation', key: 'geminiflash' },
  { id: 'flux-pro', label: 'FLUX Pro', desc: 'FLUX Pro via fal.ai · High quality', key: 'fluxpro' },
  { id: 'flux-realism', label: 'FLUX Realism', desc: 'FLUX Realism LoRA · Ultra realistic humans', key: 'fluxrealism' },
]

const REALISM_PROMPT = `visible skin pores, natural skin texture, subtle imperfections, realistic lighting, no over-smoothing, no CGI look, natural shadows, true-to-life proportions, DSLR photography, RAW photo quality, shot on Sony A7R IV, 50mm lens f/1.8, shallow depth of field, no plastic skin, no filter, very human and real`

const SIZES = [
  { id: 'portrait', label: 'Portrait 3:4' },
  { id: 'tiktok', label: 'TikTok 9:16' },
  { id: 'landscape', label: 'Landscape 16:9' },
  { id: 'square', label: 'Square 1:1' },
]

export default function TestImagePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro')
  const [size, setSize] = useState('portrait')
  const [addRealism, setAddRealism] = useState(true)
  const [results, setResults] = useState<Array<{ model: string; imageUrl: string; time: number }>>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)

  async function generateSingle(modelId: string) {
    if (!prompt.trim()) { alert('Enter a prompt first'); return }
    setLoading(modelId)
    const start = Date.now()
    try {
      const finalPrompt = addRealism ? `${prompt}, ${REALISM_PROMPT}` : prompt
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, style: 'luxury', size, testModel: modelId }),
      })
      const data = await res.json()
      const time = ((Date.now() - start) / 1000).toFixed(1)
      if (data.imageUrl) {
        setResults(prev => [{ model: modelId, imageUrl: data.imageUrl, time: Number(time) }, ...prev])
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (e) {
      alert(`Error: ${(e as Error).message}`)
    } finally { setLoading(null) }
  }

  async function compareAll() {
    if (!prompt.trim()) { alert('Enter a prompt first'); return }
    setCompareMode(true)
    for (const model of MODELS) {
      await generateSingle(model.id)
      await new Promise(r => setTimeout(r, 500))
    }
    setCompareMode(false)
  }

  function clearResults() { setResults([]) }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(155,109,255,0.6)', fontSize: '11px', fontFamily: "'DM Mono',monospace", marginBottom: '8px', display: 'block' }}>← Back to Empire</button>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
              Image <span style={{ background: 'linear-gradient(135deg,#9b6dff,#ff6fd8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Model Tester</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(155,109,255,0.6)' }}>Test different AI image models before updating your apps — admin only</div>
          </div>
        </div>

        {/* Prompt input */}
        <div style={{ background: '#0d0a14', border: '0.5px solid rgba(155,109,255,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(155,109,255,0.6)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>Your Prompt</div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Black woman, deep brown skin, natural locs, sitting in a luxury kitchen cooking, wearing a fitted crop set, natural window light, candid moment..."
            style={{ width: '100%', background: '#130d1a', border: '0.5px solid rgba(108,86,126,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#f8f0ff', fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
            {/* Size selector */}
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(155,109,255,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '5px' }}>Size</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                {SIZES.map(s => (
                  <button key={s.id} onClick={() => setSize(s.id)}
                    style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: `0.5px solid ${size === s.id ? 'rgba(155,109,255,0.5)' : 'rgba(108,86,126,0.2)'}`, background: size === s.id ? 'rgba(155,109,255,0.1)' : 'transparent', color: size === s.id ? '#9b6dff' : 'rgba(155,109,255,0.4)', fontFamily: "'DM Sans',sans-serif" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Realism toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: addRealism ? '#9b6dff' : 'rgba(155,109,255,0.4)' }}>
              <div onClick={() => setAddRealism(!addRealism)}
                style={{ width: '36px', height: '20px', borderRadius: '10px', background: addRealism ? '#9b6dff' : 'rgba(108,86,126,0.3)', position: 'relative', cursor: 'pointer', transition: 'all .2s' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: addRealism ? '19px' : '3px', transition: 'all .2s' }} />
              </div>
              Auto-add realism keywords
            </label>

            {results.length > 0 && (
              <button onClick={clearResults} style={{ padding: '6px 12px', borderRadius: '6px', border: '0.5px solid rgba(255,45,120,0.3)', background: 'transparent', color: '#ff6b9d', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginLeft: 'auto' }}>
                Clear Results
              </button>
            )}
          </div>
        </div>

        {/* Model selector + generate buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {MODELS.map(model => (
            <div key={model.id}
              style={{ background: '#0d0a14', border: `0.5px solid ${selectedModel === model.id ? 'rgba(155,109,255,0.5)' : 'rgba(108,86,126,0.2)'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'all .2s', background: selectedModel === model.id ? 'rgba(155,109,255,0.06)' : '#0d0a14' } as React.CSSProperties}
              onClick={() => setSelectedModel(model.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '13px', fontWeight: 700, color: selectedModel === model.id ? '#9b6dff' : '#f8f0ff' }}>{model.label}</div>
                {selectedModel === model.id && <span style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(155,109,255,0.15)', color: '#9b6dff', borderRadius: '20px', fontFamily: "'DM Mono',monospace" }}>Selected</span>}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(155,109,255,0.5)', marginBottom: '10px' }}>{model.desc}</div>
              <button
                onClick={e => { e.stopPropagation(); generateSingle(model.id) }}
                disabled={loading === model.id || !!loading}
                style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: loading === model.id ? 'rgba(155,109,255,0.2)' : 'linear-gradient(135deg,#6c567e,#9b6dff)', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: loading === model.id ? 'default' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                {loading === model.id ? '⟳ Generating…' : `Test ${model.label}`}
              </button>
            </div>
          ))}
        </div>

        {/* Compare all button */}
        <button
          onClick={compareAll}
          disabled={!!loading || compareMode}
          style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: loading || compareMode ? 'rgba(155,109,255,0.15)' : 'linear-gradient(135deg,#6c567e,#9b6dff,#ff6fd8)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading || compareMode ? 'default' : 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '28px', boxShadow: '0 0 20px rgba(155,109,255,0.2)' }}>
          {compareMode ? '⟳ Generating all models for comparison…' : '✦ Compare All Models Side by Side'}
        </button>

        {/* Realism keywords preview */}
        {addRealism && (
          <div style={{ background: 'rgba(155,109,255,0.05)', border: '0.5px solid rgba(155,109,255,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '11px', color: 'rgba(155,109,255,0.5)', lineHeight: '1.6', fontFamily: "'DM Mono',monospace" }}>
            <span style={{ color: '#9b6dff', fontWeight: 600 }}>Auto-added: </span>{REALISM_PROMPT}
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(155,109,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
              Results — {results.length} generated
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {results.map((result, i) => {
                const model = MODELS.find(m => m.id === result.model)
                return (
                  <div key={i} style={{ background: '#0d0a14', border: '0.5px solid rgba(108,86,126,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ background: result.imageUrl.startsWith('data:') || result.imageUrl.startsWith('http') ? 'none' : '#130d1a', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={result.imageUrl} alt={`${result.model} result`} style={{ width: '100%', display: 'block' }} />
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: '#9b6dff' }}>{model?.label || result.model}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(155,109,255,0.5)', fontFamily: "'DM Mono',monospace" }}>{result.time}s</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(155,109,255,0.4)', marginBottom: '10px' }}>{model?.desc}</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a href={result.imageUrl} download={`${result.model}-test.jpg`} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#6c567e,#9b6dff)', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                          ⬇ Download
                        </a>
                        <button onClick={() => {
                          if (confirm(`Make ${model?.label} the primary image model for all apps?`)) {
                            localStorage.setItem('preferredImageModel', result.model)
                            alert(`${model?.label} saved as preferred! Tell the developer to update the API route.`)
                          }
                        }} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '0.5px solid rgba(155,109,255,0.3)', background: 'transparent', color: '#9b6dff', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                          ⭐ Set as Primary
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px', opacity: 0.4 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>◈</div>
            <div style={{ fontSize: '14px', color: 'rgba(155,109,255,0.6)' }}>Enter a prompt and test any model</div>
            <div style={{ fontSize: '12px', color: 'rgba(108,86,126,0.4)', marginTop: '6px' }}>Compare side by side to find the most realistic one</div>
          </div>
        )}
      </div>
    </div>
  )
}
