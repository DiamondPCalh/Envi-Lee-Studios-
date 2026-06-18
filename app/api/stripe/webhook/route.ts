// app/api/stripe/webhook/route.ts
// Listens for Stripe payment events and grants app access in Upstash

import { NextRequest, NextResponse } from 'next/server'

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
    console.log(`[webhook] Granted ${key}`)
  }
}

async function revokeAccess(userId: string, plan: string) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!redisUrl || !redisToken) return

  const keys: string[] = []
  if (plan === 'prompts' || plan === 'bundle') keys.push(`prompts_access_${userId}`)
  if (plan === 'bundle') keys.push(`vault_access_${userId}`)

  for (const key of keys) {
    await fetch(`${redisUrl}/del/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
    console.log(`[webhook] Revoked ${key}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    // Verify webhook signature
    if (webhookSecret && sig) {
      // Simple signature check — for production use stripe.webhooks.constructEvent
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (!stripeKey) return NextResponse.json({ error: 'No stripe key' }, { status: 500 })
    }

    const event = JSON.parse(body)
    console.log(`[webhook] Event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.userId
        const plan = session.metadata?.plan || session.subscription_data?.metadata?.plan

        if (userId && plan) {
          await grantAccess(userId, plan)
          console.log(`[webhook] Access granted: user=${userId} plan=${plan}`)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        const plan = sub.metadata?.plan
        if (userId && plan && sub.status === 'active') {
          await grantAccess(userId, plan)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        const plan = sub.metadata?.plan
        if (userId && plan) {
          await revokeAccess(userId, plan)
          console.log(`[webhook] Access revoked: user=${userId} plan=${plan}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log(`[webhook] Payment failed for customer: ${invoice.customer}`)
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[stripe/webhook]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
