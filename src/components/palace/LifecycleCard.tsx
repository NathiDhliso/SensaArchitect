import { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb } from 'lucide-react';
import type { PlacedConcept } from '@/lib/types/palace';
import type { PlacementSlot } from '@/lib/types/palace';
import styles from './LifecycleCard.module.css';

interface LifecycleCardProps {
    concept: PlacedConcept;
    slot: PlacementSlot | undefined;
}

export default function LifecycleCard({ concept, slot }: LifecycleCardProps) {
    const [expanded, setExpanded] = useState(false);

    const getMasteryClass = () => {
        if (concept.mastery >= 0.8) return styles.masteryDotHigh;
        if (concept.mastery >= 0.4) return styles.masteryDotMedium;
        if (concept.mastery > 0) return styles.masteryDotLow;
        return '';
    };

    return (
        <div className={styles.card}>
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
                    {/* Provision */}
                    {concept.lifecycle.provision.length > 0 && (
                        <div className={styles.lifecycleSection}>
                            <div className={styles.lifecycleHeader}>
                                <span className={`${styles.lifecycleLabel} ${styles.provisionLabel}`}>
                                    PROVISION
                                </span>
                            </div>
                            <div className={styles.lifecycleItems}>
                                {concept.lifecycle.provision.map((item, i) => (
                                    <div key={i} className={styles.lifecycleItem}>{item}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Configure */}
                    {concept.lifecycle.configure.length > 0 && (
                        <div className={styles.lifecycleSection}>
                            <div className={styles.lifecycleHeader}>
                                <span className={`${styles.lifecycleLabel} ${styles.configureLabel}`}>
                                    CONFIGURE
                                </span>
                            </div>
                            <div className={styles.lifecycleItems}>
                                {concept.lifecycle.configure.map((item, i) => (
                                    <div key={i} className={styles.lifecycleItem}>{item}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monitor */}
                    {concept.lifecycle.monitor.length > 0 && (
                        <div className={styles.lifecycleSection}>
                            <div className={styles.lifecycleHeader}>
                                <span className={`${styles.lifecycleLabel} ${styles.monitorLabel}`}>
                                    MONITOR
                                </span>
                            </div>
                            <div className={styles.lifecycleItems}>
                                {concept.lifecycle.monitor.map((item, i) => (
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
