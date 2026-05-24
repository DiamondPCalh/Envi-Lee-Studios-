'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function AdminPage() {
  const { user } = useUser()
  const [students, setStudents] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [authorized, setAuthorized] = useState(false)

  // Load students from env var on mount
  useEffect(() => {
    const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
    if (user?.id === adminId) {
      setAuthorized(true)
      loadStudents()
    }
  }, [user])

  function loadStudents() {
    try {
      const list = process.env.NEXT_PUBLIC_ACADEMY_STUDENTS_PREVIEW ?? '[]'
      setStudents(JSON.parse(list))
    } catch {
      setStudents([])
    }
  }

  async function addStudent() {
    if (!newEmail.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id ?? '',
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
        setNewEmail('')
        setMessage(`✓ ${newEmail} added! Now update ACADEMY_STUDENTS in Vercel with: ${JSON.stringify(data.students)}`)
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch (e) {
      setMessage('Error adding student')
    }
    setLoading(false)
  }

  async function removeStudent(email: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id ?? '',
        },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
        setMessage(`✓ ${email} removed! Update ACADEMY_STUDENTS in Vercel with: ${JSON.stringify(data.students)}`)
      }
    } catch (e) {
      setMessage('Error removing student')
    }
    setLoading(false)
  }

  function copyForVercel() {
    const value = JSON.stringify(students)
    navigator.clipboard.writeText(value)
    setMessage('✓ Copied! Paste this into ACADEMY_STUDENTS in Vercel Environment Variables')
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#000', padding: '40px 24px', fontFamily: "'DM Sans', sans-serif", color: '#f8f0ff' },
    title: { fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: '#f8f0ff', marginBottom: '8px' },
    sub: { fontSize: '13px', color: '#5a4070', marginBottom: '32px', lineHeight: '1.6' },
    card: { background: '#130d1a', border: '0.5px solid rgba(108,86,126,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
    label: { fontSize: '10px', fontWeight: 600, color: '#8060a0', textTransform: 'uppercase' as const, letterSpacing: '.7px', fontFamily: "'DM Mono',monospace", marginBottom: '8px', display: 'block' },
    inp: { background: '#0a0510', border: '0.5px solid rgba(108,86,126,0.3)', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: '#f8f0ff', width: '100%', outline: 'none', fontFamily: "'DM Sans',sans-serif" },
    btn: { padding: '10px 20px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#6c567e,#9b6dff)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
    btnRed: { padding: '6px 12px', borderRadius: '6px', border: '0.5px solid rgba(255,45,120,0.3)', background: 'transparent', color: '#ff6b9d', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
    msg: { padding: '12px 16px', background: 'rgba(155,109,255,0.1)', border: '0.5px solid rgba(155,109,255,0.3)', borderRadius: '8px', fontSize: '12px', color: '#9b6dff', marginBottom: '16px', lineHeight: '1.6', wordBreak: 'break-all' as const },
  }

  if (!user) return <div style={s.page}>Loading...</div>

  if (!authorized) {
    return (
      <div style={s.page}>
        <div style={s.title}>Access Denied</div>
        <div style={s.sub}>This page is only accessible to the admin account.</div>
        <div style={{ fontSize: '12px', color: '#5a4070', fontFamily: "'DM Mono',monospace" }}>Your user ID: {user.id}</div>
        <div style={{ fontSize: '12px', color: '#5a4070', marginTop: '8px' }}>Add this as NEXT_PUBLIC_ADMIN_USER_ID in Vercel to grant access.</div>
        <a href="/" style={{ display: 'inline-block', marginTop: '20px', color: '#9b6dff', fontSize: '13px' }}>← Back to suite</a>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <div style={s.title}>Academy Admin</div>
      <div style={s.sub}>Manage free access for your Skool academy students. Add their email when they join, remove it when they leave.</div>

      {message && <div style={s.msg}>{message}</div>}

      {/* Add student */}
      <div style={s.card}>
        <span style={s.label}>Add academy student</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            style={s.inp}
            placeholder="student@email.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStudent()}
          />
          <button style={s.btn} onClick={addStudent} disabled={loading}>
            {loading ? 'Adding…' : 'Add ↗'}
          </button>
        </div>
      </div>

      {/* Student list */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={s.label}>Academy students ({students.length})</span>
          <button style={{ ...s.btn, fontSize: '11px', padding: '7px 14px' }} onClick={copyForVercel}>
            Copy for Vercel ↗
          </button>
        </div>

        {students.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#5a4070', textAlign: 'center', padding: '20px' }}>
            No students added yet. Add their email above when they join your academy.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {students.map(email => (
              <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0a0510', borderRadius: '8px', border: '0.5px solid rgba(108,86,126,0.2)' }}>
                <div style={{ fontSize: '13px', color: '#d8c8f0', fontFamily: "'DM Mono',monospace" }}>{email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(0,200,83,0.12)', color: '#00c853', borderRadius: '4px', fontFamily: "'DM Mono',monospace" }}>FREE ACCESS</span>
                  <button style={s.btnRed} onClick={() => removeStudent(email)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={s.card}>
        <span style={s.label}>How it works</span>
        <div style={{ fontSize: '12px', color: '#5a4070', lineHeight: '2', fontFamily: "'DM Mono',monospace" }}>
          <span style={{ color: '#9b6dff' }}>Step 1</span> — Student joins your Skool academy<br/>
          <span style={{ color: '#9b6dff' }}>Step 2</span> — You add their email here<br/>
          <span style={{ color: '#9b6dff' }}>Step 3</span> — Click "Copy for Vercel"<br/>
          <span style={{ color: '#9b6dff' }}>Step 4</span> — Paste into ACADEMY_STUDENTS in Vercel env vars<br/>
          <span style={{ color: '#9b6dff' }}>Step 5</span> — Redeploy — student gets free access instantly<br/>
          <span style={{ color: '#9b6dff' }}>Step 6</span> — When they leave, remove their email and repeat
        </div>
      </div>

      <a href="/" style={{ display: 'inline-block', marginTop: '10px', color: '#9b6dff', fontSize: '13px', textDecoration: 'none' }}>← Back to suite</a>
    </div>
  )
}
