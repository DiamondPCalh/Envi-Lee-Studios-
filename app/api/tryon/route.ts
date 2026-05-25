// app/api/tryon/route.ts
// Virtual Try-On using FASHN AI
// Requires FASHN_API_KEY and TRYON_PROVIDER=fashn in Vercel env vars

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { personImage, garmentImage, category } = await req.json()

    if (!personImage) {
      return NextResponse.json({ error: 'personImage is required' }, { status: 400 })
    }

    const provider = process.env.TRYON_PROVIDER ?? 'demo'

    // ── DEMO MODE ────────────────────────────────────────────
    if (provider === 'demo') {
      return NextResponse.json({
        result: 'demo',
        message: 'Demo mode — add FASHN_API_KEY and TRYON_PROVIDER=fashn to Vercel to enable real try-on.',
      })
    }

    // ── FASHN AI ─────────────────────────────────────────────
    if (provider === 'fashn') {
      const key = process.env.FASHN_API_KEY
      if (!key) {
        return NextResponse.json({ error: 'FASHN_API_KEY not configured' }, { status: 500 })
      }

      // Step 1 — Start the try-on job
      const runRes = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model_image: personImage,
          garment_image: garmentImage,
          category: category ?? 'tops',
          mode: 'quality',
          nsfw_filter: true,
          cover_feet: false,
          adjust_hands: true,
          restore_background: true,
          restore_clothes: true,
          guidance_scale: 2,
          timesteps: 50,
          num_samples: 1,
          return_base64: false,
        }),
      })

      if (!runRes.ok) {
        const err = await runRes.text()
        throw new Error(`FASHN run error ${runRes.status}: ${err}`)
      }

      const runData = await runRes.json()
      const predictionId = runData.id

      if (!predictionId) {
        throw new Error('No prediction ID returned from FASHN')
      }

      // Step 2 — Poll for result
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000))
        attempts++

        const statusRes = await fetch(`https://api.fashn.ai/v1/status/${predictionId}`, {
          headers: { 'Authorization': `Bearer ${key}` },
        })

        if (!statusRes.ok) continue

        const statusData = await statusRes.json()

        if (statusData.status === 'completed') {
          const imageUrl = statusData.output?.[0]
          if (imageUrl) {
            return NextResponse.json({ imageUrl, status: 'completed' })
          }
          throw new Error('No output image returned')
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.error ?? 'FASHN generation failed')
        }
      }

      throw new Error('Try-on timed out — try again')
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  } catch (err) {
    console.error('[tryon]', err)
    return NextResponse.json({ error: `Try-on failed: ${(err as Error).message}` }, { status: 500 })
  }
}

// Content generation for the try-on studio
export async function PUT(req: NextRequest) {
  try {
    const { productName, brand, platform, contentType } = await req.json()
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const prompts: Record<string, string> = {
      caption: `Write a viral ${platform} caption for: ${productName} by ${brand}. Hook + description + CTA. Under 150 chars for TikTok.`,
      hashtags: `Generate 20 high-performing hashtags for ${productName} by ${brand} on ${platform}. Mix broad and niche. Just hashtags.`,
      script: `Write a 30-second TikTok script for ${productName} by ${brand}. Hook (2 sec) + showcase (15 sec) + CTA (5 sec). Include [SCENE] directions.`,
      description: `Write a product description for ${productName} by ${brand}. Lifestyle-led, benefit-first, aspirational. Under 100 words.`,
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompts[contentType] ?? prompts.caption }],
      }),
    })

    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })

  } catch (err) {
    console.error('[tryon content]', err)
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }
}
