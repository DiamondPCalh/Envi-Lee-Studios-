// app/api/generate/printful-test/route.ts
// TEMPORARY TEST — visit /api/generate/printful-test?productId=189&variantId=VARIANT_ID

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' })

  const productId = req.nextUrl.searchParams.get('productId') || '189'
  const variantId = req.nextUrl.searchParams.get('variantId')

  // Step 1: Get product variants
  const varRes = await fetch(`https://api.printful.com/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const varData = await varRes.json() as { result?: { product?: Record<string, unknown>; variants?: Record<string, unknown>[] } }
  const variants = varData.result?.variants || []
  const firstVariantId = variants[0] ? (variants[0].id as number) : null

  // Step 2: Test mockup with first variant if no variantId provided
  const testVariantId = variantId ? parseInt(variantId) : firstVariantId
  
  if (!testVariantId) return NextResponse.json({ error: 'No variant found', variants: [] })

  // Step 3: Test mockup generator
  const mockRes = await fetch(`https://api.printful.com/mockup-generator/create-task/${productId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variant_ids: [testVariantId],
      format: 'jpg',
      files: [{
        placement: 'front',
        image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        position: { area_width: 1800, area_height: 2400, width: 1800, height: 1800, top: 300, left: 0 }
      }]
    })
  })
  const mockData = await mockRes.json()

  return NextResponse.json({
    productId,
    testVariantId,
    firstVariantId,
    totalVariants: variants.length,
    sampleVariants: variants.slice(0, 3).map((v: Record<string, unknown>) => ({ id: v.id, name: v.name })),
    mockupStatus: mockRes.status,
    mockupResponse: mockData
  })
}
