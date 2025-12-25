import { useState, useEffect, useCallback, useRef } from 'react';
import { Edit3, Save, Loader2, Maximize, Minimize, X, Zap, Settings, Activity } from 'lucide-react';
import { usePalaceStore } from '@/store/palace-store';
import { getPanoramaAsDataUrl } from '@/lib/panorama';
import type { MarkerPlacement } from '@/lib/panorama';
import type { PlacedConcept } from '@/lib/types/palace';
import PanoramaViewer from './PanoramaViewer';
import styles from './PanoramaPalaceView.module.css';

interface PanoramaPalaceViewProps {
    palaceId: string;
    routeBuildingId: string;
    concepts: Array<{
        conceptId: string;
        conceptName: string;
        slotId: string;
    }>;
    /** Full concept data for showing details in fullscreen */
    fullConceptData?: PlacedConcept[];
    lifecycleLabels?: {
        phase1: string;
        phase2: string;
        phase3: string;
    };
    onMarkerClick?: (conceptId: string) => void;
}

export default function PanoramaPalaceView({
    palaceId,
    routeBuildingId,
    concepts,
    fullConceptData,
    lifecycleLabels,
    onMarkerClick,
}: PanoramaPalaceViewProps) {
    const { updatePanoramaMarker, getPanoramaMarkers } = usePalaceStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [panoramaUrl, setPanoramaUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
    const [markers, setMarkers] = useState<MarkerPlacement[]>([]);

    useEffect(() => {
        async function loadPanorama() {
            setIsLoading(true);
            setError(null);

            try {
                const panoramaId = `${palaceId}-${routeBuildingId}`;
                const dataUrl = await getPanoramaAsDataUrl(panoramaId);
                
                if (dataUrl) {
                    setPanoramaUrl(dataUrl);
                } else {
                    setError('No panorama found for this location. Please recapture.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load panorama');
            } finally {
                setIsLoading(false);
            }
        }

        loadPanorama();
    }, [palaceId, routeBuildingId]);

    useEffect(() => {
        const savedMarkers = getPanoramaMarkers(routeBuildingId);
        
        const newMarkers: MarkerPlacement[] = concepts.map((concept, index) => {
            const saved = savedMarkers[concept.conceptId];
            const defaultYaw = (index - concepts.length / 2) * 30;
            const defaultPitch = 0;
            
            return {
                id: concept.conceptId,
                conceptId: concept.conceptId,
                conceptName: concept.conceptName,
                yaw: saved?.yaw ?? defaultYaw,
                pitch: saved?.pitch ?? defaultPitch,
            };
        });
        
        setMarkers(newMarkers);
    }, [concepts, routeBuildingId, getPanoramaMarkers]);

    const handleMarkerClick = useCallback((markerId: string) => {
        setActiveMarkerId(markerId);
        onMarkerClick?.(markerId);
    }, [onMarkerClick]);

    const handleMarkerDrag = useCallback((markerId: string, yaw: number, pitch: number) => {
        setMarkers(prev => prev.map(m => 
            m.id === markerId ? { ...m, yaw, pitch } : m
        ));
        
        updatePanoramaMarker(routeBuildingId, markerId, yaw, pitch);
    }, [routeBuildingId, updatePanoramaMarker]);

    const toggleEditMode = useCallback(() => {
        setEditMode(prev => !prev);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 size={32} className={styles.spinner} />
                <span>Loading panorama...</span>
            </div>
        );
    }

    if (error || !panoramaUrl) {
        return (
            <div className={styles.errorContainer}>
                <span>{error || 'Panorama not available'}</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`${styles.container} ${isFullscreen ? styles.fullscreenMode : ''}`}>
            <PanoramaViewer
                imageUrl={panoramaUrl}
                markers={markers}
                onMarkerClick={handleMarkerClick}
                onMarkerDrag={handleMarkerDrag}
                editMode={editMode}
                activeMarkerId={activeMarkerId}
            />
            
            <div className={styles.controls}>
                <button
                    className={`${styles.controlBtn} ${editMode ? styles.controlBtnActive : ''}`}
                    onClick={toggleEditMode}
                    title={editMode ? "Save & Exit Edit Mode" : "Edit Marker Positions"}
                >
                    {editMode ? <Save size={16} /> : <Edit3 size={16} />}
                    {editMode ? 'Done' : 'Edit'}
                </button>
                <button
                    className={styles.controlBtn}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
            </div>
            
            {/* Concept Detail Panel - NYC/Standard style */}
            {activeMarkerId && fullConceptData && (() => {
                const activeConcept = fullConceptData.find(c => c.conceptId === activeMarkerId);
                if (!activeConcept) return null;
                return (
                    <div className={styles.tooltipOverlay}>
                        <div className={styles.tooltip}>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setActiveMarkerId(null)}
                            >
                                <X size={16} />
                            </button>
                            
                            <h3 className={styles.tooltipTitle}>{activeConcept.conceptName}</h3>
                            
                            <div className={styles.lifecycleGrid}>
                                {activeConcept.lifecycle.phase1.length > 0 && (
                                    <div className={styles.phaseCard}>
                                        <div className={styles.phaseHeader}>
                                            <Zap size={14} className={styles.phase1Icon} />
                                            <span>{lifecycleLabels?.phase1 || 'Phase 1'}</span>
                                        </div>
                                        <ul className={styles.phaseList}>
                                            {activeConcept.lifecycle.phase1.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {activeConcept.lifecycle.phase2.length > 0 && (
                                    <div className={styles.phaseCard}>
                                        <div className={styles.phaseHeader}>
                                            <Settings size={14} className={styles.phase2Icon} />
                                            <span>{lifecycleLabels?.phase2 || 'Phase 2'}</span>
                                        </div>
                                        <ul className={styles.phaseList}>
                                            {activeConcept.lifecycle.phase2.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {activeConcept.lifecycle.phase3.length > 0 && (
                                    <div className={styles.phaseCard}>
                                        <div className={styles.phaseHeader}>
                                            <Activity size={14} className={styles.phase3Icon} />
                                            <span>{lifecycleLabels?.phase3 || 'Phase 3'}</span>
                                        </div>
                                        <ul className={styles.phaseList}>
                                            {activeConcept.lifecycle.phase3.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
