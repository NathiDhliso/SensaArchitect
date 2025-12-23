import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Download, BookOpen, Cloud, HardDrive, Upload } from 'lucide-react';
import { storageManager, importFromFile } from '@/lib/storage';
import { localFileStorage } from '@/lib/storage';
import type { SavedResult } from '@/lib/storage';
import { useLearningStore } from '@/store/learning-store';
import { parseGeneratedContent, transformGeneratedContent } from '@/lib/content-adapter';
import styles from './SavedResults.module.css';

export default function SavedResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadCustomContent } = useLearningStore();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      const savedResults = await storageManager.listResults();
      setResults(savedResults);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    
    setDeletingId(id);
    try {
      await storageManager.deleteResult(id);
      setResults(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete result:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (result: SavedResult) => {
    localFileStorage.downloadTextFile(result);
  };

  const handleStartLearning = (result: SavedResult) => {
    try {
      const parsed = parseGeneratedContent(result.fullDocument);
      const transformed = transformGeneratedContent(parsed);
      loadCustomContent(transformed);
      navigate('/learn');
    } catch (error) {
      console.error('Failed to load content for learning:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const importResult = await importFromFile(file);
      
      if (importResult.success && importResult.result) {
        await storageManager.saveResult(importResult.result);
        await loadResults();
      } else {
        setImportError(importResult.error || 'Failed to import file');
        setTimeout(() => setImportError(null), 5000);
      }
    } catch (error) {
      setImportError('Failed to import file');
      setTimeout(() => setImportError(null), 5000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQualityColor = (value: number): string => {
    if (value >= 90) return styles.qualityExcellent;
    if (value >= 80) return styles.qualityGood;
    if (value >= 70) return styles.qualityFair;
    return styles.qualityPoor;
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </button>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Saved Results</h1>
            <p className={styles.subtitle}>
              {results.length} {results.length === 1 ? 'result' : 'results'} saved
            </p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={handleImportClick}
              className={styles.importButton}
              disabled={importing}
            >
              <Upload size={16} />
              {importing ? 'Importing...' : 'Import File'}
            </button>
            {storageManager.isCloudEnabled() ? (
              <div className={styles.cloudBadge}>
                <Cloud size={16} />
                Cloud Sync Enabled
              </div>
            ) : (
              <div className={styles.localHint}>
                <HardDrive size={14} />
                Files saved to Downloads folder
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

        {importError && (
          <div className={styles.errorBanner}>
            {importError}
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading saved results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className={styles.emptyState}>
            <HardDrive size={48} className={styles.emptyIcon} />
            <h2>No saved results yet</h2>
            <p>Generate and save your first chart to see it here</p>
            <button onClick={() => navigate('/')} className={styles.primaryButton}>
              Generate Chart
            </button>
          </div>
        ) : (
          <div className={styles.resultsGrid}>
            {results.map((result) => (
              <div key={result.id} className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{result.subject}</h3>
                    <p className={styles.cardDate}>{formatDate(result.generatedAt)}</p>
                  </div>
                  <div className={styles.storageBadges}>
                    {result.savedLocally && (
                      <span className={styles.localBadge} title="Saved locally">
                        <HardDrive size={14} />
                      </span>
                    )}
                    {result.savedToCloud && (
                      <span className={styles.cloudBadge} title="Saved to cloud">
                        <Cloud size={14} />
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.metaInfo}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Domain</span>
                      <span className={styles.metaValue}>{result.pass1Data.domain}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Concepts</span>
                      <span className={styles.metaValue}>{result.pass1Data.concepts.length}</span>
                    </div>
                  </div>

                  <div className={styles.qualityMetrics}>
                    <div className={styles.metricBadge}>
                      <span className={styles.metricLabel}>Quality</span>
                      <span className={`${styles.metricValue} ${getQualityColor(result.validation.completeness)}`}>
                        {result.validation.completeness}%
                      </span>
                    </div>
                    <div className={styles.metricBadge}>
                      <span className={styles.metricLabel}>Lifecycle</span>
                      <span className={`${styles.metricValue} ${getQualityColor(result.validation.lifecycleConsistency)}`}>
                        {result.validation.lifecycleConsistency}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleStartLearning(result)}
                    className={styles.learnButton}
                    title="Start learning"
                  >
                    <BookOpen size={16} />
                    Learn
                  </button>
                  <button
                    onClick={() => handleDownload(result)}
                    className={styles.downloadButton}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(result.id)}
                    className={styles.deleteButton}
                    disabled={deletingId === result.id}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
