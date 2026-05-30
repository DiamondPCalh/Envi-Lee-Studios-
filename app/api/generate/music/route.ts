// app/api/generate/music/route.ts
// Handles all music generation — lyrics, hooks, viral songs, voice scripts, artist dev, cover art, music video

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, ...params } = body

    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const prompts: Record<string, string> = {
      lyrics: `You are a professional hit songwriter. Write complete, polished song lyrics.

Topic: ${params.topic || 'empowerment and success'}
Mood: ${params.mood || 'confident and powerful'}
Genre: ${params.genre || 'R&B / Soul'}
Style: ${params.style || 'modern R&B'}
Point of view: ${params.pov || 'first person female'}

Write a complete song with:
[Verse 1] — 8-12 lines, storytelling and scene setting
[Pre-Chorus] — 4 lines building toward the hook
[Chorus] — 6-8 lines, the main hook, catchy and memorable, meant to be repeated
[Verse 2] — 8-12 lines, deeper story, building on verse 1
[Pre-Chorus]
[Chorus]
[Bridge] — 6-8 lines, contrasting moment, emotional depth
[Chorus]
[Outro] — 4-6 lines, closing statement

Make every line count. No filler lyrics. This should feel like a real hit record.`,

      hooks: `You are a hit songwriter known for writing viral, unforgettable hooks.

Concept: ${params.concept || 'empowerment and winning'}
Vibe: ${params.vibe || 'catchy and viral'}
Genre: ${params.genre || 'R&B / Pop'}

Write 5 different hook options for this song concept. Each hook should be:
- 2-4 lines maximum
- Immediately memorable and singable
- Have a strong title word or phrase
- Feel authentic, not generic

For each hook include:
- The hook lyrics
- Why it works
- The title it suggests

Make these feel like real chart-worthy hooks.`,

      assistant: `You are a professional co-writer helping a songwriter who is stuck.

Their lyrics so far:
${params.lyrics || '(No lyrics provided yet)'}

What they need: ${params.stuck || 'help finishing'}

Provide exactly what they asked for. If they need a bridge, write a bridge. If they need a verse, write a verse. Match their style, rhyme scheme, and energy exactly. Keep their voice intact.

After writing the requested section, give 2 quick tips on making the full song stronger.`,

      viral: `You are a hit songwriter and music strategist who creates viral-ready songs.

Concept: ${params.concept || 'empowerment'}
Genre: ${params.genre || 'R&B / Pop'}
Mood: ${params.mood || 'confident'}
Artist style reference: ${params.artistStyle || 'modern R&B'}

Write a COMPLETE viral song including:
[Hook] — The most catchable 4-8 lines, designed to go viral
[Verse 1] — 8 lines storytelling
[Pre-Chorus] — 4 lines
[Chorus] — 8 lines (expanded hook)
[Verse 2] — 8 lines deeper story
[Pre-Chorus]
[Chorus]
[Bridge] — 6 lines emotional peak
[Final Chorus]
[Outro] — 4 lines

Then at the end write:
---SUNO PROMPT---
A detailed Suno AI generation prompt including: genre, tempo, instruments, mood, vocal style, and production references. Format it to paste directly into Suno.`,

      voicescript: `You are a professional voiceover scriptwriter.

Purpose: ${params.product || 'music introduction'}
Key notes: ${params.script || 'warm, confident, aspirational'}
Voice type: ${params.voice || 'female warm and confident'}

Write 3 voiceover script options:
1. SHORT (10-15 seconds) — quick and punchy
2. MEDIUM (30 seconds) — with story and hook
3. LONG (60 seconds) — full story arc

For each include:
- The script
- Tone direction for the voice artist
- Pacing notes (pause indicators)`,

      voiceclone: `You are an ElevenLabs expert helping someone clone their voice.

Voice description: ${params.voice || 'warm female voice, confident, melodic'}

Write a complete guide for:
1. How to record the best samples for cloning (3-5 minute guide)
2. What to say in the recording for best results (give them 10 practice sentences)
3. How to set up ElevenLabs Voice Clone
4. How to use the cloned voice for music intros, ads, and social content
5. Legal and ethical guidelines for voice cloning`,

      brand: `You are a music brand strategist for emerging AI artists.

Artist: ${params.artistName || 'New Artist'}
Genre: ${params.genre || 'R&B'}
Vibe: ${params.vibe || 'Luxury and mysterious'}
Platforms: ${params.platforms || 'TikTok, Instagram, Spotify'}

Create a complete artist brand identity:
1. Artist persona and positioning
2. Visual identity guide (colors, aesthetic, wardrobe direction)
3. Social media voice and tone
4. Content pillars (5 content themes)
5. Signature phrases or catchphrases
6. Bio for each platform
7. Branding don'ts — what to avoid`,

      marketing: `You are a music marketing strategist.

Artist: ${params.artistName || 'New Artist'}
Genre: ${params.genre || 'R&B'}
Platforms: ${params.platforms || 'TikTok, Instagram, Spotify'}

Create a complete music marketing plan:
1. Pre-release strategy (4 weeks before drop)
2. Release day strategy
3. Post-release momentum plan
4. TikTok content strategy (5 video ideas for the song)
5. Instagram content calendar for launch week
6. Playlist pitching strategy for Spotify
7. Press and blog outreach
8. Collaboration opportunities`,

      streaming: `You are a Spotify and streaming growth expert.

Artist: ${params.artistName || 'New Artist'}
Genre: ${params.genre || 'R&B'}
Goals: ${params.goals || 'Grow streams'}

Write a complete streaming growth strategy:
1. Spotify profile optimization (bio, artist pick, canvas videos)
2. Playlist submission strategy (editorial, algorithmic, curator)
3. How to trigger Spotify's algorithm (Discover Weekly, Release Radar)
4. Apple Music and Tidal tips
5. YouTube Music strategy
6. How to use DistroKid to maximize distribution
7. 90-day growth roadmap with specific milestones`,

      promo: `You are a music content strategist.

Artist: ${params.artistName || 'New Artist'}
Genre: ${params.genre || 'R&B'}
Vibe: ${params.vibe || 'Luxury'}
Platforms: ${params.platforms || 'TikTok, Instagram'}

Create 30 pieces of promo content for a music release:
- 10 TikTok video concepts
- 10 Instagram post concepts
- 5 Story concepts
- 3 YouTube/Reels ideas
- 2 Podcast pitch angles

For each include: concept, hook, and why it will perform.`,

      label: `You are a music industry executive helping an artist build their own record label.

Artist: ${params.artistName || 'New Artist'}
Genre: ${params.genre || 'R&B'}

Write a complete guide to building your own AI record label:
1. Business formation (LLC, DBA, bank account)
2. Label name and branding
3. How to sign artists (including yourself)
4. Distribution setup (DistroKid for Artists, TuneCore for Labels)
5. Royalty structure and splits
6. How to release music under your label
7. Building a roster of AI artists
8. Revenue streams for the label
9. How to pitch your label to sync licensing opportunities
10. 1-year label launch roadmap`,

      coverart: `You are a visual art director specializing in music cover art.

Artist: ${params.artistName || 'Artist'}
Song/Album: ${params.songTitle || 'New Release'}
Vibe: ${params.vibe || 'Luxury and powerful'}
Colors: ${params.colors || 'Black and gold'}
Style: ${params.style || 'Cinematic portrait'}

Generate:
1. A detailed AI image generation prompt for the cover art (ready to paste into Gemini or DALL-E)
2. Three cover art concept options with different visual directions
3. Typography recommendation (font style for the artist name and title)
4. Mood board description (3-5 reference aesthetics)
5. Variations for: Single cover, EP cover, Album cover, Merch graphic`,

      musicvideo: `You are a music video director for AI-generated content.

Song: ${params.songTitle || 'New Song'}
Genre: ${params.genre || 'R&B'}
Concept: ${params.concept || 'Artist rise to success'}

Create a complete AI music video production plan:

1. CONCEPT OVERVIEW — The visual story and its meaning

2. SCENE-BY-SCENE BREAKDOWN (8-12 scenes):
For each scene include:
- Scene number and song timestamp
- Location and setting
- What the artist is doing
- Camera angle and movement
- Mood and lighting
- AI video generation prompt (ready for Kling AI or Veo 3.1)

3. PRODUCTION NOTES:
- Color grade style
- Wardrobe direction
- Key visual motifs to repeat
- Transitions between scenes

4. EDITING GUIDE:
- Beat sync points
- When to cut vs. when to hold
- Text overlays if any`,
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
    console.error('[/api/generate/music]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
