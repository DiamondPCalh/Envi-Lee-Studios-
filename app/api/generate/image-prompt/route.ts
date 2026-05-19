import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { subject, style, mood, platform, extras } = await req.json()
    if (!subject) return NextResponse.json({ error: 'subject is required' }, { status: 400 })
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
        model: model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are an expert AI image and video prompt engineer for fashion and POD photography.
Subject: ${subject}
Style: ${style || 'editorial fashion photography, luxury aesthetic'}
Mood: ${mood || 'powerful, confident, aspirational'}
Platform: ${platform || 'Midjourney'}
Extras: ${extras || 'none'}

Write:
MAIN PROMPT: Complete ready-to-paste prompt. Subject, wardrobe, setting, lighting, camera, mood.${platform === 'midjourney' ? ' End with --ar 4:5 --style raw --v 6' : ''}
NEGATIVE PROMPT: Elements to exclude.
VARIATION 1: Same subject, different angle.
VARIATION 2: Same subject, different setting.
TIPS: 2 quick tips for best results on ${platform || 'Midjourney'}.`
        }]
      })
    })
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
    const d = await res.json()
    return NextResponse.json({ result: d.content?.[0]?.text ?? '' })
  } catch (err) {
    console.error('[image-prompt]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
