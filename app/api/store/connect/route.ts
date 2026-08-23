// app/api/store/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, provider, apiKey, storeName, storeSlug, isPublic } = await req.json()
    if (!userId || !apiKey || !storeName) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!redisUrl || !redisToken) return NextResponse.json({ error: 'Redis not configured' }, { status: 500 })

    const storeData = JSON.stringify({ userId, provider, storeName, storeSlug, isPublic, createdAt: new Date().toISOString() })

    // Save store data (DO NOT save API key to Redis — keep server-side only)
    await fetch(`${redisUrl}/set/pod_store_${userId}/${encodeURIComponent(storeData)}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })

    // If public add to marketplace list
    if (isPublic) {
      await fetch(`${redisUrl}/sadd/pod_marketplace/${encodeURIComponent(storeData)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      })
    }

    // Save slug → userId mapping for public store pages
    await fetch(`${redisUrl}/set/pod_slug_${storeSlug}/${userId}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })

    return NextResponse.json({ success: true, storeSlug })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
