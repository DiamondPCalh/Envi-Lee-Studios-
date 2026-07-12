// app/api/vault/lockout/route.ts
// Called when a student is locked out of the Content Vault
// Sends an email via Resend explaining how to regain access

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, userName } = await req.json()

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'userId and userEmail required' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@envileecreatorstudios.com'

    if (!resendKey) {
      console.error('[lockout] RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Lock the user in Upstash
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}/set/vault_locked_${userId}/true`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
    }

    // Send lockout email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; background: #000; color: #fff; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .header { text-align: center; margin-bottom: 32px; }
  .logo { font-size: 28px; font-weight: 900; background: linear-gradient(135deg, #ffe600, #00cfff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
  .subtitle { font-size: 11px; color: rgba(0,207,255,0.5); letter-spacing: 2px; text-transform: uppercase; }
  .card { background: #0a1520; border: 1px solid rgba(255,230,0,0.2); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
  .icon { font-size: 48px; text-align: center; margin-bottom: 16px; }
  h1 { font-size: 22px; color: #ffe600; text-align: center; margin-bottom: 8px; }
  .intro { font-size: 14px; color: rgba(255,255,255,0.7); text-align: center; line-height: 1.7; margin-bottom: 24px; }
  .steps-title { font-size: 11px; color: rgba(0,207,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; font-weight: 700; }
  .step { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
  .step-num { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #ffe600, #00cfff); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #000; flex-shrink: 0; }
  .step-text { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.6; padding-top: 4px; }
  .step-text strong { color: #00cfff; }
  .cta { text-align: center; margin: 24px 0; }
  .btn { display: inline-block; padding: 14px 32px; border-radius: 10px; background: linear-gradient(135deg, #ffe600, #00cfff); color: #000; font-size: 14px; font-weight: 800; text-decoration: none; }
  .note { background: rgba(255,230,0,0.06); border: 1px solid rgba(255,230,0,0.15); border-radius: 10px; padding: 14px 18px; font-size: 12px; color: rgba(255,230,0,0.8); line-height: 1.7; text-align: center; }
  .footer { text-align: center; margin-top: 32px; font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.8; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">Envi Lee Creator Studios™</div>
    <div class="subtitle">Baddie Content Vault</div>
  </div>

  <div class="card">
    <div class="icon">🔒</div>
    <h1>Your Vault Access is Paused</h1>
    <p class="intro">
      Hey ${userName || 'Creator'}! Your access to the Baddie Content Vault has been temporarily paused because you haven't submitted your required content yet.
      <br><br>
      Don't worry — regaining access is simple!
    </p>

    <div class="steps-title">To Regain Access:</div>

    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text">
        <strong>Submit 2 completed videos</strong> with full step-by-step breakdowns in your private suite.
      </div>
    </div>

    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text">
        For each video include: <strong>project title, video upload, thumbnail, prompts used, tools, workflow, and camera angles.</strong>
      </div>
    </div>

    <div class="step">
      <div class="step-num">3</div>
      <div class="step-text">
        <strong>Submit your videos</strong> — Envi Lee will review them and restore your access after approval.
      </div>
    </div>

    <div class="cta">
      <a href="https://envileecreatorstudios.com/vault" class="btn">Submit My Videos →</a>
    </div>

    <div class="note">
      ✦ The Content Vault is a community of creators who share and learn from each other. Submitting your work helps everyone grow together.
    </div>
  </div>

  <div class="footer">
    <p>Envi Lee Creator Studios™ · Baddie Content Vault™</p>
    <p>envileecreatorstudios.com</p>
    <p style="margin-top: 8px; color: rgba(255,255,255,0.2);">You're receiving this because you're a member of the Envi Lee Creator ecosystem.</p>
  </div>
</div>
</body>
</html>
`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `Envi Lee Creator Studios <${fromEmail}>`,
        to: [userEmail],
        subject: '🔒 Your Content Vault Access — Action Required',
        html: emailHtml,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[lockout email error]', data)
      return NextResponse.json({ error: 'Failed to send email', details: data }, { status: 500 })
    }

    console.log(`[lockout] Email sent to ${userEmail}, locked userId: ${userId}`)
    return NextResponse.json({ success: true, emailId: data.id })

  } catch (err) {
    console.error('[/api/vault/lockout]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST to unlock — called when admin approves
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}/del/vault_locked_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
    }

    return NextResponse.json({ success: true, message: `User ${userId} unlocked` })

  } catch (err) {
    console.error('[/api/vault/lockout DELETE]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
