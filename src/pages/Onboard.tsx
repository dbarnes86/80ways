import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Step1 } from '@/components/onboarding/Step1';
import { Step2 } from '@/components/onboarding/Step2';
import { Progress } from '@/components/ui/progress';

const TOTAL_STEPS = 2;

const Onboard = () => {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // Returning from Stripe Checkout (success_url carries session_id).
  const checkoutSessionId = params.get('session_id');
  useEffect(() => {
    if (!checkoutSessionId || loading) return;
    resetOnboarding();
    toast({
      title: 'Membership confirmed',
      description: user ? 'Welcome aboard. Your expedition begins now.' : 'Confirm your email, then sign in to begin.',
    });
    navigate(user ? '/dashboard' : '/login', { replace: true });
  }, [checkoutSessionId, loading, user, navigate, resetOnboarding, toast]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const step = Math.min(Math.max(currentStep, 1), TOTAL_STEPS);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-4">
            <p className="text-muted-foreground text-lg">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-3 bg-muted" />
        </div>

        {step === 1 ? <Step1 /> : <Step2 />}
      </div>
    </div>
  );
};

export default Onboard;
