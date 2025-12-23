import { X, Zap, Settings, Activity, Eye } from 'lucide-react';
import type { MarkerPosition } from '@/lib/google-maps';
import styles from './ConceptTooltip.module.css';

interface ConceptTooltipProps {
  marker: MarkerPosition;
  onClose: () => void;
  onViewDetails?: () => void;
}

export default function ConceptTooltip({ marker, onClose, onViewDetails }: ConceptTooltipProps) {
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
              <Zap size={14} className={styles.provisionIcon} />
              <span>Provision</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.provision.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <Settings size={14} className={styles.configureIcon} />
              <span>Configure</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.configure.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <Activity size={14} className={styles.monitorIcon} />
              <span>Monitor</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.monitor.map((item, i) => (
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
