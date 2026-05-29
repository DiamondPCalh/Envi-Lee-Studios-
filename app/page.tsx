'use client'
import { useState, useEffect } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const APPS = [
  {
    id: 'pod',
    name: 'POD Studios™',
    full: 'Envi Lee POD Studios™',
    desc: 'Mockup generator, design studio, AI model scenes, export tools, virtual shopping',
    icon: '◈',
    path: '/pod',
    accent: '#ff6b6b',
    accent2: '#ffd93d',
    accent3: '#6bcb77',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)',
    border: 'rgba(255,107,107,0.4)',
    glow: 'rgba(255,107,107,0.15)',
    tag: 'POD Sellers',
    tools: ['Mockup Generator', 'Design Studio', 'AI Model Scene', 'Export Tools', 'Virtual Store'],
  },
  {
    id: 'ai',
    name: 'AI Studios™',
    full: 'Envi Lee AI Studios™',
    desc: 'Content creation, CineFlow AI, brand deals, lip sync, storyboard, video generation, show production',
    icon: '⊳',
    path: '/ai-studios',
    accent: '#00d4ff',
    accent2: '#0099ff',
    gradient: 'linear-gradient(135deg, #00d4ff, #0066ff)',
    border: 'rgba(0,212,255,0.4)',
    glow: 'rgba(0,212,255,0.15)',
    tag: 'All Creators',
    tools: ['CineFlow AI', 'Brand Deals', 'Lip Sync', 'Storyboard', 'Video Generator'],
  },
  {
    id: 'music',
    name: 'Music Studios™',
    full: 'Envi Lee Music Studios™',
    desc: 'AI lyrics, beat generator, voice cloning, artist development, community, DistroKid access',
    icon: '♪',
    path: '/music',
    accent: '#ffe600',
    accent2: '#ffaa00',
    gradient: 'linear-gradient(135deg, #ffe600, #ff8800)',
    border: 'rgba(255,230,0,0.4)',
    glow: 'rgba(255,230,0,0.15)',
    tag: 'Music Artists',
    tools: ['AI Lyrics', 'Beat Generator', 'Voice Studio', 'Artist Dev', 'Community'],
  },
  {
    id: 'academy',
    name: 'Academy Studios™',
    full: 'Envi Lee Academy Studios™',
    desc: 'Build your AI twin, AUREN framework, virtual wardrobe, cinematic content shop, media kit',
    icon: '✦',
    path: '/academy',
    accent: '#b06cff',
    accent2: '#e8c76a',
    gradient: 'linear-gradient(135deg, #7c3aed, #b06cff)',
    border: 'rgba(176,108,255,0.4)',
    glow: 'rgba(176,108,255,0.15)',
    tag: 'Academy Students',
    tools: ['AI Twin Builder', 'AUREN Framework', 'Virtual Store', 'Content Shop', 'Media Kit'],
    hasBaddie: true,
    hasKings: true,
  },
  {
    id: 'suite',
    name: 'Creator Suite™',
    full: 'Envi Lee Creator Suite™',
    desc: 'Profit calculator, consistent characters, saved work, all creator tools in one place',
    icon: '◉',
    path: '/suite',
    accent: '#00ff88',
    accent2: '#00cc66',
    gradient: 'linear-gradient(135deg, #00ff88, #00cc66)',
    border: 'rgba(0,255,136,0.4)',
    glow: 'rgba(0,255,136,0.15)',
    tag: 'All Students',
    tools: ['Profit Calculator', 'Consistent Characters', 'Saved Work', 'All Tools', 'Templates'],
  },
]

export default function HomePage() {
  const { user } = useUser()
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)
  const [currentDate] = useState(new Date())

  return (
    <>
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div style={{
          minHeight: '100vh',
          background: '#000',
          color: '#f8f0ff',
          fontFamily: "'DM Sans', sans-serif",
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background */}
          <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 20% 20%, rgba(108,86,126,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(155,109,255,0.05) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(108,86,126,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(108,86,126,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none', zIndex: 0 }} />

          {/* TOPBAR */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.95)',
            borderBottom: '0.5px solid rgba(108,86,126,0.2)',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="36" height="36" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray="240" strokeDashoffset="25" />
                <text x="50" y="60" textAnchor="middle" fill="white" fontSize="34" fontFamily="Cormorant Garamond, serif" fontWeight="400">EL</text>
              </svg>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 500, color: '#f8f0ff', letterSpacing: '1px' }}>Envi Lee Global Empire</div>
                <div style={{ fontSize: '9px', color: 'rgba(155,109,255,0.6)', fontFamily: "'DM Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI Creator Ecosystem</div>
              </div>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Notification bell */}
              <button style={{ width: '36px', height: '36px', borderRadius: '50%', border: '0.5px solid rgba(108,86,126,0.3)', background: 'transparent', color: 'rgba(155,109,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                🔔
              </button>
              {/* User profile */}
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', background: 'rgba(155,109,255,0.08)', border: '0.5px solid rgba(155,109,255,0.2)', borderRadius: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8f0ff' }}>{user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0]}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(155,109,255,0.6)', fontFamily: "'DM Mono', monospace" }}>Creator Plan</div>
                  </div>
                  <UserButton afterSignOutUrl="/sign-in" appearance={{
                    elements: { avatarBox: { width: '32px', height: '32px', border: '1.5px solid rgba(155,109,255,0.4)' } }
                  }} />
                </div>
              )}
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main style={{ padding: '40px 28px 60px', position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>

            {/* Welcome */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(155,109,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Welcome back
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: '#f8f0ff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {user?.firstName || 'Creator'} <span style={{ color: '#9b6dff' }}>✦</span>
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(120,100,150,0.8)', marginTop: '6px' }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Choose your studio to begin
              </div>
            </div>

            {/* STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '48px' }}>
              {[
                { label: 'Studios Available', value: '5', color: '#9b6dff' },
                { label: 'Tools Total', value: '50+', color: '#00d4ff' },
                { label: 'AI Models', value: '3', color: '#ffe600' },
                { label: 'Your Plan', value: user ? 'Active' : '—', color: '#00ff88' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(108,86,126,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(120,100,150,0.7)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* APP CARDS */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(155,109,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>Your Studios</div>
              <div style={{ fontSize: '11px', color: 'rgba(120,100,150,0.5)', fontFamily: "'DM Mono', monospace" }}>Click any studio to enter</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '48px' }}>
              {APPS.map(app => (
                <div
                  key={app.id}
                  onClick={() => router.push(app.path)}
                  onMouseEnter={() => setHovered(app.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: hovered === app.id ? `rgba(${app.id === 'pod' ? '255,107,107' : app.id === 'ai' ? '0,212,255' : app.id === 'music' ? '255,230,0' : app.id === 'academy' ? '176,108,255' : '0,255,136'},0.06)` : 'rgba(255,255,255,0.02)',
                    border: `0.5px solid ${hovered === app.id ? app.border : 'rgba(108,86,126,0.2)'}`,
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all .3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: hovered === app.id ? `0 0 40px ${app.glow}` : 'none',
                  }}>
                  {/* Gradient top bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: app.gradient, opacity: hovered === app.id ? 1 : 0.4, transition: 'opacity .3s' }} />

                  {/* Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '9px', padding: '3px 8px', background: `${app.glow}`, border: `0.5px solid ${app.border}`, borderRadius: '20px', color: app.accent, fontFamily: "'DM Mono', monospace", letterSpacing: '.8px', textTransform: 'uppercase' }}>
                      {app.tag}
                    </div>
                    <div style={{ fontSize: '22px', opacity: 0.6 }}>{app.icon}</div>
                  </div>

                  {/* Academy logos */}
                  {app.hasBaddie && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(176,108,255,0.1)', border: '0.5px solid rgba(176,108,255,0.3)', borderRadius: '4px', color: '#b06cff', fontFamily: "'DM Mono', monospace" }}>BADDIE</div>
                      <div style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(232,199,106,0.1)', border: '0.5px solid rgba(232,199,106,0.3)', borderRadius: '4px', color: '#e8c76a', fontFamily: "'DM Mono', monospace" }}>KING'S</div>
                    </div>
                  )}

                  {/* App name */}
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: '#f8f0ff', marginBottom: '6px', letterSpacing: '-0.3px' }}>
                    {app.name}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '11px', color: app.accent, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>
                    {app.full}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(180,160,200,0.7)', lineHeight: '1.6', marginBottom: '16px' }}>
                    {app.desc}
                  </div>

                  {/* Tools pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
                    {app.tools.map(t => (
                      <span key={t} style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(108,86,126,0.2)', borderRadius: '4px', color: 'rgba(180,160,200,0.6)', fontFamily: "'DM Mono', monospace" }}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Enter button */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: hovered === app.id ? app.gradient : 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    transition: 'all .3s',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: hovered === app.id ? '#000' : app.accent, fontFamily: "'DM Sans', sans-serif", letterSpacing: '.3px' }}>
                      Enter Studio
                    </span>
                    <span style={{ fontSize: '16px', color: hovered === app.id ? '#000' : app.accent }}>→</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTENT CALENDAR */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(108,86,126,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 800, color: '#f8f0ff', marginBottom: '2px' }}>Content Calendar</div>
                  <div style={{ fontSize: '11px', color: 'rgba(155,109,255,0.6)', fontFamily: "'DM Mono', monospace" }}>Plan your content · Download to Canva</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid rgba(108,86,126,0.3)', background: 'transparent', color: 'rgba(155,109,255,0.8)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    + Add Post
                  </button>
                  <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6c567e, #9b6dff)', color: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                    ⬇ Download to Canva
                  </button>
                </div>
              </div>

              {/* Calendar grid - current week */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() - date.getDay() + i)
                  const isToday = date.toDateString() === new Date().toDateString()
                  return (
                    <div key={day} style={{
                      textAlign: 'center',
                      padding: '10px 6px',
                      background: isToday ? 'rgba(155,109,255,0.15)' : 'rgba(255,255,255,0.02)',
                      border: `0.5px solid ${isToday ? 'rgba(155,109,255,0.4)' : 'rgba(108,86,126,0.15)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      minHeight: '70px',
                    }}>
                      <div style={{ fontSize: '9px', color: isToday ? '#9b6dff' : 'rgba(120,100,150,0.6)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '4px' }}>{day}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: isToday ? '#9b6dff' : 'rgba(180,160,200,0.5)', marginBottom: '6px' }}>{date.getDate()}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(108,86,126,0.4)', fontFamily: "'DM Mono', monospace" }}>+ Plan</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PROFIT CALCULATOR QUICK */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 800, color: '#f8f0ff', marginBottom: '2px' }}>Quick Profit Calculator</div>
                  <div style={{ fontSize: '11px', color: 'rgba(0,255,136,0.5)', fontFamily: "'DM Mono', monospace" }}>Estimate your POD earnings</div>
                </div>
                <button onClick={() => router.push('/suite')} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid rgba(0,255,136,0.3)', background: 'transparent', color: 'rgba(0,255,136,0.8)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Full Calculator →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Sell Price', placeholder: '$35', color: '#00ff88' },
                  { label: 'Print Cost', placeholder: '$12', color: '#00ff88' },
                  { label: 'Monthly Sales', placeholder: '50 units', color: '#00ff88' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '9px', color: 'rgba(0,255,136,0.5)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '6px' }}>{f.label}</div>
                    <input placeholder={f.placeholder} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(0,255,136,0.2)', borderRadius: '7px', padding: '8px 10px', fontSize: '13px', color: '#f8f0ff', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

          </main>
        </div>
      </SignedIn>
    </>
  )
}
