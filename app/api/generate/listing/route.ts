import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { productName, details, platform, targetAudience } = await req.json()
    if (!productName) return NextResponse.json({ error: 'productName is required' }, { status: 400 })
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
        model: model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a top POD ecommerce copywriter.
Product: ${productName}
Details: ${details || 'premium stylish fashion item'}
Platform: ${platform || 'Etsy'}
Audience: ${targetAudience || 'women aged 22-40 who love fashion and luxury'}

Write:
TITLE: SEO-optimised for ${platform || 'Etsy'}. Under 140 chars.
DESCRIPTION: Lifestyle-led, 4-5 sentences, sells the feeling.
KEY FEATURES: 5 benefit-first bullet points under 15 words each.
SEO TAGS: 13 comma-separated tags under 20 chars each.
TIKTOK CAPTION: Hook + product + CTA under 150 chars.`
        }]
      })
    })
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })
  } catch (err) {
    console.error('[listing]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
