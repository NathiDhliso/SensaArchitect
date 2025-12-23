import { useState } from 'react';
import { usePersonalizationStore, type UserRole, type FamiliarSystem } from '@/store/personalization-store';
import styles from './OnboardingQuiz.module.css';

interface OnboardingQuizProps {
  onComplete: () => void;
}

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<FamiliarSystem | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'visual' | 'practical' | 'theoretical' | null>(null);
  const { completeOnboarding } = usePersonalizationStore();

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'architect', label: 'Architect', description: 'I design and plan systems from the ground up' },
    { value: 'operator', label: 'Operator', description: 'I manage and maintain existing systems' },
    { value: 'specialist', label: 'Specialist', description: 'I focus deeply on specific areas' },
    { value: 'learner', label: 'Learner', description: 'I\'m exploring and building foundational knowledge' },
  ];

  const systems: { value: FamiliarSystem; label: string; icon: string }[] = [
    { value: 'construction', label: 'Construction & Building', icon: '🏗️' },
    { value: 'cooking', label: 'Cooking & Recipes', icon: '👨‍🍳' },
    { value: 'travel', label: 'Travel & Navigation', icon: '✈️' },
    { value: 'healthcare', label: 'Healthcare & Body', icon: '🏥' },
    { value: 'sports', label: 'Sports & Games', icon: '⚽' },
    { value: 'nature', label: 'Nature & Ecosystems', icon: '🌳' },
  ];

  const styles_options: { value: 'visual' | 'practical' | 'theoretical'; label: string; description: string }[] = [
    { value: 'visual', label: 'Visual Learner', description: 'I learn best with diagrams and visual metaphors' },
    { value: 'practical', label: 'Hands-On Learner', description: 'I learn best by doing and practicing' },
    { value: 'theoretical', label: 'Conceptual Learner', description: 'I learn best by understanding principles first' },
  ];

  const handleNext = () => {
    if (step === 1 && selectedRole) {
      setStep(2);
    } else if (step === 2 && selectedSystem) {
      setStep(3);
    } else if (step === 3 && selectedStyle && selectedRole && selectedSystem) {
      completeOnboarding(selectedRole, selectedSystem, selectedStyle);
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = 
    (step === 1 && selectedRole) ||
    (step === 2 && selectedSystem) ||
    (step === 3 && selectedStyle);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Personalize Your Learning Journey</h2>
          <p className={styles.subtitle}>
            Help us tailor the learning experience to match how you think
          </p>
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>What's your role in learning this subject?</h3>
            <div className={styles.options}>
              {roles.map((role) => (
                <button
                  key={role.value}
                  className={`${styles.option} ${selectedRole === role.value ? styles.selected : ''}`}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <span className={styles.optionLabel}>{role.label}</span>
                  <span className={styles.optionDescription}>{role.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>Which system do you already understand well?</h3>
            <p className={styles.stepHint}>We'll use this to create familiar metaphors</p>
            <div className={styles.options}>
              {systems.map((system) => (
                <button
                  key={system.value}
                  className={`${styles.option} ${selectedSystem === system.value ? styles.selected : ''}`}
                  onClick={() => setSelectedSystem(system.value)}
                >
                  <span className={styles.optionIcon}>{system.icon}</span>
                  <span className={styles.optionLabel}>{system.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>How do you prefer to learn?</h3>
            <div className={styles.options}>
              {styles_options.map((style) => (
                <button
                  key={style.value}
                  className={`${styles.option} ${selectedStyle === style.value ? styles.selected : ''}`}
                  onClick={() => setSelectedStyle(style.value)}
                >
                  <span className={styles.optionLabel}>{style.label}</span>
                  <span className={styles.optionDescription}>{style.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {step > 1 && (
            <button className={styles.backButton} onClick={handleBack}>
              Back
            </button>
          )}
          <button
            className={styles.nextButton}
            onClick={handleNext}
            disabled={!canProceed}
          >
            {step === 3 ? 'Start Learning' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
