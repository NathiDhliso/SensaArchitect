import { X, Brain, Eye, CheckCircle } from 'lucide-react';
import styles from './PlacementGuide.module.css';

interface PlacementGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PlacementGuide({ isOpen, onClose }: PlacementGuideProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.icon}>
                        <Brain size={28} />
                    </div>
                    <h2 className={styles.title}>How to Use Your Memory Palace</h2>
                </div>

                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>1</span>
                        <div className={styles.stepContent}>
                            <h3>Open Street View</h3>
                            <p>
                                Click "Open in Street View" to see the real location.
                                Look around – notice the doors, windows, signs, and unique features.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.stepNumber}>2</span>
                        <div className={styles.stepContent}>
                            <h3>Place Your Concepts</h3>
                            <p>
                                For each concept in the Placement Map, <strong>visualize it at the designated spot</strong>.
                                Make it vivid, exaggerated, and interactive:
                            </p>
                            <ul className={styles.examples}>
                                <li>
                                    <Eye size={14} />
                                    <span>"Security" blocking the entrance like a bouncer</span>
                                </li>
                                <li>
                                    <Eye size={14} />
                                    <span>"Database" as a giant filing cabinet on the roof</span>
                                </li>
                                <li>
                                    <Eye size={14} />
                                    <span>"API" as a phone connecting two buildings</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.stepNumber}>3</span>
                        <div className={styles.stepContent}>
                            <h3>Walk Through Mentally</h3>
                            <p>
                                Close your eyes and walk through the location in your mind.
                                See each concept at its spot. The more you practice, the stronger the memory.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.stepNumber}>4</span>
                        <div className={styles.stepContent}>
                            <h3>Mark as Placed</h3>
                            <p>
                                Once you've visualized a concept, click the checkmark to mark it as placed.
                                This helps track your progress through the palace.
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.tip}>
                    <CheckCircle size={16} />
                    <span>
                        <strong>Pro tip:</strong> Use personal locations (your home, school, favorite café)
                        for even stronger emotional connections and better recall!
                    </span>
                </div>

                <button className={styles.gotItButton} onClick={onClose}>
                    Got it, let's start!
                </button>
            </div>
        </div>
    );
}
