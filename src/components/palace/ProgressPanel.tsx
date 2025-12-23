import { usePalaceStore } from '@/store/palace-store';
import { getRouteById } from '@/constants/palace-routes';
import styles from './EnhancedFeatures.module.css';

export default function ProgressPanel() {
    const { currentPalace, progress } = usePalaceStore();

    if (!currentPalace) return null;

    const route = getRouteById(currentPalace.routeId);
    const palaceProgress = progress[currentPalace.id];

    // Calculate mastery per building
    const buildingMastery = currentPalace.buildings.map(building => {
        const routeBuilding = route?.buildings.find(b => b.id === building.routeBuildingId);

        if (building.concepts.length === 0) {
            return { name: routeBuilding?.name || building.stageName, percent: 0 };
        }

        const totalMastery = building.concepts.reduce((sum, concept) => {
            const mastery = palaceProgress?.conceptMastery[concept.conceptId]?.mastery || 0;
            return sum + mastery;
        }, 0);

        const percent = Math.round((totalMastery / building.concepts.length) * 100);
        return { name: routeBuilding?.name || building.stageName, percent };
    });

    const overallProgress = buildingMastery.length > 0
        ? Math.round(buildingMastery.reduce((sum, b) => sum + b.percent, 0) / buildingMastery.length)
        : 0;

    return (
        <div className={styles.progressPanel}>
            <h3 className={styles.progressTitle}>
                Progress: {overallProgress}% Mastered
            </h3>

            <div className={styles.buildingProgress}>
                {buildingMastery.map((building, idx) => (
                    <div key={idx} className={styles.progressItem}>
                        <span className={styles.progressLabel}>{building.name}</span>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${building.percent}%` }}
                            />
                        </div>
                        <span className={styles.progressPercent}>{building.percent}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
