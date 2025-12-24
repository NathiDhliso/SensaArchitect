/**
 * CognitiveGauge Component
 * 
 * Displays real-time cognitive load indicator to help users
 * understand their mental state and take breaks when needed.
 */

import { Brain, Zap, AlertTriangle, Battery } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import styles from './CognitiveGauge.module.css';

interface CognitiveGaugeProps {
    /** Compact display mode for smaller spaces */
    compact?: boolean;
}

export default function CognitiveGauge({ compact = false }: CognitiveGaugeProps) {
    const { cognitiveMetrics, getCognitiveLoadLevel } = useLearningStore();

    const loadLevel = getCognitiveLoadLevel();
    const loadPercent = cognitiveMetrics.currentLoad;

    // Get status message based on load level
    const getStatusMessage = () => {
        switch (loadLevel) {
            case 'low':
                return 'Fresh';
            case 'optimal':
                return 'Focused';
            case 'high':
                return 'Warming';
            case 'overload':
                return 'Rest needed';
        }
    };

    // Get icon based on load level
    const getIcon = () => {
        switch (loadLevel) {
            case 'low':
                return <Battery className={styles.icon} />;
            case 'optimal':
                return <Zap className={styles.icon} />;
            case 'high':
                return <Brain className={styles.icon} />;
            case 'overload':
                return <AlertTriangle className={styles.icon} />;
        }
    };

    return (
        <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
            <div className={styles.label}>
                <Brain className={styles.icon} />
                <span>Mental Load</span>
            </div>

            <div className={styles.gaugeBar}>
                <div
                    className={`${styles.gaugeFill} ${styles[loadLevel]}`}
                    style={{ width: `${loadPercent}%` }}
                />
            </div>

            <div className={`${styles.status} ${styles[loadLevel]}`}>
                {getIcon()}
                {getStatusMessage()}
            </div>
        </div>
    );
}
