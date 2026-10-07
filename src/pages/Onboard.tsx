import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, HeartPulse, Loader2, Mail, MailCheck } from 'lucide-react';
import foggPortrait from '@/assets/fogg-portrait.jpg';
import { Button, HoloCard, Input, Label, cn } from '@/components/ui';
import { toast } from '@/components/toast';
import { useAuth } from '@/contexts/AuthContext';
import { ENERGY_THEME } from '@/data/energyTheme';
import type { EnergyType } from '@/data/gameConstants';
import { env } from '@/lib/env';
import { haptic, isNativeApp } from '@/lib/native';
import { supabase } from '@/lib/supabase';
import { signInWithApple } from '@/services/appleAuth';
import { isHealthConnected, isHealthPlatform } from '@/services/healthService';
import { enableNudges, nudgesSupported } from '@/services/nudges';
import { useConnectHealth } from '@/features/health';
import { useUserStore, type Discipline } from '@/stores/userStore';
import { useInboxStore } from '@/stores/inboxStore';
import { CollectPanel } from '@/game/CollectPanel';
import { QuestRow } from '@/game/QuestRow';
import { DISCIPLINE_ICON } from '@/game/Hud';
import { Ship } from '@/game/art';
import { useQuests } from '@/game/questActions';
import { play } from '@/game/sfx';

/**
 * The first three minutes. Every screen is one idea and one big tap, and something good happens
 * every few taps: the story, picking who you are, your workouts flying in, your first quest paying
 * out. Then a reason to turn on notifications, and into the game.
 */
type Stage = 'story' | 'discipline' | 'join' | 'email' | 'inbox' | 'health' | 'collect' | 'quest' | 'nudges';

const ONBOARDED = 'atw80-onboarded';
const markOnboarded = () => {
  try {
    localStorage.setItem(ONBOARDED, '1');
  } catch {
    /* storage unavailable */
  }
};
const wasOnboarded = () => {
  try {
    return localStorage.getItem(ONBOARDED) === '1';
  } catch {
    return false;
  }
};

const tap = () => {
  haptic('tap');
  play('tick');
};

export default function Onboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [stage, setStage] = useState<Stage>('story');
  const inboxCount = useInboxStore((s) => s.items.length);

  const finish = () => {
    markOnboarded();
    navigate('/dashboard', { replace: true });
  };

  // Once signed in, carry on from the right place.
  useEffect(() => {
    if (loading || !user) return;
    if (stage === 'story' || stage === 'discipline' || stage === 'join' || stage === 'email') {
      if (wasOnboarded()) return finish();
      setStage(isHealthPlatform() && !isHealthConnected(user.id) ? 'health' : 'quest');
    }
  }, [user, loading]);

  // Returning from Stripe Checkout (success_url carries session_id).
  const checkoutSessionId = params.get('session_id');
  useEffect(() => {
    if (!checkoutSessionId || loading) return;
    toast({ title: 'Season Pass active', description: user ? 'Welcome aboard. Your expedition begins now.' : 'Confirm your email, then sign in to begin.' });
    navigate(user ? '/dashboard' : '/login', { replace: true });
  }, [checkoutSessionId, loading, user, navigate]);

  const afterQuest = () => (nudgesSupported() ? setStage('nudges') : finish());

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1.5rem))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {stage === 'story' && <Story onDone={() => setStage('discipline')} />}
        {stage === 'discipline' && <PickDiscipline onDone={() => setStage('join')} />}
        {stage === 'join' && <Join onEmail={() => setStage('email')} />}
        {stage === 'email' && <EmailSignUp onBack={() => setStage('join')} onInbox={() => setStage('inbox')} />}
        {stage === 'inbox' && <Inbox />}
        {stage === 'health' && user && <ConnectHealth userId={user.id} onDone={(arrived) => setStage(arrived ? 'collect' : 'quest')} />}
        {stage === 'collect' && (
          <div className="animate-fade-up space-y-6">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-bold text-glow-cyan">Your week, in fuel</h1>
              <p className="text-muted-foreground">Tap Collect.</p>
            </div>
            <CollectPanel big onCollected={() => setTimeout(() => setStage('quest'), 400)} />
            {inboxCount === 0 && (
              <Button onClick={() => setStage('quest')} className="h-14 w-full text-lg">
                Next
              </Button>
            )}
          </div>
        )}
        {stage === 'quest' && <FirstQuest onDone={afterQuest} />}
        {stage === 'nudges' && <Nudges onDone={finish} />}
      </div>
    </div>
  );
}

const STORY = [
  { kicker: 'London, 1872', line: 'Phileas Fogg makes a wager.' },
  { kicker: '£20,000', line: 'Round the world in 80 days. Not one more.' },
  { kicker: 'You', line: 'Every workout you do powers his journey.' },
];

function Story({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const next = () => {
    tap();
    if (i < STORY.length - 1) setI(i + 1);
    else onDone();
  };
  const card = STORY[i];
  return (
    <button type="button" onClick={next} className="flex min-h-[70dvh] w-full flex-col items-center justify-center gap-8 text-center">
      <div key={i} className="animate-pop space-y-6">
        {i === 0 && (
          <div className="relative mx-auto size-40">
            <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
            <img src={foggPortrait} alt="Phileas Fogg" className="relative size-40 rounded-full border-2 border-primary/50 object-cover" />
          </div>
        )}
        {i === 1 && <p className="font-heading text-8xl font-bold text-warning drop-shadow-[0_0_20px_hsl(var(--warning)/0.6)]">80</p>}
        {i === 2 && <Ship size={220} className="mx-auto animate-sail" />}
        <p className="font-mono text-sm uppercase tracking-[0.35em] text-primary">{card.kicker}</p>
        <h1 className="font-heading text-4xl font-bold leading-tight text-glow-cyan">{card.line}</h1>
      </div>
      <div className="flex gap-2">
        {STORY.map((_, k) => (
          <span key={k} className={cn('h-2 rounded-full transition-all', k === i ? 'w-8 bg-primary' : 'w-2 bg-muted')} />
        ))}
      </div>
      <p className="animate-pulse-soft text-sm text-muted-foreground">Tap to continue</p>
    </button>
  );
}

const DISCIPLINES: { id: Discipline; label: string; energy: EnergyType; blurb: string }[] = [
  { id: 'runner', label: 'Runner', energy: 'terrestrial', blurb: 'Runs, walks, hikes' },
  { id: 'rider', label: 'Rider', energy: 'transport', blurb: 'Bikes, skates, skis' },
  { id: 'swimmer', label: 'Swimmer', energy: 'nautical', blurb: 'Swims, rows, paddles' },
  { id: 'lifter', label: 'Lifter', energy: 'strength', blurb: 'Weights, HIIT, yoga' },
];

function PickDiscipline({ onDone }: { onDone: () => void }) {
  const setDiscipline = useUserStore((s) => s.setDiscipline);
  const [picked, setPicked] = useState<Discipline | null>(null);
  const pick = (d: Discipline) => {
    setPicked(d);
    setDiscipline(d);
    haptic('success');
    play('chime');
    setTimeout(onDone, 550);
  };
  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-glow-cyan">What moves you?</h1>
        <p className="text-muted-foreground">Every kind of workout counts. This is just where you start.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DISCIPLINES.map((d) => {
          const Icon = DISCIPLINE_ICON[d.id];
          const theme = ENERGY_THEME[d.energy];
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => pick(d.id)}
              className={cn(
                'press flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border-2 bg-card/80 p-4 transition-all',
                picked === d.id ? `${theme.border} scale-105 shadow-[0_0_30px_currentColor] ${theme.text}` : 'border-border',
                picked && picked !== d.id && 'opacity-40',
              )}
            >
              <Icon className={cn('size-14', theme.text)} />
              <span className="font-heading text-2xl font-bold text-foreground">{d.label}</span>
              <span className="text-xs text-muted-foreground">{d.blurb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppleButton() {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const r = await signInWithApple();
    setBusy(false);
    if (r.ok) haptic('success');
    else if (!r.cancelled) toast({ title: 'Apple sign-in failed', description: r.message, variant: 'destructive' });
  };
  return (
    <button
      type="button"
      onClick={() => void go()}
      disabled={busy}
      className="press flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xl font-semibold text-black disabled:opacity-70"
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : (
        <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      )}
      Continue with Apple
    </button>
  );
}

const showApple = () => isNativeApp() || env.appleAuth;

function Join({ onEmail }: { onEmail: () => void }) {
  return (
    <div className="animate-fade-up space-y-8 text-center">
      <Ship size={200} className="mx-auto animate-sail" />
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-glow-cyan">Join the crew</h1>
        <p className="text-muted-foreground">Free to start. Your progress saves to your account.</p>
      </div>
      <div className="space-y-3">
        {showApple() && <AppleButton />}
        <Button variant={showApple() ? 'outline' : 'default'} onClick={onEmail} className="h-14 w-full text-lg">
          <Mail /> {showApple() ? 'Use email instead' : 'Sign up with email'}
        </Button>
      </div>
      <p className="text-sm">
        <Link to="/login" className="text-muted-foreground hover:text-primary">Already on the crew? Sign in</Link>
      </p>
      <p className="text-xs text-muted-foreground">
        By continuing you agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function EmailSignUp({ onBack, onInbox }: { onBack: () => void; onInbox: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) return setError('Pick a name for the leaderboard (2+ characters).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("That email doesn't look right.");
    if (form.password.length < 8) return setError('Password needs at least 8 characters.');

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { display_name: name } },
    });
    setBusy(false);
    if (error) {
      haptic('error');
      return setError(error.message);
    }
    haptic('success');
    // With a session the effect in Onboard moves on; without one, email confirmation is on.
    if (!data.session) onInbox();
  };

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="text-center font-heading text-3xl font-bold text-glow-cyan">Join the crew</h1>
      <HoloCard glow="cyan" className="p-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="nickname" value={form.name} onChange={set('name')} placeholder="How the leaderboard knows you" maxLength={50} className="h-12 text-base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={set('email')} placeholder="you@example.com" className="h-12 text-base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="8+ characters" className="h-12 text-base" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-14 w-full text-lg">
            {busy ? <Loader2 className="animate-spin" /> : null} Create account
          </Button>
        </form>
      </HoloCard>
      <button type="button" onClick={onBack} className="block w-full py-2 text-center text-muted-foreground hover:text-foreground">
        Back
      </button>
    </div>
  );
}

function Inbox() {
  return (
    <HoloCard glow="cyan" className="animate-scale-in space-y-4 p-8 text-center">
      <MailCheck className="mx-auto size-14 text-primary" />
      <h1 className="font-heading text-3xl font-bold">Check your inbox</h1>
      <p className="text-muted-foreground">Tap the link we’ve sent and you’re in.</p>
      <Link to="/login" className="inline-block text-primary hover:underline">Already confirmed? Sign in</Link>
    </HoloCard>
  );
}

function ConnectHealth({ userId, onDone }: { userId: string; onDone: (arrived: number) => void }) {
  const { busy, connect } = useConnectHealth(userId);
  return (
    <div className="animate-fade-up space-y-8 text-center">
      <div className="relative mx-auto flex size-32 items-center justify-center">
        <div className="absolute inset-0 animate-pulse-soft rounded-full bg-secondary/30 blur-2xl" />
        <HeartPulse className="relative size-20 text-secondary" />
      </div>
      <div className="space-y-3">
        <h1 className="font-heading text-4xl font-bold text-glow-cyan">Your workouts are the fuel</h1>
        <p className="text-lg text-muted-foreground">Connect Apple Health and they arrive here, ready to collect. No logging.</p>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            tap();
            void connect().then((r) => onDone(r?.arrived ?? 0));
          }}
          disabled={busy}
          className="press shine flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-secondary font-heading text-2xl font-bold text-white shadow-[0_0_30px_hsl(var(--secondary)/0.45)] disabled:opacity-70"
        >
          {busy ? <Loader2 className="animate-spin" /> : <HeartPulse />} Connect Apple Health
        </button>
        <button type="button" onClick={() => onDone(0)} className="py-2 text-muted-foreground hover:text-foreground">
          Not now
        </button>
      </div>
      <p className="text-xs text-muted-foreground">We only read workouts. Nothing is written to Health, and it’s never used for ads.</p>
    </div>
  );
}

function FirstQuest({ onDone }: { onDone: () => void }) {
  const { story, daily } = useQuests();
  // Ready to claim: the first chapter is done but not yet paid out.
  const ready = !!story && story.complete && !story.claimed;
  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">Quests</p>
        <h1 className="font-heading text-4xl font-bold text-glow-cyan">{ready ? 'Claim your first reward' : 'Here’s how it works'}</h1>
        <p className="text-muted-foreground">Workouts complete quests. Quests pay out. Three new ones every day.</p>
      </div>
      {story && <QuestRow quest={story} />}
      <div className="space-y-2 opacity-80">
        <p className="font-heading text-lg font-bold">Today</p>
        {daily.map((q) => (
          <QuestRow key={q.id} quest={q} compact />
        ))}
      </div>
      <Button onClick={onDone} variant={ready ? 'outline' : 'default'} className={cn('h-14 w-full text-lg', !ready && 'shine')}>
        {ready ? 'Later' : 'Next'}
      </Button>
    </div>
  );
}

function Nudges({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="animate-fade-up space-y-8 text-center">
      <div className="relative mx-auto flex size-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-destructive/25 blur-2xl" />
        <Bell className="relative size-20 animate-wobble text-destructive" />
      </div>
      <div className="space-y-3">
        <h1 className="font-heading text-4xl font-bold text-glow-cyan">Detective Fix is coming</h1>
        <p className="text-lg text-muted-foreground">Every two weeks he sabotages the voyage. Want a heads-up when he strikes, and when new quests land?</p>
      </div>
      <div className="space-y-3">
        <Button
          onClick={() => {
            setBusy(true);
            void enableNudges()
              .catch(() => false)
              .finally(onDone);
          }}
          disabled={busy}
          className="shine h-16 w-full text-xl"
        >
          {busy ? <Loader2 className="animate-spin" /> : <Bell />} Warn me
        </Button>
        <button type="button" onClick={onDone} className="py-2 text-muted-foreground hover:text-foreground">
          Not now
        </button>
      </div>
    </div>
  );
}
