import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'architect' | 'operator' | 'specialist' | 'learner';
export type FamiliarSystem = 'construction' | 'cooking' | 'travel' | 'healthcare' | 'sports' | 'nature';

type PersonalizationState = {
  onboardingComplete: boolean;
  chosenRole: UserRole | null;
  familiarSystem: FamiliarSystem | null;
  preferredLearningStyle: 'visual' | 'practical' | 'theoretical' | null;
  aphantasiaMode: boolean;
};

type PersonalizationActions = {
  completeOnboarding: (role: UserRole, system: FamiliarSystem, style: 'visual' | 'practical' | 'theoretical') => void;
  resetOnboarding: () => void;
  updateRole: (role: UserRole) => void;
  updateFamiliarSystem: (system: FamiliarSystem) => void;
  setAphantasiaMode: (enabled: boolean) => void;
};

export const usePersonalizationStore = create<PersonalizationState & PersonalizationActions>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      chosenRole: null,
      familiarSystem: null,
      preferredLearningStyle: null,
      aphantasiaMode: false,

      completeOnboarding: (role, system, style) => {
        set({
          onboardingComplete: true,
          chosenRole: role,
          familiarSystem: system,
          preferredLearningStyle: style,
        });
      },

      resetOnboarding: () => {
        set({
          onboardingComplete: false,
          chosenRole: null,
          familiarSystem: null,
          preferredLearningStyle: null,
        });
      },

      updateRole: (role) => {
        set({ chosenRole: role });
      },

      updateFamiliarSystem: (system) => {
        set({ familiarSystem: system });
      },
      setAphantasiaMode: (enabled) => {
        set({ aphantasiaMode: enabled });
      },    }),
    {
      name: 'personalization-storage',
    }
  )
);
