// app/api/generate/soulid/route.ts
// Higgsfield Soul ID — trains a persistent face+body model from 15-20 photos
// Once trained returns a soul_id that locks the exact person into every generation
// Uses official Higgsfield API via Authorization: Key KEY_ID:KEY_SECRET

import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://platform.higgsfield.ai'

function authHeader() {
  const keyId = process.env.HIGGSFIELD_KEY_ID
  const keySecret = process.env.HIGGSFIELD_API_KEY
  if (!keyId || !keySecret) throw new Error('HIGGSFIELD_KEY_ID and HIGGSFIELD_API_KEY must be set in Vercel')
  return `Key ${keyId}:${keySecret}`
}

async function hig(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': authHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

// Upload a base64 image to Higgsfield and get an upload_id back
async function uploadImage(base64Data: string, filename: string): Promise<string> {
  const blob = await fetch(base64Data).then(r => r.blob())
  const formData = new FormData()
  formData.append('file', blob, filename)

  const res = await fetch(`${BASE}/v1/upload`, {
    method: 'POST',
    headers: { 'Authorization': authHeader() },
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.upload_id ?? data.id ?? data.uuid
}

// POST — train a Soul ID OR generate an image with Soul ID
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ── TRAIN SOUL ID ─────────────────────────────────────────
    if (action === 'train') {
      const { photos, characterName } = body

      if (!photos || photos.length < 5) {
        return NextResponse.json({ error: 'Please upload at least 5 photos. 15-20 gives the best results.' }, { status: 400 })
      }

      // Upload all photos to Higgsfield
      const uploadIds: string[] = []
      for (let i = 0; i < Math.min(photos.length, 20); i++) {
        try {
          const uploadId = await uploadImage(photos[i], `photo_${i}.jpg`)
          uploadIds.push(uploadId)
        } catch (e) {
          console.error(`Failed to upload photo ${i}:`, e)
        }
        // Small delay between uploads
        if (i < photos.length - 1) await new Promise(r => setTimeout(r, 300))
      }

      if (uploadIds.length < 5) {
        return NextResponse.json({ error: 'Not enough photos uploaded successfully. Please try again.' }, { status: 500 })
      }

      // Submit Soul ID training
      const trainRes = await hig('/v1/soul-id/train', 'POST', {
        name: characterName || 'My AI Twin',
        images: uploadIds,
      })

      if (!trainRes.ok) {
        return NextResponse.json({ error: `Training failed: ${JSON.stringify(trainRes.data)}` }, { status: 500 })
      }

      const soulId = trainRes.data?.soul_id ?? trainRes.data?.id ?? trainRes.data?.reference_id
      const status = trainRes.data?.status ?? 'processing'

      return NextResponse.json({
        soulId,
        status,
        message: 'Soul ID training started! Usually takes 3-5 minutes.',
        uploadCount: uploadIds.length,
      })
    }

    // ── CHECK TRAINING STATUS ────────────────────────────────
    if (action === 'status') {
      const { soulId } = body
      if (!soulId) return NextResponse.json({ error: 'soulId required' }, { status: 400 })

      const res = await hig(`/v1/soul-id/${soulId}`)
      if (!res.ok) return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })

      return NextResponse.json({
        status: res.data?.status ?? 'unknown',
        soulId,
        ready: res.data?.status === 'completed' || res.data?.status === 'ready',
      })
    }

    // ── GENERATE IMAGE WITH SOUL ID ──────────────────────────
    if (action === 'generate') {
      const { soulId, prompt, style, aspectRatio, resolution } = body

      if (!soulId) return NextResponse.json({ error: 'soulId required' }, { status: 400 })
      if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

      // Use Soul Character endpoint for face-consistent generation
      const genRes = await hig('/v1/text2image/soul', 'POST', {
        prompt,
        soul_id: soulId,
        num_images: 1,
        resolution: resolution ?? '2K',
        aspect_ratio: aspectRatio ?? '4:3',
        style_preset: style ?? null,
      })

      if (!genRes.ok) {
        // Try character endpoint as fallback
        const charRes = await hig('/higgsfield-ai/soul/character', 'POST', {
          prompt,
          soul_id: soulId,
          num_images: 1,
        })
        if (!charRes.ok) {
          return NextResponse.json({ error: `Generation failed: ${JSON.stringify(genRes.data)}` }, { status: 500 })
        }
        const requestId = charRes.data?.request_id
        if (requestId) return NextResponse.json({ requestId, status: 'processing' })
      }

      const requestId = genRes.data?.request_id ?? genRes.data?.id
      if (requestId) return NextResponse.json({ requestId, status: 'processing' })

      // If returned directly
      const imageUrl = genRes.data?.images?.[0]?.url ?? genRes.data?.output?.[0]
      if (imageUrl) return NextResponse.json({ imageUrl, status: 'completed' })

      return NextResponse.json({ error: 'No request ID or image returned' }, { status: 500 })
    }

    // ── LIST SOUL IDs ─────────────────────────────────────────
    if (action === 'list') {
      const res = await hig('/v1/soul-id?page=1&page_size=50')
      if (!res.ok) return NextResponse.json({ soulIds: [] })
      return NextResponse.json({ soulIds: res.data?.items ?? res.data?.soul_ids ?? res.data ?? [] })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/soulid]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// GET — poll for generation result
export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId')
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    const res = await hig(`/v1/requests/${requestId}/status`)
    if (!res.ok) return NextResponse.json({ status: 'processing' })

    const status = res.data?.status?.toLowerCase()
    if (status === 'completed' || status === 'succeeded') {
      const imageUrl = res.data?.output?.[0] ?? res.data?.images?.[0]?.url ?? res.data?.result?.url
      return NextResponse.json({ status: 'completed', imageUrl })
    }
    if (status === 'failed' || status === 'error') {
      return NextResponse.json({ status: 'failed', error: res.data?.error ?? 'Generation failed' })
    }
    return NextResponse.json({ status: 'processing', queuePosition: res.data?.queue_position ?? 0 })

  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
