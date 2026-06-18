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
      // Check paid access
      const accessRes = await fetch(`${redisUrl}/get/vault_access_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const accessData = await accessRes.json()
      if (accessData.result === 'true' || accessData.result === '1') {
        return NextResponse.json({ hasAccess: true, role: 'subscriber' })
      }

      // Check lock
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
