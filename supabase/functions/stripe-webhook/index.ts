/**
 * Stripe webhook. The only writer of entitlements.
 *
 * Verifies the signature, skips event ids it has already applied, maps the event to an
 * entitlement change (../_shared/billing.ts) and writes it with the service role. The event id
 * is recorded only after the change lands, so a failed write is retried by Stripe rather than lost.
 *
 * Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. Deployed with verify_jwt = false: Stripe
 * signs the request, it does not carry a Supabase token.
 */
import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { entitlementChange, eventOwner } from '../_shared/billing.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2025-08-27.basil' })
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const crypto = Stripe.createSubtleCryptoProvider()
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function record(eventId: string, eventType: string, userId: string | null, summary: unknown) {
  const { error } = await admin
    .from('billing_events')
    .upsert({ event_id: eventId, event_type: eventType, user_id: userId, payload_summary: summary }, { onConflict: 'event_id' })
  if (error) console.error('billing: failed to record event', eventId, error.message)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)
  if (!WEBHOOK_SECRET) return reply({ error: 'not_configured' }, 503)

  const payload = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, req.headers.get('stripe-signature') ?? '', WEBHOOK_SECRET, undefined, crypto)
  } catch (e) {
    console.warn('billing: bad signature', (e as Error).message)
    return reply({ error: 'bad_signature' }, 400)
  }

  const { data: seen } = await admin.from('billing_events').select('event_id').eq('event_id', event.id).maybeSingle()
  if (seen) return reply({ handled: false, duplicate: true })

  // deno-lint-ignore no-explicit-any
  const obj = event.data.object as Record<string, any>
  const change = entitlementChange(event.type, obj)
  if (!change.handled) {
    await record(event.id, event.type, null, { reason: change.reason })
    return reply({ handled: false, reason: change.reason })
  }

  // Who it belongs to: metadata first, then the subscription or customer we already know.
  const owner = eventOwner(event.type, obj)
  let userId = owner.userId ?? null
  if (!userId && owner.subscriptionId) {
    const { data } = await admin.from('entitlements').select('user_id').eq('stripe_subscription_id', owner.subscriptionId).maybeSingle()
    userId = data?.user_id ?? null
  }
  if (!userId && owner.customerId) {
    const { data } = await admin.from('entitlements').select('user_id').eq('stripe_customer_id', owner.customerId).maybeSingle()
    userId = data?.user_id ?? null
  }
  if (!userId) {
    console.warn('billing: event names no known player', event.id, event.type)
    await record(event.id, event.type, null, { reason: 'no player' })
    return reply({ handled: false, reason: 'no player' })
  }

  const { error } = await admin.from('entitlements').upsert({ user_id: userId, ...change.fields }, { onConflict: 'user_id' })
  if (error) {
    // Not recorded, so Stripe's retry will apply it.
    console.error('billing: failed to write entitlement', event.id, error.message)
    return reply({ error: 'write_failed' }, 500)
  }

  await record(event.id, event.type, userId, { fields: Object.keys(change.fields).sort() })
  console.log(`billing: ${event.type} applied to ${userId}`)
  return reply({ handled: true })
})
