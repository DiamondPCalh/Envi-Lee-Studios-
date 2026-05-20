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
      prompt: `You are an expert cinematic video prompt engineer for AI video generation.
Type: ${params.type || 'UGC product showcase'}
Subject: ${params.subject || 'cinematic scene'}
Character: ${params.character || 'Black woman, confident, stylish'}
Setting: ${params.setting || 'dramatic cinematic location'}
Platform: ${params.platform || 'TikTok'}

Write:
MAIN VIDEO PROMPT (Kling AI/Runway ready): Complete copy-paste prompt. Include character appearance, wardrobe, action/movement, setting, lighting, camera movement, mood, atmosphere, duration 6-10 seconds.
VARIATION PROMPT: Same scene, different angle or camera movement.
DIRECTOR NOTES: 3 tips to get the best result.`,

      calendar: `Build a ${params.days || '7'}-day content calendar.
Niche: ${params.niche || 'POD fashion business'}
Platform: ${params.platform || 'TikTok'}
Goal: ${params.goal || 'Grow followers and drive sales'}

For each day write:
DAY [X]: [Video title/concept]
HOOK: [Opening line - first 2 seconds]
CAPTION: [2-3 line ready-to-post caption]
CTA: [The action you want viewers to take]
VIDEO PROMPT: [One-sentence Kling AI/Runway prompt]
HASHTAGS: [5 relevant tags]
POST TIME: [Best time to post]

Mix content types. Every day specific and actionable. Under 600 words.`,

      hooks: `Generate 10 scroll-stopping hooks for ${params.niche || 'POD business'} content.
Style: ${params.style || 'Income reveal'}

For each hook:
HOOK [N]: [The exact hook - 1-2 sentences max]
WHY IT WORKS: [One sentence on the psychology]

Mix POV hooks, income reveals, curiosity gaps, hot takes, and pattern interrupts. Under 350 words.`,

      caption: `Write a ${params.platform || 'TikTok'} caption.
Video topic: ${params.topic || 'creator business content'}
Brand voice: Envi Lee - luxury, confident, empowering, Black creator aesthetic.

Write:
HOOK: First line that stops the scroll (under 15 words)
BODY: 2-3 lines of content
CTA: The specific action
HASHTAGS: 8-10 relevant hashtags

Under 200 words. Make the hook irresistible.`,

      ugc: `Write a complete UGC ad script.
Product: ${params.product || 'fashion item'}
Platform: ${params.platform || 'TikTok'}
Brand: ${params.brand || 'Envi Lee'}

Write:
HOOK OPTION 1: Pattern interrupt opener
HOOK OPTION 2: Income/results reveal
HOOK OPTION 3: POV opener
FULL SCRIPT: Hook + problem + solution + product showcase + CTA. 30 seconds.
VIDEO PROMPT: Kling AI/Runway ready prompt for this ad.
CAPTION: Ready to post with hashtags.

Under 400 words.`,

      bot: `You are CineFlow AI - a content strategy assistant for Envi Lee, a Black woman creator who runs a POD business, AI influencer brand, and creator suite. Be specific, direct, and helpful.
Question: ${params.message || 'What should I post today?'}
Under 200 words.`
    }

    const prompt = prompts[tool]
    if (!prompt) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })

    const result = await generate(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[cineflow]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
