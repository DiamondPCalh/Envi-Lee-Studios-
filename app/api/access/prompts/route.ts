// app/api/access/vault/route.ts
// Checks if the current user has access to the Baddie Content Vault

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ hasAccess: false })

    const adminId = process.env.ADMIN_USER_ID
    if (userId === adminId) return NextResponse.json({ hasAccess: true, role: 'admin' })

    // Check Upstash
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      // Check student emails
      const studentEmails: string[] = JSON.parse(process.env.ACADEMY_STUDENTS || '[]')

      const emailRes = await fetch(`${redisUrl}/get/user_email_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const emailData = await emailRes.json()
      const userEmail = emailData.result ?? ''

      if (userEmail && studentEmails.includes(userEmail)) {
        return NextResponse.json({ hasAccess: true, role: 'student' })
      }

      // Check paid bundle access
      const accessRes = await fetch(`${redisUrl}/get/vault_access_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const accessData = await accessRes.json()
      if (accessData.result === 'true' || accessData.result === '1') {
        return NextResponse.json({ hasAccess: true, role: 'subscriber' })
      }

      // Check lock status
      const lockRes = await fetch(`${redisUrl}/get/vault_locked_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const lockData = await lockRes.json()
      if (lockData.result === 'true') {
        return NextResponse.json({ hasAccess: true, locked: true })
      }
    }

    return NextResponse.json({ hasAccess: false })

  } catch (err) {
    console.error('[/api/access/vault]', err)
    return NextResponse.json({ hasAccess: false })
  }
}
