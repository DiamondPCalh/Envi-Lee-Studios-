// app/api/generate/mockup/route.ts
// Generates product mockups using fal.ai image-to-image
// Actually places uploaded design onto product/model image

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { product, design, setting, style, designImageBase64, modelImageBase64 } = await req.json()
    const falKey = process.env.FAL_API_KEY

    // ── If we have actual design image — use image-to-image to place it ──
    if (designImageBase64 && falKey) {
      // Step 1: Generate base product shot with model
      const basePrompt = `${style || 'Editorial fashion photography'}, ${setting || 'luxury lifestyle'}, woman wearing ${product}, full body shot, ultra realistic, Sony A7R IV, RAW photo, white or neutral background, no text, no watermark, clean product shot`

      // Step 2: Use fal.ai flux with image reference to place design
      const res = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: designImageBase64,
          prompt: `Place this exact design print/pattern onto a ${product}. ${style}. ${setting}. The design must appear exactly as uploaded — same colors, same pattern, same artwork. Ultra realistic product photography. ${modelImageBase64 ? 'Worn by the person in the reference photo.' : 'On a model.'} Professional fashion photography, studio lighting.`,
          strength: 0.65,
          num_inference_steps: 35,
          guidance_scale: 7.5,
          num_images: 1,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const imageUrl = data.images?.[0]?.url
        if (imageUrl) {
          return NextResponse.json({ imageUrl, method: 'image-to-image' })
        }
      }
    }

    // ── Fallback: Generate mockup prompts via Claude ──────────────────
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) return NextResponse.json({ error: 'No API keys configured' }, { status: 500 })

    const promptRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Write a detailed AI image generation prompt for a product mockup.

Product: ${product}
Design/Pattern: ${design || 'custom print design uploaded by user'}
Setting/Scene: ${setting}
Photography Style: ${style}
Has real design image: ${designImageBase64 ? 'YES — the design must be described as placed exactly on the product' : 'NO — create a stylish pattern'}
Has model photo: ${modelImageBase64 ? 'YES — use the uploaded persons face' : 'NO — use a model'}

Write ONE detailed prompt (under 300 words) that:
1. Places the design/pattern EXACTLY on the ${product}
2. Shows the full product clearly
3. Uses the specified setting and style
4. Creates a photorealistic result

Return ONLY the prompt text, nothing else.`,
        }],
      }),
    })

    const promptData = await promptRes.json()
    const generatedPrompt = promptData.content?.[0]?.text || `Professional fashion photography of a ${product} with custom design, ${setting}, ${style}, ultra realistic, editorial quality`

    return NextResponse.json({
      prompt: generatedPrompt,
      method: 'prompt-only',
      note: designImageBase64 ? 'Design image detected but image-to-image fallback used — for best results ensure FAL_API_KEY is configured' : 'No design image uploaded',
    })

  } catch (err) {
    console.error('[/api/generate/mockup]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
