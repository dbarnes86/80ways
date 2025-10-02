import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingStore {
  currentStep: number;
  userData: {
    displayName: string;
    email: string;
    password: string;
    selectedActivities: string[];
    fitnessLevel: string;
    weeklyGoal: number;
  };
  setStep: (step: number) => void;
  updateUserData: (data: Partial<OnboardingStore['userData']>) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      userData: {
        displayName: '',
        email: '',
        password: '',
        selectedActivities: [],
        fitnessLevel: '',
        weeklyGoal: 0,
      },
      setStep: (step) => set({ currentStep: step }),
      updateUserData: (data) => set((state) => ({
        userData: { ...state.userData, ...data }
      })),
      resetOnboarding: () => set({
        currentStep: 1,
        userData: {
          displayName: '',
          email: '',
          password: '',
          selectedActivities: [],
          fitnessLevel: '',
          weeklyGoal: 0,
        },
      }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
