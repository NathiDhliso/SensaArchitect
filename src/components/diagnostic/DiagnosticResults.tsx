/**
 * DiagnosticResults Component
 * 
 * Shows the user their knowledge assessment results and creates
 * psychological buy-in before starting the learning journey.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, ChevronRight, Target, SkipForward } from 'lucide-react';
import { useGenerationStore } from '@/store/generation-store';
import styles from './DiagnosticResults.module.css';

interface DiagnosticResultsProps {
    onContinue: () => void;
}

export default function DiagnosticResults({ onContinue }: DiagnosticResultsProps) {
    const { diagnosticResult, conceptsToSkip } = useGenerationStore();
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animate score counting up
    useEffect(() => {
        if (!diagnosticResult) return;

        const targetScore = diagnosticResult.strengthScore;
        const duration = 1000; // 1 second
        const steps = 30;
        const increment = targetScore / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(Math.round(increment * step), targetScore);
            setAnimatedScore(current);

            if (step >= steps) {
                clearInterval(timer);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [diagnosticResult]);

    if (!diagnosticResult) {
        return null;
    }

    const { strengthScore, correctAnswers, totalQuestions, estimatedGapMinutes, weakAreas } = diagnosticResult;
    const conceptsSkipped = conceptsToSkip.length;
    const conceptsToLearn = weakAreas.length;

    // Determine emoji based on score
    const getScoreEmoji = () => {
        if (strengthScore >= 80) return '🏆';
        if (strengthScore >= 60) return '💪';
        if (strengthScore >= 40) return '📚';
        return '🌱';
    };

    // Determine message based on score
    const getScoreMessage = () => {
        if (strengthScore >= 80) return 'Impressive foundation!';
        if (strengthScore >= 60) return 'Solid starting point!';
        if (strengthScore >= 40) return 'Good base to build on!';
        return 'Perfect learning opportunity!';
    };

    return (
        <div className={styles.overlay}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Hero with animated score */}
                <div className={styles.hero}>
                    <span className={styles.heroIcon}>{getScoreEmoji()}</span>
                    <p className={styles.heroTitle}>{getScoreMessage()}</p>
                    <div className={`${styles.scoreDisplay} ${styles.animate}`}>
                        {animatedScore}%
                    </div>
                    <p className={styles.scoreSubtitle}>
                        You answered {correctAnswers} of {totalQuestions} correctly
                    </p>
                </div>

                {/* Stats grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.stat}>
                        <div className={`${styles.statValue} ${styles.highlight}`}>
                            {conceptsSkipped}
                        </div>
                        <div className={styles.statLabel}>Concepts Skipped</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={`${styles.statValue} ${styles.accent}`}>
                            {conceptsToLearn}
                        </div>
                        <div className={styles.statLabel}>To Focus On</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>
                            {estimatedGapMinutes}m
                        </div>
                        <div className={styles.statLabel}>Est. Time</div>
                    </div>
                </div>

                {/* Benefits */}
                <div className={styles.benefits}>
                    <ul className={styles.benefitsList}>
                        <li className={styles.benefit}>
                            <div className={styles.benefitIcon}>
                                <SkipForward size={16} />
                            </div>
                            <div className={styles.benefitText}>
                                <div className={styles.benefitTitle}>
                                    Skipping {conceptsSkipped} concepts you know
                                </div>
                                <div className={styles.benefitDesc}>
                                    No wasted time on material you've mastered
                                </div>
                            </div>
                        </li>
                        <li className={styles.benefit}>
                            <div className={styles.benefitIcon}>
                                <Target size={16} />
                            </div>
                            <div className={styles.benefitText}>
                                <div className={styles.benefitTitle}>
                                    Focusing on {conceptsToLearn} key gaps
                                </div>
                                <div className={styles.benefitDesc}>
                                    High-leverage concepts for maximum impact
                                </div>
                            </div>
                        </li>
                        <li className={styles.benefit}>
                            <div className={styles.benefitIcon}>
                                <Clock size={16} />
                            </div>
                            <div className={styles.benefitText}>
                                <div className={styles.benefitTitle}>
                                    Custom 2-hour path created
                                </div>
                                <div className={styles.benefitDesc}>
                                    Personalized to your current knowledge
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* CTA */}
                <div className={styles.cta}>
                    <button className={styles.ctaButton} onClick={onContinue}>
                        <Zap size={20} />
                        Build My Learning Sprint
                        <ChevronRight size={20} />
                    </button>
                    <p className={styles.ctaSubtext}>
                        Your personalized learning content will be generated now
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
