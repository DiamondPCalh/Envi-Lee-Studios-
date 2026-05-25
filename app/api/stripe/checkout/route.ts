import { NextRequest, NextResponse } from 'next/server'

const PRICE_IDS: Record<string, string> = {
  starter: 'price_1TaQg5Ag0OLX9iPs8KYBBmM7',
  creator: 'price_1TaR1UAg0OLX9iPsuYj5opIs',
  pro: 'price_1TaR2sAg0OLX9iPsfiwTabg6',
  agency: 'price_1TaR52Ag0OLX9iPsud7TxRp2',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, email } = body

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe key not configured' }, { status: 500 })
    }

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 })
    }

    const baseUrl = 'https://envileecreatorstudios.com'

    const params = new URLSearchParams()
    params.append('mode', 'subscription')
    params.append('payment_method_types[]', 'card')
    params.append('line_items[0][price]', priceId)
    params.append('line_items[0][quantity]', '1')
    params.append('success_url', `${baseUrl}/?payment=success`)
    params.append('cancel_url', `${baseUrl}/pricing`)
    params.append('subscription_data[trial_period_days]', '7')
    if (email) params.append('customer_email', email)

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[stripe error]', JSON.stringify(data))
      return NextResponse.json({
        error: data?.error?.message ?? 'Stripe checkout failed'
      }, { status: 500 })
    }

    return NextResponse.json({ url: data.url })

  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
