import type { UniversalLifecycle, DomainType } from '@/lib/types';

export const LIFECYCLE_REGISTRY: Record<DomainType, UniversalLifecycle> = {
  'IT/Cloud': {
    phase1: 'PROVISION',
    phase2: 'CONFIGURE',
    phase3: 'MONITOR',
    roleScope: 'Azure Administrator',
    excludedActions: ['architect', 'design', 'plan', 'strategize'],
    positiveFraming: {
      instead_of: 'cannot architect',
      say: 'focuses on operational excellence',
    },
  },
  'Coding/Dev': {
    phase1: 'DEFINE',
    phase2: 'IMPLEMENT',
    phase3: 'DEBUG',
    roleScope: 'Software Engineer',
    excludedActions: ['deploy', 'provision infrastructure', 'manage databases'],
  },
  Law: {
    phase1: 'FORMATION',
    phase2: 'PERFORMANCE',
    phase3: 'REMEDY',
    roleScope: 'Transactional Attorney',
    excludedActions: ['litigate', 'argue in court', 'conduct discovery'],
  },
  Medicine: {
    phase1: 'ASSESS',
    phase2: 'TREAT',
    phase3: 'MONITOR',
    roleScope: 'Primary Care Physician',
    excludedActions: ['perform surgery', 'administer anesthesia'],
  },
  Accountancy: {
    phase1: 'RECOGNIZE',
    phase2: 'MEASURE',
    phase3: 'DISCLOSE',
    roleScope: 'Certified Public Accountant',
    excludedActions: ['audit publicly-traded companies without license'],
  },
  'Project Management': {
    phase1: 'INITIATE',
    phase2: 'EXECUTE',
    phase3: 'CLOSE',
    roleScope: 'Project Manager',
    excludedActions: ['make executive decisions', 'set company strategy'],
  },
  Education: {
    phase1: 'INTRODUCE',
    phase2: 'PRACTICE',
    phase3: 'ASSESS',
    roleScope: 'Educator/Instructor',
    excludedActions: ['diagnose learning disabilities', 'prescribe medication'],
  },
};

export const DOMAIN_KEYWORDS: Record<DomainType, string[]> = {
  'IT/Cloud': ['azure', 'aws', 'cloud', 'gcp', 'kubernetes', 'docker', 'devops', 'infrastructure'],
  'Coding/Dev': ['programming', 'coding', 'software', 'javascript', 'python', 'react', 'typescript', 'algorithm'],
  Law: ['contract', 'law', 'legal', 'attorney', 'court', 'litigation', 'statute', 'bar exam'],
  Medicine: ['medical', 'nursing', 'physician', 'mcat', 'usmle', 'clinical', 'diagnosis', 'patient'],
  Accountancy: ['accounting', 'cpa', 'tax', 'audit', 'gaap', 'ifrs', 'financial', 'bookkeeping'],
  'Project Management': ['project', 'scrum', 'agile', 'pmp', 'kanban', 'sprint', 'stakeholder'],
  Education: ['teaching', 'pedagogy', 'curriculum', 'lesson', 'student', 'classroom', 'assessment'],
};
