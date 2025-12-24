import { useEffect, useRef, useState, useCallback } from 'react';
import type { MarkerPlacement, PanoramaViewState } from '@/lib/panorama';
import styles from './PanoramaViewer.module.css';

declare global {
    interface Window {
        pannellum: {
            viewer: (container: HTMLElement | string, config: PannellumConfig) => PannellumViewer;
        };
    }
}

interface PannellumConfig {
    type: string;
    panorama: string;
    autoLoad: boolean;
    showControls: boolean;
    mouseZoom: boolean;
    keyboardZoom: boolean;
    hfov: number;
    pitch: number;
    yaw: number;
    minHfov: number;
    maxHfov: number;
    compass: boolean;
}

interface PannellumViewer {
    getYaw: () => number;
    getPitch: () => number;
    getHfov: () => number;
    setYaw: (yaw: number, animated?: boolean) => void;
    setPitch: (pitch: number, animated?: boolean) => void;
    setHfov: (hfov: number, animated?: boolean) => void;
    lookAt: (pitch: number, yaw: number, hfov?: number, animated?: boolean) => void;
    on: (event: string, callback: () => void) => void;
    off: (event: string, callback?: () => void) => void;
    destroy: () => void;
    getContainer: () => HTMLElement;
}

interface PanoramaViewerProps {
    imageUrl: string;
    markers: MarkerPlacement[];
    onViewChange?: (state: PanoramaViewState) => void;
    onMarkerClick?: (markerId: string) => void;
    onMarkerDrag?: (markerId: string, yaw: number, pitch: number) => void;
    editMode?: boolean;
    activeMarkerId?: string | null;
    initialYaw?: number;
    initialPitch?: number;
}

const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';

let pannellumLoaded = false;

function loadPannellum(): Promise<void> {
    if (pannellumLoaded && window.pannellum) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const existingLink = document.querySelector(`link[href="${PANNELLUM_CSS}"]`);
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = PANNELLUM_CSS;
            document.head.appendChild(link);
        }

        const existingScript = document.querySelector(`script[src="${PANNELLUM_JS}"]`);
        if (existingScript) {
            if (window.pannellum) {
                pannellumLoaded = true;
                resolve();
            } else {
                existingScript.addEventListener('load', () => {
                    pannellumLoaded = true;
                    resolve();
                });
            }
            return;
        }

        const script = document.createElement('script');
        script.src = PANNELLUM_JS;
        script.onload = () => {
            pannellumLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Pannellum'));
        document.head.appendChild(script);
    });
}

export default function PanoramaViewer({
    imageUrl,
    markers,
    onViewChange,
    onMarkerClick,
    onMarkerDrag,
    editMode = false,
    activeMarkerId,
    initialYaw = 0,
    initialPitch = 0,
}: PanoramaViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<PannellumViewer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<PanoramaViewState>({
        yaw: initialYaw,
        pitch: initialPitch,
        hfov: 100,
    });
    const [draggingMarker, setDraggingMarker] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function init() {
            if (!containerRef.current) return;

            try {
                await loadPannellum();
                if (!mounted) return;

                if (viewerRef.current) {
                    viewerRef.current.destroy();
                }

                const viewer = window.pannellum.viewer(containerRef.current, {
                    type: 'equirectangular',
                    panorama: imageUrl,
                    autoLoad: true,
                    showControls: false,
                    mouseZoom: true,
                    keyboardZoom: true,
                    hfov: 100,
                    pitch: initialPitch,
                    yaw: initialYaw,
                    minHfov: 50,
                    maxHfov: 120,
                    compass: false,
                });

                viewerRef.current = viewer;

                const handleViewChange = () => {
                    if (!viewerRef.current) return;
                    const state: PanoramaViewState = {
                        yaw: viewerRef.current.getYaw(),
                        pitch: viewerRef.current.getPitch(),
                        hfov: viewerRef.current.getHfov(),
                    };
                    setCurrentView(state);
                    onViewChange?.(state);
                };

                viewer.on('mouseup', handleViewChange);
                viewer.on('touchend', handleViewChange);
                viewer.on('zoomchange', handleViewChange);

                viewer.on('load', () => {
                    setIsLoading(false);
                    handleViewChange();
                });

            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load panorama');
                    setIsLoading(false);
                }
            }
        }

        init();

        return () => {
            mounted = false;
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [imageUrl, initialYaw, initialPitch, onViewChange]);

    const calculateMarkerPosition = useCallback((marker: MarkerPlacement) => {
        const { yaw, pitch, hfov } = currentView;
        const vfov = hfov * 0.6;

        let relativeYaw = marker.yaw - yaw;
        if (relativeYaw > 180) relativeYaw -= 360;
        if (relativeYaw < -180) relativeYaw += 360;

        const relativePitch = marker.pitch - pitch;

        const x = 50 + (relativeYaw / hfov) * 100;
        const y = 50 - (relativePitch / vfov) * 100;

        const visible = Math.abs(relativeYaw) < hfov / 2 + 10 && 
                       Math.abs(relativePitch) < vfov / 2 + 10;

        return { x, y, visible };
    }, [currentView]);

    const handleMarkerPointerDown = useCallback((e: React.PointerEvent, markerId: string) => {
        if (!editMode) {
            onMarkerClick?.(markerId);
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        setDraggingMarker(markerId);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [editMode, onMarkerClick]);

    const handleMarkerPointerMove = useCallback((e: React.PointerEvent) => {
        if (!draggingMarker || !containerRef.current) return;
        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const { hfov } = currentView;
        const vfov = hfov * 0.6;

        const relativeYaw = ((x - 50) / 100) * hfov;
        const relativePitch = -((y - 50) / 100) * vfov;

        const newYaw = currentView.yaw + relativeYaw;
        const newPitch = Math.max(-85, Math.min(85, currentView.pitch + relativePitch));

        onMarkerDrag?.(draggingMarker, newYaw, newPitch);
    }, [draggingMarker, currentView, onMarkerDrag]);

    const handleMarkerPointerUp = useCallback((e: React.PointerEvent) => {
        if (draggingMarker) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            setDraggingMarker(null);
        }
    }, [draggingMarker]);

    const lookAtMarker = useCallback((marker: MarkerPlacement) => {
        if (viewerRef.current) {
            viewerRef.current.lookAt(marker.pitch, marker.yaw, undefined, true);
        }
    }, []);

    return (
        <div className={styles.container}>
            <div ref={containerRef} className={styles.viewer} />
            
            {isLoading && (
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Loading panorama...</span>
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    <span>{error}</span>
                </div>
            )}

            {!isLoading && !error && (
                <div 
                    className={styles.markerOverlay}
                    onPointerMove={handleMarkerPointerMove}
                    onPointerUp={handleMarkerPointerUp}
                >
                    {markers.map(marker => {
                        const pos = calculateMarkerPosition(marker);
                        if (!pos.visible) return null;

                        const isActive = activeMarkerId === marker.id;
                        const isDragging = draggingMarker === marker.id;

                        return (
                            <div
                                key={marker.id}
                                className={`${styles.marker} ${isActive ? styles.markerActive : ''} ${editMode ? styles.markerEditable : ''} ${isDragging ? styles.markerDragging : ''}`}
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                }}
                                onPointerDown={(e) => handleMarkerPointerDown(e, marker.id)}
                                onClick={() => !editMode && lookAtMarker(marker)}
                            >
                                <div className={styles.markerPin}>
                                    <span className={styles.markerLetter}>
                                        {marker.conceptName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className={styles.markerLabel}>
                                    {marker.conceptName}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editMode && (
                <div className={styles.editModeIndicator}>
                    Edit Mode - Drag markers to reposition
                </div>
            )}
        </div>
    );
}
