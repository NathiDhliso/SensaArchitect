/**
 * LoadingSpinner Component
 * 
 * Unified loading spinner for consistent UI across the app.
 * Uses centralized animation from animations.css.
 */

import { forwardRef } from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
    /** Spinner size: 'sm' (16px), 'md' (32px), 'lg' (48px) */
    size?: 'sm' | 'md' | 'lg';
    /** Optional loading message displayed below spinner */
    message?: string;
    /** Optional secondary message (smaller text) */
    subMessage?: string;
    /** Color variant */
    variant?: 'primary' | 'accent' | 'light';
    /** Additional CSS class */
    className?: string;
}

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
    ({ size = 'md', message, subMessage, variant = 'primary', className }, ref) => {
        return (
            <div
                ref={ref}
                className={`${styles.container} ${className || ''}`}
            >
                <div
                    className={`${styles.spinner} ${styles[size]} ${styles[variant]}`}
                    role="status"
                    aria-label={message || 'Loading'}
                />
                {message && <p className={styles.message}>{message}</p>}
                {subMessage && <p className={styles.subMessage}>{subMessage}</p>}
            </div>
        );
    }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
