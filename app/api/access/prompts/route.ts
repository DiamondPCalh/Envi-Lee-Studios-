// app/api/access/prompts/route.ts
// STRICT ACCESS — only approved academy emails get in

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ hasAccess: false })

    const adminId = process.env.ADMIN_USER_ID
    if (user.id === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    // Also check query param userId for client-side calls
    const queryUserId = req.nextUrl.searchParams.get('userId')
    if (queryUserId && queryUserId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    const queryEmail = req.nextUrl.searchParams.get('email') || ''
    const userEmail = queryEmail || (user.emailAddresses?.[0]?.emailAddress ?? '').toLowerCase().trim()
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      // Check userId-based access
      const userRes = await fetch(`${redisUrl}/get/academy_access_${user.id}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const userData = await userRes.json()
      if (userData.result === 'true') return NextResponse.json({ hasAccess: true, role: 'student' })

      // Check email-based access
      if (userEmail) {
        const emailKey = `academy_email_${userEmail.replace(/[^a-z0-9]/g, '_')}`
        const emailRes = await fetch(`${redisUrl}/get/${emailKey}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        })
        const emailData = await emailRes.json()
        if (emailData.result === 'true') {
          await fetch(`${redisUrl}/set/academy_access_${user.id}/true`, {
            headers: { Authorization: `Bearer ${redisToken}` },
          })
          return NextResponse.json({ hasAccess: true, role: 'student' })
        }

        const setRes = await fetch(`${redisUrl}/sismember/academy_approved_emails/${encodeURIComponent(userEmail)}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        })
        const setData = await setRes.json()
        if (setData.result === 1) {
          await fetch(`${redisUrl}/set/academy_access_${user.id}/true`, {
            headers: { Authorization: `Bearer ${redisToken}` },
          })
          return NextResponse.json({ hasAccess: true, role: 'student' })
        }
      }
    }

    // Check ACADEMY_STUDENTS env var — exact email match only
    if (userEmail) {
      const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')
      if (studentEmails.map(e => e.toLowerCase().trim()).includes(userEmail)) {
        return NextResponse.json({ hasAccess: true, role: 'student' })
      }
    }

    return NextResponse.json({ hasAccess: false })

  } catch (err) {
    console.error('[/api/access/prompts]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
