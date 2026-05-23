import { SignUp } from '@clerk/nextjs'
 
export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '28px',
          fontWeight: 800,
          color: '#f8f0ff',
          marginBottom: '8px',
        }}>
          Envi Lee <span style={{ color: '#9b6dff' }}>Creator Suite™</span>
        </div>
        <div style={{ fontSize: '13px', color: '#5a4070' }}>
          Create your account to get started
        </div>
      </div>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#9b6dff',
            colorBackground: '#130d1a',
            colorText: '#f8f0ff',
            colorInputBackground: '#0a0510',
            colorInputText: '#f8f0ff',
            borderRadius: '8px',
          },
          elements: {
            card: { border: '0.5px solid rgba(108,86,126,0.3)', boxShadow: '0 0 40px rgba(155,109,255,0.1)' },
            headerTitle: { color: '#f8f0ff' },
            headerSubtitle: { color: '#8060a0' },
            socialButtonsBlockButton: { border: '0.5px solid rgba(108,86,126,0.3)', background: '#1a1224' },
            formFieldLabel: { color: '#8060a0' },
            footerActionLink: { color: '#9b6dff' },
          }
        }}
      />
    </div>
  )
}
