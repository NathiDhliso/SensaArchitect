/**
 * DiagnosticModal Component
 * 
 * Full-screen focus mode for the Lightning Round diagnostic.
 * Assesses user's prior knowledge in 2 minutes to personalize learning path.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { useGenerationStore } from '@/store/generation-store';
import { generateDiagnosticQuestions, calculateDiagnosticResult, getConceptsToSkip } from '@/lib/generation/diagnostic-generator';
import { UI_TIMINGS, DIAGNOSTIC_CONFIG } from '@/constants/ui-constants';
import { formatTime, getTimerUrgency } from '@/lib/utils';
import type { DiagnosticQuestion, DiagnosticAnswer } from '@/lib/types/diagnostic';
import styles from './DiagnosticModal.module.css';

interface DiagnosticModalProps {
    subject: string;
    onComplete: () => void;
    onSkip: () => void;
}

type ModalPhase = 'countdown' | 'loading' | 'quiz' | 'feedback';

export default function DiagnosticModal({ subject, onComplete, onSkip }: DiagnosticModalProps) {
    const { bedrockConfig, setDiagnosticResult, pass1Data } = useGenerationStore();

    // Phase state
    const [phase, setPhase] = useState<ModalPhase>('countdown');
    const [countdown, setCountdown] = useState(3);

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

    // Auto-start countdown and then load questions
    useEffect(() => {
        if (phase !== 'countdown') return;

        // Check prerequisites first
        if (!bedrockConfig) {
            setError('AWS credentials not configured.');
            return;
        }

        // Countdown timer
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }

        // Start loading when countdown hits 0
        setPhase('loading');
        // Pass concepts from Pass 1 if available for more targeted questions
        const concepts = pass1Data?.concepts;
        generateDiagnosticQuestions(subject, bedrockConfig, concepts)
            .then(generatedQuestions => {
                setQuestions(generatedQuestions);
                setPhase('quiz');
                questionStartTime.current = Date.now();
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to generate questions');
                onSkip(); // Go straight to content generation on error
            });
    }, [phase, countdown, bedrockConfig, subject, pass1Data, onSkip]);

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

    // Finish and calculate results - immediately, no fake delay
    const finishDiagnostic = (finalAnswers: DiagnosticAnswer[]) => {
        const result = calculateDiagnosticResult(questions, finalAnswers);
        const conceptsToSkip = getConceptsToSkip(result);
        setDiagnosticResult(result, conceptsToSkip);
        onComplete();
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

    const timerUrgency = getTimerUrgency(totalTimeRemaining, 60, 30);
    const getTimerClass = () => timerUrgency === 'critical' ? styles.critical : timerUrgency === 'warning' ? styles.urgent : '';

    const questionUrgency = getTimerUrgency(questionTimeRemaining, 4, 2);
    const getQuestionTimerClass = () => questionUrgency === 'critical' ? styles.critical : questionUrgency === 'warning' ? styles.warning : '';

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
                        {/* Countdown Screen */}
                        {phase === 'countdown' && !error && (
                            <motion.div
                                key="countdown"
                                className={styles.countdownScreen}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    key={countdown}
                                    className={styles.countdownNumber}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.5, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {countdown > 0 ? countdown : '⚡'}
                                </motion.div>
                                <p className={styles.countdownLabel}>
                                    {countdown > 0 ? 'Quick knowledge check...' : 'GO!'}
                                </p>
                                <button
                                    onClick={onSkip}
                                    className={styles.skipLink}
                                >
                                    Skip diagnostic
                                </button>
                            </motion.div>
                        )}

                        {/* Error State */}
                        {phase === 'countdown' && error && (
                            <motion.div
                                key="error"
                                className={styles.introScreen}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <span className={styles.introIcon}>⚠️</span>
                                <h3 className={styles.introTitle}>Can't Start Diagnostic</h3>
                                <p className={styles.introDescription}>{error}</p>
                                <button className={styles.startButton} onClick={onSkip}>
                                    <ChevronRight size={20} />
                                    Continue Without Diagnostic
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
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
