import { useState, useRef, useCallback } from 'react';
import { MapPin, GripVertical } from 'lucide-react';
import type { MarkerPosition } from '@/lib/google-maps';
import styles from './ConceptMarker.module.css';

interface ConceptMarkerProps {
  marker: MarkerPosition;
  isActive: boolean;
  onClick: () => void;
  scale?: number;
  hideTooltip?: boolean;
  editMode?: boolean;
  onDragEnd?: (conceptId: string, deltaX: number, deltaY: number) => void;
}

export default function ConceptMarker({ 
  marker, 
  isActive, 
  onClick, 
  scale = 1, 
  hideTooltip = false,
  editMode = false,
  onDragEnd,
}: ConceptMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [editMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    
    if (onDragEnd && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      onDragEnd(marker.conceptId, deltaX, deltaY);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging, onDragEnd, marker.conceptId]);

  if (!marker.visible) return null;

  const showLabel = isActive || isHovered;

  return (
    <div
      className={`${styles.marker} ${isActive ? styles.markerActive : ''} ${isHovered ? styles.markerHovered : ''} ${editMode ? styles.markerEditable : ''} ${isDragging ? styles.markerDragging : ''}`}
      style={{
        left: marker.x + dragOffset.x,
        top: marker.y + dragOffset.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        cursor: editMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      }}
      onClick={editMode ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {editMode && (
        <div className={styles.dragHandle}>
          <GripVertical size={12} />
        </div>
      )}
      <div className={styles.markerPin}>
        <MapPin size={20} />
        <span className={styles.markerNumber}>
          {marker.conceptName.charAt(0).toUpperCase()}
        </span>
      </div>

      {!hideTooltip && showLabel && (
        <div className={styles.markerLabel}>
          {marker.conceptName}
        </div>
      )}
    </div>
  );
}
