// app/api/generate/mockup/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { product, design, setting, style, designImageBase64, modelImageBase64 } = body
    const falKey = process.env.FAL_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    // ── STEP 1: Try fal.ai image-to-image if design uploaded ──
    if (designImageBase64 && falKey) {
      try {
        // Upload design image to fal first
        const blob = await fetch(designImageBase64).then(r => r.blob())
        const formData = new FormData()
        formData.append('file', blob, 'design.jpg')
        const uploadRes = await fetch('https://fal.run/fal-ai/upload', {
          method: 'POST',
          headers: { 'Authorization': `Key ${falKey}` },
          body: formData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          const designUrl = uploadData.url

          if (designUrl) {
            const prompt = `Show this exact clothing design being worn by a model. ${style || 'Editorial fashion photography'}. ${setting || 'Luxury lifestyle setting'}. Keep all design elements, colors, patterns, and text exactly as shown. Ultra realistic, professional fashion photography, Sony A7R IV, RAW photo, 4K quality.${modelImageBase64 ? ' Use the uploaded person as the model.' : ''}`

            const falRes = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
              method: 'POST',
              headers: {
                'Authorization': `Key ${falKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt,
                image_url: designUrl,
                image_size: 'portrait_4_3',
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                safety_tolerance: '2',
                output_format: 'jpeg',
              }),
            })

            if (falRes.ok) {
              const falData = await falRes.json()
              const imageUrl = falData.images?.[0]?.url
              if (imageUrl) {
                return NextResponse.json({ imageUrl, method: 'flux-kontext' })
              }
            }
          }
        }
      } catch (falErr) {
        console.error('[mockup fal error]', falErr)
      }
    }

    // ── STEP 2: Generate detailed prompt via Claude then use image API ──
    if (!anthropicKey) {
      return NextResponse.json({ error: 'No API keys configured' }, { status: 500 })
    }

    const productName = product || 'clothing item'
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
          content: `Write a detailed AI image generation prompt for a fashion product mockup.
Product: ${productName}
Design: ${design || 'custom printed design with graphics and text'}
Setting: ${setting || 'luxury lifestyle'}
Style: ${style || 'editorial fashion photography'}
Has model photo: ${modelImageBase64 ? 'yes' : 'no'}

Write ONE prompt under 200 words. Return ONLY the prompt text with no extra commentary. Use only standard ASCII characters.`,
        }],
      }),
    })

    const claudeData = await claudeRes.json()
    const generatedPrompt = claudeData.content?.[0]?.text?.trim()
      || `Editorial fashion photography, model wearing ${productName} with custom print design, ${setting || 'luxury lifestyle'}, ultra realistic, professional studio lighting, Sony A7R IV`

    // Clean prompt — remove any special characters that break requests
    const cleanPrompt = generatedPrompt.replace(/[^\x00-\x7F]/g, '')

    return NextResponse.json({
      prompt: cleanPrompt,
      method: 'claude-prompt',
    })

  } catch (err) {
    console.error('[/api/generate/mockup]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
