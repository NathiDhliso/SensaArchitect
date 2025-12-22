import { useEffect, useMemo } from 'react';
import { Share2 } from 'lucide-react';
import { LEARNING_CONCEPTS } from '@/constants/learning-content';
import type { CelebrationData } from '@/lib/types/learning';
import styles from './CelebrationModal.module.css';

interface CelebrationModalProps {
  data: CelebrationData;
  onContinue: () => void;
  onTakeBreak: () => void;
}

const CONFETTI_COLORS = ['#fbbf24', '#3b82f6', '#22c55e', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function CelebrationModal({ data, onContinue, onTakeBreak }: CelebrationModalProps) {
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * 360,
    }));
  }, []);

  const completedConceptNames = useMemo(() => {
    if (!data.conceptsCompleted) return [];
    return data.conceptsCompleted
      .map(id => LEARNING_CONCEPTS.find(c => c.id === id)?.name)
      .filter(Boolean)
      .slice(0, 6);
  }, [data.conceptsCompleted]);

  useEffect(() => {
    const timer = setTimeout(() => {
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.confettiContainer}>
          {confettiPieces.map(piece => (
            <div
              key={piece.id}
              className={styles.confetti}
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          ))}
        </div>

        <div className={`${styles.badgeContainer} ${data.type === 'course' ? styles.badgeCourse : ''}`}>
          {data.badgeIcon || '🏆'}
        </div>

        <h2 className={styles.title}>{data.title}</h2>
        <p className={styles.message}>{data.message}</p>

        {(data.conceptsCompleted || data.timeSpent) && (
          <div className={styles.stats}>
            {data.conceptsCompleted && (
              <div className={styles.stat}>
                <div className={styles.statValue}>{data.conceptsCompleted.length}</div>
                <div className={styles.statLabel}>Concepts Mastered</div>
              </div>
            )}
            {data.timeSpent !== undefined && data.timeSpent > 0 && (
              <div className={styles.stat}>
                <div className={styles.statValue}>{data.timeSpent}</div>
                <div className={styles.statLabel}>Minutes Invested</div>
              </div>
            )}
          </div>
        )}

        {completedConceptNames.length > 0 && (
          <div className={styles.conceptList}>
            {completedConceptNames.map((name, i) => (
              <span key={i} className={styles.conceptTag}>{name}</span>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.breakButton} onClick={onTakeBreak}>
            Take a break
          </button>
          <button className={styles.continueButton} onClick={onContinue}>
            {data.type === 'course' ? 'View Certificate' : 'Continue to next stage'}
          </button>
        </div>

        <button className={styles.shareButton}>
          <Share2 size={16} />
          Share achievement
        </button>
      </div>
    </div>
  );
}
