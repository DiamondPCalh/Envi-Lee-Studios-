'use client'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(155,109,255,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(108,86,126,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(108,86,126,0.05) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        pointerEvents: 'none',
      }} />

      {/* Empire Logo */}
      <div style={{ marginBottom: '40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* EL Circle Logo SVG */}
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ marginBottom: '16px', filter: 'invert(1)' }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
            style={{ strokeDasharray: '260', strokeDashoffset: '30' }} />
          <text x="50" y="58" textAnchor="middle" fill="white" fontSize="32" fontFamily="Cormorant Garamond, serif" fontWeight="400">EL</text>
        </svg>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '22px',
          fontWeight: 400,
          color: '#f8f0ff',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Envi Lee Global Empire
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(155,109,255,0.7)',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          The AI Creator Ecosystem
        </div>
      </div>

      {/* Clerk Sign In */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SignIn
          fallbackRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: '#9b6dff',
              colorBackground: '#0d0a14',
              colorText: '#f8f0ff',
              colorInputBackground: '#130d1a',
              colorInputText: '#f8f0ff',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
            },
            elements: {
              card: {
                border: '0.5px solid rgba(155,109,255,0.25)',
                boxShadow: '0 0 60px rgba(155,109,255,0.1)',
                background: '#0d0a14',
              },
              headerTitle: { color: '#f8f0ff', fontFamily: 'Syne, sans-serif' },
              headerSubtitle: { color: 'rgba(155,109,255,0.7)' },
              socialButtonsBlockButton: {
                border: '0.5px solid rgba(108,86,126,0.3)',
                background: '#130d1a',
                color: '#f8f0ff',
              },
              formFieldLabel: { color: 'rgba(155,109,255,0.7)' },
              formFieldInput: { background: '#130d1a', border: '0.5px solid rgba(108,86,126,0.3)', color: '#f8f0ff' },
              footerActionLink: { color: '#9b6dff' },
              formButtonPrimary: {
                background: 'linear-gradient(135deg, #6c567e, #9b6dff)',
                boxShadow: '0 0 20px rgba(155,109,255,0.3)',
              },
            }
          }}
        />
      </div>
    </div>
  )
}
