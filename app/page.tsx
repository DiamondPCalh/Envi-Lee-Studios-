import { NextRequest, NextResponse } from 'next/server'

async function generate(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return 'API key not configured'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
  const d = await res.json()
  return d.content?.[0]?.text ?? ''
}

export async function POST(req: NextRequest) {
  try {
    const { tool, ...params } = await req.json()

    const prompts: Record<string, string> = {
      collection: `You are a POD collection strategist and brand designer.
Collection name: ${params.name || 'Untitled Collection'}
Theme or vibe: ${params.theme || 'luxury fashion'}
Target audience: ${params.audience || 'Black women aged 22-40'}
Season or occasion: ${params.season || 'All season'}
Number of pieces: ${params.pieces || '6'}
Price range: ${params.priceRange || '$30-$100'}

Build a complete collection plan:

COLLECTION OVERVIEW:
2-3 sentences describing the collection story and brand vision.

COLLECTION NAME IDEAS (5 options):
Creative, memorable names that fit the vibe.

PIECES (${params.pieces || '6'} items):
For each piece write:
- Item name
- Description (colors, design, style)
- Suggested retail price
- Best platform to sell on
- TikTok content idea for this piece

COLOR PALETTE:
5 hex color codes with names that define this collection.

LAUNCH STRATEGY:
5 specific steps to launch this collection on TikTok and Etsy.

COLLECTION HASHTAGS:
15 hashtags for the entire collection.`,

      profit: `You are a POD profit calculator and business advisor.
Product type: ${params.product || 'T-Shirt'}
Selling price: $${params.sellPrice || '35'}
Printify base cost: $${params.baseCost || '12'}
Platform: ${params.platform || 'Etsy'}
Monthly sales goal: ${params.monthlySales || '50'} units
Shipping charge to customer: $${params.shipping || '4.99'}

Calculate and analyze:

PROFIT BREAKDOWN (per unit):
- Selling price: $${params.sellPrice || '35'}
- Printify cost: $${params.baseCost || '12'}
- Platform fees (calculated for ${params.platform || 'Etsy'}): $X.XX
- Payment processing (3%): $X.XX
- Net profit per unit: $X.XX
- Profit margin: X%

MONTHLY PROJECTIONS:
- ${params.monthlySales || '50'} units sold
- Gross revenue: $X
- Total costs: $X
- Net profit: $X

YEARLY PROJECTION:
- Revenue, costs, and net profit at current rate

PRICE OPTIMIZATION:
What price would maximize profit while staying competitive? Give 3 price point options with profit margin for each.

SCALE STRATEGY:
How to reach $5k, $10k, and $25k per month with this product. Specific and actionable.

COST REDUCTION TIPS:
3 ways to lower costs and increase margin on this specific product.`
    }

    const prompt = prompts[tool]
    if (!prompt) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })

    const result = await generate(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[tools]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
