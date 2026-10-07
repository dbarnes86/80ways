/**
 * In-app purchases for the Capacitor builds (App Store / Google Play).
 *
 * Plumbing only for now. A store purchase does not grant membership yet: that needs a server-side
 * receipt check (App Store Server Notifications / Play RTDN) writing the entitlements row the same
 * way the Stripe webhook does. Until that exists the native paywall stays switched off (see
 * NATIVE_PURCHASES_ENABLED) rather than take money it can't honour.
 */
import { Capacitor } from '@capacitor/core'

export const NATIVE_PURCHASES_ENABLED = false

export const PRODUCTS = {
  monthly: 'com.atw80ways.membership.monthly',
  annual: 'com.atw80ways.membership.annual',
} as const

export type NativePlan = keyof typeof PRODUCTS

export const isNative = () => Capacitor.isNativePlatform()

export async function getNativeProducts() {
  if (!isNative()) return []
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases')
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: Object.values(PRODUCTS),
      productType: PURCHASE_TYPE.SUBS,
    })
    return products
  } catch (err) {
    console.error('Failed to fetch products:', err)
    return []
  }
}

export async function purchaseNative(plan: NativePlan): Promise<{ success: boolean; error?: string }> {
  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    const result = await NativePurchases.purchaseProduct({ productIdentifier: PRODUCTS[plan], quantity: 1 })
    return result.transactionId ? { success: true } : { success: false, error: 'Purchase was not completed' }
  } catch (err) {
    const e = err as { code?: string; message?: string }
    if (e?.code === 'USER_CANCELLED' || e?.message?.includes('cancel')) return { success: false, error: 'cancelled' }
    return { success: false, error: e?.message || 'Purchase failed' }
  }
}

export async function restoreNativePurchases(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    await NativePurchases.restorePurchases()
    return true
  } catch {
    return false
  }
}
