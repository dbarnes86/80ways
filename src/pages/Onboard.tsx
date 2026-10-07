import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, HeartPulse, Loader2, Mail, MailCheck, Zap } from 'lucide-react';
import foggPortrait from '@/assets/fogg-portrait.jpg';
import { Button, HoloCard, Input, Label, SegmentedProgress } from '@/components/ui';
import { toast } from '@/components/toast';
import { useAuth } from '@/contexts/AuthContext';
import { STARTER_EVENT } from '@/data/gameConstants';
import { env } from '@/lib/env';
import { haptic, isNativeApp } from '@/lib/native';
import { supabase } from '@/lib/supabase';
import { signInWithApple } from '@/services/appleAuth';
import { isHealthConnected, isHealthPlatform, type HealthSyncResult } from '@/services/healthService';
import { healthSummary, useConnectHealth } from '@/features/health';
import { useProgressionStore } from '@/stores/progressionStore';

/**
 * Three taps on the iPhone: Sign in with Apple, connect Apple Health, play. The last week of
 * workouts comes in on connect, so most players arrive with Lift Off already under way.
 * On the web: sign up with email (or Apple, if enabled), then straight to the dashboard.
 */
type Stage = 'join' | 'email' | 'inbox' | 'health' | 'imported';

export default function Onboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [stage, setStage] = useState<Stage>('join');
  const [result, setResult] = useState<HealthSyncResult | null>(null);

  // Signed in already (or just now): Health next if we can, otherwise into the game.
  useEffect(() => {
    if (loading || !user || stage === 'health' || stage === 'imported') return;
    if (isHealthPlatform() && !isHealthConnected(user.id)) setStage('health');
    else navigate('/dashboard', { replace: true });
  }, [user, loading, stage, navigate]);

  // Returning from Stripe Checkout (success_url carries session_id).
  const checkoutSessionId = params.get('session_id');
  useEffect(() => {
    if (!checkoutSessionId || loading) return;
    toast({ title: 'Membership confirmed', description: user ? 'Welcome aboard. Your expedition begins now.' : 'Confirm your email, then sign in to begin.' });
    navigate(user ? '/dashboard' : '/login', { replace: true });
  }, [checkoutSessionId, loading, user, navigate]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1.5rem))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {stage === 'join' && <Join onEmail={() => setStage('email')} />}
        {stage === 'email' && <EmailSignUp onBack={() => setStage('join')} onInbox={() => setStage('inbox')} />}
        {stage === 'inbox' && <Inbox />}
        {stage === 'health' && user && (
          <ConnectHealth
            userId={user.id}
            onDone={(r) => {
              if (r) {
                setResult(r);
                setStage('imported');
              } else navigate('/dashboard', { replace: true });
            }}
          />
        )}
        {stage === 'imported' && result && <Imported result={result} onStart={() => navigate('/dashboard', { replace: true })} />}
      </div>
    </div>
  );
}

function AppleButton({ label = 'Continue with Apple' }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const r = await signInWithApple();
    setBusy(false);
    if (r.ok) haptic('success');
    else if (!r.cancelled) toast({ title: 'Apple sign-in failed', description: r.message, variant: 'destructive' });
  };
  return (
    <Button onClick={() => void go()} disabled={busy} className="h-14 w-full bg-white text-base font-semibold text-black hover:bg-white/90">
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : (
        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      )}
      {label}
    </Button>
  );
}

const showApple = () => isNativeApp() || env.appleAuth;

function Join({ onEmail }: { onEmail: () => void }) {
  return (
    <div className="animate-fade-up space-y-8 text-center">
      <div className="relative mx-auto size-36">
        <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
        <img src={foggPortrait} alt="Phileas Fogg" className="relative size-36 rounded-full border-2 border-primary/50 object-cover" />
      </div>
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">London, 1872</p>
        <h1 className="text-3xl font-heading font-bold text-glow-cyan">Fogg bet he’d go round the world in 80 days.</h1>
        <p className="text-muted-foreground">Every run, ride, swim and lift you do moves him one step closer. Help him win.</p>
      </div>
      <div className="space-y-3">
        {showApple() && <AppleButton />}
        <Button variant={showApple() ? 'outline' : 'default'} onClick={onEmail} className="h-12 w-full text-base">
          <Mail /> {showApple() ? 'Use email instead' : 'Sign up with email'}
        </Button>
      </div>
      <p className="text-sm">
        <Link to="/login" className="text-muted-foreground hover:text-primary">Already on the crew? Sign in</Link>
      </p>
      <p className="text-xs text-muted-foreground">
        Free to start. By continuing you agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
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
      <div className="text-center">
        <h1 className="mb-1 text-3xl font-heading font-bold text-glow-cyan">Join the crew</h1>
        <p className="text-sm text-muted-foreground">Lift Off is free.</p>
      </div>
      <HoloCard glow="cyan" className="p-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="nickname" value={form.name} onChange={set('name')} placeholder="How the leaderboard knows you" maxLength={50} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="8+ characters" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-12 w-full text-base">
            {busy ? <Loader2 className="animate-spin" /> : null} Create account
          </Button>
        </form>
      </HoloCard>
      <button type="button" onClick={onBack} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Back
      </button>
    </div>
  );
}

function Inbox() {
  return (
    <HoloCard glow="cyan" className="animate-scale-in space-y-4 p-8 text-center">
      <MailCheck className="mx-auto size-12 text-primary" />
      <h1 className="text-2xl font-heading font-bold">Check your inbox</h1>
      <p className="text-muted-foreground">Tap the link we’ve sent to confirm your email, and you’re in.</p>
      <Link to="/login" className="inline-block text-sm text-primary hover:underline">Already confirmed? Sign in</Link>
    </HoloCard>
  );
}

function ConnectHealth({ userId, onDone }: { userId: string; onDone: (r: HealthSyncResult | null) => void }) {
  const { busy, connect } = useConnectHealth(userId);
  return (
    <div className="animate-fade-up space-y-8 text-center">
      <div className="relative mx-auto flex size-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-secondary/25 blur-2xl" />
        <HeartPulse className="relative size-16 text-secondary" />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-heading font-bold text-glow-cyan">Your workouts are the fuel.</h1>
        <p className="text-muted-foreground">
          Connect Apple Health and every workout charges your reserves on its own. We’ll bring in the last week so you start with something in the tank.
        </p>
      </div>
      <div className="space-y-3">
        <Button onClick={() => void connect().then(onDone)} disabled={busy} className="h-14 w-full text-base">
          {busy ? <Loader2 className="animate-spin" /> : <HeartPulse />} Connect Apple Health
        </Button>
        <button type="button" onClick={() => onDone(null)} className="text-sm text-muted-foreground hover:text-foreground">
          Not now, I’ll log by hand
        </button>
      </div>
      <p className="text-xs text-muted-foreground">We only read workouts. Nothing is written to Health, and it’s never used for ads.</p>
    </div>
  );
}

function Imported({ result, onStart }: { result: HealthSyncResult; onStart: () => void }) {
  const progress = useProgressionStore((s) => s.starterEventProgress);
  const pct = Math.min(100, (progress / STARTER_EVENT.requiredEnergy) * 100);

  useEffect(() => {
    haptic(result.imported ? 'success' : 'tap');
  }, [result.imported]);

  return (
    <div className="animate-scale-in space-y-8 text-center">
      <Zap className="mx-auto size-14 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]" />
      {result.imported ? (
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-glow-cyan">+{result.energy.toFixed(1)} kWh</h1>
          <p className="text-muted-foreground">{healthSummary(result)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-glow-cyan">You’re connected</h1>
          <p className="text-muted-foreground">No workouts in the last week. Your next one will charge your reserves on its own.</p>
        </div>
      )}
      <HoloCard glow="cyan" className="space-y-3 p-5 text-left">
        <div className="flex items-baseline justify-between">
          <p className="font-heading font-bold">{STARTER_EVENT.name}</p>
          <p className="font-mono text-sm text-primary">{progress.toFixed(1)} / {STARTER_EVENT.requiredEnergy} kWh</p>
        </div>
        <SegmentedProgress value={pct} segments={10} glow="cyan" size="sm" />
        <p className="text-xs text-muted-foreground">
          {result.starterCompleted ? 'Lift Off complete. The expedition awaits.' : 'Fill the meter to earn your place on the expedition.'}
        </p>
      </HoloCard>
      <Button onClick={onStart} className="h-14 w-full text-base">
        Start the journey <ArrowRight />
      </Button>
    </div>
  );
}
