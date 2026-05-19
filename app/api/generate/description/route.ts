import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { product, niche, tone, audience } = await req.json()
    if (!product) return NextResponse.json({ error: 'product is required' }, { status: 400 })
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a POD description specialist.
Product: ${product}
Niche: ${niche || 'luxury fashion'}
Tone: ${tone || 'elevated, aspirational, confident'}
Audience: ${audience || 'Black women aged 22-40 who love fashion'}

Write:
SHORT (TikTok - 2 sentences): Fast and punchy.
MEDIUM (Etsy - 4-5 sentences): Lifestyle-led, paint a picture.
LONG (Shopify - 2 paragraphs): Full brand story, quality and feeling.
POWER LINE: One sentence tagline for this product.`
        }]
      })
    })
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })
  } catch (err) {
    console.error('[description]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
