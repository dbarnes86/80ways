/**
 * Billing for a signed-in player: list plans, start Stripe Checkout, open the billing portal.
 * POST { action: 'config' | 'checkout' | 'portal', plan? }.
 *
 * Never grants membership itself. The webhook does that when Stripe confirms payment.
 *
 * Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL, APP_URL,
 * optional STRIPE_TRIAL_DAYS. SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
 * provided by Supabase.
 */
import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { checkoutParams, MEMBER, PLANS, priceLabel, type Plan } from '../_shared/billing.ts'

const APP_URL = Deno.env.get('APP_URL') ?? ''
const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const PRICES: Record<Plan, string> = {
  monthly: Deno.env.get('STRIPE_PRICE_MONTHLY') ?? '',
  annual: Deno.env.get('STRIPE_PRICE_ANNUAL') ?? '',
}
const TRIAL_DAYS = Number(Deno.env.get('STRIPE_TRIAL_DAYS') ?? '0') || 0

// The web app, local dev, and the Capacitor shells.
const ALLOWED_ORIGINS = new Set([APP_URL, 'http://localhost:5173', 'capacitor://localhost', 'https://localhost'].filter(Boolean))

const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' }) : null
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

function cors(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : APP_URL,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })

let planCache: { plan: Plan; label: string }[] | null = null

async function plans() {
  if (planCache) return planCache
  if (!stripe) return []
  const out: { plan: Plan; label: string }[] = []
  for (const plan of PLANS) {
    if (!PRICES[plan]) continue
    const price = await stripe.prices.retrieve(PRICES[plan])
    out.push({ plan, label: priceLabel(price) })
  }
  planCache = out
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json(req, { error: 'unauthenticated' }, 401)

  let body: { action?: string; plan?: string }
  try {
    body = await req.json()
  } catch {
    return json(req, { error: 'bad_request' }, 400)
  }

  const configured = Boolean(stripe && APP_URL && PRICES.monthly)

  try {
    if (body.action === 'config') {
      return json(req, { configured, trialDays: TRIAL_DAYS, plans: configured ? await plans() : [] })
    }

    if (!configured || !stripe) return json(req, { error: 'not_configured', message: 'Checkout is not configured yet.' }, 503)

    const { data: ent } = await admin.from('entitlements').select('*').eq('user_id', user.id).maybeSingle()

    if (body.action === 'checkout') {
      const plan = body.plan as Plan
      if (!PLANS.includes(plan) || !PRICES[plan]) return json(req, { error: 'bad_plan' }, 400)
      if (ent?.tier === MEMBER) return json(req, { error: 'already_member', message: 'You already have a membership.' }, 409)

      const params = checkoutParams({
        userId: user.id,
        email: user.email,
        customerId: ent?.stripe_customer_id,
        priceId: PRICES[plan],
        successUrl: `${APP_URL}/membership?checkout=success`,
        cancelUrl: `${APP_URL}/membership?checkout=cancelled`,
        // One free trial per customer: none for someone who has paid before.
        trialDays: ent?.stripe_customer_id ? 0 : TRIAL_DAYS,
      })
      const session = await stripe.checkout.sessions.create(params)
      return json(req, { url: session.url })
    }

    if (body.action === 'portal') {
      if (!ent?.stripe_customer_id) return json(req, { error: 'no_customer', message: 'No billing account yet.' }, 404)
      const session = await stripe.billingPortal.sessions.create({ customer: ent.stripe_customer_id, return_url: `${APP_URL}/membership` })
      return json(req, { url: session.url })
    }

    return json(req, { error: 'bad_action' }, 400)
  } catch (e) {
    // Stripe's error code is safe to show; the full message goes to the log.
    console.error('billing error', e)
    const code = (e as { code?: string })?.code ?? 'provider_error'
    return json(req, { error: code, message: 'The payment provider refused the request. Try again shortly.' }, 502)
  }
})
