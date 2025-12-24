/**
 * NeuralResetModal Component
 * 
 * A calming modal that encourages users to take a mental break
 * when cognitive load is too high. Includes a 2-minute timer
 * and quick relaxation tips.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, RefreshCcw } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import styles from './NeuralResetModal.module.css';

const RESET_TIME_SECONDS = 120; // 2 minutes

const BREAK_TIPS = [
    {
        icon: '👀',
        title: 'Rest your eyes',
        desc: 'Look at something 20 feet away for 20 seconds',
    },
    {
        icon: '🫁',
        title: 'Deep breaths',
        desc: 'Inhale for 4s, hold 4s, exhale for 4s',
    },
    {
        icon: '🚶',
        title: 'Quick stretch',
        desc: 'Stand up and move around for a moment',
    },
];

export default function NeuralResetModal() {
    const { showNeuralReset, dismissNeuralReset } = useLearningStore();
    const [timeRemaining, setTimeRemaining] = useState(RESET_TIME_SECONDS);
    const [isActive, setIsActive] = useState(false);

    // Reset timer when modal opens
    useEffect(() => {
        if (showNeuralReset) {
            setTimeRemaining(RESET_TIME_SECONDS);
            setIsActive(false);
        }
    }, [showNeuralReset]);

    // Timer countdown
    useEffect(() => {
        if (!isActive || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    setIsActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeRemaining]);

    const handleStartTimer = useCallback(() => {
        setIsActive(true);
    }, []);

    const handleDismiss = useCallback(() => {
        dismissNeuralReset();
    }, [dismissNeuralReset]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!showNeuralReset) return null;

    return (
        <div className={styles.overlay}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.icon}>🧘</span>
                    <h2 className={styles.title}>Neural Reset</h2>
                    <p className={styles.subtitle}>
                        Your brain needs a quick recharge
                    </p>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <ul className={styles.tips}>
                        {BREAK_TIPS.map((tip, index) => (
                            <li key={index} className={styles.tip}>
                                <span className={styles.tipIcon}>{tip.icon}</span>
                                <div className={styles.tipText}>
                                    <div className={styles.tipTitle}>{tip.title}</div>
                                    <div className={styles.tipDesc}>{tip.desc}</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Timer */}
                    <div className={styles.timer}>
                        <div className={styles.timerLabel}>
                            {isActive ? 'Break in progress...' : 'Recommended break time'}
                        </div>
                        <div className={`${styles.timerDisplay} ${isActive ? styles.active : ''}`}>
                            {formatTime(timeRemaining)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    {!isActive && timeRemaining === RESET_TIME_SECONDS ? (
                        <button className={styles.primaryButton} onClick={handleStartTimer}>
                            <Play size={20} />
                            Start 2-Minute Break
                        </button>
                    ) : isActive ? (
                        <button className={styles.primaryButton} disabled>
                            <RefreshCcw size={20} className="animate-spin" />
                            Resetting...
                        </button>
                    ) : (
                        <button className={styles.primaryButton} onClick={handleDismiss}>
                            <RefreshCcw size={20} />
                            Continue Learning
                        </button>
                    )}

                    <button className={styles.secondaryButton} onClick={handleDismiss}>
                        Skip for now
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
