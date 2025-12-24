/**
 * Sprint Types
 * 
 * Types for the Automaticity Sprint system - the final 15-minute
 * pattern recognition test that assesses exam readiness.
 */

export interface SprintQuestion {
    id: string;
    question: string;
    correctAnswer: boolean;
    explanation: string;
    conceptTags: string[];
    category: 'core' | 'discrimination' | 'application';
}

export interface SprintAnswer {
    questionId: string;
    userAnswer: boolean | null;  // null indicates timeout
    correct: boolean;
    responseTimeMs: number;
}

export interface SprintResult {
    totalQuestions: number;
    correctAnswers: number;
    timeoutAnswers: number;
    avgResponseTimeMs: number;
    automaticityScore: number;  // 0-100
    categoryBreakdown: {
        core: { correct: number; total: number };
        discrimination: { correct: number; total: number };
        application: { correct: number; total: number };
    };
    weakConcepts: string[];
    examReady: boolean;
    completedAt: string;
}

export interface SprintState {
    currentIndex: number;
    questions: SprintQuestion[];
    answers: SprintAnswer[];
    timeRemaining: number;  // Total sprint time in seconds
    questionTimeRemaining: number;  // Per-question time
    isActive: boolean;
    isComplete: boolean;
    showFeedback: boolean;
    lastAnswerCorrect: boolean | null;
}

/**
 * Configuration for sprint generation
 */
export interface SprintConfig {
    questionCount: number;
    secondsPerQuestion: number;
    totalTimeMinutes: number;
    distribution: {
        core: number;
        discrimination: number;
        application: number;
    };
}

export const DEFAULT_SPRINT_CONFIG: SprintConfig = {
    questionCount: 30,
    secondsPerQuestion: 6,
    totalTimeMinutes: 15,
    distribution: {
        core: 10,
        discrimination: 10,
        application: 10,
    },
};
