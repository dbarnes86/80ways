import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Eye, EyeOff, Check, X, ArrowLeft, Loader2 } from 'lucide-react';

export const Step2 = () => {
  const { userData, setStep, updateUserData } = useOnboardingStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  
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

  const handleContinue = async () => {
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

    // Save user data to store
    updateUserData(formData);

    try {
      setProcessing(true);

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          email: formData.email,
          displayName: formData.displayName,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Checkout in new tab
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
      className="max-w-2xl mx-auto"
    >
      <Button
        variant="ghost"
        onClick={() => setStep(1)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">
          REGISTER AS AN ADVENTURER
        </h2>
        <p className="text-muted-foreground text-lg">Join Fogg's crew and begin your journey</p>
      </div>

      <Card className="p-8 md:p-12 border-primary/20 bg-card/50 backdrop-blur relative overflow-hidden">
        {/* Victorian corner ornaments */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/50" />

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <Label htmlFor="displayName" className="text-lg mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Your Name
            </Label>
            <div className="relative">
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="Enter your adventurer name"
                className="bg-background/50 border-primary/30 focus:border-primary text-lg pr-10"
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
            <Label htmlFor="email" className="text-lg mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Electronic Mail
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="bg-background/50 border-primary/30 focus:border-primary text-lg pr-10"
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
            <Label htmlFor="password" className="text-lg mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Secret Passphrase
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Create a secure password"
                className="bg-background/50 border-primary/30 focus:border-primary text-lg pr-10"
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
            
            {/* Password Requirements */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {formData.password.length >= 8 ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className={formData.password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>
                    Minimum 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {/\d/.test(formData.password) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className={/\d/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>
                    At least one number
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}>
                    At least one special character
                  </span>
                </div>
                
                {/* Strength Meter */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">Strength:</span>
                    <span className={`text-sm font-semibold ${
                      passwordStrength.label === 'Strong' ? 'text-green-500' :
                      passwordStrength.label === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ 
                        width: passwordStrength.label === 'Strong' ? '100%' : 
                               passwordStrength.label === 'Moderate' ? '66%' : '33%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!isValid || processing}
          className="w-full mt-8 text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Opening Checkout...
            </>
          ) : (
            'CONTINUE TO PAYMENT'
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </Card>
    </motion.div>
  );
};
