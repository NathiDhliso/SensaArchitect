import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGenerationStore } from '@/store/generation-store';
import type { BedrockConfig } from '@/lib/generation/claude-client';
import styles from './Settings.module.css';

export default function Settings() {
  const navigate = useNavigate();
  const { bedrockConfig, setBedrockConfig } = useGenerationStore();
  const [region, setRegion] = useState(bedrockConfig?.region || 'us-east-1');
  const [accessKeyId, setAccessKeyId] = useState(bedrockConfig?.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = useState(bedrockConfig?.secretAccessKey || '');
  const [showSecrets, setShowSecrets] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const isEnvConfigured = import.meta.env.VITE_AWS_REGION && 
                          import.meta.env.VITE_AWS_ACCESS_KEY_ID && 
                          import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

  const handleSave = () => {
    if (region.trim() && accessKeyId.trim() && secretAccessKey.trim()) {
      const config: BedrockConfig = {
        region: region.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      };
      setBedrockConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const maskSecret = (secret: string) =>
    secret ? `${secret.slice(0, 4)}${'•'.repeat(Math.max(0, secret.length - 8))}${secret.slice(-4)}` : '';

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>Settings</h1>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>AWS Bedrock Configuration</h2>

            {isEnvConfigured ? (
              <div className={styles.alert}>
                <p><strong>✓ Credentials Configured via Environment Variables</strong></p>
                <p>AWS credentials are loaded from your <code>.env</code> file:</p>
                <ul>
                  <li>Region: {import.meta.env.VITE_AWS_REGION}</li>
                  <li>Access Key ID: {import.meta.env.VITE_AWS_ACCESS_KEY_ID?.slice(0, 8)}...</li>
                  <li>Credentials are secure and not stored in browser</li>
                </ul>
                <p className={styles.description}>
                  To update credentials, edit the <code>.env</code> file in your project root and restart the dev server.
                </p>
              </div>
            ) : (
              <>
                <p className={styles.description}>
                  Enter your AWS credentials to access Bedrock. Credentials are stored locally in your browser.
                </p>

                <div className={styles.alert}>
                  <p><strong>AWS Credentials Required</strong></p>
                  <p>Configure credentials either:</p>
                  <ul>
                    <li><strong>Option 1:</strong> Create a <code>.env</code> file with VITE_AWS_REGION, VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY</li>
                    <li><strong>Option 2:</strong> Enter credentials below (stored in browser)</li>
                  </ul>
                </div>
              </>
            )}

            {!isEnvConfigured && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>AWS Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={styles.input}
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="eu-central-1">Europe (Frankfurt)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </select>
              </div>
            )}

            {!isEnvConfigured && (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>AWS Access Key ID</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={showSecrets ? accessKeyId : maskSecret(accessKeyId)}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder="AKIA..."
                      className={styles.input}
                    />
                    <button
                      onClick={() => setShowSecrets(!showSecrets)}
                      className={styles.toggleButton}
                      type="button"
                    >
                      {showSecrets ? <span>👁️</span> : <span>👁️‍🗨️</span>}
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>AWS Secret Access Key</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={showSecrets ? secretAccessKey : maskSecret(secretAccessKey)}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                      placeholder="Secret key..."
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={handleSave}
                    disabled={!region.trim() || !accessKeyId.trim() || !secretAccessKey.trim()}
                    className={styles.saveButton}
                  >
                    {saved ? 'Saved!' : 'Save Credentials'}
                  </button>
                </div>
              </>
            )}

            {bedrockConfig && (
              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                AWS credentials configured ({bedrockConfig.region})
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About</h2>
            <p className={styles.description}>
              SensaAI uses Claude AI to create structured learning materials with zero cognitive overhead. 
              The multi-pass generation system ensures accuracy through domain analysis, dependency mapping, content generation, and quality validation.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureTitle}>4-Pass Generation</span>
                <span className={styles.featureDesc}>Iterative refinement for maximum accuracy</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureTitle}>Lifecycle Enforcement</span>
                <span className={styles.featureDesc}>Domain-specific 3-phase structure</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureTitle}>Positive Framing</span>
                <span className={styles.featureDesc}>Capability-focused language throughout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
