# Around the World in 80 Ways

A fitness game that follows Phileas Fogg's route round the world. Real workouts charge energy reserves; players spend that energy to move their expedition from London to London across 11 legs in a 180-day season, and team up in community raids against Detective Fix.

Built with Vite, React, TypeScript, Tailwind/shadcn, zustand and Supabase (via Lovable Cloud). Capacitor wraps it for iOS/Android.

## The game loop

1. **Log an activity.** Duration × intensity (+0.1 kWh per km) charges one of four reserves: Nautical, Terrestrial, Transport, Strength. The activity's native reserve charges at 100%, any other at 50%. Reserves cap at 10 kWh and decay 5% a day.
2. **Lift Off.** New players fill a 5 kWh starter meter. Completing it awards 150 XP, enough for level 3, which unlocks the season.
3. **Board the season.** Late joiners start at the leg the season calendar has reached.
4. **Deploy energy** to the current leg. Matching reserves count 100%, related ones 75%, the rest 50%. Nothing is wasted past what the leg needs.
5. **Raids** run for 72 hours every 14 days. Everyone pools energy towards a goal; beating it pays credits to every contributor.
6. **Credits** come from activities, the daily mission, legs and raids, and buy boosters (Energy Amplifier, Multi-Charge, Decay Inhibitor).

Rules live in `src/data/gameConstants.ts`, `src/data/journeyLegs.ts`, `src/data/raids.ts` and `src/lib/gameEngine.ts`. Player actions (log, deploy, raid, buy) are in `src/lib/gameActions.ts`.

## Data and sync

Local zustand stores drive the UI so everything responds instantly. `src/lib/gameSync.ts` mirrors them to Supabase:

| Table / RPC | Holds |
|---|---|
| `player_progression` | XP, starter event, totals, plus `game_state` (reserves, credits, boosters) |
| `season_participation` | Current leg and progress per season |
| `activities` | Activity history |
| `energy_deployments`, `raid_contributions` | Spend history |
| `get_current_season()` | Marks seasons active/completed by date and opens the next 180-day season when one ends |
| `get_season_leaderboard()`, `get_raid_totals()`, `get_raid_top_contributors()` | Cross-player aggregates |

If the server is unreachable the game keeps working locally and syncs on the next load.

## Running locally

```sh
npm install
npm run dev      # http://localhost:8080
npm test         # game rule unit tests
npm run build
```

`.env` needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PROJECT_ID`.

Database changes are in `supabase/migrations/`. Apply new migrations to the project (Lovable Cloud, or `supabase db push`) before shipping the client that uses them.
