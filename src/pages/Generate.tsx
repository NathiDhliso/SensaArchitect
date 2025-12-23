import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2, ArrowLeft } from 'lucide-react';
import { generateChartIteratively } from '@/lib/generation/multi-pass-generator';
import { useGenerationStore } from '@/store/generation-store';
import { PASS_NAMES } from '@/constants/ui-constants';
import styles from './Generate.module.css';

export default function Generate() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const {
    bedrockConfig,
    passes,
    currentActivity,
    progress,
    pass1Data,
    isGenerating,
    error,
    startGeneration,
    updatePassStatus,
    setCurrentActivity,
    setProgress,
    setPass1Data,
    setPass2Content,
    setPass3Content,
    setValidation,
    completeGeneration,
    setError,
    addRecentSubject,
  } = useGenerationStore();

  useEffect(() => {
    if (!subject || !bedrockConfig) return;

    const decodedSubject = decodeURIComponent(subject);
    startGeneration(decodedSubject);
    addRecentSubject(decodedSubject);

    generateChartIteratively(decodedSubject, bedrockConfig, (pass, status, data) => {
      updatePassStatus(pass, status);

      if (data?.message) {
        setCurrentActivity(data.message);
      }

      if (data?.partial) {
        setCurrentActivity('Generating detailed content...');
      }

      if (data?.progress !== undefined) {
        setProgress(data.progress);
      }

      if (pass === 1 && status === 'complete' && data && 'domain' in data && data.domain) {
        setPass1Data(data as any);
      }

      if (pass === 2 && status === 'complete' && data?.content) {
        setPass2Content(data.content);
      }

      if (pass === 3 && status === 'complete' && data?.content) {
        setPass3Content(data.content);
      }

      if (pass === 4 && status === 'complete' && data) {
        setValidation(data as Parameters<typeof setValidation>[0]);
      }
    })
      .then((result) => {
        completeGeneration(result);
        navigate(`/results/${Date.now()}`);
      })
      .catch((err) => {
        setError(err.message || 'Generation failed');
      });
  }, [subject, bedrockConfig]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className={styles.iconComplete} />;
      case 'in-progress':
      case 'fixing':
        return <Loader2 className={styles.iconProgress} />;
      default:
        return <Circle className={styles.iconQueued} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in-progress':
        return 'In Progress';
      case 'fixing':
        return 'Auto-fixing';
      default:
        return 'Queued';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>
            Generating: {decodeURIComponent(subject || '')}
          </h1>

          {pass1Data && (
            <div className={styles.metadata}>
              <span>
                Role: <strong>{pass1Data.roleScope}</strong>
              </span>
              <span className={styles.separator}>•</span>
              <span>
                Lifecycle:{' '}
                <strong>
                  {pass1Data.lifecycle.phase1} → {pass1Data.lifecycle.phase2} →{' '}
                  {pass1Data.lifecycle.phase3}
                </strong>
              </span>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
              <button onClick={() => navigate('/')} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}

          <div className={styles.passList}>
            {[1, 2, 3, 4].map((pass) => {
              const status = passes[pass];
              return (
                <div key={pass} className={styles.passItem}>
                  {getStatusIcon(status)}
                  <span
                    className={
                      status === 'complete' ? styles.passTextComplete : styles.passText
                    }
                  >
                    Pass {pass}: {PASS_NAMES[pass - 1]}
                  </span>
                  <span
                    className={
                      status === 'complete'
                        ? styles.statusComplete
                        : status === 'in-progress' || status === 'fixing'
                          ? styles.statusProgress
                          : styles.statusQueued
                    }
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>
              );
            })}
          </div>

          {isGenerating && (
            <div className={styles.activityBox}>
              <div className={styles.activityHeader}>
                <div className={styles.pulseRing}>
                  <Loader2 className={styles.activityIcon} />
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityLabel}>Currently Processing</span>
                  <span className={styles.activityPhase}>
                    {passes[3] === 'in-progress' ? 'Content Generation' : 
                     passes[4] === 'in-progress' ? 'Quality Validation' :
                     passes[2] === 'in-progress' ? 'Dependency Mapping' :
                     passes[1] === 'in-progress' ? 'Domain Analysis' : 'Processing'}
                  </span>
                </div>
              </div>

              <div className={styles.activityDetails}>
                <p className={styles.activityText}>{currentActivity}</p>
                {pass1Data && passes[3] === 'in-progress' && (
                  <p className={styles.conceptCount}>
                    Generating {pass1Data.concepts.length} concepts with full detail
                  </p>
                )}
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>Overall Progress</span>
                  <span className={styles.progressPercent}>{Math.round(progress)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                  <div 
                    className={styles.progressGlow}
                    style={{ left: `${progress}%` }}
                  />
                </div>
                <div className={styles.progressStats}>
                  <span>Estimated time: {progress < 30 ? '3-4 min' : progress < 70 ? '1-2 min' : '< 1 min'}</span>
                  {pass1Data && (
                    <span>{pass1Data.concepts.length} concepts • {pass1Data.domain}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button onClick={() => navigate('/')} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
