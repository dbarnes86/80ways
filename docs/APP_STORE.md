# App Store listing

Everything App Store Connect asks for, ready to paste. Screenshots are in `resources/app-store/`
(1320×2868, the 6.9" size; App Store Connect scales them for smaller iPhones).

## Basics

| Field | Value |
|---|---|
| Seller / developer | Auguris OÜ (App Store Connect shows the legal entity on the Developer account) |
| Copyright | 2026 Auguris OÜ |
| Name | 80 Ways: Fitness Adventure |
| Subtitle | Race Fogg around the world |
| Bundle ID | com.atw80ways.app |
| Primary category | Health & Fitness |
| Secondary category | Games › Adventure |
| Age rating | 4+ (no objectionable content; answer "None" throughout the questionnaire) |
| Price | Free, with in-app subscriptions |
| Privacy Policy URL | https://YOUR-DOMAIN/privacy |
| Terms of Use (EULA) | https://YOUR-DOMAIN/terms (add to the description too; Apple requires it for subscriptions) |
| Support URL | https://YOUR-DOMAIN/ (or a support page) |

## Promotional text (170)

A new season is under way. Log your workouts, charge your reserves and help the crew knock Detective Fix down in this fortnight's raid.

## Description

In 1872, Phileas Fogg bet he could go round the world in 80 days. Now every run, ride, swim and lift you log moves him one step closer.

LOG ANY WORKOUT
Running, cycling, rowing, swimming, lifting, yoga and more. Each workout charges one of four energy reserves: Nautical, Terrestrial, Transport and Strength. Match the workout to the reserve for full power.

TRAVEL THE ROUTE
Spend your energy to cross 11 legs and 35,310 km: the Channel, the Alps, the Suez Canal, the jungles of India, the Pacific, the American railroad and the final dash home. Every leg unlocks the next chapter of the story.

BEAT DETECTIVE FIX
Every couple of weeks Fix sabotages the expedition. The whole crew pools energy to bring him down in a raid boss battle. Land critical hits with the right energy, and everyone who fights shares the reward.

KEEP IT GOING
A daily mission, streaks, 14 achievements, levels and a season leaderboard. Reserves fade if you stop, so little and often wins.

FREE TO START
Lift Off, the starter event, is free. Membership unlocks the season expedition, raids and the leaderboard. Start with a free trial where available.

Membership is an auto-renewing subscription, monthly or yearly. Payment is charged to your Apple ID at confirmation. It renews unless cancelled at least 24 hours before the end of the period; manage or cancel in Settings › your name › Subscriptions.

Terms: https://YOUR-DOMAIN/terms
Privacy: https://YOUR-DOMAIN/privacy

## Keywords (100)

fitness,workout,adventure,running,cycling,steps,game,exercise,motivation,habit,challenge,journey,raid

## App Review notes

- Create a demo account (email and password) and paste it here. Log a couple of activities on it
  first so the reviewer sees the full loop.
- "Membership is an auto-renewable subscription in the Membership group. Lift Off and activity
  logging are free; the season expedition, raids and leaderboard need membership. Restore Purchases
  is on the Membership screen."
- The app does not read HealthKit. Activities are entered by the player.

## App Privacy (nutrition label)

Data **linked to the user**, used for **App Functionality** only. No tracking, no third-party advertising.

| Data type | Collected | Notes |
|---|---|---|
| Contact Info › Email Address | Yes | Account sign-in |
| Contact Info › Name | Yes | Display name, shown on leaderboards |
| Identifiers › User ID | Yes | Account id |
| Purchases › Purchase History | Yes | Membership status only |
| Fitness | Yes | Workouts the player logs (type, duration, distance) |
| User Content › Other | Yes | Optional notes on activities |
| Everything else | No | |

## In-app purchases

Subscription group **Membership**:

| Reference name | Product ID | Duration |
|---|---|---|
| Monthly | com.atw80ways.membership.monthly | 1 month |
| Annual | com.atw80ways.membership.annual | 1 year |

Each needs a display name, a description and a review screenshot (use `resources/app-store/` or a
capture of the Membership screen).
