/**
 * LearningToolbar Component
 * 
 * Toolbar with learning utilities: Focus Timer, Progress Analytics, Quiz.
 * Now integrated with focus-session store for unified session display.
 */

import { useState } from 'react';
import { Timer, BarChart3, Brain, Flame } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import { useFocusSessionStore } from '@/store/focus-session-store';
import { FocusTimer } from './FocusTimer';
import { ProgressAnalytics } from './ProgressAnalytics';
import { QuickQuiz } from './QuickQuiz';
import styles from './LearningToolbar.module.css';

export function LearningToolbar() {
    const { progress } = useLearningStore();
    const {
        isSessionActive,
        sessionType,
        getFormattedTimeRemaining
    } = useFocusSessionStore();

    const [showTimer, setShowTimer] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);

    const handleTimerClick = () => {
        setShowTimer(true);
    };

    // Determine button state based on session
    const getTimerButtonClass = () => {
        if (!isSessionActive) return '';
        return sessionType === 'focus' ? styles.active : styles.warning;
    };

    const getTimerButtonText = () => {
        if (!isSessionActive) return 'Focus';
        return getFormattedTimeRemaining();
    };

    return (
        <>
            <div className={styles.toolbar}>
                {progress.conceptsLearnedToday > 0 && (
                    <div className={styles.streakBadge}>
                        <Flame size={14} />
                        {progress.conceptsLearnedToday} today
                    </div>
                )}

                <div className={styles.toolbarDivider} />

                <button
                    className={`${styles.toolbarButton} ${getTimerButtonClass()}`}
                    onClick={handleTimerClick}
                    title="Focus Timer"
                >
                    <Timer size={14} />
                    {getTimerButtonText()}
                </button>

                <button
                    className={`${styles.toolbarButton} ${styles.statsButton}`}
                    onClick={() => setShowAnalytics(true)}
                    title="Progress Analytics"
                >
                    <BarChart3 size={14} />
                    Stats
                    {progress.completedConcepts.length > 0 && (
                        <span className={styles.statsBadge}>
                            {progress.completedConcepts.length}
                        </span>
                    )}
                </button>

                <button
                    className={styles.toolbarButton}
                    onClick={() => setShowQuiz(true)}
                    title="Quick Quiz"
                >
                    <Brain size={14} />
                    Quiz
                </button>
            </div>

            <FocusTimer
                isOpen={showTimer}
                onClose={() => setShowTimer(false)}
            />
            <ProgressAnalytics
                isOpen={showAnalytics}
                onClose={() => setShowAnalytics(false)}
            />
            <QuickQuiz
                isOpen={showQuiz}
                onClose={() => setShowQuiz(false)}
            />
        </>
    );
}
