import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, HeartPulse, Loader2, Lock, Mail, MailCheck } from 'lucide-react';
import foggPortrait from '@/assets/fogg-portrait.jpg';
import { Input, cn } from '@/components/ui';
import { toast } from '@/components/toast';
import { useAuth } from '@/contexts/AuthContext';
import { ENERGY_THEME } from '@/data/energyTheme';
import type { EnergyType } from '@/data/gameConstants';
import { env } from '@/lib/env';
import { haptic, isNativeApp } from '@/lib/native';
import { supabase } from '@/lib/supabase';
import { signInWithApple } from '@/services/appleAuth';
import { isHealthConnected, isHealthPlatform } from '@/services/healthService';
import { enableNudges, nudgesSupported, replanNudges } from '@/services/nudges';
import { useConnectHealth } from '@/features/health';
import { useUserStore, type Discipline } from '@/stores/userStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { STARTER_EVENT } from '@/data/gameConstants';
import { liftOffAdvice } from '@/game/coach';
import { CollectPanel } from '@/game/CollectPanel';
import { Hud } from '@/game/Hud';
import { Intro } from '@/game/Intro';
import { Avatar, Chest, artSrc, hasArt } from '@/game/art';
import { claimQuest, useQuests } from '@/game/questActions';
import { useRewardStore } from '@/game/rewards';
import { play } from '@/game/sfx';

/**
 * The first two minutes, as seven beats. The opening titles tell the story and land on the crest;
 * each beat after is a single idea with a payoff you can feel at the end of it (a stamp slams, a crest is picked, a ticket prints, a trunk opens), and a boarding
 * pass at the top punches a hole every time. The account comes after you have something to save.
 */
type Stage = 'intro' | 'crest' | 'name' | 'save' | 'email' | 'inbox' | 'fuel' | 'trunk' | 'fix';

const PRE_AUTH: Stage[] = ['intro', 'crest', 'name', 'save', 'email'];
const BEATS = ['Wager', 'Crest', 'Name', 'Ticket', 'Fuel', 'Kit'];
const DONE: Record<Stage, number> = { intro: 0, crest: 1, name: 2, save: 3, email: 3, inbox: 3, fuel: 4, trunk: 5, fix: 6 };

const ONBOARDED = 'atw80-onboarded';
const INTRO_SEEN = 'atw80-intro-seen';
const PENDING_NAME = 'atw80-pending-name';
const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
  remove: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
  },
};
const wasOnboarded = () => store.get(ONBOARDED) === '1';

const tap = () => {
  haptic('tap');
  play('tick');
};

export default function Onboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [stage, setStage] = useState<Stage>(() => (store.get(INTRO_SEEN) ? 'crest' : 'intro'));
  const discipline = useUserStore((s) => s.discipline) ?? 'runner';

  const finish = () => {
    store.set(ONBOARDED, '1');
    play('whoosh');
    navigate('/dashboard', { replace: true });
  };

  // Once signed in: put the name from the ticket on the profile, then carry on from the right beat.
  useEffect(() => {
    if (loading || !user) return;
    const pending = store.get(PENDING_NAME)?.trim();
    if (pending) {
      store.remove(PENDING_NAME);
      void supabase.from('profiles').upsert({ user_id: user.id, display_name: pending }, { onConflict: 'user_id' });
      void supabase.auth.updateUser({ data: { display_name: pending } });
    }
    if (PRE_AUTH.includes(stage)) {
      if (wasOnboarded()) return finish();
      setStage(isHealthPlatform() && !isHealthConnected(user.id) ? 'fuel' : 'trunk');
    }
  }, [user, loading]);

  // Returning from Stripe Checkout (success_url carries session_id).
  const checkoutSessionId = params.get('session_id');
  useEffect(() => {
    if (!checkoutSessionId || loading) return;
    toast({ title: 'Season Pass active', description: user ? 'Welcome aboard. Your expedition begins now.' : 'Confirm your email, then sign in to begin.' });
    navigate(user ? '/dashboard' : '/login', { replace: true });
  }, [checkoutSessionId, loading, user, navigate]);

  const afterTrunk = () => (nudgesSupported() ? setStage('fix') : finish());
  const signedIn = !!user && !PRE_AUTH.includes(stage) && stage !== 'inbox';

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <header className="mx-auto w-full max-w-md px-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))]">
        {signedIn ? <Hud /> : stage !== 'intro' && <BoardingPass done={DONE[stage]} />}
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {stage === 'intro' && (
          <Intro
            onDone={() => {
              store.set(INTRO_SEEN, '1');
              setStage('crest');
            }}
          />
        )}
        {stage === 'crest' && <PickCrest onDone={() => setStage('name')} />}
        {stage === 'name' && <NameBeat discipline={discipline} onDone={() => setStage('save')} />}
        {stage === 'save' && <SaveTicket discipline={discipline} onEmail={() => setStage('email')} />}
        {stage === 'email' && <EmailSignUp onBack={() => setStage('save')} onInbox={() => setStage('inbox')} />}
        {stage === 'inbox' && <Inbox />}
        {stage === 'fuel' && user && <Fuel userId={user.id} onDone={() => setStage('trunk')} />}
        {stage === 'trunk' && <Trunk onDone={afterTrunk} />}
        {stage === 'fix' && <FixWarning onDone={finish} />}
      </main>
    </div>
  );
}

/* ─── The boarding pass: one hole punched per beat ───────────────────────────── */

function BoardingPass({ done }: { done: number }) {
  const prev = useRef(done);
  const [punched, setPunched] = useState<number | null>(null);
  useEffect(() => {
    if (done > prev.current) {
      setPunched(done - 1);
      haptic('select');
      play('tick', 4 + done);
    }
    prev.current = done;
  }, [done]);
  return (
    <div className="animate-fade-up flex items-center justify-between rounded-2xl border border-dashed border-accent/50 bg-card/70 px-4 py-2.5">
      <p className="kicker text-accent">Boarding</p>
      <ol className="flex items-center gap-2" aria-label={`${done} of ${BEATS.length} steps done`}>
        {BEATS.map((label, i) => (
          <li
            key={label}
            title={label}
            className={cn(
              'flex size-6 items-center justify-center rounded-full border-2 transition-colors',
              i < done ? 'border-accent bg-accent text-background' : 'border-border text-transparent',
              punched === i && 'animate-punch',
            )}
          >
            <Check className="size-3.5" strokeWidth={4} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ─── Beat 1 is the opening titles (src/game/Intro.tsx); the story lands on the crest ──── */

function TypeLine({ text, speed = 26, className, onDone }: { text: string; speed?: number; className?: string; onDone?: () => void }) {
  const [n, setN] = useState(0);
  const finished = useRef(false);
  useEffect(() => {
    setN(0);
    finished.current = false;
    const id = setInterval(() => {
      setN((k) => {
        if (k >= text.length) {
          clearInterval(id);
          if (!finished.current) {
            finished.current = true;
            onDone?.();
          }
          return k;
        }
        return k + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span className={className}>
      {text.slice(0, n)}
      {n < text.length && <span className="animate-pulse-soft">▌</span>}
    </span>
  );
}

/* ─── Beat 2: the crest ──────────────────────────────────────────────────────── */

const DISCIPLINES: { id: Discipline; label: string; energy: EnergyType; blurb: string }[] = [
  { id: 'runner', label: 'Runner', energy: 'terrestrial', blurb: 'Run, walk, hike' },
  { id: 'rider', label: 'Rider', energy: 'transport', blurb: 'Bike, skate, ski' },
  { id: 'swimmer', label: 'Swimmer', energy: 'nautical', blurb: 'Swim, row, paddle' },
  { id: 'lifter', label: 'Lifter', energy: 'strength', blurb: 'Lift, HIIT, yoga' },
];

function PickCrest({ onDone }: { onDone: () => void }) {
  const setDiscipline = useUserStore((s) => s.setDiscipline);
  const [picked, setPicked] = useState<Discipline | null>(null);
  const pick = (d: Discipline) => {
    if (picked) return;
    setPicked(d);
    setDiscipline(d);
    haptic('success');
    play('stamp');
    setTimeout(onDone, 900);
  };
  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center">
        <p className="kicker text-accent">Your crest</p>
        <h1 className="font-heading text-4xl font-bold">What moves you?</h1>
        <p className="text-muted-foreground">Every kind of workout counts. This is just where you start.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DISCIPLINES.map((d) => {
          const theme = ENERGY_THEME[d.energy];
          const on = picked === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => pick(d.id)}
              className={cn(
                'press panel relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden p-4 transition-all duration-300',
                on && 'scale-105 border-accent',
                picked && !on && 'scale-95 opacity-30',
              )}
            >
              {on && (
                <span
                  aria-hidden
                  className="animate-sweep pointer-events-none absolute -inset-8 rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, hsl(var(--accent) / 0.55), transparent 60%)' }}
                />
              )}
              <Avatar discipline={d.id} size={112} className="-my-3" iconClassName={cn('size-14', theme.text)} />
              {on ? (
                <span className="animate-stamp rounded-md border-2 border-accent px-2 py-0.5 font-heading text-2xl font-bold uppercase tracking-wider text-accent">{d.label}</span>
              ) : (
                <span className="font-heading text-2xl font-bold text-foreground">{d.label}</span>
              )}
              <span className="text-xs text-muted-foreground">{d.blurb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Beat 3: your name on the ticket ────────────────────────────────────────── */

function CrewTicket({ discipline, name, live = false, compact = false }: { discipline: Discipline; name: string; live?: boolean; compact?: boolean }) {
  const [typed, setTyped] = useState(!live);
  useEffect(() => {
    if (typed && live) {
      play('stamp');
      haptic('heavy');
    }
  }, [typed, live]);
  return (
    <div className={cn('panel relative overflow-hidden border-accent/50', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-center gap-4">
        <Avatar discipline={discipline} size={compact ? 64 : 88} iconClassName="size-10 text-accent" />
        <div className="min-w-0 flex-1 text-left">
          <p className="kicker text-accent">Crew ticket</p>
          <p className={cn('truncate font-heading font-bold leading-tight', compact ? 'text-2xl' : 'text-3xl')}>
            {live ? <TypeLine text={name} speed={60} onDone={() => setTyped(true)} /> : name}
          </p>
          <p className="text-sm text-muted-foreground">Expedition Member · London to London</p>
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>Reform Club · 1872</span>
        <span>80 days</span>
      </div>
      {typed && (
        <span className="animate-stamp absolute bottom-9 right-4 rounded-md border-[3px] border-success px-2 py-0.5 font-heading text-lg font-bold tracking-[0.2em] text-success">
          BOARDED
        </span>
      )}
    </div>
  );
}

function NameBeat({ discipline, onDone }: { discipline: Discipline; onDone: () => void }) {
  const [name, setName] = useState(() => store.get(PENDING_NAME) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);
  const [ready, setReady] = useState(false);

  const print = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 50) return setError('Two letters at least. Fogg insists.');
    store.set(PENDING_NAME, n);
    play('chime');
    haptic('success');
    setPrinted(true);
    setTimeout(() => setReady(true), 1400 + n.length * 60);
  };

  if (printed) {
    return (
      <div className="animate-fade-up space-y-6">
        <div className="text-center">
          <p className="kicker text-accent">Printing</p>
          <h1 className="font-heading text-4xl font-bold">Your ticket</h1>
        </div>
        <CrewTicket discipline={discipline} name={name.trim()} live />
        {ready && (
          <button type="button" onClick={onDone} className="btn-game btn-primary shine animate-fade-up w-full">
            Keep it safe
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={print} className="animate-fade-up space-y-6">
      <div className="text-center">
        <p className="kicker text-accent">The manifest</p>
        <h1 className="font-heading text-4xl font-bold">What should Fogg call you?</h1>
        <p className="text-muted-foreground">It goes on your ticket and the crew list.</p>
      </div>
      <Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        autoFocus
        autoComplete="nickname"
        maxLength={50}
        placeholder="Your name"
        aria-label="Your name"
        className="h-16 text-center font-heading text-3xl font-bold"
      />
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <button type="submit" className="btn-game btn-primary shine w-full">
        Print my ticket
      </button>
    </form>
  );
}

/* ─── Beat 4: save the ticket (the account) ──────────────────────────────────── */

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
    <button type="button" onClick={() => void go()} disabled={busy} className="btn-game btn-white w-full">
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

function SaveTicket({ discipline, onEmail }: { discipline: Discipline; onEmail: () => void }) {
  const name = store.get(PENDING_NAME) ?? 'Explorer';
  return (
    <div className="animate-fade-up space-y-6 text-center">
      <div>
        <p className="kicker text-accent">Your ticket</p>
        <h1 className="font-heading text-4xl font-bold">Keep your ticket</h1>
        <p className="text-muted-foreground">Free. Your crest, your name and everything you earn, saved to you.</p>
      </div>
      <CrewTicket discipline={discipline} name={name} compact />
      <div className="space-y-3">
        {showApple() && <AppleButton />}
        <button type="button" onClick={onEmail} className={cn('btn-game w-full', showApple() ? 'btn-quiet btn-sm' : 'btn-primary')}>
          <Mail /> {showApple() ? 'Use email instead' : 'Save with email'}
        </button>
      </div>
      <p className="text-sm">
        <Link to="/login" className="text-muted-foreground hover:text-foreground">Already on the crew? Sign in</Link>
      </p>
      <p className="text-xs text-muted-foreground">
        By continuing you agree to the <Link to="/terms" className="text-accent hover:underline">Terms</Link> and{' '}
        <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function EmailSignUp({ onBack, onInbox }: { onBack: () => void; onInbox: () => void }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("That email doesn't look right.");
    if (form.password.length < 8) return setError('Password needs at least 8 characters.');
    const name = store.get(PENDING_NAME)?.trim() || 'Explorer';

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
      <div className="text-center">
        <p className="kicker text-accent">Your ticket</p>
        <h1 className="font-heading text-4xl font-bold">Keep your ticket</h1>
      </div>
      <form onSubmit={submit} className="panel space-y-4 p-5" noValidate>
        <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={set('email')} placeholder="Email" aria-label="Email" className="h-14 text-lg" autoFocus />
        <Input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Password (8+ characters)" aria-label="Password" className="h-14 text-lg" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="btn-game btn-primary w-full">
          {busy ? <Loader2 className="animate-spin" /> : null} Save my ticket
        </button>
      </form>
      <button type="button" onClick={onBack} className="block w-full py-2 text-center text-muted-foreground hover:text-foreground">
        Back
      </button>
    </div>
  );
}

function Inbox() {
  return (
    <div className="panel animate-scale-in space-y-4 p-8 text-center">
      <MailCheck className="mx-auto size-14 text-accent" />
      <h1 className="font-heading text-3xl font-bold">Check your inbox</h1>
      <p className="text-muted-foreground">Tap the link we've sent and your ticket is saved.</p>
      <Link to="/login" className="inline-block text-accent hover:underline">Already confirmed? Sign in</Link>
    </div>
  );
}

/* ─── Beat 5: fuel ───────────────────────────────────────────────────────────── */

/** The Lift Off meter, with the coach's line under it: this is where energy gets its why. */
function LiftOffMeter({ onDone }: { onDone: () => void }) {
  const progress = useProgressionStore((s) => s.starterEventProgress);
  const done = useProgressionStore((s) => s.starterEventCompleted);
  const discipline = useUserStore((s) => s.discipline);
  const armed = useUserStore((s) => s.armedBooster === 'energyAmplifier' && s.inventory.energyAmplifier > 0);
  const left = Math.max(0, STARTER_EVENT.requiredEnergy - progress);
  const advice = liftOffAdvice(left, discipline, armed);
  return (
    <div className="animate-fade-up space-y-6 text-center">
      <div>
        <p className="kicker text-accent">Lift Off</p>
        <h1 className="font-heading text-4xl font-bold">{done ? 'The boiler is lit' : 'Your workouts moved the ship'}</h1>
      </div>
      <div className="panel panel-hero space-y-3 p-5">
        <div className="flex items-end justify-between">
          <span className="font-heading text-5xl font-bold leading-none text-primary">{progress.toFixed(1)}</span>
          <span className="font-mono text-sm text-muted-foreground">of {STARTER_EVENT.requiredEnergy} kWh</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out" style={{ width: `${Math.min(100, (progress / STARTER_EVENT.requiredEnergy) * 100)}%` }} />
        </div>
        <p className="text-lg leading-snug">
          {done ? 'The boiler is lit. The ship can leave the moment you say.' : `${left.toFixed(1)} kWh more and we sail. ${advice?.line ?? ''}`}
        </p>
      </div>
      <button type="button" onClick={onDone} className="btn-game btn-primary shine w-full">
        {done ? 'To the ship' : 'Got it'}
      </button>
    </div>
  );
}

function Fuel({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { busy, connect } = useConnectHealth(userId);
  const [phase, setPhase] = useState<'ask' | 'collect' | 'meter'>('ask');

  if (phase === 'meter') return <LiftOffMeter onDone={onDone} />;
  if (phase === 'collect') {
    return (
      <div className="animate-fade-up space-y-6">
        <div className="text-center">
          <p className="kicker text-accent">Fuel</p>
          <h1 className="font-heading text-4xl font-bold">Your week, in fuel</h1>
          <p className="text-muted-foreground">Tap Collect. Every kWh goes into the boiler.</p>
        </div>
        <CollectPanel big onCollected={() => setTimeout(() => setPhase('meter'), 900)} />
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-8 text-center">
      <div className="relative mx-auto flex size-32 items-center justify-center">
        <div className="absolute inset-0 animate-pulse-soft rounded-full bg-destructive/25 blur-2xl" />
        <HeartPulse className="relative size-20 text-destructive" />
      </div>
      <div className="space-y-3">
        <p className="kicker text-accent">Fuel</p>
        <h1 className="font-heading text-4xl font-bold">Your workouts are the fuel</h1>
        <p className="text-lg text-muted-foreground">Connect Apple Health and this week's workouts arrive now, ready to collect. No logging.</p>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            tap();
            void connect().then((r) => {
              const n = r?.arrived ?? 0;
              if (n) {
                play('chime');
                setPhase('collect');
              } else onDone();
            });
          }}
          disabled={busy}
          className="btn-game btn-primary shine w-full"
        >
          {busy ? <Loader2 className="animate-spin" /> : <HeartPulse />} Connect Apple Health
        </button>
        <button type="button" onClick={onDone} className="py-2 text-lg text-muted-foreground hover:text-foreground">
          Not now
        </button>
      </div>
      <p className="text-xs text-muted-foreground">We only read workouts. Nothing is written to Health, and it's never used for ads.</p>
    </div>
  );
}

/* ─── Beat 6: the welcome trunk ──────────────────────────────────────────────── */

function Trunk({ onDone }: { onDone: () => void }) {
  const { story } = useQuests();
  const momentOpen = useRewardStore((s) => s.queue.length > 0);
  const discipline = useUserStore((s) => s.discipline);
  const armed = useUserStore((s) => s.armedBooster === 'energyAmplifier' && s.inventory.energyAmplifier > 0);
  const left = Math.max(0, STARTER_EVENT.requiredEnergy - useProgressionStore((s) => s.starterEventProgress));
  const coach = liftOffAdvice(left, discipline, true);
  const isChapterOne = story?.id === 's:fuel';
  const ready = isChapterOne && story.complete && !story.claimed;
  const locked = isChapterOne && !story.complete;
  const opened = !isChapterOne;

  const open = () => {
    if (!ready || !story) return;
    play('chest');
    haptic('heavy');
    claimQuest(story);
  };

  return (
    <div className="animate-fade-up space-y-6 text-center">
      <div>
        <p className="kicker text-accent">Your kit</p>
        <h1 className="font-heading text-4xl font-bold">{opened ? 'Kit issued' : locked ? 'Your kit' : 'Open your kit'}</h1>
        <p className="text-muted-foreground">
          {opened
            ? armed
              ? `Amplifier armed: your next workout counts double. ${coach?.line ?? ''}`
              : 'Fogg has a place for you on the expedition.'
            : locked
              ? 'Fogg issues every crew member a trunk. Your first workout is the key.'
              : 'Fogg issues every crew member a trunk. Tap it.'}
        </p>
      </div>
      <button type="button" onClick={open} disabled={!ready} className={cn('press relative mx-auto block', ready && 'animate-wobble')} aria-label={ready ? 'Open the trunk' : 'Trunk'}>
        <Chest tier="bronze" size={220} open={opened} className={cn(locked && 'opacity-60 grayscale')} />
        {locked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-background/80 ring-2 ring-border">
              <Lock className="size-7 text-muted-foreground" />
            </span>
          </span>
        )}
      </button>
      {(opened || locked) && !momentOpen && (
        <button type="button" onClick={onDone} className="btn-game btn-go shine animate-fade-up w-full">
          Set sail
        </button>
      )}
    </div>
  );
}

/* ─── Beat 7: a telegram from Fogg ───────────────────────────────────────────── */

function FixWarning({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="animate-fade-up space-y-8 text-center">
      <div className="relative mx-auto size-36">
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-2xl" />
        <img
          src={artSrc('fogg', foggPortrait)}
          alt="Phileas Fogg"
          className={cn('relative size-36', hasArt('fogg') ? 'object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]' : 'rounded-full border-2 border-accent/50 object-cover')}
        />
      </div>
      <div className="space-y-3">
        <p className="kicker text-accent">Telegram</p>
        <h1 className="font-heading text-4xl font-bold">Fogg will wire you</h1>
        <div className="panel mx-auto max-w-sm p-4 text-left font-mono text-sm leading-relaxed">
          <TypeLine text="WORKOUT LANDS, I WIRE YOU. SHIP READY, I WIRE YOU. NOTHING ELSE. — FOGG" speed={22} />
        </div>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setBusy(true);
            void enableNudges()
              .then((on) => on && replanNudges())
              .catch(() => false)
              .finally(onDone);
          }}
          disabled={busy}
          className="btn-game btn-primary shine w-full"
        >
          {busy ? <Loader2 className="animate-spin" /> : null} Allow telegrams
        </button>
        <button type="button" onClick={onDone} className="py-2 text-muted-foreground hover:text-foreground">
          Not now
        </button>
      </div>
    </div>
  );
}
