import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, Mail, MailCheck, User, X } from 'lucide-react';
import { Button, HoloCard, Input, Label } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/lib/supabase';
import { haptic } from '@/lib/native';

const validateName = (name: string) => {
  if (!name.trim()) return 'Pick a name for the crew list';
  if (name.trim().length < 2) return 'At least 2 characters';
  if (name.length > 50) return 'Under 50 characters, please';
  return '';
};

const validateEmail = (email: string) => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email doesn't look right";
  return '';
};

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A letter', test: (p: string) => /[a-z]/i.test(p) },
];

export const Step2 = () => {
  const { userData, setStep, updateUserData, resetOnboarding } = useOnboardingStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: userData.displayName, email: userData.email, password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const change = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '', submit: '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      displayName: validateName(form.displayName),
      email: validateEmail(form.email),
      password: PASSWORD_RULES.every((r) => r.test(form.password)) ? '' : 'Password needs all three',
    };
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      haptic('error');
      return;
    }

    updateUserData({ displayName: form.displayName, email: form.email });
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { display_name: form.displayName.trim() } },
    });
    setSubmitting(false);

    if (error) {
      setErrors({ submit: error.message });
      haptic('error');
      return;
    }
    haptic('success');
    if (data.session) {
      resetOnboarding();
      navigate('/dashboard', { replace: true });
    } else {
      setConfirmEmailSent(true);
    }
  };

  if (confirmEmailSent) {
    return (
      <div className="mx-auto max-w-md animate-scale-in text-center">
        <HoloCard glow="cyan" className="space-y-4 p-8">
          <MailCheck className="mx-auto size-12 text-primary" />
          <h2 className="text-2xl font-heading font-bold">Check your inbox</h2>
          <p className="text-muted-foreground">
            We've sent a link to <span className="text-foreground">{form.email}</span>. Tap it to confirm, then you're on the crew list.
          </p>
          <Link to="/login" className="inline-block text-sm text-primary hover:underline">
            Already confirmed? Sign in
          </Link>
        </HoloCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md animate-fade-up pb-8">
      <Button variant="ghost" onClick={() => setStep(1)} className="mb-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft /> Back
      </Button>

      <div className="mb-6 text-center">
        <h2 className="mb-2 text-3xl font-heading font-bold text-glow md:text-4xl">JOIN THE CREW</h2>
        <p className="text-muted-foreground">Free to start. Lift Off is on us.</p>
      </div>

      <HoloCard glow="cyan" className="p-6">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="size-4 text-primary" /> Your name
            </Label>
            <Input
              id="displayName"
              autoComplete="nickname"
              value={form.displayName}
              onChange={(e) => change('displayName', e.target.value)}
              placeholder="How the leaderboard will know you"
              aria-invalid={!!errors.displayName}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="size-4 text-primary" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              value={form.email}
              onChange={(e) => change('email', e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="size-4 text-primary" /> Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => change('password', e.target.value)}
                className="pr-10"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(form.password);
                return (
                  <li key={r.label} className={`flex items-center gap-1 text-xs ${ok ? 'text-success' : 'text-muted-foreground'}`}>
                    {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />} {r.label}
                  </li>
                );
              })}
            </ul>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          {errors.submit && <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{errors.submit}</p>}

          <Button type="submit" disabled={submitting} className="h-12 w-full text-base">
            {submitting ? <Loader2 className="animate-spin" /> : null}
            {submitting ? 'Signing you on…' : 'Create my account'}
          </Button>
        </form>
      </HoloCard>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to our <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/login" className="text-muted-foreground hover:text-primary">Already have an account? Sign in</Link>
      </p>
    </div>
  );
};
