// app/api/store/marketplace/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!redisUrl || !redisToken) return NextResponse.json({ stores: [] })

    const res = await fetch(`${redisUrl}/smembers/pod_marketplace`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
    const data = await res.json()
    const members = data.result || []
    const stores = members.map((m: string) => {
      try { return JSON.parse(decodeURIComponent(m)) }
      catch { return null }
    }).filter(Boolean)

    return NextResponse.json({ success: true, stores })
  } catch (err) {
    return NextResponse.json({ stores: [], error: (err as Error).message })
  }
}
