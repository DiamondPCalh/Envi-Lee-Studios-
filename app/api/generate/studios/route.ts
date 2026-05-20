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
      script: `Write a ${params.type || 'Reality TV episode'} script.
Title/show: ${params.title || 'Untitled'}
Cast: ${params.cast || 'main characters'}
Story: ${params.story || 'drama unfolds'}
Tone: ${params.tone || 'Dramatic and tense'}

Include:
- Cold open that grabs attention immediately
- Key scenes with dialogue and action beats
- Dramatic or emotional moments
- Strong ending or cliffhanger
- Video prompts for 2 key scenes ready for Kling AI
Format like a real script. Under 500 words. Make it gripping.`,

      character: `Build a complete AI character profile.
Name: ${params.name || 'AI Character'}
Age and vibe: ${params.age || 'mid 20s, powerful energy'}
Appearance: ${params.appearance || 'distinctive and memorable'}
Style: ${params.style || 'bold and fashion forward'}
Personality: ${params.personality || 'bold and charismatic'}
Backstory: ${params.backstory || 'driven and ambitious'}

Write:
CHARACTER OVERVIEW: Who they are in 3 compelling sentences.
APPEARANCE PROMPT (Midjourney/DALL-E ready): Full description for consistent image generation.
VIDEO SEED (Kling AI ready): How to generate consistent video of this character.
VOICE NOTES: Their speech patterns for ElevenLabs or voice tools.
SIGNATURE PHRASES: 3 things they always say.
CONSISTENCY RULE: One short phrase to add to every prompt to keep them consistent.`,

      scene: `Build a complete scene package.
Characters: ${params.characters || 'main characters'}
Setting and mood: ${params.setting || 'cinematic dramatic location'}
What happens: ${params.action || 'dramatic interaction unfolds'}

Write:
SCENE HEADER: INT/EXT format
ACTION: 2 lines setting the scene
DIALOGUE: Key exchange with action beats
CAMERA: 2 key shot directions

VIDEO PROMPT (Kling AI/Runway ready): Complete copy-paste prompt for AI video generation including character appearance, wardrobe, setting, lighting, camera movement, mood, and duration.`,

      podcast: `Write a ${params.type || 'Podcast episode'} script.
Show and host: ${params.show || 'The Creator Files hosted by Luxe Envi'}
Topic: ${params.topic || 'building a creator business with AI'}

Include:
- Intro hook that grabs attention
- 3-4 key talking points with real substance
- Natural conversation flow
- Sponsor break placeholder
- Outro with clear CTA
Write actual dialogue. Warm and engaging voice. Under 400 words.`,

      lipsync: `You are a professional lip sync video script writer for AI avatars.
Character: ${params.character || 'Luxe Envi, Black woman, 28, luxury lifestyle creator'}
Purpose: ${params.purpose || 'TikTok promotional video'}
Topic: ${params.topic || 'promoting the creator brand'}
Length: ${params.length || '30 seconds'}
Tone: ${params.tone || 'Confident and empowering'}

Write:
SCRIPT: Exact words spoken. Natural for the character. Include pauses with [...]. Timed for ${params.length || '30 seconds'}.
VOICE DIRECTION: Delivery notes for ElevenLabs — speed, emotion, emphasis.
HEYGEN SETUP: Exact settings for best results.
IMAGE PROMPT: Midjourney/DALL-E prompt for character still image.
CAPTION: Ready-to-post caption with hook and CTA.`,

      multichar: `Write multi-character dialogue for AI lip sync.
Character 1: ${params.char1name || 'Luxe Envi'} — ${params.char1desc || 'Black woman, 28, powerful and confident'}
Character 2: ${params.char2name || 'Marcus Reed'} — ${params.char2desc || 'Black man, 32, commanding and intense'}
${params.char3name ? `Character 3: ${params.char3name} — ${params.char3desc || 'distinctive personality'}` : ''}
Scene type: ${params.sceneType || 'Reality TV confrontation'}
Setting: ${params.setting || 'luxury rooftop NYC'}
What happens: ${params.story || 'a powerful conversation unfolds'}
Length: ${params.length || 'Medium — 10 to 14 exchanges'}

Write:
SCENE OVERVIEW: 2 sentences on the energy and stakes.
DIALOGUE SCRIPT: Format as [NAME]: (dialogue). Natural, authentic, sounds real when spoken. Include [...] for pauses. Strong final line.
VOICE ASSIGNMENTS: ElevenLabs delivery notes for each character.
SETUP INSTRUCTIONS: Step by step for InfiniteTalk Multi or Dzine AI.
IMAGE PROMPTS: Midjourney prompt for each character upper body shot.
SCENE VIDEO PROMPT: Kling AI prompt for the background setting.`,
    }

    const prompt = prompts[tool]
    if (!prompt) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })

    const result = await generate(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[studios]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
