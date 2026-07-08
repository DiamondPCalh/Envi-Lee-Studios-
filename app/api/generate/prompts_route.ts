// app/api/generate/prompts/route.ts
// Powers all generation in the Baddie Prompt Bank
// Tools: oneclick, aigenerator, stacks, reverse, calendar

import { NextRequest, NextResponse } from 'next/server'

// ── REALISM RULES — never use beauty/smoothing words ──────────
const REALISM_SUFFIX = `visible skin pores, natural skin texture, subtle skin imperfections, realistic lighting, no over-smoothing, no CGI look, no plastic skin, no filter, natural shadows, true-to-life proportions, DSLR photography, RAW photo quality, high dynamic range, shot on Sony A7R IV, 50mm lens f/1.8, shallow depth of field, cinematic composition, no oily complexion, keep skin natural and human, no morphing of facial or body structure, 50mm lens, Subtle pores and real human texture, keep skin naturel an human, No oily look are complexion of the skin, candid but polished, very very human realistic detailed`

const REALISM_NEGATIVE = `flawless skin, perfect skin, glossy, polished, professional beauty lighting, ultra HD CGI, plastic skin, over-smoothed, airbrushed, cartoon, fake, artificial, studio beauty photography, overly edited`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, ...params } = body

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const prompts: Record<string, string> = {

      oneclick: `You are the Baddie Prompt Bank AI for Envi Lee Creator Studios.

IMPORTANT RULE: ALL image prompts must use REALISM language only. Never use words like: flawless, perfect skin, glossy, polished, professional beauty lighting, ultra HD, airbrushed, or plastic. Always use: natural texture, visible pores, RAW photo, shot on Sony A7R IV, f/1.8, no smoothing, candid, human and real.

Category: ${params.category || 'Luxury Lifestyle'}
${params.dnaContext ? `Creator Profile: ${params.dnaContext}` : ''}
Script type: ${params.scriptType || 'voiceover'}
Calendar: ${params.calendarType === '30day' ? '30-day' : '7-day'}
Video app: ${params.videoApp || 'kling'}

Generate a COMPLETE content package. Return ONLY valid JSON with no extra text:

{
  "imagePrompt": "REALISTIC image prompt for a Black woman creator. Include: skin tone with natural texture and visible pores, hair, outfit, location, candid natural lighting. MUST include: shot on Sony A7R IV, 50mm lens f/1.8, RAW photo, no smoothing, no filter, natural skin texture, visible pores, shallow depth of field. NO beauty words. Very human and real.",
  "videoPrompt": "Cinematic video prompt based on the image. Add natural camera movement — slow push-in, dolly, handheld feel. Real human motion. No CGI. Shot on Sony A7R IV.",
  "reelScript": "A 15-30 second reel script with hook, main content, and CTA. Natural and authentic voice.",
  "tiktokCaption": "TikTok caption with hook first line, storytelling, and 3-5 hashtags at the end.",
  "youtubeCaption": "YouTube Shorts description with keywords, storytelling, and subscribe CTA.",
  "voiceoverScript": "${params.scriptType === 'lipsync' ? 'Lip sync dialogue' : 'Voiceover narration'} for the video. Natural speech, authentic tone.",
  "thumbnailPrompt": "Thumbnail prompt — eye-catching, bold composition, natural human look. Shot on Sony A7R IV, no filter.",
  "trendingAudio": "5 trending audio suggestions for this content type on TikTok and Instagram. Include artist and vibe.",
  "hashtags": "30 optimized hashtags for maximum reach. Mix of niche, mid-size, and broad. One per line.",
  "ctas": "5 powerful CTAs for this content type. Varies between follow, comment, share, save, link in bio.",
  "calendar": "${params.calendarType === '30day' ? 'A full 30-day content calendar' : 'A 7-day content calendar'} for the ${params.category || 'Luxury Lifestyle'} niche. Format each entry as: Day [N] | [Platform] | [Content Type] | [Post Time] | [Brief description]. Include variety of platforms and content types."
}`,

      aigenerator: `You are the Baddie Prompt Bank AI for Envi Lee Creator Studios.

REALISM RULE: ALL image prompts must be RAW, human, and realistic. Never use: flawless, glossy, polished, beauty lighting, airbrushed. Always use: natural texture, visible pores, RAW photo, Sony A7R IV, f/1.8, no smoothing.

Generate a COMPLETE content package for this AI creator:
Age: ${params.age || '28'}
Skin tone: ${params.skinTone || 'deep brown'}
Hair: ${params.hairTone || 'natural locs, black'}
Location: ${params.location || 'luxury lifestyle setting'}
Outfit: ${params.outfitType || 'luxury casual outfit'}
Content type: ${params.contentType || 'Luxury Lifestyle'}
${params.dnaContext ? `DNA Profile: ${params.dnaContext}` : ''}

IMAGE PROMPT:
[RAW realistic image prompt. Include all physical details naturally. No smoothing words. Must include: visible skin pores, natural texture, shot on Sony A7R IV, 50mm lens f/1.8, shallow depth of field, RAW photo, no filter, candid but polished, very human and real. ${REALISM_SUFFIX}]

VIDEO PROMPT:
[Cinematic video version with natural camera movement. Handheld feel, slow push-in or dolly. Real human motion.]

THUMBNAIL PROMPT:
[Eye-catching composition, natural human look, bold moment, real skin texture]

TIKTOK CAPTION:
[Hook line, authentic story, hashtags]

INSTAGRAM CAPTION:
[Storytelling caption with emojis, CTA, hashtags]

YOUTUBE SHORTS DESCRIPTION:
[SEO-optimized, keyword-rich]

HOOK (first 3 seconds):
[The exact opening line that stops the scroll]

CTA:
[The perfect call to action]

HASHTAGS:
[25 optimized hashtags]`,

      stacks: `You are Envi Lee's AI prompt stack generator for the Baddie Prompt Bank.

REALISM RULE: All image and video prompts must be RAW and realistic. Use: natural texture, visible pores, Sony A7R IV, f/1.8, RAW photo, no smoothing. Never use: flawless, glossy, polished, beauty lighting.

Idea: ${params.idea}
Stack type: ${params.stackType || 'All Stacks'}

${params.stackType === 'All Stacks' || params.stackType === 'Midjourney Prompts' ? `
MIDJOURNEY PROMPTS (5 variations):
[Format: /imagine prompt: [realistic human prompt, visible pores, natural texture, Sony A7R IV], --ar 9:16 --v 6.1 --style raw]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Kling Prompts' ? `
KLING AI PROMPTS (3 variations):
[Format: Cinematic handheld video of [subject]. Natural movement, realistic lighting, no CGI. Shot on Sony A7R IV.]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Veo Prompts' ? `
VEO PROMPTS (3 variations):
[Format: Realistic video of [subject]. Natural human motion, cinematic, photorealistic, no CGI look.]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'TikTok Captions' ? `
TIKTOK CAPTIONS (5 variations):
[Hook line, authentic content, hashtags. Different tones: confident, funny, emotional, educational, mysterious]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'YouTube Short Descriptions' ? `
YOUTUBE SHORT DESCRIPTIONS (3 variations):
[SEO-optimized, keyword-rich descriptions]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Instagram Captions' ? `
INSTAGRAM CAPTIONS (5 variations):
[Storytelling captions with emojis, CTA, hashtags]
` : ''}
${params.stackType === 'All Stacks' || params.stackType === 'Thumbnail Prompts' ? `
THUMBNAIL PROMPTS (3 variations):
[Bold eye-catching composition, natural human look, real skin texture, Sony A7R IV]
` : ''}

Make every prompt specific, powerful, and immediately usable. Realism only — no beauty filter language.`,

      reverse: `You are an expert AI image prompt engineer specializing in ultra-realistic human photography.

Image provided: ${params.imageData ? 'Yes' : 'No'}

Reverse engineer this image and provide:

REVERSE ENGINEERED PROMPT:
[The most likely prompt. Focus on: natural skin texture, lighting type, camera settings, location, outfit. Include Sony A7R IV style specs if it looks realistic. Never add beauty/smoothing words.]

MIDJOURNEY VERSION:
[/imagine prompt: [realistic prompt], visible pores, natural texture, --ar 9:16 --v 6.1 --style raw]

KLING/VEO VERSION:
[Cinematic video version with natural camera movement]

VARIATIONS TO TRY:
1. [Same person, different location]
2. [Same person, different outfit]  
3. [Same person, different time of day/lighting]

REALISM TIP:
[Specific tips to make this prompt generate more realistic human skin]

CONSISTENCY TIP:
[How to keep this exact look across multiple generations]`,

      calendar: `You are a content calendar expert for AI creators on Envi Lee Creator Studios.

Creator info:
Niche: ${params.niche || 'Luxury Lifestyle'}
Platforms: ${params.platforms || 'TikTok, Instagram'}
Content categories: ${params.categories || 'Luxury Lifestyle, CEO Baddie, Fashion'}
Posts per week: ${params.postsPerWeek || '5'}
Calendar type: ${params.calendarType || 'week'}

Generate a ${params.calendarType === '30day' ? 'complete 30-day' : '7-day'} content calendar.

For each day include:
- Day number and date placeholder
- Platform
- Content type and category
- Best posting time
- Content idea / hook
- Caption direction
- Hashtag theme

Format as JSON array:
[
  {
    "day": 1,
    "date": "Monday",
    "platform": "TikTok",
    "category": "CEO Baddie",
    "contentType": "Day in my life",
    "postTime": "7:00 PM EST",
    "idea": "Morning routine as a CEO baddie — realistic and candid",
    "captionHook": "Nobody talks about the 5am version of success...",
    "hashtagTheme": "#CEOBaddie #MorningRoutine #BlackGirlCEO"
  }
]

Make it varied, realistic, and achievable. Mix platforms and content types throughout.`,
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

    if (tool === 'oneclick' || tool === 'calendar') {
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        JSON.parse(clean)
        return NextResponse.json({ result: clean })
      } catch {
        return NextResponse.json({ result: text })
      }
    }

    return NextResponse.json({ result: text })

  } catch (err) {
    console.error('[/api/generate/prompts]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
