// app/api/generate/video/route.ts
// Supports: Kling AI (fal.ai), Higgsfield (Segmind), Google Veo 3.1 (Gemini)

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, duration, aspectRatio, mode, provider } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    const videoProvider = provider ?? 'kling'

    // ── KLING AI via fal.ai ──────────────────────────────────
    if (videoProvider === 'kling') {
      const falKey = process.env.FAL_API_KEY
      if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })

      const endpoint = mode === 'pro'
        ? 'https://fal.run/fal-ai/kling-video/v1.6/pro/text-to-video'
        : 'https://fal.run/fal-ai/kling-video/v1.6/standard/text-to-video'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({
          prompt,
          negative_prompt: 'blurry, low quality, distorted, shaky',
          duration: duration ?? '5',
          aspect_ratio: aspectRatio ?? '9:16',
        }),
      })

      if (!res.ok) throw new Error(`Kling error ${res.status}`)
      const data = await res.json()

      if (data.video?.url) return NextResponse.json({ videoUrl: data.video.url, status: 'completed', provider: 'kling' })
      if (data.request_id) return NextResponse.json({ requestId: data.request_id, status: 'processing', provider: 'kling' })
      throw new Error('No video returned from Kling')
    }

    // ── HIGGSFIELD via Segmind ───────────────────────────────
    if (videoProvider === 'higgsfield') {
      const segmindKey = process.env.SEGMIND_API_KEY
      if (!segmindKey) return NextResponse.json({ error: 'SEGMIND_API_KEY not configured in Vercel env vars' }, { status: 500 })

      const res = await fetch('https://api.segmind.com/v1/higgsfield-soul-text-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': segmindKey,
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: 'blurry, low quality, cartoonish, unrealistic',
          num_frames: parseInt(duration ?? '5') * 8,
          fps: 8,
          aspect_ratio: aspectRatio ?? '9:16',
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Higgsfield error ${res.status}: ${err}`)
      }

      const data = await res.json()
      if (data.video_url || data.output) {
        return NextResponse.json({ videoUrl: data.video_url ?? data.output, status: 'completed', provider: 'higgsfield' })
      }
      if (data.id) return NextResponse.json({ requestId: data.id, status: 'processing', provider: 'higgsfield' })
      throw new Error('No video returned from Higgsfield')
    }

    // ── GOOGLE VEO 3.1 via Gemini API ───────────────────────
    if (videoProvider === 'veo') {
      const geminiKey = process.env.GEMINI_API_KEY
      if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured in Vercel env vars' }, { status: 500 })

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateVideo?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          videoGenerationConfig: {
            durationSeconds: parseInt(duration ?? '5'),
            aspectRatio: aspectRatio === '9:16' ? 'ASPECT_RATIO_9_16' : aspectRatio === '16:9' ? 'ASPECT_RATIO_16_9' : 'ASPECT_RATIO_1_1',
          },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Veo error ${res.status}: ${err}`)
      }

      const data = await res.json()
      const operationName = data.name

      if (!operationName) throw new Error('No operation returned from Veo')
      return NextResponse.json({ requestId: operationName, status: 'processing', provider: 'veo' })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/video]', err)
    return NextResponse.json({ error: `Video generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}

// GET — poll for video status
export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId')
    const provider = req.nextUrl.searchParams.get('provider') ?? 'kling'

    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    // ── Poll Kling ──────────────────────────────────────────
    if (provider === 'kling') {
      const falKey = process.env.FAL_API_KEY
      if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })

      const res = await fetch(`https://queue.fal.run/fal-ai/kling-video/requests/${requestId}`, {
        headers: { 'Authorization': `Key ${falKey}` },
      })

      const data = await res.json()
      if (data.status === 'COMPLETED') return NextResponse.json({ videoUrl: data.output?.video?.url, status: 'completed' })
      if (data.status === 'FAILED') return NextResponse.json({ status: 'failed' })
      return NextResponse.json({ status: 'processing' })
    }

    // ── Poll Veo ────────────────────────────────────────────
    if (provider === 'veo') {
      const geminiKey = process.env.GEMINI_API_KEY
      if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${requestId}?key=${geminiKey}`)
      const data = await res.json()

      if (data.done && data.response?.videos?.[0]) {
        const videoData = data.response.videos[0].video.uri
        return NextResponse.json({ videoUrl: videoData, status: 'completed' })
      }
      if (data.done && data.error) return NextResponse.json({ status: 'failed', error: data.error.message })
      return NextResponse.json({ status: 'processing' })
    }

    return NextResponse.json({ status: 'processing' })

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
