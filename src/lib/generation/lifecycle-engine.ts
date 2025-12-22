import { LIFECYCLE_REGISTRY, DOMAIN_KEYWORDS } from '@/constants/lifecycle-registry';
import type { DomainType } from '@/lib/types';

export function detectDomain(subject: string): DomainType {
  const lower = subject.toLowerCase();

  const domainScores: Record<DomainType, number> = {
    'IT/Cloud': 0,
    'Coding/Dev': 0,
    Law: 0,
    Medicine: 0,
    Accountancy: 0,
    'Project Management': 0,
    Education: 0,
  };

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        domainScores[domain as DomainType] += 1;
      }
    }
  }

  const entries = Object.entries(domainScores) as [DomainType, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  if (sorted[0][1] > 0) {
    return sorted[0][0];
  }

  return 'IT/Cloud';
}

export function enforceLifecycleScope(subject: string, domain: DomainType): string {
  const lifecycle = LIFECYCLE_REGISTRY[domain];

  const excludedList = lifecycle.excludedActions
    .map((action) => `  - ${action}`)
    .join('\n');

  const positiveFramingSection = lifecycle.positiveFraming
    ? `
POSITIVE FRAMING REQUIREMENT:
Instead of: "${lifecycle.positiveFraming.instead_of}"
Say: "${lifecycle.positiveFraming.say}"
`
    : '';

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT ROLE BOUNDARY ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: ${subject}
Domain: ${domain}
Professional Role: ${lifecycle.roleScope}

AUTHORIZED LIFECYCLE:
${lifecycle.phase1} (The Foundation) →
${lifecycle.phase2} (The Action) →
${lifecycle.phase3} (The Verification)

OUT OF SCOPE - DO NOT INCLUDE:
${excludedList}
${positiveFramingSection}
Every core concept MUST use the authorized lifecycle phases.
No exceptions.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

export function getLifecycleForDomain(domain: DomainType) {
  return LIFECYCLE_REGISTRY[domain];
}

export function validateLifecycleConsistency(
  content: string,
  domain: DomainType
): { isValid: boolean; missingPhases: string[] } {
  const lifecycle = LIFECYCLE_REGISTRY[domain];
  const missingPhases: string[] = [];

  if (!content.includes(lifecycle.phase1)) {
    missingPhases.push(lifecycle.phase1);
  }
  if (!content.includes(lifecycle.phase2)) {
    missingPhases.push(lifecycle.phase2);
  }
  if (!content.includes(lifecycle.phase3)) {
    missingPhases.push(lifecycle.phase3);
  }

  return {
    isValid: missingPhases.length === 0,
    missingPhases,
  };
}

export { LIFECYCLE_REGISTRY };
