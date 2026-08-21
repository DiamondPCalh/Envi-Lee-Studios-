// app/api/generate/printful-catalog/route.ts
// Gets Printful catalog products and variants for mockup generation
// No store products needed — works directly with catalog

import { NextRequest, NextResponse } from 'next/server'

const PF = 'https://api.printful.com'

async function pf<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${PF}${path}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const text = await res.text()
  try { return JSON.parse(text) as T }
  catch { return { error: text } as T }
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'PRINTFUL_API_KEY not configured' }, { status: 500 })

  const action = req.nextUrl.searchParams.get('action')
  const productId = req.nextUrl.searchParams.get('productId')
  const categoryId = req.nextUrl.searchParams.get('categoryId')

  // Get all categories
  if (action === 'categories') {
    const data = await pf<{ result?: unknown[] }>(apiKey, '/categories')
    return NextResponse.json({ categories: (data as { result?: unknown[] }).result || [] })
  }

  // Get products by category
  if (action === 'products' && categoryId) {
    const data = await pf<{ result?: unknown[] }>(apiKey, `/products?category_id=${categoryId}`)
    return NextResponse.json({ products: (data as { result?: unknown[] }).result || [] })
  }

  // Get all products (limited)
  if (action === 'products') {
    const data = await pf<{ result?: unknown[] }>(apiKey, '/products')
    return NextResponse.json({ products: ((data as { result?: unknown[] }).result || []).slice(0, 100) })
  }

  // Get specific product with variants
  if (action === 'variants' && productId) {
    const data = await pf<{ result?: { variants?: unknown[]; product?: unknown } }>(apiKey, `/products/${productId}`)
    const result = (data as { result?: { variants?: unknown[]; product?: unknown } }).result
    return NextResponse.json({
      product: result?.product,
      variants: result?.variants || []
    })
  }

  return NextResponse.json({ error: 'action required: categories, products, variants' }, { status: 400 })
}
