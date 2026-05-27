// app/api/generate/omnihuman/route.ts
// ByteDance OmniHuman v1.5 via fal.ai
// Full body movement + lip sync from a single photo and audio file
// Requires FAL_API_KEY in Vercel environment variables
// Cost: ~$0.16 per second

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageData, audioUrl, prompt, resolution } = await req.json()

    const falKey = process.env.FAL_API_KEY
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })
    }

    if (!imageData) {
      return NextResponse.json({ error: 'imageData is required' }, { status: 400 })
    }

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required. Upload your ElevenLabs audio to a cloud storage URL first.' }, { status: 400 })
    }

    // Step 1 — Upload image to fal.ai storage
    const imageBlob = await fetch(imageData).then(r => r.blob())
    const uploadFormData = new FormData()
    uploadFormData.append('file', imageBlob, 'character.jpg')

    const uploadRes = await fetch('https://fal.run/fal-ai/upload', {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}` },
      body: uploadFormData,
    })

    let imageUrl = imageData // fallback to base64 if upload fails
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json()
      imageUrl = uploadData.url ?? imageData
    }

    // Step 2 — Submit OmniHuman job
    const body: Record<string, string> = {
      image_url: imageUrl,
      audio_url: audioUrl,
    }

    if (prompt?.trim()) body.prompt = prompt.trim()
    if (resolution) body.resolution = resolution

    const res = await fetch('https://fal.run/fal-ai/bytedance/omnihuman/v1.5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OmniHuman error ${res.status}: ${err}`)
    }

    const data = await res.json()

    // Check if returned directly or needs polling
    if (data.video?.url) {
      return NextResponse.json({ videoUrl: data.video.url, status: 'completed' })
    }

    if (data.request_id) {
      return NextResponse.json({ requestId: data.request_id, status: 'processing' })
    }

    throw new Error('No video returned from OmniHuman')

  } catch (err) {
    console.error('[omnihuman]', err)
    return NextResponse.json({ error: `OmniHuman failed: ${(err as Error).message}` }, { status: 500 })
  }
}

// GET — poll for video status
export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId')
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    const falKey = process.env.FAL_API_KEY
    if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })

    const res = await fetch(`https://queue.fal.run/fal-ai/bytedance/omnihuman/requests/${requestId}`, {
      headers: { 'Authorization': `Key ${falKey}` },
    })

    if (!res.ok) throw new Error(`Poll error ${res.status}`)

    const data = await res.json()

    if (data.status === 'COMPLETED') {
      return NextResponse.json({ videoUrl: data.output?.video?.url, status: 'completed' })
    }

    if (data.status === 'FAILED') {
      return NextResponse.json({ status: 'failed', error: 'Generation failed' })
    }

    return NextResponse.json({ status: 'processing', queuePosition: data.queue_position ?? 0 })

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
