import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Step1 } from '@/components/onboarding/Step1';
import { Step2 } from '@/components/onboarding/Step2';
import { Step3 } from '@/components/onboarding/Step3';
import { Step4 } from '@/components/onboarding/Step4';
import { Step5 } from '@/components/onboarding/Step5';
import { Step6 } from '@/components/onboarding/Step6';
import { Step7 } from '@/components/onboarding/Step7';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Progress } from '@/components/ui/progress';

// Note: In production, use your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_51QgmGMGd6fPRdSS4LHsb5nLjBHjKXNHZQjvr8SjLjV1zX0pNvZQJzHhZ1QzXvZQJzHhZ1QzXvZQJzHhZ1QzXvZQJzHhZ');

const Onboard = () => {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const totalSteps = 7;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return (
          <Elements stripe={stripePromise}>
            <Step3 />
          </Elements>
        );
      case 4:
        return <Step4 />;
      case 5:
        return <Step5 />;
      case 6:
        return <Step6 />;
      case 7:
        return <Step7 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Progress Header */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-4">
            <p className="text-muted-foreground text-lg">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <div className="relative">
            <Progress 
              value={(currentStep / totalSteps) * 100} 
              className="h-3 bg-muted"
            />
            <div 
              className="absolute top-0 left-0 h-3 bg-primary shadow-lg shadow-primary/50 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboard;
