// app/api/generate/voice/route.ts
// ElevenLabs voice generation + voice cloning
// Used in AI Studios Lip Sync Studio

import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1'

// ── GET VOICES ────────────────────────────────────────────────
async function getVoices(apiKey: string) {
  const res = await fetch(`${ELEVENLABS_API}/voices`, {
    headers: { 'xi-api-key': apiKey },
  })
  return res.json()
}

// ── TEXT TO SPEECH ────────────────────────────────────────────
async function textToSpeech(apiKey: string, text: string, voiceId: string, stability: number, similarity: number) {
  const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: stability ?? 0.5,
        similarity_boost: similarity ?? 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.message || 'ElevenLabs TTS failed')
  }

  // Convert audio to base64
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:audio/mpeg;base64,${base64}`
}

// ── CLONE VOICE ───────────────────────────────────────────────
async function cloneVoice(apiKey: string, name: string, description: string, files: File[]) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('description', description)
  files.forEach(f => formData.append('files', f))

  const res = await fetch(`${ELEVENLABS_API}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.message || 'Voice cloning failed')
  }

  return res.json()
}

// ── GET USER INFO ─────────────────────────────────────────────
async function getUserInfo(apiKey: string) {
  const res = await fetch(`${ELEVENLABS_API}/user`, {
    headers: { 'xi-api-key': apiKey },
  })
  return res.json()
}

// ── MAIN HANDLER ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured in Vercel' }, { status: 500 })

    const body = await req.json()
    const { action, text, voiceId, stability, similarity, voiceName, voiceDescription } = body

    // ── List available voices ─────────────────────────────────
    if (action === 'get_voices') {
      const data = await getVoices(apiKey)
      return NextResponse.json({ success: true, voices: data.voices || [] })
    }

    // ── Text to speech ────────────────────────────────────────
    if (action === 'tts') {
      if (!text || !voiceId) {
        return NextResponse.json({ error: 'text and voiceId required' }, { status: 400 })
      }
      const audioDataUrl = await textToSpeech(apiKey, text, voiceId, stability ?? 0.5, similarity ?? 0.75)
      return NextResponse.json({ success: true, audioUrl: audioDataUrl })
    }

    // ── Get user info + character count ──────────────────────
    if (action === 'user_info') {
      const data = await getUserInfo(apiKey)
      return NextResponse.json({
        success: true,
        charactersUsed: data.subscription?.character_count || 0,
        charactersLimit: data.subscription?.character_limit || 0,
        tier: data.subscription?.tier || 'free',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/voice]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })

    const action = req.nextUrl.searchParams.get('action')

    if (action === 'voices') {
      const data = await getVoices(apiKey)
      return NextResponse.json({ success: true, voices: data.voices || [] })
    }

    if (action === 'user_info') {
      const data = await getUserInfo(apiKey)
      return NextResponse.json({
        success: true,
        charactersUsed: data.subscription?.character_count || 0,
        charactersLimit: data.subscription?.character_limit || 0,
        tier: data.subscription?.tier || 'free',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[/api/generate/voice GET]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
