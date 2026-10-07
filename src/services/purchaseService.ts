/**
 * App Store purchases for the iOS build.
 *
 * StoreKit 2 handles the payment. The app buys with appAccountToken = the Supabase user id, then
 * hands the signed transaction to the apple-iap Edge Function, which verifies it came from Apple
 * and writes the entitlement. Renewals, refunds and cancellations reach the server through App
 * Store Server Notifications, so the app never decides membership on its own.
 */
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

export const PRODUCTS = {
  monthly: 'com.atw80ways.membership.monthly',
  annual: 'com.atw80ways.membership.annual',
} as const

export type NativePlan = keyof typeof PRODUCTS

export const isNative = () => Capacitor.isNativePlatform()

export interface NativePlanInfo {
  plan: NativePlan
  label: string
}

const plugin = () => import('@capgo/native-purchases')

/** Localised prices straight from the App Store. Empty until the products exist in App Store Connect. */
export async function getNativePlans(): Promise<NativePlanInfo[]> {
  if (!isNative()) return []
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin()
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: Object.values(PRODUCTS),
      productType: PURCHASE_TYPE.SUBS,
    })
    return (Object.keys(PRODUCTS) as NativePlan[])
      .map((plan) => {
        const p = products.find((x) => x.identifier === PRODUCTS[plan])
        return p ? { plan, label: `${p.priceString} / ${plan === 'annual' ? 'year' : 'month'}` } : null
      })
      .filter((x): x is NativePlanInfo => x !== null)
  } catch (err) {
    console.error('Failed to fetch products:', err)
    return []
  }
}

/** Send a signed StoreKit transaction to the server, which verifies it and grants membership. */
async function syncTransaction(jws: string): Promise<void> {
  const { error } = await supabase.functions.invoke('apple-iap', { body: { jws } })
  if (error) {
    const ctx = (error as { context?: Response }).context
    const detail = ctx ? ((await ctx.json().catch(() => null)) as { error?: string } | null) : null
    throw new Error(
      detail?.error === 'subscription_belongs_to_another_account'
        ? 'This App Store subscription is already linked to another 80 Ways account.'
        : "We couldn't confirm the purchase with Apple. Tap Restore Purchases to try again.",
    )
  }
}

export async function purchaseNative(plan: NativePlan, userId: string): Promise<'purchased' | 'cancelled'> {
  const { NativePurchases, PURCHASE_TYPE } = await plugin()
  try {
    const tx = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCTS[plan],
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken: userId,
    })
    if (!tx.jwsRepresentation) throw new Error('The App Store did not return a signed transaction.')
    await syncTransaction(tx.jwsRepresentation)
    return 'purchased'
  } catch (err) {
    const e = err as { code?: string; message?: string }
    if (e?.code === 'USER_CANCELLED' || /cancel/i.test(e?.message ?? '')) return 'cancelled'
    throw err
  }
}

/** Re-link an existing App Store subscription to this account (App Review requires this button). */
export async function restoreNative(): Promise<boolean> {
  const { NativePurchases, PURCHASE_TYPE } = await plugin()
  await NativePurchases.restorePurchases()
  const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS, onlyCurrentEntitlements: true })
  const ours = purchases.filter((p) => (Object.values(PRODUCTS) as string[]).includes(p.productIdentifier) && p.jwsRepresentation)
  if (ours.length === 0) return false
  await syncTransaction(ours[ours.length - 1].jwsRepresentation!)
  return true
}

export async function manageNativeSubscription() {
  const { NativePurchases } = await plugin()
  await NativePurchases.manageSubscriptions()
}
