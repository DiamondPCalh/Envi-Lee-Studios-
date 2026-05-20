// app/api/tryon/route.ts
// ============================================================
//  VIRTUAL TRY-ON API ADAPTER
//  Supports: FASHN, Genlook, OpenArt, or demo mode
//
//  To connect a real try-on API:
//  1. Go to Vercel → Settings → Environment Variables
//  2. Add one of these:
//     TRYON_PROVIDER = fashn       (then add FASHN_API_KEY)
//     TRYON_PROVIDER = genlook     (then add GENLOOK_API_KEY)
//     TRYON_PROVIDER = openart     (then add OPENART_API_KEY)
//  3. If TRYON_PROVIDER is not set it runs in demo mode
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { personImage, garmentImage, productName, brand, category } = await req.json()

    if (!personImage) {
      return NextResponse.json({ error: 'personImage is required' }, { status: 400 })
    }

    const provider = process.env.TRYON_PROVIDER ?? 'demo'

    // ── DEMO MODE ────────────────────────────────────────────
    if (provider === 'demo') {
      return NextResponse.json({
        result: 'demo',
        message: `Demo mode active. To enable real try-on, add TRYON_PROVIDER and API key to Vercel environment variables.`,
        product: productName,
        brand: brand,
      })
    }

    // ── FASHN API ────────────────────────────────────────────
    // Sign up at: https://fashn.ai
    if (provider === 'fashn') {
      const key = process.env.FASHN_API_KEY
      if (!key) return NextResponse.json({ error: 'FASHN_API_KEY not configured' }, { status: 500 })

      const res = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model_image: personImage,
          garment_image: garmentImage,
          category: category ?? 'tops',
          nsfw_filter: true,
        })
      })
      if (!res.ok) throw new Error(`FASHN error ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ result: 'success', imageUrl: data.output?.[0] ?? null, raw: data })
    }

    // ── GENLOOK API ──────────────────────────────────────────
    // Sign up at: https://genlook.ai
    if (provider === 'genlook') {
      const key = process.env.GENLOOK_API_KEY
      if (!key) return NextResponse.json({ error: 'GENLOOK_API_KEY not configured' }, { status: 500 })

      const res = await fetch('https://api.genlook.ai/v1/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': key
        },
        body: JSON.stringify({
          person_image: personImage,
          clothing_image: garmentImage,
          product_name: productName,
        })
      })
      if (!res.ok) throw new Error(`Genlook error ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ result: 'success', imageUrl: data.result_url ?? null, raw: data })
    }

    // ── OPENART API ──────────────────────────────────────────
    // Sign up at: https://openart.ai
    if (provider === 'openart') {
      const key = process.env.OPENART_API_KEY
      if (!key) return NextResponse.json({ error: 'OPENART_API_KEY not configured' }, { status: 500 })

      const res = await fetch('https://openart.ai/api/v1/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          human_image: personImage,
          cloth_image: garmentImage,
        })
      })
      if (!res.ok) throw new Error(`OpenArt error ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ result: 'success', imageUrl: data.output ?? null, raw: data })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  } catch (err) {
    console.error('[tryon]', err)
    return NextResponse.json({ error: 'Try-on generation failed' }, { status: 500 })
  }
}

// ── CONTENT GENERATION ROUTE ─────────────────────────────────
// Also handles generating captions, hashtags, and scripts
export async function PUT(req: NextRequest) {
  try {
    const { productName, brand, platform, contentType } = await req.json()
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const prompts: Record<string, string> = {
      caption: `Write a viral ${platform} caption for this product: ${productName} by ${brand}. Include hook, description, and CTA. Under 150 chars for TikTok, longer for Instagram.`,
      hashtags: `Generate 20 high-performing hashtags for ${productName} by ${brand} on ${platform}. Mix broad and niche tags. Just the hashtags, no explanation.`,
      script: `Write a 30-second TikTok script for ${productName} by ${brand}. Include: hook (2 sec), product showcase (15 sec), CTA (5 sec). Format with [SCENE] directions.`,
      description: `Write a product description for ${productName} by ${brand}. Lifestyle-led, benefit-first, aspirational. Under 100 words. Perfect for TikTok Shop or Amazon.`,
    }

    const prompt = prompts[contentType] ?? prompts.caption

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })

  } catch (err) {
    console.error('[tryon content]', err)
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }
}
