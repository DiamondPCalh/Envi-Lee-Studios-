import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { product, design, setting, style } = await req.json()
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a professional AI image prompt engineer for POD fashion mockups.
Product: ${product}
Design: ${design || 'luxury minimal design'}
Model/setting: ${setting || 'Black woman, natural hair, confident, luxury lifestyle'}
Style: ${style || 'editorial fashion photography'}

Write:
MOCKUP PROMPT (Midjourney/DALL-E ready — under 120 words): Include garment, design, model appearance, setting, lighting, camera, mood, quality keywords.
VIDEO PROMPT (Kling AI/Runway — under 80 words): 6-10 second product reveal with movement and atmosphere.
STYLE NOTES: 3 bullet points to make this mockup stand out.`
        }]
      })
    })
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })
  } catch (err) {
    console.error('[mockup]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
