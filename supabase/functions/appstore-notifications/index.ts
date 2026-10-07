/**
 * App Store Server Notifications V2. Set this function's URL as the Production and Sandbox
 * server URL in App Store Connect (App Information > App Store Server Notifications).
 *
 * Apple signs the payload; we verify it, apply each notification once (billing_events, keyed
 * "apple:<notificationUUID>"), and rewrite the entitlement from the signed transaction and
 * renewal info. Covers renewals, expiry, billing retry and grace period, refunds and revocations.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { appleEntitlement, verifyAppleJWS, type AppleRenewalInfo, type AppleTransaction } from '../_shared/appstore.ts'
import { APPLE_BUNDLE_ID } from '../_shared/appleConfig.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

interface NotificationPayload {
  notificationType: string
  subtype?: string
  notificationUUID: string
  data?: { bundleId?: string; signedTransactionInfo?: string; signedRenewalInfo?: string; environment?: string }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)

  let note: NotificationPayload
  try {
    const { signedPayload } = await req.json()
    note = await verifyAppleJWS<NotificationPayload>(signedPayload)
  } catch (e) {
    console.warn('appstore: rejected notification', (e as Error).message)
    return reply({ error: 'bad_signature' }, 400)
  }

  const eventId = `apple:${note.notificationUUID}`
  const { data: seen } = await admin.from('billing_events').select('event_id').eq('event_id', eventId).maybeSingle()
  if (seen) return reply({ duplicate: true })

  const record = (userId: string | null, summary: unknown) =>
    admin.from('billing_events').upsert({ event_id: eventId, event_type: `apple.${note.notificationType}${note.subtype ? '.' + note.subtype : ''}`, user_id: userId, payload_summary: summary }, { onConflict: 'event_id' })

  if (note.notificationType === 'TEST' || !note.data?.signedTransactionInfo) {
    await record(null, { reason: 'no transaction' })
    return reply({ handled: false })
  }
  if (note.data.bundleId !== APPLE_BUNDLE_ID) {
    await record(null, { reason: 'other bundle' })
    return reply({ handled: false })
  }

  const tx = await verifyAppleJWS<AppleTransaction>(note.data.signedTransactionInfo)
  const renewal = note.data.signedRenewalInfo ? await verifyAppleJWS<AppleRenewalInfo>(note.data.signedRenewalInfo) : null

  // Owner: the subscription we already linked, else the account token set at purchase.
  let userId: string | null = null
  const { data: linked } = await admin.from('entitlements').select('user_id').eq('apple_original_transaction_id', tx.originalTransactionId).maybeSingle()
  userId = linked?.user_id ?? tx.appAccountToken ?? null
  if (!userId) {
    await record(null, { reason: 'no player' })
    return reply({ handled: false, reason: 'no player' })
  }

  const fields = appleEntitlement(tx, renewal)
  const { error } = await admin
    .from('entitlements')
    .upsert({ user_id: userId, apple_original_transaction_id: tx.originalTransactionId, ...fields }, { onConflict: 'user_id' })
  if (error) {
    console.error('appstore: write failed', error.message)
    return reply({ error: 'write_failed' }, 500) // not recorded, so Apple retries
  }

  await record(userId, { type: note.notificationType, subtype: note.subtype, tier: fields.tier })
  return reply({ handled: true })
})
