// app/api/stripe/checkout/route.ts
// Handles Stripe checkout for all plans including Prompt Bank and Bundle
// Supports both GET (?plan=prompts) and POST ({ plan: 'prompts' })

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const PRICE_IDS: Record<string, string> = {
  // Creator Studio plans
  starter: 'price_1TaQg5Ag0OLX9iPs8KYBBmM7',
  creator: 'price_1TaR1UAg0OLX9iPsuYj5opIs',
  pro:     'price_1TaR2sAg0OLX9iPsfiwTabg6',
  agency:  'price_1TaR52Ag0OLX9iPsud7TxRp2',
  // Prompt Bank plans — create these in Stripe dashboard
  // Go to Stripe → Products → Add Product → $27/month recurring → copy price ID
  prompts: process.env.STRIPE_PRICE_PROMPTS ?? '',
  // Go to Stripe → Products → Add Product → $47/month recurring → copy price ID
  bundle:  process.env.STRIPE_PRICE_BUNDLE ?? '',
}

// After successful payment — grant access in Upstash
async function grantAccess(userId: string, plan: string) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!redisUrl || !redisToken) return

  const keys: string[] = []
  if (plan === 'prompts' || plan === 'bundle') keys.push(`prompts_access_${userId}`)
  if (plan === 'bundle') keys.push(`vault_access_${userId}`)

  for (const key of keys) {
    await fetch(`${redisUrl}/set/${key}/true`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
  }
}

async function createSession(plan: string, email?: string, userId?: string) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) throw new Error('Stripe key not configured')

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new Error(`Invalid plan: ${plan}. Add STRIPE_PRICE_PROMPTS and STRIPE_PRICE_BUNDLE to Vercel.`)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://envileecreatorstudios.com'

  const params = new URLSearchParams()
  params.append('mode', 'subscription')
  params.append('payment_method_types[]', 'card')
  params.append('line_items[0][price]', priceId)
  params.append('line_items[0][quantity]', '1')
  params.append('success_url', `${baseUrl}/prompts?payment=success&plan=${plan}`)
  params.append('cancel_url', `${baseUrl}/prompts`)
  params.append('subscription_data[trial_period_days]', '7')
  if (email) params.append('customer_email', email)
  if (userId) params.append('client_reference_id', userId)
  // Metadata for webhook
  params.append('subscription_data[metadata][plan]', plan)
  if (userId) params.append('subscription_data[metadata][userId]', userId)

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Stripe checkout failed')
  return data
}

// GET — used by Prompt Bank paywall (?plan=prompts or ?plan=bundle)
export async function GET(req: NextRequest) {
  try {
    const plan = req.nextUrl.searchParams.get('plan') ?? ''
    const user =await auth()
    const email = user?.emailAddresses?.[0]?.emailAddress

    const data = await createSession(plan, email, userId
    return NextResponse.redirect(data.url)

  } catch (err) {
    console.error('[stripe/checkout GET]', err)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://envileecreatorstudios.com'
    return NextResponse.redirect(`${baseUrl}/prompts?error=checkout_failed`)
  }
}

// POST — used by pricing pages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, email } = body
    const user =await auth()

    const data = await createSession(plan, email || user?.emailAddresses?.[0]?.emailAddress, userId
    return NextResponse.json({ url: data.url })

  } catch (err) {
    console.error('[stripe/checkout POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
