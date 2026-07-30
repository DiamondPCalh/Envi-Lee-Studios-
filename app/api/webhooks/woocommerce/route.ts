// app/api/webhooks/woocommerce/route.ts
// Receives WooCommerce order.completed events
// Automatically grants academy access when someone pays $47

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

// ── SIGNATURE VERIFICATION ────────────────────────────────────
function verifyWooSignature(body: string, signature: string, secret: string): boolean {
  try {
    const hash = createHmac('sha256', secret).update(body, 'utf8').digest('base64')
    return hash === signature
  } catch {
    return false
  }
}

// ── GRANT ACCESS IN UPSTASH ───────────────────────────────────
async function grantAcademyAccess(email: string): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    console.error('[woocommerce webhook] Missing Upstash env vars')
    return false
  }

  try {
    // Store email → access granted in Redis
    // Key: academy_email_{email} = true (for email-based lookup at sign-in)
    const emailKey = `academy_email_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    await fetch(`${redisUrl}/set/${emailKey}/true`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })

    // Also add to the approved emails set
    await fetch(`${redisUrl}/sadd/academy_approved_emails/${email.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })

    console.log(`[woocommerce webhook] ✓ Access granted for ${email}`)
    return true
  } catch (err) {
    console.error('[woocommerce webhook] Redis error:', err)
    return false
  }
}

// ── SEND WELCOME EMAIL VIA RESEND ─────────────────────────────
async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@envileecreatorstudios.com'

  if (!resendKey) return

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .logo { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #7b3fa0, #c9a0dc, #d4a843); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
  .card { background: #0d0020; border: 1px solid rgba(123,63,160,0.3); border-radius: 16px; padding: 32px; margin-bottom: 20px; }
  h1 { font-size: 24px; color: #c9a0dc; margin-bottom: 12px; }
  p { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.7; margin-bottom: 12px; }
  .btn { display: inline-block; padding: 14px 32px; border-radius: 10px; background: linear-gradient(135deg, #7b3fa0, #c9a0dc, #d4a843); color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; margin-top: 8px; }
  .step { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
  .step-num { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #7b3fa0, #d4a843); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; flex-shrink: 0; }
  .step-text { font-size: 13px; color: rgba(255,255,255,0.8); padding-top: 4px; line-height: 1.6; }
  .footer { text-align: center; font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 32px; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">Envi Lee Creator Studios™</div>
  <p style="font-size:11px;color:rgba(201,160,220,0.4);margin-bottom:32px;">Baddie Academy™ — Founding VIP</p>
  <div class="card">
    <h1>🎓 Welcome to Baddie Academy, ${firstName || 'Creator'}!</h1>
    <p>Your enrollment is confirmed and your Founding VIP access is ready. You now have access to all 12 apps in the Envi Lee Creator Empire — completely free as a Baddie Academy student.</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text"><strong style="color:#c9a0dc">Go to envileecreatorstudios.com</strong> and create your account using this email address: <strong style="color:#d4a843">${email}</strong></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text">Your access is automatic — no approval needed. All 12 apps unlock the moment you sign in.</div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-text">Start with <strong style="color:#c9a0dc">Realism Studio™</strong> to build your AI twin, then use the <strong style="color:#c9a0dc">Prompt Bank™</strong> to generate your content.</div>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://envileecreatorstudios.com/sign-up" class="btn">Access My 12 Apps →</a>
    </div>
  </div>
  <div class="footer">
    <p>Envi Lee Creator Studios™ · Baddie Academy™</p>
    <p>envileecreatorstudios.com</p>
    <p style="margin-top:8px;">You're receiving this because you enrolled in Envi Lee Baddie Academy.</p>
  </div>
</div>
</body>
</html>
  `

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `Envi Lee Baddie Academy <${fromEmail}>`,
        to: [email],
        subject: '🎓 Welcome to Baddie Academy — Your 12 Apps Are Ready!',
        html,
      }),
    })
    console.log(`[woocommerce webhook] ✓ Welcome email sent to ${email}`)
  } catch (err) {
    console.error('[woocommerce webhook] Email error:', err)
  }
}

// ── MAIN WEBHOOK HANDLER ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-wc-webhook-signature') || ''
    const topic = req.headers.get('x-wc-webhook-topic') || ''
    const source = req.headers.get('x-wc-webhook-source') || ''

    console.log(`[woocommerce webhook] Received: topic=${topic} source=${source}`)

    // ── Verify signature ──────────────────────────────────────
    if (secret) {
      if (!signature) {
        console.error('[woocommerce webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      const valid = verifyWooSignature(rawBody, signature, secret)
      if (!valid) {
        console.error('[woocommerce webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('[woocommerce webhook] WOOCOMMERCE_WEBHOOK_SECRET not set — skipping verification')
    }

    // ── Only process order.completed ──────────────────────────
    if (topic !== 'order.completed') {
      console.log(`[woocommerce webhook] Ignoring topic: ${topic}`)
      return NextResponse.json({ received: true, action: 'ignored', topic })
    }

    // ── Parse order payload ───────────────────────────────────
    let order: Record<string, unknown>
    try {
      order = JSON.parse(rawBody)
    } catch {
      console.error('[woocommerce webhook] Failed to parse body')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // ── Extract email and name ────────────────────────────────
    const billing = order.billing as Record<string, string> | undefined
    const email = (billing?.email || order.customer_email as string || '').toLowerCase().trim()
    const firstName = billing?.first_name || (order.customer_email as string)?.split('@')[0] || 'Creator'
    const orderId = order.id || order.number || 'unknown'
    const total = order.total || '0'
    const status = order.status || 'unknown'

    if (!email) {
      console.error('[woocommerce webhook] No email found in order payload')
      return NextResponse.json({ error: 'No email in order' }, { status: 400 })
    }

    console.log(`[woocommerce webhook] Order #${orderId} — ${email} — $${total} — status: ${status}`)

    // ── Grant access ──────────────────────────────────────────
    const granted = await grantAcademyAccess(email)

    // ── Send welcome email ────────────────────────────────────
    if (granted) {
      await sendWelcomeEmail(email, firstName)
    }

    // ── Log to Redis for audit trail ──────────────────────────
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (redisUrl && redisToken) {
      const logEntry = JSON.stringify({
        orderId, email, firstName, total, status,
        grantedAt: new Date().toISOString(), granted,
      })
      await fetch(`${redisUrl}/lpush/academy_enrollment_log/${encodeURIComponent(logEntry)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
    }

    return NextResponse.json({
      success: true,
      email,
      orderId,
      accessGranted: granted,
      message: `Access ${granted ? 'granted' : 'failed'} for ${email}`,
    })

  } catch (err) {
    console.error('[woocommerce webhook] Unexpected error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// ── TEST ENDPOINT (GET) ───────────────────────────────────────
// Hit: GET /api/webhooks/woocommerce?test=your@email.com
export async function GET(req: NextRequest) {
  const testEmail = req.nextUrl.searchParams.get('test')
  if (!testEmail) {
    return NextResponse.json({
      status: 'WooCommerce webhook endpoint is live',
      usage: 'Add ?test=email@example.com to grant test access',
      topic: 'Listening for: order.completed',
    })
  }

  // Grant test access
  const granted = await grantAcademyAccess(testEmail)
  await sendWelcomeEmail(testEmail, 'Test User')

  return NextResponse.json({
    success: true,
    testEmail,
    accessGranted: granted,
    message: `Test access ${granted ? 'granted' : 'failed'} for ${testEmail}. Check your email for the welcome message.`,
  })
}
