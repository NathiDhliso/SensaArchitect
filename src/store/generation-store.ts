import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pass1Result, PassStatus, ValidationResult, GenerationResult } from '@/lib/types';
import type { BedrockConfig } from '@/lib/generation/claude-client';

type GenerationState = {
  bedrockConfig: BedrockConfig | null;
  currentSubject: string | null;
  passes: Record<number, PassStatus>;
  currentActivity: string;
  progress: number;
  pass1Data: Pass1Result | null;
  pass2Content: string | null;
  pass3Content: string | null;
  validation: ValidationResult | null;
  fullDocument: string | null;
  results: GenerationResult[];
  recentSubjects: string[];
  isGenerating: boolean;
  error: string | null;
};

type GenerationActions = {
  setBedrockConfig: (config: BedrockConfig) => void;
  clearBedrockConfig: () => void;
  startGeneration: (subject: string) => void;
  updatePassStatus: (pass: number, status: PassStatus) => void;
  setCurrentActivity: (activity: string) => void;
  setProgress: (progress: number) => void;
  setPass1Data: (data: Pass1Result) => void;
  setPass2Content: (content: string) => void;
  setPass3Content: (content: string) => void;
  setValidation: (validation: ValidationResult) => void;
  completeGeneration: (result: GenerationResult) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  addRecentSubject: (subject: string) => void;
};

const getEnvBedrockConfig = (): BedrockConfig | null => {
  const region = import.meta.env.VITE_AWS_REGION;
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

  if (region && accessKeyId && secretAccessKey) {
    return { region, accessKeyId, secretAccessKey };
  }
  return null;
};

const initialState: GenerationState = {
  bedrockConfig: getEnvBedrockConfig(),
  currentSubject: null,
  passes: {
    1: 'queued',
    2: 'queued',
    3: 'queued',
    4: 'queued',
  },
  currentActivity: '',
  progress: 0,
  pass1Data: null,
  pass2Content: null,
  pass3Content: null,
  validation: null,
  fullDocument: null,
  results: [],
  recentSubjects: ['Azure Administrator', 'MCAT Biology', 'CPA Tax Accounting'],
  isGenerating: false,
  error: null,
};

export const useGenerationStore = create<GenerationState & GenerationActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBedrockConfig: (config) => set({ bedrockConfig: config }),

      clearBedrockConfig: () => set({ bedrockConfig: null }),

      startGeneration: (subject) =>
        set({
          currentSubject: subject,
          isGenerating: true,
          error: null,
          passes: {
            1: 'in-progress',
            2: 'queued',
            3: 'queued',
            4: 'queued',
          },
          currentActivity: 'Starting generation...',
          progress: 0,
          pass1Data: null,
          pass2Content: null,
          pass3Content: null,
          validation: null,
          fullDocument: null,
        }),

      updatePassStatus: (pass, status) =>
        set((state) => ({
          passes: { ...state.passes, [pass]: status },
        })),

      setCurrentActivity: (activity) => set({ currentActivity: activity }),

      setProgress: (progress) => set({ progress }),

      setPass1Data: (data) => set({ pass1Data: data }),

      setPass2Content: (content) => set({ pass2Content: content }),

      setPass3Content: (content) => set({ pass3Content: content }),

      setValidation: (validation) => set({ validation }),

      completeGeneration: (result) =>
        set((state) => ({
          fullDocument: result.fullDocument,
          isGenerating: false,
          results: [result, ...state.results.slice(0, 9)],
        })),

      setError: (error) => set({ error, isGenerating: false }),

      reset: () =>
        set({
          ...initialState,
          bedrockConfig: get().bedrockConfig,
          recentSubjects: get().recentSubjects,
          results: get().results,
        }),

      addRecentSubject: (subject) =>
        set((state) => {
          const filtered = state.recentSubjects.filter((s) => s !== subject);
          return {
            recentSubjects: [subject, ...filtered].slice(0, 6),
          };
        }),
    }),
    {
      name: 'chart-generator-storage',
      partialize: (state) => ({
        bedrockConfig: state.bedrockConfig,
        recentSubjects: state.recentSubjects,
        results: state.results,
      }),
    }
  )
);
