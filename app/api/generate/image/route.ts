// app/api/generate/image/route.ts
// Generates images using FLUX Pro via fal.ai for best quality
// Also handles storyboard scene prompt generation via PUT

import { NextRequest, NextResponse } from 'next/server'

// Style boost prompts for cinematic quality
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
  landscape: { width: 1280, height: 720 },   // 16:9
  portrait: { width: 768, height: 1024 },     // 3:4
  tiktok: { width: 576, height: 1024 },       // 9:16
  square: { width: 1024, height: 1024 },      // 1:1
}

// POST — generate a single image
export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, negativePrompt } = await req.json()

    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const falKey = process.env.FAL_API_KEY
    if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured in Vercel environment variables' }, { status: 500 })

    const styleBoost = stylePrompts[style ?? 'cinematic'] ?? stylePrompts.cinematic
    const fullPrompt = `${prompt}, ${styleBoost}`
    const dimensions = sizeMap[size ?? 'landscape'] ?? sizeMap.landscape

    // Use FLUX Pro for best quality
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
      const err = await res.text()
      // Fallback to FLUX schnell if Pro fails
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
      if (!fallbackRes.ok) throw new Error(`fal.ai error ${res.status}: ${err}`)
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

// PUT — generate storyboard scene prompts using Claude
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
- Tell the story progressively from scene to scene
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

    // Parse the JSON array
    const clean = text.replace(/```json|```/g, '').trim()
    const scenes = JSON.parse(clean)

    return NextResponse.json({ scenes })
  } catch (err) {
    console.error('[/api/generate/image PUT]', err)
    return NextResponse.json({ error: `Scene generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}
