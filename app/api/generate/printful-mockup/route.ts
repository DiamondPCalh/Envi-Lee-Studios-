// app/api/generate/printful-mockup/route.ts
import { NextRequest, NextResponse } from 'next/server'

const PRINTFUL_API = 'https://api.printful.com'

function authHeader(apiKey: string) {
  return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
}

async function pf<T = unknown>(apiKey: string, path: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${PRINTFUL_API}${path}`, {
    method,
    headers: authHeader(apiKey),
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let data: T
  try { data = JSON.parse(text) as T }
  catch { data = { error: text } as T }
  return { ok: res.ok, status: res.status, data }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, productId, variantId, imageUrl, imageBase64, placement, taskKey } = body
    const apiKey = process.env.PRINTFUL_API_KEY
    const falKey = process.env.FAL_API_KEY

    if (!apiKey) return NextResponse.json({ error: 'PRINTFUL_API_KEY not configured' }, { status: 500 })

    // ── GET PRODUCTS ──────────────────────────────────────────
    if (action === 'get_products' || !action) {
      const { data } = await pf<{ result?: unknown[] }>(apiKey, '/store/products')
      const products = (data as { result?: unknown[] }).result
      if (!products?.length) {
        const cat = await pf<{ result?: unknown[] }>(apiKey, '/products')
        return NextResponse.json({ success: true, products: (cat.data.result || []).slice(0, 50) })
      }
      return NextResponse.json({ success: true, products: products.slice(0, 50) })
    }

    // ── GET VARIANTS ──────────────────────────────────────────
    if (action === 'get_variants') {
      if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
      const { ok, data } = await pf<{ result?: unknown }>(apiKey, `/products/${productId}`)
      if (!ok) return NextResponse.json({ error: JSON.stringify(data) }, { status: 400 })
      return NextResponse.json({ success: true, product: (data as { result?: unknown }).result })
    }

    // ── UPLOAD DESIGN (get public URL via fal) ────────────────
    if (action === 'upload_design') {
      if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
      if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY required' }, { status: 500 })
      const blob = await fetch(imageBase64).then(r => r.blob())
      const fd = new FormData()
      fd.append('file', blob, 'design.jpg')
      const upRes = await fetch('https://fal.run/fal-ai/upload', {
        method: 'POST',
        headers: { 'Authorization': `Key ${falKey}` },
        body: fd,
      })
      if (!upRes.ok) return NextResponse.json({ error: 'Upload failed: ' + await upRes.text() }, { status: 500 })
      const upData = await upRes.json() as { url?: string }
      return NextResponse.json({ success: true, imageUrl: upData.url })
    }

    // ── GENERATE MOCKUP ───────────────────────────────────────
    if (action === 'generate_mockup') {
      if (!variantId) return NextResponse.json({ error: 'variantId required' }, { status: 400 })

      let publicUrl = imageUrl as string | undefined

        // Upload base64 to Cloudinary to get permanent public URL
      if (!publicUrl && imageBase64) {
        // Try Cloudinary first
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const cloudKey = process.env.CLOUDINARY_API_KEY
        const cloudSecret = process.env.CLOUDINARY_API_SECRET

        if (cloudName && cloudKey && cloudSecret) {
          const crypto = await import('crypto')
          const timestamp = Math.round(Date.now() / 1000)
          const folder = 'envi-lee-pod'
          const sigStr = `folder=${folder}&timestamp=${timestamp}${cloudSecret}`
          const sig = crypto.createHash('sha1').update(sigStr).digest('hex')
          const fd = new FormData()
          fd.append('file', imageBase64 as string)
          fd.append('api_key', cloudKey)
          fd.append('timestamp', timestamp.toString())
          fd.append('signature', sig)
          fd.append('folder', folder)
          const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST', body: fd,
          })
          if (upRes.ok) {
            const upData = await upRes.json() as { secure_url?: string }
            publicUrl = upData.secure_url
          }
        }
        
        // Fallback to fal.ai if Cloudinary not configured
        if (!publicUrl && falKey) {
          const blob = await fetch(imageBase64 as string).then(r => r.blob())
          const fd = new FormData()
          fd.append('file', blob, 'design.jpg')
          const upRes = await fetch('https://fal.run/fal-ai/upload', {
            method: 'POST',
            headers: { 'Authorization': `Key ${falKey}` },
            body: fd,
          })
          if (upRes.ok) {
            const upData = await upRes.json() as { url?: string }
            publicUrl = upData.url
          }
        }
      }

      if (!publicUrl) return NextResponse.json({ error: 'Could not get a public image URL. Please paste an image URL directly.' }, { status: 400 })

      const mockupBody = {
        variant_ids: [parseInt(variantId as string)],
        format: 'jpg',
        files: [{
          placement: (placement as string) || 'front',
          image_url: publicUrl,
          position: { area_width: 1800, area_height: 2400, width: 1800, height: 1800, top: 300, left: 0 },
        }],
      }

      const { ok, status, data } = await pf<{ result?: { task_key?: string; status?: string }; error?: string }>(
        apiKey, `/mockup-generator/create-task/${parseInt(variantId as string)}`, 'POST', mockupBody
      )

      if (!ok) return NextResponse.json({ error: 'Printful error ' + status + ': ' + JSON.stringify(data) }, { status: status || 500 })

      const taskResult = (data as { result?: { task_key?: string; status?: string } }).result
      if (!taskResult?.task_key) {
        return NextResponse.json({ error: 'No task key from Printful: ' + JSON.stringify(data) }, { status: 500 })
      }

      return NextResponse.json({ success: true, taskKey: taskResult.task_key, status: taskResult.status })
    }

    // ── GET RESULT ────────────────────────────────────────────
    if (action === 'get_result') {
      if (!taskKey) return NextResponse.json({ error: 'taskKey required' }, { status: 400 })
      const { data } = await pf<{ result?: { status?: string; mockups?: Array<{ mockup_url?: string }> } }>(
        apiKey, `/mockup-generator/task?task_key=${taskKey as string}`
      )
      const r = (data as { result?: { status?: string; mockups?: Array<{ mockup_url?: string }> } }).result
      const urls = r?.mockups?.map(m => m.mockup_url).filter(Boolean) || []
      return NextResponse.json({ success: true, status: r?.status, mockups: urls })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('[printful-mockup]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'PRINTFUL_API_KEY not configured' }, { status: 500 })
    const action = req.nextUrl.searchParams.get('action')
    if (action === 'products') {
      const { data } = await pf<{ result?: unknown[] }>(apiKey, '/store/products')
      const products = (data as { result?: unknown[] }).result
      if (!products?.length) {
        const cat = await pf<{ result?: unknown[] }>(apiKey, '/products')
        return NextResponse.json({ success: true, products: (cat.data.result || []).slice(0, 50) })
      }
      return NextResponse.json({ success: true, products: products.slice(0, 50) })
    }
    return NextResponse.json({ status: 'Printful API ready' })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
