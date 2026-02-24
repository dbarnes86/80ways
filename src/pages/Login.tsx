import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { HolographicCard } from '@/components/ui/holographic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import riftLogo from '@/assets/rift-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ title: 'Error', description: String(error), variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Apple Sign-In failed', variant: 'destructive' });
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <img src={riftLogo} alt="RIFT" className="w-20 h-auto invert opacity-60" />
        </div>

        <HolographicCard glow="cyan" className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-glow-cyan mb-2">
              WELCOME BACK
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue your journey
            </p>
          </div>

          {/* Apple Sign-In */}
          <Button
            onClick={handleAppleSignIn}
            disabled={appleLoading}
            variant="outline"
            className="w-full py-6 text-base mb-6 border-border hover:bg-muted"
          >
            {appleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            Continue with Apple
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="explorer@reformclub.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">PASSWORD</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> SIGNING IN...</> : 'SIGN IN'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              to="/onboard"
              className="block text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Don't have an account? Start the journey
            </Link>
          </div>
        </HolographicCard>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
