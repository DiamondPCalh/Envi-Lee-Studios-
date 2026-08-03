// app/api/generate/mockup/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const log: string[] = []
  
  try {
    const body = await req.json()
    const { product, design, setting, style, designImageBase64, modelImageBase64 } = body
    
    log.push('Request received')
    log.push('product: ' + (product || 'none'))
    log.push('hasDesignImage: ' + !!designImageBase64)
    log.push('hasModelImage: ' + !!modelImageBase64)
    
    const falKey = process.env.FAL_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    
    log.push('FAL_API_KEY: ' + (falKey ? 'SET' : 'MISSING'))
    log.push('ANTHROPIC_API_KEY: ' + (anthropicKey ? 'SET' : 'MISSING'))

    // ── STEP 1: Claude generates a detailed prompt ────────────
    if (!anthropicKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing', log }, { status: 500 })
    }

    log.push('Calling Claude...')
    
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: 'Write a short fashion product mockup prompt for: ' + (product || 'pajama set') + '. Setting: ' + (setting || 'lifestyle') + '. Style: ' + (style || 'editorial') + '. Under 150 words. Return only the prompt text.',
        }],
      }),
    })

    log.push('Claude status: ' + claudeRes.status)
    
    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      log.push('Claude error: ' + err.slice(0, 200))
      return NextResponse.json({ error: 'Claude failed', log }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const generatedPrompt = claudeData.content?.[0]?.text?.trim() || ''
    log.push('Claude prompt generated: ' + generatedPrompt.slice(0, 100))

    // ── STEP 2: Generate image with fal.ai ───────────────────
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_API_KEY missing', log }, { status: 500 })
    }

    log.push('Calling fal.ai...')

    // If design image uploaded — use it as reference
    let imagePayload: Record<string, unknown> = {
      prompt: generatedPrompt,
      image_size: 'portrait_4_3',
      num_inference_steps: 25,
      guidance_scale: 3.5,
      num_images: 1,
      safety_tolerance: '2',
      output_format: 'jpeg',
    }

    // Use flux-pro for standard generation
    let falEndpoint = 'https://fal.run/fal-ai/flux-pro'

    // If we have a model photo — use Kontext to lock the face
    if (modelImageBase64) {
      try {
        log.push('Uploading model photo to fal...')
        const blob = await fetch(modelImageBase64).then(r => r.blob())
        const fd = new FormData()
        fd.append('file', blob, 'model.jpg')
        const upRes = await fetch('https://fal.run/fal-ai/upload', {
          method: 'POST',
          headers: { 'Authorization': `Key ${falKey}` },
          body: fd,
        })
        if (upRes.ok) {
          const upData = await upRes.json()
          if (upData.url) {
            falEndpoint = 'https://fal.run/fal-ai/flux-pro/kontext'
            imagePayload.image_url = upData.url
            imagePayload.prompt = 'Keep the exact same person from the reference. Place them wearing ' + (product || 'this outfit') + '. ' + generatedPrompt
            log.push('Model photo uploaded: ' + upData.url.slice(0, 60))
          }
        }
      } catch (upErr) {
        log.push('Model upload failed — using standard generation')
      }
    }

    const falRes = await fetch(falEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imagePayload),
    })

    log.push('fal.ai status: ' + falRes.status)

    if (!falRes.ok) {
      const falErr = await falRes.text()
      log.push('fal.ai error: ' + falErr.slice(0, 300))
      return NextResponse.json({ error: 'fal.ai failed: ' + falErr.slice(0, 200), log }, { status: 500 })
    }

    const falData = await falRes.json()
    const imageUrl = falData.images?.[0]?.url ?? null
    log.push('imageUrl: ' + (imageUrl ? imageUrl.slice(0, 60) : 'null'))

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned from fal.ai', falData, log }, { status: 500 })
    }

    return NextResponse.json({ imageUrl, prompt: generatedPrompt, log, method: 'claude-prompt + fal.ai' })

  } catch (err) {
    log.push('CAUGHT ERROR: ' + (err as Error).message)
    console.error('[/api/generate/mockup]', err)
    return NextResponse.json({ error: (err as Error).message, log }, { status: 500 })
  }
}
