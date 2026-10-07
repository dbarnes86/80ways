import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { haptic, isNativeApp } from '@/lib/native';
import { Button, HoloCard, Input, Label } from '@/components/ui';
import { toast } from '@/components/toast';
import riftLogo from '@/assets/rift-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? "That email and password don't match." : error.message);
      haptic('error');
      return;
    }
    haptic('success');
    navigate('/dashboard');
  };

  const forgot = async () => {
    if (!email) {
      setError('Enter your email first, then tap "Forgot password".');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` });
    if (error) setError(error.message);
    else setResetSent(true);
  };

  const apple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (error) toast({ title: 'Apple sign-in failed', description: error.message, variant: 'destructive' });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-md animate-scale-in">
        <div className="mb-6 flex justify-center">
          <img src={riftLogo} alt="" className="h-auto w-20 opacity-60 invert" />
        </div>

        <HoloCard glow="cyan" className="p-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-heading font-bold text-glow-cyan">WELCOME BACK</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue your journey</p>
          </div>

          {env.appleAuth && !isNativeApp() && (
            <>
              <Button onClick={() => void apple()} variant="outline" className="mb-6 h-12 w-full border-border text-base hover:bg-muted">
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>
            </>
          )}

          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="explorer@reformclub.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">PASSWORD</Label>
                <button type="button" onClick={() => void forgot()} className="text-xs text-muted-foreground hover:text-primary">
                  Forgot password?
                </button>
              </div>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {resetSent && <p className="text-sm text-success">Reset link sent to {email}. Check your inbox.</p>}

            <Button type="submit" disabled={loading} className="h-12 w-full text-lg">
              {loading ? <><Loader2 className="animate-spin" /> SIGNING IN…</> : 'SIGN IN'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/onboard" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              New here? Start the journey
            </Link>
          </div>
        </HoloCard>

        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
