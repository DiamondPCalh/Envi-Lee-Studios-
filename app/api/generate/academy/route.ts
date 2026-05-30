// app/api/generate/academy/route.ts
// Handles AI twin building, AUREN workshops, scene generation, and media kit creation

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, side, ...params } = body

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const isBaddie = side === 'baddie'
    const pronoun = isBaddie ? 'she' : 'he'
    const possessive = isBaddie ? 'her' : 'his'
    const title = isBaddie ? 'AI influencer and digital creator' : 'AI king and digital mogul'

    const prompts: Record<string, string> = {
      build: `You are a professional AI character developer for ${isBaddie ? 'Envi Lee Baddie Academy' : "Envi Lee King's Academy"}.

Build a complete, detailed AI twin profile for:

Name: ${params.name}
Age: ${params.age}
Side: ${isBaddie ? 'Baddie Academy — female AI influencer' : "King's Academy — male AI influencer"}

Physical appearance:
- Skin: ${params.skinTone} with ${params.skinUndertone} undertones
- Eyes: ${params.eyeShape} ${params.eyeColor} eyes
- Hair: ${params.hairstyle}, ${params.hairTexture}, ${params.hairColor}
- Lips: ${params.lipSize} ${params.lipShape}
- Nose: ${params.noseShape}
- Body: ${params.bodyType}
${params.nosePiercing !== 'None' ? `- Piercing: ${params.nosePiercing}` : ''}
${params.tattoos !== 'None' ? `- Tattoos: ${params.tattoos}` : ''}

Personality: ${params.personality || 'powerful, magnetic, ambitious'}
Backstory: ${params.backstory || 'built from nothing'}
Goals: ${params.goals || 'build a digital empire'}

Create a full character profile including:
1. FULL NAME & TITLE — ${possessive} complete name and how ${pronoun} presents ${possessive}self
2. ORIGIN STORY — Where ${pronoun} came from (2-3 sentences, powerful and real)
3. PERSONALITY BREAKDOWN — 5 core traits with explanations
4. SIGNATURE ENERGY — How ${pronoun} makes people feel, ${possessive} presence
5. BRAND AESTHETIC — ${possessive} visual style, fashion direction, color palette
6. LIFESTYLE — Where ${pronoun} lives, travels, what ${pronoun} drives, ${possessive} world
7. CONTENT PILLARS — 5 things ${pronoun} creates content about
8. SIGNATURE PHRASES — 3-5 things ${pronoun} always says
9. AI IMAGE PROMPT — A detailed prompt to generate ${possessive} image (ready for Gemini or Midjourney)
10. CONSISTENCY RULE — The one phrase to add to every prompt to keep ${possessive} face consistent

Make this feel like a real, iconic digital personality. Not generic.`,

      auren: `You are the ${isBaddie ? 'Baddie Academy' : "King's Academy"} workshop facilitator for Envi Lee.

AUREN Letter: ${params.letter}
Lesson: ${params.lesson}
Student's AI twin name: ${params.name}

Workshop inputs:
Input 1: ${params.input1 || 'Not provided'}
Input 2: ${params.input2 || 'Not provided'}

Run the ${params.letter} workshop for this student. The AUREN framework:
A — Avatar & Identity Creation
U — Upgrade Realism & Content Mastery
R — Revenue Setup & Monetization
E — Expansion System & Automation
N — Network & Scale & Legacy

For the ${params.letter} — ${params.lesson} workshop provide:
1. A personalized workshop exercise based on their inputs
2. 3 specific action steps they should take this week
3. A powerful insight about their AI twin based on what they shared
4. The exact prompts or templates they need for this lesson
5. A motivational close that connects to their bigger vision

Be specific, practical, and inspiring. This is a real workshop, not generic advice.`,

      scenes: `You are a cinematic director creating scene prompts for an AI ${isBaddie ? 'influencer' : 'male creator'} content shoot.

${params.context}

Generate 4 cinematic scene prompts. Each should be:
- A complete, detailed image generation prompt
- Set in a different luxurious or aspirational location
- Feature different lighting and mood
- Show the ${isBaddie ? 'woman' : 'man'} in a powerful, aspirational pose
- Include fashion direction and energy description
- Ready to paste into an image generator

Format: One prompt per line, numbered 1-4. Each prompt should be 2-3 sentences.`,

      mediakit: `You are a professional media kit writer for AI influencers and digital creators.

AI Twin Name: ${params.twinName}
Niche: ${params.niche || 'Luxury lifestyle and AI creator education'}
Platforms: ${params.platforms || 'TikTok, Instagram'}
Achievements: ${params.achievements || 'Growing AI creator brand'}
Academy: ${isBaddie ? 'Envi Lee Baddie Academy' : "Envi Lee King's Academy"}

Create a complete, professional media kit including:

1. SHORT BIO (50 words) — punchy, powerful, brand-forward
2. LONG BIO (150 words) — full story, personality, achievements
3. CONTENT OVERVIEW — what type of content, posting frequency, audience demographics
4. PLATFORM STATS TEMPLATE — formatted stats section (with placeholder numbers they can fill in)
5. CONTENT CATEGORIES — 5 content pillars with examples
6. BRAND PARTNERSHIPS — what types of brands are a fit
7. SERVICES & RATES — template rate card for different content types
8. CONTACT SECTION — professional closing with CTA

Format this like a real industry media kit. Make it premium and professional.`,
    }

    const prompt = prompts[tool]
    if (!prompt) return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })

  } catch (err) {
    console.error('[/api/generate/academy]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
