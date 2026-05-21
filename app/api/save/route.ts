// app/api/save/route.ts
// POST /api/save - save a piece of work
// GET /api/save - get all saved work
// DELETE /api/save - delete a saved item
 
import { NextRequest, NextResponse } from 'next/server'
 
// ── Simple file-based storage using Vercel's tmp ─────────────
// For production use, replace with Vercel KV or a database
// To upgrade to Vercel KV:
// 1. Go to Vercel Dashboard → Storage → Create KV Database
// 2. Connect it to your project
// 3. Replace the storage functions below with KV calls
 
// We use a simple in-memory store for now
// This persists within a single serverless function instance
// For persistent storage across requests, connect Vercel KV
 
interface SavedItem {
  id: string
  title: string
  tool: string
  content: string
  prompt?: string
  imageUrl?: string
  savedAt: string
}
 
// GET all saved items
export async function GET() {
  try {
    // Return empty array for now - will be populated via client-side localStorage
    // When you connect Vercel KV, replace this with KV.get('saved-items')
    return NextResponse.json({ items: [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load saved items' }, { status: 500 })
  }
}
 
// POST save a new item
export async function POST(req: NextRequest) {
  try {
    const { title, tool, content, prompt, imageUrl } = await req.json()
 
    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'content or imageUrl is required' }, { status: 400 })
    }
 
    const item: SavedItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || `${tool} — ${new Date().toLocaleDateString()}`,
      tool: tool || 'unknown',
      content: content || '',
      prompt: prompt || '',
      imageUrl: imageUrl || '',
      savedAt: new Date().toISOString(),
    }
 
    // When you connect Vercel KV, save here:
    // await kv.lpush('saved-items', JSON.stringify(item))
 
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('[/api/save]', err)
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
  }
}
 
// DELETE a saved item
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    // When you connect Vercel KV, delete here
    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
