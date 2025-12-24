import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Zap, HelpCircle } from 'lucide-react';
import {
  JourneyMap,
  ConceptCard,
  CelebrationModal,
  LearningToolbar,
  CognitiveGauge,
  NeuralResetBanner,
  UnifiedSessionBar,
  SessionSummary,
} from '@/components/learning';
import HelpModal from '@/components/ui/HelpModal';
import { useLearningStore } from '@/store/learning-store';
import { useFocusSessionStore } from '@/store/focus-session-store';
import { UI_TIMINGS } from '@/constants/ui-constants';
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

  const { isSessionActive, recordConceptEnd } = useFocusSessionStore();

  const stages = getStages();
  const concepts = getConcepts();
  const currentConcept = concepts.find(c => c.id === progress.currentConceptId);
  const hasContent = stages.length > 0 && concepts.length > 0;

  // Check if all concepts are complete (sprint ready)
  const allConceptsComplete = hasContent &&
    concepts.every(c => progress.completedConcepts.includes(c.id));
  const progressPercent = hasContent
    ? Math.round((progress.completedConcepts.length / concepts.length) * 100)
    : 0;

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    startSession();
    return () => endSession();
  }, [startSession, endSession]);

  const handleConceptComplete = () => {
    // Record concept completion in focus session if active
    if (isSessionActive && progress.currentConceptId) {
      recordConceptEnd(progress.currentConceptId, true);
    }
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
      {/* Unified Session Bar - appears when focus session is active */}
      <div className={styles.sessionBarContainer}>
        <UnifiedSessionBar />
      </div>

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
        <div className={styles.headerCenter}>
          <CognitiveGauge compact />
        </div>
        <LearningToolbar />
        <div className={styles.headerActions}>
          {hasContent && progressPercent >= 50 && (
            <button
              className={styles.sprintButton}
              onClick={() => navigate('/sprint')}
              title="Start Automaticity Sprint"
            >
              <Zap size={18} />
              <span className={styles.sprintButtonText}>Sprint</span>
            </button>
          )}
          <button
            className={styles.palaceButton}
            onClick={() => navigate('/palace')}
            title="Open Memory Palace & Street View"
          >
            <Map size={18} />
          </button>
          <button
            className={styles.helpButton}
            onClick={() => setShowHelp(true)}
            title="Help & Tips"
          >
            <HelpCircle size={18} />
          </button>
        </div>
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

      {showCelebration && celebrationData && (
        <CelebrationModal
          data={celebrationData}
          onContinue={handleCelebrationContinue}
          onTakeBreak={handleTakeBreak}
        />
      )}

      {/* Sprint Ready Banner */}
      {allConceptsComplete && (
        <div className={styles.sprintReadyBanner}>
          <div className={styles.sprintReadyContent}>
            <span className={styles.sprintReadyIcon}>🎯</span>
            <div className={styles.sprintReadyText}>
              <strong>You've mastered all concepts!</strong>
              <p>Ready to test your automaticity?</p>
            </div>
            <button
              className={styles.sprintReadyButton}
              onClick={() => navigate('/sprint')}
            >
              <Zap size={18} />
              Start Sprint
            </button>
          </div>
        </div>
      )}

      {/* Session Summary Modal - displays when focus session ends */}
      <SessionSummary />

      {/* Neural Reset Banner - suggests break when cognitive load is high */}
      <NeuralResetBanner />

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
