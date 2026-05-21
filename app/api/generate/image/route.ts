// app/api/generate/image/route.ts
// POST /api/generate/image
// Generates images using fal.ai (Stable Diffusion / FLUX)
// Requires FAL_API_KEY in Vercel environment variables
 
import { NextRequest, NextResponse } from 'next/server'
 
export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, negativePrompt } = await req.json()
 
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
 
    const falKey = process.env.FAL_API_KEY
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_API_KEY not configured in Vercel environment variables' }, { status: 500 })
    }
 
    // Build enhanced prompt based on style
    const stylePrompts: Record<string, string> = {
      'fashion': 'fashion photography, high end editorial, professional lighting, 4K ultra sharp',
      'luxury': 'luxury lifestyle photography, aspirational, warm golden light, high fashion editorial',
      'streetwear': 'streetwear urban aesthetic, NYC street photography, natural light, candid editorial',
      'product': 'product photography, clean white background, professional studio lighting, commercial quality',
      'cinematic': 'cinematic photography, movie still, dramatic lighting, shallow depth of field, anamorphic lens',
      'portrait': 'professional portrait photography, soft box lighting, sharp focus, high resolution',
    }
 
    const styleBoost = stylePrompts[style ?? 'fashion'] ?? stylePrompts.fashion
    const fullPrompt = `${prompt}, ${styleBoost}`
 
    const sizeMap: Record<string, { width: number; height: number }> = {
      'square': { width: 1024, height: 1024 },
      'portrait': { width: 768, height: 1024 },
      'landscape': { width: 1024, height: 768 },
      'tiktok': { width: 576, height: 1024 },
    }
 
    const dimensions = sizeMap[size ?? 'portrait'] ?? sizeMap.portrait
 
    // Use fal.ai FLUX model for best quality
    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text overlay',
        image_size: dimensions,
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })
 
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`fal.ai error ${res.status}: ${err}`)
    }
 
    const data = await res.json()
    const imageUrl = data.images?.[0]?.url ?? null
 
    if (!imageUrl) {
      throw new Error('No image returned from fal.ai')
    }
 
    return NextResponse.json({ imageUrl, prompt: fullPrompt })
 
  } catch (err) {
    console.error('[/api/generate/image]', err)
    return NextResponse.json({ error: `Image generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}
