import { useState, useEffect, useCallback } from 'react';
import { Edit3, Save, Loader2 } from 'lucide-react';
import { usePalaceStore } from '@/store/palace-store';
import { getPanoramaAsDataUrl } from '@/lib/panorama';
import type { MarkerPlacement } from '@/lib/panorama';
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
    onMarkerClick?: (conceptId: string) => void;
}

export default function PanoramaPalaceView({
    palaceId,
    routeBuildingId,
    concepts,
    onMarkerClick,
}: PanoramaPalaceViewProps) {
    const { updatePanoramaMarker, getPanoramaMarkers } = usePalaceStore();
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
        <div className={styles.container}>
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
            </div>
        </div>
    );
}
