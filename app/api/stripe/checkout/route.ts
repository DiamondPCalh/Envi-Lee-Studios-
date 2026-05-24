import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20',
})

const PRICE_IDS = {
  starter: 'price_1TaQg5Ag0OLX9iPs8KYBBmM7',
  creator: 'price_1TaR1UAg0OLX9iPsuYj5opIs',
  pro: 'price_1TaR2sAg0OLX9iPsfiwTabg6',
  agency: 'price_1TaR52Ag0OLX9iPsud7TxRp2',
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json()

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://envi-lee-studios.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/?payment=success&plan=${plan}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: email,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
        trial_period_days: 7,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
