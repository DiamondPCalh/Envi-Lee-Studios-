// app/api/access/realism/route.ts
// Checks if user has access to Realism Studio
// Access: Academy students only

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ hasAccess: false })

    const adminId = process.env.ADMIN_USER_ID
    if (userId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      const res = await fetch(`${redisUrl}/get/academy_access_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const data = await res.json()
      if (data.result === 'true' || data.result === '1') {
        return NextResponse.json({ hasAccess: true, role: 'student' })
      }
    }

    // Check ACADEMY_STUDENTS env var
    const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')
    if (studentEmails.length > 0) {
      return NextResponse.json({ hasAccess: true, role: 'student' })
    }

    return NextResponse.json({ hasAccess: false })
  } catch (err) {
    console.error('[/api/access/realism]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
