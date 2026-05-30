// app/api/generate/show/route.ts
// Generates scripts, episode plans, character bios, and loglines for AI shows

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { showType, tab, title, premise, cast, episode } = await req.json()

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const prompts: Record<string, string> = {
      script: `You are a professional TV writer specializing in ${showType} content.

Show: ${title || showType}
Premise: ${premise || 'An AI-powered show with Black characters and luxury aesthetic'}
Cast: ${cast || 'AI characters with diverse personalities'}
Episode focus: ${episode || 'Episode 1 — Pilot'}

Write a compelling ${showType} script scene (3-5 minutes of content). Include:
- Scene heading (INT/EXT, location, time)
- Action descriptions
- Dialogue for each character
- Stage directions
- Emotional beats and drama
- A cliffhanger or memorable moment

Make it cinematic, dramatic, and binge-worthy. Black characters, luxury aesthetic, real emotions.`,

      episode: `You are a TV showrunner planning episodes for a ${showType}.

Show: ${title || showType}
Premise: ${premise || 'An AI-powered show'}
Cast: ${cast || 'AI characters'}

Create a detailed episode plan for a full season (8 episodes). For each episode include:
- Episode title and number
- 2-sentence logline
- Main conflict or story beat
- Character development moment
- Cliffhanger ending

Make each episode compelling and build toward a season finale.`,

      characters: `You are a character development writer for a ${showType}.

Show: ${title || showType}
Premise: ${premise || 'An AI-powered show'}
Cast: ${cast || 'AI characters with diverse personalities'}

Write detailed character bios for each main character. Include:
- Full name and age
- Physical description
- Backstory (where they came from)
- Personality traits and quirks
- Goals and motivations
- Secret or internal conflict
- Relationship to other characters
- Signature phrases or habits

Make each character feel real, complex, and compelling.`,

      logline: `You are a Hollywood development executive writing pitch materials for a ${showType}.

Show: ${title || showType}
Premise: ${premise || 'An AI-powered show'}
Cast: ${cast || 'AI characters'}

Write:
1. A one-line logline (under 30 words)
2. A 2-paragraph pitch summary
3. Comparable shows (what it's like)
4. Target audience
5. Why now — why this show matters in 2025
6. Potential for multiple seasons

Make it exciting and sellable to a network.`,

      network: `You are an entertainment industry consultant helping a creator build their own AI content network.

Show/Content: ${title || 'AI Creator Content'}
Type: ${showType}
Premise: ${premise || 'Original AI-created content'}

Write a complete guide for building their own AI network with this content:
1. Platform strategy (YouTube vs TikTok vs own site)
2. Content calendar for first 3 months
3. How to grow an audience from zero
4. Monetization strategy (ads, subscriptions, merch, licensing)
5. How to involve other AI creators
6. Technical setup needed
7. How to eventually pitch to real networks

Be specific, practical, and inspiring.`,
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
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompts[tab] ?? prompts.script }],
      }),
    })

    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })

  } catch (err) {
    console.error('[/api/generate/show]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
