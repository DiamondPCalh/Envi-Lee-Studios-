// app/api/generate/lipsync/route.ts
// Video lip sync using Sync.so (primary) and Higgsfield Speak (secondary)
// Sync.so models:
//   lipsync-2       — general purpose, most natural ($0.04/sec)
//   lipsync-2-pro   — studio grade, preserves facial details ($0.08/sec)
//   sync-3          — most powerful, 4K native, handles any angle ($0.133/sec)

import { NextRequest, NextResponse } from 'next/server'

// ── SYNC.SO ───────────────────────────────────────────────────
async function createSyncJob(videoUrl: string, audioUrl: string, model: string) {
  const key = process.env.SYNCLABS_API_KEY
  if (!key) throw new Error('SYNCLABS_API_KEY not configured in Vercel')

  const res = await fetch('https://api.sync.so/v2/generate', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'lipsync-2',
      input: [
        { type: 'video', url: videoUrl },
        { type: 'audio', url: audioUrl },
      ],
      options: {
        output_format: 'mp4',
        active_speaker: true,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sync.so error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.id
}

async function checkSyncJob(jobId: string) {
  const key = process.env.SYNCLABS_API_KEY
  if (!key) throw new Error('SYNCLABS_API_KEY not configured')

  const res = await fetch(`https://api.sync.so/v2/generate/${jobId}`, {
    headers: { 'x-api-key': key },
  })

  if (!res.ok) throw new Error(`Poll error: ${res.status}`)
  return await res.json()
}

// ── HIGGSFIELD SPEAK ──────────────────────────────────────────
async function createHiggsfieldSpeakJob(videoUrl: string, audioUrl: string) {
  const keyId = process.env.HIGGSFIELD_KEY_ID
  const keySecret = process.env.HIGGSFIELD_API_KEY
  if (!keyId || !keySecret) throw new Error('Higgsfield keys not configured')

  const res = await fetch('https://platform.higgsfield.ai/v1/lipsync', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${keyId}:${keySecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_url: videoUrl,
      audio_url: audioUrl,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Higgsfield error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.request_id ?? data.id
}

// ── UPLOAD TO CLOUDINARY FOR PUBLIC URL ───────────────────────
// If video/audio is base64 we need to get a public URL first
// Using a simple approach — store in /tmp and serve, or use fal.ai upload
async function uploadToFal(base64Data: string, filename: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY needed to upload files')

  const blob = await fetch(base64Data).then(r => r.blob())
  const formData = new FormData()
  formData.append('file', blob, filename)

  const res = await fetch('https://fal.run/fal-ai/upload', {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}` },
    body: formData,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  const data = await res.json()
  return data.url
}

// POST — create a lip sync job
export async function POST(req: NextRequest) {
  try {
    const { videoUrl, audioUrl, videoData, audioData, model, provider } = await req.json()

    if (!videoUrl && !videoData) {
      return NextResponse.json({ error: 'videoUrl or videoData required' }, { status: 400 })
    }
    if (!audioUrl && !audioData) {
      return NextResponse.json({ error: 'audioUrl or audioData required' }, { status: 400 })
    }

    // Get public URLs — upload base64 data if needed
    let finalVideoUrl = videoUrl
    let finalAudioUrl = audioUrl

    if (!finalVideoUrl && videoData) {
      finalVideoUrl = await uploadToFal(videoData, 'video.mp4')
    }
    if (!finalAudioUrl && audioData) {
      finalAudioUrl = await uploadToFal(audioData, 'audio.mp3')
    }

    // Choose provider
    const useProvider = provider || 'synclabs'

    if (useProvider === 'synclabs') {
      const jobId = await createSyncJob(finalVideoUrl, finalAudioUrl, model || 'lipsync-2')
      return NextResponse.json({ jobId, provider: 'synclabs', status: 'processing' })
    }

    if (useProvider === 'higgsfield') {
      const jobId = await createHiggsfieldSpeakJob(finalVideoUrl, finalAudioUrl)
      return NextResponse.json({ jobId, provider: 'higgsfield', status: 'processing' })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/lipsync POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// GET — poll for job status
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('jobId')
    const provider = req.nextUrl.searchParams.get('provider') ?? 'synclabs'

    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    if (provider === 'synclabs') {
      const data = await checkSyncJob(jobId)
      const status = data.status?.toLowerCase()

      if (status === 'completed') {
        return NextResponse.json({
          status: 'completed',
          videoUrl: data.outputUrl ?? data.output_url ?? data.url,
          provider: 'synclabs',
        })
      }
      if (status === 'failed' || status === 'rejected') {
        return NextResponse.json({ status: 'failed', error: data.error ?? 'Generation failed' })
      }
      return NextResponse.json({ status: 'processing', syncStatus: data.status })
    }

    if (provider === 'higgsfield') {
      const keyId = process.env.HIGGSFIELD_KEY_ID
      const keySecret = process.env.HIGGSFIELD_API_KEY
      if (!keyId || !keySecret) throw new Error('Higgsfield keys not configured')

      const res = await fetch(`https://platform.higgsfield.ai/v1/requests/${jobId}/status`, {
        headers: { 'Authorization': `Key ${keyId}:${keySecret}` },
      })
      const data = await res.json()
      const status = data.status?.toLowerCase()

      if (status === 'completed' || status === 'succeeded') {
        return NextResponse.json({ status: 'completed', videoUrl: data.output?.[0] ?? data.url, provider: 'higgsfield' })
      }
      if (status === 'failed') {
        return NextResponse.json({ status: 'failed', error: 'Generation failed' })
      }
      return NextResponse.json({ status: 'processing' })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/lipsync GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
