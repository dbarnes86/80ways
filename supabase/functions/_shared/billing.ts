/**
 * Stripe billing rules, as plain data in and data out so they can be tested without Stripe,
 * Deno or a database. Ported from Kadar's api/billing.py.
 *
 * Two rules hold everything together:
 * 1. The entitlements row is the single source of truth for membership. The webhook writes it;
 *    nothing asks Stripe per request what an account is entitled to.
 * 2. Every Stripe event id is applied at most once (billing_events), so a replayed or duplicated
 *    delivery does nothing.
 */

export const MEMBER = 'member'
export const FREE = 'free'

export const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
] as const

/** past_due keeps access while Stripe retries the card; the eventual deletion event downgrades. */
export const ACTIVE_STATUSES = ['active', 'trialing', 'past_due']
export const ENDED_STATUSES = ['canceled', 'unpaid', 'incomplete_expired']

export type Plan = 'monthly' | 'annual'
export const PLANS: Plan[] = ['monthly', 'annual']

// deno-lint-ignore no-explicit-any
type Obj = Record<string, any>

export interface EntitlementFields {
  tier?: string
  source?: string
  billing_status?: string | null
  cancel_at_period_end?: boolean
  current_period_end?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  apple_original_transaction_id?: string | null
}

export type EventOutcome =
  | { handled: false; reason: string }
  | { handled: true; fields: EntitlementFields }

const iso = (unix: unknown): string | null => (unix ? new Date(Number(unix) * 1000).toISOString() : null)

/** Newer API versions moved current_period_end onto the subscription item. */
export function periodEnd(sub: Obj): string | null {
  if (sub.current_period_end) return iso(sub.current_period_end)
  const item = sub.items?.data?.[0]
  return item?.current_period_end ? iso(item.current_period_end) : null
}

/** What the event says about who it belongs to. The webhook resolves this against the database. */
export function eventOwner(eventType: string, obj: Obj): { userId?: string; subscriptionId?: string; customerId?: string } {
  const meta = obj.metadata ?? {}
  if (meta.user_id) return { userId: String(meta.user_id) }
  if (eventType === 'checkout.session.completed' && obj.client_reference_id) return { userId: String(obj.client_reference_id) }
  if (eventType === 'invoice.payment_failed') {
    const subMeta = obj.subscription_details?.metadata ?? obj.parent?.subscription_details?.metadata ?? {}
    if (subMeta.user_id) return { userId: String(subMeta.user_id) }
  }
  const subscriptionId = eventType.startsWith('customer.subscription.') ? obj.id : obj.subscription
  return {
    subscriptionId: typeof subscriptionId === 'string' ? subscriptionId : undefined,
    customerId: typeof obj.customer === 'string' ? obj.customer : undefined,
  }
}

/** The entitlement change one Stripe event implies. */
export function entitlementChange(eventType: string, obj: Obj): EventOutcome {
  if (!(HANDLED_EVENTS as readonly string[]).includes(eventType)) {
    return { handled: false, reason: `${eventType} is not handled` }
  }

  switch (eventType) {
    case 'checkout.session.completed': {
      if (obj.mode !== 'subscription' || (obj.status != null && obj.status !== 'complete')) {
        return { handled: false, reason: 'not a completed subscription checkout' }
      }
      return {
        handled: true,
        fields: {
          tier: MEMBER,
          source: 'stripe',
          stripe_customer_id: obj.customer ?? null,
          stripe_subscription_id: obj.subscription ?? null,
          billing_status: 'active',
          cancel_at_period_end: false,
        },
      }
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const status = String(obj.status ?? '')
      const fields: EntitlementFields = {
        source: 'stripe',
        stripe_customer_id: obj.customer ?? null,
        stripe_subscription_id: obj.id ?? null,
        billing_status: status,
        cancel_at_period_end: Boolean(obj.cancel_at_period_end),
        current_period_end: periodEnd(obj),
      }
      if (ACTIVE_STATUSES.includes(status)) fields.tier = MEMBER
      else if (ENDED_STATUSES.includes(status)) {
        fields.tier = FREE
        fields.current_period_end = null
      }
      // incomplete / paused: no tier change until Stripe says more
      return { handled: true, fields }
    }
    case 'customer.subscription.deleted': {
      const fields: EntitlementFields = {
        tier: FREE,
        billing_status: 'canceled',
        cancel_at_period_end: false,
        stripe_subscription_id: null,
        current_period_end: null,
      }
      if (obj.customer) fields.stripe_customer_id = obj.customer
      return { handled: true, fields }
    }
    case 'invoice.payment_failed': {
      const fields: EntitlementFields = { billing_status: 'past_due' }
      if (obj.customer) fields.stripe_customer_id = obj.customer
      return { handled: true, fields }
    }
  }
  return { handled: false, reason: `${eventType} is not handled` }
}

/** The Checkout Session request, as data so tests can assert it. */
export function checkoutParams(opts: {
  userId: string
  email?: string | null
  customerId?: string | null
  priceId: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
}): Obj {
  const params: Obj = {
    mode: 'subscription',
    line_items: [{ price: opts.priceId, quantity: 1 }],
    client_reference_id: opts.userId,
    metadata: { user_id: opts.userId },
    subscription_data: {
      metadata: { user_id: opts.userId },
      ...(opts.trialDays && opts.trialDays > 0 ? { trial_period_days: opts.trialDays } : {}),
    },
    allow_promotion_codes: true,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  }
  if (opts.customerId) params.customer = opts.customerId
  else if (opts.email) params.customer_email = opts.email
  return params
}

/** "£4.99 / month" from a Stripe Price. */
export function priceLabel(price: { unit_amount: number | null; currency: string; recurring?: { interval: string } | null }): string {
  const amount = (price.unit_amount ?? 0) / 100
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: price.currency.toUpperCase() }).format(amount)
  return price.recurring ? `${money} / ${price.recurring.interval}` : money
}
