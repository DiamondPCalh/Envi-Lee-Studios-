// app/api/generate/image/route.ts
// PRIMARY: Nano Banana Pro (gemini-3-pro-image-preview) — ultra realistic
// FALLBACK: FLUX Pro via fal.ai

import { NextRequest, NextResponse } from 'next/server'

const REALISM_BOOST = `visible skin pores, natural skin texture, subtle imperfections, realistic lighting, no over-smoothing, no CGI look, natural shadows, true-to-life proportions, DSLR photography, RAW photo quality, shot on Sony A7R IV, 50mm lens f/1.8, shallow depth of field, no plastic skin, no filter, very human and real, candid but polished`

const sizeMap: Record<string, string> = {
  landscape: '16:9',
  portrait: '3:4',
  tiktok: '9:16',
  square: '1:1',
}

const falSizeMap: Record<string, string> = {
  landscape: 'landscape_16_9',
  portrait: 'portrait_4_3',
  tiktok: 'portrait_16_9',
  square: 'square_hd',
}

function base64ToGeminiPart(base64Data: string) {
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return null
  return { inlineData: { mimeType: matches[1], data: matches[2] } }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size, negativePrompt, facePhoto, castPhotos, testModel } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const geminiKey = process.env.GEMINI_API_KEY
    const falKey = process.env.FAL_API_KEY
    const aspectRatio = sizeMap[size ?? 'portrait'] ?? '3:4'

    // Force fal.ai for test models
    if (testModel === 'flux-pro' || testModel === 'flux-realism') {
      if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY not configured' }, { status: 500 })
      const falModel = testModel === 'flux-realism' ? 'fal-ai/flux-realism' : 'fal-ai/flux-pro'
      const res = await fetch(`https://fal.run/${falModel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({ prompt: `${prompt}, ${REALISM_BOOST}`, image_size: falSizeMap[size ?? 'portrait'] ?? 'portrait_4_3', num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, output_format: 'jpeg' }),
      })
      if (res.ok) {
        const data = await res.json()
        const imageUrl = data.images?.[0]?.url
        if (imageUrl) return NextResponse.json({ imageUrl, prompt, model: testModel === 'flux-realism' ? 'FLUX Realism' : 'FLUX Pro' })
      }
    }

    // Nano Banana Pro — face locked
    if (geminiKey && (facePhoto || (castPhotos && castPhotos.length > 0))) {
      try {
        const allPhotos = [...(facePhoto ? [facePhoto] : []), ...(castPhotos ?? [])].slice(0, 5)
        const parts: Array<Record<string, unknown>> = []
        for (const photo of allPhotos) {
          const part = base64ToGeminiPart(photo)
          if (part) parts.push(part)
        }
        parts.push({ text: `Generate a photorealistic image keeping the EXACT same person(s) from the reference photo(s). Do not change their face, skin tone, or features. Place them in this scene:\n\n${prompt}, ${REALISM_BOOST}\n\nSame face, same skin tone — different scene only. Very human and real, no CGI, no plastic look.` })

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'], aspectRatio } }) }
        )
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find((p: Record<string, unknown>) => p.inlineData)
          if (imagePart?.inlineData?.data) {
            return NextResponse.json({ imageUrl: `data:${imagePart.inlineData.mimeType ?? 'image/jpeg'};base64,${imagePart.inlineData.data}`, prompt, faceLocked: true, model: 'Nano Banana Pro' })
          }
        }
      } catch (e) { console.error('[nano banana pro face-locked]', e) }
    }

    // Nano Banana Pro — standard (PRIMARY)
    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${prompt}, ${REALISM_BOOST}` }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'], aspectRatio } }) }
        )
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const imagePart = geminiData.candidates?.[0]?.content?.parts?.find((p: Record<string, unknown>) => p.inlineData)
          if (imagePart?.inlineData?.data) {
            return NextResponse.json({ imageUrl: `data:${imagePart.inlineData.mimeType ?? 'image/jpeg'};base64,${imagePart.inlineData.data}`, prompt, model: 'Nano Banana Pro' })
          }
        } else {
          console.error('[nano banana pro error]', await geminiRes.text())
        }
      } catch (e) { console.error('[nano banana pro]', e) }
    }

    // FLUX Pro fallback
    if (!falKey) return NextResponse.json({ error: 'No image API keys configured' }, { status: 500 })
    const res = await fetch('https://fal.run/fal-ai/flux-pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
      body: JSON.stringify({ prompt: `${prompt}, ${REALISM_BOOST}`, negative_prompt: negativePrompt || 'blurry, low quality, cartoon, plastic skin, CGI', image_size: falSizeMap[size ?? 'portrait'] ?? 'portrait_4_3', num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, output_format: 'jpeg' }),
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

export async function PUT(req: NextRequest) {
  try {
    const { projectType, projectTitle, storyDescription, sceneCount } = await req.json()
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: `You are a cinematographer. Write exactly ${sceneCount} realistic image prompts for this storyboard.\nProject: ${projectType} — ${projectTitle}\nStory: ${storyDescription}\n\nUse: visible pores, natural texture, Sony A7R IV, f/1.8, RAW photo. Never use: flawless, glossy, plastic.\n\nReturn ONLY a JSON array: ["prompt1", "prompt2", ...]` }],
      }),
    })
    const d = await res.json()
    const text = d.content?.[0]?.text ?? '[]'
    const scenes = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim())
    return NextResponse.json({ scenes })
  } catch (err) {
    console.error('[/api/generate/image PUT]', err)
    return NextResponse.json({ error: `Scene generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}
