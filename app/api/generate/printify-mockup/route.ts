// app/api/generate/printify-mockup/route.ts
// Generates exact product mockups using Printify API

import { NextRequest, NextResponse } from 'next/server'

const PRINTIFY_API = 'https://api.printify.com/v1'

async function getShops(apiKey: string) {
  const res = await fetch(`${PRINTIFY_API}/shops.json`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  return res.json()
}

async function getCatalog(apiKey: string) {
  const res = await fetch(`${PRINTIFY_API}/catalog/blueprints.json`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  return res.json()
}

async function getBlueprintVariants(apiKey: string, blueprintId: string, printProviderId: string) {
  const res = await fetch(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  return res.json()
}

async function uploadImage(apiKey: string, imageBase64: string, fileName: string) {
  // Convert base64 to upload
  const res = await fetch(`${PRINTIFY_API}/uploads/images.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_name: fileName || 'design.jpg',
      contents: imageBase64.split(',')[1], // Remove data:image/... prefix
    }),
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { action, blueprintId, printProviderId, variantIds, imageBase64, imageUrl, placementId, shopId } = await req.json()
    const apiKey = process.env.PRINTIFY_API_KEY

    if (!apiKey) return NextResponse.json({ error: 'PRINTIFY_API_KEY not configured in Vercel' }, { status: 500 })

    if (action === 'get_shops') {
      const data = await getShops(apiKey)
      return NextResponse.json({ success: true, shops: data })
    }

    if (action === 'get_catalog') {
      const data = await getCatalog(apiKey)
      return NextResponse.json({ success: true, blueprints: data })
    }

    if (action === 'get_variants') {
      if (!blueprintId || !printProviderId) return NextResponse.json({ error: 'blueprintId and printProviderId required' }, { status: 400 })
      const data = await getBlueprintVariants(apiKey, blueprintId, printProviderId)
      return NextResponse.json({ success: true, variants: data })
    }

    if (action === 'upload_image') {
      if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })
      const data = await uploadImage(apiKey, imageBase64, 'design.jpg')
      return NextResponse.json({ success: true, image: data })
    }

    if (action === 'generate_mockup') {
      if (!blueprintId || !printProviderId || !variantIds || !imageBase64) {
        return NextResponse.json({ error: 'blueprintId, printProviderId, variantIds, imageBase64 required' }, { status: 400 })
      }

      // First upload the image
      const uploadData = await uploadImage(apiKey, imageBase64, 'design.jpg')
      if (!uploadData.id) return NextResponse.json({ error: 'Image upload failed', details: uploadData }, { status: 500 })

      // Create product to get mockups
      const targetShopId = shopId
      if (!targetShopId) {
        // Get first shop
        const shops = await getShops(apiKey)
        const firstShop = shops[0]
        if (!firstShop) return NextResponse.json({ error: 'No Printify shops found' }, { status: 400 })

        const createRes = await fetch(`${PRINTIFY_API}/shops/${firstShop.id}/products.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Mockup Preview',
            blueprint_id: parseInt(blueprintId),
            print_provider_id: parseInt(printProviderId),
            variants: variantIds.map((id: number) => ({ id, price: 1000, is_enabled: true })),
            print_areas: [{
              variant_ids: variantIds,
              placeholders: [{
                position: placementId || 'front',
                images: [{ id: uploadData.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
              }],
            }],
          }),
        })
        const createData = await createRes.json()
        const mockups = createData.images || []
        return NextResponse.json({ success: true, mockups, productId: createData.id })
      }
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
    const shops = await getShops(apiKey)
    return NextResponse.json({ status: 'Printify mockup API ready', shops })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
