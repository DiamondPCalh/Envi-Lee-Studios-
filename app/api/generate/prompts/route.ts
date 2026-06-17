// app/api/generate/prompts/route.ts
// Powers all generation in the Baddie Prompt Bank
// Tools: oneclick, aigenerator, stacks, reverse, bot

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, ...params } = body

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const prompts: Record<string, string> = {

      oneclick: `You are the Baddie Prompt Bank AI for Envi Lee Creator Studios. Generate a complete content package.

Category: ${params.category || 'Luxury Lifestyle'}
${params.dnaContext ? `Creator Profile: ${params.dnaContext}` : ''}
Script type: ${params.scriptType || 'voiceover'}
Calendar: ${params.calendarType === '30day' ? '30-day' : '7-day'}
Video app: ${params.videoApp || 'kling'}

Generate a COMPLETE content package. Return ONLY valid JSON with no extra text:

{
  "imagePrompt": "Detailed AI image generation prompt for a Black woman creator. Include skin tone, hair, outfit, location, lighting, style. Make it photorealistic, cinematic, 4K. Must match the category perfectly.",
  "videoPrompt": "A cinematic video prompt based on the image prompt above. Add camera movement, motion description.",
  "reelScript": "A 15-30 second reel script with hook, main content, and CTA. Include visual direction notes.",
  "tiktokCaption": "TikTok caption with hook first line, storytelling, and 3-5 hashtags at the end.",
  "youtubeCaption": "YouTube Shorts description with keywords, storytelling, and subscribe CTA.",
  "voiceoverScript": "${params.scriptType === 'lipsync' ? 'Lip sync dialogue' : 'Voiceover narration'} for the video. Natural speech, fits the vibe of the category.",
  "thumbnailPrompt": "Detailed thumbnail image prompt. Eye-catching, bold text placement direction, color scheme.",
  "trendingAudio": "5 trending audio suggestions for this content type on TikTok and Instagram. Include artist and vibe description.",
  "hashtags": "30 optimized hashtags for maximum reach. Mix of niche, mid-size, and broad. One per line.",
  "ctas": "5 powerful CTAs for this content type. Varies between follow, comment, share, save, and link in bio.",
  "calendar": "${params.calendarType === '30day' ? 'A full 30-day content calendar' : 'A 7-day content calendar'} for the ${params.category || 'Luxury Lifestyle'} niche. Format: Day 1 — [Platform] — [Content Type] — [Time] — [Brief description]. Include variety of content types, platforms, and posting times."
}`,

      aigenerator: `You are the Baddie Prompt Bank AI for Envi Lee Creator Studios.

Generate a COMPLETE content package for this AI creator:
Age: ${params.age || '28'}
Skin tone: ${params.skinTone || 'deep brown'}
Hair: ${params.hairTone || 'natural locs, black'}
Location: ${params.location || 'luxury setting'}
Outfit: ${params.outfitType || 'luxury outfit'}
Content type: ${params.contentType || 'Luxury Lifestyle'}
${params.dnaContext ? `Additional details: ${params.dnaContext}` : ''}

Generate:

IMAGE PROMPT:
[Detailed, ready-to-paste image generation prompt for this creator. Include all physical details, outfit, setting, lighting, camera angle, style. Make it photorealistic, cinematic, luxury.]

VIDEO PROMPT:
[Video version of the image prompt with motion and camera direction added]

THUMBNAIL PROMPT:
[Eye-catching thumbnail prompt with bold composition]

TIKTOK CAPTION:
[Hook line, story/value, hashtags]

INSTAGRAM CAPTION:
[Longer storytelling caption with emojis, call to action, hashtags]

YOUTUBE SHORTS DESCRIPTION:
[SEO-optimized description with keywords]

HOOK (first 3 seconds):
[The exact opening line or visual that stops the scroll]

CTA:
[The perfect call to action for this content]

HASHTAGS:
[25 optimized hashtags]`,

      stacks: `You are Envi Lee's AI prompt stack generator for the Baddie Prompt Bank.

Idea: ${params.idea}
Stack type: ${params.stackType || 'All Stacks'}

Generate a professional prompt stack from this idea. Include:

${params.stackType === 'All Stacks' || params.stackType === 'Midjourney Prompts' ? `
MIDJOURNEY PROMPTS (5 variations):
[Format: /imagine prompt: [detailed prompt], photorealistic, 4K, cinematic, --ar 9:16 --v 6.1 --style raw]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Kling Prompts' ? `
KLING AI PROMPTS (3 variations):
[Format: Cinematic video of [prompt]. Motion description. Quality specs.]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Veo Prompts' ? `
VEO PROMPTS (3 variations):
[Format: Video of [prompt]. High quality, cinematic, professional.]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'TikTok Captions' ? `
TIKTOK CAPTIONS (5 variations):
[Hook line, content, hashtags. Different tones: confident, funny, emotional, educational, mysterious]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'YouTube Short Descriptions' ? `
YOUTUBE SHORT DESCRIPTIONS (3 variations):
[SEO-optimized, keyword-rich descriptions]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Instagram Captions' ? `
INSTAGRAM CAPTIONS (5 variations):
[Longer storytelling captions with emojis, CTA, hashtags]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Thumbnail Prompts' ? `
THUMBNAIL PROMPTS (3 variations):
[Bold, eye-catching thumbnail image prompts with text placement direction]
` : ''}

Make every prompt specific, powerful, and immediately usable. Premium quality only.`,

      reverse: `You are an expert AI image prompt engineer. Analyze this image and reverse engineer the exact prompt used to create it.

Image data: ${params.imageData ? '[Image provided]' : 'No image'}

Based on what you can analyze, generate:

REVERSE ENGINEERED PROMPT:
[The most likely prompt used to create this image. Include: subject description, outfit, setting, lighting, camera angle, style, quality keywords, aspect ratio]

MIDJOURNEY VERSION:
[Formatted for Midjourney: /imagine prompt: ...]

KLING/VEO VERSION:
[Formatted for video generation]

VARIATIONS TO TRY:
1. [Variation 1 — change the setting]
2. [Variation 2 — change the outfit]
3. [Variation 3 — change the lighting]

CONSISTENCY TIP:
[How to keep this exact look consistent across multiple generations]`,
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
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const d = await res.json()
    const text = d.content?.[0]?.text ?? ''

    // For oneclick, try to parse JSON
    if (tool === 'oneclick') {
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        JSON.parse(clean) // validate
        return NextResponse.json({ result: clean })
      } catch {
        // If not valid JSON, return as text and let frontend handle it
        return NextResponse.json({ result: text })
      }
    }

    return NextResponse.json({ result: text })

  } catch (err) {
    console.error('[/api/generate/prompts]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
