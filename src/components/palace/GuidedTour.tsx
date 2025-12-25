import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import { usePersonalizationStore } from '@/store/personalization-store';
import type { MarkerPosition } from '@/lib/google-maps';
import styles from './GuidedTour.module.css';

interface GuidedTourProps {
  markers: MarkerPosition[];
  currentIndex: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onSelectConcept: (index: number) => void;
}

export default function GuidedTour({
  markers,
  currentIndex,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onClose,
  onSelectConcept,
}: GuidedTourProps) {
  const [progress, setProgress] = useState(0);
  const intervalDuration = 8000;
  const aphantasiaMode = usePersonalizationStore(s => s.aphantasiaMode);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / intervalDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        setProgress(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex]);

  const currentMarker = markers[currentIndex];
  const prevMarker = currentIndex > 0 ? markers[currentIndex - 1] : null;
  const nextMarker = currentIndex < markers.length - 1 ? markers[currentIndex + 1] : null;

  if (!currentMarker) return null;

  return (
    <div className={styles.tourPanel}>
      <div className={styles.tourHeader}>
        <span className={styles.tourLabel}>{aphantasiaMode ? 'Sequence Tour' : 'Guided Tour'}</span>
        <span className={styles.tourProgress}>
          {currentIndex + 1} / {markers.length}
        </span>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className={styles.conceptInfo}>
        <h3 className={styles.conceptName}>{currentMarker.conceptName}</h3>
        
        {/* Aphantasia mode: Show sequence context instead of just phase preview */}
        {aphantasiaMode ? (
          <div className={styles.lifecyclePreview}>
            {prevMarker && (
              <div className={styles.phasePreview} style={{ opacity: 0.6 }}>
                <span className={styles.phaseLabel}>← Previous</span>
                <span className={styles.phaseItem}>{prevMarker.conceptName}</span>
              </div>
            )}
            <div className={styles.phasePreview}>
              <span className={styles.phaseLabel}>Step {currentIndex + 1}</span>
              <span className={styles.phaseItem}>
                {currentMarker.lifecycle.phase1[0] || currentMarker.conceptName}
              </span>
            </div>
            {nextMarker && (
              <div className={styles.phasePreview} style={{ opacity: 0.6 }}>
                <span className={styles.phaseLabel}>Next →</span>
                <span className={styles.phaseItem}>{nextMarker.conceptName}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.lifecyclePreview}>
            <div className={styles.phasePreview}>
              <span className={styles.phaseLabel}>{currentMarker.lifecycleLabels?.phase1 || 'Phase 1'}</span>
              <span className={styles.phaseItem}>
                {currentMarker.lifecycle.phase1[0] || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.controls}>
        <button 
          className={styles.controlButton}
          onClick={onPrev}
          disabled={currentIndex === 0}
        >
          <SkipBack size={18} />
        </button>

        <button 
          className={styles.playButton}
          onClick={isPlaying ? onPause : onPlay}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button 
          className={styles.controlButton}
          onClick={onNext}
          disabled={currentIndex === markers.length - 1}
        >
          <SkipForward size={18} />
        </button>
      </div>

      <div className={styles.conceptDots}>
        {markers.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''} ${idx < currentIndex ? styles.dotCompleted : ''}`}
            onClick={() => onSelectConcept(idx)}
            title={markers[idx].conceptName}
          />
        ))}
      </div>
    </div>
  );
}
