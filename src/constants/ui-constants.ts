export const PASS_NAMES = [
  'Domain Analysis',
  'Dependency Mapping',
  'Content Generation',
  'Quality Validation',
] as const;

export const RECENT_SUBJECTS = [
  'Azure Administrator',
  'MCAT Biology',
  'CPA Tax Accounting',
  'AWS Solutions Architect',
  'Contract Law Fundamentals',
  'Nursing Pharmacology',
] as const;

export const MAX_DROPDOWN_OPTIONS = 7;
export const MAX_PRIMARY_ACTIONS = 3;
export const MILLERS_LAW_MAX = 7;
export const MILLERS_LAW_MIN = 3;

export const QUALITY_THRESHOLDS = {
  lifecycleConsistency: 90,
  positiveFraming: 85,
  formatConsistency: 90,
  completeness: 80,
} as const;
