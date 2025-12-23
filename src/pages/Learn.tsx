import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JourneyMap, ConceptCard, CelebrationModal } from '@/components/learning';
import { useLearningStore } from '@/store/learning-store';
import styles from './Learn.module.css';

export default function Learn() {
  const navigate = useNavigate();
  const {
    progress,
    showCelebration,
    celebrationData,
    completeConcept,
    setCurrentConcept,
    dismissCelebration,
    startSession,
    endSession,
    getStages,
    getConcepts,
    hasCustomContent,
    customContent,
  } = useLearningStore();

  const stages = getStages();
  const concepts = getConcepts();
  const currentConcept = concepts.find(c => c.id === progress.currentConceptId);
  const hasContent = stages.length > 0 && concepts.length > 0;

  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    startSession();

    if (currentConcept && progress.completedConcepts.length > 0) {
      setShowWelcomeToast(true);
      setTimeout(() => setShowWelcomeToast(false), 5000);
    }

    return () => endSession();
  }, [startSession, endSession]);

  const handleConceptComplete = () => {
    completeConcept(progress.currentConceptId);
  };

  const handleNavigate = (conceptId: string) => {
    setCurrentConcept(conceptId);
  };

  const handleCelebrationContinue = () => {
    dismissCelebration();
  };

  const handleTakeBreak = () => {
    dismissCelebration();
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.logoIcon}>🧠</span>
          <span className={styles.logoText}>
            {hasCustomContent() && customContent?.metadata
              ? customContent.metadata.domain
              : 'SensaAI'}
          </span>
        </div>
        {progress.conceptsLearnedToday > 0 && (
          <div className={styles.streakBadge}>
            🔥 {progress.conceptsLearnedToday}
          </div>
        )}
      </header>

      <div className={styles.mainLayout}>
        <aside className={styles.scaffoldPanel}>
          <JourneyMap onConceptClick={handleNavigate} />
        </aside>

        <main className={styles.contentPanel}>
          {hasContent && currentConcept ? (
            <ConceptCard
              conceptId={currentConcept.id}
              onComplete={handleConceptComplete}
            />
          ) : (
            <div className={styles.emptyContent}>
              <div className={styles.emptyIcon}>📚</div>
              <h2 className={styles.emptyTitle}>No Content Loaded</h2>
              <p className={styles.emptyText}>
                Generate learning content to start your journey
              </p>
              <button
                className={styles.generateButton}
                onClick={() => navigate('/generate')}
              >
                Generate Content
              </button>
            </div>
          )}
        </main>
      </div>

      {showWelcomeToast && currentConcept && (
        <div className={styles.welcomeToast}>
          <div className={styles.toastContent}>
            <span className={styles.toastIcon}>👋</span>
            <div>
              <strong>Welcome back!</strong>
              <p>Continue with: {currentConcept.name}</p>
            </div>
          </div>
        </div>
      )}

      {showCelebration && celebrationData && (
        <CelebrationModal
          data={celebrationData}
          onContinue={handleCelebrationContinue}
          onTakeBreak={handleTakeBreak}
        />
      )}
    </div>
  );
}
