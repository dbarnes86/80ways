# Building the iOS app

The iOS app is the same React app wrapped by Capacitor 8. The Xcode project is committed in `ios/`
and uses Swift Package Manager, so there is no CocoaPods step.

## One-time setup on the Mac

1. Install Xcode 16 or later from the App Store, open it once and let it install components.
2. Install Node 22: `brew install node@22` (or from nodejs.org).
3. Clone and install:
   ```sh
   git clone https://github.com/dbarnes86/80ways.git
   cd 80ways
   npm ci
   cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```

## Every build

```sh
npm run cap:sync        # builds the web app into dist/ and copies it into ios/
npx cap open ios        # opens ios/App/App.xcodeproj in Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your **Team**. The bundle id is
   `com.atw80ways.app`; change it here and in `capacitor.config.ts` if you register a different one.
2. Click **+ Capability** → **In-App Purchase** (once).
3. Pick an iPhone simulator or a connected iPhone and press **Run**.

Run `npm run cap:sync` again after any change to the web code. Xcode picks up the new bundle on the
next Run.

## Testing purchases

- **In the simulator, UI only.** The shared **App** scheme uses `ios/App/Products.storekit`, so
  the membership page shows real-looking prices and the purchase sheet works offline. The server
  will refuse these purchases ("couldn't confirm the purchase with Apple"). That is correct: local
  StoreKit transactions are signed by Xcode, not Apple, and `apple-iap` only trusts Apple's chain.
- **End to end.** Create the two products in App Store Connect (below), add a Sandbox tester
  (Users and Access → Sandbox), sign into it on a real iPhone under Settings → App Store →
  Sandbox Account, then run from Xcode with the scheme's StoreKit configuration set to **None**
  (Product → Scheme → Edit Scheme → Run → Options). Sandbox purchases are signed by Apple and grant
  membership through the server.

## App Store Connect setup

1. **Certificates, Identifiers & Profiles → Identifiers**: register `com.atw80ways.app` with the
   In-App Purchase capability.
2. **App Store Connect → Apps → +**: new iOS app, bundle id `com.atw80ways.app`, SKU `80ways`.
3. **Subscriptions**: create a group **Membership** with two auto-renewable subscriptions:
   - `com.atw80ways.membership.monthly`, 1 month
   - `com.atw80ways.membership.annual`, 1 year
   Optional: an introductory offer (free week). The ids must match `src/services/purchaseService.ts`
   and `supabase/functions/_shared/appleConfig.ts`.
4. **App Information → App Store Server Notifications**: set both the Production and Sandbox URL to
   `https://<project-ref>.supabase.co/functions/v1/appstore-notifications`, Version 2.
5. **App Privacy**: answer from `docs/APP_STORE.md`.
6. Upload: in Xcode, set the device to **Any iOS Device**, **Product → Archive**, then
   **Distribute App → App Store Connect**. Bump **Version** or **Build** in the target's General tab
   for each upload.

## Server secrets for purchases

Set these on the Supabase project (Project Settings → Edge Functions → Secrets):

| Secret | For |
|---|---|
| `APPLE_BUNDLE_ID` | Optional, defaults to `com.atw80ways.app` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Web checkout and its webhook |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` | Web plans (Price ids) |
| `STRIPE_TRIAL_DAYS` | Optional free trial on the web, e.g. `7` |
| `APP_URL` | `https://80ways.co` (no trailing slash) |

### Domain

The app is served at **https://80ways.co** from the Cloudflare Pages project `80ways` (DNS on
Cloudflare; `www` redirects to the apex). In Supabase → Authentication → URL Configuration set the
Site URL to `https://80ways.co` and add `https://80ways.co/**` to the redirect URLs, so
confirmation and password-reset emails land in the app.

### Stripe product (Auguris OÜ account)

One product, **80 Ways Membership**, tax code *SaaS – personal use* (`txcd_10103000`), statement
descriptor `80 WAYS`, with two tax-inclusive recurring prices in EUR: monthly (lookup key
`membership_monthly`) and yearly (`membership_annual`). The app shows whatever amount and
currency the prices carry. Turn on the Customer portal
(cancel at period end, update payment method, switch between the two prices).

Checkout runs Stripe Tax (`automatic_tax`). With no tax registration in the Stripe dashboard it
charges nothing; add a registration there and the rate applies with no code change. **UK VAT:** a
non-UK business selling digital services to UK consumers must register for UK VAT from the first
sale, so register Auguris (and add the registration in Stripe Tax) before opening web checkout to
UK customers, or launch on iPhone first, where Apple is the seller of record and handles VAT.

Stripe webhook endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`, events
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.payment_failed`.

## Icons and splash

Source art is in `resources/` (`icon.png` 1024×1024 full-bleed, `splash.png` 2732×2732). They are
already copied into `ios/App/App/Assets.xcassets`. To change them, replace the files in both places.
