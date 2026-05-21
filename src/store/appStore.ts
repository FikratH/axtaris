import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@axtaris_onboarded';

interface AppState {
  hasCompletedOnboarding: boolean | null;
  setOnboardingComplete: (v: boolean) => void;
  loadOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: null,

  setOnboardingComplete: (v) => set({ hasCompletedOnboarding: v }),

  loadOnboardingStatus: async () => {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({ hasCompletedOnboarding: !!value });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },
}));
