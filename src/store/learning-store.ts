import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, CelebrationData, LearningStage, LearningConcept } from '@/lib/types/learning';

type ContentMetadata = {
  domain: string;
  role: string;
  source: string;
  conceptCount: number;
};

type CustomContent = {
  stages: LearningStage[];
  concepts: LearningConcept[];
  metadata: ContentMetadata | null;
};

type LearningState = {
  progress: UserProgress;
  showCelebration: boolean;
  celebrationData: CelebrationData | null;
  isExploreMode: boolean;
  customContent: CustomContent | null;
};

type LearningActions = {
  completeConcept: (conceptId: string) => void;
  setCurrentConcept: (conceptId: string) => void;
  triggerCelebration: (data: CelebrationData) => void;
  dismissCelebration: () => void;
  toggleExploreMode: () => void;
  resetProgress: () => void;
  startSession: () => void;
  endSession: () => void;
  getConceptStatus: (conceptId: string) => 'locked' | 'available' | 'current' | 'completed';
  getStageStatus: (stageId: string) => 'locked' | 'available' | 'current' | 'completed';
  getNextConcept: () => string | null;
  getPreviousConcept: () => string | null;
  canAccessConcept: (conceptId: string) => boolean;
  loadCustomContent: (content: { stages: LearningStage[]; concepts: LearningConcept[]; metadata: ContentMetadata }) => void;
  clearCustomContent: () => void;
  getStages: () => LearningStage[];
  getConcepts: () => LearningConcept[];
  hasCustomContent: () => boolean;
};

const getInitialProgress = (stages: LearningStage[], concepts: LearningConcept[]): UserProgress => {
  const firstStage = stages[0];
  const firstConcept = concepts.find(c => c.stageId === firstStage?.id && c.order === 1) || concepts[0];
  
  return {
    currentStageId: firstStage?.id || '',
    currentConceptId: firstConcept?.id || '',
    completedConcepts: [],
    completedStages: [],
    conceptsLearnedToday: 0,
    lastSessionDate: new Date().toISOString().split('T')[0],
    totalTimeSpentMinutes: 0,
    sessionStartTime: null,
  };
};

export const useLearningStore = create<LearningState & LearningActions>()(
  persist(
    (set, get) => ({
      progress: getInitialProgress([], []),
      showCelebration: false,
      celebrationData: null,
      isExploreMode: false,
      customContent: null,

      getStages: () => {
        const state = get();
        return state.customContent?.stages || [];
      },

      getConcepts: () => {
        const state = get();
        return state.customContent?.concepts || [];
      },

      hasCustomContent: () => {
        return get().customContent !== null;
      },

      loadCustomContent: (content) => {
        const newProgress = getInitialProgress(content.stages, content.concepts);
        set({
          customContent: content,
          progress: newProgress,
          showCelebration: false,
          celebrationData: null,
        });
      },

      clearCustomContent: () => {
        const newProgress = getInitialProgress([], []);
        set({
          customContent: null,
          progress: newProgress,
          showCelebration: false,
          celebrationData: null,
        });
      },

      completeConcept: (conceptId: string) => {
        const state = get();
        const concepts = state.getConcepts();
        const stages = state.getStages();
        
        const concept = concepts.find(c => c.id === conceptId);
        if (!concept) return;

        const stage = stages.find(s => s.id === concept.stageId);
        if (!stage) return;

        const newCompletedConcepts = [...state.progress.completedConcepts, conceptId];
        const today = new Date().toISOString().split('T')[0];
        const conceptsToday = state.progress.lastSessionDate === today 
          ? state.progress.conceptsLearnedToday + 1 
          : 1;

        const stageConceptIds = concepts
          .filter(c => c.stageId === stage.id)
          .map(c => c.id);
        const allStageConceptsComplete = stageConceptIds.every(id => 
          newCompletedConcepts.includes(id)
        );

        let newCompletedStages = [...state.progress.completedStages];
        if (allStageConceptsComplete && !newCompletedStages.includes(stage.id)) {
          newCompletedStages.push(stage.id);
        }

        const nextConcept = state.getNextConcept();
        const nextConceptData = nextConcept ? concepts.find(c => c.id === nextConcept) : null;
        const nextStageId = nextConceptData?.stageId || state.progress.currentStageId;

        set({
          progress: {
            ...state.progress,
            completedConcepts: newCompletedConcepts,
            completedStages: newCompletedStages,
            currentConceptId: nextConcept || conceptId,
            currentStageId: nextStageId,
            conceptsLearnedToday: conceptsToday,
            lastSessionDate: today,
          },
        });

        if (allStageConceptsComplete) {
          const allStagesComplete = stages.every(s => 
            newCompletedStages.includes(s.id)
          );

          if (allStagesComplete) {
            get().triggerCelebration({
              type: 'course',
              title: 'Course Complete!',
              message: 'Congratulations! You\'ve mastered all the core concepts!',
              conceptsCompleted: newCompletedConcepts,
              timeSpent: state.progress.totalTimeSpentMinutes,
              badgeIcon: '🏆',
            });
          } else {
            get().triggerCelebration({
              type: 'stage',
              title: stage.celebrationTitle,
              message: stage.celebrationMessage,
              conceptsCompleted: stageConceptIds,
              badgeIcon: stage.icon,
            });
          }
        }
      },

      setCurrentConcept: (conceptId: string) => {
        const concepts = get().getConcepts();
        const concept = concepts.find(c => c.id === conceptId);
        if (!concept) return;

        set(state => ({
          progress: {
            ...state.progress,
            currentConceptId: conceptId,
            currentStageId: concept.stageId,
          },
        }));
      },

      triggerCelebration: (data: CelebrationData) => {
        set({ showCelebration: true, celebrationData: data });
      },

      dismissCelebration: () => {
        set({ showCelebration: false, celebrationData: null });
      },

      toggleExploreMode: () => {
        set(state => ({ isExploreMode: !state.isExploreMode }));
      },

      resetProgress: () => {
        const state = get();
        const stages = state.getStages();
        const concepts = state.getConcepts();
        set({
          progress: getInitialProgress(stages, concepts),
          showCelebration: false,
          celebrationData: null,
          isExploreMode: false,
        });
      },

      startSession: () => {
        set(state => ({
          progress: {
            ...state.progress,
            sessionStartTime: Date.now(),
          },
        }));
      },

      endSession: () => {
        const state = get();
        if (!state.progress.sessionStartTime) return;

        const sessionMinutes = Math.round(
          (Date.now() - state.progress.sessionStartTime) / 60000
        );

        set({
          progress: {
            ...state.progress,
            totalTimeSpentMinutes: state.progress.totalTimeSpentMinutes + sessionMinutes,
            sessionStartTime: null,
          },
        });
      },

      getConceptStatus: (conceptId: string) => {
        const state = get();
        const concepts = state.getConcepts();
        
        if (state.progress.completedConcepts.includes(conceptId)) {
          return 'completed';
        }
        
        if (state.progress.currentConceptId === conceptId) {
          return 'current';
        }

        const concept = concepts.find(c => c.id === conceptId);
        if (!concept) return 'locked';

        const prerequisitesMet = concept.prerequisites.every(prereq =>
          state.progress.completedConcepts.includes(prereq)
        );

        return prerequisitesMet ? 'available' : 'locked';
      },

      getStageStatus: (stageId: string) => {
        const state = get();
        const stages = state.getStages();
        
        if (state.progress.completedStages.includes(stageId)) {
          return 'completed';
        }

        if (state.progress.currentStageId === stageId) {
          return 'current';
        }

        const stage = stages.find(s => s.id === stageId);
        if (!stage) return 'locked';

        const stageIndex = stages.findIndex(s => s.id === stageId);
        if (stageIndex === 0) return 'available';

        const previousStage = stages[stageIndex - 1];
        return state.progress.completedStages.includes(previousStage.id) 
          ? 'available' 
          : 'locked';
      },

      getNextConcept: () => {
        const state = get();
        const concepts = state.getConcepts();
        const stages = state.getStages();
        
        const currentConcept = concepts.find(
          c => c.id === state.progress.currentConceptId
        );
        if (!currentConcept) return null;

        const sameStageConcepts = concepts
          .filter(c => c.stageId === currentConcept.stageId)
          .sort((a, b) => a.order - b.order);

        const nextInStage = sameStageConcepts.find(
          c => c.order > currentConcept.order && 
               !state.progress.completedConcepts.includes(c.id)
        );

        if (nextInStage) return nextInStage.id;

        const currentStageIndex = stages.findIndex(
          s => s.id === currentConcept.stageId
        );
        
        for (let i = currentStageIndex + 1; i < stages.length; i++) {
          const nextStage = stages[i];
          const firstConcept = concepts
            .filter(c => c.stageId === nextStage.id)
            .sort((a, b) => a.order - b.order)[0];
          
          if (firstConcept && !state.progress.completedConcepts.includes(firstConcept.id)) {
            return firstConcept.id;
          }
        }

        return null;
      },

      getPreviousConcept: () => {
        const state = get();
        const concepts = state.getConcepts();
        const stages = state.getStages();
        
        const currentConcept = concepts.find(
          c => c.id === state.progress.currentConceptId
        );
        if (!currentConcept) return null;

        const sameStageConcepts = concepts
          .filter(c => c.stageId === currentConcept.stageId)
          .sort((a, b) => a.order - b.order);

        const prevInStage = [...sameStageConcepts]
          .reverse()
          .find(c => c.order < currentConcept.order);

        if (prevInStage) return prevInStage.id;

        const currentStageIndex = stages.findIndex(
          s => s.id === currentConcept.stageId
        );

        if (currentStageIndex > 0) {
          const prevStage = stages[currentStageIndex - 1];
          const lastConcept = concepts
            .filter(c => c.stageId === prevStage.id)
            .sort((a, b) => b.order - a.order)[0];
          
          if (lastConcept) return lastConcept.id;
        }

        return null;
      },

      canAccessConcept: (conceptId: string) => {
        const state = get();
        const status = state.getConceptStatus(conceptId);
        return status !== 'locked';
      },
    }),
    {
      name: 'sensa-learning-progress',
      partialize: (state) => ({
        progress: state.progress,
        customContent: state.customContent,
      }),
    }
  )
);
