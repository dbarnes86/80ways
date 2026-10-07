import { describe, expect, it } from 'vitest'
import { checkoutParams, entitlementChange, eventOwner, periodEnd, priceLabel } from './billing'

describe('entitlementChange', () => {
  it('grants membership on a completed subscription checkout', () => {
    const out = entitlementChange('checkout.session.completed', { mode: 'subscription', status: 'complete', customer: 'cus_1', subscription: 'sub_1' })
    expect(out).toEqual({
      handled: true,
      fields: { tier: 'member', source: 'stripe', stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1', billing_status: 'active', cancel_at_period_end: false },
    })
  })

  it('ignores one-off payments', () => {
    expect(entitlementChange('checkout.session.completed', { mode: 'payment' }).handled).toBe(false)
  })

  it('keeps access while past due, drops it when the subscription ends', () => {
    const pastDue = entitlementChange('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'past_due' })
    expect(pastDue.handled && pastDue.fields.tier).toBe('member')
    const unpaid = entitlementChange('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'unpaid', current_period_end: 1 })
    expect(unpaid.handled && unpaid.fields.tier).toBe('free')
    expect(unpaid.handled && unpaid.fields.current_period_end).toBeNull()
    const deleted = entitlementChange('customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1' })
    expect(deleted.handled && deleted.fields).toMatchObject({ tier: 'free', stripe_subscription_id: null })
  })

  it('leaves the tier alone for incomplete subscriptions', () => {
    const out = entitlementChange('customer.subscription.created', { id: 'sub_1', status: 'incomplete' })
    expect(out.handled && 'tier' in out.fields).toBe(false)
  })

  it('skips events it does not handle', () => {
    expect(entitlementChange('charge.refunded', {})).toEqual({ handled: false, reason: 'charge.refunded is not handled' })
  })
})

describe('eventOwner', () => {
  it('prefers metadata, then the checkout reference, then subscription/customer', () => {
    expect(eventOwner('customer.subscription.updated', { metadata: { user_id: 'u1' } })).toEqual({ userId: 'u1' })
    expect(eventOwner('checkout.session.completed', { client_reference_id: 'u2' })).toEqual({ userId: 'u2' })
    expect(eventOwner('customer.subscription.deleted', { id: 'sub_9', customer: 'cus_9' })).toEqual({ subscriptionId: 'sub_9', customerId: 'cus_9' })
    expect(eventOwner('invoice.payment_failed', { subscription: 'sub_8', customer: 'cus_8' })).toEqual({ subscriptionId: 'sub_8', customerId: 'cus_8' })
  })
})

describe('periodEnd', () => {
  it('reads the item-level field on newer API versions', () => {
    expect(periodEnd({ items: { data: [{ current_period_end: 1767225600 }] } })).toBe('2026-01-01T00:00:00.000Z')
    expect(periodEnd({})).toBeNull()
  })
})

describe('checkoutParams', () => {
  it('ties the session and subscription to the player and adds a trial for new customers', () => {
    const p = checkoutParams({ userId: 'u1', email: 'a@b.c', priceId: 'price_1', successUrl: 's', cancelUrl: 'c', trialDays: 7 })
    expect(p).toMatchObject({
      mode: 'subscription',
      client_reference_id: 'u1',
      metadata: { user_id: 'u1' },
      subscription_data: { metadata: { user_id: 'u1' }, trial_period_days: 7 },
      customer_email: 'a@b.c',
    })
  })

  it('reuses a known customer and skips the trial when there is none', () => {
    const p = checkoutParams({ userId: 'u1', customerId: 'cus_1', priceId: 'price_1', successUrl: 's', cancelUrl: 'c' })
    expect(p.customer).toBe('cus_1')
    expect(p.customer_email).toBeUndefined()
    expect(p.subscription_data.trial_period_days).toBeUndefined()
  })
})

describe('priceLabel', () => {
  it('formats recurring prices', () => {
    expect(priceLabel({ unit_amount: 499, currency: 'gbp', recurring: { interval: 'month' } })).toBe('£4.99 / month')
  })
})
