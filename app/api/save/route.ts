// app/api/save/route.ts
// Persistent save system using Upstash Redis
// Each user's saves are stored under their Clerk user ID

import { NextRequest, NextResponse } from 'next/server'

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? ''
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

interface SavedItem {
  id: string
  title: string
  tool: string
  content: string
  prompt?: string
  imageUrl?: string
  savedAt: string
}

async function redis(command: string[]) {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  return res.json()
}

// GET — load all saved items for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ items: [] })

    const key = `saves:${userId}`
    const result = await redis(['GET', key])
    const items = result.result ? JSON.parse(result.result) : []
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[save GET]', err)
    return NextResponse.json({ items: [] })
  }
}

// POST — save a new item
export async function POST(req: NextRequest) {
  try {
    const { userId, tool, content, prompt, imageUrl, title } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const key = `saves:${userId}`

    // Get existing saves
    const existing = await redis(['GET', key])
    const items: SavedItem[] = existing.result ? JSON.parse(existing.result) : []

    // Add new item
    const newItem: SavedItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || `${tool} — ${new Date().toLocaleDateString()}`,
      tool: tool || 'unknown',
      content: content || '',
      prompt: prompt || '',
      imageUrl: imageUrl || '',
      savedAt: new Date().toISOString(),
    }

    items.unshift(newItem)
    const trimmed = items.slice(0, 200) // Keep last 200 saves

    // Save back to Redis with 1 year expiry
    await redis(['SET', key, JSON.stringify(trimmed), 'EX', '31536000'])

    return NextResponse.json({ success: true, item: newItem })
  } catch (err) {
    console.error('[save POST]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// DELETE — remove a saved item
export async function DELETE(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json()
    if (!userId || !itemId) return NextResponse.json({ error: 'userId and itemId required' }, { status: 400 })

    const key = `saves:${userId}`
    const existing = await redis(['GET', key])
    const items: SavedItem[] = existing.result ? JSON.parse(existing.result) : []
    const updated = items.filter(i => i.id !== itemId)
    await redis(['SET', key, JSON.stringify(updated), 'EX', '31536000'])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[save DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
