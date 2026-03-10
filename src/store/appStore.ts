import { create } from 'zustand';

interface AppState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: false,
  setOnboardingComplete: (v) => set({ hasCompletedOnboarding: v }),
}));
