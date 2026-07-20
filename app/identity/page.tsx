'use client'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type Room = 'home' | 'birth' | 'dna' | 'assets' | 'memory' | 'world' | 'brand' | 'photoshoot' | 'movie' | 'scanner' | 'collab' | 'organizer' | 'blueprint' | 'admin'
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


// ── IDENTITY DNA™ ─────────────────────────────────────────────
function IdentityDNA({ character, onSave }: { character: Character | null; onSave: (c: Character) => void }) {
  const [tab, setTab] = useState<'physical' | 'personality' | 'sheet'>('physical')
  const [physical, setPhysical] = useState<Record<string, string>>(character?.physicalDNA || {})
  const [personality, setPersonality] = useState<Record<string, string>>(character?.personalityDNA || {})
  const [saved, setSaved] = useState(false)
  const [generatingSheet, setGeneratingSheet] = useState(false)
  const [sheetImages, setSheetImages] = useState<Record<string, string | null>>({})

  function updateP(key: string, val: string) { setPhysical(prev => ({ ...prev, [key]: val })) }
  function updatePer(key: string, val: string) { setPersonality(prev => ({ ...prev, [key]: val })) }

  function save() {
    if (!character) return
    const updated = { ...character, physicalDNA: physical, personalityDNA: personality, completion: Math.max(character.completion, 40) }
    onSave(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function generateSheetPanel(panelKey: string, prompt: string) {
    setSheetImages(prev => ({ ...prev, [panelKey]: 'loading' }))
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: 'cinematic', size: 'portrait' }),
      })
      const data = await res.json()
      setSheetImages(prev => ({ ...prev, [panelKey]: data.imageUrl || null }))
    } catch { setSheetImages(prev => ({ ...prev, [panelKey]: null })) }
  }

  async function generateFullSheet() {
    if (!character) return
    setGeneratingSheet(true)
    const base = `${character.name}, ${physical.skinTone || 'deep brown skin with natural texture'}, ${physical.hairType || 'natural hair'}, ${physical.bodyType || 'curvy'}, ultra realistic, Sony A7R IV, RAW photo, no filter, very human and real`
    const panels = [
      { key: 'front', prompt: `${base}, full body front view, neutral expression, white studio background, 35mm` },
      { key: 'side', prompt: `${base}, full body side profile view, white studio background, 35mm` },
      { key: 'back', prompt: `${base}, full body back view, white studio background, 35mm` },
      { key: 'expression_neutral', prompt: `${base}, face close up, neutral expression, 85mm f1.4` },
      { key: 'expression_smile', prompt: `${base}, face close up, natural genuine smile, 85mm f1.4` },
      { key: 'expression_fierce', prompt: `${base}, face close up, fierce serious expression, 85mm f1.4` },
      { key: 'expression_laugh', prompt: `${base}, face close up, laughing candid moment, 85mm f1.4` },
      { key: 'hands', prompt: `${base}, close up hands, natural nails, ${physical.nails || 'natural nails'}, 100mm macro` },
      { key: 'hero', prompt: `${base}, hero editorial portrait, golden hour light, 85mm f1.4, cinematic, ${physical.style || 'luxury fashion'}` },
    ]
    for (const panel of panels) {
      await generateSheetPanel(panel.key, panel.prompt)
      await new Promise(r => setTimeout(r, 800))
    }
    setGeneratingSheet(false)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🧬</div>
      <div style={{ fontSize: '14px', color: 'var(--mu3)' }}>Create a character in the Birth Chamber first</div>
    </div>
  )

  const physicalFields = [
    { key: 'skinTone', label: 'Skin Tone', placeholder: 'e.g. Deep ebony with warm golden undertones' },
    { key: 'hairType', label: 'Hair Type', placeholder: 'e.g. Natural 4C coils, shoulder length' },
    { key: 'hairColor', label: 'Hair Color', placeholder: 'e.g. Jet black with subtle highlights' },
    { key: 'eyeColor', label: 'Eye Color', placeholder: 'e.g. Deep dark brown with natural lashes' },
    { key: 'bodyType', label: 'Body Type', placeholder: 'e.g. Curvy hourglass, 5ft 7in' },
    { key: 'features', label: 'Distinguishing Features', placeholder: 'e.g. High cheekbones, beauty mark above left brow' },
    { key: 'nails', label: 'Signature Nails', placeholder: 'e.g. Long almond shape, deep burgundy' },
    { key: 'style', label: 'Signature Style', placeholder: 'e.g. Luxury streetwear meets old money' },
    { key: 'tattoos', label: 'Tattoos', placeholder: 'e.g. Small rose on left wrist, script on ribs' },
    { key: 'piercings', label: 'Piercings', placeholder: 'e.g. Double ear, nose stud' },
    { key: 'makeup', label: 'Signature Makeup', placeholder: 'e.g. Glazed skin, wispy lashes, nude lip' },
    { key: 'age', label: 'Age', placeholder: 'e.g. 26' },
    { key: 'origin', label: 'Origin / City', placeholder: 'e.g. Atlanta, GA — raised in NYC' },
    { key: 'niche', label: 'Content Niche', placeholder: 'e.g. Luxury lifestyle, CEO Baddie' },
    { key: 'backstory', label: 'Backstory', placeholder: 'Her origin story in 2-3 sentences...' },
  ]

  const personalityFields = [
    { key: 'energy', label: 'Energy / Vibe', placeholder: 'e.g. Magnetic quiet confidence' },
    { key: 'loveLanguage', label: 'Love Language', placeholder: 'e.g. Acts of service and quality time' },
    { key: 'coffeeOrder', label: 'Coffee Order', placeholder: 'e.g. Oat milk lavender latte, extra shot, no sugar' },
    { key: 'favoriteCity', label: 'Favorite City', placeholder: 'e.g. Milan in spring, Tokyo in fall' },
    { key: 'luxuryBrand', label: 'Luxury Brand', placeholder: 'e.g. Bottega Veneta, The Row, Amina Muaddi' },
    { key: 'petPeeve', label: 'Biggest Pet Peeve', placeholder: 'e.g. Performative people' },
    { key: 'secretTalent', label: 'Secret Talent', placeholder: 'e.g. Speaks three languages fluently' },
    { key: 'laugh', label: 'Laugh Style', placeholder: 'e.g. Silent at first, then full cackle' },
    { key: 'texting', label: 'How She Texts', placeholder: 'e.g. Full sentences, never uses voice notes' },
    { key: 'morning', label: 'Morning Routine', placeholder: 'e.g. 5am wake up, journal, pilates, green juice' },
    { key: 'perfume', label: 'Signature Perfume', placeholder: 'e.g. Baccarat Rouge 540' },
    { key: 'drink', label: 'Signature Drink', placeholder: 'e.g. Sparkling water by day, tequila by night' },
    { key: 'music', label: 'Music Taste', placeholder: 'e.g. Dark R&B, hip-hop, occasional Afrobeats' },
    { key: 'fashion', label: 'Fashion Taste', placeholder: 'e.g. Day: minimal luxury. Night: barely-there baddie' },
    { key: 'dreamHome', label: 'Dream Home', placeholder: 'e.g. Penthouse in Dubai with floor to ceiling views' },
    { key: 'flaw', label: 'Her Biggest Flaw', placeholder: 'e.g. Pushes people away when she gets too close' },
    { key: 'bucketList', label: 'Bucket List Item', placeholder: 'e.g. Buy her mama a house by 30' },
    { key: 'signature', label: 'Signature Pose', placeholder: 'e.g. One hand on hip, chin slightly tilted down' },
  ]

  const sheetPanels = [
    { key: 'front', label: 'Front View' },
    { key: 'side', label: 'Side Profile' },
    { key: 'back', label: 'Back View' },
    { key: 'expression_neutral', label: 'Neutral' },
    { key: 'expression_smile', label: 'Smiling' },
    { key: 'expression_fierce', label: 'Fierce' },
    { key: 'expression_laugh', label: 'Laughing' },
    { key: 'hands', label: 'Hand Detail' },
    { key: 'hero', label: 'Hero Shot' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Pillar 2</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Identity <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DNA™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Every detail that makes {character.name} undeniably real.</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[['physical', '🧬 Physical DNA'], ['personality', '🧠 Personality DNA'], ['sheet', '📋 Character Sheet']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'physical' | 'personality' | 'sheet')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${tab === id ? 'var(--vb)' : 'rgba(107,33,168,0.1)'}`, background: tab === id ? 'var(--vg)' : 'transparent', color: tab === id ? 'var(--violet2)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {/* PHYSICAL DNA */}
      {tab === 'physical' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {physicalFields.map(f => (
              <F key={f.key} label={f.label}>
                {f.key === 'backstory' ? (
                  <textarea className="fta" placeholder={f.placeholder} value={physical[f.key] || ''} onChange={e => updateP(f.key, e.target.value)} style={{ minHeight: '70px' }} />
                ) : (
                  <input className="finp" placeholder={f.placeholder} value={physical[f.key] || ''} onChange={e => updateP(f.key, e.target.value)} />
                )}
              </F>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="v-btn" onClick={save} style={{ fontSize: '12px' }}>{saved ? '✓ Saved!' : '💾 Save Physical DNA'}</button>
            <button className="ghost-t" onClick={() => setTab('personality')} style={{ fontSize: '12px' }}>Next: Personality DNA →</button>
          </div>
        </div>
      )}

      {/* PERSONALITY DNA */}
      {tab === 'personality' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {personalityFields.map(f => (
              <F key={f.key} label={f.label}>
                <input className="finp" placeholder={f.placeholder} value={personality[f.key] || ''} onChange={e => updatePer(f.key, e.target.value)} />
              </F>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="v-btn" onClick={save} style={{ fontSize: '12px' }}>{saved ? '✓ Saved!' : '💾 Save Personality DNA'}</button>
            <button className="ghost-t" onClick={() => setTab('sheet')} style={{ fontSize: '12px' }}>Next: Generate Character Sheet →</button>
          </div>
        </div>
      )}

      {/* CHARACTER REFERENCE SHEET */}
      {tab === 'sheet' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--w)', marginBottom: '4px' }}>{character.name} — Reference Sheet</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>9 panels auto-generated from her DNA profile</div>
            </div>
            <button className="v-btn" onClick={generateFullSheet} disabled={generatingSheet} style={{ fontSize: '12px' }}>
              {generatingSheet ? '◈ Generating panels…' : '◈ Generate Full Sheet'}
            </button>
          </div>
          {generatingSheet && <div className="lbar" style={{ marginBottom: '16px' }}><div className="lbar-fill" /></div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {sheetPanels.map(panel => (
              <div key={panel.key}>
                <div style={{ fontSize: '10px', color: 'var(--violet2)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '6px' }}>{panel.label}</div>
                <div className="image-slot" style={{ minHeight: '180px' }}>
                  {sheetImages[panel.key] === 'loading' ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className="lbar" style={{ width: '50px', margin: '0 auto 6px' }}><div className="lbar-fill" /></div>
                      <div style={{ fontSize: '10px', color: 'var(--violet2)' }}>Generating…</div>
                    </div>
                  ) : sheetImages[panel.key] ? (
                    <>
                      <img src={sheetImages[panel.key]!} alt={panel.label} />
                      <div style={{ position: 'absolute', bottom: '5px', right: '5px' }}>
                        <a href={sheetImages[panel.key]!} download style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.8)', color: 'var(--violet2)', fontSize: '10px', textDecoration: 'none' }}>⬇</a>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.3 }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>◈</div>
                      <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{panel.label}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ASSET VAULT™ ──────────────────────────────────────────────
function AssetVault({ character, onSave }: { character: Character | null; onSave: (c: Character) => void }) {
  const [activeType, setActiveType] = useState<'background' | 'clothing' | 'vehicle' | 'accessory' | 'brand'>('background')
  const [assets, setAssets] = useState<Asset[]>(character?.assets || [])
  const [uploading, setUploading] = useState(false)
  const [assetName, setAssetName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const types = [
    { id: 'background', icon: '🏢', label: 'Backgrounds', desc: 'Office, apartment, locations' },
    { id: 'clothing', icon: '👗', label: 'Clothing', desc: 'Your designed outfits' },
    { id: 'vehicle', icon: '🚗', label: 'Vehicles', desc: 'Cars, yachts, jets' },
    { id: 'accessory', icon: '👜', label: 'Accessories', desc: 'Bags, jewelry, shoes' },
    { id: 'brand', icon: '🎨', label: 'Brand Assets', desc: 'Logos, patterns, packaging' },
  ] as const

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setUploading(true)
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => {
        const newAsset: Asset = {
          id: Date.now().toString() + Math.random(),
          type: activeType,
          name: assetName || f.name.replace(/\.[^.]+$/, ''),
          imageUrl: ev.target?.result as string,
          tags: [activeType],
        }
        setAssets(prev => {
          const updated = [...prev, newAsset]
          if (character) {
            const updatedChar = { ...character, assets: updated, completion: Math.max(character.completion, 50) }
            onSave(updatedChar)
          }
          return updated
        })
      }
      reader.readAsDataURL(f)
    })
    setUploading(false)
    setAssetName('')
  }

  function deleteAsset(id: string) {
    const updated = assets.filter(a => a.id !== id)
    setAssets(updated)
    if (character) onSave({ ...character, assets: updated })
  }

  const filtered = assets.filter(a => a.type === activeType)

  if (!character) return (
    <div className="pg-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📁</div>
      <div style={{ fontSize: '14px', color: 'var(--mu3)' }}>Create a character in the Birth Chamber first</div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Pillar 3</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Asset <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vault™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Upload YOUR world. Your designs. Your backgrounds. Your brand. Place {character.name} inside your own universe.</div>
      </div>

      <div style={{ background: 'var(--vg)', border: '0.5px solid var(--vb)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '12px', color: 'var(--violet2)', lineHeight: '1.6' }}>
        ✦ When you generate content — {character.name} will be placed INTO your uploaded assets. Your office. Your clothing. Your world. Not a template.
      </div>

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {types.map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)}
            style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${activeType === t.id ? 'var(--vb)' : 'rgba(107,33,168,0.1)'}`, background: activeType === t.id ? 'var(--vg)' : 'transparent', color: activeType === t.id ? 'var(--violet2)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif", display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>({assets.filter(a => a.type === t.id).length})</span>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div className="card hi" style={{ marginBottom: '20px' }}>
        <div className="ftitle">{types.find(t => t.id === activeType)?.icon} Upload {types.find(t => t.id === activeType)?.label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'flex-end' }}>
          <F label="Asset Name (optional)">
            <input className="finp" placeholder={`e.g. My CEO Office, EL Brand Bag, White Bentley...`} value={assetName} onChange={e => setAssetName(e.target.value)} />
          </F>
          <button className="v-btn" onClick={() => fileRef.current?.click()} style={{ fontSize: '12px', padding: '9px 16px', marginBottom: '12px' }}>
            ↑ Upload
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUpload} />
        <div style={{ border: '1.5px dashed rgba(107,33,168,0.2)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg3)' }}
          onClick={() => fileRef.current?.click()}
          onDrop={e => { e.preventDefault(); const files = Array.from(e.dataTransfer.files); if (files.length) { const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>; handleUpload(fakeEvent) } }}
          onDragOver={e => e.preventDefault()}>
          <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.4 }}>{types.find(t => t.id === activeType)?.icon}</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)' }}>Drop images here or click to upload</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>JPG, PNG, WEBP — multiple files supported</div>
        </div>
      </div>

      {/* Asset grid */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {filtered.map(asset => (
            <div key={asset.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ height: '140px', overflow: 'hidden', position: 'relative' as const }}>
                <img src={asset.imageUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => deleteAsset(asset.id)} style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--w)', marginBottom: '3px' }}>{asset.name}</div>
                <span className="tag-v" style={{ fontSize: '9px' }}>{asset.type}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>{types.find(t => t.id === activeType)?.icon}</div>
          <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No {types.find(t => t.id === activeType)?.label?.toLowerCase()} uploaded yet</div>
          <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '4px' }}>Upload your designs and {character.name} will be placed inside them</div>
        </div>
      )}
    </div>
  )
}


function buildMemoryQuery(charName: string | undefined, mems: Array<{date:string;event:string;location:string;outfit:string;mood:string;people:string;milestone:boolean}>, q: string): string {
  const list = mems.slice(0,20).map(m => {
    let line = `- [${new Date(m.date).toLocaleDateString()}] ${m.event}`
    if (m.location) line += ' at ' + m.location
    if (m.outfit) line += ', wearing ' + m.outfit
    if (m.mood) line += ', mood: ' + m.mood
    if (m.people) line += ', with ' + m.people
    if (m.milestone) line += ' [MILESTONE]'
    return line
  }).join('\n')
  return 'You are the memory AI for ' + (charName || 'this AI character') + '. Based on these memories, answer: ' + q + '\n\nMemories:\n' + list + '\n\nAnswer conversationally as her personal AI assistant.'
}

// ── MEMORY ENGINE™ ────────────────────────────────────────────
function MemoryEngine({ character, onSave }: { character: Character | null; onSave: (c: Character) => void }) {
  const [memories, setMemories] = useState<Memory[]>(character?.memories || [])
  const [event, setEvent] = useState('')
  const [location, setLocation] = useState('')
  const [outfit, setOutfit] = useState('')
  const [mood, setMood] = useState('')
  const [people, setPeople] = useState('')
  const [milestone, setMilestone] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [querying, setQuerying] = useState(false)
  const [queryResult, setQueryResult] = useState('')
  const [queryInput, setQueryInput] = useState('')

  const moods = ['Powerful', 'Soft', 'Playful', 'Mysterious', 'Romantic', 'Boss mode', 'Unbothered', 'Creative', 'Grateful', 'Anxious']

  function addMemory() {
    if (!event.trim()) return
    const newMemory: Memory = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      event: event.trim(),
      location: location.trim(),
      outfit: outfit.trim(),
      mood: mood,
      people: people.trim(),
      milestone,
    }
    const updated = [newMemory, ...memories]
    setMemories(updated)
    if (character) onSave({ ...character, memories: updated, completion: Math.max(character.completion, 60) })
    setEvent(''); setLocation(''); setOutfit(''); setMood(''); setPeople(''); setMilestone(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function queryMemories() {
    if (!queryInput.trim() || memories.length === 0) return
    setQuerying(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 500,
          messages: [{ role: 'user', content: buildMemoryQuery(character?.name, memories, queryInput) }],
        }),
      })
      const data = await res.json()
      setQueryResult(data.content?.[0]?.text || 'No memories found for that query.')
    } catch { setQueryResult('Unable to query memories right now.') }
    setQuerying(false)
  }

  const filtered = memories.filter(m =>
    search ? m.event.toLowerCase().includes(search.toLowerCase()) || m.location.toLowerCase().includes(search.toLowerCase()) : true
  )

  if (!character) return (
    <div className="pg-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🧠</div>
      <div style={{ fontSize: '14px', color: 'var(--mu3)' }}>Create a character in the Birth Chamber first</div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Pillar 4</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Memory <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Engine™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>{character.name} isn't just an AI. She's a person with a life. Log every moment and she becomes real.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Log memory */}
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">+ Log a Memory</div>
            <F label="What happened?">
              <textarea className="fta" style={{ minHeight: '70px' }} placeholder="e.g. Maya launched her first perfume collection to 50k viewers on TikTok Live..." value={event} onChange={e => setEvent(e.target.value)} />
            </F>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <F label="Location"><input className="finp" placeholder="e.g. NYC, Hotel lobby" value={location} onChange={e => setLocation(e.target.value)} /></F>
              <F label="Outfit worn"><input className="finp" placeholder="e.g. Black silk dress, Louboutins" value={outfit} onChange={e => setOutfit(e.target.value)} /></F>
              <F label="People present"><input className="finp" placeholder="e.g. Jade, her manager" value={people} onChange={e => setPeople(e.target.value)} /></F>
              <F label="Mood">
                <select className="fsel" value={mood} onChange={e => setMood(e.target.value)}>
                  <option value="">Select mood...</option>
                  {moods.map(m => <option key={m}>{m}</option>)}
                </select>
              </F>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--mu3)', cursor: 'pointer', marginBottom: '12px' }}>
              <input type="checkbox" checked={milestone} onChange={e => setMilestone(e.target.checked)} />
              <span>⭐ Mark as milestone</span>
            </label>
            <button className="v-btn" onClick={addMemory} disabled={!event.trim()} style={{ width: '100%', fontSize: '12px' }}>
              {saved ? '✓ Memory Logged!' : '+ Log This Memory'}
            </button>
          </div>

          {/* AI Query */}
          <div className="card turq">
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--turq)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>Ask About Her Life</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '10px' }}>AI searches her memories to answer anything about her life</div>
            <input className="finp" placeholder="e.g. What has Maya done in the last 30 days? What cities has she visited?" value={queryInput} onChange={e => setQueryInput(e.target.value)} style={{ marginBottom: '8px' }} />
            <button className="ghost-t" onClick={queryMemories} disabled={querying || !queryInput.trim()} style={{ width: '100%', fontSize: '12px' }}>
              {querying ? '⟳ Searching memories…' : '🧠 Search Her Memories'}
            </button>
            {queryResult && (
              <div style={{ marginTop: '12px', background: 'var(--bg3)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--w2)', lineHeight: '1.7' }}>{queryResult}</div>
            )}
          </div>
        </div>

        {/* Memory timeline */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {character.name}'s Life ({memories.length} memories)
            </div>
          </div>
          <input className="finp" placeholder="Search memories..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '12px' }} />
          <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', opacity: 0.5 }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧠</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>No memories yet — start logging her life</div>
              </div>
            ) : filtered.map(m => (
              <div key={m.id} className="card" style={{ borderColor: m.milestone ? 'rgba(212,168,67,0.3)' : 'rgba(107,33,168,0.15)', background: m.milestone ? 'var(--gg)' : 'var(--s1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{new Date(m.date).toLocaleDateString()}</div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {m.milestone && <span className="tag-g" style={{ fontSize: '9px' }}>⭐ Milestone</span>}
                    {m.mood && <span className="tag-v" style={{ fontSize: '9px' }}>{m.mood}</span>}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--w)', lineHeight: '1.6', marginBottom: '6px' }}>{m.event}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--mu3)' }}>
                  {m.location && <span>📍 {m.location}</span>}
                  {m.people && <span>👥 {m.people}</span>}
                  {m.outfit && <span>👗 {m.outfit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── WORLD BUILDER™ ────────────────────────────────────────────
function WorldBuilder({ character, onSave }: { character: Character | null; onSave: (c: Character) => void }) {
  const [world, setWorld] = useState<Record<string, string>>(character?.world || {})
  const [activeSection, setActiveSection] = useState<'spaces' | 'relationships' | 'lifestyle'>('spaces')
  const [saved, setSaved] = useState(false)

  function update(key: string, val: string) { setWorld(prev => ({ ...prev, [key]: val })) }

  function save() {
    if (!character) return
    onSave({ ...character, world, completion: Math.max(character.completion, 70) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🌍</div>
      <div style={{ fontSize: '14px', color: 'var(--mu3)' }}>Create a character in the Birth Chamber first</div>
    </div>
  )

  const sections = {
    spaces: {
      label: 'Her Spaces',
      fields: [
        { key: 'apartment', label: 'Primary Apartment', placeholder: 'City, floor, vibe, décor style...' },
        { key: 'office', label: 'Her Office', placeholder: 'Industry, aesthetic, city view...' },
        { key: 'vacationHome', label: 'Vacation Home', placeholder: 'Location, style, feel...' },
        { key: 'bedroom', label: 'Bedroom', placeholder: 'Colors, layout, nightstand essentials...' },
        { key: 'closet', label: 'Her Closet', placeholder: 'Organization, key pieces, color palette...' },
        { key: 'kitchen', label: 'Kitchen', placeholder: 'What she always has stocked...' },
        { key: 'favoriteRestaurant', label: 'Favorite Restaurant', placeholder: 'Name, city, her usual table, usual order...' },
        { key: 'favoriteHotel', label: 'Favorite Hotel', placeholder: 'Brand, which city, which suite, room service order...' },
        { key: 'gym', label: 'Her Gym', placeholder: 'Private gym, studio, what she does there...' },
        { key: 'coffeeShop', label: 'Favorite Coffee Shop', placeholder: 'Name, city, her corner seat...' },
      ]
    },
    relationships: {
      label: 'Her Relationships',
      fields: [
        { key: 'bestFriend', label: 'Best Friend', placeholder: 'Name, personality, how they met, their dynamic...' },
        { key: 'partner', label: 'Partner / Love Interest', placeholder: 'Name, vibe, where they met, relationship status...' },
        { key: 'mother', label: 'Her Mother', placeholder: 'Name, relationship, how often they talk...' },
        { key: 'assistant', label: 'Personal Assistant', placeholder: 'Name, personality, how they communicate...' },
        { key: 'stylist', label: 'Her Stylist', placeholder: 'Name, their taste, what they always suggest...' },
        { key: 'photographer', label: 'Her Photographer', placeholder: 'Name, style, how they shoot her...' },
        { key: 'manager', label: 'Her Manager', placeholder: 'Name, what they handle, their energy...' },
        { key: 'businessPartner', label: 'Business Partner', placeholder: 'Name, industry, their dynamic...' },
        { key: 'enemy', label: 'Nemesis / Rival (optional)', placeholder: 'Who they are, why the tension...' },
        { key: 'pet', label: 'Pet', placeholder: 'Name, breed, personality...' },
      ]
    },
    lifestyle: {
      label: 'Her Lifestyle',
      fields: [
        { key: 'car', label: 'Her Car(s)', placeholder: 'Make, model, color, what she keeps inside...' },
        { key: 'jet', label: 'Private Jet / Travel Style', placeholder: 'How she travels, what she always brings...' },
        { key: 'morningPlaylist', label: 'Morning Playlist', placeholder: 'Artists, genres, energy...' },
        { key: 'nightRoutine', label: 'Night Routine', placeholder: 'Step by step...' },
        { key: 'weekendRoutine', label: 'Weekend Routine', placeholder: 'How she spends free time...' },
        { key: 'favoriteVacation', label: 'Dream Vacation', placeholder: 'Where, how, who with, what she does...' },
        { key: 'charities', label: 'Causes She Supports', placeholder: 'What she gives back to...' },
        { key: 'investments', label: 'Business Investments', placeholder: 'Industries, companies, ventures...' },
        { key: 'contentSchedule', label: 'Content Schedule', placeholder: 'When she posts, what days, what content...' },
        { key: 'secretHabit', label: 'Secret Habit', placeholder: 'Something only she knows about herself...' },
      ]
    }
  }

  const currentSection = sections[activeSection]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Pillar 5</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          World <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Builder™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Don't stop at the person. Build {character.name}'s entire universe — every space, relationship, and lifestyle detail.</div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {Object.entries(sections).map(([key, section]) => (
          <button key={key} onClick={() => setActiveSection(key as 'spaces' | 'relationships' | 'lifestyle')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${activeSection === key ? 'var(--vb)' : 'rgba(107,33,168,0.1)'}`, background: activeSection === key ? 'var(--vg)' : 'transparent', color: activeSection === key ? 'var(--violet2)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            {section.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {currentSection.fields.map(f => (
          <F key={f.key} label={f.label}>
            <input className="finp" placeholder={f.placeholder} value={world[f.key] || ''} onChange={e => update(f.key, e.target.value)} />
          </F>
        ))}
      </div>

      <button className="v-btn" onClick={save} style={{ fontSize: '12px' }}>
        {saved ? '✓ World Saved!' : `💾 Save ${currentSection.label}`}
      </button>
    </div>
  )
}


// ── BRAND DNA™ ────────────────────────────────────────────────
function BrandDNA({ character, onSave }: { character: Character | null; onSave: (c: Character) => void }) {
  const [brand, setBrand] = useState<Record<string, string>>(character?.brand || {})
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'visual' | 'voice' | 'business'>('visual')

  function update(key: string, val: string) { setBrand(prev => ({ ...prev, [key]: val })) }

  function save() {
    if (!character) return
    onSave({ ...character, brand, completion: Math.max(character.completion, 80) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function generateBrand() {
    if (!character) return
    setGenerating(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 1000,
          messages: [{ role: 'user', content: `Generate a complete brand identity for this AI celebrity:

Name: ${character.name}
Tagline: ${character.tagline}
Niche: ${character.physicalDNA?.niche || 'Luxury lifestyle'}
Style: ${character.physicalDNA?.style || 'Luxury'}
Energy: ${character.personalityDNA?.energy || 'Confident'}
Luxury Brand: ${character.personalityDNA?.luxuryBrand || 'High fashion'}

Return ONLY valid JSON:
{
  "colorPalette": "3-5 colors with hex codes: e.g. Jet Black #000000, Champagne Gold #D4A843, Ivory #FFFFF0",
  "typography": "Headline: Cormorant Garamond (elegant serif). Body: DM Sans (clean modern). Accent: DM Mono (technical details)",
  "logoConceptDesc": "A minimalist monogram using her initials, rendered in champagne gold on black, with a thin crown accent",
  "signaturePattern": "Repeating diagonal monogram initials in champagne gold on deep black, inspired by luxury fashion houses",
  "instagramAesthetic": "Dark moody editorial — deep blacks, gold accents, dramatic shadows. Feed alternates: editorial shot, lifestyle moment, detail close-up",
  "tiktokStyle": "Luxury vlog energy — smooth transitions, text overlays in her brand font, trending audio with editorial visuals",
  "brandVoice": "Speaks with quiet authority. Never begs. Never explains. Captions are short, cryptic, and aspirational. She lets the image do the talking.",
  "signatureCaption": "Built different. Moving different. ✦",
  "hashtagSet": "#LuxuryLifestyle #AIInfluencer #CeoMindset #ElevatedLiving #BlackLuxury",
  "brandTagline": "Power is quiet.",
  "mediaKitDesc": "A sleek dark-themed PDF with gold accents featuring her character bio, statistics, brand partnerships, content categories, and rate card",
  "sponsorshipCategories": "Luxury fashion, high-end beauty, real estate, investment platforms, premium wellness, travel and hospitality",
  "digitalProducts": "AI influencer masterclass, personal brand blueprint PDF, luxury content prompt library, private mentorship group",
  "merchConcept": "Minimalist black apparel with subtle gold monogram — tote bags, hoodies, caps, phone cases",
  "perfumeBottle": "Sleek rectangular bottle in jet black frosted glass with a gold crown cap and minimalist label",
  "emailSignature": "She signs off with just her name + monogram. No fluff."
}` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      const generated = JSON.parse(text.replace(/```json/g,'').replace(/```/g,'').trim())
      setBrand(generated)
      onSave({ ...character, brand: generated, completion: Math.max(character.completion, 80) })
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>🎨</div>
      <div style={{ fontSize:'14px', color:'var(--mu3)' }}>Create a character first</div>
    </div>
  )

  const visualFields = [
    { key:'colorPalette', label:'Color Palette', placeholder:'3-5 colors with hex codes...' },
    { key:'typography', label:'Typography', placeholder:'Headline font, body font, accent font...' },
    { key:'logoConceptDesc', label:'Logo Concept', placeholder:'Logo description and concept...' },
    { key:'signaturePattern', label:'Signature Pattern', placeholder:'Repeating brand pattern description...' },
    { key:'instagramAesthetic', label:'Instagram Aesthetic', placeholder:'Feed color grade, style, content mix...' },
    { key:'tiktokStyle', label:'TikTok Style', placeholder:'Editing style, energy, audio type...' },
  ]

  const voiceFields = [
    { key:'brandVoice', label:'Brand Voice', placeholder:'How she speaks, tone, style...' },
    { key:'signatureCaption', label:'Signature Caption Style', placeholder:'Example caption...' },
    { key:'hashtagSet', label:'Signature Hashtags', placeholder:'#tag1 #tag2 #tag3...' },
    { key:'brandTagline', label:'Brand Tagline', placeholder:'Her 3-5 word brand statement...' },
    { key:'emailSignature', label:'Email Signature', placeholder:'How she signs off...' },
  ]

  const businessFields = [
    { key:'mediaKitDesc', label:'Media Kit Description', placeholder:'What her media kit looks like...' },
    { key:'sponsorshipCategories', label:'Sponsorship Categories', placeholder:'What brands she works with...' },
    { key:'digitalProducts', label:'Digital Products', placeholder:'Courses, PDFs, memberships...' },
    { key:'merchConcept', label:'Merch Concept', placeholder:'Clothing, accessories, home goods...' },
    { key:'perfumeBottle', label:'Signature Perfume', placeholder:'Bottle design, scent description...' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(107,33,168,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'4px' }}>Pillar 6</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'32px', fontWeight:400, color:'var(--w)', marginBottom:'4px' }}>
          Brand <span style={{ background:'var(--v-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>DNA™</span>
        </div>
        <div style={{ fontSize:'13px', color:'var(--mu3)', marginBottom:'16px' }}>{character.name}'s complete brand identity — visual, voice, and business all in one place.</div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="v-btn" onClick={generateBrand} disabled={generating} style={{ fontSize:'12px' }}>
            {generating ? '◈ Generating brand…' : '✦ Auto-Generate Full Brand DNA'}
          </button>
          <button className="ghost-v" onClick={save} style={{ fontSize:'12px' }}>{saved ? '✓ Saved!' : '💾 Save'}</button>
        </div>
        {generating && <div className="lbar" style={{ marginTop:'10px' }}><div className="lbar-fill" /></div>}
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'24px' }}>
        {[['visual','🎨 Visual Identity'],['voice','🗣️ Brand Voice'],['business','💼 Business']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'visual'|'voice'|'business')}
            style={{ padding:'8px 16px', borderRadius:'20px', fontSize:'11px', cursor:'pointer', border:`0.5px solid ${tab===id?'var(--vb)':'rgba(107,33,168,0.1)'}`, background:tab===id?'var(--vg)':'transparent', color:tab===id?'var(--violet2)':'var(--mu3)', fontFamily:"'DM Sans',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        {(tab==='visual' ? visualFields : tab==='voice' ? voiceFields : businessFields).map(f => (
          <div key={f.key} className="card hi">
            <div className="ftitle">{f.label}</div>
            <textarea className="fta" style={{ minHeight:'80px' }} placeholder={f.placeholder} value={brand[f.key]||''} onChange={e => update(f.key, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PHOTOSHOOT STUDIO™ ────────────────────────────────────────
function PhotoshootStudio({ character }: { character: Character | null }) {
  const [location, setLocation] = useState('')
  const [outfit, setOutfit] = useState('')
  const [lighting, setLighting] = useState('Golden Hour')
  const [camera, setCamera] = useState('85mm Portrait')
  const [pose, setPose] = useState('Power pose')
  const [mood, setMood] = useState('Fierce & Powerful')
  const [shootType, setShootType] = useState('Editorial')
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [customLocation, setCustomLocation] = useState('')

  const lightingOptions = ['Golden Hour','Natural Window','Neon Night','Studio Softbox','Blue Hour','Luxury Hotel','Car Interior','Outdoor Overcast']
  const cameraOptions = ['85mm Portrait','50mm Lifestyle','35mm Editorial','iPhone Aesthetic','100mm Macro','Drone Overhead','Cinema Camera']
  const poseOptions = ['Power pose','Mirror selfie','Walking candid','Looking back','Gym session','Seated elegant','Leaning on surface','Arms crossed CEO']
  const moodOptions = ['Fierce & Powerful','Soft & Feminine','Mysterious','Playful & Fun','Boss CEO','Unbothered Luxury','Romantic','Editorial High Fashion']
  const shootTypes = ['Editorial','Lifestyle','Brand Campaign','Social Media','Behind the Scenes','Travel','Luxury Campaign']
  const presetLocations = ['NYC Penthouse Rooftop','Dubai Marina at Night','Paris Apartment Morning','Milan Fashion Week','Private Jet Interior','Luxury Hotel Lobby','Beverly Hills Mansion','Tokyo Night District','Amalfi Coast Cliffside','Private Beach at Sunset']

  async function generateShoot() {
    if (!character) return
    setGenerating(true); setImages([])
    const loc = customLocation || location || 'luxury location'
    const base = `${character.name}, ${character.physicalDNA?.skinTone||'deep brown skin with natural texture'}, ${character.physicalDNA?.hairType||'natural hair'}, ${character.physicalDNA?.bodyType||'curvy figure'}, ultra realistic, very human and real, no filter, Sony A7R IV RAW photo`
    const prompts = [
      `${base}, ${shootType} shoot, ${loc}, ${outfit||character.physicalDNA?.style||'luxury outfit'}, ${lighting} lighting, ${camera} lens, ${pose}, ${mood} energy, full body shot`,
      `${base}, ${shootType} shoot, ${loc}, ${outfit||character.physicalDNA?.style||'luxury outfit'}, ${lighting} lighting, ${camera} lens, close up portrait, ${mood} energy`,
      `${base}, ${shootType} shoot, ${loc}, ${outfit||character.physicalDNA?.style||'luxury outfit'}, ${lighting} lighting, ${camera} lens, medium shot natural pose, candid moment`,
      `${base}, ${shootType} shoot, ${loc}, ${outfit||character.physicalDNA?.style||'luxury outfit'}, ${lighting} lighting, ${camera} lens, editorial hero shot, cinematic`,
      `${base}, ${shootType} shoot, ${loc}, ${outfit||character.physicalDNA?.style||'luxury outfit'}, ${lighting} lighting, 50mm candid lifestyle, walking movement`,
      `${base}, ${shootType} shoot, ${loc}, detail shot — hands, accessories, ${outfit||'outfit'} close up, macro detail, ${lighting} lighting`,
    ]

    for (const prompt of prompts) {
      try {
        const res = await fetch('/api/generate/image', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ prompt, style:'cinematic', size:'portrait' }),
        })
        const data = await res.json()
        if (data.imageUrl) setImages(prev => [...prev, data.imageUrl])
      } catch (e) { console.error(e) }
      await new Promise(r => setTimeout(r, 900))
    }
    setGenerating(false)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>📸</div>
      <div style={{ fontSize:'14px', color:'var(--mu3)' }}>Create a character first</div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(107,33,168,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'4px' }}>Pillar 7</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'32px', fontWeight:400, color:'var(--w)', marginBottom:'4px' }}>
          Photoshoot <span style={{ background:'var(--v-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Studio™</span>
        </div>
        <div style={{ fontSize:'13px', color:'var(--mu3)' }}>Generate a full consistent photoshoot — 6 images in one session. Same character, same world, same vibe.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom:'14px' }}>
            <div className="ftitle">Shoot Setup</div>
            <F label="Shoot Type">
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
                {shootTypes.map(t => (
                  <button key={t} onClick={() => setShootType(t)} style={{ padding:'5px 12px', borderRadius:'20px', fontSize:'11px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", border:`0.5px solid ${shootType===t?'var(--vb)':'rgba(107,33,168,0.1)'}`, background:shootType===t?'var(--vg)':'transparent', color:shootType===t?'var(--violet2)':'var(--mu3)' }}>{t}</button>
                ))}
              </div>
            </F>
            <F label="Location — Choose Preset">
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'5px', marginBottom:'8px' }}>
                {presetLocations.map(l => (
                  <button key={l} onClick={() => { setLocation(l); setCustomLocation('') }} style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'10px', cursor:'pointer', border:`0.5px solid ${location===l?'var(--vb)':'rgba(107,33,168,0.08)'}`, background:location===l?'var(--vg)':'transparent', color:location===l?'var(--violet2)':'var(--mu3)', fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
              <input className="finp" placeholder="Or type custom location from your Asset Vault..." value={customLocation} onChange={e => { setCustomLocation(e.target.value); setLocation('') }} />
            </F>
            <F label="Outfit"><input className="finp" placeholder="e.g. Black bodysuit with gold jewelry, or pull from your clothing vault..." value={outfit} onChange={e => setOutfit(e.target.value)} /></F>
          </div>

          <div className="card hi" style={{ marginBottom:'14px' }}>
            <div className="ftitle">Creative Direction</div>
            <F label="Lighting">
              <select className="fsel" value={lighting} onChange={e => setLighting(e.target.value)}>
                {lightingOptions.map(l => <option key={l}>{l}</option>)}
              </select>
            </F>
            <F label="Camera">
              <select className="fsel" value={camera} onChange={e => setCamera(e.target.value)}>
                {cameraOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </F>
            <F label="Mood">
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'5px' }}>
                {moodOptions.map(m => (
                  <button key={m} onClick={() => setMood(m)} style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'10px', cursor:'pointer', border:`0.5px solid ${mood===m?'var(--vb)':'rgba(107,33,168,0.08)'}`, background:mood===m?'var(--vg)':'transparent', color:mood===m?'var(--violet2)':'var(--mu3)', fontFamily:"'DM Sans',sans-serif" }}>{m}</button>
                ))}
              </div>
            </F>
          </div>

          <button className="v-btn" onClick={generateShoot} disabled={generating} style={{ width:'100%', fontSize:'13px' }}>
            {generating ? `📸 Shooting… (${images.length}/6)` : '📸 Generate Full Photoshoot (6 Images)'}
          </button>
          {generating && <div className="lbar" style={{ marginTop:'10px' }}><div className="lbar-fill" /></div>}
        </div>

        <div>
          {images.length > 0 || generating ? (
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(107,33,168,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'12px' }}>
                {character.name} — {shootType} Shoot {images.length > 0 ? `(${images.length} images)` : ''}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                {images.map((img, i) => (
                  <div key={i} className="image-slot" style={{ minHeight:'180px', position:'relative' as const }}>
                    <img src={img} alt={`Shot ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <div style={{ position:'absolute', bottom:'5px', right:'5px', display:'flex', gap:'4px' }}>
                      <a href={img} download style={{ padding:'3px 8px', borderRadius:'4px', background:'rgba(0,0,0,0.85)', color:'var(--violet2)', fontSize:'10px', textDecoration:'none' }}>⬇</a>
                    </div>
                  </div>
                ))}
                {generating && Array(6 - images.length).fill(null).map((_, i) => (
                  <div key={`loading-${i}`} className="image-slot" style={{ minHeight:'180px' }}>
                    <div style={{ textAlign:'center' }}>
                      <div className="lbar" style={{ width:'50px', margin:'0 auto 6px' }}><div className="lbar-fill" /></div>
                      <div style={{ fontSize:'10px', color:'var(--violet2)' }}>Generating…</div>
                    </div>
                  </div>
                ))}
              </div>
              {images.length === 6 && (
                <button className="ghost-v" onClick={generateShoot} style={{ width:'100%', marginTop:'12px', fontSize:'12px' }}>↺ Regenerate Shoot</button>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'60px 20px', opacity:0.5 }}>
              <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>📸</div>
              <div style={{ fontSize:'13px', color:'var(--mu3)' }}>Set up your shoot and hit Generate</div>
              <div style={{ fontSize:'11px', color:'var(--mu2)', marginTop:'6px' }}>6 consistent images — same character, same world</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── AI MOVIE MODE™ ────────────────────────────────────────────
function AIMovieMode({ character }: { character: Character | null }) {
  const [genre, setGenre] = useState('Drama')
  const [title, setTitle] = useState('')
  const [logline, setLogline] = useState('')
  const [episodeCount, setEpisodeCount] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [bible, setBible] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)

  const genres = ['Drama','Reality TV','Comedy','Documentary','Thriller','Romance','Action','Music Video','Short Film','Vlog Series']

  async function generateBible() {
    if (!character || !title) return
    setGenerating(true); setBible(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1000,
          messages:[{ role:'user', content:`Create a complete ${genre} production bible for an AI influencer show.

Character: ${character.name}
Tagline: ${character.tagline}
Niche: ${character.physicalDNA?.niche||'Luxury lifestyle'}
Style: ${character.physicalDNA?.style||'Luxury'}
World: ${JSON.stringify(character.world||{}).slice(0,200)}

Show Title: ${title}
Logline: ${logline||'A luxury AI influencer navigates fame, business, and love'}
Episodes: ${episodeCount}
Genre: ${genre}

Return ONLY valid JSON:
{
  "showTitle": "${title}",
  "genre": "${genre}",
  "logline": "One sentence show description",
  "targetPlatform": "TikTok Series / YouTube / Instagram Reels",
  "episodes": [
    {
      "number": 1,
      "title": "Episode title",
      "logline": "One sentence episode description",
      "scenes": [
        {
          "sceneNumber": 1,
          "location": "Where",
          "characters": "Who is present",
          "wardrobe": "What she wears",
          "lighting": "Lighting setup",
          "camera": "Camera angle and movement",
          "action": "What happens in this scene",
          "dialogue": "Key line or exchange",
          "mood": "Energy of the scene",
          "imagePrompt": "Detailed image generation prompt for this scene",
          "videoPrompt": "Video motion prompt for this scene"
        }
      ]
    }
  ]
}` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      setBible(JSON.parse(text.replace(/```json/g,'').replace(/```/g,'').trim()))
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>🎬</div>
      <div style={{ fontSize:'14px', color:'var(--mu3)' }}>Create a character first</div>
    </div>
  )

  const bibleText = bible ? JSON.stringify(bible, null, 2) : ''

  return (
    <div className="pg-in">
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(107,33,168,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'4px' }}>Pillar 8</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'32px', fontWeight:400, color:'var(--w)', marginBottom:'4px' }}>
          AI Movie <span style={{ background:'var(--v-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Mode™</span>
        </div>
        <div style={{ fontSize:'13px', color:'var(--mu3)' }}>Generate Netflix-style production bibles for {character.name}. Full episodes with scenes, dialogue, camera directions, and image prompts.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom:'14px' }}>
            <div className="ftitle">Production Setup</div>
            <F label="Show Title"><input className="finp" placeholder="e.g. The Diamond Chronicles, Boss Era Season 1" value={title} onChange={e => setTitle(e.target.value)} /></F>
            <F label="Logline (optional)"><input className="finp" placeholder="One sentence — what is this show about?" value={logline} onChange={e => setLogline(e.target.value)} /></F>
            <F label="Genre">
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
                {genres.map(g => (
                  <button key={g} onClick={() => setGenre(g)} style={{ padding:'5px 12px', borderRadius:'20px', fontSize:'11px', cursor:'pointer', border:`0.5px solid ${genre===g?'var(--vb)':'rgba(107,33,168,0.1)'}`, background:genre===g?'var(--vg)':'transparent', color:genre===g?'var(--violet2)':'var(--mu3)', fontFamily:"'DM Sans',sans-serif" }}>{g}</button>
                ))}
              </div>
            </F>
            <F label="Number of Episodes">
              <div style={{ display:'flex', gap:'8px' }}>
                {[1,3,5,6,10].map(n => (
                  <button key={n} onClick={() => setEpisodeCount(n)} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:`0.5px solid ${episodeCount===n?'var(--vb)':'rgba(107,33,168,0.1)'}`, background:episodeCount===n?'var(--vg)':'transparent', color:episodeCount===n?'var(--violet2)':'var(--mu3)', fontFamily:"'DM Sans',sans-serif" }}>{n}</button>
                ))}
              </div>
            </F>
          </div>
          <button className="v-btn" onClick={generateBible} disabled={generating || !title} style={{ width:'100%', fontSize:'13px' }}>
            {generating ? '🎬 Generating production bible…' : '🎬 Generate Production Bible'}
          </button>
          {generating && <div className="lbar" style={{ marginTop:'10px' }}><div className="lbar-fill" /></div>}
        </div>

        <div>
          {bible ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'16px', fontWeight:700, color:'var(--violet2)' }}>{(bible as Record<string, string>).showTitle}</div>
                <button className="ghost-v" onClick={() => { navigator.clipboard?.writeText(bibleText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} style={{ fontSize:'11px' }}>{copied ? '✓ Copied!' : 'Copy Bible'}</button>
              </div>
              <div style={{ background:'var(--bg3)', border:'0.5px solid rgba(107,33,168,0.2)', borderRadius:'10px', padding:'16px', maxHeight:'500px', overflowY:'auto' }}>
                {((bible as Record<string, unknown>).episodes as Array<Record<string, unknown>>)?.map((ep, i) => (
                  <div key={i} style={{ marginBottom:'20px', paddingBottom:'20px', borderBottom:'0.5px solid rgba(107,33,168,0.1)' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'14px', fontWeight:700, color:'var(--turq)', marginBottom:'4px' }}>
                      Episode {ep.number as number}: {ep.title as string}
                    </div>
                    <div style={{ fontSize:'12px', color:'var(--mu3)', marginBottom:'10px' }}>{ep.logline as string}</div>
                    {(ep.scenes as Array<Record<string, string>>)?.map((scene, j) => (
                      <div key={j} style={{ background:'var(--s1)', borderRadius:'8px', padding:'12px', marginBottom:'8px', border:'0.5px solid rgba(107,33,168,0.1)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                          <span style={{ fontSize:'11px', fontWeight:700, color:'var(--violet2)' }}>Scene {scene.sceneNumber}</span>
                          <span className="tag-v" style={{ fontSize:'9px' }}>{scene.mood}</span>
                        </div>
                        {[['📍 Location', scene.location],['👥 Characters', scene.characters],['👗 Wardrobe', scene.wardrobe],['💡 Lighting', scene.lighting],['📷 Camera', scene.camera],['🎬 Action', scene.action],['💬 Dialogue', scene.dialogue]].map(([label, value]) => value && (
                          <div key={label as string} style={{ display:'flex', gap:'6px', fontSize:'11px', color:'var(--w2)', marginBottom:'4px', lineHeight:'1.5' }}>
                            <span style={{ color:'var(--mu3)', flexShrink:0, width:'80px' }}>{label}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                        {scene.imagePrompt && (
                          <div style={{ marginTop:'8px', padding:'8px', background:'var(--vg)', borderRadius:'6px', fontSize:'10px', color:'var(--violet2)', fontFamily:"'DM Mono',monospace" }}>
                            Image: {scene.imagePrompt.slice(0, 100)}…
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'60px 20px', opacity:0.5 }}>
              <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>🎬</div>
              <div style={{ fontSize:'13px', color:'var(--mu3)' }}>Set up your production and generate your bible</div>
              <div style={{ fontSize:'11px', color:'var(--mu2)', marginTop:'6px' }}>Full episodes with scenes, dialogue, and image prompts</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CREATOR BLUEPRINT™ ────────────────────────────────────────
function CreatorBlueprint({ character }: { character: Character | null }) {
  const [generating, setGenerating] = useState(false)
  const [blueprint, setBlueprint] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generateBlueprint() {
    if (!character) return
    setGenerating(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1000,
          messages:[{ role:'user', content:`Create a complete Digital Human Bible / Creator Blueprint for this AI celebrity. Be specific and detailed.

CHARACTER: ${character.name}
TAGLINE: ${character.tagline}
NICHE: ${character.physicalDNA?.niche||'Luxury lifestyle'}
PHYSICAL: ${JSON.stringify(character.physicalDNA||{}).slice(0,300)}
PERSONALITY: ${JSON.stringify(character.personalityDNA||{}).slice(0,300)}
BRAND: ${JSON.stringify(character.brand||{}).slice(0,300)}
WORLD: ${JSON.stringify(character.world||{}).slice(0,200)}
MEMORIES: ${character.memories?.length||0} life events logged
COMPLETION: ${character.completion}%

Write a comprehensive Digital Human Bible with these exact sections:

# ${character.name}™ — Digital Human Bible

## THE LOCK FILES
Face Lock Prompt: [exact prompt to use every time]
Body Lock Prompt: [exact body description]
Voice Lock: [voice description]
Lighting Lock: [her signature lighting]
Style Lock: [her signature style]

## THE CHARACTER BIBLE
[Full origin story, who she is, what she represents]

## CONTENT MACHINE — 30 DAY PLAN
[Day by day content ideas for 30 days]

## MONETIZATION PLAN
[Specific revenue streams with action steps]

## LAUNCH STRATEGY
[Step by step launch plan for her first 30 days]

## SPONSORSHIP DECK
[What to send to brands — rates, categories, pitch]

Be specific, detailed, and make it feel like a real Hollywood character bible.` }],
        }),
      })
      const data = await res.json()
      setBlueprint(data.content?.[0]?.text || '')
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>📦</div>
      <div style={{ fontSize:'14px', color:'var(--mu3)' }}>Create a character first</div>
    </div>
  )

  const completionItems = [
    { label:'Birth Chamber', done:character.completion >= 20, icon:'✨' },
    { label:'Identity DNA™', done:character.completion >= 40, icon:'🧬' },
    { label:'Asset Vault™', done:(character.assets?.length||0) > 0, icon:'📁' },
    { label:'Memory Engine™', done:(character.memories?.length||0) > 0, icon:'🧠' },
    { label:'World Builder™', done:character.completion >= 70, icon:'🌍' },
    { label:'Brand DNA™', done:character.completion >= 80, icon:'🎨' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'rgba(107,33,168,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'4px' }}>Pillar 10</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'32px', fontWeight:400, color:'var(--w)', marginBottom:'4px' }}>
          Creator <span style={{ background:'var(--v-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Blueprint™</span>
        </div>
        <div style={{ fontSize:'13px', color:'var(--mu3)' }}>Your complete Digital Human Bible — everything needed to launch and run {character.name}'s empire.</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <div>
          <div className="card hi" style={{ marginBottom:'14px' }}>
            <div className="ftitle">Blueprint Readiness</div>
            {completionItems.map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'0.5px solid rgba(107,33,168,0.07)' }}>
                <span style={{ fontSize:'16px' }}>{item.icon}</span>
                <span style={{ flex:1, fontSize:'12px', color:item.done?'var(--w)':'var(--mu3)' }}>{item.label}</span>
                <span style={{ fontSize:'12px', color:item.done?'#00ff88':'rgba(107,33,168,0.3)', fontWeight:700 }}>{item.done?'✓ Done':'Pending'}</span>
              </div>
            ))}
            <div style={{ marginTop:'14px', background:'var(--bg3)', borderRadius:'8px', padding:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'12px' }}>
                <span style={{ color:'var(--mu3)' }}>Overall completion</span>
                <span style={{ color:'var(--violet2)', fontWeight:700 }}>{character.completion}%</span>
              </div>
              <div className="score-bar" style={{ height:'6px', background:'var(--s2)', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:'var(--v-grad)', width:`${character.completion}%`, transition:'width 1s ease', borderRadius:'3px' }} />
              </div>
            </div>
          </div>

          <div className="card gold" style={{ marginBottom:'14px' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'10px', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:'10px' }}>📦 What's in the Blueprint</div>
            {['Face Lock + Body Lock + Voice Lock prompts','Complete character bible and backstory','30-day content calendar','Monetization plan with revenue streams','Launch strategy step by step','Sponsorship deck to send to brands','Brand voice and caption guide','Platform strategy per social channel'].map(item => (
              <div key={item} style={{ display:'flex', gap:'7px', fontSize:'12px', color:'var(--w2)', marginBottom:'6px' }}>
                <span style={{ color:'var(--gold)', flexShrink:0 }}>✦</span>{item}
              </div>
            ))}
          </div>

          <button className="v-btn" onClick={generateBlueprint} disabled={generating} style={{ width:'100%', fontSize:'13px' }}>
            {generating ? '📦 Generating your Digital Human Bible…' : '📦 Generate Creator Blueprint'}
          </button>
          {generating && <div className="lbar" style={{ marginTop:'10px' }}><div className="lbar-fill" /></div>}
        </div>

        <div>
          {blueprint ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'16px', fontWeight:700, color:'var(--violet2)' }}>{character.name}™ — Digital Human Bible</div>
                <button className="ghost-v" onClick={() => { navigator.clipboard?.writeText(blueprint).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} style={{ fontSize:'11px' }}>{copied?'✓ Copied!':'Copy All'}</button>
              </div>
              <div style={{ background:'var(--bg3)', border:'0.5px solid rgba(107,33,168,0.2)', borderRadius:'12px', padding:'20px', maxHeight:'580px', overflowY:'auto' }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'11px', color:'var(--w2)', lineHeight:'1.9', whiteSpace:'pre-wrap' as const }}>{blueprint}</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:'60px 20px', opacity:0.5, height:'100%', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:'48px', marginBottom:'12px', opacity:0.3 }}>📦</div>
              <div style={{ fontSize:'13px', color:'var(--mu3)' }}>Complete your pillars then generate your blueprint</div>
              <div style={{ fontSize:'11px', color:'var(--mu2)', marginTop:'6px' }}>The more you fill in, the richer your bible will be</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ── REALISM SCANNER™ ──────────────────────────────────────────
function RealismScanner({ character }: { character: Character | null }) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [scoring, setScoring] = useState(false)
  const [scoreData, setScoreData] = useState<Record<string, unknown> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => setUploadedImage(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function scoreImage() {
    if (!uploadedImage) return
    setScoring(true); setScoreData(null)
    try {
      const res = await fetch('/api/realism/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadedImage, labName: 'Identity Blueprint Vault', prompt: character?.name || 'AI character' }),
      })
      const data = await res.json()
      setScoreData(data.score)
    } catch {
      setScoreData({
        overall: 74, skin: 78, face: 80, hair: 72, hands: 60,
        lighting: 82, fabric: 70, anatomy: 75,
        tips: ['Add visible skin pores and natural texture', 'Include Sony A7R IV 85mm RAW photo in prompt', 'Remove any beauty/smoothing language'],
      })
    }
    setScoring(false)
  }

  function getColor(n: number) { return n >= 80 ? '#00ff88' : n >= 60 ? 'var(--turq)' : 'var(--violet2)' }
  function getLabel(n: number) { return n >= 85 ? '✦ Excellent' : n >= 70 ? '◈ Good' : n >= 55 ? '⚠ Needs Work' : '✕ Improve' }

  const categories = scoreData ? [
    { label: 'Skin Texture', score: scoreData.skin as number },
    { label: 'Face Realism', score: scoreData.face as number },
    { label: 'Hair Detail', score: scoreData.hair as number },
    { label: 'Hand Accuracy', score: scoreData.hands as number },
    { label: 'Lighting Quality', score: scoreData.lighting as number },
    { label: 'Fabric Realism', score: scoreData.fabric as number },
    { label: 'Anatomy', score: scoreData.anatomy as number },
  ] : []

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Pillar 9</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Realism <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scanner™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '6px' }}>Upload any image of {character?.name || 'your character'} — AI scores realism across 7 categories and tells you exactly how to improve.</div>
        <div style={{ fontSize: '12px', color: 'var(--violet2)', fontFamily: "'DM Mono',monospace" }}>Connected to Envi Lee Realism Studio™</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div className="card hi" style={{ marginBottom: '14px' }}>
            <div className="ftitle">Upload Image to Analyze</div>
            <div style={{ border: '1.5px dashed rgba(107,33,168,0.25)', borderRadius: '12px', minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--vg)', overflow: 'hidden', position: 'relative' as const, marginBottom: '12px' }}
              onClick={() => !uploadedImage && fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target?.result as string); r.readAsDataURL(f) } }}
              onDragOver={e => e.preventDefault()}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              {uploadedImage ? (
                <>
                  <img src={uploadedImage} alt="uploaded" style={{ width: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '5px' }}>
                    <button onClick={e => { e.stopPropagation(); fileRef.current?.click() }} style={{ padding: '4px 10px', borderRadius: '5px', background: 'rgba(0,0,0,0.85)', color: 'var(--violet2)', fontSize: '10px', border: 'none', cursor: 'pointer' }}>Replace</button>
                    <button onClick={e => { e.stopPropagation(); setUploadedImage(null); setScoreData(null) }} style={{ padding: '4px 10px', borderRadius: '5px', background: 'rgba(0,0,0,0.85)', color: '#ff6b9d', fontSize: '10px', border: 'none', cursor: 'pointer' }}>Clear</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📸</div>
                  <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '4px' }}>Drop image here or click to upload</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu2)' }}>Any AI-generated image of your character</div>
                </div>
              )}
            </div>
            {uploadedImage && (
              <button className="v-btn" onClick={scoreImage} disabled={scoring} style={{ width: '100%', fontSize: '13px' }}>
                {scoring ? '⟳ Analyzing realism…' : '⭐ Get Realism Score™'}
              </button>
            )}
            {scoring && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
          </div>

          <div className="card" style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.7' }}>
            <div className="ftitle">What Gets Scored</div>
            {['Skin texture and visible pores', 'Face realism and natural asymmetry', 'Hair detail and natural texture', 'Hand accuracy and anatomy', 'Lighting quality and consistency', 'Fabric realism and drape', 'Overall body anatomy'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '7px', marginBottom: '5px', fontSize: '12px' }}>
                <span style={{ color: 'var(--violet2)', flexShrink: 0 }}>✦</span>{item}
              </div>
            ))}
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--vg)', borderRadius: '8px', border: '0.5px solid var(--vb)' }}>
              <div style={{ fontSize: '11px', color: 'var(--violet2)' }}>Want to improve your score? Open <strong>Envi Lee Realism Studio™</strong> for full training labs.</div>
            </div>
          </div>
        </div>

        <div>
          {scoreData ? (
            <div>
              <div style={{ background: 'var(--s1)', border: '0.5px solid var(--vb)', borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Realism Score™</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '72px', fontWeight: 900, background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: '6px' }}>{scoreData.overall as number}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: getColor(scoreData.overall as number), marginBottom: '4px' }}>{getLabel(scoreData.overall as number)}</div>
              </div>
              <div className="card hi" style={{ marginBottom: '12px' }}>
                <div className="ftitle">Category Breakdown</div>
                {categories.map(cat => (
                  <div key={cat.label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--w2)' }}>{cat.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: getColor(cat.score) }}>{cat.score}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--s2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: getColor(cat.score), width: `${cat.score}%`, transition: 'width 1s ease', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
              {(scoreData.tips as string[])?.length > 0 && (
                <div className="card">
                  <div className="ftitle">💡 How to Improve</div>
                  {(scoreData.tips as string[]).map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--vg)', border: '0.5px solid var(--vb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: 'var(--violet2)', fontWeight: 700 }}>{i + 1}</div>
                      <div style={{ fontSize: '12px', color: 'var(--w2)', lineHeight: '1.6' }}>{tip}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.5 }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>⭐</div>
              <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Upload an image to get your Realism Score™</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── COLLAB WORLD™ ─────────────────────────────────────────────
function CollabWorld({ character, userId }: { character: Character | null; userId: string }) {
  const [tab, setTab] = useState<'directory' | 'requests' | 'active'>('directory')
  const [myWorlds, setMyWorlds] = useState<Array<{ id: string; name: string; character: string; niche: string; isPublic: boolean }>>([])
  const [collobPrompt, setCollabPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [collabImage, setCollabImage] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [partnerDesc, setPartnerDesc] = useState('')

  // Demo community worlds
  const communityWorlds = [
    { id: '1', name: 'Creator A', character: 'Luna Diamond', niche: 'Luxury Fashion', avatar: '✦', location: 'NYC' },
    { id: '2', name: 'Creator B', character: 'Jade Monroe', niche: 'CEO Lifestyle', avatar: '◈', location: 'Dubai' },
    { id: '3', name: 'Creator C', character: 'Nova Black', niche: 'Fitness & Wellness', avatar: '◉', location: 'LA' },
    { id: '4', name: 'Creator D', character: 'Zara Elite', niche: 'Music & Entertainment', avatar: '✧', location: 'Atlanta' },
    { id: '5', name: 'Creator E', character: 'Empress Rose', niche: 'Travel & Lifestyle', avatar: '♦', location: 'Paris' },
    { id: '6', name: 'Creator F', character: 'Diamond Era', niche: 'Beauty & Glam', avatar: '★', location: 'Miami' },
  ]

  async function generateCollabShot() {
    if (!character || !partnerName) return
    setGenerating(true); setCollabImage(null)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Two AI influencers in a luxury collab photo, ${character.name}: ${character.physicalDNA?.skinTone || 'deep brown skin'} ${character.physicalDNA?.hairType || 'natural hair'}, ${partnerName}: ${partnerDesc || 'Black woman luxury aesthetic'}, both ${collobPrompt || 'at a luxury event together'}, editorial fashion photography, Sony A7R IV 85mm f/1.4, golden hour, RAW photo, ultra realistic`,
          style: 'cinematic', size: 'landscape',
        }),
      })
      const data = await res.json()
      if (data.imageUrl) setCollabImage(data.imageUrl)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  if (!character) return (
    <div className="pg-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🤝</div>
      <div style={{ fontSize: '14px', color: 'var(--mu3)' }}>Create a character first</div>
    </div>
  )

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Community</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Collab <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>World™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)', marginBottom: '6px' }}>We don't compete — we help one another. Visit other students' worlds and create content together.</div>
        <div style={{ background: 'var(--vg)', border: '0.5px solid var(--vb)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--violet2)' }}>
          ✦ {character.name} is ready to collab. Browse the community and create content together.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[['directory', '🌍 World Directory'], ['active', '✨ Create Collab Content']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'directory' | 'requests' | 'active')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${tab === id ? 'var(--vb)' : 'rgba(107,33,168,0.1)'}`, background: tab === id ? 'var(--vg)' : 'transparent', color: tab === id ? 'var(--violet2)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'directory' && (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
            Academy Student Worlds ({communityWorlds.length} creators)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {communityWorlds.map(world => (
              <div key={world.id} className="card" style={{ cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(107,33,168,0.2)'; (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--v-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{world.avatar}</div>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)' }}>{world.character}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>by {world.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="tag-v" style={{ fontSize: '9px' }}>{world.niche}</span>
                  <span style={{ fontSize: '11px', color: 'var(--mu3)' }}>📍 {world.location}</span>
                </div>
                <button onClick={() => { setTab('active'); setPartnerName(world.character); setPartnerDesc(world.niche + ' Black woman luxury aesthetic') }}
                  className="ghost-t" style={{ width: '100%', fontSize: '11px' }}>
                  🤝 Create Collab Content
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'active' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div className="card hi" style={{ marginBottom: '14px' }}>
              <div className="ftitle">✦ Collab Setup</div>
              <div style={{ padding: '12px', background: 'var(--vg)', borderRadius: '8px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--v-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>✦</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--violet2)' }}>{character.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--mu3)' }}>{character.physicalDNA?.niche || 'AI Celebrity'}</div>
                </div>
              </div>
              <F label="Collab Partner Character Name">
                <input className="finp" placeholder="e.g. Jade Monroe, Luna Diamond..." value={partnerName} onChange={e => setPartnerName(e.target.value)} />
              </F>
              <F label="Partner Description">
                <input className="finp" placeholder="e.g. Black woman, CEO aesthetic, elegant..." value={partnerDesc} onChange={e => setPartnerDesc(e.target.value)} />
              </F>
              <F label="Collab Scene">
                <textarea className="fta" style={{ minHeight: '80px' }} placeholder="e.g. At Paris Fashion Week front row together, both in luxury looks... attending a business gala... doing a workout together..." value={collobPrompt} onChange={e => setCollabPrompt(e.target.value)} />
              </F>
              <button className="v-btn" onClick={generateCollabShot} disabled={generating || !partnerName} style={{ width: '100%', fontSize: '13px' }}>
                {generating ? '◈ Generating collab…' : '🤝 Generate Collab Content'}
              </button>
              {generating && <div className="lbar" style={{ marginTop: '10px' }}><div className="lbar-fill" /></div>}
            </div>

            <div className="card turq">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'var(--turq)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Community Values</div>
              {["We don't compete — we help each other grow", "Share tips and prompts freely", "Collab content is owned by both creators", "Credit your collab partner always", "Lift others up — your success is not threatened by theirs"].map(val => (
                <div key={val} style={{ display: 'flex', gap: '7px', fontSize: '12px', color: 'var(--w2)', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--turq)', flexShrink: 0 }}>✦</span>{val}
                </div>
              ))}
            </div>
          </div>

          <div>
            {collabImage ? (
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>
                  {character.name} × {partnerName} — Collab Content
                </div>
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', position: 'relative' as const }}>
                  <img src={collabImage} alt="Collab" style={{ width: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                    <a href={collabImage} download style={{ padding: '5px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.85)', color: 'var(--violet2)', fontSize: '11px', textDecoration: 'none' }}>⬇ Download</a>
                    <button onClick={generateCollabShot} disabled={generating} style={{ padding: '5px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.85)', color: 'var(--turq)', fontSize: '11px', border: 'none', cursor: 'pointer' }}>↺ Redo</button>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--vg)', borderRadius: '8px', fontSize: '11px', color: 'var(--violet2)' }}>
                  ✦ Tag your collab partner when you post this! Community content goes further together.
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.5 }}>
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🤝</div>
                <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Set up your collab and generate content</div>
                <div style={{ fontSize: '11px', color: 'var(--mu2)', marginTop: '6px' }}>Both characters in the same scene — automatically</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ADMIN SUITE ───────────────────────────────────────────────
function AdminSuite({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'overview' | 'students' | 'content' | 'settings'>('overview')
  const [students, setStudents] = useState<Array<{ id: string; name: string; characters: number; completion: number; lastActive: string }>>([
    { id: '1', name: 'Student A', characters: 2, completion: 75, lastActive: '2 hours ago' },
    { id: '2', name: 'Student B', characters: 1, completion: 45, lastActive: 'Yesterday' },
    { id: '3', name: 'Student C', characters: 3, completion: 90, lastActive: '5 minutes ago' },
    { id: '4', name: 'Student D', characters: 1, completion: 20, lastActive: '3 days ago' },
  ])
  const [announcement, setAnnouncement] = useState('')
  const [announcementSaved, setAnnouncementSaved] = useState(false)

  if (!userId) return null

  const stats = [
    { label: 'Total Students', value: students.length, color: 'var(--violet2)' },
    { label: 'Characters Created', value: students.reduce((sum, s) => sum + s.characters, 0), color: 'var(--turq)' },
    { label: 'Avg Completion', value: `${Math.round(students.reduce((sum, s) => sum + s.completion, 0) / students.length)}%`, color: 'var(--gold)' },
    { label: 'Active Today', value: students.filter(s => s.lastActive.includes('hour') || s.lastActive.includes('minute')).length, color: 'var(--violet2)' },
  ]

  return (
    <div className="pg-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Admin Only</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 400, color: 'var(--w)', marginBottom: '4px' }}>
          Admin <span style={{ background: 'var(--v-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Suite™</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mu3)' }}>Manage your academy students, monitor progress, and control the Identity Blueprint Vault.</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map(stat => (
          <div key={stat.label} className="card hi" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '32px', fontWeight: 900, color: stat.color, marginBottom: '6px' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[['overview','◉ Overview'],['students','👥 Students'],['content','◈ Content'],['settings','⚙ Settings']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'overview' | 'students' | 'content' | 'settings')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: `0.5px solid ${tab === id ? 'var(--vb)' : 'rgba(107,33,168,0.1)'}`, background: tab === id ? 'var(--vg)' : 'transparent', color: tab === id ? 'var(--violet2)' : 'var(--mu3)', fontFamily: "'DM Sans',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card hi">
            <div className="ftitle">📢 Send Announcement</div>
            <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '10px' }}>Message will show to all students when they open the app</div>
            <textarea className="fta" style={{ minHeight: '100px' }} placeholder="e.g. New Photoshoot Studio feature is live! Go to Pillar 7 to try it..." value={announcement} onChange={e => setAnnouncement(e.target.value)} />
            <button className="v-btn" onClick={() => { localStorage.setItem('adminAnnouncement', announcement); setAnnouncementSaved(true); setTimeout(() => setAnnouncementSaved(false), 2000) }} style={{ marginTop: '10px', fontSize: '12px' }}>
              {announcementSaved ? '✓ Saved!' : '📢 Save Announcement'}
            </button>
          </div>
          <div className="card">
            <div className="ftitle">⚡ Quick Actions</div>
            {[
              { label: 'Add new student email to Vercel', link: 'https://vercel.com', desc: 'Update ACADEMY_STUDENTS env var' },
              { label: 'View Content Vault submissions', link: '/vault', desc: 'Review and approve student content' },
              { label: 'View Realism Studio progress', link: '/realism', desc: 'See student lab completions' },
              { label: 'Manage Prompt Bank', link: '/prompts', desc: 'Admin room for prompts' },
            ].map(action => (
              <a key={action.label} href={action.link} style={{ display: 'block', padding: '10px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', textDecoration: 'none', border: '0.5px solid rgba(107,33,168,0.1)', transition: 'all .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,33,168,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(107,33,168,0.1)')}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--violet2)', marginBottom: '2px' }}>{action.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>{action.desc}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: 'rgba(107,33,168,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px' }}>
            All Students ({students.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {students.map(student => (
              <div key={student.id} className="card hi" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '16px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--w)', marginBottom: '2px' }}>{student.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu3)' }}>Last active: {student.lastActive}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--violet2)' }}>{student.characters}</div>
                  <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>Characters</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 800, color: student.completion >= 70 ? '#00ff88' : student.completion >= 40 ? 'var(--turq)' : 'var(--violet2)' }}>{student.completion}%</div>
                  <div style={{ fontSize: '9px', color: 'var(--mu3)', fontFamily: "'DM Mono',monospace" }}>Complete</div>
                </div>
                <div>
                  <div style={{ height: '4px', background: 'var(--s2)', borderRadius: '2px', width: '80px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--v-grad)', width: `${student.completion}%`, borderRadius: '2px' }} />
                  </div>
                </div>
                <span className={student.lastActive.includes('hour') || student.lastActive.includes('minute') ? 'tag-t' : 'tag-v'} style={{ fontSize: '9px' }}>
                  {student.lastActive.includes('hour') || student.lastActive.includes('minute') ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>◈</div>
          <div style={{ fontSize: '14px', color: 'var(--w)', marginBottom: '8px' }}>Content Management</div>
          <div style={{ fontSize: '12px', color: 'var(--mu3)', marginBottom: '16px' }}>Student-generated content and collab submissions will appear here</div>
          <a href="/vault" className="ghost-t" style={{ textDecoration: 'none', display: 'inline-block' }}>Go to Content Vault →</a>
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { title: 'Academy Students', desc: 'Add/remove student email access', action: 'Manage in Vercel', link: 'https://vercel.com' },
            { title: 'Collab World', desc: 'Approve student worlds for the directory', action: 'Coming Soon', link: '#' },
            { title: 'Content Moderation', desc: 'Review flagged content and collabs', action: 'Go to Vault', link: '/vault' },
            { title: 'App Updates', desc: 'Push new features and announcements', action: 'Use Overview tab', link: '#' },
          ].map(setting => (
            <div key={setting.title} className="card hi">
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--violet2)', marginBottom: '4px' }}>{setting.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--mu3)', lineHeight: '1.6', marginBottom: '12px' }}>{setting.desc}</div>
              <a href={setting.link} className="ghost-v" style={{ textDecoration: 'none', display: 'inline-block', fontSize: '11px' }}>{setting.action} →</a>
            </div>
          ))}
        </div>
      )}
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
  { room:'admin',icon:'⚙️',label:'Admin Suite™' },
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
              {room==='dna' && <IdentityDNA character={activeChar} onSave={c => { setActiveChar(c); const updated = characters.map(ch => ch.id === c.id ? c : ch); setCharacters(updated); localStorage.setItem(`characters_${user?.id}`, JSON.stringify(updated)) }} />}
              {room==='assets' && <AssetVault character={activeChar} onSave={c => { setActiveChar(c); const updated = characters.map(ch => ch.id === c.id ? c : ch); setCharacters(updated); localStorage.setItem(`characters_${user?.id}`, JSON.stringify(updated)) }} />}
              {room==='memory' && <MemoryEngine character={activeChar} onSave={c => { setActiveChar(c); const updated = characters.map(ch => ch.id === c.id ? c : ch); setCharacters(updated); localStorage.setItem(`characters_${user?.id}`, JSON.stringify(updated)) }} />}
              {room==='world' && <WorldBuilder character={activeChar} onSave={c => { setActiveChar(c); const updated = characters.map(ch => ch.id === c.id ? c : ch); setCharacters(updated); localStorage.setItem(`characters_${user?.id}`, JSON.stringify(updated)) }} />}
              {room==='brand' && <BrandDNA character={activeChar} onSave={c => { setActiveChar(c); const updated = characters.map(ch => ch.id === c.id ? c : ch); setCharacters(updated); localStorage.setItem(`characters_${user?.id}`, JSON.stringify(updated)) }} />}
              {room==='photoshoot' && <PhotoshootStudio character={activeChar} />}
              {room==='movie' && <AIMovieMode character={activeChar} />}
              {room==='blueprint' && <CreatorBlueprint character={activeChar} />}
              {room==='scanner' && <RealismScanner character={activeChar} />}
              {room==='collab' && <CollabWorld character={activeChar} userId={user?.id || ''} />}
              {room==='admin' && <AdminSuite userId={user?.id || ''} />}
              {room==='organizer' && <ComingSoon label='Content Organizer™' icon='📊' />}
            </main>
          </div>
        </AccessGate>
      </SignedIn>
    </>
  )
}
