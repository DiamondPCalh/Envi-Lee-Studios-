// app/api/access/prompts/route.ts
// Checks if the current user has access to the Baddie Prompt Bank
// Access granted to: Envi Lee students (ACADEMY_STUDENTS env) + paid subscribers

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ hasAccess: false })

    const adminId = process.env.ADMIN_USER_ID
    if (userId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    // Check if student
    const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')

    // Check Upstash for paid subscription
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      // Try to get user email from Upstash cache
      const emailRes = await fetch(`${redisUrl}/get/user_email_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const emailData = await emailRes.json()
      const userEmail = emailData.result ?? ''

      if (userEmail && studentEmails.includes(userEmail)) {
        return NextResponse.json({ hasAccess: true, role: 'student' })
      }

      // Check paid access
      const accessRes = await fetch(`${redisUrl}/get/prompts_access_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const accessData = await accessRes.json()
      if (accessData.result === 'true' || accessData.result === '1') {
        return NextResponse.json({ hasAccess: true, role: 'subscriber' })
      }
    }

    return NextResponse.json({ hasAccess: false })

  } catch (err) {
    console.error('[/api/access/prompts]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
