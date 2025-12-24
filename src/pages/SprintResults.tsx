/**
 * SprintResults Page
 * 
 * Displays the Automaticity Sprint results with score breakdown,
 * category performance, and exam readiness assessment.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Trophy, Target, Check, AlertTriangle } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import { getSprintRecommendation } from '@/lib/generation/sprint-generator';
import styles from './SprintResults.module.css';

export default function SprintResults() {
    const navigate = useNavigate();
    const { sprintResult, clearSprintResult } = useLearningStore();
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animate score counting up
    useEffect(() => {
        if (!sprintResult) return;

        const targetScore = sprintResult.automaticityScore;
        const duration = 1500;
        const steps = 40;
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
    }, [sprintResult]);

    if (!sprintResult) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📋</span>
                        <h2 className={styles.emptyTitle}>No Sprint Results</h2>
                        <p className={styles.emptyDescription}>
                            Complete a sprint to see your results here.
                        </p>
                        <button
                            className={styles.primaryButton}
                            onClick={() => navigate('/sprint')}
                        >
                            Start Sprint
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const {
        automaticityScore,
        correctAnswers,
        totalQuestions,
        avgResponseTimeMs,
        timeoutAnswers,
        categoryBreakdown,
        examReady,
    } = sprintResult;

    const recommendation = getSprintRecommendation(sprintResult);

    // Determine emoji based on score
    const getScoreEmoji = () => {
        if (automaticityScore >= 85) return '🏆';
        if (automaticityScore >= 70) return '🎯';
        if (automaticityScore >= 50) return '💪';
        return '📚';
    };

    const handleRetry = () => {
        clearSprintResult();
        navigate('/sprint');
    };

    const handleHome = () => {
        navigate('/');
    };

    // Calculate category percentages
    const getCategoryPercent = (cat: { correct: number; total: number }) => {
        return cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Hero with animated score */}
                <div className={styles.hero}>
                    <span className={styles.heroEmoji}>{getScoreEmoji()}</span>
                    <p className={styles.heroTitle}>Automaticity Score</p>
                    <div className={styles.scoreDisplay}>{animatedScore}%</div>
                    <p className={styles.scoreLabel}>
                        {correctAnswers} of {totalQuestions} correct
                    </p>

                    <div className={`${styles.examBadge} ${examReady ? styles.ready : styles.notReady}`}>
                        {examReady ? (
                            <>
                                <Check size={18} />
                                Exam Ready!
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={18} />
                                Keep Practicing
                            </>
                        )}
                    </div>
                </div>

                {/* Stats grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{correctAnswers}</div>
                        <div className={styles.statLabel}>Correct</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{totalQuestions - correctAnswers - timeoutAnswers}</div>
                        <div className={styles.statLabel}>Wrong</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{timeoutAnswers}</div>
                        <div className={styles.statLabel}>Timeouts</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{(avgResponseTimeMs / 1000).toFixed(1)}s</div>
                        <div className={styles.statLabel}>Avg Time</div>
                    </div>
                </div>

                {/* Category breakdown */}
                <div className={styles.breakdown}>
                    <h3 className={styles.breakdownTitle}>Category Performance</h3>
                    <div className={styles.breakdownGrid}>
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Core</span>
                            <div className={styles.breakdownBar}>
                                <div
                                    className={`${styles.breakdownFill} ${styles.core}`}
                                    style={{ width: `${getCategoryPercent(categoryBreakdown.core)}%` }}
                                />
                            </div>
                            <span className={styles.breakdownScore}>
                                {categoryBreakdown.core.correct}/{categoryBreakdown.core.total}
                            </span>
                        </div>

                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Discrimination</span>
                            <div className={styles.breakdownBar}>
                                <div
                                    className={`${styles.breakdownFill} ${styles.discrimination}`}
                                    style={{ width: `${getCategoryPercent(categoryBreakdown.discrimination)}%` }}
                                />
                            </div>
                            <span className={styles.breakdownScore}>
                                {categoryBreakdown.discrimination.correct}/{categoryBreakdown.discrimination.total}
                            </span>
                        </div>

                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Application</span>
                            <div className={styles.breakdownBar}>
                                <div
                                    className={`${styles.breakdownFill} ${styles.application}`}
                                    style={{ width: `${getCategoryPercent(categoryBreakdown.application)}%` }}
                                />
                            </div>
                            <span className={styles.breakdownScore}>
                                {categoryBreakdown.application.correct}/{categoryBreakdown.application.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recommendation message */}
                <div className={styles.message}>
                    <p className={styles.messageText}>{recommendation.message}</p>
                </div>

                {/* CTA buttons */}
                <div className={styles.cta}>
                    {recommendation.action === 'celebrate' ? (
                        <button className={styles.primaryButton} onClick={handleHome}>
                            <Trophy size={20} />
                            Complete Your Journey
                        </button>
                    ) : recommendation.action === 'retry' ? (
                        <button className={styles.primaryButton} onClick={handleRetry}>
                            <RotateCcw size={20} />
                            Try Another Sprint
                        </button>
                    ) : (
                        <button className={styles.primaryButton} onClick={() => navigate('/learn')}>
                            <Target size={20} />
                            Review Weak Areas
                        </button>
                    )}

                    <button className={styles.secondaryButton} onClick={handleHome}>
                        <Home size={18} />
                        Back to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
