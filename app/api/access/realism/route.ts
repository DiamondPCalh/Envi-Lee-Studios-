// app/api/access/realism/route.ts
// Checks if user has access to Realism Studio + all Academy apps
// Access granted via: admin ID, Redis userId key, Redis email key, or ACADEMY_STUDENTS env

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const userEmail = req.nextUrl.searchParams.get('email') || ''

    if (!userId) return NextResponse.json({ hasAccess: false })

    // ── Admin always has access ───────────────────────────────
    const adminId = process.env.ADMIN_USER_ID
    if (userId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      // ── Check userId-based access (manually granted) ──────
      const userRes = await fetch(`${redisUrl}/get/academy_access_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const userData = await userRes.json()
      if (userData.result === 'true' || userData.result === '1') {
        return NextResponse.json({ hasAccess: true, role: 'student' })
      }

      // ── Check email-based access (WooCommerce purchase) ───
      if (userEmail) {
        const emailKey = `academy_email_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        const emailRes = await fetch(`${redisUrl}/get/${emailKey}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        })
        const emailData = await emailRes.json()
        if (emailData.result === 'true') {
          // Also grant userId-based access for future fast lookups
          await fetch(`${redisUrl}/set/academy_access_${userId}/true`, {
            headers: { Authorization: `Bearer ${redisToken}` },
          })
          return NextResponse.json({ hasAccess: true, role: 'student' })
        }

        // ── Check approved emails set ─────────────────────
        const setRes = await fetch(`${redisUrl}/sismember/academy_approved_emails/${encodeURIComponent(userEmail.toLowerCase())}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        })
        const setData = await setRes.json()
        if (setData.result === 1) {
          await fetch(`${redisUrl}/set/academy_access_${userId}/true`, {
            headers: { Authorization: `Bearer ${redisToken}` },
          })
          return NextResponse.json({ hasAccess: true, role: 'student' })
        }
      }
    }

    // ── Check ACADEMY_STUDENTS env var (manual backup) ────────
    const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')
    if (userEmail && studentEmails.map(e => e.toLowerCase()).includes(userEmail.toLowerCase())) {
      return NextResponse.json({ hasAccess: true, role: 'student' })
    }

    return NextResponse.json({ hasAccess: false })
  } catch (err) {
    console.error('[/api/access/realism]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
