// app/api/access/debug/route.ts
// TEMPORARY — delete after fixing access issues
// Visit: /api/access/debug?userId=YOUR_USER_ID

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const queryUserId = req.nextUrl.searchParams.get('userId') || ''
    const user = await currentUser()

    const adminIdEnv = process.env.ADMIN_USER_ID || 'NOT SET'
    const nextPublicAdminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || 'NOT SET'

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || 'NOT SET'
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET'

    // Check Redis for this user
    let redisResult = 'skipped'
    if (redisUrl !== 'NOT SET' && process.env.UPSTASH_REDIS_REST_TOKEN && queryUserId) {
      const res = await fetch(`${redisUrl}/get/academy_access_${queryUserId}`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      })
      const data = await res.json()
      redisResult = JSON.stringify(data)
    }

    return NextResponse.json({
      debug: true,
      clerkUser: user ? {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
      } : 'not signed in',
      queryUserId,
      envVars: {
        ADMIN_USER_ID: adminIdEnv,
        NEXT_PUBLIC_ADMIN_USER_ID: nextPublicAdminId,
        adminIdMatch: queryUserId === adminIdEnv,
        nextPublicMatch: queryUserId === nextPublicAdminId,
        clerkMatch: user?.id === adminIdEnv,
      },
      redis: {
        url: redisUrl !== 'NOT SET' ? 'SET' : 'NOT SET',
        token: redisToken,
        result: redisResult,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
