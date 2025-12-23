import type { Pass1Result, ValidationResult } from '@/lib/types';
import { LIFECYCLE_REGISTRY } from '@/constants/lifecycle-registry';

export function calculateProgress(content: string, totalConcepts: number): number {
  const conceptsGenerated = (content.match(/CORE CONCEPT \d+:/g) || []).length;
  return Math.min((conceptsGenerated / totalConcepts) * 100, 99);
}

export function applyFixes(content: string, fixes: Record<string, string>): string {
  let fixed = content;
  for (const [section, correction] of Object.entries(fixes)) {
    const sectionRegex = new RegExp(`(${section}:.*?)(?=CORE CONCEPT|$)`, 'gs');
    fixed = fixed.replace(sectionRegex, correction);
  }
  return fixed;
}

export function assembleFinalDocument(
  pass1Data: Pass1Result,
  pass2Content: string,
  pass3Content: string
): string {
  return `
================================================================================
VISUAL MASTER CHART: ${pass1Data.sourceVerification}
Generated: ${new Date().toISOString()}
================================================================================

DOMAIN ANALYSIS
---------------
Domain: ${pass1Data.domain}
Professional Role: ${pass1Data.roleScope}
Lifecycle: ${pass1Data.lifecycle.phase1} → ${pass1Data.lifecycle.phase2} → ${pass1Data.lifecycle.phase3}

Source Verification: ${pass1Data.sourceVerification}

Recent Updates:
${pass1Data.recentUpdates.map((u) => `  • ${u}`).join('\n')}

Numerical Limits:
${pass1Data.numericalLimits.map((l) => `  • ${l}`).join('\n')}

Core Concepts Identified: ${pass1Data.concepts.length}
${pass1Data.concepts.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

================================================================================
CONCEPT DEPENDENCY GRAPH & DECISION FRAMEWORKS
================================================================================

${pass2Content}

================================================================================
MASTER HIERARCHICAL CHART
================================================================================

${pass3Content}
`.trim();
}

export function validatePass1Result(data: unknown): data is Pass1Result {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.domain === 'string' &&
    typeof obj.lifecycle === 'object' &&
    obj.lifecycle !== null &&
    typeof (obj.lifecycle as Record<string, unknown>).phase1 === 'string' &&
    typeof (obj.lifecycle as Record<string, unknown>).phase2 === 'string' &&
    typeof (obj.lifecycle as Record<string, unknown>).phase3 === 'string' &&
    typeof obj.roleScope === 'string' &&
    Array.isArray(obj.excludedActions) &&
    Array.isArray(obj.concepts) &&
    Array.isArray(obj.numericalLimits) &&
    Array.isArray(obj.recentUpdates) &&
    typeof obj.sourceVerification === 'string'
  );
}

export function correctLifecycleToRegistry(pass1Data: Pass1Result): Pass1Result {
  const registryLifecycle = LIFECYCLE_REGISTRY[pass1Data.domain as keyof typeof LIFECYCLE_REGISTRY];
  if (!registryLifecycle) {
    return pass1Data;
  }

  if (
    pass1Data.lifecycle.phase1 !== registryLifecycle.phase1 ||
    pass1Data.lifecycle.phase2 !== registryLifecycle.phase2 ||
    pass1Data.lifecycle.phase3 !== registryLifecycle.phase3
  ) {
    return {
      ...pass1Data,
      lifecycle: {
        phase1: registryLifecycle.phase1,
        phase2: registryLifecycle.phase2,
        phase3: registryLifecycle.phase3,
      },
    };
  }

  return pass1Data;
}

export function createEmptyValidation(): ValidationResult {
  return {
    valid: false,
    conceptCount: { expected: 0, found: 0 },
    lifecycleConsistency: 0,
    positiveFraming: 0,
    formatConsistency: 0,
    completeness: 0,
    issues: [],
    violations: {
      outOfScope: [],
      negativeFraming: [],
    },
    fixes: {},
  };
}
