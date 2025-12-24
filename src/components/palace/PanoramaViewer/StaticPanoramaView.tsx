import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Save, Loader2, AlertTriangle, Compass } from 'lucide-react';
import { usePalaceStore } from '@/store/palace-store';
import type { MarkerPlacement } from '@/lib/panorama';
import PanoramaViewer from './PanoramaViewer';
import styles from './PanoramaPalaceView.module.css';

// View directions for captured images
const VIEWS = [
    { key: 'front', label: 'Front', icon: '↑' },
    { key: 'right', label: 'Right', icon: '→' },
    { key: 'back', label: 'Back', icon: '↓' },
    { key: 'left', label: 'Left', icon: '←' },
] as const;

interface StaticPanoramaViewProps {
    imageUrl: string;
    routeBuildingId: string;
    concepts: Array<{
        conceptId: string;
        conceptName: string;
        slotId: string;
    }>;
    onMarkerClick?: (conceptId: string) => void;
    /** If true, assumes multi-view images exist (front, back, left, right) */
    isMultiView?: boolean;
}

export default function StaticPanoramaView({
    imageUrl,
    routeBuildingId,
    concepts,
    onMarkerClick,
    isMultiView = true,
}: StaticPanoramaViewProps) {
    const { updatePanoramaMarker, getPanoramaMarkers } = usePalaceStore();
    
    // Track current view for multi-view mode
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const currentView = VIEWS[currentViewIndex];
    
    // Build URL for current view
    const currentImageUrl = useMemo(() => {
        if (!isMultiView) return imageUrl;
        // Replace .jpg with -front.jpg, -back.jpg, etc.
        return imageUrl.replace(/\.jpg$/, `-${currentView.key}.jpg`);
    }, [imageUrl, isMultiView, currentView.key]);
    
    // Track image loading state for current view (keyed by URL to avoid sync setState in effect)
    const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
    const [errorUrls, setErrorUrls] = useState<Set<string>>(new Set());
    const [editMode, setEditMode] = useState(false);
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
    const [markerOverrides, setMarkerOverrides] = useState<Record<string, { yaw: number; pitch: number }>>({});

    // Derived state - check if current URL is loaded/errored
    const imageLoaded = loadedUrls.has(currentImageUrl);
    const imageError = errorUrls.has(currentImageUrl);

    // Load image when URL changes (only subscribe to load events, no sync setState)
    useEffect(() => {
        if (loadedUrls.has(currentImageUrl) || errorUrls.has(currentImageUrl)) {
            return; // Already loaded or errored
        }
        
        const img = new Image();
        img.onload = () => setLoadedUrls(prev => new Set(prev).add(currentImageUrl));
        img.onerror = () => setErrorUrls(prev => new Set(prev).add(currentImageUrl));
        img.src = currentImageUrl;
    }, [currentImageUrl, loadedUrls, errorUrls]);

    // Navigation handlers for multi-view
    const goToNextView = useCallback(() => {
        setCurrentViewIndex(prev => (prev + 1) % VIEWS.length);
    }, []);

    const goToPrevView = useCallback(() => {
        setCurrentViewIndex(prev => (prev - 1 + VIEWS.length) % VIEWS.length);
    }, []);

    // Compute markers from concepts and saved positions
    const markers = useMemo(() => {
        const savedMarkers = getPanoramaMarkers(routeBuildingId);
        
        return concepts.map((concept, index): MarkerPlacement => {
            const override = markerOverrides[concept.conceptId];
            const saved = savedMarkers[concept.conceptId];
            const defaultYaw = (index - concepts.length / 2) * 30;
            const defaultPitch = 0;
            
            return {
                id: concept.conceptId,
                conceptId: concept.conceptId,
                conceptName: concept.conceptName,
                yaw: override?.yaw ?? saved?.yaw ?? defaultYaw,
                pitch: override?.pitch ?? saved?.pitch ?? defaultPitch,
            };
        });
    }, [concepts, routeBuildingId, getPanoramaMarkers, markerOverrides]);

    const handleMarkerClick = useCallback((markerId: string) => {
        setActiveMarkerId(markerId);
        onMarkerClick?.(markerId);
    }, [onMarkerClick]);

    const handleMarkerDrag = useCallback((markerId: string, yaw: number, pitch: number) => {
        setMarkerOverrides(prev => ({
            ...prev,
            [markerId]: { yaw, pitch }
        }));
        updatePanoramaMarker(routeBuildingId, markerId, yaw, pitch);
    }, [routeBuildingId, updatePanoramaMarker]);

    const toggleEditMode = useCallback(() => {
        setEditMode(prev => !prev);
    }, []);

    if (!imageLoaded && !imageError) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 size={32} className={styles.spinner} />
                <span>Loading panorama...</span>
            </div>
        );
    }

    if (imageError) {
        return (
            <div className={styles.errorContainer}>
                <AlertTriangle size={24} />
                <span>Failed to load panorama image</span>
            </div>
        );
    }

    // For multi-view mode, show a simpler image-based viewer with navigation
    if (isMultiView) {
        return (
            <div className={styles.container}>
                <div className={styles.staticImageContainer}>
                    <img 
                        src={currentImageUrl} 
                        alt={`${currentView.label} view`}
                        className={styles.staticImage}
                    />
                    
                    {/* View navigation */}
                    <div className={styles.viewNavigation}>
                        <button 
                            className={styles.navButton}
                            onClick={goToPrevView}
                            aria-label="Previous view"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className={styles.viewIndicator}>
                            <Compass size={16} />
                            <span>{currentView.label}</span>
                        </div>
                        
                        <button 
                            className={styles.navButton}
                            onClick={goToNextView}
                            aria-label="Next view"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                    
                    {/* View dots indicator */}
                    <div className={styles.viewDots}>
                        {VIEWS.map((view, idx) => (
                            <button
                                key={view.key}
                                className={`${styles.viewDot} ${idx === currentViewIndex ? styles.viewDotActive : ''}`}
                                onClick={() => setCurrentViewIndex(idx)}
                                aria-label={`Go to ${view.label} view`}
                            >
                                <span className={styles.viewDotIcon}>{view.icon}</span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Concept markers overlay */}
                    {concepts.length > 0 && (
                        <div className={styles.markerOverlay}>
                            {concepts.map((concept, idx) => (
                                <button
                                    key={concept.conceptId}
                                    className={`${styles.conceptMarker} ${activeMarkerId === concept.conceptId ? styles.conceptMarkerActive : ''}`}
                                    onClick={() => handleMarkerClick(concept.conceptId)}
                                    style={{
                                        left: `${15 + (idx * 70 / Math.max(1, concepts.length - 1))}%`,
                                        top: '75%',
                                    }}
                                >
                                    <span className={styles.conceptMarkerNumber}>{idx + 1}</span>
                                    <span className={styles.conceptMarkerName}>{concept.conceptName}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // For single panorama mode, use PanoramaViewer (Pannellum)
    return (
        <div className={styles.container}>
            <PanoramaViewer
                imageUrl={imageUrl}
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
