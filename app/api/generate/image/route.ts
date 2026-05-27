// app/api/generate/image/route.ts
// Generates images using FLUX Pro via fal.ai
// When a face reference photo is provided uses IP-Adapter Face ID for face locking
// Also handles storyboard scene prompt generation via PUT

import { NextRequest, NextResponse } from 'next/server'

const stylePrompts: Record<string, string> = {
  cinematic: 'cinematic film still, anamorphic lens, shallow depth of field, dramatic lighting, professional color grade, 8K ultra sharp',
  fashion: 'high end fashion editorial photography, professional studio lighting, Vogue magazine quality, 4K ultra sharp',
  luxury: 'luxury lifestyle photography, aspirational, warm golden hour light, high fashion editorial, premium quality',
  streetwear: 'urban street photography, authentic street style, natural light, candid editorial, NYC aesthetic',
  product: 'commercial product photography, clean studio lighting, professional quality, sharp focus',
  portrait: 'professional portrait photography, soft box lighting, sharp focus, bokeh background, studio quality',
  dramatic: 'dramatic cinematic photography, high contrast, moody shadows, film noir aesthetic, intense atmosphere',
  vibrant: 'vibrant colorful photography, rich saturated colors, energetic lifestyle photography, bright and bold',
}

const sizeMap: Record<string, { width: number; height: number }> = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 768, height: 1024 },
  tiktok: { width: 576, height: 1024 },
  square: { width: 1024, height: 1024 },
}

// Upload base64 image to fal.ai storage and get a URL back
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
    if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured in Vercel environment variables' }, { status: 500 })

    const styleBoost = stylePrompts[style ?? 'cinematic'] ?? stylePrompts.cinematic
    const fullPrompt = `${prompt}, ${styleBoost}`
    const dimensions = sizeMap[size ?? 'landscape'] ?? sizeMap.landscape

    // ── FACE LOCKED GENERATION ───────────────────────────────
    // If a face photo is provided use IP-Adapter Face ID for consistency
    if (facePhoto) {
      // Upload face photo to get URL
      const faceUrl = await uploadToFal(facePhoto, falKey)

      if (faceUrl) {
        // Use InstantCharacter for best face consistency
        const icRes = await fetch('https://fal.run/fal-ai/instant-character', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            image_url: faceUrl,
            negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy, watermark, different person, wrong face',
            image_size: dimensions,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
          }),
        })

        if (icRes.ok) {
          const icData = await icRes.json()
          const imageUrl = icData.images?.[0]?.url ?? null
          if (imageUrl) {
            return NextResponse.json({ imageUrl, prompt: fullPrompt, faceLocked: true })
          }
        }

        // Fallback to IP-Adapter Face ID if InstantCharacter fails
        const ipRes = await fetch('https://fal.run/fal-ai/ip-adapter-face-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            face_image_url: faceUrl,
            negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy, watermark, different person',
            image_size: dimensions,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            num_samples: 1,
          }),
        })

        if (ipRes.ok) {
          const ipData = await ipRes.json()
          const imageUrl = ipData.images?.[0]?.url ?? null
          if (imageUrl) {
            return NextResponse.json({ imageUrl, prompt: fullPrompt, faceLocked: true })
          }
        }
      }
    }

    // ── MULTI CHARACTER FACE LOCKING ─────────────────────────
    // If multiple cast photos provided use Nano Banana 2 (Google) for up to 5 characters
    if (castPhotos && castPhotos.length > 0) {
      const uploadedPhotos: string[] = []
      for (const photo of castPhotos.slice(0, 5)) {
        const url = await uploadToFal(photo, falKey)
        if (url) uploadedPhotos.push(url)
      }

      if (uploadedPhotos.length > 0) {
        // Use FLUX with IP-Adapter for multi-character consistency
        const mcRes = await fetch('https://fal.run/fal-ai/flux-general/image-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            image_url: uploadedPhotos[0], // primary character reference
            negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, watermark',
            image_size: dimensions,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            strength: 0.75,
            ip_adapter: uploadedPhotos.length > 0 ? [{
              path: 'h94/IP-Adapter',
              image_url: uploadedPhotos[0],
              scale: 0.8,
            }] : undefined,
          }),
        })

        if (mcRes.ok) {
          const mcData = await mcRes.json()
          const imageUrl = mcData.images?.[0]?.url ?? null
          if (imageUrl) {
            return NextResponse.json({ imageUrl, prompt: fullPrompt, faceLocked: true, castCount: uploadedPhotos.length })
          }
        }
      }
    }

    // ── STANDARD FLUX PRO ────────────────────────────────────
    // No face photo — use FLUX Pro for best quality
    const res = await fetch('https://fal.run/fal-ai/flux-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text overlay, cartoon, anime',
        image_size: dimensions,
        num_inference_steps: 25,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
      }),
    })

    if (!res.ok) {
      // Fallback to FLUX schnell
      const fallbackRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, watermark',
          image_size: dimensions,
          num_inference_steps: 8,
          num_images: 1,
          enable_safety_checker: true,
        }),
      })
      if (!fallbackRes.ok) throw new Error(`fal.ai error ${res.status}`)
      const fallbackData = await fallbackRes.json()
      return NextResponse.json({ imageUrl: fallbackData.images?.[0]?.url ?? null, prompt: fullPrompt })
    }

    const data = await res.json()
    const imageUrl = data.images?.[0]?.url ?? null
    if (!imageUrl) throw new Error('No image returned from fal.ai')
    return NextResponse.json({ imageUrl, prompt: fullPrompt })

  } catch (err) {
    console.error('[/api/generate/image]', err)
    return NextResponse.json({ error: `Image generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}

// PUT — generate storyboard scene prompts
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

Write exactly ${sceneCount} cinematic image prompts for this storyboard. Each prompt should:
- Be a complete, detailed image generation prompt
- Describe the scene composition, characters, setting, lighting, mood, and camera angle
- Include the visual style: ${styleBoost}
- Feel like a professional film still or editorial photo
- Tell the story progressively scene to scene
- Use the exact character names and descriptions provided in the cast list
- Include Black characters unless specified otherwise

Return ONLY a JSON array of strings — no other text, no markdown, no explanation:
["scene 1 prompt here", "scene 2 prompt here", ...]`

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
