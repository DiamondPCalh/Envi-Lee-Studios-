'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type Room = 'home' | 'birth' | 'dna' | 'assets' | 'memory' | 'world' | 'brand' | 'photoshoot' | 'movie' | 'scanner' | 'collab' | 'organizer' | 'blueprint'
type BirthMode = 'dream' | 'reference' | 'brainstorm' | null

interface Character {
  id: string; name: string; tagline: string; mode: string
  heroImage?: string; images: string[]
  physicalDNA: Record<string, string>; personalityDNA: Record<string, string>
  world: Record<string, string>; brand: Record<string, string>
  memories: Memory[]; assets: Asset[]; content: ContentItem[]
  createdAt: string; completion: number
}

interface Memory {
  id: string; date: string; event: string; location: string
  outfit: string; mood: string; people: string; milestone: boolean
}

interface Asset {
  id: string; type: string; name: string; imageUrl: string; tags: string[]
}

interface ContentItem {
  id: string; type: string; title: string; images: string[]
  folder: string; tags: string[]; createdAt: string; characterId: string
}

const css = `
  :root {
    --bg:#000;--bg2:#06000f;--bg3:#0d0020;--s1:#110030;--s2:#18004a;
    --w:#f0e8ff;--w2:#d4b8f8;--mu:#2a0060;--mu2:#4a0090;--mu3:#8a40c0;
    --violet:#6B21A8;--violet2:#A855F7;--violet3:#D8B4FE;
    --turq:#06B6D4;--turq2:#67E8F9;--gold:#D4A843;--gold2:#F5E0A0;
    --vb:rgba(107,33,168,0.35);--tb:rgba(6,182,212,0.35);
    --vg:rgba(107,33,168,0.08);--tg:rgba(6,182,212,0.08);
    --gg:rgba(212,168,67,0.08);--gb:rgba(212,168,67,0.3);
    --v-grad:linear-gradient(135deg,#6B21A8,#A855F7,#06B6D4);
    --g-grad:linear-gradient(135deg,#D4A843,#F5E0A0);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:var(--bg);color:var(--w);font-family:'DM Sans',sans-serif;min-height:100vh;}
  select,input,textarea{color-scheme:dark;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#2a0060;border-radius:2px;}
  @keyframes lbar{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes pgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(107,33,168,0.2)}50%{box-shadow:0 0 40px rgba(6,182,212,0.3)}}
  .pg-in{animation:pgIn .4s ease;}
  .lbar{height:2px;background:var(--s2);overflow:hidden;border-radius:1px;}
  .lbar-fill{height:100%;background:var(--v-grad);background-size:200% 100%;animation:lbar 2s linear infinite;}
  .card{background:var(--s1);border:0.5px solid rgba(107,33,168,0.2);border-radius:14px;padding:18px;}
  .card.hi{border-color:rgba(107,33,168,0.35);}
  .card.turq{border-color:rgba(6,182,212,0.25);background:var(--tg);}
  .card.gold{border-color:rgba(212,168,67,0.25);background:var(--gg);}
  .ftitle{font-family:'DM Mono',monospace;font-size:10px;font-weight:500;color:var(--violet2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px;padding-bottom:10px;border-bottom:0.5px solid rgba(107,33,168,0.15);}
  .flabel{font-size:9px;font-weight:600;color:var(--mu3);text-transform:uppercase;letter-spacing:.7px;font-family:'DM Mono',monospace;display:block;margin-bottom:5px;}
  .finp{background:var(--bg3);border:0.5px solid rgba(107,33,168,0.2);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:border-color .2s;}
  .finp:focus{border-color:rgba(107,33,168,0.5);}
  .fsel{background:var(--bg3);border:0.5px solid rgba(107,33,168,0.2);border-radius:7px;padding:8px 10px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;}
  .fta{background:var(--bg3);border:0.5px solid rgba(107,33,168,0.2);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--w);font-family:'DM Sans',sans-serif;width:100%;outline:none;resize:vertical;min-height:80px;line-height:1.6;}
  .v-btn{padding:11px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:var(--v-grad);color:#fff;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 0 20px rgba(107,33,168,0.25);}
  .v-btn:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(107,33,168,0.4);}
  .v-btn:disabled{opacity:0.5;cursor:default;transform:none;box-shadow:none;}
  .ghost-v{padding:7px 14px;border-radius:8px;font-size:11px;cursor:pointer;border:0.5px solid var(--vb);background:transparent;color:var(--violet2);font-family:'DM Sans',sans-serif;transition:all .2s;}
  .ghost-v:hover{background:var(--vg);}
  .ghost-t{padding:7px 14px;border-radius:8px;font-size:11px;cursor:pointer;border:0.5px solid var(--tb);background:transparent;color:var(--turq);font-family:'DM Sans',sans-serif;transition:all .2s;}
  .ghost-t:hover{background:var(--tg);}
  .tag-v{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--vg);color:var(--violet2);border:0.5px solid var(--vb);}
  .tag-t{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--tg);color:var(--turq);border:0.5px solid var(--tb);}
  .tag-g{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-family:'DM Mono',monospace;background:var(--gg);color:var(--gold);border:0.5px solid var(--gb);}
  .mode-card{border-radius:16px;padding:28px;cursor:pointer;transition:all .3s;border:1.5px solid transparent;position:relative;overflow:hidden;}
  .mode-card:hover{transform:translateY(-4px);}
  .mode-card.dream{background:linear-gradient(135deg,#0d0020,#1a0040);border-color:rgba(107,33,168,0.4);}
  .mode-card.dream:hover{border-color:rgba(107,33,168,0.8);box-shadow:0 0 40px rgba(107,33,168,0.2);}
  .mode-card.reference{background:linear-gradient(135deg,#001520,#003040);border-color:rgba(6,182,212,0.3);}
  .mode-card.reference:hover{border-color:rgba(6,182,212,0.7);box-shadow:0 0 40px rgba(6,182,212,0.2);}
  .mode-card.brainstorm{background:linear-gradient(135deg,#120010,#280030);border-color:rgba(212,168,67,0.3);}
  .mode-card.brainstorm:hover{border-color:rgba(212,168,67,0.7);box-shadow:0 0 40px rgba(212,168,67,0.2);}
  .char-card{background:var(--s1);border:0.5px solid rgba(107,33,168,0.2);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .25s;}
  .char-card:hover{border-color:rgba(6,182,212,0.5);box-shadow:0 8px 32px rgba(107,33,168,0.2);}
  .char-card.active{border-color:rgba(6,182,212,0.6);background:rgba(6,182,212,0.04);}
  .step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;}
  .step-dot.done{background:rgba(6,182,212,0.2);color:var(--turq);border:0.5px solid var(--tb);}
  .step-dot.active{background:var(--v-grad);color:#fff;}
  .step-dot.pending{background:var(--s2);color:var(--mu3);}
  .image-slot{background:var(--bg3);border:0.5px solid rgba(107,33,168,0.15);border-radius:10px;overflow:hidden;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;position:relative;}
  .image-slot img{width:100%;height:100%;object-fit:cover;}
`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label className="flabel">{label}</label>
      {children}
    </div>
  )
}

function AccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  useEffect(() => {
    async function check() {
      if (!user) { setHasAccess(false); return }
      try {
        const res = await fetch(`/api/access/realism?userId=${user.id}`)
        const data = await res.json()
        setHasAccess(data.hasAccess)
      } catch { setHasAccess(false) }
    }
    check()
  }, [user])
  if (hasAccess === null) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div className="lbar" style={{ width:'120px' }}><div className="lbar-fill" /></div></div>
  if (!hasAccess) return (
    <div style={{ maxWidth:'560px',margin:'80px auto',padding:'0 20px',textAlign:'center' }}>
      <div style={{ background:'var(--s1)',border:'0.5px solid rgba(107,33,168,0.3)',borderRadius:'20px',padding:'40px 32px' }}>
        <div style={{ fontSize:'48px',marginBottom:'16px' }}>◈</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',fontWeight:400,color:'var(--w)',marginBottom:'8px' }}>Identity Blueprint <span style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>Vault™</span></div>
        <div style={{ fontSize:'13px',color:'var(--mu3)',lineHeight:'1.7',marginBottom:'24px' }}>Available to Envi Lee Academy students only.</div>
        <a href="/sign-in?redirect_url=/identity" style={{ display:'inline-block',padding:'12px 28px',borderRadius:'10px',background:'var(--v-grad)',color:'#fff',fontSize:'13px',fontWeight:700,textDecoration:'none' }}>Sign In to Access →</a>
      </div>
    </div>
  )
  return <>{children}</>
}

function BirthChamber({ onCharacterCreated }: { onCharacterCreated: (c: Character) => void }) {
  const { user } = useUser()
  const [mode, setMode] = useState<BirthMode>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<Partial<Character> | null>(null)
  const [images, setImages] = useState<(string | null)[]>([null,null,null,null])
  const [dreamPrompt, setDreamPrompt] = useState('')
  const [dreamAnswers, setDreamAnswers] = useState<Record<string, string>>({})
  const [brainstormAnswers, setBrainstormAnswers] = useState<Record<string, string>>({})
  const [refImages, setRefImages] = useState<string[]>([])
  const [refType, setRefType] = useState<'existing' | 'new'>('existing')
  const fileRef = useRef<HTMLInputElement>(null)

  const dreamQ = [
    { key:'decade', q:"What decade does she feel like?" },
    { key:'emotion', q:"What's her emotional energy?" },
    { key:'neverwear', q:"One thing she would NEVER wear?" },
    { key:'voice', q:"What does her voice sound like?" },
    { key:'secret', q:"What is her biggest secret?" },
  ]

  const brainstormQ = [
    { key:'decade', q:'What decade inspires you?', options:['1920s','1950s','1970s','1980s','1990s','Y2K','Now','Future'] },
    { key:'fashionera', q:'Fashion era?', options:['Old Hollywood','Disco','Streetwear','Haute Couture','Quiet Luxury','Futuristic'] },
    { key:'color', q:'What colors speak to you?', options:['Black & Gold','White & Cream','Purple & Violet','Red & Bold','Earth Tones','Neon & Electric'] },
    { key:'gemstone', q:'What gemstone is she?', options:['Diamond','Emerald','Ruby','Sapphire','Amethyst','Pearl','Black Onyx'] },
    { key:'flower', q:'What flower is she?', options:['Black Rose','Orchid','Dahlia','Peony','Lily','Calla Lily'] },
    { key:'fabric', q:'What fabric is she?', options:['Silk','Leather','Cashmere','Velvet','Lace','Latex'] },
    { key:'country', q:'What country does she belong to?', options:['Italy','France','Japan','Dubai/UAE','USA','UK','Brazil','Nigeria'] },
    { key:'weather', q:'Her city weather?', options:['Eternal summer','Golden fall','Snowy luxury','Rainy mystery','Desert heat','Mediterranean perfect'] },
    { key:'animal', q:'What animal is she?', options:['Panther','Lioness','Swan','Fox','Serpent','Eagle','Butterfly'] },
    { key:'energy', q:'What energy does she carry?', options:['Old money quiet','New money loud','Mysterious unseen','Powerfully visible','Soft dangerous','Chaotically beautiful'] },
    { key:'empire', q:"Her empire is built on?", options:['Fashion & Beauty','Entertainment & Film','Tech & Business','Music & Art','Luxury Lifestyle','Fitness & Wellness'] },
    { key:'music', q:'Music that plays when she enters?', options:['Dark R&B & trap','Afrobeats','Classical & opera','Pop & infectious','Jazz & sophistication','Hip-hop & confidence'] },
  ]

  async function generateCharacter() {
    setLoading(true); setImages([null,null,null,null])
    try {
      let contextPrompt = ''
      if (mode === 'dream') contextPrompt = `Concept: "${dreamPrompt}". Details: ${Object.entries(dreamAnswers).map(([k,v])=>`${k}: ${v}`).join(', ')}`
      else if (mode === 'brainstorm') contextPrompt = `Elements: ${Object.entries(brainstormAnswers).map(([k,v])=>`${k}: ${v}`).join(', ')}. Make her completely original.`
      else contextPrompt = `Create an original AI character ${refType === 'existing' ? 'maintaining the exact face from uploaded reference photos' : 'inspired by the aesthetic of uploaded references'}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 1000,
          messages: [{ role:'user', content:`Create a complete AI celebrity for Envi Lee Identity Blueprint Vault™. ${contextPrompt}

Return ONLY valid JSON:
{
  "name": "Her full name",
  "tagline": "Her signature tagline max 10 words",
  "age": "26",
  "origin": "City, Country",
  "niche": "Her content niche",
  "backstory": "2-3 sentence origin story",
  "physicalDNA": {
    "skinTone": "Deep brown with warm golden undertones",
    "hairType": "Natural 4C coils, shoulder length",
    "hairColor": "Jet black",
    "eyeColor": "Deep dark brown",
    "bodyType": "Curvy hourglass 5ft7",
    "features": "High cheekbones, full lips, beauty mark above left brow",
    "nails": "Long almond, deep burgundy",
    "style": "Luxury streetwear meets old money"
  },
  "personalityDNA": {
    "energy": "Magnetic quiet confidence",
    "loveLanguage": "Acts of service",
    "coffeeOrder": "Oat milk lavender latte extra shot",
    "favoriteCity": "Milan in spring",
    "luxuryBrand": "Bottega Veneta",
    "petPeeve": "Performative people",
    "secretTalent": "Speaks three languages"
  },
  "imagePrompt": "Ultra realistic portrait Black woman, [detailed physical description], natural skin texture visible pores, shot on Sony A7R IV 85mm f1.4, golden hour natural light, RAW photo no filter"
}` }],
        }),
      })
      const d = await res.json()
      const text = d.content?.[0]?.text || '{}'
      const char = JSON.parse(text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim())

      const newChar: Partial<Character> = {
        id: Date.now().toString(), name: char.name, tagline: char.tagline, mode: mode || 'dream',
        physicalDNA: { ...char.physicalDNA, age: char.age, origin: char.origin, niche: char.niche, backstory: char.backstory },
        personalityDNA: char.personalityDNA, images: [], world: {}, brand: {},
        memories: [], assets: [], content: [], createdAt: new Date().toISOString(), completion: 15,
      }
      setGenerated(newChar)

      const imgPrompt = char.imagePrompt || `${char.name} ultra realistic portrait, ${char.physicalDNA?.skinTone}, ${char.physicalDNA?.hairType}, Sony A7R IV 85mm RAW`
      const angles = [', ultra close portrait', ', full body editorial fashion', ', lifestyle candid moment', ', cinematic hero shot']
      for (let i = 0; i < 4; i++) {
        try {
          const imgRes = await fetch('/api/generate/image', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ prompt: imgPrompt + angles[i], style:'cinematic', size:'portrait' }),
          })
          const imgData = await imgRes.json()
          if (imgData.imageUrl) setImages(prev => prev.map((img,idx) => idx === i ? imgData.imageUrl : img))
        } catch (e) { console.error(e) }
        if (i < 3) await new Promise(r => setTimeout(r, 1000))
      }
      setStep(3)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function saveCharacter() {
    if (!generated) return
    const imgs = images.filter(Boolean) as string[]
    const finalChar: Character = { ...generated as Character, heroImage: imgs[0], images: imgs, completion: 20 }
    const saved = JSON.parse(localStorage.getItem(`characters_${user?.id}`) || '[]')
    saved.unshift(finalChar)
    localStorage.setItem(`characters_${user?.id}`, JSON.stringify(saved))
    onCharacterCreated(finalChar)
  }

  function handleRefUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files || []).forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setRefImages(prev => [...prev, ev.target?.result as string].slice(0,20))
      reader.readAsDataURL(f)
    })
  }

  if (!mode) return (
    <div className="pg-in">
      <div style={{ marginBottom:'32px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(107,33,168,0.5)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px' }}>Birth Chamber</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'36px',fontWeight:400,color:'var(--w)',marginBottom:'8px' }}>How will you <span style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>create her?</span></div>
        <div style={{ fontSize:'13px',color:'var(--mu3)',maxWidth:'500px',lineHeight:'1.7' }}>Choose your creation mode. Each produces someone completely original.</div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'16px' }}>
        {[
          { id:'dream', icon:'🌙', name:'Dream Mode', desc:'Type one thought. AI builds everything from scratch. No references. 100% from your imagination.', hint:'→ Pure imagination', color:'var(--violet3)' },
          { id:'reference', icon:'📸', name:'Reference Mode', desc:'Upload your existing AI twin or inspiration images. App locks their identity or creates someone new.', hint:'→ Upload & lock', color:'var(--turq2)' },
          { id:'brainstorm', icon:'💭', name:'Brainstorm Mode', desc:'Answer creative questions. AI invents someone nobody has ever seen from your unique combination.', hint:'→ Question-driven', color:'var(--gold2)' },
        ].map(m => (
          <div key={m.id} className={`mode-card ${m.id}`} onClick={() => { setMode(m.id as BirthMode); setStep(1) }}>
            <div style={{ fontSize:'36px',marginBottom:'14px',animation:'float 3s ease infinite' }}>{m.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'20px',fontWeight:800,color:m.color,marginBottom:'6px' }}>{m.name}</div>
            <div style={{ fontSize:'12px',color:'var(--mu3)',lineHeight:'1.7',marginBottom:'14px' }}>{m.desc}</div>
            <div style={{ fontSize:'11px',color:m.color,fontFamily:"'DM Mono',monospace" }}>{m.hint}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ display:'flex',alignItems:'center',gap:'16px',marginBottom:'28px' }}>
        <button className="ghost-v" onClick={() => { setMode(null); setStep(1); setGenerated(null); setImages([null,null,null,null]) }}>← Back</button>
        <div style={{ display:'flex',gap:'8px',alignItems:'center' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <div className={`step-dot ${step > s ? 'done' : step === s ? 'active' : 'pending'}`}>{step > s ? '✓' : s}</div>
              {s < 3 && <div style={{ width:'20px',height:'1px',background:step > s ? 'var(--turq)' : 'var(--mu2)' }} />}
            </div>
          ))}
          <div style={{ fontSize:'11px',color:'var(--mu3)',marginLeft:'8px',fontFamily:"'DM Mono',monospace" }}>{step===1?'Setup':step===2?'Generate':'Review'}</div>
        </div>
      </div>

      {/* DREAM MODE STEP 1 */}
      {mode === 'dream' && step === 1 && (
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--w)',marginBottom:'20px' }}>🌙 Dream Mode</div>
          <div className="card hi" style={{ marginBottom:'16px' }}>
            <F label="Describe her in one sentence">
              <textarea className="fta" style={{ minHeight:'80px' }} placeholder="e.g. I want a mysterious luxury fashion designer who lives between Paris and Dubai..." value={dreamPrompt} onChange={e => setDreamPrompt(e.target.value)} />
            </F>
          </div>
          {dreamPrompt.trim() && (
            <div className="card hi" style={{ marginBottom:'20px' }}>
              <div className="ftitle">5 Quick Questions</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                {dreamQ.map(q => (
                  <F key={q.key} label={q.q}>
                    <input className="finp" placeholder="Your answer..." value={dreamAnswers[q.key]||''} onChange={e => setDreamAnswers(prev=>({...prev,[q.key]:e.target.value}))} />
                  </F>
                ))}
              </div>
            </div>
          )}
          {dreamPrompt.trim() && <button className="v-btn" onClick={() => setStep(2)}>Continue → Generate Her →</button>}
        </div>
      )}

      {/* REFERENCE MODE STEP 1 */}
      {mode === 'reference' && step === 1 && (
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--w)',marginBottom:'20px' }}>📸 Reference Mode</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'20px' }}>
            {[
              { type:'existing',label:'My Existing AI Twin',desc:'Upload your AI twin photos — app maintains their exact face and identity',color:'var(--violet2)' },
              { type:'new',label:'Inspiration Only',desc:'Upload mood board images — app creates someone original inspired by the aesthetic',color:'var(--turq)' },
            ].map(opt => (
              <div key={opt.type} onClick={() => setRefType(opt.type as 'existing'|'new')}
                style={{ padding:'18px',borderRadius:'12px',border:`1.5px solid ${refType===opt.type?(opt.type==='existing'?'var(--vb)':'var(--tb)'):'rgba(107,33,168,0.1)'}`,background:refType===opt.type?(opt.type==='existing'?'var(--vg)':'var(--tg)'):'var(--s1)',cursor:'pointer',transition:'all .2s' }}>
                <div style={{ fontSize:'14px',fontWeight:700,color:opt.color,marginBottom:'6px' }}>{opt.label}</div>
                <div style={{ fontSize:'12px',color:'var(--mu3)',lineHeight:'1.5' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
          <div className="card hi" style={{ marginBottom:'20px' }}>
            <div className="ftitle">Upload Images (up to 20)</div>
            <div style={{ border:'1.5px dashed rgba(107,33,168,0.25)',borderRadius:'12px',padding:'24px',textAlign:'center',cursor:'pointer',background:'var(--vg)',marginBottom:'14px' }} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleRefUpload} />
              <div style={{ fontSize:'32px',marginBottom:'8px',opacity:0.5 }}>📸</div>
              <div style={{ fontSize:'13px',color:'var(--mu3)',marginBottom:'4px' }}>Click to upload your images</div>
              <div style={{ fontSize:'11px',color:'var(--mu2)' }}>Hair, outfits, locations, accessories — up to 20 images</div>
            </div>
            {refImages.length > 0 && (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))',gap:'8px' }}>
                {refImages.map((img,i) => (
                  <div key={i} style={{ aspectRatio:'1',borderRadius:'8px',overflow:'hidden',position:'relative' as const }}>
                    <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                    <button onClick={() => setRefImages(prev=>prev.filter((_,idx)=>idx!==i))} style={{ position:'absolute',top:'3px',right:'3px',width:'18px',height:'18px',borderRadius:'50%',background:'rgba(0,0,0,0.8)',color:'#fff',border:'none',cursor:'pointer',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {refImages.length > 0 && <button className="v-btn" onClick={() => setStep(2)}>Continue → Generate Her →</button>}
        </div>
      )}

      {/* BRAINSTORM MODE STEP 1 */}
      {mode === 'brainstorm' && step === 1 && (
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--w)',marginBottom:'20px' }}>💭 Brainstorm Mode</div>
          <div style={{ fontSize:'13px',color:'var(--mu3)',marginBottom:'24px' }}>Answer these questions — AI combines your answers to invent someone nobody has ever seen.</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'20px' }}>
            {brainstormQ.map(q => (
              <div key={q.key} className="card" style={{ padding:'14px' }}>
                <div style={{ fontSize:'12px',fontWeight:600,color:'var(--violet2)',marginBottom:'10px' }}>{q.q}</div>
                <div style={{ display:'flex',flexWrap:'wrap' as const,gap:'6px' }}>
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => setBrainstormAnswers(prev=>({...prev,[q.key]:opt}))}
                      style={{ padding:'5px 12px',borderRadius:'20px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:`0.5px solid ${brainstormAnswers[q.key]===opt?'var(--vb)':'rgba(107,33,168,0.1)'}`,background:brainstormAnswers[q.key]===opt?'var(--vg)':'transparent',color:brainstormAnswers[q.key]===opt?'var(--violet2)':'var(--mu3)',transition:'all .15s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:'12px',color:'var(--mu3)',marginBottom:'16px' }}>{Object.keys(brainstormAnswers).length}/{brainstormQ.length} answered</div>
          {Object.keys(brainstormAnswers).length >= 6 && <button className="v-btn" onClick={() => setStep(2)}>Continue → Invent Her →</button>}
        </div>
      )}

      {/* STEP 2 — GENERATE */}
      {step === 2 && (
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--w)',marginBottom:'20px' }}>Ready to bring her to life</div>
          <div className="card hi" style={{ padding:'32px',textAlign:'center',marginBottom:'24px' }}>
            <div style={{ fontSize:'48px',marginBottom:'12px',animation:'float 3s ease infinite' }}>✨</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'18px',fontWeight:700,color:'var(--w)',marginBottom:'16px' }}>What gets generated:</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',textAlign:'left',maxWidth:'400px',margin:'0 auto' }}>
              {['Full character name + tagline','Complete physical DNA','Complete personality DNA','Backstory + origin story','4 original images','Content niche + brand direction'].map(item => (
                <div key={item} style={{ display:'flex',gap:'7px',fontSize:'12px',color:'var(--w2)' }}>
                  <span style={{ color:'var(--violet2)' }}>✦</span>{item}
                </div>
              ))}
            </div>
          </div>
          <button className="v-btn" onClick={generateCharacter} disabled={loading} style={{ fontSize:'14px',padding:'14px 28px' }}>
            {loading ? '✦ Creating her universe…' : '✦ Generate My Character'}
          </button>
          {loading && <div className="lbar" style={{ marginTop:'14px' }}><div className="lbar-fill" /></div>}
        </div>
      )}

      {/* STEP 3 — REVIEW */}
      {step === 3 && generated && (
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'28px',color:'var(--w)',marginBottom:'4px' }}>
            Meet <span style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>{generated.name}</span>
          </div>
          <div style={{ fontSize:'13px',color:'var(--mu3)',marginBottom:'24px' }}>"{generated.tagline}"</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'24px' }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
              {images.map((img,i) => (
                <div key={i} className="image-slot" style={{ minHeight:'160px' }}>
                  {img ? <img src={img} alt="" /> : (
                    <div style={{ textAlign:'center',opacity:0.3 }}>
                      <div className="lbar" style={{ width:'40px',margin:'0 auto 6px' }}><div className="lbar-fill" /></div>
                      <div style={{ fontSize:'10px',color:'var(--mu3)' }}>Generating…</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <div className="card hi" style={{ marginBottom:'12px' }}>
                <div className="ftitle">Physical DNA</div>
                {Object.entries(generated.physicalDNA||{}).slice(0,6).map(([k,v]) => (
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'0.5px solid rgba(107,33,168,0.07)',fontSize:'12px' }}>
                    <span style={{ color:'var(--mu3)',textTransform:'capitalize' as const }}>{k}</span>
                    <span style={{ color:'var(--violet2)',textAlign:'right',maxWidth:'60%' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ftitle">Personality DNA</div>
                {Object.entries(generated.personalityDNA||{}).slice(0,4).map(([k,v]) => (
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'0.5px solid rgba(107,33,168,0.07)',fontSize:'12px' }}>
                    <span style={{ color:'var(--mu3)',textTransform:'capitalize' as const }}>{k}</span>
                    <span style={{ color:'var(--turq)',textAlign:'right',maxWidth:'60%' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:'10px' }}>
            <button className="v-btn" onClick={saveCharacter} style={{ flex:1,fontSize:'13px' }}>✦ Save to My Identity Vault →</button>
            <button className="ghost-v" onClick={() => { setStep(2); setGenerated(null); setImages([null,null,null,null]) }}>Regenerate</button>
          </div>
        </div>
      )}
    </div>
  )
}

function HomeDashboard({ characters, activeChar, setActiveChar, setRoom }: {
  characters: Character[]; activeChar: Character | null
  setActiveChar: (c: Character) => void; setRoom: (r: Room) => void
}) {
  const { user } = useUser()
  const pillars = [
    { room:'birth',icon:'✨',label:'Birth Chamber',desc:'Create a new character',color:'var(--violet2)' },
    { room:'dna',icon:'🧬',label:'Identity DNA™',desc:'Physical + personality profile',color:'var(--turq)' },
    { room:'assets',icon:'📁',label:'Asset Vault™',desc:'Your backgrounds, clothing, designs',color:'var(--gold)' },
    { room:'memory',icon:'🧠',label:'Memory Engine™',desc:'Log her life events',color:'var(--violet2)' },
    { room:'world',icon:'🌍',label:'World Builder™',desc:'Her universe of spaces & people',color:'var(--turq)' },
    { room:'brand',icon:'🎨',label:'Brand DNA™',desc:'Her complete visual identity',color:'var(--gold)' },
    { room:'photoshoot',icon:'📸',label:'Photoshoot Studio™',desc:'Generate consistent shoots',color:'var(--violet2)' },
    { room:'movie',icon:'🎬',label:'AI Movie Mode™',desc:'Netflix-style productions',color:'var(--turq)' },
    { room:'scanner',icon:'⭐',label:'Realism Scanner™',desc:'Analyze and improve images',color:'var(--gold)' },
    { room:'collab',icon:'🤝',label:'Collab World™',desc:'Create with other students',color:'var(--violet2)' },
    { room:'organizer',icon:'📊',label:'Content Organizer™',desc:'Manage all your content',color:'var(--turq)' },
    { room:'blueprint',icon:'📦',label:'Creator Blueprint™',desc:'Download your Digital Human Bible',color:'var(--gold)' },
  ] as const

  return (
    <div className="pg-in">
      <div style={{ marginBottom:'32px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(107,33,168,0.5)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px' }}>Identity Blueprint Vault™</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'40px',fontWeight:400,color:'var(--w)',marginBottom:'6px' }}>
          Welcome, <span style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>{user?.firstName||'Creator'}</span>
        </div>
        <div style={{ fontSize:'13px',color:'var(--mu3)' }}>Don't just create content. Build a world.</div>
      </div>

      {activeChar ? (
        <div style={{ background:'linear-gradient(135deg,rgba(107,33,168,0.08),rgba(6,182,212,0.06))',border:'0.5px solid rgba(107,33,168,0.25)',borderRadius:'20px',padding:'24px',marginBottom:'32px',display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'20px',alignItems:'center' }}>
          <div style={{ width:'80px',height:'80px',borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(107,33,168,0.4)',flexShrink:0 }}>
            {activeChar.heroImage ? <img src={activeChar.heroImage} alt={activeChar.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ width:'100%',height:'100%',background:'var(--v-grad)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px' }}>✦</div>}
          </div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'22px',fontWeight:800,color:'var(--w)',marginBottom:'3px' }}>{activeChar.name}</div>
            <div style={{ fontSize:'12px',color:'var(--mu3)',marginBottom:'10px' }}>"{activeChar.tagline}"</div>
            <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' as const }}>
              <span className="tag-v">{activeChar.mode} mode</span>
              <span className="tag-t">{activeChar.completion}% complete</span>
              <span className="tag-g">{activeChar.memories?.length||0} memories</span>
            </div>
          </div>
          <div style={{ display:'flex',flexDirection:'column' as const,gap:'8px' }}>
            <button className="v-btn" onClick={() => setRoom('photoshoot')} style={{ fontSize:'12px',padding:'9px 16px' }}>📸 Generate Photo</button>
            <button className="ghost-t" onClick={() => setRoom('memory')} style={{ fontSize:'12px' }}>+ Log Memory</button>
          </div>
        </div>
      ) : (
        <div style={{ background:'var(--vg)',border:'0.5px solid var(--vb)',borderRadius:'20px',padding:'40px',textAlign:'center',marginBottom:'32px',animation:'glow 4s ease infinite' }}>
          <div style={{ fontSize:'48px',marginBottom:'12px',animation:'float 3s ease infinite' }}>✨</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'26px',color:'var(--w)',marginBottom:'8px' }}>Your empire starts here</div>
          <div style={{ fontSize:'13px',color:'var(--mu3)',marginBottom:'20px' }}>Create your first AI celebrity and build her entire world</div>
          <button className="v-btn" onClick={() => setRoom('birth')} style={{ fontSize:'13px' }}>✨ Create My First Character →</button>
        </div>
      )}

      {characters.length > 0 && (
        <div style={{ marginBottom:'32px' }}>
          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(107,33,168,0.4)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'14px' }}>My Characters ({characters.length})</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px' }}>
            {characters.map(c => (
              <div key={c.id} className={`char-card ${activeChar?.id===c.id?'active':''}`} onClick={() => setActiveChar(c)}>
                <div style={{ height:'120px',overflow:'hidden',background:'var(--v-grad)' }}>
                  {c.heroImage ? <img src={c.heroImage} alt={c.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',opacity:0.4 }}>✦</div>}
                </div>
                <div style={{ padding:'12px' }}>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'14px',fontWeight:700,color:activeChar?.id===c.id?'var(--turq)':'var(--w)',marginBottom:'3px' }}>{c.name}</div>
                  <div style={{ fontSize:'11px',color:'var(--mu3)',marginBottom:'8px' }}>{c.physicalDNA?.niche||'AI Celebrity'}</div>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <span className="tag-v" style={{ fontSize:'9px' }}>{c.completion}%</span>
                    {activeChar?.id===c.id && <span className="tag-t" style={{ fontSize:'9px' }}>Active</span>}
                  </div>
                </div>
              </div>
            ))}
            <div className="char-card" onClick={() => setRoom('birth')} style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'180px',border:'1px dashed rgba(107,33,168,0.2)' }}>
              <div style={{ textAlign:'center',opacity:0.4 }}>
                <div style={{ fontSize:'28px',marginBottom:'8px' }}>+</div>
                <div style={{ fontSize:'12px',color:'var(--mu3)' }}>New Character</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:'10px',color:'rgba(107,33,168,0.4)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'14px' }}>Your Blueprint Pillars</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'10px' }}>
        {pillars.map(p => (
          <div key={p.room} className="card" style={{ cursor:'pointer',transition:'all .2s' }} onClick={() => setRoom(p.room as Room)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(107,33,168,0.4)'; (e.currentTarget as HTMLElement).style.background='rgba(107,33,168,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(107,33,168,0.2)'; (e.currentTarget as HTMLElement).style.background='var(--s1)' }}>
            <div style={{ fontSize:'22px',marginBottom:'8px' }}>{p.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:'13px',fontWeight:700,color:'var(--w)',marginBottom:'4px' }}>{p.label}</div>
            <div style={{ fontSize:'11px',color:'var(--mu3)',lineHeight:'1.4',marginBottom:'8px' }}>{p.desc}</div>
            <div style={{ fontSize:'10px',color:p.color,fontFamily:"'DM Mono',monospace" }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="pg-in" style={{ textAlign:'center',padding:'80px 20px' }}>
      <div style={{ fontSize:'56px',marginBottom:'16px',animation:'float 3s ease infinite' }}>{icon}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'32px',fontWeight:400,marginBottom:'8px' }}>
        <span style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>{label}</span>
      </div>
      <div style={{ fontSize:'13px',color:'var(--mu3)',marginBottom:'24px' }}>This pillar is being built. Complete Birth Chamber and Identity DNA first.</div>
      <span style={{ fontSize:'11px',padding:'6px 16px',background:'var(--vg)',border:'0.5px solid var(--vb)',borderRadius:'20px',color:'var(--violet2)',fontFamily:"'DM Mono',monospace" }}>Coming Soon</span>
    </div>
  )
}

const NAV = [
  { room:'home',icon:'◉',label:'Home' },
  { room:'birth',icon:'✨',label:'Birth Chamber' },
  { room:'dna',icon:'🧬',label:'Identity DNA™' },
  { room:'assets',icon:'📁',label:'Asset Vault™' },
  { room:'memory',icon:'🧠',label:'Memory Engine™' },
  { room:'world',icon:'🌍',label:'World Builder™' },
  { room:'brand',icon:'🎨',label:'Brand DNA™' },
  { room:'photoshoot',icon:'📸',label:'Photoshoot Studio™' },
  { room:'movie',icon:'🎬',label:'AI Movie Mode™' },
  { room:'scanner',icon:'⭐',label:'Realism Scanner™' },
  { room:'collab',icon:'🤝',label:'Collab World™' },
  { room:'organizer',icon:'📊',label:'Content Organizer™' },
  { room:'blueprint',icon:'📦',label:'Creator Blueprint™' },
] as const

export default function IdentityVaultPage() {
  const { user } = useUser()
  const router = useRouter()
  const [room, setRoom] = useState<Room>('home')
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeChar, setActiveChar] = useState<Character | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const saved = JSON.parse(localStorage.getItem(`characters_${user.id}`) || '[]')
    setCharacters(saved)
    if (saved.length > 0) setActiveChar(saved[0])
  }, [user])

  function onCharacterCreated(c: Character) {
    const updated = [c, ...characters.filter(ch => ch.id !== c.id)]
    setCharacters(updated)
    setActiveChar(c)
    localStorage.setItem(`characters_${user?.id}`, JSON.stringify(updated))
    setRoom('home')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <AccessGate>
          <div style={{ display:'flex',minHeight:'100vh',background:'var(--bg)' }}>
            <aside style={{ width:'225px',background:'var(--bg2)',borderRight:'0.5px solid rgba(107,33,168,0.12)',flexShrink:0,height:'100vh',position:'sticky',top:0,overflowY:'auto',display:'flex',flexDirection:'column' }}>
              <div style={{ padding:'16px 14px',borderBottom:'0.5px solid rgba(107,33,168,0.1)' }}>
                <button onClick={() => router.push('/')} style={{ background:'none',border:'none',cursor:'pointer',marginBottom:'10px',padding:0 }}>
                  <span style={{ fontSize:'10px',color:'var(--mu2)',fontFamily:"'DM Mono',monospace" }}>← Empire</span>
                </button>
                <div style={{ padding:'14px',background:'rgba(107,33,168,0.08)',border:'0.5px solid rgba(107,33,168,0.25)',borderRadius:'12px',textAlign:'center' }}>
                  <div style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontFamily:"'Syne',sans-serif",fontSize:'11px',fontWeight:800,lineHeight:1.4 }}>Identity Blueprint</div>
                  <div style={{ background:'var(--v-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontFamily:"'Syne',sans-serif",fontSize:'11px',fontWeight:800,lineHeight:1.4 }}>Vault™</div>
                  <div style={{ fontSize:'9px',color:'rgba(107,33,168,0.5)',fontFamily:"'DM Mono',monospace",marginTop:'3px' }}>Envi Lee</div>
                </div>
              </div>

              {activeChar && (
                <div style={{ padding:'10px 14px',borderBottom:'0.5px solid rgba(107,33,168,0.08)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',background:'rgba(107,33,168,0.06)',borderRadius:'8px',border:'0.5px solid rgba(107,33,168,0.2)' }}>
                    <div style={{ width:'28px',height:'28px',borderRadius:'50%',overflow:'hidden',flexShrink:0,border:'1px solid rgba(107,33,168,0.3)' }}>
                      {activeChar.heroImage ? <img src={activeChar.heroImage} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ width:'100%',height:'100%',background:'var(--v-grad)' }} />}
                    </div>
                    <div style={{ flex:1,overflow:'hidden' }}>
                      <div style={{ fontSize:'11px',fontWeight:600,color:'var(--w)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const }}>{activeChar.name}</div>
                      <div style={{ fontSize:'9px',color:'rgba(107,33,168,0.5)',fontFamily:"'DM Mono',monospace" }}>{activeChar.completion}% complete</div>
                    </div>
                    <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width:'22px',height:'22px' } } }} />
                  </div>
                </div>
              )}

              <div style={{ padding:'10px',flex:1,overflowY:'auto' }}>
                {NAV.map(({ room:r, icon, label }) => (
                  <button key={r} onClick={() => setRoom(r as Room)}
                    onMouseEnter={() => setHovered(r)} onMouseLeave={() => setHovered(null)}
                    style={{ display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',borderRadius:'8px',cursor:'pointer',fontSize:'11px',border:`0.5px solid ${room===r?'rgba(107,33,168,0.35)':'transparent'}`,background:room===r?'rgba(107,33,168,0.08)':hovered===r?'rgba(107,33,168,0.03)':'none',color:room===r?'var(--violet2)':hovered===r?'var(--w)':'var(--mu3)',width:'100%',textAlign:'left',fontFamily:"'DM Sans',sans-serif",transition:'all .15s',marginBottom:'2px' }}>
                    <span style={{ fontSize:'14px',flexShrink:0 }}>{icon}</span>
                    <span style={{ flex:1 }}>{label}</span>
                  </button>
                ))}
              </div>

              <div style={{ padding:'10px 14px',borderTop:'0.5px solid rgba(107,33,168,0.08)',fontSize:'10px',color:'rgba(107,33,168,0.35)',fontFamily:"'DM Mono',monospace",textAlign:'center',lineHeight:'1.6' }}>
                Sister app to<br />Realism Studio™
              </div>
            </aside>

            <main style={{ flex:1,overflowY:'auto',padding:'28px',background:'radial-gradient(ellipse at 70% 0%,rgba(107,33,168,0.05) 0%,transparent 50%)' }}>
              {room==='home' && <HomeDashboard characters={characters} activeChar={activeChar} setActiveChar={setActiveChar} setRoom={setRoom} />}
              {room==='birth' && <BirthChamber onCharacterCreated={onCharacterCreated} />}
              {room!=='home' && room!=='birth' && <ComingSoon label={NAV.find(n=>n.room===room)?.label||''} icon={NAV.find(n=>n.room===room)?.icon||'◈'} />}
            </main>
          </div>
        </AccessGate>
      </SignedIn>
    </>
  )
}
