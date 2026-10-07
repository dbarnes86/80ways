import type { ReactNode } from 'react';
import { COMPANY } from '@/data/company';

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-4xl font-heading text-glow-cyan">{title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated {COMPANY.lastUpdated}</p>
      <div className="space-y-5 leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-heading [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Around the World in 80 Ways is operated by {COMPANY.name}. This page says what we collect, why, and what you can do about it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Your email address and the display name you choose, to run your account.</li>
        <li>The activities you log (type, duration, distance, intensity, notes) and your game progress, to run the game.</li>
        <li>Your display name and journey position appear on the season leaderboard and raid contributor lists that other players see.</li>
        <li>If you subscribe, the payment provider (Stripe on the web, Apple on iPhone) handles your card. We only receive whether your membership is active and when it renews.</li>
      </ul>
      <p>We do not sell your data, show ads, or read health data from your device.</p>
      <h2>Where it lives</h2>
      <p>Account and game data are stored with Supabase. Payments are processed by Stripe or Apple under their own privacy policies.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Change your display name any time from your profile.</li>
        <li>Export your activity log as CSV from the Logbook.</li>
        <li>To delete your account and everything in it, email <a className="text-primary underline" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> and we'll do it within 30 days.</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Questions: <a className="text-primary underline" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <p>By creating an account you agree to these terms. They're short on purpose.</p>
      <h2>The game</h2>
      <p>
        Around the World in 80 Ways turns the exercise you log into progress in a game. It is not medical advice. Check with a doctor before starting a new exercise
        programme, and stop if anything hurts.
      </p>
      <h2>Fair play</h2>
      <p>Log activities you actually did. We may reset progress or remove accounts that are clearly gaming the leaderboard or raids.</p>
      <h2>Membership</h2>
      <ul>
        <li>Lift Off and activity logging are free. Joining a season, raids and the leaderboard need a membership.</li>
        <li>Memberships renew automatically until cancelled. Cancel any time: on the web from Membership, Manage billing; on iPhone from Settings, your name, Subscriptions.</li>
        <li>If a free trial is offered and you cancel before it ends, you won't be charged.</li>
        <li>Refunds follow the rules of where you paid (Stripe on the web, Apple on iPhone).</li>
      </ul>
      <h2>Changes</h2>
      <p>If these terms change in a way that matters, we'll tell you in the app before it takes effect.</p>
      <h2>Contact</h2>
      <p>
        <a className="text-primary underline" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>
      </p>
    </LegalPage>
  );
}
