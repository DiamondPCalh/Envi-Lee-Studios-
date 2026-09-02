// app/api/generate/video/route.ts
// Image-to-video generation using Kling (fal.ai), Runway Gen-4, Higgsfield

import { NextRequest, NextResponse } from 'next/server'

// ── GET PUBLIC URL ────────────────────────────────────────────
async function getPublicUrl(imageUrl: string): Promise<string> {
  // If already a public URL return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  // Upload base64 to Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'
  if (!cloudName) throw new Error('CLOUDINARY_CLOUD_NAME not configured')
  const fd = new FormData()
  fd.append('file', imageUrl)
  fd.append('upload_preset', uploadPreset)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST', body: fd,
  })
  if (!res.ok) throw new Error('Failed to upload image to Cloudinary')
  const data = await res.json() as { secure_url?: string }
  if (!data.secure_url) throw new Error('No URL returned from Cloudinary')
  return data.secure_url
}

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
    const body = await req.json()
    const { model, duration } = body
    let { imageUrl, prompt } = body

    // Provide fallback prompt if missing
    if (!prompt) prompt = 'Cinematic video, smooth natural motion, ultra realistic, professional quality'
    
    // Handle missing imageUrl
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required — please select a scene still first' }, { status: 400 })

    // Ensure we have a public URL — Kling, Runway and Higgsfield all need public URLs
    const publicImageUrl = await getPublicUrl(imageUrl)

    let result

    if (model === 'kling-video' || !model) {
      result = await generateKlingVideo(publicImageUrl, prompt, duration || 5)
    } else if (model === 'runway') {
      result = await generateRunwayVideo(publicImageUrl, prompt, duration || 5)
    } else if (model === 'higgsfield' || model === 'higgsfield-kling' || model === 'seedance') {
      const keyId = process.env.HIGGSFIELD_KEY_ID
      const keySecret = process.env.HIGGSFIELD_API_KEY
      if (!keyId || !keySecret) return NextResponse.json({ error: 'HIGGSFIELD_KEY_ID or HIGGSFIELD_API_KEY not configured' }, { status: 500 })

      // Choose endpoint based on model
      const endpointMap: Record<string, string> = {
        'higgsfield': 'higgsfield-ai/dop/standard',
        'higgsfield-kling': 'kling-video/v2.1/pro/image-to-video',
        'seedance': 'seedance-i2v-pro-250528',
      }
      const endpoint = endpointMap[model] || 'higgsfield-ai/dop/standard'

      const hfRes = await fetch(`https://platform.higgsfield.ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${keyId}:${keySecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicImageUrl,
          prompt: prompt + '. Natural smooth cinematic motion.',
          aspect_ratio: '16:9',
        }),
      })
      const hfText = await hfRes.text()
      let hfData: Record<string, unknown>
      try { hfData = JSON.parse(hfText) } catch { throw new Error('Higgsfield returned: ' + hfText.slice(0, 200)) }
      if (!hfRes.ok) throw new Error(String(hfData.message || hfData.error || 'Higgsfield generation failed: ' + hfText.slice(0, 200)))
      const jobId = String(hfData.request_id || hfData.id || '')
      if (!jobId) throw new Error('No request ID from Higgsfield: ' + JSON.stringify(hfData))
      return NextResponse.json({ success: true, jobId, provider: 'higgsfield' })
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
    } else if (model === 'higgsfield' || model === 'higgsfield-kling' || model === 'seedance') {
      const keyId = process.env.HIGGSFIELD_KEY_ID
      const keySecret = process.env.HIGGSFIELD_API_KEY
      if (keyId && keySecret) {
        const res = await fetch(`https://platform.higgsfield.ai/requests/${jobId}/status`, {
          headers: { 'Authorization': `Key ${keyId}:${keySecret}` },
        })
        const text = await res.text()
        let data: Record<string, unknown>
        try { data = JSON.parse(text) } catch { return NextResponse.json({ status: 'processing', raw: text }) }
        const status = String(data.status || '')
        const isComplete = status === 'completed' || status === 'succeeded' || status === 'success' || status === 'COMPLETED'
        const isFailed = status === 'failed' || status === 'error' || status === 'FAILED'
        if (isFailed) return NextResponse.json({ status: 'failed', error: String(data.error || data.message || 'Generation failed') })
        if (isComplete) {
          const out = data.output as Record<string, unknown> | undefined
          const jobs = data.jobs as Array<Record<string, unknown>> | undefined
          videoUrl = String(
            out?.video_url || out?.url ||
            (jobs?.[0]?.results as Record<string, unknown>)?.raw as string | undefined ||
            data.video_url || ''
          ) || null
        }
        return NextResponse.json({ status: isComplete ? 'completed' : 'processing', videoUrl, raw: data })
      }
    }

    if (videoUrl) return NextResponse.json({ success: true, videoUrl, status: 'completed' })
    return NextResponse.json({ success: false, status: 'processing' })

  } catch (err) {
    console.error('[/api/generate/video GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
