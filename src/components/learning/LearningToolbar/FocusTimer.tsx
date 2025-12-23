import { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import styles from './LearningToolbar.module.css';

interface FocusTimerProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export function FocusTimer({ isOpen, onClose }: FocusTimerProps) {
    const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
    const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES);
    const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    const totalSeconds = isBreak ? breakMinutes * 60 : focusMinutes * 60;
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(isBreak ? breakMinutes * 60 : focusMinutes * 60);
    }, [isBreak, breakMinutes, focusMinutes]);

    const switchMode = useCallback(() => {
        if (!isBreak) {
            setSessionsCompleted(prev => prev + 1);
        }
        setIsBreak(!isBreak);
        setTimeLeft(isBreak ? focusMinutes * 60 : breakMinutes * 60);
        setIsRunning(false);
    }, [isBreak, focusMinutes, breakMinutes]);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(isBreak ? 'Break over!' : 'Focus session complete!', {
                            body: isBreak ? 'Time to focus again!' : 'Great work! Take a break.',
                            icon: '🍅'
                        });
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, isBreak]);

    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            switchMode();
        }
    }, [timeLeft, isRunning, switchMode]);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {isBreak ? <Coffee size={20} /> : '🍅'}
                        {isBreak ? 'Break Time' : 'Focus Timer'}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.timerModal}>
                        <div className={`${styles.timerCircle} ${isBreak ? styles.break : ''}`}>
                            <svg viewBox="0 0 200 200">
                                <circle className={styles.bg} cx="100" cy="100" r="90" />
                                <circle
                                    className={styles.progress}
                                    cx="100"
                                    cy="100"
                                    r="90"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                            <div className={styles.timerTime}>
                                <span className={styles.timerTimeValue}>{formatTime(timeLeft)}</span>
                                <span className={styles.timerTimeLabel}>
                                    {isBreak ? 'Break' : 'Focus'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.timerControls}>
                            <button
                                className={styles.timerControlButton}
                                onClick={handleReset}
                                title="Reset"
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                className={`${styles.timerControlButton} ${styles.primary}`}
                                onClick={isRunning ? handlePause : handleStart}
                            >
                                {isRunning ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button
                                className={styles.timerControlButton}
                                onClick={switchMode}
                                title={isBreak ? 'Start Focus' : 'Take Break'}
                            >
                                <Coffee size={20} />
                            </button>
                        </div>

                        <div className={styles.timerSettings}>
                            <div className={styles.timerSetting}>
                                <span className={styles.timerSettingLabel}>Focus</span>
                                <div className={styles.timerSettingValue}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={focusMinutes}
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || DEFAULT_FOCUS_MINUTES;
                                            setFocusMinutes(val);
                                            if (!isBreak && !isRunning) {
                                                setTimeLeft(val * 60);
                                            }
                                        }}
                                        className={styles.timerSettingInput}
                                        disabled={isRunning}
                                    />
                                    <span>min</span>
                                </div>
                            </div>
                            <div className={styles.timerSetting}>
                                <span className={styles.timerSettingLabel}>Break</span>
                                <div className={styles.timerSettingValue}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={breakMinutes}
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || DEFAULT_BREAK_MINUTES;
                                            setBreakMinutes(val);
                                            if (isBreak && !isRunning) {
                                                setTimeLeft(val * 60);
                                            }
                                        }}
                                        className={styles.timerSettingInput}
                                        disabled={isRunning}
                                    />
                                    <span>min</span>
                                </div>
                            </div>
                            <div className={styles.timerSetting}>
                                <span className={styles.timerSettingLabel}>Sessions</span>
                                <div className={styles.timerSettingValue}>
                                    <strong>{sessionsCompleted}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
