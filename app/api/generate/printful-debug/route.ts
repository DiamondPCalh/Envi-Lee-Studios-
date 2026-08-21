// app/api/generate/printful-debug/route.ts
// TEMPORARY — shows exact variant structure
// Visit: /api/generate/printful-debug?productId=YOUR_PRODUCT_ID

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) {
    // List store products with IDs
    const res = await fetch('https://api.printful.com/store/products?limit=10', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const data = await res.json()
    return NextResponse.json({
      storeProducts: (data.result || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        synced: p.synced,
      }))
    })
  }

  // Get full product details
  const res = await fetch(`https://api.printful.com/store/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data = await res.json()
  const syncVariants = data.result?.sync_variants || []

  return NextResponse.json({
    productId,
    syncVariants: syncVariants.map((v: Record<string, unknown>) => ({
      id: v.id,
      variant_id: v.variant_id,
      name: v.name,
      sku: v.sku,
      product: (v.product as Record<string, unknown>)?.name,
    }))
  })
}
