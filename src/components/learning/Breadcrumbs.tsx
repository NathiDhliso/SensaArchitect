import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLearningStore } from '@/store/learning-store';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbsProps {
  onNavigate: (conceptId: string) => void;
}

export default function Breadcrumbs({ onNavigate }: BreadcrumbsProps) {
  const { progress, getPreviousConcept, getNextConcept, getConcepts } = useLearningStore();

  const concepts = getConcepts();
  const currentConcept = concepts.find(c => c.id === progress.currentConceptId);
  const prevConceptId = getPreviousConcept();
  const nextConceptId = getNextConcept();

  const prevConcept = prevConceptId ? concepts.find(c => c.id === prevConceptId) : null;
  const nextConcept = nextConceptId ? concepts.find(c => c.id === nextConceptId) : null;

  const handlePrevious = () => {
    if (prevConceptId) {
      onNavigate(prevConceptId);
    }
  };

  const handleNext = () => {
    if (nextConceptId) {
      onNavigate(nextConceptId);
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.navButton}
        onClick={handlePrevious}
        disabled={!prevConcept}
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      <div className={styles.breadcrumbTrail}>
        {prevConcept && (
          <>
            <div
              className={`${styles.breadcrumbItem} ${styles.breadcrumbPrevious}`}
              onClick={handlePrevious}
            >
              <span className={styles.breadcrumbIcon}>{prevConcept.icon}</span>
              <span className={styles.breadcrumbName}>{prevConcept.name}</span>
            </div>
            <span className={styles.arrow}>→</span>
          </>
        )}

        {currentConcept && (
          <div className={`${styles.breadcrumbItem} ${styles.breadcrumbCurrent}`}>
            <span className={styles.breadcrumbIcon}>{currentConcept.icon}</span>
            <span className={styles.breadcrumbName}>{currentConcept.name}</span>
          </div>
        )}

        {nextConcept && (
          <>
            <span className={styles.arrow}>→</span>
            <div className={`${styles.breadcrumbItem} ${styles.breadcrumbNext}`}>
              <span className={styles.breadcrumbIcon}>{nextConcept.icon}</span>
              <span className={styles.breadcrumbName}>{nextConcept.name}</span>
            </div>
          </>
        )}
      </div>

      <button
        className={styles.continueButton}
        onClick={handleNext}
        disabled={!nextConcept}
      >
        Continue
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
