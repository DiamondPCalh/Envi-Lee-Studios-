'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    color: '#6c567e',
    neon: '#9b6dff',
    description: 'Perfect for new POD sellers just getting started',
    trial: '7-day free trial',
    tools: [
      'Mockup Generator',
      'Product Listing Writer',
      'Description Writer',
      'AI Image Prompt Builder',
      '50 generations per month',
    ],
    notIncluded: [
      'CineFlow AI',
      'AI Studios',
      'Video Generator',
      'Brand Deals',
      'Lip Sync Studio',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 39,
    color: '#6c567e',
    neon: '#9b6dff',
    description: 'For active creators making content every day',
    trial: '7-day free trial',
    popular: true,
    tools: [
      'Everything in Starter',
      'CineFlow AI — 6 tools',
      'Image Generator',
      'Collection Builder',
      'Profit Calculator',
      '150 generations per month',
    ],
    notIncluded: [
      'AI Studios',
      'Video Generator',
      'Brand Deals',
      'Lip Sync Studio',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 69,
    color: '#00c853',
    neon: '#00c853',
    description: 'For serious creators running a full business',
    trial: '7-day free trial',
    tools: [
      'Everything in Creator',
      'AI Studios — 6 tools',
      'Video Generator (Kling AI)',
      'Brand Deals',
      'Lip Sync Studio',
      'Unlimited generations',
    ],
    notIncluded: [],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    color: '#e8c76a',
    neon: '#e8c76a',
    description: 'For boutiques and agencies with teams',
    trial: '7-day free trial',
    tools: [
      'Everything in Pro',
      'Creator Try-On Studio',
      'Up to 5 team seats',
      'Priority support',
      'Unlimited generations',
    ],
    notIncluded: [],
  },
]

export default function PricingPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState<string | null>(null)

  async function subscribe(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          userId: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
        }),
      })
      const data = await res.json()
      console.log('Stripe response:', data)
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error: ' + (data.error || 'No checkout URL returned'))
      }
    } catch (e) {
      alert('Error: ' + (e as Error).message)
      console.error(e)
    }
    setLoading(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', padding: '60px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'inline-block', background: 'rgba(155,109,255,0.12)', border: '0.5px solid rgba(155,109,255,0.3)', borderRadius: '20px', padding: '5px 16px', fontSize: '10px', color: '#9b6dff', fontFamily: "'DM Mono',monospace", letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
          7-day free trial on all plans
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: '#f8f0ff', marginBottom: '16px', letterSpacing: '-.5px' }}>
          Choose your <span style={{ color: '#9b6dff' }}>plan</span>
        </div>
        <div style={{ fontSize: '14px', color: '#5a4070', maxWidth: '500px', margin: '0 auto', lineHeight: '1.7' }}>
          Start with a 7-day free trial. Cancel anytime. No contracts.
        </div>
      </div>

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', maxWidth: '1100px', margin: '0 auto 60px' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{
            background: '#130d1a',
            border: `0.5px solid ${plan.popular ? plan.neon : 'rgba(108,86,126,0.2)'}`,
            borderRadius: '16px',
            padding: '28px 22px',
            position: 'relative',
            boxShadow: plan.popular ? `0 0 30px rgba(155,109,255,0.1)` : 'none',
            transition: 'all .2s',
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#9b6dff', color: '#000', fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', fontFamily: "'DM Mono',monospace", letterSpacing: '.5px', whiteSpace: 'nowrap' }}>
                MOST POPULAR
              </div>
            )}

            {/* Plan name */}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '10px', color: plan.neon, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{plan.name}</div>

            {/* Price */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '42px', fontWeight: 800, color: '#f8f0ff' }}>${plan.price}</span>
              <span style={{ fontSize: '13px', color: '#5a4070', marginLeft: '4px' }}>/month</span>
            </div>

            <div style={{ fontSize: '11px', color: '#5a4070', marginBottom: '6px' }}>{plan.description}</div>
            <div style={{ fontSize: '10px', color: plan.neon, fontFamily: "'DM Mono',monospace", marginBottom: '20px' }}>✦ {plan.trial}</div>

            {/* CTA Button */}
            <button
              onClick={() => subscribe(plan.id)}
              disabled={loading === plan.id}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: loading === plan.id ? 'rgba(155,109,255,0.2)' : `linear-gradient(135deg, ${plan.color}, ${plan.neon})`,
                color: plan.id === 'agency' ? '#000' : plan.id === 'pro' ? '#000' : '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: loading === plan.id ? 'default' : 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                marginBottom: '20px',
                transition: 'all .2s',
                boxShadow: loading === plan.id ? 'none' : `0 0 20px ${plan.neon}33`,
              }}>
              {loading === plan.id ? 'Loading…' : 'Start free trial ↗'}
            </button>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'rgba(108,86,126,0.2)', marginBottom: '16px' }} />

            {/* Tools included */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.tools.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#d8c8f0' }}>
                  <span style={{ color: plan.neon, fontSize: '14px', flexShrink: 0 }}>✓</span>
                  {t}
                </div>
              ))}
              {plan.notIncluded.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#3a2850' }}>
                  <span style={{ color: '#3a2850', fontSize: '14px', flexShrink: 0 }}>✕</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 800, color: '#f8f0ff', marginBottom: '24px' }}>Common questions</div>
        {[
          ['Can I cancel anytime?', 'Yes — cancel anytime from your account settings. No contracts, no cancellation fees.'],
          ['What happens after the free trial?', 'After 7 days you\'ll be charged your plan price. You can cancel before the trial ends and pay nothing.'],
          ['Can I upgrade or downgrade?', 'Yes — upgrade or downgrade anytime. Changes take effect at the next billing cycle.'],
          ['Do you offer refunds?', 'Yes — contact us within 7 days of being charged for a full refund.'],
        ].map(([q, a]) => (
          <div key={q} style={{ marginBottom: '20px', textAlign: 'left', padding: '16px', background: '#130d1a', border: '0.5px solid rgba(108,86,126,0.2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#9b6dff', marginBottom: '6px' }}>{q}</div>
            <div style={{ fontSize: '12px', color: '#5a4070', lineHeight: '1.6' }}>{a}</div>
          </div>
        ))}
      </div>

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/" style={{ fontSize: '12px', color: '#5a4070', textDecoration: 'none', fontFamily: "'DM Mono',monospace" }}>← Back to the suite</a>
      </div>
    </div>
  )
}
