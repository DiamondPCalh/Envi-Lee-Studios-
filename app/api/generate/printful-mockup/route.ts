// app/api/generate/printful-mockup/route.ts
// Generates exact product mockups using Printful API

import { NextRequest, NextResponse } from 'next/server'

const PRINTFUL_API = 'https://api.printful.com'

// ── GET PRODUCTS ──────────────────────────────────────────────
async function getProducts(apiKey: string) {
  const res = await fetch(`${PRINTFUL_API}/products`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  return res.json()
}

// ── GET PRODUCT VARIANTS ──────────────────────────────────────
async function getProductVariants(apiKey: string, productId: string) {
  const res = await fetch(`${PRINTFUL_API}/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  return res.json()
}

// ── GENERATE MOCKUP ───────────────────────────────────────────
async function generateMockup(apiKey: string, variantId: number, imageUrl: string, placement: string) {
  const res = await fetch(`${PRINTFUL_API}/mockup-generator/create-task/${variantId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variant_ids: [variantId],
      format: 'jpg',
      files: [{
        placement: placement || 'front',
        image_url: imageUrl,
        position: {
          area_width: 1800,
          area_height: 2400,
          width: 1800,
          height: 1800,
          top: 300,
          left: 0,
        },
      }],
    }),
  })
  return res.json()
}

// ── GET MOCKUP RESULT ─────────────────────────────────────────
async function getMockupResult(apiKey: string, taskKey: string) {
  const res = await fetch(`${PRINTFUL_API}/mockup-generator/task?task_key=${taskKey}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { action, productId, variantId, imageUrl, placement, taskKey } = await req.json()
    const apiKey = process.env.PRINTFUL_API_KEY

    if (!apiKey) return NextResponse.json({ error: 'PRINTFUL_API_KEY not configured in Vercel' }, { status: 500 })

    if (action === 'get_products') {
      const data = await getProducts(apiKey)
      return NextResponse.json({ success: true, products: data.result || [] })
    }

    if (action === 'get_variants') {
      if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
      const data = await getProductVariants(apiKey, productId)
      return NextResponse.json({ success: true, product: data.result })
    }

    if (action === 'generate_mockup') {
      if (!variantId || !imageUrl) return NextResponse.json({ error: 'variantId and imageUrl required' }, { status: 400 })
      const data = await generateMockup(apiKey, variantId, imageUrl, placement || 'front')
      return NextResponse.json({ success: true, taskKey: data.result?.task_key, status: data.result?.status })
    }

    if (action === 'get_result') {
      if (!taskKey) return NextResponse.json({ error: 'taskKey required' }, { status: 400 })
      const data = await getMockupResult(apiKey, taskKey)
      const mockups = data.result?.mockups || []
      const imageUrls = mockups.flatMap((m: Record<string, unknown>) => m.mockup_url ? [m.mockup_url] : [])
      return NextResponse.json({
        success: true,
        status: data.result?.status,
        mockups: imageUrls,
        raw: mockups,
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
      const data = await getProducts(apiKey)
      return NextResponse.json({ success: true, products: data.result || [] })
    }
    return NextResponse.json({ status: 'Printful mockup API ready' })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
