// app/api/generate/image/route.ts
// Face locking: PuLID (ByteDance) — best face consistency in 2026
// Standard: FLUX Pro — ultra realistic
// Fallback: FLUX Schnell

import { NextRequest, NextResponse } from 'next/server'

const NEGATIVE = 'plastic skin, waxy skin, artificial look, CGI, render, 3D, overprocessed, fake, unnatural, doll, mannequin, blurry, low quality, distorted, watermark, text overlay, cartoon, anime, oversaturated'

const stylePrompts: Record<string, string> = {
  realistic: 'ultra realistic photography, Sony A7R IV 85mm f1.4, RAW photo, natural skin texture, skin pores visible, no filter, no AI look, photographic quality',
  cinematic: 'cinematic film still, anamorphic lens, shallow depth of field, dramatic lighting, Sony A7R IV, RAW photo, 35mm film, no filter',
  fashion: 'high end fashion editorial photography, Vogue magazine quality, professional studio lighting, Sony A7R IV 85mm f1.4, RAW photo',
  luxury: 'luxury lifestyle photography, warm golden hour light, high fashion editorial, Sony A7R IV, RAW photo',
  portrait: 'professional portrait photography, soft box lighting, sharp focus on face, bokeh background, studio quality, Sony A7R IV, skin pores visible',
  streetwear: 'urban street photography, authentic street style, natural light, candid editorial, Sony A7R IV',
  dramatic: 'dramatic cinematic photography, high contrast, moody shadows, film noir, intense atmosphere, Sony A7R IV',
  vibrant: 'vibrant colorful editorial photography, rich saturated colors, energetic lifestyle, Sony A7R IV',
}

const sizeMap: Record<string, string> = {
  portrait_4_3: 'portrait_4_3',
  portrait_16_9: 'portrait_16_9',
  square_hd: 'square_hd',
  landscape_16_9: 'landscape_16_9',
  landscape_4_3: 'landscape_4_3',
  landscape: 'landscape_16_9',
  portrait: 'portrait_4_3',
  tiktok: 'portrait_16_9',
  square: 'square_hd',
}

// Upload to Cloudinary for public URL
async function getPublicUrl(base64: string): Promise<string | null> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'
    if (!cloudName) return null
    const fd = new FormData()
    fd.append('file', base64)
    fd.append('upload_preset', uploadPreset)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json() as { secure_url?: string }
    return data.secure_url ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, facePhoto, referenceImage } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const falKey = process.env.FAL_API_KEY
    if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })

    const styleBoost = stylePrompts[style ?? 'realistic'] ?? stylePrompts.realistic
    const fullPrompt = `${prompt}, ${styleBoost}`
    const imageSize = sizeMap[size ?? 'portrait_4_3'] ?? 'portrait_4_3'
    const primaryPhoto = facePhoto || referenceImage || null

    // ── PuLID — Best face locking (ByteDance) ────────────────
    if (primaryPhoto) {
      const faceUrl = await getPublicUrl(primaryPhoto)

      if (faceUrl) {
        // Try PuLID first — best face consistency
        const pulidRes = await fetch('https://fal.run/fal-ai/pulid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
          body: JSON.stringify({
            face_image_url: faceUrl,
            prompt: fullPrompt,
            negative_prompt: NEGATIVE,
            image_size: imageSize,
            num_inference_steps: 28,
            guidance_scale: 4.0,
            id_scale: 0.8,
            num_images: 1,
          }),
        })

        if (pulidRes.ok) {
          const pulidData = await pulidRes.json() as { images?: Array<{ url?: string }> }
          const imageUrl = pulidData.images?.[0]?.url ?? null
          if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, faceLocked: true, model: 'PuLID (ByteDance)' })
        }

        // Fallback to Flux Kontext if PuLID fails
        const kontextRes = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
          body: JSON.stringify({
            prompt: `Keep the exact same face and identity from the reference. Same person, same facial features. ${fullPrompt}`,
            image_url: faceUrl,
            image_size: imageSize,
            num_inference_steps: 30,
            guidance_scale: 3.5,
            num_images: 1,
            safety_tolerance: '2',
            output_format: 'jpeg',
          }),
        })

        if (kontextRes.ok) {
          const kontextData = await kontextRes.json() as { images?: Array<{ url?: string }> }
          const imageUrl = kontextData.images?.[0]?.url ?? null
          if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, faceLocked: true, model: 'FLUX Kontext' })
        }
      }
    }

    // ── FLUX Pro — Standard ultra realistic ───────────────────
    const fluxRes = await fetch('https://fal.run/fal-ai/flux-pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: NEGATIVE,
        image_size: imageSize,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: '2',
        output_format: 'jpeg',
      }),
    })

    if (fluxRes.ok) {
      const fluxData = await fluxRes.json() as { images?: Array<{ url?: string }> }
      const imageUrl = fluxData.images?.[0]?.url ?? null
      if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'FLUX Pro' })
    }

    // ── FLUX Schnell fallback ─────────────────────────────────
    const schnellRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: imageSize,
        num_inference_steps: 8,
        num_images: 1,
      }),
    })

    if (!schnellRes.ok) throw new Error('All image models failed')
    const schnellData = await schnellRes.json() as { images?: Array<{ url?: string }> }
    const imageUrl = schnellData.images?.[0]?.url ?? null
    if (!imageUrl) throw new Error('No image returned')
    return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'FLUX Schnell' })

  } catch (err) {
    console.error('[/api/generate/image]', err)
    return NextResponse.json({ error: 'Image generation failed: ' + (err as Error).message }, { status: 500 })
  }
}
