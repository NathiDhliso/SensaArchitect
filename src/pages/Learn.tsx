import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, Home, Check, BookOpen } from 'lucide-react';
import { JourneyMap, ConceptCard, Breadcrumbs, CelebrationModal } from '@/components/learning';
import OnboardingQuiz from '@/components/learning/OnboardingQuiz';
import { useLearningStore } from '@/store/learning-store';
import { usePersonalizationStore } from '@/store/personalization-store';
import styles from './Learn.module.css';

export default function Learn() {
  const navigate = useNavigate();
  const [showExplore, setShowExplore] = useState(false);
  const [showStoryBar, setShowStoryBar] = useState(true);
  const { onboardingComplete } = usePersonalizationStore();
  const {
    progress,
    showCelebration,
    celebrationData,
    completeConcept,
    setCurrentConcept,
    dismissCelebration,
    startSession,
    endSession,
    getConceptStatus,
    getStageStatus,
    getStages,
    getConcepts,
    hasCustomContent,
    customContent,
  } = useLearningStore();

  const stages = getStages();
  const concepts = getConcepts();
  const [showOnboarding, setShowOnboarding] = useState(!onboardingComplete);

  const currentStage = stages.find(s => s.id === progress.currentStageId);
  const currentConcept = concepts.find(c => c.id === progress.currentConceptId);

  useEffect(() => {
    startSession();
    return () => {
      endSession();
    };
  }, [startSession, endSession]);

  const handleConceptComplete = () => {
    completeConcept(progress.currentConceptId);
  };

  const handleNavigate = (conceptId: string) => {
    setCurrentConcept(conceptId);
  };

  const handleExploreConcept = (conceptId: string) => {
    const status = getConceptStatus(conceptId);
    if (status !== 'locked') {
      setCurrentConcept(conceptId);
      setShowExplore(false);
    }
  };

  const handleCelebrationContinue = () => {
    dismissCelebration();
  };

  const handleTakeBreak = () => {
    dismissCelebration();
    navigate('/');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const getCurrentStageNarrative = () => {
    const currentStageIndex = stages.findIndex(s => s.id === progress.currentStageId);
    if (currentStageIndex > 0) {
      return stages[currentStageIndex].narrativeBridge;
    }
    return null;
  };

  if (showOnboarding) {
    return <OnboardingQuiz onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.homeLink} onClick={() => navigate('/')}>
            <Home size={18} />
            <span>Home</span>
          </button>

          <a href="/learn" className={styles.logo}>
            <span className={styles.logoIcon}>🧠</span>
            {hasCustomContent() && customContent?.metadata ? (
              <span>{customContent.metadata.domain} Learning</span>
            ) : (
              <span>SensaAI Learn</span>
            )}
          </a>

          <div className={styles.headerActions}>
            {progress.conceptsLearnedToday >= 3 && (
              <div className={styles.streakBadge}>
                🔥 {progress.conceptsLearnedToday} today
              </div>
            )}

            <button
              className={styles.exploreButton}
              onClick={() => setShowExplore(true)}
            >
              <Compass size={16} />
              Explore
            </button>

            <button className={styles.searchButton}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.journeySection}>
        <JourneyMap onConceptClick={handleNavigate} />
      </div>

      {showStoryBar && getCurrentStageNarrative() && (
        <div className={styles.storyBar}>
          <button 
            className={styles.storyBarClose}
            onClick={() => setShowStoryBar(false)}
            aria-label="Close story bar"
          >
            ×
          </button>
          <div className={styles.storyBarIcon}>
            <BookOpen size={20} />
          </div>
          <div className={styles.storyBarContent}>
            <h3 className={styles.storyBarTitle}>Your Learning Journey</h3>
            <p className={styles.storyBarText}>{getCurrentStageNarrative()}</p>
          </div>
        </div>
      )}

      <main className={styles.mainContent}>
        {currentStage && (
          <div className={styles.stageHeader}>
            <div className={styles.stageIcon}>{currentStage.icon}</div>
            <h2 className={styles.stageName}>Stage {currentStage.order}: {currentStage.name}</h2>
            <p className={styles.stageMetaphor}>{currentStage.metaphor}</p>
          </div>
        )}

        <div className={styles.conceptSection}>
          {currentConcept && (
            <ConceptCard
              conceptId={currentConcept.id}
              onComplete={handleConceptComplete}
            />
          )}
        </div>
      </main>

      <Breadcrumbs onNavigate={handleNavigate} />

      {showCelebration && celebrationData && (
        <CelebrationModal
          data={celebrationData}
          onContinue={handleCelebrationContinue}
          onTakeBreak={handleTakeBreak}
        />
      )}

      {showExplore && (
        <div className={styles.exploreModal} onClick={() => setShowExplore(false)}>
          <div
            className={styles.exploreContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.exploreHeader}>
              <h2 className={styles.exploreTitle}>Explore All Concepts</h2>
              <button
                className={styles.exploreClose}
                onClick={() => setShowExplore(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.exploreStages}>
              {stages.map(stage => {
                const stageStatus = getStageStatus(stage.id);
                const stageConcepts = concepts.filter(c => c.stageId === stage.id);

                return (
                  <div key={stage.id} className={styles.exploreStage}>
                    <div className={styles.exploreStageHeader}>
                      <span className={styles.exploreStageIcon}>{stage.icon}</span>
                      <span className={styles.exploreStageName}>
                        Stage {stage.order}: {stage.name}
                      </span>
                      <span className={`${styles.exploreStageStatus} ${
                        stageStatus === 'completed' ? styles.statusCompleted :
                        stageStatus === 'current' ? styles.statusCurrent :
                        styles.statusLocked
                      }`}>
                        {stageStatus === 'completed' ? 'Completed' :
                         stageStatus === 'current' ? 'In Progress' :
                         stageStatus === 'available' ? 'Available' : 'Locked'}
                      </span>
                    </div>

                    <div className={styles.exploreConcepts}>
                      {stageConcepts.map(concept => {
                        const conceptStatus = getConceptStatus(concept.id);
                        return (
                          <div
                            key={concept.id}
                            className={`${styles.exploreConcept} ${
                              conceptStatus === 'locked' ? styles.conceptLocked :
                              conceptStatus === 'completed' ? styles.conceptCompleted : ''
                            }`}
                            onClick={() => handleExploreConcept(concept.id)}
                          >
                            <span className={styles.exploreConceptIcon}>{concept.icon}</span>
                            <span className={styles.exploreConceptName}>{concept.name}</span>
                            {conceptStatus === 'completed' && (
                              <Check size={16} className={styles.exploreConceptCheck} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
