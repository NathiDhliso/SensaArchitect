import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Copy, CheckCircle2, BookOpen, Save, FolderDown, Map } from 'lucide-react';
import { useState } from 'react';
import { useGenerationStore } from '@/store/generation-store';
import { useLearningStore } from '@/store/learning-store';
import { usePalaceStore } from '@/store/palace-store';
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
      const parseResult = parseGeneratedContent(fullDocument);
      if (!parseResult.success) {
        console.error('Failed to parse content:', parseResult.error);
        alert(`Failed to load content: ${parseResult.error}`);
        setLoadingLearn(false);
        return;
      }
      const transformed = transformGeneratedContent(parseResult.data);
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

  const { createPalace } = usePalaceStore();

  const handleCreatePalace = () => {
    if (!fullDocument || !pass1Data) return;

    // Parse content to get stages
    const parseResult = parseGeneratedContent(fullDocument);
    if (!parseResult.success) {
      console.error('Failed to parse content for palace:', parseResult.error);
      return;
    }

    const { learningPath, concepts } = parseResult.data;

    // Convert parsed stages to palace format
    const stages = learningPath.stages.map(stage => {
      // Find concepts that belong to this stage
      const stageConcepts = concepts.filter(c => stage.concepts.includes(c.id));

      return {
        id: `stage-${stage.order}`,
        name: stage.name,
        concepts: stageConcepts.map(concept => ({
          id: concept.id,
          name: concept.name,
          lifecycle: {
            provision: [
              concept.provision.prerequisite,
              ...concept.provision.selection,
              concept.provision.execution,
            ].filter(Boolean),
            configure: concept.configure || [],
            monitor: [
              concept.monitor.tool,
              ...concept.monitor.metrics,
              concept.monitor.thresholds,
            ].filter(Boolean),
          },
        })),
      };
    });

    // Create palace with first route
    createPalace(currentSubject || 'study', 'tech-campus', stages);
    navigate('/palace');
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
      {/* Header Row */}
      <header className={styles.header}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Back
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Generation Complete</h1>
          <span className={styles.subtitle}>{currentSubject}</span>
        </div>
      </header>

      {/* Dashboard Layout */}
      <div className={styles.mainLayout}>
        {/* Sidebar - Metrics & Actions */}
        <aside className={styles.sidebar}>
          {/* Action Buttons */}
          <div className={styles.actionSection}>
            <button
              onClick={handleStartLearning}
              className={styles.learnButton}
              disabled={loadingLearn}
            >
              <BookOpen className={styles.buttonIcon} />
              {loadingLearn ? 'Loading...' : 'Start Learning'}
            </button>
            <button
              onClick={handleCreatePalace}
              className={styles.palaceButton}
            >
              <Map className={styles.buttonIcon} />
              Create Memory Palace
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
            <div className={styles.actionRow}>
              <button onClick={handleCopy} className={styles.secondaryButton}>
                {copied ? <CheckCircle2 className={styles.buttonIcon} /> : <Copy className={styles.buttonIcon} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleDownload} className={styles.secondaryButton}>
                <Download className={styles.buttonIcon} />
                Download
              </button>
            </div>
          </div>

          {saved && (
            <div className={styles.saveHint}>
              <FolderDown className={styles.hintIcon} />
              <span>Saved to Downloads</span>
            </div>
          )}

          {/* Quality Metrics */}
          {validation && (
            <div className={styles.metricsSection}>
              <h2 className={styles.sectionTitle}>Quality Metrics</h2>
              <div className={styles.metricsGrid}>
                <div className={`${styles.metricItem} ${getMetricStatus(validation.lifecycleConsistency, QUALITY_THRESHOLDS.lifecycleConsistency) === 'good' ? styles.metricGood : styles.metricWarning}`}>
                  <span className={styles.metricLabel}>Lifecycle</span>
                  <span className={styles.metricValue}>{validation.lifecycleConsistency}%</span>
                </div>
                <div className={`${styles.metricItem} ${getMetricStatus(validation.positiveFraming, QUALITY_THRESHOLDS.positiveFraming) === 'good' ? styles.metricGood : styles.metricWarning}`}>
                  <span className={styles.metricLabel}>Framing</span>
                  <span className={styles.metricValue}>{validation.positiveFraming}%</span>
                </div>
                <div className={`${styles.metricItem} ${getMetricStatus(validation.formatConsistency, QUALITY_THRESHOLDS.formatConsistency) === 'good' ? styles.metricGood : styles.metricWarning}`}>
                  <span className={styles.metricLabel}>Format</span>
                  <span className={styles.metricValue}>{validation.formatConsistency}%</span>
                </div>
                <div className={`${styles.metricItem} ${getMetricStatus(validation.completeness, QUALITY_THRESHOLDS.completeness) === 'good' ? styles.metricGood : styles.metricWarning}`}>
                  <span className={styles.metricLabel}>Complete</span>
                  <span className={styles.metricValue}>{validation.completeness}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Domain Analysis */}
          {pass1Data && (
            <div className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>Domain Analysis</h2>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Domain</span>
                  <span className={styles.detailValue}>{pass1Data.domain}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Role</span>
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
                  <span className={styles.detailValue}>{pass1Data.concepts.length} core</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Content Panel */}
        <main className={styles.contentPanel}>
          <div className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>Generated Content</h2>
            <pre className={styles.contentPre}>{fullDocument}</pre>
          </div>
        </main>
      </div>
    </div>
  );
}
