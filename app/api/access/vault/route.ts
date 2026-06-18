// app/api/access/vault/route.ts
// Checks if the current user has access to the Baddie Content Vault
// Also checks if they are locked out for not submitting 2 videos

import { NextRequest, NextResponse } from 'next/server' 
import { currentUser } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ hasAccess: false })

    const adminId = process.env.ADMIN_USER_ID
    if (user.id === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    // Check if student
    const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')
    const userEmail = user.emailAddresses?.[0]?.emailAddress ?? ''
    const isStudent = studentEmails.includes(userEmail)

    // Check Upstash for paid bundle subscription
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    let isPaidSubscriber = false

    if (redisUrl && redisToken) {
      const res = await fetch(`${redisUrl}/get/vault_access_${user.id}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const data = await res.json()
      isPaidSubscriber = data.result === 'true' || data.result === '1'
    }

    const hasAccess = isStudent || isPaidSubscriber
    if (!hasAccess) return NextResponse.json({ hasAccess: false })

    // Check if locked out (hasn't submitted 2 videos)
    // For now we check Upstash for a lock flag
    if (redisUrl && redisToken) {
      const lockRes = await fetch(`${redisUrl}/get/vault_locked_${user.id}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const lockData = await lockRes.json()
      if (lockData.result === 'true') {
        return NextResponse.json({ hasAccess: true, locked: true })
      }
    }

    return NextResponse.json({ hasAccess: true, role: isStudent ? 'student' : 'subscriber' })

  } catch (err) {
    console.error('[/api/access/vault]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
