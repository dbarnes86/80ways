/** Product ids the App Store may sell. Must match App Store Connect and src/services/purchaseService.ts. */
export const APPLE_PRODUCT_IDS = ['com.atw80ways.membership.monthly', 'com.atw80ways.membership.annual']

export const APPLE_BUNDLE_ID = Deno.env.get('APPLE_BUNDLE_ID') ?? 'com.atw80ways.app'
