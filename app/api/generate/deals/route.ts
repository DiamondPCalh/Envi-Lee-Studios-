import { NextRequest, NextResponse } from 'next/server'

async function generate(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return 'API key not configured'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
  const d = await res.json()
  return d.content?.[0]?.text ?? ''
}

export async function POST(req: NextRequest) {
  try {
    const { tool, ...params } = await req.json()

    const prompts: Record<string, string> = {
      pitch: `Write a brand pitch email for Envi Lee — a POD brand owner and AI influencer creator.
Brand: ${params.brand || 'the brand'}
Deal type: ${params.type || 'Sponsored content'}
Audience: ${params.audience || 'TikTok 85k, Instagram 42k'}
Rate: ${params.rate || 'open to discuss'}
Why we fit: ${params.fit || 'aligned audiences'}
Tone: ${params.tone || 'Confident and professional'}

Write:
SUBJECT LINE: Compelling and specific — not generic.
EMAIL BODY: Personal opening referencing the brand, who Envi Lee is in 2 sentences, why this brand plus her audience is a perfect match, deliverables and rate, clear CTA. Equal partners. Professional. Under 200 words.`,

      ratecard: `Build a complete rate card for creator Envi Lee.
Platforms and following: ${params.platforms || 'TikTok 85k, Instagram 42k'}
Niche: ${params.niche || 'POD fashion and AI influencer creator'}

Write a professional rate card:
TIKTOK RATES: Single video, 2-video pack, monthly retainer
INSTAGRAM RATES: Single Reel, Stories pack, monthly retainer
UGC RATES: Single video, 5-video pack, monthly retainer
PACKAGES: Starter, Standard, and Premium bundles with prices
ADD-ONS: Usage rights, exclusivity, rush fee
PAYMENT TERMS: Standard terms
Make rates strong — she should not undercharge. Under 300 words.`,

      followup: `Write a follow-up email for a brand deal.
Brand: ${params.brand || 'the brand'}
Previous contact: ${params.previous || 'sent initial pitch 1 week ago'}
Tone: ${params.tone || 'Confident and professional'}

Write:
SUBJECT LINE: Short and compelling
EMAIL: Brief, professional, adds new value or urgency. Not desperate. Confident. Under 100 words.`,

      counter: `Write a counter-offer email for a brand deal negotiation.
Brand: ${params.brand || 'the brand'}
Their offer: ${params.offer || 'below asking rate'}
My counter: ${params.counter || 'original rate'}
Tone: ${params.tone || 'Confident and professional'}

Write:
SUBJECT LINE: Professional
EMAIL: Thank them, acknowledge their offer, counter confidently with clear reasoning, keep the door open. Under 150 words.`,

      contract: `Create a simple brand deal contract outline.
Brand: ${params.brand || 'Brand Name'}
Creator: Envi Lee
Deal type: ${params.type || 'Sponsored content'}
Rate: ${params.rate || 'agreed rate'}
Deliverables: ${params.deliverables || 'content as discussed'}

Write a professional contract outline with these sections:
PARTIES: Creator and brand details
DELIVERABLES: Exactly what will be created and when
PAYMENT: Amount, due date, payment method
USAGE RIGHTS: How brand can use the content
EXCLUSIVITY: Any exclusivity terms
REVISIONS: How many rounds included
TERMINATION: How either party can exit
Note at the end: This is a template outline. Have a lawyer review before signing.`,
    }

    const prompt = prompts[tool]
    if (!prompt) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })

    const result = await generate(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[deals]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
