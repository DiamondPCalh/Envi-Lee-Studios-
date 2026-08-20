// app/api/generate/omnihuman/route.ts
// OmniHuman lip sync via Higgsfield API
// Auth: Key {HF_API_KEY_ID}:{HF_API_KEY_SECRET}

import { NextRequest, NextResponse } from 'next/server'

const HF_BASE = 'https://platform.higgsfield.ai'
const FAL_API = 'https://fal.run'

function hfHeaders() {
  const keyId = process.env.HIGGSFIELD_KEY_ID
  const keySecret = process.env.HIGGSFIELD_API_KEY
  if (!keyId || !keySecret) throw new Error('HIGGSFIELD_KEY_ID or HIGGSFIELD_API_KEY not configured in Vercel')
  return {
    'Authorization': `Key ${keyId}:${keySecret}`,
    'Content-Type': 'application/json',
  }
}

async function uploadToFal(base64Data: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')
  const blob = await fetch(base64Data).then(r => r.blob())
  const fd = new FormData()
  fd.append('file', blob, 'image.jpg')
  const res = await fetch(`${FAL_API}/fal-ai/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}` },
    body: fd,
  })
  if (!res.ok) throw new Error('Failed to upload image to get public URL')
  const data = await res.json()
  return data.url
}

export async function POST(req: NextRequest) {
  try {
    const { imageData, imageUrl, audioUrl, prompt, scenePrompt, aspectRatio } = await req.json()

    // Get public image URL
    let publicImageUrl = imageUrl
    if (!publicImageUrl && imageData) {
      if (imageData.startsWith('data:') || imageData.startsWith('blob:')) {
        publicImageUrl = await uploadToFal(imageData)
      } else {
        publicImageUrl = imageData
      }
    }

    if (!publicImageUrl) return NextResponse.json({ error: 'imageData or imageUrl required' }, { status: 400 })

    const finalPrompt = scenePrompt || prompt || 'Person speaking naturally with realistic lip sync and expressive facial movement'

    // Submit to Higgsfield OmniHuman
    const res = await fetch(`${HF_BASE}/higgsfield-ai/omnihuman-1/image-to-video`, {
      method: 'POST',
      headers: hfHeaders(),
      body: JSON.stringify({
        image_url: publicImageUrl,
        prompt: finalPrompt,
        aspect_ratio: aspectRatio || '9:16',
        ...(audioUrl ? { audio_url: audioUrl } : {}),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Fallback to Sync.so if Higgsfield fails and audio provided
      if (audioUrl) {
        const syncKey = process.env.SYNCLABS_API_KEY
        if (syncKey) {
          const syncRes = await fetch('https://api.sync.so/v2/generate', {
            method: 'POST',
            headers: { 'x-api-key': syncKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioUrl,
              videoUrl: publicImageUrl,
              model: 'lipsync-2',
            }),
          })
          const syncData = await syncRes.json()
          if (syncRes.ok && syncData.id) {
            return NextResponse.json({ requestId: syncData.id, provider: 'synclabs', status: 'queued' })
          }
        }
      }
      throw new Error(data.message || data.error || 'Higgsfield OmniHuman failed')
    }

    return NextResponse.json({
      success: true,
      requestId: data.request_id,
      status: data.status,
      provider: 'higgsfield',
    })

  } catch (err) {
    console.error('[/api/generate/omnihuman]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId')
    const provider = req.nextUrl.searchParams.get('provider') || 'higgsfield'

    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    if (provider === 'synclabs') {
      const syncKey = process.env.SYNCLABS_API_KEY
      if (!syncKey) return NextResponse.json({ error: 'SYNCLABS_API_KEY not configured' }, { status: 500 })
      const res = await fetch(`https://api.sync.so/v2/generate/${requestId}`, {
        headers: { 'x-api-key': syncKey },
      })
      const data = await res.json()
      return NextResponse.json({
        status: data.status,
        videoUrl: data.outputUrl || null,
      })
    }

    // Higgsfield polling
    const res = await fetch(`${HF_BASE}/requests/${requestId}/status`, {
      headers: hfHeaders(),
    })
    const data = await res.json()

    return NextResponse.json({
      status: data.status,
      requestId,
      videoUrl: data.output?.video_url || data.output?.url || null,
    })

  } catch (err) {
    console.error('[/api/generate/omnihuman GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
