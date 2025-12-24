import { useState, useMemo } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { usePalaceStore } from '@/store/palace-store';
import type { PlacedConcept } from '@/lib/types/palace';
import styles from './EnhancedFeatures.module.css';

interface QuizModeProps {
    onClose: () => void;
}

interface QuizQuestion {
    scenario: string;
    question: string;
    correctConcept: PlacedConcept;
    options: PlacedConcept[];
    building: string;
    explanation: string;
}

const SCENARIOS = [
    "You need to set up {concept} for a new project.",
    "A client asks about implementing {concept}.",
    "You're troubleshooting an issue with {concept}.",
    "You need to explain {concept} to a junior colleague.",
    "The team needs to decide whether to use {concept}.",
];

export default function QuizMode({ onClose }: QuizModeProps) {
    const { currentPalace, recordAnswer } = usePalaceStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const allConcepts = useMemo(() => {
        if (!currentPalace) return [];
        return currentPalace.buildings.flatMap(b => b.concepts);
    }, [currentPalace]);

    const questions = useMemo(() => {
        if (!currentPalace || allConcepts.length < 2) return [];

        const allQuestions: QuizQuestion[] = [];

        currentPalace.buildings.forEach((building, bIdx) => {
            building.concepts.forEach((concept, cIdx) => {
                const scenarioIndex = (bIdx + cIdx) % SCENARIOS.length;
                const scenarioTemplate = SCENARIOS[scenarioIndex];
                const scenario = scenarioTemplate.replace('{concept}', concept.conceptName);

                const otherConcepts = allConcepts.filter(c => c.conceptId !== concept.conceptId);
                const numDistractors = Math.min(3, otherConcepts.length);
                const distractors = otherConcepts.slice(0, numDistractors);

                const options = [concept, ...distractors];

                allQuestions.push({
                    scenario,
                    question: `Which concept in ${building.stageName} helps with this?`,
                    correctConcept: concept,
                    options,
                    building: building.stageName,
                    explanation: concept.lifecycle.phase1[0] ||
                        `${concept.conceptName} is the right choice for this scenario.`,
                });
            });
        });

        const shuffled = [...allQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor((i + 1) * 0.7);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 10);
    }, [currentPalace, allConcepts]);

    if (!currentPalace || questions.length === 0) {
        const message = !currentPalace 
            ? 'No Memory Palace active. Create one from the Results page.'
            : allConcepts.length === 0
                ? 'No concepts in your palace. Recreate it from the Results page.'
                : 'Need at least 2 concepts for quiz. Add more content first.';
        return (
            <div className={styles.quizOverlay}>
                <div className={styles.quizCard}>
                    <p>{message}</p>
                    <button onClick={onClose} className={styles.nextButton}>Close</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correctConcept.conceptId;
    const isComplete = currentIndex >= questions.length - 1 && showFeedback;

    const handleSelectOption = (conceptId: string) => {
        if (showFeedback) return;

        setSelectedOption(conceptId);
        setShowFeedback(true);

        const correct = conceptId === currentQuestion.correctConcept.conceptId;
        recordAnswer(currentQuestion.correctConcept.conceptId, correct);
    };

    const handleNext = () => {
        if (isComplete) {
            onClose();
            return;
        }

        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
    };

    return (
        <div className={styles.quizOverlay}>
            <div className={styles.quizCard}>
                <div className={styles.quizHeader}>
                    <span className={styles.quizProgress}>
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <button className={styles.closeQuiz} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.scenarioBox}>
                    <div className={styles.scenarioLabel}>Scenario</div>
                    <p className={styles.scenarioText}>{currentQuestion.scenario}</p>
                </div>

                <h3 className={styles.quizQuestion}>{currentQuestion.question}</h3>

                <div className={styles.optionsList}>
                    {currentQuestion.options.map(option => {
                        const isSelected = selectedOption === option.conceptId;
                        const isCorrectOption = option.conceptId === currentQuestion.correctConcept.conceptId;

                        let className = styles.optionButton;
                        if (showFeedback && isCorrectOption) className += ` ${styles.optionCorrect}`;
                        if (showFeedback && isSelected && !isCorrectOption) className += ` ${styles.optionIncorrect}`;
                        if (isSelected && !showFeedback) className += ` ${styles.optionSelected}`;

                        return (
                            <button
                                key={option.conceptId}
                                className={className}
                                onClick={() => handleSelectOption(option.conceptId)}
                                disabled={showFeedback}
                            >
                                <span className={styles.optionIndicator}>
                                    {showFeedback && isCorrectOption && <CheckCircle size={16} color="#22c55e" />}
                                    {showFeedback && isSelected && !isCorrectOption && <XCircle size={16} color="#ef4444" />}
                                </span>
                                <span className={styles.optionText}>{option.conceptName}</span>
                            </button>
                        );
                    })}
                </div>

                {showFeedback && (
                    <div className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}`}>
                        <div className={styles.feedbackTitle}>
                            {isCorrect ? (
                                <>
                                    <CheckCircle size={16} />
                                    Correct!
                                </>
                            ) : (
                                <>
                                    <XCircle size={16} />
                                    Incorrect
                                </>
                            )}
                        </div>
                        <p className={styles.feedbackText}>{currentQuestion.explanation}</p>
                    </div>
                )}

                {showFeedback && (
                    <button className={styles.nextButton} onClick={handleNext}>
                        {isComplete ? 'Finish Quiz' : 'Next Question'}
                    </button>
                )}
            </div>
        </div>
    );
}
