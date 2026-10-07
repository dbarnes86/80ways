# Around the World in 80 Ways

A fitness game that follows Phileas Fogg's route. Real workouts charge energy reserves; players
spend that energy to move their expedition from London to London across 11 legs in a 180-day
season, and fight Detective Fix together in raid boss battles.

Web app at the root, iOS app in `ios/` (Capacitor 8), backend on Supabase.

## Stack

Same shape as Kadar: Vite, React 18, strict TypeScript, Tailwind v4 (tokens in `src/styles.css`),
one small in-house component kit (`src/components/ui.tsx`), zustand, supabase-js, Vitest. Web
deploys to Cloudflare Pages on green CI; migrations reach production through the Supabase GitHub
integration on merge to `main`; Edge Functions deploy from `.github/workflows/deploy.yml`.

## The game loop

1. **Log a workout.** Duration × intensity (+0.1 kWh per km) charges one of four reserves:
   Nautical, Terrestrial, Transport, Strength. The native reserve charges at 100%, others at 50%.
   Reserves cap at 10 kWh and decay 5% a day.
2. **Lift Off** (free). Fill a 5 kWh starter meter to reach level 3.
3. **Membership** unlocks the season. Late joiners start at the leg the calendar has reached.
4. **Deploy energy** to the current leg. Matching reserves count 100%, related ones 75%, the rest 50%.
5. **Raids**: every 14 days Detective Fix appears as a raid boss for 72 hours. His HP is the
   community goal; the right energy type lands critical hits; beating him pays credits.
6. **Credits** from activities, the daily mission, legs and raids buy boosters.

Rules: `src/data/gameConstants.ts`, `src/data/journeyLegs.ts`, `src/data/raids.ts`,
`src/lib/gameEngine.ts`. Player actions: `src/lib/gameActions.ts`. Local-first sync:
`src/lib/gameSync.ts`.

## Membership and billing

`entitlements` is the single source of truth, written only by the server; row level security
gates the season, deployments and raids on it. The client never decides membership.

| Path | Writes entitlements from |
|---|---|
| Web | Stripe Checkout → `stripe-webhook` (signature-verified, idempotent via `billing_events`) |
| iOS | StoreKit 2 → `apple-iap` (x5c chain to Apple Root CA G3, account token = user id) and `appstore-notifications` (renewals, grace, refunds) |

Setup steps and secrets: `docs/IOS.md`. Store listing and privacy answers: `docs/APP_STORE.md`.

## Running locally

```sh
npm ci
cp .env.example .env.local   # Supabase URL and publishable key
npm run dev                  # http://localhost:5173
npm test                     # game rules, billing and App Store verification, UI
npm run build
```

iOS: `npm run cap:sync && npx cap open ios`, then see `docs/IOS.md`.

## Before launch

- Fill in `src/data/company.ts` (legal entity, support email) and the URLs in `docs/APP_STORE.md`.
- Create Stripe prices and App Store products; set the secrets listed in `docs/IOS.md`.
- Point the Supabase GitHub integration at this repo so the migrations apply.
