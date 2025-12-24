export const PASS_NAMES = [
  'Domain Analysis',
  'Dependency Mapping',
  'Content Generation',
  'Quality Validation',
] as const;

export const EXAMPLE_SUBJECTS = [
  'Data Science Fundamentals',
  'Project Management',
  'Financial Analysis',
  'Software Development',
  'Healthcare Administration',
  'Business Strategy',
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
