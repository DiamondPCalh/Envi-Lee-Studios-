// app/api/generate/video/route.ts
// POST /api/generate/video
// Generates videos using Kling AI via fal.ai
// Requires FAL_API_KEY in Vercel environment variables
 
import { NextRequest, NextResponse } from 'next/server'
 
export async function POST(req: NextRequest) {
  try {
    const { prompt, duration, aspectRatio, negativePrompt, mode } = await req.json()
 
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
 
    const falKey = process.env.FAL_API_KEY
    if (!falKey) {
      return NextResponse.json({
        error: 'FAL_API_KEY not configured. Add it to Vercel Environment Variables.',
      }, { status: 500 })
    }
 
    const videoMode = mode ?? 'standard' // standard or pro
    const videoDuration = duration ?? '5' // 5 or 10 seconds
    const ratio = aspectRatio ?? '9:16' // 9:16 for TikTok, 16:9 for YouTube
 
    // Use Kling AI via fal.ai
    const endpoint = videoMode === 'pro'
      ? 'https://fal.run/fal-ai/kling-video/v1.6/pro/text-to-video'
      : 'https://fal.run/fal-ai/kling-video/v1.6/standard/text-to-video'
 
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, shaky, bad lighting',
        duration: videoDuration,
        aspect_ratio: ratio,
      }),
    })
 
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`fal.ai Kling error ${res.status}: ${err}`)
    }
 
    const data = await res.json()
 
    // fal.ai returns a request_id for async jobs
    // Check if it returned directly or needs polling
    if (data.video?.url) {
      return NextResponse.json({ videoUrl: data.video.url, status: 'completed' })
    }
 
    if (data.request_id) {
      return NextResponse.json({ requestId: data.request_id, status: 'processing' })
    }
 
    throw new Error('No video URL or request ID returned')
 
  } catch (err) {
    console.error('[/api/generate/video]', err)
    return NextResponse.json({ error: `Video generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}
 
// GET - poll for video status
export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId')
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })
 
    const falKey = process.env.FAL_API_KEY
    if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })
 
    const res = await fetch(`https://queue.fal.run/fal-ai/kling-video/requests/${requestId}`, {
      headers: { 'Authorization': `Key ${falKey}` },
    })
 
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
 
    const data = await res.json()
 
    if (data.status === 'COMPLETED') {
      return NextResponse.json({ videoUrl: data.output?.video?.url, status: 'completed' })
    }
 
    if (data.status === 'FAILED') {
      return NextResponse.json({ status: 'failed', error: 'Video generation failed' })
    }
 
    return NextResponse.json({ status: 'processing', progress: data.queue_position ?? 0 })
 
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
