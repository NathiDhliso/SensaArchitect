export type LifecyclePhases = {
  phase1: string;
  phase2: string;
  phase3: string;
};

export type UniversalLifecycle = {
  phase1: string;
  phase2: string;
  phase3: string;
  roleScope: string;
  excludedActions: string[];
  positiveFraming?: {
    instead_of: string;
    say: string;
  };
};

export type DomainType =
  | 'IT/Cloud'
  | 'Coding/Dev'
  | 'Law'
  | 'Medicine'
  | 'Accountancy'
  | 'Project Management'
  | 'Education';

export type Pass1Result = {
  domain: DomainType;
  lifecycle: LifecyclePhases;
  roleScope: string;
  excludedActions: string[];
  concepts: string[];
  numericalLimits: string[];
  recentUpdates: string[];
  sourceVerification: string;
};

export type PassStatus = 'queued' | 'in-progress' | 'complete' | 'fixing';

export type ValidationResult = {
  valid: boolean;
  conceptCount: { expected: number; found: number };
  lifecycleConsistency: number;
  positiveFraming: number;
  formatConsistency: number;
  completeness: number;
  issues: Array<{
    section: string;
    problem: string;
    severity: 'critical' | 'minor';
    fix: string;
  }>;
  violations: {
    outOfScope: string[];
    negativeFraming: string[];
  };
  fixes: Record<string, string>;
};

export type GenerationResult = {
  pass1: Pass1Result;
  pass2: string;
  pass3: string;
  validation: ValidationResult;
  fullDocument: string;
  metadata: {
    subject: string;
    generatedAt: string;
    qualityMetrics: {
      lifecycleConsistency: number;
      positiveFraming: number;
      formatConsistency: number;
      completeness: number;
    };
  };
};

export type ProgressCallback = (
  pass: number,
  status: PassStatus,
  data?: {
    message?: string;
    partial?: string;
    progress?: number;
    content?: string;
    lifecycle?: LifecyclePhases;
    roleScope?: string;
  } & Partial<Pass1Result> & Partial<ValidationResult>
) => void;
