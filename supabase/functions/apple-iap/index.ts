/**
 * Called by the iOS app after a StoreKit purchase or restore, with the transaction's JWS.
 * Verifies it came from Apple (../_shared/appstore.ts), that it is for this app and product,
 * and that it was bought by this player (appAccountToken is set to the Supabase user id at
 * purchase). Then writes the entitlement. Renewals, cancellations and refunds after that arrive
 * through appstore-notifications.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { appleEntitlement, AppleVerificationError, verifyAppleJWS, type AppleTransaction } from '../_shared/appstore.ts'
import { APPLE_BUNDLE_ID, APPLE_PRODUCT_IDS } from '../_shared/appleConfig.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return reply({ error: 'unauthenticated' }, 401)

  let jws: string
  try {
    ;({ jws } = await req.json())
    if (typeof jws !== 'string') throw new Error()
  } catch {
    return reply({ error: 'bad_request' }, 400)
  }

  let tx: AppleTransaction
  try {
    tx = await verifyAppleJWS<AppleTransaction>(jws)
  } catch (e) {
    console.warn('apple-iap: verification failed', (e as Error).message)
    return reply({ error: e instanceof AppleVerificationError ? 'not_from_apple' : 'invalid' }, 400)
  }

  if (tx.bundleId !== APPLE_BUNDLE_ID) return reply({ error: 'wrong_app' }, 400)
  if (!APPLE_PRODUCT_IDS.includes(tx.productId)) return reply({ error: 'unknown_product' }, 400)
  // The app always buys with appAccountToken = user id; anything else is someone else's purchase.
  if (tx.appAccountToken?.toLowerCase() !== user.id.toLowerCase()) return reply({ error: 'not_your_purchase' }, 403)

  const fields = appleEntitlement(tx, null)
  const { error } = await admin
    .from('entitlements')
    .upsert({ user_id: user.id, apple_original_transaction_id: tx.originalTransactionId, ...fields }, { onConflict: 'user_id' })
  if (error) {
    console.error('apple-iap: write failed', error.message)
    return reply({ error: error.code === '23505' ? 'subscription_belongs_to_another_account' : 'write_failed' }, error.code === '23505' ? 409 : 500)
  }

  return reply({ tier: fields.tier, current_period_end: fields.current_period_end })
})
