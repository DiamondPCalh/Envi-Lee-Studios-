// app/api/generate/image/route.ts
// PRIMARY: Gemini 3 Pro Image (same engine as Google Flow) for character consistency
// Accepts reference photos — maintains same face across scenes
// FALLBACK: FLUX Pro via fal.ai
// STORYBOARD: PUT endpoint generates scene prompts via Claude

import { NextRequest, NextResponse } from 'next/server'

const stylePrompts: Record<string, string> = {
  cinematic: 'cinematic film still, anamorphic lens, shallow depth of field, dramatic lighting, professional color grade, photorealistic, 8K ultra sharp',
  fashion: 'high end fashion editorial photography, professional studio lighting, Vogue magazine quality, photorealistic, 4K',
  luxury: 'luxury lifestyle photography, aspirational, warm golden hour light, high fashion editorial, photorealistic',
  streetwear: 'urban street photography, authentic street style, natural light, candid editorial, NYC aesthetic, photorealistic',
  product: 'commercial product photography, clean studio lighting, professional quality, sharp focus, photorealistic',
  portrait: 'professional portrait photography, soft box lighting, sharp focus, bokeh background, studio quality, photorealistic',
  dramatic: 'dramatic cinematic photography, high contrast, moody shadows, film noir aesthetic, intense atmosphere, photorealistic',
  vibrant: 'vibrant colorful photography, rich saturated colors, energetic lifestyle photography, photorealistic',
}

const sizeMap: Record<string, string> = {
  landscape: '16:9',
  portrait: '3:4',
  tiktok: '9:16',
  square: '1:1',
}

// Convert base64 to the format Gemini needs
function base64ToGeminiPart(base64Data: string) {
  // base64Data is like "data:image/jpeg;base64,/9j/..."
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return null
  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2],
    }
  }
}

// POST — generate a single image
export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, negativePrompt, facePhoto, castPhotos } = await req.json()

    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const geminiKey = process.env.GEMINI_API_KEY
    const falKey = process.env.FAL_API_KEY

    const styleBoost = stylePrompts[style ?? 'cinematic'] ?? stylePrompts.cinematic
    const aspectRatio = sizeMap[size ?? 'landscape'] ?? '16:9'

    // ── GEMINI 3 PRO IMAGE — FACE LOCKED GENERATION ──────────
    // Same engine as Google Flow — accepts reference photos
    // Up to 5 human reference images for character consistency
    if (geminiKey && (facePhoto || (castPhotos && castPhotos.length > 0))) {
      try {
        const allPhotos = [
          ...(facePhoto ? [facePhoto] : []),
          ...(castPhotos ?? []),
        ].slice(0, 5) // max 5 human reference images

        const parts: Array<Record<string, unknown>> = []

        // Add reference photos first
        for (const photo of allPhotos) {
          const part = base64ToGeminiPart(photo)
          if (part) parts.push(part)
        }

        // Add the generation prompt
        parts.push({
          text: `Generate a photorealistic image keeping the EXACT same person(s) from the reference photo(s) above. Do not change their face, skin tone, facial features, or identity in any way. Place them in this new scene:\n\n${prompt}, ${styleBoost}\n\nAspect ratio: ${aspectRatio}\n\nIMPORTANT: The person must look identical to the reference photo. Same face, same skin tone, same features, different scene only.`
        })

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                aspectRatio,
              },
            }),
          }
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
            (p: Record<string, unknown>) => p.inlineData
          )

          if (imagePart?.inlineData?.data) {
            const imageUrl = `data:${imagePart.inlineData.mimeType ?? 'image/jpeg'};base64,${imagePart.inlineData.data}`
            return NextResponse.json({ imageUrl, prompt, faceLocked: true, model: 'Gemini 3 Pro Image' })
          }
        } else {
          const err = await geminiRes.text()
          console.error('[gemini image error]', err)
        }
      } catch (e) {
        console.error('[gemini image]', e)
      }
    }

    // ── GEMINI — NO REFERENCE (standard generation) ──────────
    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${prompt}, ${styleBoost}, visible skin pores, no smoothing, professional DSLR lighting, Confident, authentic posture, natural skin texture, realistic lighting, no over-smoothing, no CGI look, RAW photo quality, DSLR photography, shot on Sony A7R IV, ultra human realism, no plastic skin` }] }],
              generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                aspectRatio,
              },
            }),
          }
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
            (p: Record<string, unknown>) => p.inlineData
          )
          if (imagePart?.inlineData?.data) {
            const imageUrl = `data:${imagePart.inlineData.mimeType ?? 'image/jpeg'};base64,${imagePart.inlineData.data}`
            return NextResponse.json({ imageUrl, prompt, model: 'Gemini Flash Image' })
          }
        }
      } catch (e) {
        console.error('[gemini flash image]', e)
      }
    }

    // ── FLUX PRO FALLBACK ─────────────────────────────────────
    if (!falKey) return NextResponse.json({ error: 'No image API keys configured' }, { status: 500 })

    const falSizeMap: Record<string, string> = {
      landscape: 'landscape_16_9',
      portrait: 'portrait_4_3',
      tiktok: 'portrait_16_9',
      square: 'square_hd',
    }

    const res = await fetch('https://fal.run/fal-ai/flux-pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
      body: JSON.stringify({
        prompt: `${prompt}, ${styleBoost}`,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, watermark, cartoon, plastic',
        image_size: falSizeMap[size ?? 'landscape'] ?? 'landscape_16_9',
        num_inference_steps: 25,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: '2',
        output_format: 'jpeg',
      }),
    })

    if (!res.ok) throw new Error(`fal.ai error ${res.status}`)
    const data = await res.json()
    const imageUrl = data.images?.[0]?.url ?? null
    if (!imageUrl) throw new Error('No image returned')
    return NextResponse.json({ imageUrl, prompt, model: 'FLUX Pro' })

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

    const promptText = `You are a professional cinematographer and storyboard artist.

Project type: ${projectType}
Title: ${projectTitle}
Story: ${storyDescription}
Visual style: ${style} — ${styleBoost}
Number of scenes: ${sceneCount}

Write exactly ${sceneCount} cinematic image prompts for this storyboard.
- Use the EXACT character names and descriptions from the cast list
- Describe exact appearance, outfit, expression in every scene
- Include setting, lighting, mood, camera angle
- Add style: ${styleBoost}
- Make it photorealistic and cinematic
- Progress the story scene to scene
- Keep character descriptions IDENTICAL across all scenes

Return ONLY a JSON array of strings. No other text:
["scene 1 prompt", "scene 2 prompt", ...]`

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
        messages: [{ role: 'user', content: promptText }],
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
