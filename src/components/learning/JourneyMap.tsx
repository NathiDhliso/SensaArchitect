import { useLearningStore } from '@/store/learning-store';
import styles from './JourneyMap.module.css';

interface JourneyMapProps {
  onStageClick?: (stageId: string) => void;
}

export default function JourneyMap({ onStageClick }: JourneyMapProps) {
  const { progress, getStageStatus, getStages, getConcepts } = useLearningStore();

  const stages = getStages();
  const concepts = getConcepts();
  const completedCount = progress.completedConcepts.length;
  const totalCount = concepts.length;

  const handleStageClick = (stageId: string) => {
    const status = getStageStatus(stageId);
    if (status !== 'locked' && onStageClick) {
      onStageClick(stageId);
    }
  };

  return (
    <div className={styles.container}>
      {stages.map((stage, index) => {
        const status = getStageStatus(stage.id);
        const isLast = index === stages.length - 1;

        const starClass = [
          styles.star,
          status === 'completed' && styles.starCompleted,
          status === 'current' && styles.starCurrent,
          status === 'available' && styles.starAvailable,
        ].filter(Boolean).join(' ');

        const stageClass = [
          styles.stage,
          status === 'locked' && styles.stageLocked,
        ].filter(Boolean).join(' ');

        const nameClass = [
          styles.stageName,
          status === 'current' && styles.stageNameCurrent,
          status === 'completed' && styles.stageNameCompleted,
        ].filter(Boolean).join(' ');

        return (
          <div key={stage.id} className={styles.stageGroup}>
            <div
              className={stageClass}
              onClick={() => handleStageClick(stage.id)}
            >
              <div className={styles.tooltip}>
                {stage.name}
                {status === 'locked' && ' (Locked)'}
              </div>
              <div className={starClass}>
                {status === 'completed' ? '⭐' : status === 'current' ? stage.icon : '☆'}
              </div>
              <span className={nameClass}>Stage {stage.order}</span>
            </div>
            {!isLast && (
              <div
                className={[
                  styles.connector,
                  status === 'completed' && styles.connectorCompleted,
                  status === 'current' && styles.connectorActive,
                ].filter(Boolean).join(' ')}
              />
            )}
          </div>
        );
      })}
      <div className={styles.progressInfo}>
        <span className={styles.progressCount}>{completedCount}</span>
        <span>/ {totalCount} concepts</span>
      </div>
    </div>
  );
}
