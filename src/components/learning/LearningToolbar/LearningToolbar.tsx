import { useState, useEffect } from 'react';
import { Timer, BarChart3, Brain, Flame } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import { FocusTimer } from './FocusTimer';
import { ProgressAnalytics } from './ProgressAnalytics';
import { QuickQuiz } from './QuickQuiz';
import styles from './LearningToolbar.module.css';

export function LearningToolbar() {
    const { progress } = useLearningStore();
    const [showTimer, setShowTimer] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [sessionTime, setSessionTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        if (!isTimerRunning) return;

        const interval = setInterval(() => {
            setSessionTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatSessionTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimerToggle = () => {
        if (isTimerRunning) {
            setIsTimerRunning(false);
        } else {
            setShowTimer(true);
        }
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
                    className={`${styles.toolbarButton} ${isTimerRunning ? styles.active : ''}`}
                    onClick={handleTimerToggle}
                    title="Focus Timer"
                >
                    <Timer size={14} />
                    {isTimerRunning ? formatSessionTime(sessionTime) : 'Focus'}
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
                onClose={() => {
                    setShowTimer(false);
                    setIsTimerRunning(true);
                }} 
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
