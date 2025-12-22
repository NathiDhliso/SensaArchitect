import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Archive } from 'lucide-react';
import { useGenerationStore } from '@/store/generation-store';
import styles from './Home.module.css';

export default function Home() {
  const [subject, setSubject] = useState('');
  const navigate = useNavigate();
  const { recentSubjects, bedrockConfig } = useGenerationStore();

  const handleGenerate = () => {
    if (subject.trim()) {
      navigate(`/generate/${encodeURIComponent(subject)}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>SensaAI</h1>
          <p className={styles.subtitle}>
            Turn any subject into a structured learning system
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.inputSection}>
            <label className={styles.label}>What do you want to master?</label>
            <div className={styles.inputWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g., AWS Solutions Architect"
                className={styles.input}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!subject.trim()}
            className={styles.generateButton}
          >
            Generate Learning System
          </button>

          {!bedrockConfig && (
            <div className={styles.infoBox}>
              <span>AWS credentials required. </span>
              <button onClick={() => navigate('/settings')} className={styles.settingsLink}>
                Configure in Settings
              </button>
            </div>
          )}

          <div className={styles.recentSection}>
            <p className={styles.helpText}>
              The app automatically detects the professional role and lifecycle phases
            </p>
            <div className={styles.recentTags}>
              <span className={styles.recentLabel}>Recent:</span>
              {recentSubjects.map((item) => (
                <button
                  key={item}
                  onClick={() => setSubject(item)}
                  className={styles.recentTag}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button onClick={() => navigate('/learn')} className={styles.learnButton}>
            Start Learning Journey
          </button>
          <button onClick={() => navigate('/saved')} className={styles.savedButton}>
            <Archive size={18} />
            Saved Results
          </button>
          <button onClick={() => navigate('/settings')} className={styles.settingsButton}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
