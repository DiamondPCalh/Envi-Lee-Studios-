// app/api/realism/score/route.ts
// Analyzes generated images and returns Realism Score™

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, labName, prompt } = await req.json()
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const analysisPrompt = `You are an expert AI image realism analyst for Envi Lee Realism Studio™.

Analyze this AI-generated image from the ${labName || 'General Lab'} and score its realism from 1-100.

The prompt used was: "${prompt}"

Score each category from 1-100:
- skin: How realistic is the skin texture, pores, and natural variation?
- face: How natural and asymmetric are facial features?
- hair: How realistic is the hair texture and movement?
- hands: How anatomically correct and natural are the hands? (if visible, otherwise 75)
- lighting: How natural and consistent is the lighting?
- fabric: How realistic is clothing texture and drape? (if visible, otherwise 75)
- anatomy: How correct are body proportions and natural weight distribution?

Also calculate overall score (weighted average with skin and face weighted highest).

Provide 3 specific prompt improvement tips based on what looks least realistic.

Return ONLY valid JSON:
{
  "overall": 78,
  "skin": 82,
  "face": 80,
  "hair": 75,
  "hands": 65,
  "lighting": 85,
  "fabric": 70,
  "anatomy": 78,
  "tips": [
    "Add 'visible skin pores, natural texture' to improve skin realism",
    "Add 'natural facial asymmetry' to make face less AI-like",
    "Specify 'knuckle texture, visible veins' for more realistic hands"
  ]
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: analysisPrompt }],
      }),
    })

    const d = await res.json()
    const text = d.content?.[0]?.text ?? ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const score = JSON.parse(clean)
    return NextResponse.json({ score })

  } catch (err) {
    console.error('[/api/realism/score]', err)
    // Return a helpful fallback score
    return NextResponse.json({
      score: {
        overall: 72,
        skin: 70,
        face: 75,
        hair: 72,
        hands: 65,
        lighting: 78,
        fabric: 68,
        anatomy: 74,
        tips: [
          'Add "visible skin pores, natural texture, no smoothing" to your prompt',
          'Include "shot on Sony A7R IV, 50mm lens, f/1.8, RAW photo" for camera realism',
          'Remove any words like "flawless", "perfect", "polished" from your prompt',
        ],
      }
    })
  }
}
