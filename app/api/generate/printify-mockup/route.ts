// app/api/generate/printify-mockup/route.ts
import { NextRequest, NextResponse } from 'next/server'

const PRINTIFY_API = 'https://api.printify.com/v1'

function headers(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': 'EnviLeeCreatorStudios/1.0',
    'Content-Type': 'application/json',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, shopId, blueprintId, printProviderId, variantIds, imageBase64, placementId } = body
    const apiKey = process.env.PRINTIFY_API_KEY

    if (!apiKey) return NextResponse.json({ error: 'PRINTIFY_API_KEY not configured in Vercel' }, { status: 500 })

    // ── GET SHOPS ─────────────────────────────────────────────
    if (action === 'get_shops') {
      const res = await fetch(`${PRINTIFY_API}/shops.json`, { headers: headers(apiKey) })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: 'Printify error: ' + JSON.stringify(data) }, { status: res.status })
      return NextResponse.json({ success: true, shops: data })
    }

    // ── GET YOUR PRODUCTS in a shop ───────────────────────────
    if (action === 'get_products') {
      if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 })
      const res = await fetch(`${PRINTIFY_API}/shops/${shopId}/products.json`, { headers: headers(apiKey) })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: 'Printify error: ' + JSON.stringify(data) }, { status: res.status })
      return NextResponse.json({ success: true, products: data.data || [] })
    }

    // ── UPLOAD IMAGE ──────────────────────────────────────────
    if (action === 'upload_image') {
      if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
      const res = await fetch(`${PRINTIFY_API}/uploads/images.json`, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({ file_name: 'design.png', contents: base64Data }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: 'Upload error: ' + JSON.stringify(data) }, { status: res.status })
      return NextResponse.json({ success: true, imageId: data.id, imageUrl: data.preview_url })
    }

    // ── GET BLUEPRINT PRINT PROVIDERS ─────────────────────────
    if (action === 'get_print_providers') {
      if (!blueprintId) return NextResponse.json({ error: 'blueprintId required' }, { status: 400 })
      const res = await fetch(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers.json`, { headers: headers(apiKey) })
      const data = await res.json()
      return NextResponse.json({ success: true, printProviders: data })
    }

    // ── GET VARIANTS ──────────────────────────────────────────
    if (action === 'get_variants') {
      if (!blueprintId || !printProviderId) return NextResponse.json({ error: 'blueprintId and printProviderId required' }, { status: 400 })
      const res = await fetch(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, { headers: headers(apiKey) })
      const data = await res.json()
      return NextResponse.json({ success: true, variants: data.variants || [] })
    }

    // ── GENERATE MOCKUP ───────────────────────────────────────
    if (action === 'generate_mockup') {
      if (!shopId || !blueprintId || !printProviderId || !imageBase64) {
        return NextResponse.json({ error: 'shopId, blueprintId, printProviderId and imageBase64 required' }, { status: 400 })
      }

      // Step 1 — Upload image
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
      const uploadRes = await fetch(`${PRINTIFY_API}/uploads/images.json`, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({ file_name: 'design.png', contents: base64Data }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.id) {
        return NextResponse.json({ error: 'Image upload failed: ' + JSON.stringify(uploadData) }, { status: 500 })
      }

      // Step 2 — Create product to get mockups
      const variantList = variantIds || [uploadData.id]
      const createRes = await fetch(`${PRINTIFY_API}/shops/${shopId}/products.json`, {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({
          title: 'Envi Lee Mockup Preview',
          blueprint_id: parseInt(blueprintId),
          print_provider_id: parseInt(printProviderId),
          variants: (variantIds || []).map((id: number) => ({ id, price: 1000, is_enabled: true })),
          print_areas: [{
            variant_ids: variantIds || [],
            placeholders: [{
              position: placementId || 'front',
              images: [{ id: uploadData.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
            }],
          }],
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) {
        return NextResponse.json({ error: 'Product creation failed: ' + JSON.stringify(createData) }, { status: 500 })
      }

      const mockups = createData.images || []
      return NextResponse.json({
        success: true,
        mockups: mockups.map((m: Record<string, unknown>) => m.src),
        productId: createData.id,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('[/api/generate/printify-mockup]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.PRINTIFY_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'PRINTIFY_API_KEY not configured' }, { status: 500 })
    const res = await fetch(`${PRINTIFY_API}/shops.json`, { headers: headers(apiKey) })
    const data = await res.json()
    return NextResponse.json({ status: 'Printify API connected', shops: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
