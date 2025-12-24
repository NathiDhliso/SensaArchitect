import { X, Zap, Settings, Activity, Eye } from 'lucide-react';
import type { MarkerPosition } from '@/lib/google-maps';
import styles from './ConceptTooltip.module.css';

interface ConceptTooltipProps {
  marker: MarkerPosition;
  onClose: () => void;
  onViewDetails?: () => void;
}

export default function ConceptTooltip({ marker, onClose, onViewDetails }: ConceptTooltipProps) {
  const phase1Label = marker.lifecycleLabels?.phase1 || 'Phase 1';
  const phase2Label = marker.lifecycleLabels?.phase2 || 'Phase 2';
  const phase3Label = marker.lifecycleLabels?.phase3 || 'Phase 3';

  return (
    <div className={styles.tooltipOverlay}>
      <div className={styles.tooltip}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>

        <h3 className={styles.title}>{marker.conceptName}</h3>

        <div className={styles.lifecycleGrid}>
          <div className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <Zap size={14} className={styles.phase1Icon} />
              <span>{phase1Label}</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.phase1.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <Settings size={14} className={styles.phase2Icon} />
              <span>{phase2Label}</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.phase2.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <Activity size={14} className={styles.phase3Icon} />
              <span>{phase3Label}</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.phase3.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {onViewDetails && (
          <button className={styles.detailsButton} onClick={onViewDetails}>
            <Eye size={14} />
            View in Sidebar
          </button>
        )}
      </div>
    </div>
  );
}
