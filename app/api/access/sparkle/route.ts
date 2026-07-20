// app/api/access/sparkle/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ status: 'none' })

    const adminId = process.env.ADMIN_USER_ID
    if (userId === adminId) return NextResponse.json({ status: 'vip', role: 'admin' })

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (redisUrl && redisToken) {
      // Check VIP
      const vipRes = await fetch(`${redisUrl}/get/sparkle_vip_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const vipData = await vipRes.json()
      if (vipData.result === 'true') return NextResponse.json({ status: 'vip' })

      // Check member
      const memberRes = await fetch(`${redisUrl}/get/sparkle_member_${userId}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
      const memberData = await memberRes.json()
      if (memberData.result === 'true') return NextResponse.json({ status: 'member' })
    }

    return NextResponse.json({ status: 'none' })
  } catch (err) {
    console.error('[/api/access/sparkle]', err)
    return NextResponse.json({ status: 'none' })
  }
}
