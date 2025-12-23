import { useState } from 'react';
import { Check, Lightbulb } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import styles from './ConceptCard.module.css';

interface ConceptCardProps {
  conceptId: string;
  onComplete: () => void;
}

export default function ConceptCard({ conceptId, onComplete }: ConceptCardProps) {
  const [activeTab, setActiveTab] = useState<'why' | 'how' | 'details'>('why');
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
      <div className={styles.conceptHeader}>
        <span className={styles.conceptIcon}>{concept.icon}</span>
        <div className={styles.conceptInfo}>
          <h1 className={styles.conceptName}>{concept.name}</h1>
          <p className={styles.metaphor}>{concept.metaphor}</p>
        </div>
        {isCompleted && (
          <div className={styles.completedBadge}>
            <Check size={16} />
          </div>
        )}
      </div>

      <p className={styles.hookSentence}>{concept.hookSentence}</p>

      {concept.logicalConnection && (
        <div className={styles.connectionBadge}>
          <Lightbulb size={14} />
          <span>{concept.logicalConnection}</span>
        </div>
      )}

      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'why' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('why')}
        >
          Why
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'how' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('how')}
        >
          How
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'why' && (
          <div className={styles.whyContent}>
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Why You Need This</h3>
              <p className={styles.cardText}>{concept.whyYouNeed}</p>
            </div>
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Real-World Example</h3>
              <p className={styles.cardText}>{concept.realWorldExample}</p>
            </div>
          </div>
        )}

        {activeTab === 'how' && (
          <div className={styles.howContent}>
            {concept.lifecycle ? (
              <div className={styles.lifecycleFlow}>
                <div className={styles.lifecycleStep}>
                  <div className={styles.stepBadge}>1</div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepLabel}>{concept.lifecycle.phase1.title}</span>
                    <ul className={styles.stepItems}>
                      {concept.lifecycle.phase1.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.lifecycleStep}>
                  <div className={styles.stepBadge}>2</div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepLabel}>{concept.lifecycle.phase2.title}</span>
                    <ul className={styles.stepItems}>
                      {concept.lifecycle.phase2.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.lifecycleStep}>
                  <div className={styles.stepBadge}>3</div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepLabel}>{concept.lifecycle.phase3.title}</span>
                    <ul className={styles.stepItems}>
                      {concept.lifecycle.phase3.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <ol className={styles.stepList}>
                {concept.howToUse.map((step, index) => (
                  <li key={index} className={styles.stepItem}>
                    <span className={styles.stepNum}>{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className={styles.detailsContent}>
            <p className={styles.technicalText}>{concept.technicalDetails}</p>
            {concept.prerequisites.length > 0 && (
              <div className={styles.prereqSection}>
                <h4 className={styles.prereqTitle}>Prerequisites</h4>
                <div className={styles.prereqList}>
                  {concept.prerequisites.map((prereq, idx) => (
                    <span key={idx} className={styles.prereqBadge}>{prereq}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.actionBar}>
        {isCompleted ? (
          <div className={styles.masteredStatus}>
            <Check size={18} />
            <span>Mastered</span>
          </div>
        ) : (
          <button className={styles.actionButton} onClick={handleComplete}>
            {concept.actionButtonText || 'Mark as Complete'}
          </button>
        )}
      </div>
    </div>
  );
}
