import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Eye, EyeOff, Check, X, ArrowLeft, Loader2, Crown, Sparkles } from 'lucide-react';

export const Step2 = () => {
  const { userData, setStep, updateUserData } = useOnboardingStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'trial' | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: userData.displayName,
    email: userData.email,
    password: userData.password,
  });

  const validateName = (name: string) => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (name.length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain a special character';
    return '';
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleContinue = async (plan: 'yearly' | 'trial') => {
    const nameError = validateName(formData.displayName);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (nameError || emailError || passwordError) {
      setErrors({
        displayName: nameError,
        email: emailError,
        password: passwordError,
      });
      return;
    }

    updateUserData(formData);
    setSelectedPlan(plan);

    try {
      setProcessing(true);

      // TODO: Replace with native IAP when running in Capacitor
      // For now, trigger Stripe checkout
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          email: formData.email,
          displayName: formData.displayName,
          plan, // pass plan type to edge function
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Checkout opened",
          description: "Complete your payment in the new tab to continue.",
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const isValid = !validateName(formData.displayName) && 
                  !validateEmail(formData.email) && 
                  !validatePassword(formData.password);

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto pb-8"
    >
      <Button
        variant="ghost"
        onClick={() => setStep(1)}
        className="mb-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-4xl font-bold mb-2 text-glow">
          REGISTER AS AN ADVENTURER
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">Join Fogg's crew and begin your journey</p>
      </div>

      <Card className="p-6 md:p-10 border-primary/20 bg-card/50 backdrop-blur relative overflow-hidden mb-6">
        {/* Victorian corner ornaments */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary/50" />

        <div className="space-y-5">
          {/* Display Name */}
          <div>
            <Label htmlFor="displayName" className="text-base mb-1.5 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Your Name
            </Label>
            <div className="relative">
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="Enter your adventurer name"
                className="bg-background/50 border-primary/30 focus:border-primary text-base pr-10"
              />
              {formData.displayName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validateName(formData.displayName) ? (
                    <X className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-base mb-1.5 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="bg-background/50 border-primary/30 focus:border-primary text-base pr-10"
              />
              {formData.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validateEmail(formData.email) ? (
                    <X className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-base mb-1.5 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Create a secure password"
                className="bg-background/50 border-primary/30 focus:border-primary text-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            
            {formData.password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  {formData.password.length >= 8 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-red-500" />}
                  <span className={formData.password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>8+ characters</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {/\d/.test(formData.password) ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-red-500" />}
                  <span className={/\d/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>Number</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-red-500" />}
                  <span className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>Special character</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ 
                      width: passwordStrength.label === 'Strong' ? '100%' : 
                             passwordStrength.label === 'Moderate' ? '66%' : '33%' 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing Options */}
      <div className="space-y-4">
        {/* Primary: $29.99/year */}
        <Card 
          className="p-6 border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden cursor-pointer hover:border-primary transition-colors"
          onClick={() => isValid && !processing && handleContinue('yearly')}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-wider">Recommended</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-xl font-bold">Full Expedition Pass</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">$29.99</div>
              <div className="text-xs text-muted-foreground">/year</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Unlock everything. Start your adventure today.</p>
          <Button
            disabled={!isValid || processing}
            className="w-full py-5 text-base bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={(e) => {
              e.stopPropagation();
              handleContinue('yearly');
            }}
          >
            {processing && selectedPlan === 'yearly' ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
            ) : (
              'CONTINUE TO PAYMENT'
            )}
          </Button>
        </Card>

        {/* Secondary: $19.99/year with 7-day trial */}
        <button
          disabled={!isValid || processing}
          onClick={() => handleContinue('trial')}
          className="w-full text-center py-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {processing && selectedPlan === 'trial' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </span>
          ) : (
            <span className="flex flex-col items-center gap-1">
              <span className="text-sm">No thanks, I want to check it out first</span>
              <span className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                7-day free trial · then $19.99/year
              </span>
            </span>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-primary hover:underline">Terms</a>
        {' & '}
        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
      </p>
    </motion.div>
  );
};
