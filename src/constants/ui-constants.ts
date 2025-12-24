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

/**
 * Centralized UI timing constants
 * Use these instead of magic numbers in setTimeout calls
 */
export const UI_TIMINGS = {
  // Feedback display durations
  TOAST_SHORT: 2000,        // For "Copied!", "Saved!" confirmations
  TOAST_MEDIUM: 3000,       // For confirmation messages
  TOAST_LONG: 5000,         // For error messages, welcome toasts

  // Interaction delays
  BLUR_DELAY: 200,          // Delay before closing dropdowns on blur
  DEBOUNCE_DEFAULT: 300,    // Default debounce for inputs

  // Animation/update timings
  MARKER_UPDATE_FAST: 100,  // Quick marker position updates
  MARKER_UPDATE_SLOW: 150,  // Normal marker position updates
  MAP_LOAD_DELAY: 500,      // Delay after map loads

  // Session timings (in milliseconds)
  CHECKPOINT_EXPIRY: 3600000, // 1 hour - session checkpoint expiry
} as const;
