/**
 * Diagnostic Types
 * 
 * Types for the Lightning Diagnostic system that assesses user's
 * prior knowledge to personalize their 2-hour learning path.
 */

export interface DiagnosticQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    conceptId: string;
    conceptName: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DiagnosticAnswer {
    questionId: string;
    selectedIndex: number;
    correct: boolean;
    responseTimeMs: number;
}

export interface DiagnosticResult {
    /** Concepts the user demonstrated knowledge of */
    knownConcepts: string[];
    /** Concepts the user struggled with */
    weakAreas: string[];
    /** Overall strength score 0-100 */
    strengthScore: number;
    /** Total questions asked */
    totalQuestions: number;
    /** Number of correct answers */
    correctAnswers: number;
    /** Average response time in ms */
    avgResponseTimeMs: number;
    /** Estimated minutes needed to fill gaps */
    estimatedGapMinutes: number;
    /** Individual answers for analysis */
    answers: DiagnosticAnswer[];
    /** Timestamp of diagnostic completion */
    completedAt: string;
}

export interface DiagnosticState {
    /** Current question index (0-based) */
    currentIndex: number;
    /** All questions for this diagnostic */
    questions: DiagnosticQuestion[];
    /** User's answers so far */
    answers: DiagnosticAnswer[];
    /** Time remaining in seconds */
    timeRemaining: number;
    /** Whether the diagnostic is in progress */
    isActive: boolean;
    /** Whether the diagnostic is complete */
    isComplete: boolean;
}

/**
 * Configuration for diagnostic generation
 */
export interface DiagnosticConfig {
    /** Total number of questions (default: 20) */
    questionCount: number;
    /** Time per question in seconds (default: 6) */
    secondsPerQuestion: number;
    /** Distribution by difficulty */
    distribution: {
        beginner: number;
        intermediate: number;
        advanced: number;
    };
}

export const DEFAULT_DIAGNOSTIC_CONFIG: DiagnosticConfig = {
    questionCount: 20,
    secondsPerQuestion: 6,
    distribution: {
        beginner: 7,
        intermediate: 7,
        advanced: 6,
    },
};
