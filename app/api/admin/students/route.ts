// app/api/admin/students/route.ts
// Upgraded — saves to Upstash Redis instantly, no Vercel env update needed
// Supports all 4 academies + manual Skool adds

import { NextRequest, NextResponse } from 'next/server'

const ADMIN_USER_ID = process.env.ADMIN_USER_ID ?? ''

async function redisGet(key: string) {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  })
  const data = await res.json()
  return data.result
}

async function redisSet(key: string, value: string) {
  await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  })
}

async function redisDel(key: string) {
  await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  })
}

async function redisSAdd(key: string, value: string) {
  await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/sadd/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  })
}

async function redisSRem(key: string, value: string) {
  await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/srem/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  })
}

async function redisSMembers(key: string): Promise<string[]> {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/smembers/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  })
  const data = await res.json()
  return data.result || []
}

async function sendWelcomeEmail(email: string, academy: string) {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@envileecreatorstudios.com'
  if (!resendKey) return

  const academyColors: Record<string, string> = {
    'Baddie Academy': 'linear-gradient(135deg,#7b3fa0,#c9a0dc,#d4a843)',
    'Kings Academy': 'linear-gradient(135deg,#c4973a,#e8c76a)',
    'Boss Academy': 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
    'Digital Arts Academy': 'linear-gradient(135deg,#ff006e,#8338ec,#3a86ff)',
    'World of Sparkle': 'linear-gradient(135deg,#9B59B6,#C9A0DC,#F9F900)',
    'Manual': 'linear-gradient(135deg,#6B21A8,#A855F7,#06B6D4)',
  }

  const gradient = academyColors[academy] || academyColors['Manual']

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>body{font-family:Arial,sans-serif;background:#000;color:#fff;margin:0;padding:0;}
  .c{max-width:560px;margin:0 auto;padding:40px 20px;}
  .logo{font-size:22px;font-weight:900;background:${gradient};-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:24px;}
  .card{background:#0d0020;border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:32px;margin-bottom:20px;position:relative;overflow:hidden;}
  .bar{position:absolute;top:0;left:0;right:0;height:3px;background:${gradient};}
  h1{font-size:22px;color:#c9a0dc;margin-bottom:12px;}
  p{font-size:13px;color:rgba(255,255,255,0.7);line-height:1.7;margin-bottom:12px;}
  .btn{display:inline-block;padding:13px 28px;border-radius:10px;background:${gradient};color:#fff;font-size:13px;font-weight:700;text-decoration:none;margin-top:8px;}
  .step{display:flex;gap:12px;margin-bottom:12px;}
  .num{width:26px;height:26px;border-radius:50%;background:${gradient};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#000;flex-shrink:0;}
  .st{font-size:12px;color:rgba(255,255,255,0.8);padding-top:4px;line-height:1.6;}
  .foot{text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin-top:24px;}</style>
  </head><body><div class="c">
  <div class="logo">Envi Lee Creator Studios™</div>
  <div class="card"><div class="bar"></div>
  <h1>🎓 Welcome! Your Access Is Ready</h1>
  <p>You've been granted access to Envi Lee Creator Studios™ through <strong style="color:#c9a0dc">${academy}</strong>. All 12 apps are now unlocked for you.</p>
  <div class="step"><div class="num">1</div><div class="st">Go to <strong style="color:#c9a0dc">envileecreatorstudios.com</strong> and create your account using this email: <strong style="color:#d4a843">${email}</strong></div></div>
  <div class="step"><div class="num">2</div><div class="st">Your access is automatic — all 12 apps unlock the moment you sign in.</div></div>
  <div class="step"><div class="num">3</div><div class="st">Start with <strong style="color:#c9a0dc">Realism Studio™</strong> to build your AI twin.</div></div>
  <div style="text-align:center;margin-top:20px;"><a href="https://envileecreatorstudios.com/sign-up" class="btn">Access My Apps →</a></div>
  </div>
  <div class="foot"><p>Envi Lee Creator Studios™ · envileecreatorstudios.com</p></div>
  </div></body></html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: `Envi Lee Creator Studios <${fromEmail}>`,
      to: [email],
      subject: `🎓 Your Creator Studios Access Is Ready — ${academy}`,
      html,
    }),
  })
}

// GET — list all students per academy
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (userId !== ADMIN_USER_ID) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const academies = ['baddie', 'kings', 'boss', 'digitalarts', 'sparkle', 'manual']
  const result: Record<string, string[]> = {}
  for (const a of academies) {
    result[a] = await redisSMembers(`academy_students_${a}`)
  }
  return NextResponse.json({ success: true, academies: result })
}

// POST — add a student (admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId, email, academy, action } = await req.json()
    if (userId !== ADMIN_USER_ID) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const normalized = email.toLowerCase().trim()
    const academyKey = (academy || 'manual').toLowerCase().replace(/\s+/g, '')

    if (action === 'remove') {
      // Remove from academy set
      await redisSRem(`academy_students_${academyKey}`, normalized)
      // Remove Redis access keys
      await redisDel(`academy_email_${normalized.replace(/[^a-z0-9]/g, '_')}`)
      await redisSRem('academy_approved_emails', normalized)
      return NextResponse.json({ success: true, message: `${normalized} removed from ${academy}` })
    }

    // Add to academy-specific set
    await redisSAdd(`academy_students_${academyKey}`, normalized)
    // Grant access via email key
    const emailKey = `academy_email_${normalized.replace(/[^a-z0-9]/g, '_')}`
    await redisSet(emailKey, 'true')
    // Add to approved emails set
    await redisSAdd('academy_approved_emails', normalized)

    // Send welcome email
    const academyLabel: Record<string, string> = {
      baddie: 'Baddie Academy',
      kings: 'Kings Academy',
      boss: 'Boss Academy',
      digitalarts: 'Digital Arts Academy',
      sparkle: 'World of Sparkle Academy',
      manual: 'Envi Lee Creator Studios',
    }
    await sendWelcomeEmail(normalized, academyLabel[academyKey] || academy)

    return NextResponse.json({ success: true, message: `Access granted to ${normalized} via ${academy}` })
  } catch (err) {
    console.error('[/api/admin/students]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
