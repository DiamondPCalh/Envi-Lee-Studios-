// app/api/generate/video/route.ts
// Image-to-video generation using Kling (fal.ai), Runway Gen-4, Higgsfield

import { NextRequest, NextResponse } from 'next/server'

// ── KLING VIA FAL.AI ─────────────────────────────────────────
async function generateKlingVideo(imageUrl: string, prompt: string, duration: number) {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')

  const res = await fetch('https://queue.fal.run/fal-ai/kling-video/v2.1/pro/image-to-video', {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt,
      duration: duration <= 5 ? '5' : '10',
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Kling generation failed')
  return { jobId: data.request_id, provider: 'kling-fal' }
}

async function pollKlingFal(requestId: string) {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')

  const res = await fetch(`https://queue.fal.run/fal-ai/kling-video/v2.1/pro/image-to-video/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${falKey}` },
  })
  const data = await res.json()
  if (data.status === 'COMPLETED' && data.video?.url) return data.video.url
  if (data.status === 'FAILED') throw new Error('Kling generation failed')
  return null
}

// ── RUNWAY GEN-4 ──────────────────────────────────────────────
async function generateRunwayVideo(imageUrl: string, prompt: string, duration: number) {
  const runwayKey = process.env.RUNWAY_API_KEY
  if (!runwayKey) throw new Error('RUNWAY_API_KEY not configured in Vercel')

  const res = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${runwayKey}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: imageUrl,
      promptText: prompt,
      duration: duration <= 5 ? 5 : 10,
      ratio: '1280:720',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Runway generation failed')
  return { jobId: data.id, provider: 'runway' }
}

async function pollRunway(jobId: string) {
  const runwayKey = process.env.RUNWAY_API_KEY
  if (!runwayKey) throw new Error('RUNWAY_API_KEY not configured')

  const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${jobId}`, {
    headers: { 'Authorization': `Bearer ${runwayKey}`, 'X-Runway-Version': '2024-11-06' },
  })
  const data = await res.json()
  if (data.status === 'SUCCEEDED' && data.output?.[0]) return data.output[0]
  if (data.status === 'FAILED') throw new Error('Runway generation failed')
  return null
}

// ── MAIN POST HANDLER ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, model, duration } = await req.json()
    if (!imageUrl || !prompt) return NextResponse.json({ error: 'imageUrl and prompt required' }, { status: 400 })

    let result

    if (model === 'kling-video' || !model) {
      result = await generateKlingVideo(imageUrl, prompt, duration || 5)
    } else if (model === 'runway') {
      result = await generateRunwayVideo(imageUrl, prompt, duration || 5)
    } else if (model === 'higgsfield') {
      return NextResponse.json({ error: 'Higgsfield requires Plus plan — configure HIGGSFIELD_API_KEY and upgrade to Plus plan at higgsfield.ai' }, { status: 400 })
    } else {
      result = await generateKlingVideo(imageUrl, prompt, duration || 5)
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[/api/generate/video POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// ── POLLING GET HANDLER ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('jobId')
    const model = req.nextUrl.searchParams.get('model') || 'kling-video'
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    let videoUrl = null

    if (model === 'kling-video') {
      videoUrl = await pollKlingFal(jobId)
    } else if (model === 'runway') {
      videoUrl = await pollRunway(jobId)
    }

    if (videoUrl) return NextResponse.json({ success: true, videoUrl, status: 'completed' })
    return NextResponse.json({ success: false, status: 'processing' })

  } catch (err) {
    console.error('[/api/generate/video GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
