// app/api/generate/image/route.ts
// Face locking: PuLID (ByteDance) — single character
// Multi-character: Higgsfield Soul ID — up to 4 characters
// Scene generation: Gemini 3.1 Flash Image — best multi-character scenes
// Standard: FLUX Pro — ultra realistic fallback

import { NextRequest, NextResponse } from 'next/server'

const NEGATIVE = 'plastic skin, waxy skin, artificial look, CGI, render, 3D, overprocessed, fake, unnatural, doll, mannequin, blurry, low quality, distorted, watermark, extra fingers, bad hands, deformed hands, missing fingers, extra limbs, bad anatomy'

const stylePrompts: Record<string, string> = {
  realistic: 'ultra realistic photography, Sony A7R IV 85mm f1.4, RAW photo, natural skin texture, skin pores visible, sharp focus, no filter, no AI look',
  cinematic: 'cinematic film still, anamorphic lens, shallow depth of field, dramatic lighting, Sony A7R IV, RAW photo, 35mm film',
  fashion: 'high end fashion editorial, Vogue magazine quality, professional studio lighting, Sony A7R IV 85mm f1.4, RAW photo',
  luxury: 'luxury lifestyle photography, warm golden hour light, high fashion editorial, Sony A7R IV, RAW photo',
  portrait: 'professional portrait photography, soft box lighting, sharp focus on face, bokeh background, Sony A7R IV, skin pores visible',
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

// Upload to Cloudinary
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

// ── HIGGSFIELD SOUL ID — Create character ─────────────────────
async function createSoulCharacter(imageUrls: string[], name: string): Promise<string | null> {
  try {
    const keyId = process.env.HIGGSFIELD_KEY_ID
    const keySecret = process.env.HIGGSFIELD_API_KEY
    if (!keyId || !keySecret) return null

    const res = await fetch('https://platform.higgsfield.ai/characters', {
      method: 'POST',
      headers: { 'Authorization': `Key ${keyId}:${keySecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image_urls: imageUrls }),
    })
    if (!res.ok) return null
    const data = await res.json() as { character_id?: string; id?: string }
    return data.character_id || data.id || null
  } catch { return null }
}

// ── HIGGSFIELD SOUL — Generate image with characters ──────────
async function generateHiggsfieldSoul(
  prompt: string,
  characterIds: string[],
  aspectRatio: string
): Promise<{ requestId: string } | null> {
  try {
    const keyId = process.env.HIGGSFIELD_KEY_ID
    const keySecret = process.env.HIGGSFIELD_API_KEY
    if (!keyId || !keySecret) return null

    const res = await fetch('https://platform.higgsfield.ai/higgsfield-ai/soul/standard', {
      method: 'POST',
      headers: { 'Authorization': `Key ${keyId}:${keySecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        character_ids: characterIds,
        aspect_ratio: aspectRatio || '4:3',
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { request_id?: string }
    return data.request_id ? { requestId: data.request_id } : null
  } catch { return null }
}

// Poll Higgsfield
async function pollHiggsfield(requestId: string): Promise<string | null> {
  const keyId = process.env.HIGGSFIELD_KEY_ID
  const keySecret = process.env.HIGGSFIELD_API_KEY
  if (!keyId || !keySecret) return null
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await fetch(`https://platform.higgsfield.ai/requests/${requestId}/status`, {
        headers: { 'Authorization': `Key ${keyId}:${keySecret}` },
      })
      const data = await res.json() as { status?: string; output?: { image_url?: string; images?: Array<{ url?: string }> } }
      if (data.status === 'completed' || data.status === 'succeeded') {
        return data.output?.image_url || data.output?.images?.[0]?.url || null
      }
      if (data.status === 'failed') return null
    } catch { continue }
  }
  return null
}

// ── GEMINI 3.1 FLASH IMAGE — Best for multi-character scenes ──
async function generateGeminiImage(prompt: string, imageBase64s: string[]): Promise<string | null> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) return null

    const parts: unknown[] = []

    // Add reference images
    for (const base64 of imageBase64s) {
      const b64 = base64.includes(',') ? base64.split(',')[1] : base64
      const mimeType = base64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
      parts.push({ inline_data: { mime_type: mimeType, data: b64 } })
    }

    // Add prompt
    parts.push({ text: prompt })

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseModalities: ['Text', 'Image'] },
        }),
      }
    )

    if (!res.ok) {
      console.error('[Gemini] Error:', await res.text())
      return null
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inline_data?: { data?: string; mime_type?: string }
            text?: string
          }>
        }
      }>
    }

    // Find the image part
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inline_data?.data)
    if (!imagePart?.inline_data?.data) return null

    // Upload to Cloudinary for permanent URL
    const mimeType = imagePart.inline_data.mime_type || 'image/jpeg'
    const base64Url = `data:${mimeType};base64,${imagePart.inline_data.data}`
    const publicUrl = await getPublicUrl(base64Url)
    return publicUrl

  } catch (e) {
    console.error('[Gemini Image]', e)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      prompt, style, size, mode,
      facePhoto,           // Single face lock
      castPhotos,          // Array of face photos for multi-char
      characterIds,        // Pre-created Higgsfield Soul IDs
      backgroundImage,     // Background reference
      elementImages,       // Additional element images
      createCharacters,    // If true, create Soul IDs from castPhotos
    } = body

    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const falKey = process.env.FAL_API_KEY
    const styleBoost = stylePrompts[style ?? 'realistic'] ?? stylePrompts.realistic
    const fullPrompt = `${prompt}, ${styleBoost}`
    const imageSize = sizeMap[size ?? 'portrait_4_3'] ?? 'portrait_4_3'

    // ── MULTI-CHARACTER MODE ────────────────────────────────────
    if (mode === 'multichar' && castPhotos && castPhotos.length > 0) {

      // Option A: Use pre-created Soul IDs
      if (characterIds && characterIds.length > 0) {
        const result = await generateHiggsfieldSoul(fullPrompt, characterIds, '4:3')
        if (result) {
          const imageUrl = await pollHiggsfield(result.requestId)
          if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'Higgsfield Soul ID', faceLocked: true })
        }
      }

      // Option B: Use Gemini for multi-character (best results)
      const allRefs = [...castPhotos]
      if (backgroundImage) allRefs.push(backgroundImage)
      if (elementImages) allRefs.push(...elementImages)

      const geminiPrompt = `Generate a ultra realistic, photographic quality image. ${fullPrompt}. Keep all characters exactly as shown in the reference photos. Maintain their exact faces, skin tones, and features. Place them in the described scene together. Natural skin texture, no AI look, sharp focus, ${styleBoost}. Negative: ${NEGATIVE}`

      const geminiUrl = await generateGeminiImage(geminiPrompt, allRefs)
      if (geminiUrl) return NextResponse.json({ imageUrl: geminiUrl, prompt: fullPrompt, model: 'Gemini 3.1 Flash Image', faceLocked: true, charCount: castPhotos.length })

      // Fallback to FLUX Pro with enhanced prompt
      const charPrompt = `${fullPrompt}. Multiple characters in scene, each distinct and clearly visible. ${NEGATIVE}`
      const fluxRes = await fetch('https://fal.run/fal-ai/flux-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({ prompt: charPrompt, negative_prompt: NEGATIVE, image_size: imageSize, num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, safety_tolerance: '2', output_format: 'jpeg' }),
      })
      if (fluxRes.ok) {
        const fluxData = await fluxRes.json() as { images?: Array<{ url?: string }> }
        const imageUrl = fluxData.images?.[0]?.url ?? null
        if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'FLUX Pro' })
      }
    }

    // ── ELEMENTS MODE ───────────────────────────────────────────
    if (mode === 'elements' && elementImages && elementImages.length > 0) {
      const allRefs = elementImages
      if (backgroundImage) allRefs.unshift(backgroundImage)
      if (facePhoto) allRefs.unshift(facePhoto)

      const elemPrompt = `Generate a ultra realistic photographic image. ${fullPrompt}. Use the reference images to compose the scene — incorporate the background, characters, and objects naturally. ${styleBoost}. Negative: ${NEGATIVE}`
      const geminiUrl = await generateGeminiImage(elemPrompt, allRefs)
      if (geminiUrl) return NextResponse.json({ imageUrl: geminiUrl, prompt: fullPrompt, model: 'Gemini 3.1 Flash Image' })
    }

    // ── SINGLE MODE — PuLID face lock ───────────────────────────
    if (facePhoto) {
      const faceUrl = await getPublicUrl(facePhoto)
      if (faceUrl && falKey) {
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
          const data = await pulidRes.json() as { images?: Array<{ url?: string }> }
          const imageUrl = data.images?.[0]?.url ?? null
          if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, faceLocked: true, model: 'PuLID (ByteDance)' })
        }
      }
    }

    // ── FLUX Pro — Standard ─────────────────────────────────────
    if (falKey) {
      const fluxRes = await fetch('https://fal.run/fal-ai/flux-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({ prompt: fullPrompt, negative_prompt: NEGATIVE, image_size: imageSize, num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, safety_tolerance: '2', output_format: 'jpeg' }),
      })
      if (fluxRes.ok) {
        const data = await fluxRes.json() as { images?: Array<{ url?: string }> }
        const imageUrl = data.images?.[0]?.url ?? null
        if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'FLUX Pro' })
      }

      // FLUX Schnell fallback
      const schnellRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({ prompt: fullPrompt, image_size: imageSize, num_inference_steps: 8, num_images: 1 }),
      })
      if (schnellRes.ok) {
        const data = await schnellRes.json() as { images?: Array<{ url?: string }> }
        const imageUrl = data.images?.[0]?.url ?? null
        if (imageUrl) return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'FLUX Schnell' })
      }
    }

    return NextResponse.json({ error: 'All image generation models failed' }, { status: 500 })

  } catch (err) {
    console.error('[/api/generate/image]', err)
    return NextResponse.json({ error: 'Image generation failed: ' + (err as Error).message }, { status: 500 })
  }
}
