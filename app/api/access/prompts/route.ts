// app/api/access/prompts/route.ts
// Checks if the current user has access to the Baddie Prompt Bank
// Access granted to: Envi Lee students (ACADEMY_STUDENTS env) + paid subscribers

import { NextRequest, NextResponse } from 'next/server'
const user = await currentUser()

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ hasAccess: false })

    const adminId = process.env.ADMIN_USER_ID
    // Admin always has access
    if (user.id === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    // Check if student
    const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')
    const userEmail = user.emailAddresses?.[0]?.emailAddress ?? ''
    if (studentEmails.includes(userEmail)) {
      return NextResponse.json({ hasAccess: true, role: 'student' })
    }

    // Check Upstash for paid subscription
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      const res = await fetch(`${redisUrl}/get/prompts_access_${user.id}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const data = await res.json()
      if (data.result === 'true' || data.result === '1') {
        return NextResponse.json({ hasAccess: true, role: 'subscriber' })
      }
    }

    return NextResponse.json({ hasAccess: false })

  } catch (err) {
    console.error('[/api/access/prompts]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
