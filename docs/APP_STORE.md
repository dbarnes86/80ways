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
| Privacy Policy URL | https://80ways.co/privacy |
| Terms of Use (EULA) | https://80ways.co/terms (add to the description too; Apple requires it for subscriptions) |
| Support URL | https://80ways.co/ (or a support page) |

## Promotional text (170)

A new season is under way. Log your workouts, charge your reserves and help the crew knock Detective Fix down in this fortnight's raid.

## Description

In 1872, Phileas Fogg bet he could go round the world in 80 days. Now every run, ride, swim and lift you log moves him one step closer.

YOUR WORKOUTS ARE THE FUEL
Connect Apple Health and every run, ride, swim and session charges your reserves on its own: Nautical, Terrestrial, Transport and Strength. No logging. Your last week comes in the moment you connect, so you start with something in the tank.

TRAVEL THE ROUTE
Spend your energy to cross 11 legs and 35,310 km: the Channel, the Alps, the Suez Canal, the jungles of India, the Pacific, the American railroad and the final dash home. Every leg unlocks the next chapter of the story.

BEAT DETECTIVE FIX
Every couple of weeks Fix sabotages the expedition. The whole crew pools energy to bring him down in a raid boss battle. Land critical hits with the right energy, and everyone who fights shares the reward.

QUESTS EVERY DAY
Three new quests every morning, weekly telegrams from Fogg, chests to open, levels, streaks and a passport stamp in every city. Reserves fade if you stop, so little and often wins.

FREE TO START
Lift Off, daily quests and chests are free. The Season Pass unlocks the 80-day voyage, raids and the leaderboard. Start with a free trial where available.

The Season Pass is an auto-renewing subscription, monthly or yearly. Payment is charged to your Apple ID at confirmation. It renews unless cancelled at least 24 hours before the end of the period; manage or cancel in Settings › your name › Subscriptions.

Terms: https://80ways.co/terms
Privacy: https://80ways.co/privacy

## Keywords (100)

fitness,workout,adventure,running,cycling,steps,game,exercise,motivation,habit,challenge,journey,raid

## App Review notes

- Create a demo account (email and password) and paste it here. Log a couple of activities on it
  first so the reviewer sees the full loop.
- "The Season Pass is an auto-renewable subscription in the Membership group. Lift Off, quests and
  activity logging are free; the season voyage, raids and leaderboard need the pass. Restore
  Purchases is on the Season Pass screen (Me → Season Pass)."
- Sign in with Apple is the main sign-in; email is offered as well.
- HealthKit: the app reads workouts only (type, start, duration, distance, energy) and turns them
  into game activities that charge the player's energy reserves. It never writes to Health and
  Health data is not used for advertising or shared. To see it, sign in on a device with a few
  workouts in Health and tap Connect Apple Health; players can also log activities by hand.

## App Privacy (nutrition label)

Data **linked to the user**, used for **App Functionality** only. No tracking, no third-party advertising.

| Data type | Collected | Notes |
|---|---|---|
| Contact Info › Email Address | Yes | Account sign-in |
| Contact Info › Name | Yes | Display name, shown on leaderboards |
| Identifiers › User ID | Yes | Account id |
| Purchases › Purchase History | Yes | Membership status only |
| Health & Fitness › Fitness | Yes | Workouts read from Apple Health or logged by hand (type, duration, distance, calories) |
| User Content › Other | Yes | Optional notes on activities |
| Everything else | No | |

## In-app purchases

Subscription group **Membership**:

| Reference name | Display name | Product ID | Duration |
|---|---|---|---|
| Monthly | Season Pass (monthly) | com.atw80ways.membership.monthly | 1 month |
| Annual | Season Pass (yearly) | com.atw80ways.membership.annual | 1 year |

Each needs a display name, a description and a review screenshot (use `resources/app-store/` or a
capture of the Membership screen).
