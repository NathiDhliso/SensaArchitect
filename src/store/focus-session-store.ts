/**
 * Focus Session Store
 * 
 * Unified state management for focus sessions that combines:
 * - Pomodoro-style focus/break timing (outer boundary)
 * - Per-concept reading pace tracking (inner progress)
 * - Session analytics and statistics
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FOCUS_SESSION_CONFIG } from '@/constants/ui-constants';

// Types for concept timing tracking
type ConceptTiming = {
    conceptId: string;
    conceptName: string;
    startTime: number;
    endTime: number | null;
    durationSeconds: number;
    completed: boolean;
};

// Pace rating based on reading time vs target
type PaceRating = 'optimal' | 'good' | 'warning' | 'overtime';

// Session summary for display in modal
export type SessionSummary = {
    duration: number;           // Total session duration in seconds
    conceptsCount: number;      // Number of concepts covered
    conceptsCompleted: number;  // Number marked as complete
    avgPaceSeconds: number;     // Average reading time per concept
    paceRating: PaceRating;
    conceptTimings: ConceptTiming[];
    recommendation: string;
};

type FocusSessionState = {
    // Session state
    isSessionActive: boolean;
    isPaused: boolean;
    sessionType: 'focus' | 'break';

    // Timer state
    focusDurationMinutes: number;
    breakDurationMinutes: number;
    timeRemainingSeconds: number;
    sessionStartTime: number | null;

    // Concept tracking for current session
    currentConceptId: string | null;
    currentConceptStartTime: number | null;
    conceptTimings: ConceptTiming[];

    // Cumulative statistics (persisted)
    totalSessionsCompleted: number;
    totalFocusMinutes: number;
    totalConceptsMastered: number;
    sessionsUntilLongBreak: number;

    // UI state
    showSessionSummary: boolean;
    lastSessionSummary: SessionSummary | null;
};

type FocusSessionActions = {
    // Session control
    startFocusSession: () => void;
    pauseSession: () => void;
    resumeSession: () => void;
    endSession: () => void;
    startBreak: () => void;
    skipToBreak: () => void;

    // Timer management
    tick: () => void;  // Called every second by interval
    setFocusDuration: (minutes: number) => void;
    setBreakDuration: (minutes: number) => void;

    // Concept tracking
    recordConceptStart: (conceptId: string, conceptName: string) => void;
    recordConceptEnd: (conceptId: string, completed: boolean) => void;

    // Summary
    getSessionSummary: () => SessionSummary;
    dismissSessionSummary: () => void;

    // Utilities
    getFormattedTimeRemaining: () => string;
    getProgressPercent: () => number;
    getConceptsThisSession: () => number;
    getAvgPaceThisSession: () => number;
    getPaceRating: (avgSeconds: number) => PaceRating;
};

const getInitialState = (): FocusSessionState => ({
    isSessionActive: false,
    isPaused: false,
    sessionType: 'focus',

    focusDurationMinutes: FOCUS_SESSION_CONFIG.DEFAULT_FOCUS_MINUTES,
    breakDurationMinutes: FOCUS_SESSION_CONFIG.DEFAULT_BREAK_MINUTES,
    timeRemainingSeconds: FOCUS_SESSION_CONFIG.DEFAULT_FOCUS_MINUTES * 60,
    sessionStartTime: null,

    currentConceptId: null,
    currentConceptStartTime: null,
    conceptTimings: [],

    totalSessionsCompleted: 0,
    totalFocusMinutes: 0,
    totalConceptsMastered: 0,
    sessionsUntilLongBreak: FOCUS_SESSION_CONFIG.SESSIONS_UNTIL_LONG_BREAK,

    showSessionSummary: false,
    lastSessionSummary: null,
});

export const useFocusSessionStore = create<FocusSessionState & FocusSessionActions>()(
    persist(
        (set, get) => ({
            ...getInitialState(),

            startFocusSession: () => {
                const state = get();
                set({
                    isSessionActive: true,
                    isPaused: false,
                    sessionType: 'focus',
                    timeRemainingSeconds: state.focusDurationMinutes * 60,
                    sessionStartTime: Date.now(),
                    currentConceptId: null,
                    currentConceptStartTime: null,
                    conceptTimings: [],
                    showSessionSummary: false,
                });
            },

            pauseSession: () => {
                set({ isPaused: true });
            },

            resumeSession: () => {
                set({ isPaused: false });
            },

            endSession: () => {
                const state = get();

                // Finalize any in-progress concept timing
                if (state.currentConceptId && state.currentConceptStartTime) {
                    const timing = state.conceptTimings.find(t => t.conceptId === state.currentConceptId);
                    if (timing && timing.endTime === null) {
                        timing.endTime = Date.now();
                        timing.durationSeconds = Math.round((timing.endTime - timing.startTime) / 1000);
                    }
                }

                // Calculate session duration
                const sessionDurationMinutes = state.sessionStartTime
                    ? Math.round((Date.now() - state.sessionStartTime) / 60000)
                    : 0;

                // Generate summary
                const summary = get().getSessionSummary();

                // Update cumulative stats
                const completedConcepts = state.conceptTimings.filter(t => t.completed).length;

                set({
                    isSessionActive: false,
                    isPaused: false,
                    sessionStartTime: null,
                    currentConceptId: null,
                    currentConceptStartTime: null,
                    totalSessionsCompleted: state.totalSessionsCompleted + 1,
                    totalFocusMinutes: state.totalFocusMinutes + sessionDurationMinutes,
                    totalConceptsMastered: state.totalConceptsMastered + completedConcepts,
                    sessionsUntilLongBreak: state.sessionsUntilLongBreak > 1
                        ? state.sessionsUntilLongBreak - 1
                        : FOCUS_SESSION_CONFIG.SESSIONS_UNTIL_LONG_BREAK,
                    showSessionSummary: true,
                    lastSessionSummary: summary,
                });
            },

            startBreak: () => {
                const state = get();
                const breakMinutes = state.sessionsUntilLongBreak === 0
                    ? FOCUS_SESSION_CONFIG.LONG_BREAK_MINUTES
                    : state.breakDurationMinutes;

                set({
                    isSessionActive: true,
                    isPaused: false,
                    sessionType: 'break',
                    timeRemainingSeconds: breakMinutes * 60,
                    sessionStartTime: Date.now(),
                    showSessionSummary: false,
                });
            },

            skipToBreak: () => {
                get().endSession();
                // After a small delay, start the break
                setTimeout(() => get().startBreak(), 100);
            },

            tick: () => {
                const state = get();
                if (!state.isSessionActive || state.isPaused) return;

                const newTime = state.timeRemainingSeconds - 1;

                if (newTime <= 0) {
                    // Timer complete
                    if (state.sessionType === 'focus') {
                        get().endSession();
                    } else {
                        // Break complete - ready for new focus session
                        set({
                            isSessionActive: false,
                            sessionType: 'focus',
                            timeRemainingSeconds: state.focusDurationMinutes * 60,
                        });
                    }
                } else {
                    set({ timeRemainingSeconds: newTime });
                }
            },

            setFocusDuration: (minutes) => {
                set({
                    focusDurationMinutes: minutes,
                    timeRemainingSeconds: get().isSessionActive ? get().timeRemainingSeconds : minutes * 60,
                });
            },

            setBreakDuration: (minutes) => {
                set({ breakDurationMinutes: minutes });
            },

            recordConceptStart: (conceptId, conceptName) => {
                const state = get();
                if (!state.isSessionActive) return;

                // End previous concept if still active
                if (state.currentConceptId && state.currentConceptId !== conceptId) {
                    get().recordConceptEnd(state.currentConceptId, false);
                }

                // Check if we already have a timing for this concept
                const existing = state.conceptTimings.find(t => t.conceptId === conceptId);
                if (existing) {
                    // Resume tracking
                    set({
                        currentConceptId: conceptId,
                        currentConceptStartTime: Date.now(),
                    });
                } else {
                    // New concept timing
                    const newTiming: ConceptTiming = {
                        conceptId,
                        conceptName,
                        startTime: Date.now(),
                        endTime: null,
                        durationSeconds: 0,
                        completed: false,
                    };

                    set({
                        currentConceptId: conceptId,
                        currentConceptStartTime: Date.now(),
                        conceptTimings: [...state.conceptTimings, newTiming],
                    });
                }
            },

            recordConceptEnd: (conceptId, completed) => {
                const state = get();
                const timings = [...state.conceptTimings];
                const timing = timings.find(t => t.conceptId === conceptId);

                if (timing && state.currentConceptStartTime) {
                    const additionalTime = Math.round((Date.now() - state.currentConceptStartTime) / 1000);
                    timing.durationSeconds += additionalTime;
                    timing.endTime = Date.now();
                    timing.completed = completed || timing.completed;

                    set({
                        conceptTimings: timings,
                        currentConceptId: null,
                        currentConceptStartTime: null,
                    });
                }
            },

            getSessionSummary: () => {
                const state = get();
                const timings = state.conceptTimings;

                const duration = state.sessionStartTime
                    ? Math.round((Date.now() - state.sessionStartTime) / 1000)
                    : 0;

                const conceptsWithTime = timings.filter(t => t.durationSeconds > 0);
                const avgPace = conceptsWithTime.length > 0
                    ? Math.round(conceptsWithTime.reduce((sum, t) => sum + t.durationSeconds, 0) / conceptsWithTime.length)
                    : 0;

                const paceRating = get().getPaceRating(avgPace);

                let recommendation = '';
                switch (paceRating) {
                    case 'optimal':
                        recommendation = 'Excellent pacing! You\'re reading efficiently. Keep this rhythm.';
                        break;
                    case 'good':
                        recommendation = 'Good pace! You\'re taking time to understand concepts well.';
                        break;
                    case 'warning':
                        recommendation = 'Consider taking shorter reviews. Focus on key terms first.';
                        break;
                    case 'overtime':
                        recommendation = 'Try the Speed Reader technique: scan headings, then key terms, then details.';
                        break;
                }

                return {
                    duration,
                    conceptsCount: timings.length,
                    conceptsCompleted: timings.filter(t => t.completed).length,
                    avgPaceSeconds: avgPace,
                    paceRating,
                    conceptTimings: timings,
                    recommendation,
                };
            },

            dismissSessionSummary: () => {
                set({ showSessionSummary: false });
            },

            getFormattedTimeRemaining: () => {
                const seconds = get().timeRemainingSeconds;
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            },

            getProgressPercent: () => {
                const state = get();
                const totalSeconds = state.sessionType === 'focus'
                    ? state.focusDurationMinutes * 60
                    : state.breakDurationMinutes * 60;
                return ((totalSeconds - state.timeRemainingSeconds) / totalSeconds) * 100;
            },

            getConceptsThisSession: () => {
                return get().conceptTimings.length;
            },

            getAvgPaceThisSession: () => {
                const timings = get().conceptTimings.filter(t => t.durationSeconds > 0);
                if (timings.length === 0) return 0;
                return Math.round(timings.reduce((sum, t) => sum + t.durationSeconds, 0) / timings.length);
            },

            getPaceRating: (avgSeconds) => {
                const target = FOCUS_SESSION_CONFIG.CONCEPT_TARGET_SECONDS;
                const ratio = avgSeconds / target;

                if (ratio <= FOCUS_SESSION_CONFIG.PACE_THRESHOLDS.optimal) return 'optimal';
                if (ratio <= FOCUS_SESSION_CONFIG.PACE_THRESHOLDS.good) return 'good';
                if (ratio <= FOCUS_SESSION_CONFIG.PACE_THRESHOLDS.warning) return 'warning';
                return 'overtime';
            },
        }),
        {
            name: 'sensa-focus-session',
            partialize: (state) => ({
                focusDurationMinutes: state.focusDurationMinutes,
                breakDurationMinutes: state.breakDurationMinutes,
                totalSessionsCompleted: state.totalSessionsCompleted,
                totalFocusMinutes: state.totalFocusMinutes,
                totalConceptsMastered: state.totalConceptsMastered,
                sessionsUntilLongBreak: state.sessionsUntilLongBreak,
            }),
        }
    )
);
