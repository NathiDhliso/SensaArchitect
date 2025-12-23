import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemoryPalace, PalaceProgress, PlacedConcept, PalaceBuilding } from '@/lib/types/palace';
import { getRouteById } from '@/constants/palace-routes';

interface PalaceState {
    // Current palace
    currentPalace: MemoryPalace | null;
    currentBuildingIndex: number;

    // Progress
    progress: Record<string, PalaceProgress>; // palaceId -> progress

    // Actions
    createPalace: (subjectId: string, routeId: string, stages: StageData[]) => MemoryPalace;
    setCurrentBuilding: (index: number) => void;
    loadPalace: (palaceId: string) => void;
    clearPalace: () => void;

    // Quiz actions
    recordAnswer: (conceptId: string, correct: boolean) => void;
    updateStreak: () => void;
}

interface StageData {
    id: string;
    name: string;
    concepts: ConceptData[];
}

interface ConceptData {
    id: string;
    name: string;
    lifecycle: {
        provision: string[];
        configure: string[];
        monitor: string[];
    };
}

export const usePalaceStore = create<PalaceState>()(
    persist(
        (set, get) => ({
            currentPalace: null,
            currentBuildingIndex: 0,
            progress: {},

            createPalace: (subjectId, routeId, stages) => {
                const route = getRouteById(routeId);
                if (!route) throw new Error(`Route ${routeId} not found`);

                const palaceId = `${subjectId}-${routeId}-${Date.now()}`;

                // Map stages to buildings (up to 7 stages)
                const buildings: PalaceBuilding[] = stages.slice(0, 7).map((stage, idx) => {
                    const routeBuilding = route.buildings[idx];

                    // Distribute concepts across placement slots
                    const concepts: PlacedConcept[] = stage.concepts.slice(0, 6).map((concept, cIdx) => ({
                        conceptId: concept.id,
                        conceptName: concept.name,
                        slotId: routeBuilding.placements[cIdx]?.id || `slot-${cIdx}`,
                        lifecycle: concept.lifecycle,
                        mastery: 0,
                    }));

                    return {
                        routeBuildingId: routeBuilding.id,
                        stageId: stage.id,
                        stageName: stage.name,
                        concepts,
                    };
                });

                const palace: MemoryPalace = {
                    id: palaceId,
                    subjectId,
                    routeId,
                    buildings,
                    createdAt: new Date().toISOString(),
                };

                // Initialize progress
                const newProgress: PalaceProgress = {
                    palaceId,
                    buildingProgress: {},
                    conceptMastery: {},
                    streak: 0,
                    lastWalkDate: null,
                };

                set(state => ({
                    currentPalace: palace,
                    currentBuildingIndex: 0,
                    progress: { ...state.progress, [palaceId]: newProgress },
                }));

                return palace;
            },

            setCurrentBuilding: (index) => {
                const palace = get().currentPalace;
                if (!palace) return;
                const maxIndex = palace.buildings.length - 1;
                set({ currentBuildingIndex: Math.max(0, Math.min(index, maxIndex)) });
            },

            loadPalace: (_palaceId) => {
                // Would load from storage - for now just sets index
                set({ currentBuildingIndex: 0 });
            },

            clearPalace: () => {
                set({ currentPalace: null, currentBuildingIndex: 0 });
            },

            recordAnswer: (conceptId, correct) => {
                const palace = get().currentPalace;
                if (!palace) return;

                set(state => {
                    const progress = state.progress[palace.id];
                    if (!progress) return state;

                    const existing = progress.conceptMastery[conceptId] || {
                        seen: 0,
                        correct: 0,
                        mastery: 0,
                        nextReview: new Date().toISOString(),
                    };

                    const newMastery = correct
                        ? existing.mastery + (1 - existing.mastery) * 0.2
                        : existing.mastery * 0.8;

                    const nextReviewDays = Math.ceil(newMastery * 7);
                    const nextReview = new Date();
                    nextReview.setDate(nextReview.getDate() + nextReviewDays);

                    return {
                        progress: {
                            ...state.progress,
                            [palace.id]: {
                                ...progress,
                                conceptMastery: {
                                    ...progress.conceptMastery,
                                    [conceptId]: {
                                        seen: existing.seen + 1,
                                        correct: existing.correct + (correct ? 1 : 0),
                                        mastery: newMastery,
                                        nextReview: nextReview.toISOString(),
                                    },
                                },
                            },
                        },
                    };
                });
            },

            updateStreak: () => {
                const palace = get().currentPalace;
                if (!palace) return;

                const today = new Date().toDateString();

                set(state => {
                    const progress = state.progress[palace.id];
                    if (!progress) return state;

                    const lastWalk = progress.lastWalkDate
                        ? new Date(progress.lastWalkDate).toDateString()
                        : null;

                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    let newStreak = progress.streak;
                    if (lastWalk === yesterday.toDateString()) {
                        newStreak += 1;
                    } else if (lastWalk !== today) {
                        newStreak = 1;
                    }

                    return {
                        progress: {
                            ...state.progress,
                            [palace.id]: {
                                ...progress,
                                streak: newStreak,
                                lastWalkDate: today,
                            },
                        },
                    };
                });
            },
        }),
        {
            name: 'sensa-palace-storage',
        }
    )
);
