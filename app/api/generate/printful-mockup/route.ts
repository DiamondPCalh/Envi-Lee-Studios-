// app/api/generate/printful-mockup/route.ts
import { NextRequest, NextResponse } from 'next/server'

const PRINTFUL_API = 'https://api.printful.com'

// ── SAFE JSON PARSE ───────────────────────────────────────────
async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  try { return JSON.parse(text) } 
  catch { return { error: text, _raw: text } }
}

function headers(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-PF-Store-Id': '',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, productId, variantId, imageUrl, imageBase64, placement, taskKey } = body
    const apiKey = process.env.PRINTFUL_API_KEY
    const falKey = process.env.FAL_API_KEY

    if (!apiKey) return NextResponse.json({ error: 'PRINTFUL_API_KEY not configured in Vercel' }, { status: 500 })

    // ── GET PRODUCTS ─────────────────────────────────────────
    if (action === 'get_products' || !action) {
      const res = await fetch(`${PRINTFUL_API}/store/products`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (!res.ok) {
        // Try catalog instead
        const catRes = await fetch(`${PRINTFUL_API}/products`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        })
        const catData = await catRes.json()
        return NextResponse.json({ success: true, products: catData.result?.slice(0, 50) || [] })
      }
      return NextResponse.json({ success: true, products: data.result?.slice(0, 50) || [] })
    }

    // ── GET VARIANTS ──────────────────────────────────────────
    if (action === 'get_variants') {
      if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
      const res = await fetch(`${PRINTFUL_API}/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: 'Error: ' + JSON.stringify(data) }, { status: res.status })
      return NextResponse.json({ success: true, product: data.result })
    }

    // ── UPLOAD DESIGN & GET PUBLIC URL ────────────────────────
    if (action === 'upload_design') {
      // Upload base64 image to fal.ai to get a public URL
      // Printful REQUIRES a public URL — cannot accept base64
      if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
      if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY required to upload images' }, { status: 500 })

      try {
        const blob = await fetch(imageBase64).then(r => r.blob())
        const fd = new FormData()
        fd.append('file', blob, 'design.jpg')
        const upRes = await fetch('https://fal.run/fal-ai/upload', {
          method: 'POST',
          headers: { 'Authorization': `Key ${falKey}` },
          body: fd,
        })
        if (!upRes.ok) {
          const err = await upRes.text()
          return NextResponse.json({ error: 'Upload failed: ' + err }, { status: 500 })
        }
        const upData = await upRes.json()
        return NextResponse.json({ success: true, imageUrl: upData.url })
      } catch (e) {
        return NextResponse.json({ error: 'Upload error: ' + (e as Error).message }, { status: 500 })
      }
    }

    // ── GENERATE MOCKUP ───────────────────────────────────────
    if (action === 'generate_mockup') {
      if (!variantId) return NextResponse.json({ error: 'variantId required' }, { status: 400 })

      let publicImageUrl = imageUrl

      // If no public URL, upload base64 to fal first
      if (!publicImageUrl && imageBase64) {
        if (!falKey) return NextResponse.json({ error: 'FAL_API_KEY required to get public image URL' }, { status: 500 })
        try {
          const blob = await fetch(imageBase64).then(r => r.blob())
          const fd = new FormData()
          fd.append('file', blob, 'design.jpg')
          const upRes = await fetch('https://fal.run/fal-ai/upload', {
            method: 'POST',
            headers: { 'Authorization': `Key ${falKey}` },
            body: fd,
          })
          if (upRes.ok) {
            const upData = await upRes.json()
            publicImageUrl = upData.url
          }
        } catch (e) {
          console.error('Upload error:', e)
        }
      }

      if (!publicImageUrl) {
        return NextResponse.json({ error: 'Could not get a public image URL for Printful. Please paste a direct image URL instead.' }, { status: 400 })
      }

      const mockupBody = {
        variant_ids: [parseInt(variantId)],
        format: 'jpg',
        files: [{
          placement: placement || 'front',
          image_url: publicImageUrl,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 1800,
            top: 300,
            left: 0,
          },
        }],
      }

      const res = await fetch(`${PRINTFUL_API}/mockup-generator/create-task/${parseInt(variantId)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mockupBody),
      })
      const data = await safeJson(res)

      if (!res.ok) {
        return NextResponse.json({
          error: 'Printful API error ' + res.status + ': ' + JSON.stringify(data),
          raw: data,
          status: res.status,
        }, { status: res.status || 500 })
      }

      if (!data.result?.task_key) {
        return NextResponse.json({
          error: 'No task key returned from Printful. Response: ' + JSON.stringify(data.result || data),
          raw: data,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        taskKey: data.result.task_key,
        status: data.result.status,
      })
    }

    // ── GET MOCKUP RESULT ─────────────────────────────────────
    if (action === 'get_result') {
      if (!taskKey) return NextResponse.json({ error: 'taskKey required' }, { status: 400 })
      const res = await fetch(`${PRINTFUL_API}/mockup-generator/task?task_key=${taskKey}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      const data = await safeJson(res)
      const result = data.result
      const mockupUrls = result?.mockups?.map((m: Record<string, unknown>) => m.mockup_url).filter(Boolean) || []
      return NextResponse.json({
        success: true,
        status: result?.status,
        mockups: mockupUrls,
        raw: result,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/printful-mockup]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'PRINTFUL_API_KEY not configured' }, { status: 500 })
    const action = req.nextUrl.searchParams.get('action')
    if (action === 'products') {
      // Try store products first
      const res = await fetch(`${PRINTFUL_API}/store/products`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (!res.ok || !data.result?.length) {
        // Fall back to catalog
        const catRes = await fetch(`${PRINTFUL_API}/products`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        })
        const catData = await catRes.json()
        return NextResponse.json({ success: true, products: catData.result?.slice(0, 50) || [] })
      }
      return NextResponse.json({ success: true, products: data.result?.slice(0, 50) || [] })
    }
    return NextResponse.json({ status: 'Printful API ready', apiKey: 'configured' })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
