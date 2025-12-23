import { useLearningStore } from '@/store/learning-store';
import styles from './JourneyMap.module.css';

interface JourneyMapProps {
  onStageClick?: (stageId: string) => void;
  onConceptClick?: (conceptId: string) => void;
}

export default function JourneyMap({ onConceptClick }: JourneyMapProps) {
  const { progress, getStageStatus, getConceptStatus, getStages, getConcepts } = useLearningStore();

  const stages = getStages();
  const concepts = getConcepts();
  const completedCount = progress.completedConcepts.length;
  const totalCount = concepts.length;

  if (stages.length === 0 || concepts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏗️</div>
        <p className={styles.emptyText}>Generate content to start building your knowledge</p>
      </div>
    );
  }

  const handleConceptClick = (conceptId: string) => {
    const status = getConceptStatus(conceptId);
    if (status !== 'locked' && onConceptClick) {
      onConceptClick(conceptId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.scaffolding}>
        <div className={styles.buildingFrame}>
          {[...stages].reverse().map((stage) => {
            const status = getStageStatus(stage.id);
            const stageConcepts = concepts.filter(c => c.stageId === stage.id);
            
            const floorClass = [
              styles.floor,
              status === 'completed' && styles.floorCompleted,
              status === 'current' && styles.floorCurrent,
              status === 'locked' && styles.floorLocked,
            ].filter(Boolean).join(' ');

            return (
              <div key={stage.id} className={floorClass}>
                <div className={styles.floorLabel}>
                  <span className={styles.floorNumber}>{stage.order}</span>
                  <span className={styles.floorName}>{stage.name}</span>
                </div>
                <div className={styles.blocks}>
                  {stageConcepts.map((concept) => {
                    const conceptStatus = getConceptStatus(concept.id);
                    const blockClass = [
                      styles.block,
                      conceptStatus === 'completed' && styles.blockCompleted,
                      conceptStatus === 'current' && styles.blockCurrent,
                      conceptStatus === 'available' && styles.blockAvailable,
                      conceptStatus === 'locked' && styles.blockLocked,
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={concept.id}
                        className={blockClass}
                        onClick={() => handleConceptClick(concept.id)}
                        title={concept.name}
                      >
                        <span className={styles.blockIcon}>{concept.icon}</span>
                        <span className={styles.blockName}>{concept.name}</span>
                        {concept.logicalConnection && (
                          <div className={styles.connectionLine} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {stage.narrativeBridge && status !== 'locked' && (
                  <div className={styles.narrativeBridge}>
                    <span className={styles.bridgeIcon}>↑</span>
                    <span className={styles.bridgeText}>{stage.narrativeBridge}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.foundation}>
          <span>🏗️ Your Knowledge Foundation</span>
        </div>
      </div>
      <div className={styles.progressPanel}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 100 100">
            <circle
              className={styles.progressBg}
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className={styles.progressFill}
              cx="50"
              cy="50"
              r="45"
              strokeDasharray={`${(completedCount / totalCount) * 283} 283`}
            />
          </svg>
          <div className={styles.progressText}>
            <span className={styles.progressCount}>{completedCount}</span>
            <span className={styles.progressTotal}>/{totalCount}</span>
          </div>
        </div>
        <div className={styles.progressLabel}>Concepts Mastered</div>
      </div>
    </div>
  );
}
