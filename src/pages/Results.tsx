import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Copy, CheckCircle2, BookOpen, Save, FolderDown } from 'lucide-react';
import { useState } from 'react';
import { useGenerationStore } from '@/store/generation-store';
import { useLearningStore } from '@/store/learning-store';
import { parseGeneratedContent, transformGeneratedContent } from '@/lib/content-adapter';
import { storageManager } from '@/lib/storage';
import type { SavedResult } from '@/lib/storage';
import { QUALITY_THRESHOLDS } from '@/constants/ui-constants';
import styles from './Results.module.css';

export default function Results() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [loadingLearn, setLoadingLearn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { fullDocument, validation, pass1Data, currentSubject } = useGenerationStore();
  const { loadCustomContent } = useLearningStore();

  const handleCopy = async () => {
    if (fullDocument) {
      await navigator.clipboard.writeText(fullDocument);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (fullDocument && currentSubject) {
      const blob = new Blob([fullDocument], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSubject.replace(/[^a-z0-9]/gi, '_')}_master_chart.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleStartLearning = () => {
    if (!fullDocument) return;
    
    setLoadingLearn(true);
    try {
      const parsed = parseGeneratedContent(fullDocument);
      const transformed = transformGeneratedContent(parsed);
      loadCustomContent(transformed);
      navigate('/learn');
    } catch (error) {
      console.error('Failed to parse content for learning:', error);
      setLoadingLearn(false);
    }
  };

  const handleSaveResult = async () => {
    if (!fullDocument || !currentSubject || !pass1Data || !validation) return;
    
    setSaving(true);
    try {
      const savedResult: SavedResult = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subject: currentSubject,
        generatedAt: new Date().toISOString(),
        fullDocument,
        pass1Data: {
          domain: pass1Data.domain,
          roleScope: pass1Data.roleScope,
          lifecycle: pass1Data.lifecycle,
          concepts: pass1Data.concepts,
        },
        validation: {
          lifecycleConsistency: validation.lifecycleConsistency,
          positiveFraming: validation.positiveFraming,
          formatConsistency: validation.formatConsistency,
          completeness: validation.completeness,
        },
        savedLocally: true,
      };

      const result = await storageManager.saveResult(savedResult);
      
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save result:', error);
    } finally {
      setSaving(false);
    }
  };

  const getMetricStatus = (value: number, threshold: number) => {
    return value >= threshold ? 'good' : 'warning';
  };

  if (!fullDocument) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.emptyState}>
            <p>No results available. Generate a chart first.</p>
            <button onClick={() => navigate('/')} className={styles.primaryButton}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </button>

        <div className={styles.headerCard}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Generation Complete</h1>
            <p className={styles.subtitle}>{currentSubject}</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={handleCopy} className={styles.secondaryButton}>
              {copied ? (
                <>
                  <CheckCircle2 className={styles.buttonIcon} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className={styles.buttonIcon} />
                  Copy
                </>
              )}
            </button>
            <button onClick={handleDownload} className={styles.primaryButton}>
              <Download className={styles.buttonIcon} />
              Download
            </button>
            <button 
              onClick={handleSaveResult} 
              className={styles.saveButton}
              disabled={saving || saved}
            >
              {saved ? (
                <>
                  <CheckCircle2 className={styles.buttonIcon} />
                  Saved
                </>
              ) : (
                <>
                  <Save className={styles.buttonIcon} />
                  {saving ? 'Saving...' : 'Save Result'}
                </>
              )}
            </button>
            <button 
              onClick={handleStartLearning} 
              className={styles.learnButton}
              disabled={loadingLearn}
            >
              <BookOpen className={styles.buttonIcon} />
              {loadingLearn ? 'Loading...' : 'Start Learning'}
            </button>
          </div>
          {saved && (
            <div className={styles.saveHint}>
              <FolderDown className={styles.hintIcon} />
              <span>File saved to your Downloads folder</span>
            </div>
          )}
        </div>

        {validation && (
          <div className={styles.metricsCard}>
            <h2 className={styles.sectionTitle}>Quality Metrics</h2>
            <div className={styles.metricsGrid}>
              <div
                className={`${styles.metricItem} ${
                  getMetricStatus(validation.lifecycleConsistency, QUALITY_THRESHOLDS.lifecycleConsistency) === 'good'
                    ? styles.metricGood
                    : styles.metricWarning
                }`}
              >
                <span className={styles.metricLabel}>Lifecycle Consistency</span>
                <span className={styles.metricValue}>{validation.lifecycleConsistency}%</span>
              </div>
              <div
                className={`${styles.metricItem} ${
                  getMetricStatus(validation.positiveFraming, QUALITY_THRESHOLDS.positiveFraming) === 'good'
                    ? styles.metricGood
                    : styles.metricWarning
                }`}
              >
                <span className={styles.metricLabel}>Positive Framing</span>
                <span className={styles.metricValue}>{validation.positiveFraming}%</span>
              </div>
              <div
                className={`${styles.metricItem} ${
                  getMetricStatus(validation.formatConsistency, QUALITY_THRESHOLDS.formatConsistency) === 'good'
                    ? styles.metricGood
                    : styles.metricWarning
                }`}
              >
                <span className={styles.metricLabel}>Format Consistency</span>
                <span className={styles.metricValue}>{validation.formatConsistency}%</span>
              </div>
              <div
                className={`${styles.metricItem} ${
                  getMetricStatus(validation.completeness, QUALITY_THRESHOLDS.completeness) === 'good'
                    ? styles.metricGood
                    : styles.metricWarning
                }`}
              >
                <span className={styles.metricLabel}>Completeness</span>
                <span className={styles.metricValue}>{validation.completeness}%</span>
              </div>
            </div>
          </div>
        )}

        {pass1Data && (
          <div className={styles.detailsCard}>
            <h2 className={styles.sectionTitle}>Domain Analysis</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Domain</span>
                <span className={styles.detailValue}>{pass1Data.domain}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Role Scope</span>
                <span className={styles.detailValue}>{pass1Data.roleScope}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Lifecycle</span>
                <span className={styles.detailValue}>
                  {pass1Data.lifecycle.phase1} → {pass1Data.lifecycle.phase2} → {pass1Data.lifecycle.phase3}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Concepts</span>
                <span className={styles.detailValue}>{pass1Data.concepts.length} core concepts</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.contentCard}>
          <h2 className={styles.sectionTitle}>Generated Content</h2>
          <pre className={styles.contentPre}>{fullDocument}</pre>
        </div>
      </div>
    </div>
  );
}
