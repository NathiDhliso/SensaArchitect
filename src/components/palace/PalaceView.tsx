import { useState } from 'react';
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
    Map
} from 'lucide-react';
import { usePalaceStore } from '@/store/palace-store';
import { getRouteById, getStreetViewUrl } from '@/constants/palace-routes';
import LifecycleCard from './LifecycleCard';
import DailyWalk from './DailyWalk';
import QuizMode from './QuizMode';
import ProgressPanel from './ProgressPanel';
import styles from './PalaceView.module.css';

export default function PalaceView() {
    const navigate = useNavigate();
    const { currentPalace, currentBuildingIndex, setCurrentBuilding, updateStreak } = usePalaceStore();
    const [showQuiz, setShowQuiz] = useState(false);
    const [showProgress, setShowProgress] = useState(false);

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

    const route = getRouteById(currentPalace.routeId);
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

    const handleStartWalk = () => {
        updateStreak();
        // Navigate to first building in today's walk
        const today = new Date().getDay();
        const startBuilding = today % currentPalace.buildings.length;
        setCurrentBuilding(startBuilding);
    };

    return (
        <div className={styles.palaceContainer}>
            {/* Quiz Mode Overlay */}
            {showQuiz && <QuizMode onClose={() => setShowQuiz(false)} />}

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

                <div style={{ width: '150px' }} /> {/* Spacer for centering */}
            </header>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Street View Panel */}
                <div className={styles.streetViewPanel}>
                    <DailyWalk onStartWalk={handleStartWalk} />

                    <div className={styles.streetViewCard}>
                        <div className={styles.mapIcon}>
                            <MapPin size={32} />
                        </div>
                        <h2>{routeBuilding?.name}</h2>
                        <p>{routeBuilding?.visualTheme}</p>
                        <button className={styles.openMapsButton} onClick={handleOpenStreetView}>
                            <ExternalLink size={16} />
                            Open in Street View
                        </button>
                    </div>

                    {showProgress && <ProgressPanel />}
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
