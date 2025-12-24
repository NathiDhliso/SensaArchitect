/**
 * DiagnosticModal Component
 * 
 * Full-screen focus mode for the Lightning Round diagnostic.
 * Assesses user's prior knowledge in 2 minutes to personalize learning path.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Brain, ChevronRight } from 'lucide-react';
import { useGenerationStore } from '@/store/generation-store';
import { generateDiagnosticQuestions, calculateDiagnosticResult, getConceptsToSkip } from '@/lib/generation/diagnostic-generator';
import { UI_TIMINGS, DIAGNOSTIC_CONFIG } from '@/constants/ui-constants';
import { FEEDBACK_COLORS } from '@/constants/theme-colors';
import type { DiagnosticQuestion, DiagnosticAnswer } from '@/lib/types/diagnostic';
import styles from './DiagnosticModal.module.css';

interface DiagnosticModalProps {
    subject: string;
    onComplete: () => void;
    onSkip: () => void;
}

type ModalPhase = 'intro' | 'loading' | 'quiz' | 'feedback' | 'analyzing';

export default function DiagnosticModal({ subject, onComplete, onSkip }: DiagnosticModalProps) {
    const { bedrockConfig, setDiagnosticResult } = useGenerationStore();

    // Phase state
    const [phase, setPhase] = useState<ModalPhase>('intro');

    // Quiz state
    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Timer state
    const [totalTimeRemaining, setTotalTimeRemaining] = useState<number>(DIAGNOSTIC_CONFIG.TOTAL_TIME_SECONDS);
    const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number>(DIAGNOSTIC_CONFIG.SECONDS_PER_QUESTION);
    const questionStartTime = useRef<number>(Date.now());

    // Error state
    const [error, setError] = useState<string | null>(null);

    const currentQuestion = questions[currentIndex];

    // Start diagnostic
    const handleStart = async () => {
        if (!bedrockConfig) {
            setError('AWS credentials not configured. Please configure in Settings.');
            return;
        }

        setPhase('loading');
        setError(null);

        try {
            const generatedQuestions = await generateDiagnosticQuestions(subject, bedrockConfig);
            setQuestions(generatedQuestions);
            setPhase('quiz');
            questionStartTime.current = Date.now();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate questions');
            setPhase('intro');
        }
    };

    // Handle answer selection
    const handleAnswer = useCallback((optionIndex: number) => {
        if (phase !== 'quiz' || selectedOption !== null) return;

        const responseTimeMs = Date.now() - questionStartTime.current;
        const correct = optionIndex === currentQuestion.correctIndex;

        setSelectedOption(optionIndex);
        setIsCorrect(correct);
        setPhase('feedback');

        const answer: DiagnosticAnswer = {
            questionId: currentQuestion.id,
            selectedIndex: optionIndex,
            correct,
            responseTimeMs,
        };

        setAnswers(prev => [...prev, answer]);

        // Show feedback briefly, then advance
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsCorrect(null);
                setPhase('quiz');
                setQuestionTimeRemaining(DIAGNOSTIC_CONFIG.SECONDS_PER_QUESTION);
                questionStartTime.current = Date.now();
            } else {
                finishDiagnostic([...answers, answer]);
            }
        }, UI_TIMINGS.DIAGNOSTIC_FEEDBACK_TIME);
    }, [phase, selectedOption, currentQuestion, currentIndex, questions.length, answers]);

    // Finish and calculate results
    const finishDiagnostic = (finalAnswers: DiagnosticAnswer[]) => {
        setPhase('analyzing');

        setTimeout(() => {
            const result = calculateDiagnosticResult(questions, finalAnswers);
            const conceptsToSkip = getConceptsToSkip(result);
            setDiagnosticResult(result, conceptsToSkip);
            onComplete();
        }, UI_TIMINGS.DIAGNOSTIC_RESULTS_DELAY);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (phase !== 'quiz' || selectedOption !== null) return;

            const keyMap: Record<string, number> = {
                '1': 0, '2': 1, '3': 2, '4': 3,
                'a': 0, 'b': 1, 'c': 2, 'd': 3,
            };

            const optionIndex = keyMap[e.key.toLowerCase()];
            if (optionIndex !== undefined && optionIndex < (currentQuestion?.options.length ?? 0)) {
                handleAnswer(optionIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, selectedOption, currentQuestion, handleAnswer]);

    // Total timer countdown
    useEffect(() => {
        if (phase !== 'quiz' && phase !== 'feedback') return;

        const interval = setInterval(() => {
            setTotalTimeRemaining(prev => {
                if (prev <= 1) {
                    // Time's up - finish with current answers
                    finishDiagnostic(answers);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [phase, answers]);

    // Question timer countdown
    useEffect(() => {
        if (phase !== 'quiz') return;

        const interval = setInterval(() => {
            setQuestionTimeRemaining(prev => {
                if (prev <= 0) {
                    // Auto-advance on timeout (count as wrong)
                    handleAnswer(-1); // -1 indicates timeout
                    return DIAGNOSTIC_CONFIG.SECONDS_PER_QUESTION;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [phase, handleAnswer]);

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get timer urgency class
    const getTimerClass = () => {
        if (totalTimeRemaining <= 30) return styles.critical;
        if (totalTimeRemaining <= 60) return styles.urgent;
        return '';
    };

    // Get question timer class
    const getQuestionTimerClass = () => {
        if (questionTimeRemaining <= 2) return styles.critical;
        if (questionTimeRemaining <= 4) return styles.warning;
        return '';
    };

    return (
        <div className={styles.overlay}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Header with timer */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.headerIcon}>⚡</span>
                        <h2 className={styles.title}>Lightning Diagnostic</h2>
                    </div>
                    {(phase === 'quiz' || phase === 'feedback') && (
                        <div className={`${styles.timerBadge} ${getTimerClass()}`}>
                            <Clock className={styles.timerIcon} />
                            {formatTime(totalTimeRemaining)}
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {(phase === 'quiz' || phase === 'feedback') && (
                    <div className={styles.progressSection}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                        <div className={styles.progressLabel}>
                            <span>Question {currentIndex + 1} of {questions.length}</span>
                            <span>{answers.filter(a => a.correct).length} correct</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        {/* Intro Screen */}
                        {phase === 'intro' && (
                            <motion.div
                                key="intro"
                                className={styles.introScreen}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <span className={styles.introIcon}>🎯</span>
                                <h3 className={styles.introTitle}>Quick Knowledge Check</h3>
                                <p className={styles.introDescription}>
                                    We'll customize your 2-hour learning path by understanding what you already know.
                                    Answer quickly - this takes just 2 minutes!
                                </p>

                                <div className={styles.introHighlights}>
                                    <div className={styles.introHighlight}>
                                        <span className={styles.introHighlightValue}>20</span>
                                        <span className={styles.introHighlightLabel}>Questions</span>
                                    </div>
                                    <div className={styles.introHighlight}>
                                        <span className={styles.introHighlightValue}>6s</span>
                                        <span className={styles.introHighlightLabel}>Per Question</span>
                                    </div>
                                    <div className={styles.introHighlight}>
                                        <span className={styles.introHighlightValue}>2min</span>
                                        <span className={styles.introHighlightLabel}>Total Time</span>
                                    </div>
                                </div>

                                {error && (
                                    <div style={{ color: FEEDBACK_COLORS.incorrect, marginBottom: '1rem' }}>
                                        {error}
                                    </div>
                                )}

                                <button className={styles.startButton} onClick={handleStart}>
                                    <Zap size={20} />
                                    Start Diagnostic
                                    <ChevronRight size={20} />
                                </button>

                                <button
                                    onClick={onSkip}
                                    style={{
                                        marginTop: '1rem',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-text-light)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    Skip and generate full content
                                </button>
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {phase === 'loading' && (
                            <motion.div
                                key="loading"
                                className={styles.loadingState}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className={styles.spinner} />
                                <p className={styles.loadingText}>
                                    Generating diagnostic questions for {subject}...
                                </p>
                            </motion.div>
                        )}

                        {/* Quiz Phase */}
                        {(phase === 'quiz' || phase === 'feedback') && currentQuestion && (
                            <motion.div
                                key={`question-${currentIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <span className={`${styles.difficultyBadge} ${styles[currentQuestion.difficulty]}`}>
                                        {currentQuestion.difficulty}
                                    </span>
                                </div>

                                <p className={styles.question}>{currentQuestion.question}</p>

                                <div className={styles.optionsGrid}>
                                    {currentQuestion.options.map((option, index) => {
                                        let optionClass = styles.optionButton;
                                        if (selectedOption === index) {
                                            optionClass += isCorrect ? ` ${styles.correct}` : ` ${styles.incorrect}`;
                                        } else if (phase === 'feedback' && index === currentQuestion.correctIndex) {
                                            optionClass += ` ${styles.correct}`;
                                        }

                                        return (
                                            <button
                                                key={index}
                                                className={optionClass}
                                                onClick={() => handleAnswer(index)}
                                                disabled={phase === 'feedback'}
                                            >
                                                <span className={styles.optionKey}>{index + 1}</span>
                                                <span className={styles.optionText}>{option}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Question countdown timer */}
                                {phase === 'quiz' && (
                                    <div className={styles.questionTimer}>
                                        <div
                                            className={`${styles.questionTimerFill} ${getQuestionTimerClass()}`}
                                            style={{ width: `${(questionTimeRemaining / DIAGNOSTIC_CONFIG.SECONDS_PER_QUESTION) * 100}%` }}
                                        />
                                    </div>
                                )}

                                {phase === 'quiz' && (
                                    <div className={styles.keyboardHint}>
                                        Press <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> to answer
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Analyzing Phase */}
                        {phase === 'analyzing' && (
                            <motion.div
                                key="analyzing"
                                className={styles.loadingState}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Brain size={48} style={{ color: 'var(--color-primary-amethyst)', marginBottom: '1rem' }} />
                                <p className={styles.loadingText}>
                                    Analyzing your knowledge gaps...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
