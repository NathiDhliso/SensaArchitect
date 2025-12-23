import { useState } from 'react';
import { Box, Zap, Activity } from 'lucide-react';
import type { MarkerPosition } from '@/lib/google-maps';
import styles from './ConceptMarker.module.css';

interface ConceptMarkerProps {
  marker: MarkerPosition;
  isActive: boolean;
  onClick: () => void;
  scale?: number;
  hideTooltip?: boolean;
}

export default function ConceptMarker({ marker, isActive, onClick, scale = 1, hideTooltip = false }: ConceptMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!marker.visible) return null;

  return (
    <div
      className={`${styles.marker} ${isActive ? styles.markerActive : ''}`}
      style={{
        left: marker.x,
        top: marker.y,
        transform: `translate(-50%, -100%) scale(${scale})`,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.markerIcon}>
        <Box size={24} />
      </div>
      <div className={styles.markerLabel}>{marker.conceptName}</div>

      {!hideTooltip && (isActive || isHovered) && (
        <div className={styles.tooltip}>
          <h4 className={styles.tooltipTitle}>{marker.conceptName}</h4>
          
          <div className={styles.lifecycleSection}>
            <div className={styles.phase}>
              <span className={styles.phaseIcon}><Zap size={12} /></span>
              <span className={styles.phaseLabel}>Provision</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.provision.slice(0, 2).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.lifecycleSection}>
            <div className={styles.phase}>
              <span className={styles.phaseIcon}><Activity size={12} /></span>
              <span className={styles.phaseLabel}>Configure</span>
            </div>
            <ul className={styles.phaseList}>
              {marker.lifecycle.configure.slice(0, 2).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <button className={styles.detailsButton} onClick={(e) => { e.stopPropagation(); }}>
            View Full Details
          </button>
        </div>
      )}
    </div>
  );
}
