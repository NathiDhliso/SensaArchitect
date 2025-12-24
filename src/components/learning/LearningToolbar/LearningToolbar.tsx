/**
 * LearningToolbar Component
 * 
 * Toolbar with learning utilities: Focus Timer, Progress Analytics, Quiz.
 * When a focus session is active, the timer button is hidden since
 * UnifiedSessionBar handles session display.
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
    const { isSessionActive } = useFocusSessionStore();

    const [showTimer, setShowTimer] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);

    return (
        <>
            <div className={styles.toolbar}>
                {progress.conceptsLearnedToday > 0 && (
                    <div className={styles.streakBadge}>
                        <Flame size={14} />
                        {progress.conceptsLearnedToday} today
                    </div>
                )}

                {/* Only show divider and timer button when session is NOT active */}
                {!isSessionActive && (
                    <>
                        {progress.conceptsLearnedToday > 0 && (
                            <div className={styles.toolbarDivider} />
                        )}

                        <button
                            className={styles.toolbarButton}
                            onClick={() => setShowTimer(true)}
                            title="Start Focus Session"
                        >
                            <Timer size={14} />
                            Focus
                        </button>
                    </>
                )}

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
