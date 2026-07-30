// app/api/access/realism/route.ts
// STRICT ACCESS — only approved emails get in. NO exceptions.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // ── ADMIN BYPASS — check before anything else ────────────
    const adminId = process.env.ADMIN_USER_ID || ''
    const queryUserId = req.nextUrl.searchParams.get('userId') || ''
    const queryEmail = req.nextUrl.searchParams.get('email') || ''
    if (queryUserId && queryUserId === adminId) {
      return NextResponse.json({ hasAccess: true, role: 'admin' })
    }

    const userId = req.nextUrl.searchParams.get('userId')
    const userEmail = (req.nextUrl.searchParams.get('email') || '').toLowerCase().trim()

    if (!userId) return NextResponse.json({ hasAccess: false })

    // Admin always has access
    const adminId = process.env.ADMIN_USER_ID
    if (userId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      // Check userId-based access (manually granted by admin)
      const userRes = await fetch(`${redisUrl}/get/academy_access_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const userData = await userRes.json()
      if (userData.result === 'true') return NextResponse.json({ hasAccess: true, role: 'student' })

      // Check email-based access (WooCommerce purchase)
      if (userEmail) {
        const emailKey = `academy_email_${userEmail.replace(/[^a-z0-9]/g, '_')}`
        const emailRes = await fetch(`${redisUrl}/get/${emailKey}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        })
        const emailData = await emailRes.json()
        if (emailData.result === 'true') {
          // Cache userId for future fast lookups
          await fetch(`${redisUrl}/set/academy_access_${userId}/true`, {
            headers: { Authorization: `Bearer ${redisToken}` },
          })
          return NextResponse.json({ hasAccess: true, role: 'student' })
        }

        // Check approved emails set
        const setRes = await fetch(`${redisUrl}/sismember/academy_approved_emails/${encodeURIComponent(userEmail)}`, {
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

    // Check ACADEMY_STUDENTS env var — MUST match email exactly
    if (userEmail) {
      const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')
      if (studentEmails.map(e => e.toLowerCase().trim()).includes(userEmail)) {
        return NextResponse.json({ hasAccess: true, role: 'student' })
      }
    }

    // DENY — not in any approved list
    return NextResponse.json({ hasAccess: false })

  } catch (err) {
    console.error('[/api/access/realism]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
