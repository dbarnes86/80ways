import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserStore } from '@/stores/userStore';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, Lock, Shield, CreditCard, Check, Hourglass, Loader2 } from 'lucide-react';

export const Step3 = () => {
  const { setStep } = useOnboardingStore();
  const setUser = useUserStore((state) => state.setUser);
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const firstChargeDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save subscription status to user store
      setUser({
        subscription: {
          status: 'trialing',
          trialEnd: trialEndDate,
          currentPeriodEnd: trialEndDate,
        },
      });
      
      // Show success and proceed
      setSuccess(true);
      setTimeout(() => setStep(4), 2000);
      
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <Check className="h-12 w-12 text-green-500" />
          </div>
        </motion.div>
        <h2 className="text-4xl font-bold mb-4 text-green-500">TRIAL ACTIVATED!</h2>
        <p className="text-2xl text-foreground">Welcome aboard!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <Button
        variant="ghost"
        onClick={() => setStep(2)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          EXPEDITION MEMBERSHIP
        </h2>
        <p className="text-muted-foreground text-lg">Secure your place on Fogg's journey</p>
      </div>

      {/* Membership Details */}
      <Card className="p-8 mb-6 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-primary/20 rounded-full mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">JOIN THE EXPEDITION</h3>
        </div>

        <div className="bg-card/80 backdrop-blur rounded-lg p-6 mb-4">
          <div className="text-center mb-4">
            <div className="text-sm text-muted-foreground mb-2">🎟️ EXPEDITION MEMBERSHIP</div>
            <div className="text-3xl font-bold text-primary mb-1">7-DAY FREE TRIAL</div>
            <div className="text-lg text-muted-foreground">Then $4.99/month</div>
          </div>

          <div className="space-y-2 text-foreground/90">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Full access to all routes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Energy system & challenges</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Community raid events</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Leaderboards & achievements</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Trial Info */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-primary" />
            START YOUR FREE TRIAL
          </h4>
          <ul className="space-y-2 text-sm text-foreground/90">
            <li>• Experience the full journey at no cost for 7 days</li>
            <li>• After your trial, continue for just $4.99/month</li>
            <li>• Cancel anytime before trial ends—no charge</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-primary/20 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your trial begins:</span>
              <span className="font-semibold">Today</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trial ends:</span>
              <span className="font-semibold">{trialEndDate.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">First charge:</span>
              <span className="font-semibold">$4.99 on {firstChargeDate.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur relative overflow-hidden">
        {/* Victorian corner ornaments */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/50" />

        <h3 className="text-2xl font-bold mb-2">PAYMENT DETAILS</h3>
        <p className="text-muted-foreground mb-6">Required to start your trial (you won't be charged today)</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="stripe-card-wrapper p-4 bg-background/50 border-2 border-primary/30 rounded-lg focus-within:border-primary transition-colors">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#ffffff',
                      '::placeholder': {
                        color: '#6b7280',
                      },
                    },
                    invalid: {
                      color: '#ff4444',
                    },
                  },
                  hidePostalCode: false,
                }}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              <span>Secured by Stripe</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>256-bit SSL encryption</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span>We never store your card details</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!stripe || processing}
            className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all duration-300"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'START MY FREE TRIAL'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By starting your trial, you authorize us to charge $4.99/month after 7 days. Cancel anytime in Settings.
          </p>
        </form>
      </Card>
    </motion.div>
  );
};
