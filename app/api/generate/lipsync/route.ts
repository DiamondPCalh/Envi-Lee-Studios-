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
      single: `You are a professional lip sync video script writer for AI avatars.
Character: ${params.character || 'Luxe Envi, Black woman, 28, luxury lifestyle creator'}
Purpose: ${params.purpose || 'TikTok promotional video'}
Topic: ${params.topic || 'promoting the creator brand'}
Length: ${params.length || '30 seconds'}
Tone: ${params.tone || 'Confident and empowering'}

Write a complete lip sync package:

SCRIPT (exact words spoken — natural, no stage directions, include pauses with [...]):
Timed for ${params.length || '30 seconds'}.

VOICE DIRECTION (for ElevenLabs):
Speed, emotion, emphasis, pauses. 3-4 sentences.

HEYGEN / D-ID SETUP:
Exact settings for best results — background, avatar style, video format.

IMAGE PROMPT (Midjourney/DALL-E for character still image):
Upper body, facing camera, professional quality.

CAPTION (ready to post):
Hook + body + CTA with hashtags.`,

      multi: `Write multi-character lip sync dialogue.
Character 1: ${params.c1name || 'Luxe Envi'} — ${params.c1desc || 'Black woman, 28, powerful and confident'}
Character 2: ${params.c2name || 'Marcus Reed'} — ${params.c2desc || 'Black man, 32, commanding and intense'}
${params.c3name ? `Character 3: ${params.c3name} — ${params.c3desc || 'distinctive personality'}` : ''}
Scene: ${params.scene || 'Reality TV confrontation'}
Setting: ${params.setting || 'luxury rooftop NYC'}
Story: ${params.story || 'a powerful conversation unfolds'}
Length: ${params.length || 'Medium — 10 to 14 exchanges'}

Write:
SCENE OVERVIEW: 2 sentences on energy and stakes.

DIALOGUE SCRIPT:
Format as [NAME]: (dialogue). Natural and authentic. Include [...] for pauses. Build tension. Strong final line.

VOICE ASSIGNMENTS (ElevenLabs):
${params.c1name || 'Character 1'}: delivery notes
${params.c2name || 'Character 2'}: delivery notes
${params.c3name ? `${params.c3name}: delivery notes` : ''}

SETUP INSTRUCTIONS (InfiniteTalk Multi or Dzine AI):
Step by step for best results.

IMAGE PROMPTS:
${params.c1name || 'Character 1'}: Midjourney upper body shot prompt
${params.c2name || 'Character 2'}: Midjourney upper body shot prompt
${params.c3name ? `${params.c3name}: Midjourney upper body shot prompt` : ''}

SCENE VIDEO PROMPT (Kling AI — background setting):
Complete prompt for the environment.`,

      voice: `Write a professional voiceover script.
Voice type: ${params.voice || 'Confident Black woman — warm, powerful, commanding'}
Purpose: ${params.purpose || 'TikTok voiceover'}
Message: ${params.message || 'empowering creator content'}

Write:
VOICEOVER SCRIPT:
Natural spoken words only. No stage directions. Use [...] for pauses and CAPS for emphasis. Under 200 words.

DELIVERY NOTES (ElevenLabs):
Speed setting, emotion, tone, specific emphasis.

USE CASES:
3 ways to use this voiceover across different formats.`,
    }

    const prompt = prompts[tool]
    if (!prompt) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })

    const result = await generate(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[lipsync]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
