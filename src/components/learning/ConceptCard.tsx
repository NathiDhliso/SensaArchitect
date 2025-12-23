import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import styles from './ConceptCard.module.css';

interface ConceptCardProps {
  conceptId: string;
  onComplete: () => void;
}

export default function ConceptCard({ conceptId, onComplete }: ConceptCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const { getConceptStatus, getConcepts } = useLearningStore();

  const concepts = getConcepts();
  const concept = concepts.find(c => c.id === conceptId);
  if (!concept) return null;

  const status = getConceptStatus(conceptId);
  const isCompleted = status === 'completed';

  const handleComplete = () => {
    if (!isCompleted) {
      onComplete();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.visualSection}>
        <div className={styles.visualContainer}>
          <div className={styles.glowRing} />
          <span className={styles.visualIcon}>{concept.icon}</span>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.conceptIcon}>{concept.icon}</div>
        <h1 className={styles.conceptName}>{concept.name}</h1>
        <p className={styles.metaphor}>{concept.metaphor}</p>
        <p className={styles.hookSentence}>{concept.hookSentence}</p>

        <div className={styles.expandableSection}>
          <button
            className={styles.expandButton}
            onClick={() => setShowWhy(!showWhy)}
          >
            <span>Learn more about this concept</span>
            <ChevronDown
              className={`${styles.expandIcon} ${showWhy ? styles.expandIconOpen : ''}`}
              size={18}
            />
          </button>

          <div className={`${styles.expandContent} ${showWhy ? styles.expandContentOpen : ''}`}>
            <div className={styles.whySection}>
              <h3 className={styles.sectionTitle}>Why You Need This</h3>
              <p className={styles.sectionText}>{concept.whyYouNeed}</p>
            </div>

            <div className={styles.exampleSection}>
              <h3 className={styles.exampleTitle}>Real-World Example</h3>
              <p className={styles.sectionText}>{concept.realWorldExample}</p>
            </div>

            {concept.lifecycle && (
              <div className={styles.lifecycleSection}>
                <h3 className={styles.lifecycleTitle}>Universal Lifecycle</h3>
                <div className={styles.lifecyclePhases}>
                  <div className={styles.lifecyclePhase}>
                    <div className={styles.phaseHeader}>
                      <span className={styles.phaseIcon}>🚀</span>
                      <span className={styles.phaseTitle}>{concept.lifecycle.phase1.title}</span>
                    </div>
                    <ul className={styles.phaseSteps}>
                      {concept.lifecycle.phase1.steps.map((step, idx) => (
                        <li key={idx} className={styles.phaseStep}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.phaseConnector}>→</div>
                  <div className={styles.lifecyclePhase}>
                    <div className={styles.phaseHeader}>
                      <span className={styles.phaseIcon}>⚙️</span>
                      <span className={styles.phaseTitle}>{concept.lifecycle.phase2.title}</span>
                    </div>
                    <ul className={styles.phaseSteps}>
                      {concept.lifecycle.phase2.steps.map((step, idx) => (
                        <li key={idx} className={styles.phaseStep}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.phaseConnector}>→</div>
                  <div className={styles.lifecyclePhase}>
                    <div className={styles.phaseHeader}>
                      <span className={styles.phaseIcon}>📊</span>
                      <span className={styles.phaseTitle}>{concept.lifecycle.phase3.title}</span>
                    </div>
                    <ul className={styles.phaseSteps}>
                      {concept.lifecycle.phase3.steps.map((step, idx) => (
                        <li key={idx} className={styles.phaseStep}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!concept.lifecycle && (
              <div className={styles.howSection}>
                <h3 className={styles.howTitle}>How To Use It</h3>
                <ol className={styles.stepList}>
                  {concept.howToUse.map((step, index) => (
                    <li key={index} className={styles.step}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <span className={styles.stepText}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {isCompleted ? (
          <div className={styles.completedBadge}>
            <Check size={24} />
            <span>Concept Mastered</span>
          </div>
        ) : (
          <button className={styles.actionButton} onClick={handleComplete}>
            {concept.actionButtonText}
          </button>
        )}

        <div className={styles.secondaryActions}>
          <button
            className={styles.deepDiveLink}
            onClick={() => setShowDeepDive(true)}
          >
            View technical details →
          </button>
        </div>
      </div>

      {showDeepDive && (
        <div className={styles.deepDiveModal} onClick={() => setShowDeepDive(false)}>
          <div
            className={styles.deepDiveContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.deepDiveClose}
              onClick={() => setShowDeepDive(false)}
            >
              ×
            </button>
            <h2 className={styles.deepDiveTitle}>{concept.name} - Technical Details</h2>
            <p className={styles.deepDiveText}>{concept.technicalDetails}</p>
            <button
              className={styles.backToLearning}
              onClick={() => setShowDeepDive(false)}
            >
              Back to learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
