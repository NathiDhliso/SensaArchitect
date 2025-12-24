/**
 * RoutePreviewCard Component
 * 
 * Cognitive Load Theory: Advance Organizer
 * Shows a brief overview of the Palace route before diving into Street View,
 * giving learners a mental scaffold of what to expect.
 */

import { motion } from 'framer-motion';
import { Map, Building2, Navigation, ArrowRight } from 'lucide-react';
import styles from './RoutePreviewCard.module.css';

interface RoutePreviewCardProps {
    routeName: string;
    buildingCount: number;
    conceptCount: number;
    onStart: () => void;
}

export default function RoutePreviewCard({
    routeName,
    buildingCount,
    conceptCount,
    onStart,
}: RoutePreviewCardProps) {
    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
            >
                <div className={styles.iconContainer}>
                    <Map size={32} className={styles.icon} />
                </div>

                <h2 className={styles.title}>Your Memory Palace</h2>
                <p className={styles.routeName}>{routeName}</p>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <Building2 size={18} className={styles.statIcon} />
                        <span className={styles.statValue}>{buildingCount}</span>
                        <span className={styles.statLabel}>Locations</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.stat}>
                        <Navigation size={18} className={styles.statIcon} />
                        <span className={styles.statValue}>{conceptCount}</span>
                        <span className={styles.statLabel}>Concepts</span>
                    </div>
                </div>

                <p className={styles.hint}>
                    Walk through each location to anchor concepts in your memory
                </p>

                <button className={styles.startButton} onClick={onStart}>
                    Begin Exploration
                    <ArrowRight size={18} />
                </button>
            </motion.div>
        </motion.div>
    );
}
