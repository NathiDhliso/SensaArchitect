import { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb } from 'lucide-react';
import type { PlacedConcept } from '@/lib/types/palace';
import type { PlacementSlot } from '@/lib/types/palace';
import styles from './LifecycleCard.module.css';

interface LifecycleCardProps {
    concept: PlacedConcept;
    slot: PlacementSlot | undefined;
    lifecycleLabels?: {
        phase1: string;
        phase2: string;
        phase3: string;
    };
}

export default function LifecycleCard({ concept, slot, lifecycleLabels }: LifecycleCardProps) {
    const phase1Label = lifecycleLabels?.phase1 || 'PHASE 1';
    const phase2Label = lifecycleLabels?.phase2 || 'PHASE 2';
    const phase3Label = lifecycleLabels?.phase3 || 'PHASE 3';
    const [expanded, setExpanded] = useState(false);

    const getMasteryClass = () => {
        if (concept.mastery >= 0.8) return styles.masteryDotHigh;
        if (concept.mastery >= 0.4) return styles.masteryDotMedium;
        if (concept.mastery > 0) return styles.masteryDotLow;
        return '';
    };

    return (
        <div id={`concept-${concept.conceptId}`} className={styles.card}>
            <button
                className={styles.cardHeader}
                onClick={() => setExpanded(!expanded)}
            >
                <div className={styles.locationInfo}>
                    <span className={styles.location}>
                        <MapPin size={12} />
                        {slot?.location || 'Placement'}
                    </span>
                    <span className={styles.conceptName}>{concept.conceptName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={`${styles.masteryDot} ${getMasteryClass()}`} />
                    <ChevronDown
                        size={16}
                        className={`${styles.expandIcon} ${expanded ? styles.expandIconOpen : ''}`}
                    />
                </div>
            </button>

            {expanded && (
                <div className={styles.expandedContent}>
                    {concept.lifecycle.phase1.length > 0 && (
                        <div className={styles.lifecycleSection}>
                            <div className={styles.lifecycleHeader}>
                                <span className={`${styles.lifecycleLabel} ${styles.phase1Label}`}>
                                    {phase1Label}
                                </span>
                            </div>
                            <div className={styles.lifecycleItems}>
                                {concept.lifecycle.phase1.map((item, i) => (
                                    <div key={i} className={styles.lifecycleItem}>{item}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {concept.lifecycle.phase2.length > 0 && (
                        <div className={styles.lifecycleSection}>
                            <div className={styles.lifecycleHeader}>
                                <span className={`${styles.lifecycleLabel} ${styles.phase2Label}`}>
                                    {phase2Label}
                                </span>
                            </div>
                            <div className={styles.lifecycleItems}>
                                {concept.lifecycle.phase2.map((item, i) => (
                                    <div key={i} className={styles.lifecycleItem}>{item}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {concept.lifecycle.phase3.length > 0 && (
                        <div className={styles.lifecycleSection}>
                            <div className={styles.lifecycleHeader}>
                                <span className={`${styles.lifecycleLabel} ${styles.phase3Label}`}>
                                    {phase3Label}
                                </span>
                            </div>
                            <div className={styles.lifecycleItems}>
                                {concept.lifecycle.phase3.map((item, i) => (
                                    <div key={i} className={styles.lifecycleItem}>{item}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Visual Anchor */}
                    {slot?.visualAnchor && (
                        <div className={styles.visualAnchor}>
                            <Lightbulb size={12} />
                            <span>Visual anchor: {slot.visualAnchor}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
