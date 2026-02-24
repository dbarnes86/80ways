import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// App Store Connect product IDs — update these after creating products in App Store Connect
export const PRODUCTS = {
  YEARLY_FULL: {
    id: 'com.atw80ways.yearly.full', // $29.99/year
    appStoreId: 'com.atw80ways.yearly.full',
    stripePriceId: 'price_1SDn2gKaw9duBfyWTItImHiW',
  },
  YEARLY_TRIAL: {
    id: 'com.atw80ways.yearly.trial', // 7-day free trial, then $19.99/year
    appStoreId: 'com.atw80ways.yearly.trial',
    stripePriceId: '', // Create this Stripe price if needed
  },
} as const;

export type PurchasePlan = 'yearly' | 'trial';

const isNative = () => Capacitor.isNativePlatform();

/**
 * Initialize the IAP plugin (call once on app start for native)
 */
export async function initializePurchases() {
  if (!isNative()) return;

  try {
    const { NativePurchases } = await import('@capgo/native-purchases');
    const supported = await NativePurchases.isBillingSupported();
    if (!supported) {
      console.warn('Billing not supported on this device');
    }
  } catch (err) {
    console.error('Failed to initialize purchases:', err);
  }
}

/**
 * Fetch available products from the store
 */
export async function getAvailableProducts() {
  if (!isNative()) return [];

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCTS.YEARLY_FULL.appStoreId, PRODUCTS.YEARLY_TRIAL.appStoreId],
      productType: PURCHASE_TYPE.SUBS,
    });
    return products;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
}

/**
 * Purchase a subscription plan
 * - On native: triggers StoreKit/Google Play
 * - On web: falls back to Stripe checkout
 */
export async function purchasePlan(
  plan: PurchasePlan,
  userInfo: { email: string; displayName: string }
): Promise<{ success: boolean; error?: string }> {
  if (isNative()) {
    return purchaseNative(plan);
  }
  return purchaseStripe(plan, userInfo);
}

async function purchaseNative(plan: PurchasePlan): Promise<{ success: boolean; error?: string }> {
  try {
    const { NativePurchases } = await import('@capgo/native-purchases');
    const productId = plan === 'yearly' ? PRODUCTS.YEARLY_FULL.appStoreId : PRODUCTS.YEARLY_TRIAL.appStoreId;

    const result = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      quantity: 1,
    });

    if (result.transactionId) {
      return { success: true };
    }

    return { success: false, error: 'Purchase was not completed' };
  } catch (err: any) {
    // User cancelled
    if (err?.code === 'USER_CANCELLED' || err?.message?.includes('cancel')) {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: err?.message || 'Purchase failed' };
  }
}

async function purchaseStripe(
  plan: PurchasePlan,
  userInfo: { email: string; displayName: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        email: userInfo.email,
        displayName: userInfo.displayName,
        plan,
      },
    });

    if (error) throw error;

    if (data?.url) {
      window.open(data.url, '_blank');
      return { success: false, error: 'redirect' }; // not a real error, user redirected
    }

    return { success: false, error: 'No checkout URL returned' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create checkout' };
  }
}

/**
 * Restore previous purchases (native only)
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isNative()) return false;

  try {
    const { NativePurchases } = await import('@capgo/native-purchases');
    await NativePurchases.restorePurchases();
    return true;
  } catch {
    return false;
  }
}
