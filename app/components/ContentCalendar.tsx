'use client'
// ContentCalendar — AI-powered or manual content calendar with PDF download
// Add this as a section in the Prompt Bank main library

import { useState } from 'react'

interface CalendarEntry {
  day: number
  date: string
  platform: string
  category: string
  contentType: string
  postTime: string
  idea: string
  captionHook: string
  hashtagTheme: string
  custom?: string
}

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube Shorts', 'Facebook', 'Pinterest', 'Twitter/X']
const CONTENT_CATS = [
  'Luxury Lifestyle', 'CEO Baddie', 'Fashion Influencer', 'Gym Girl',
  'GRWM', 'Travel Vlogs', 'Beauty Content', 'Soft Life', 'Rich Girl Energy',
  'AI Reality Show', 'Faceless Content', 'Product Ads', 'UGC Content',
]

export default function ContentCalendar() {
  const [mode, setMode] = useState<'choose' | 'ai' | 'manual' | 'view'>('choose')
  const [calType, setCalType] = useState<'week' | '30day'>('week')
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [editingDay, setEditingDay] = useState<number | null>(null)

  // AI form
  const [niche, setNiche] = useState('Luxury Lifestyle')
  const [platforms, setPlatforms] = useState('TikTok, Instagram')
  const [categories, setCategories] = useState('Luxury Lifestyle, CEO Baddie')
  const [postsPerWeek, setPostsPerWeek] = useState('5')

  // Manual entry
  const [manualEntry, setManualEntry] = useState<Partial<CalendarEntry>>({})

  async function generateAI() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'calendar',
          niche, platforms, categories, postsPerWeek,
          calendarType: calType,
        }),
      })
      const data = await res.json()
      try {
        const parsed = JSON.parse(data.result)
        if (Array.isArray(parsed)) {
          setEntries(parsed)
          setMode('view')
        }
      } catch {
        // Parse as text and create basic entries
        const lines = data.result.split('\n').filter((l: string) => l.trim())
        const basic: CalendarEntry[] = lines.slice(0, calType === 'week' ? 7 : 30).map((line: string, i: number) => ({
          day: i + 1,
          date: `Day ${i + 1}`,
          platform: 'TikTok',
          category: niche,
          contentType: 'Lifestyle',
          postTime: '7:00 PM EST',
          idea: line,
          captionHook: '',
          hashtagTheme: '',
        }))
        setEntries(basic)
        setMode('view')
      }
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  function addManualEntry() {
    if (!manualEntry.idea?.trim()) return
    const newEntry: CalendarEntry = {
      day: entries.length + 1,
      date: manualEntry.date || `Day ${entries.length + 1}`,
      platform: manualEntry.platform || 'TikTok',
      category: manualEntry.category || niche,
      contentType: manualEntry.contentType || 'Lifestyle',
      postTime: manualEntry.postTime || '7:00 PM EST',
      idea: manualEntry.idea || '',
      captionHook: manualEntry.captionHook || '',
      hashtagTheme: manualEntry.hashtagTheme || '',
    }
    setEntries(prev => [...prev, newEntry])
    setManualEntry({})
  }

  function updateEntry(day: number, field: keyof CalendarEntry, value: string) {
    setEntries(prev => prev.map(e => e.day === day ? { ...e, [field]: value } : e))
  }

  function removeEntry(day: number) {
    setEntries(prev => prev.filter(e => e.day !== day))
  }

  async function downloadPDF() {
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 32px; }
  h1 { font-size: 24px; text-align: center; margin-bottom: 4px; color: #000; }
  h2 { font-size: 12px; text-align: center; color: #888; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase; }
  .divider { width: 60px; height: 3px; background: #ff2d78; margin: 0 auto 28px; }
  .entry { border: 1px solid #eee; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; page-break-inside: avoid; }
  .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .day-badge { background: #ff2d78; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
  .platform-badge { background: #f0f0f0; color: #555; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
  .time { font-size: 11px; color: #888; }
  .idea { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 6px; }
  .category { font-size: 11px; color: #ff2d78; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
  .hook { font-size: 12px; color: #444; margin-bottom: 4px; font-style: italic; }
  .hashtags { font-size: 11px; color: #888; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #ccc; }
</style>
</head>
<body>
  <h1>Content Calendar</h1>
  <h2>${calType === '30day' ? '30-Day' : '7-Day'} Content Plan — Envi Lee Creator Studios™</h2>
  <div class="divider"></div>
  ${entries.map(e => `
  <div class="entry">
    <div class="entry-header">
      <span class="day-badge">Day ${e.day} — ${e.date}</span>
      <span class="platform-badge">${e.platform}</span>
      <span class="time">${e.postTime}</span>
    </div>
    <div class="category">${e.category} · ${e.contentType}</div>
    <div class="idea">${e.idea}</div>
    ${e.captionHook ? `<div class="hook">"${e.captionHook}"</div>` : ''}
    ${e.hashtagTheme ? `<div class="hashtags">${e.hashtagTheme}</div>` : ''}
  </div>
  `).join('')}
  <div class="footer">Envi Lee Creator Studios™ · Baddie Prompt Bank · Generated ${new Date().toLocaleDateString()}</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      win.onload = () => {
        win.print()
        URL.revokeObjectURL(url)
      }
    }
  }

  const css = `
    .cal-inp { background: #0d0415; border: 0.5px solid rgba(192,132,252,0.2); border-radius: 7px; padding: 8px 12px; font-size: 12px; color: #fff0ff; font-family: 'DM Sans',sans-serif; width: 100%; outline: none; }
    .cal-sel { background: #0d0415; border: 0.5px solid rgba(192,132,252,0.2); border-radius: 7px; padding: 7px 10px; font-size: 12px; color: #fff0ff; font-family: 'DM Sans',sans-serif; width: 100%; outline: none; }
    .cal-btn { padding: 10px 18px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; background: linear-gradient(135deg,#ff6fd8,#c084fc,#a855f7); color: #fff; font-family: 'DM Sans',sans-serif; transition: all .2s; }
    .cal-btn:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(192,132,252,0.3); }
    .cal-btn:disabled { opacity: 0.5; cursor: default; transform: none; }
    .cal-ghost { padding: 7px 14px; border-radius: 7px; font-size: 11px; cursor: pointer; border: 0.5px solid rgba(255,111,216,0.3); background: transparent; color: #ff6fd8; font-family: 'DM Sans',sans-serif; }
    .cal-entry { background: #110520; border: 0.5px solid rgba(192,132,252,0.15); border-radius: 10px; padding: 14px; margin-bottom: 10px; }
    .cal-label { font-size: 9px; font-weight: 600; color: #8a40a0; text-transform: uppercase; letter-spacing: .7px; font-family: 'DM Mono',monospace; display: block; margin-bottom: 4px; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ background: '#06020a', border: '0.5px solid rgba(192,132,252,0.15)', borderRadius: '14px', padding: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '18px', fontWeight: 800, color: '#fff0ff' }}>
              📅 Content <span style={{ color: '#ff6fd8' }}>Calendar</span>
            </div>
            <div style={{ fontSize: '11px', color: '#8a40a0', marginTop: '2px' }}>AI-generated or fill it yourself — download as PDF</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {entries.length > 0 && (
              <button className="cal-btn" onClick={downloadPDF} style={{ fontSize: '11px', padding: '7px 14px' }}>⬇ Download PDF</button>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['week', '7 Days'], ['30day', '30 Days']].map(([id, label]) => (
                <button key={id} onClick={() => setCalType(id as 'week' | '30day')}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '10px', cursor: 'pointer', border: `0.5px solid ${calType === id ? 'rgba(255,111,216,0.4)' : 'rgba(192,132,252,0.15)'}`, background: calType === id ? 'rgba(255,111,216,0.08)' : 'transparent', color: calType === id ? '#ff6fd8' : '#8a40a0', fontFamily: "'DM Sans',sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CHOOSE MODE */}
        {mode === 'choose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div onClick={() => setMode('ai')} style={{ background: '#110520', border: '0.5px solid rgba(255,111,216,0.2)', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,111,216,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,111,216,0.2)')}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>✦</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: '#ff6fd8', marginBottom: '4px' }}>AI Fills It For Me</div>
              <div style={{ fontSize: '12px', color: '#8a40a0', lineHeight: '1.6' }}>Tell AI your niche and platforms — it generates your full {calType === '30day' ? '30-day' : '7-day'} plan automatically</div>
            </div>
            <div onClick={() => { setMode('manual'); setEntries([]) }} style={{ background: '#110520', border: '0.5px solid rgba(192,132,252,0.2)', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(192,132,252,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(192,132,252,0.2)')}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>◈</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '15px', fontWeight: 700, color: '#c084fc', marginBottom: '4px' }}>I'll Fill It Myself</div>
              <div style={{ fontSize: '12px', color: '#8a40a0', lineHeight: '1.6' }}>Add your own content ideas day by day — full control over your calendar</div>
            </div>
          </div>
        )}

        {/* AI MODE */}
        {mode === 'ai' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label className="cal-label">Your niche</label>
                <select className="cal-sel" value={niche} onChange={e => setNiche(e.target.value)}>
                  {CONTENT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="cal-label">Posts per week</label>
                <select className="cal-sel" value={postsPerWeek} onChange={e => setPostsPerWeek(e.target.value)}>
                  {['3', '4', '5', '6', '7', '10', '14'].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="cal-label">Platforms</label>
                <input className="cal-inp" placeholder="TikTok, Instagram, YouTube" value={platforms} onChange={e => setPlatforms(e.target.value)} />
              </div>
              <div>
                <label className="cal-label">Content categories to mix</label>
                <input className="cal-inp" placeholder="CEO Baddie, Luxury Lifestyle, GRWM" value={categories} onChange={e => setCategories(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="cal-btn" onClick={generateAI} disabled={loading} style={{ flex: 1 }}>
                {loading ? `⟳ Building your ${calType === '30day' ? '30-day' : '7-day'} calendar…` : `✦ Generate My ${calType === '30day' ? '30-Day' : '7-Day'} Calendar`}
              </button>
              <button className="cal-ghost" onClick={() => setMode('choose')}>Back</button>
            </div>
          </div>
        )}

        {/* MANUAL MODE */}
        {mode === 'manual' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label className="cal-label">Platform</label>
                <select className="cal-sel" value={manualEntry.platform || 'TikTok'} onChange={e => setManualEntry(m => ({ ...m, platform: e.target.value }))}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="cal-label">Category</label>
                <select className="cal-sel" value={manualEntry.category || ''} onChange={e => setManualEntry(m => ({ ...m, category: e.target.value }))}>
                  <option value="">Select...</option>
                  {CONTENT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="cal-label">Post time</label>
                <input className="cal-inp" placeholder="7:00 PM EST" value={manualEntry.postTime || ''} onChange={e => setManualEntry(m => ({ ...m, postTime: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label className="cal-label">Content idea</label>
              <input className="cal-inp" placeholder="e.g. Morning routine as a CEO baddie — candid and real" value={manualEntry.idea || ''} onChange={e => setManualEntry(m => ({ ...m, idea: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label className="cal-label">Caption hook (optional)</label>
              <input className="cal-inp" placeholder="e.g. Nobody talks about the 5am version of success..." value={manualEntry.captionHook || ''} onChange={e => setManualEntry(m => ({ ...m, captionHook: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button className="cal-btn" onClick={addManualEntry} disabled={!manualEntry.idea?.trim()} style={{ fontSize: '12px', padding: '9px 16px' }}>+ Add to Calendar</button>
              <button className="cal-ghost" onClick={() => setMode('choose')}>Back</button>
              {entries.length > 0 && <button className="cal-ghost" onClick={() => setMode('view')}>View Calendar →</button>}
            </div>
            {entries.length > 0 && (
              <div style={{ fontSize: '11px', color: '#8a40a0', fontFamily: "'DM Mono',monospace" }}>{entries.length} entries added</div>
            )}
          </div>
        )}

        {/* VIEW CALENDAR */}
        {mode === 'view' && entries.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button className="cal-ghost" onClick={() => setMode(mode === 'view' ? 'manual' : 'view')} style={{ fontSize: '11px' }}>+ Add Entry</button>
              <button className="cal-ghost" onClick={() => setMode('ai')} style={{ fontSize: '11px' }}>⟳ Regenerate</button>
              <button className="cal-ghost" onClick={() => { setEntries([]); setMode('choose') }} style={{ fontSize: '11px', borderColor: 'rgba(255,45,120,0.3)', color: '#ff6b9d' }}>Clear All</button>
              <button className="cal-btn" onClick={downloadPDF} style={{ fontSize: '11px', padding: '7px 14px', marginLeft: 'auto' }}>⬇ Download PDF</button>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
              {entries.map(entry => (
                <div key={entry.day} className="cal-entry">
                  {editingDay === entry.day ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label className="cal-label">Platform</label>
                          <select className="cal-sel" value={entry.platform} onChange={e => updateEntry(entry.day, 'platform', e.target.value)}>
                            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="cal-label">Post time</label>
                          <input className="cal-inp" value={entry.postTime} onChange={e => updateEntry(entry.day, 'postTime', e.target.value)} />
                        </div>
                        <div>
                          <label className="cal-label">Category</label>
                          <input className="cal-inp" value={entry.category} onChange={e => updateEntry(entry.day, 'category', e.target.value)} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label className="cal-label">Content idea</label>
                        <input className="cal-inp" value={entry.idea} onChange={e => updateEntry(entry.day, 'idea', e.target.value)} />
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label className="cal-label">Caption hook</label>
                        <input className="cal-inp" value={entry.captionHook} onChange={e => updateEntry(entry.day, 'captionHook', e.target.value)} />
                      </div>
                      <button className="cal-ghost" onClick={() => setEditingDay(null)} style={{ fontSize: '11px' }}>Done ✓</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'linear-gradient(135deg,#ff6fd8,#c084fc)', borderRadius: '20px', color: '#fff', fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>Day {entry.day}</span>
                          <span style={{ fontSize: '10px', padding: '2px 8px', background: '#110520', border: '0.5px solid rgba(192,132,252,0.2)', borderRadius: '20px', color: '#c084fc', fontFamily: "'DM Mono',monospace" }}>{entry.platform}</span>
                          <span style={{ fontSize: '10px', color: '#8a40a0', fontFamily: "'DM Mono',monospace" }}>{entry.postTime}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setEditingDay(entry.day)} style={{ padding: '3px 8px', borderRadius: '5px', border: '0.5px solid rgba(192,132,252,0.2)', background: 'transparent', color: '#c084fc', fontSize: '10px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => removeEntry(entry.day)} style={{ padding: '3px 8px', borderRadius: '5px', border: '0.5px solid rgba(255,45,120,0.2)', background: 'transparent', color: '#ff6b9d', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: '#ff6fd8', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '4px' }}>{entry.category} · {entry.contentType}</div>
                      <div style={{ fontSize: '13px', color: '#fff0ff', fontWeight: 600, marginBottom: '4px' }}>{entry.idea}</div>
                      {entry.captionHook && <div style={{ fontSize: '12px', color: '#8a40a0', fontStyle: 'italic', marginBottom: '3px' }}>"{entry.captionHook}"</div>}
                      {entry.hashtagTheme && <div style={{ fontSize: '11px', color: '#4a1060' }}>{entry.hashtagTheme}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
