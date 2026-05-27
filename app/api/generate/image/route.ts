// app/api/generate/image/route.ts
// PRIMARY: FLUX.1 Kontext [pro] for face-locked character consistency
// FALLBACK: FLUX Pro for standard generation
// STORYBOARD: PUT endpoint generates scene prompts via Claude

import { NextRequest, NextResponse } from 'next/server'

const stylePrompts: Record<string, string> = {
  cinematic: 'cinematic film still, anamorphic lens, shallow depth of field, dramatic lighting, professional color grade, photorealistic, 8K',
  fashion: 'high end fashion editorial photography, professional studio lighting, Vogue magazine quality, photorealistic, 4K',
  luxury: 'luxury lifestyle photography, aspirational, warm golden hour light, high fashion editorial, photorealistic',
  streetwear: 'urban street photography, authentic street style, natural light, candid editorial, NYC aesthetic, photorealistic',
  product: 'commercial product photography, clean studio lighting, professional quality, sharp focus, photorealistic',
  portrait: 'professional portrait photography, soft box lighting, sharp focus, bokeh background, studio quality, photorealistic',
  dramatic: 'dramatic cinematic photography, high contrast, moody shadows, film noir aesthetic, intense atmosphere, photorealistic',
  vibrant: 'vibrant colorful photography, rich saturated colors, energetic lifestyle photography, photorealistic',
}

const sizeMap: Record<string, string> = {
  landscape: 'landscape_16_9',
  portrait: 'portrait_4_3',
  tiktok: 'portrait_16_9',
  square: 'square_hd',
}

async function uploadToFal(base64Data: string, falKey: string): Promise<string | null> {
  try {
    const blob = await fetch(base64Data).then(r => r.blob())
    const formData = new FormData()
    formData.append('file', blob, 'character.jpg')
    const res = await fetch('https://fal.run/fal-ai/upload', {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}` },
      body: formData,
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  } catch { return null }
}

// POST — generate a single image
export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, negativePrompt, facePhoto, castPhotos } = await req.json()

    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const falKey = process.env.FAL_API_KEY
    if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })

    const styleBoost = stylePrompts[style ?? 'cinematic'] ?? stylePrompts.cinematic
    const fullPrompt = `${prompt}, ${styleBoost}`
    const imageSize = sizeMap[size ?? 'landscape'] ?? sizeMap.landscape

    // ── FLUX KONTEXT — FACE LOCKED GENERATION ────────────────
    // Best for: keeping the same exact person across scenes
    // Takes your character photo → generates new scene with same face
    const primaryPhoto = facePhoto || (castPhotos?.[0] ?? null)

    if (primaryPhoto) {
      const faceUrl = await uploadToFal(primaryPhoto, falKey)

      if (faceUrl) {
        // Build Kontext instruction — tell it to keep the face exactly
        const kontextPrompt = `Keep the exact same person from the reference image. Same face, same skin tone, same features. Place them in this scene: ${fullPrompt}. The person must look identical to the reference photo.`

        const kontextRes = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: kontextPrompt,
            image_url: faceUrl,
            image_size: imageSize,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            safety_tolerance: '2',
            output_format: 'jpeg',
          }),
        })

        if (kontextRes.ok) {
          const kontextData = await kontextRes.json()
          const imageUrl = kontextData.images?.[0]?.url ?? null
          if (imageUrl) {
            return NextResponse.json({
              imageUrl,
              prompt: kontextPrompt,
              faceLocked: true,
              model: 'FLUX Kontext'
            })
          }
        } else {
          const err = await kontextRes.text()
          console.error('[kontext error]', err)
        }
      }
    }

    // ── FLUX PRO — STANDARD GENERATION ───────────────────────
    // No face photo or Kontext failed — use FLUX Pro
    const res = await fetch('https://fal.run/fal-ai/flux-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text overlay, cartoon, anime, plastic, artificial',
        image_size: imageSize,
        num_inference_steps: 25,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: '2',
        output_format: 'jpeg',
      }),
    })

    if (!res.ok) {
      // Final fallback to FLUX schnell
      const fallbackRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({
          prompt: fullPrompt,
          image_size: { width: 1280, height: 720 },
          num_inference_steps: 8,
          num_images: 1,
        }),
      })
      if (!fallbackRes.ok) throw new Error(`fal.ai error ${res.status}`)
      const fallbackData = await fallbackRes.json()
      return NextResponse.json({ imageUrl: fallbackData.images?.[0]?.url ?? null, prompt: fullPrompt, model: 'FLUX Schnell' })
    }

    const data = await res.json()
    const imageUrl = data.images?.[0]?.url ?? null
    if (!imageUrl) throw new Error('No image returned')
    return NextResponse.json({ imageUrl, prompt: fullPrompt, model: 'FLUX Pro' })

  } catch (err) {
    console.error('[/api/generate/image]', err)
    return NextResponse.json({ error: `Image generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}

// PUT — generate storyboard scene prompts via Claude
export async function PUT(req: NextRequest) {
  try {
    const { projectType, projectTitle, storyDescription, sceneCount, style } = await req.json()

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    const styleBoost = stylePrompts[style ?? 'cinematic'] ?? stylePrompts.cinematic

    const prompt = `You are a professional cinematographer and storyboard artist.

Project type: ${projectType}
Title: ${projectTitle}
Story: ${storyDescription}
Visual style: ${style} — ${styleBoost}
Number of scenes: ${sceneCount}

Write exactly ${sceneCount} cinematic image generation prompts for this storyboard.

Rules for each prompt:
- Use the EXACT character names and descriptions from the cast list provided
- Describe their exact appearance, outfit, expression in every scene
- Include setting, lighting, mood, camera angle
- Add this style: ${styleBoost}
- Make it photorealistic and cinematic
- Progress the story scene by scene
- Keep character descriptions IDENTICAL across all scenes for consistency

Return ONLY a JSON array of strings. No other text:
["scene 1 full prompt", "scene 2 full prompt", ...]`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const d = await res.json()
    const text = d.content?.[0]?.text ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const scenes = JSON.parse(clean)
    return NextResponse.json({ scenes })

  } catch (err) {
    console.error('[/api/generate/image PUT]', err)
    return NextResponse.json({ error: `Scene generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}
