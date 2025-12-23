import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    MapPin,
    ExternalLink,
    Target,
    Footprints,
    BarChart3,
    Map,
    HelpCircle,
    Loader2,
    Navigation
} from 'lucide-react';
import { usePalaceStore } from '@/store/palace-store';
import { getRouteById, getStreetViewUrl } from '@/constants/palace-routes';
import {
    loadGoogleMapsAPI,
    isGoogleMapsLoaded,
    createStreetViewPanorama,
    checkStreetViewCoverage,
    calculateMarkerPositions,
    type MarkerPosition
} from '@/lib/google-maps';
import ConceptMarker from './ConceptMarker';
import ConceptTooltip from './ConceptTooltip';
import GuidedTour from './GuidedTour';
import LifecycleCard from './LifecycleCard';
import DailyWalk from './DailyWalk';
import QuizMode from './QuizMode';
import ProgressPanel from './ProgressPanel';
import { PlacementGuide } from './PlacementGuide';
import styles from './PalaceView.module.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function PalaceView() {
    const navigate = useNavigate();
    const { currentPalace, currentBuildingIndex, setCurrentBuilding, updateStreak, customRoutes } = usePalaceStore();
    const [showQuiz, setShowQuiz] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    
    const streetViewRef = useRef<HTMLDivElement>(null);
    const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([]);
    const [activeConcept, setActiveConcept] = useState<string | null>(null);
    const [streetViewEnabled, setStreetViewEnabled] = useState(!!GOOGLE_MAPS_API_KEY);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [tourPlaying, setTourPlaying] = useState(false);
    const [tourIndex, setTourIndex] = useState(0);
    const tourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fullscreenRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('palace-guide-seen');
        if (!hasSeenGuide && currentPalace) {
            setShowGuide(true);
            localStorage.setItem('palace-guide-seen', 'true');
        }
    }, [currentPalace]);

    if (!currentPalace) {
        return (
            <div className={styles.palaceContainer}>
                <div className={styles.emptyState}>
                    <Map size={64} strokeWidth={1} />
                    <h2>No Memory Palace Active</h2>
                    <p>Generate learning content first, then create a Memory Palace from the Results page.</p>
                    <button
                        className={styles.openMapsButton}
                        onClick={() => navigate('/')}
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    // Check pre-built routes first, then custom routes
    const route = getRouteById(currentPalace.routeId) ||
        customRoutes.find(r => r.id === currentPalace.routeId);
    const currentBuilding = currentPalace.buildings[currentBuildingIndex];
    const routeBuilding = route?.buildings.find(b => b.id === currentBuilding?.routeBuildingId);

    const canGoPrev = currentBuildingIndex > 0;
    const canGoNext = currentBuildingIndex < currentPalace.buildings.length - 1;

    const handleOpenStreetView = () => {
        if (!routeBuilding) return;
        const url = getStreetViewUrl(
            routeBuilding.coordinates.lat,
            routeBuilding.coordinates.lng,
            routeBuilding.heading
        );
        window.open(url, '_blank');
    };

    const updateMarkerPositions = useCallback(() => {
        if (!panoramaRef.current || !currentBuilding || !routeBuilding) return;
        
        const container = streetViewRef.current;
        if (!container) return;
        
        const pov = panoramaRef.current.getPov();
        const positions = calculateMarkerPositions(
            currentBuilding.concepts,
            routeBuilding.placements,
            {
                containerWidth: container.offsetWidth,
                containerHeight: container.offsetHeight,
                currentHeading: pov.heading || 0,
                currentPitch: pov.pitch || 0,
                fov: 90,
                buildingHeading: routeBuilding.heading,
            }
        );
        setMarkerPositions(positions);
    }, [currentBuilding, routeBuilding]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            setTimeout(updateMarkerPositions, 150);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [updateMarkerPositions]);

    useEffect(() => {
        if (!streetViewEnabled || !routeBuilding || !streetViewRef.current) return;

        const initStreetView = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                if (!isGoogleMapsLoaded()) {
                    await loadGoogleMapsAPI(GOOGLE_MAPS_API_KEY);
                }

                const coverage = await checkStreetViewCoverage(
                    routeBuilding.coordinates.lat,
                    routeBuilding.coordinates.lng
                );

                if (!coverage.available) {
                    setLoadError(coverage.error || 'No Street View coverage at this location');
                    setStreetViewEnabled(false);
                    return;
                }

                if (panoramaRef.current) {
                    panoramaRef.current.setPosition({
                        lat: routeBuilding.coordinates.lat,
                        lng: routeBuilding.coordinates.lng,
                    });
                    panoramaRef.current.setPov({
                        heading: routeBuilding.heading,
                        pitch: 0,
                    });
                } else {
                    const panorama = createStreetViewPanorama({
                        container: streetViewRef.current!,
                        lat: routeBuilding.coordinates.lat,
                        lng: routeBuilding.coordinates.lng,
                        heading: routeBuilding.heading,
                    });

                    if (panorama) {
                        panoramaRef.current = panorama;
                        panorama.addListener('pov_changed', updateMarkerPositions);
                        panorama.addListener('position_changed', updateMarkerPositions);
                    } else {
                        throw new Error('Failed to create Street View panorama');
                    }
                }

                setTimeout(updateMarkerPositions, 500);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load Street View';
                setLoadError(`${message}. Using fallback mode.`);
                setStreetViewEnabled(false);
            } finally {
                setIsLoading(false);
            }
        };

        initStreetView();

        return () => {
            if (panoramaRef.current) {
                google.maps.event.clearListeners(panoramaRef.current, 'pov_changed');
                google.maps.event.clearListeners(panoramaRef.current, 'position_changed');
            }
        };
    }, [routeBuilding, streetViewEnabled, updateMarkerPositions]);

    const handleMarkerClick = (conceptId: string, heading: number) => {
        setActiveConcept(conceptId);
        setShowTooltip(true);
        
        if (panoramaRef.current) {
            const currentPov = panoramaRef.current.getPov();
            panoramaRef.current.setPov({
                heading: heading,
                pitch: currentPov.pitch,
            });
        }

        const conceptCard = document.getElementById(`concept-${conceptId}`);
        conceptCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const startTour = () => {
        setShowTour(true);
        setTourPlaying(true);
        setTourIndex(0);
        if (markerPositions.length > 0) {
            handleMarkerClick(markerPositions[0].conceptId, markerPositions[0].heading);
        }
    };

    const stopTour = () => {
        setTourPlaying(false);
        if (tourIntervalRef.current) {
            clearInterval(tourIntervalRef.current);
            tourIntervalRef.current = null;
        }
    };

    const closeTour = () => {
        stopTour();
        setShowTour(false);
    };

    const tourIndexRef = useRef(tourIndex);
    tourIndexRef.current = tourIndex;

    const nextTourConcept = useCallback(() => {
        const nextIndex = tourIndexRef.current + 1;
        if (nextIndex < markerPositions.length) {
            setTourIndex(nextIndex);
            const marker = markerPositions[nextIndex];
            if (marker) {
                handleMarkerClick(marker.conceptId, marker.heading);
            }
        } else {
            stopTour();
        }
    }, [markerPositions]);

    const prevTourConcept = useCallback(() => {
        const prevIndex = tourIndexRef.current - 1;
        if (prevIndex >= 0) {
            setTourIndex(prevIndex);
            const marker = markerPositions[prevIndex];
            if (marker) {
                handleMarkerClick(marker.conceptId, marker.heading);
            }
        }
    }, [markerPositions]);

    const selectTourConcept = useCallback((index: number) => {
        setTourIndex(index);
        const marker = markerPositions[index];
        if (marker) {
            handleMarkerClick(marker.conceptId, marker.heading);
        }
    }, [markerPositions]);

    useEffect(() => {
        if (!tourPlaying || markerPositions.length === 0) {
            return;
        }

        tourIntervalRef.current = setInterval(() => {
            const nextIndex = tourIndexRef.current + 1;
            if (nextIndex < markerPositions.length) {
                setTourIndex(nextIndex);
                const marker = markerPositions[nextIndex];
                if (marker) {
                    handleMarkerClick(marker.conceptId, marker.heading);
                }
            } else {
                stopTour();
            }
        }, 8000);

        return () => {
            if (tourIntervalRef.current) {
                clearInterval(tourIntervalRef.current);
                tourIntervalRef.current = null;
            }
        };
    }, [tourPlaying, markerPositions]);

    const handleStartWalk = () => {
        updateStreak();
        const today = new Date().getDay();
        const startBuilding = today % currentPalace.buildings.length;
        setCurrentBuilding(startBuilding);
    };

    const toggleFullscreen = () => {
        if (!fullscreenRef.current) return;
        
        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
                setTimeout(updateMarkerPositions, 100);
            }).catch(() => {});
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
                setTimeout(updateMarkerPositions, 100);
            }).catch(() => {});
        }
    };

    return (
        <div className={styles.palaceContainer}>
            {/* Quiz Mode Overlay */}
            {showQuiz && <QuizMode onClose={() => setShowQuiz(false)} />}

            {/* Placement Guide Overlay */}
            <PlacementGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button className={styles.backButton} onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <div className={styles.buildingIndicators}>
                        {currentPalace.buildings.map((_, idx) => (
                            <button
                                key={idx}
                                className={`${styles.indicator} ${idx === currentBuildingIndex ? styles.indicatorActive : ''}`}
                                onClick={() => setCurrentBuilding(idx)}
                                title={`Building ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.buildingNav}>
                    <button
                        className={styles.navButton}
                        onClick={() => setCurrentBuilding(currentBuildingIndex - 1)}
                        disabled={!canGoPrev}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className={styles.buildingTitle}>
                        <h1>{routeBuilding?.name || `Building ${currentBuildingIndex + 1}`}</h1>
                        <p>{currentBuilding?.stageName}</p>
                    </div>

                    <button
                        className={styles.navButton}
                        onClick={() => setCurrentBuilding(currentBuildingIndex + 1)}
                        disabled={!canGoNext}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <button
                    className={styles.helpButton}
                    onClick={() => setShowGuide(true)}
                    title="How to use Memory Palace"
                >
                    <HelpCircle size={20} />
                </button>
            </header>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Street View Panel */}
                <div className={styles.streetViewPanel}>
                    <DailyWalk onStartWalk={handleStartWalk} />

                    {streetViewEnabled ? (
                        <div 
                            ref={fullscreenRef}
                            className={`${styles.streetViewWrapper} ${isFullscreen ? styles.fullscreenMode : ''}`}
                        >
                            <div ref={streetViewRef} className={styles.streetViewContainer} />
                            
                            {isLoading && (
                                <div className={styles.streetViewLoading}>
                                    <Loader2 size={32} className={styles.spinner} />
                                    <span>Loading Street View...</span>
                                </div>
                            )}

                            {!isLoading && (
                                <div className={`${styles.markerOverlay} ${isFullscreen ? styles.markerOverlayFullscreen : ''}`}>
                                    {markerPositions.map(marker => (
                                        <ConceptMarker
                                            key={marker.conceptId}
                                            marker={marker}
                                            isActive={activeConcept === marker.conceptId}
                                            onClick={() => handleMarkerClick(marker.conceptId, marker.heading)}
                                            hideTooltip={showTour}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className={`${styles.streetViewControls} ${isFullscreen ? styles.streetViewControlsFullscreen : ''}`}>
                                <button className={styles.controlBtn} onClick={toggleFullscreen} title="Toggle Fullscreen">
                                    {isFullscreen ? <ExternalLink size={16} /> : <ExternalLink size={16} />}
                                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                </button>
                            </div>

                            {showTour && (
                                <GuidedTour
                                    markers={markerPositions}
                                    currentIndex={tourIndex}
                                    isPlaying={tourPlaying}
                                    onPlay={() => setTourPlaying(true)}
                                    onPause={stopTour}
                                    onNext={nextTourConcept}
                                    onPrev={prevTourConcept}
                                    onClose={closeTour}
                                    onSelectConcept={selectTourConcept}
                                />
                            )}
                        </div>
                    ) : (
                        <div className={styles.streetViewCard}>
                            <div className={styles.mapIcon}>
                                <MapPin size={32} />
                            </div>
                            <h2>{routeBuilding?.name}</h2>
                            <p>{routeBuilding?.visualTheme}</p>
                            {loadError && <p className={styles.errorText}>{loadError}</p>}
                            <button className={styles.openMapsButton} onClick={handleOpenStreetView}>
                                <ExternalLink size={16} />
                                Open in Street View
                            </button>
                        </div>
                    )}

                    {showProgress && <ProgressPanel />}

                    {(() => {
                        const activeMarker = showTooltip && activeConcept && !showTour
                            ? markerPositions.find(m => m.conceptId === activeConcept) 
                            : null;
                        return activeMarker ? (
                            <ConceptTooltip
                                marker={activeMarker}
                                onClose={() => setShowTooltip(false)}
                                onViewDetails={() => {
                                    setShowTooltip(false);
                                    const card = document.getElementById(`concept-${activeConcept}`);
                                    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                            />
                        ) : null;
                    })()}
                </div>

                {/* Placement Panel */}
                <aside className={styles.placementPanel}>
                    <div className={styles.placementHeader}>
                        <MapPin size={16} />
                        <h2>Placement Map</h2>
                    </div>

                    <div className={styles.placementList}>
                        {currentBuilding?.concepts.map(concept => {
                            const slot = routeBuilding?.placements.find(p => p.id === concept.slotId);
                            return (
                                <LifecycleCard
                                    key={concept.conceptId}
                                    concept={concept}
                                    slot={slot}
                                />
                            );
                        })}

                        {(!currentBuilding?.concepts || currentBuilding.concepts.length === 0) && (
                            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                                No concepts placed in this building yet.
                            </p>
                        )}
                    </div>
                </aside>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <button
                    className={styles.footerButton}
                    onClick={() => setShowQuiz(true)}
                >
                    <Target size={16} />
                    Quiz Mode
                </button>
                {streetViewEnabled && markerPositions.length > 0 && (
                    <button
                        className={styles.footerButton}
                        onClick={startTour}
                    >
                        <Navigation size={16} />
                        Guided Tour
                    </button>
                )}
                <button
                    className={styles.footerButton}
                    onClick={handleStartWalk}
                >
                    <Footprints size={16} />
                    Daily Walk
                </button>
                <button
                    className={styles.footerButton}
                    onClick={() => setShowProgress(!showProgress)}
                >
                    <BarChart3 size={16} />
                    {showProgress ? 'Hide Progress' : 'Progress'}
                </button>
            </footer>
        </div>
    );
}
