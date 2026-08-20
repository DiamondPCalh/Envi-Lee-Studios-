// app/api/generate/higgsfield/route.ts
// Higgsfield API integration — video, image, Soul ID, OmniHuman
// Auth: Key {HF_API_KEY_ID}:{HF_API_KEY_SECRET}

import { NextRequest, NextResponse } from 'next/server'

const HF_BASE = 'https://platform.higgsfield.ai'

function hfHeaders() {
  const keyId = process.env.HIGGSFIELD_KEY_ID
  const keySecret = process.env.HIGGSFIELD_API_KEY
  if (!keyId || !keySecret) throw new Error('HIGGSFIELD_KEY_ID or HIGGSFIELD_API_KEY not configured in Vercel')
  return {
    'Authorization': `Key ${keyId}:${keySecret}`,
    'Content-Type': 'application/json',
  }
}

// ── SUBMIT A REQUEST ──────────────────────────────────────────
async function submitRequest(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${HF_BASE}/${endpoint}`, {
    method: 'POST',
    headers: hfHeaders(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || JSON.stringify(data))
  return data // { status, request_id, status_url, cancel_url }
}

// ── POLL FOR RESULT ───────────────────────────────────────────
async function getStatus(requestId: string) {
  const res = await fetch(`${HF_BASE}/requests/${requestId}/status`, {
    headers: hfHeaders(),
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, requestId, imageUrl, prompt, model, duration, aspectRatio, resolution, motionStyle } = body

    // ── POLL STATUS ───────────────────────────────────────────
    if (action === 'poll') {
      if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })
      const data = await getStatus(requestId)
      return NextResponse.json({
        status: data.status,
        requestId,
        output: data.output,
        videoUrl: data.output?.video_url || data.output?.url || null,
        imageUrl: data.output?.image_url || data.output?.images?.[0]?.url || null,
      })
    }

    // ── IMAGE TO VIDEO ────────────────────────────────────────
    if (action === 'image_to_video') {
      if (!imageUrl || !prompt) return NextResponse.json({ error: 'imageUrl and prompt required' }, { status: 400 })

      // Choose model based on preference
      const modelMap: Record<string, string> = {
        'dop': 'higgsfield-ai/dop/standard',
        'kling': 'kling-video/v2.1/pro/image-to-video',
        'omnihuman': 'higgsfield-ai/omnihuman-1/image-to-video',
        'default': 'higgsfield-ai/dop/standard',
      }
      const endpoint = modelMap[model || 'default'] || modelMap['default']

      const motionPrompt = `${prompt}. ${motionStyle === 'subtle' ? 'Minimal gentle movement, nearly still.' : motionStyle === 'cinematic' ? 'Slow dramatic cinematic camera movement, shallow depth of field.' : motionStyle === 'dynamic' ? 'Strong expressive camera movement, energetic.' : 'Natural smooth medium motion, realistic.'}`

      const data = await submitRequest(endpoint, {
        image_url: imageUrl,
        prompt: motionPrompt,
        ...(duration ? { duration } : {}),
        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
      })

      return NextResponse.json({
        success: true,
        requestId: data.request_id,
        status: data.status,
        statusUrl: data.status_url,
      })
    }

    // ── SOUL ID — Generate image ──────────────────────────────
    if (action === 'soul_image') {
      if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })
      const data = await submitRequest('higgsfield-ai/soul/standard', {
        prompt,
        aspect_ratio: aspectRatio || '4:3',
        resolution: resolution || '720p',
      })
      return NextResponse.json({ success: true, requestId: data.request_id, status: data.status })
    }

    // ── OMNIHUMAN LIP SYNC ────────────────────────────────────
    if (action === 'lipsync') {
      if (!imageUrl) return NextResponse.json({ error: 'imageUrl required for OmniHuman' }, { status: 400 })
      const data = await submitRequest('higgsfield-ai/omnihuman-1/image-to-video', {
        image_url: imageUrl,
        prompt: prompt || 'Person speaking naturally, realistic lip sync, clear facial movement',
        aspect_ratio: aspectRatio || '9:16',
      })
      return NextResponse.json({ success: true, requestId: data.request_id, status: data.status })
    }

    // ── TEXT TO VIDEO ─────────────────────────────────────────
    if (action === 'text_to_video') {
      if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })
      const data = await submitRequest('higgsfield-ai/dop/standard', {
        prompt,
        aspect_ratio: aspectRatio || '16:9',
        resolution: resolution || '720p',
      })
      return NextResponse.json({ success: true, requestId: data.request_id, status: data.status })
    }

    return NextResponse.json({ error: 'Invalid action. Use: image_to_video, soul_image, lipsync, text_to_video, poll' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/higgsfield]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId')
    if (requestId) {
      const data = await getStatus(requestId)
      return NextResponse.json({
        status: data.status,
        requestId,
        videoUrl: data.output?.video_url || data.output?.url || null,
        imageUrl: data.output?.image_url || data.output?.images?.[0]?.url || null,
        output: data.output,
      })
    }
    // Test connection
    hfHeaders() // throws if keys missing
    return NextResponse.json({ status: 'Higgsfield API connected', models: ['dop', 'kling', 'omnihuman', 'soul'] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
