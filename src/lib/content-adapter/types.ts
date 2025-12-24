export interface ParsedConcept {
  id: string;
  name: string;
  order: number;
  stageId: string;
  logicalConnection?: string;
  phase1: {
    prerequisite: string;
    selection: string[];
    execution: string;
  };
  phase2: string[];
  phase3: {
    tool: string;
    metrics: string[];
    thresholds: string;
  };
  criticalDistinctions: string[];
  designBoundaries: string[];
  examFocus: string[];
}

export interface ParsedStage {
  id: string;
  order: number;
  name: string;
  concepts: string[];
}

export interface ParsedDomainAnalysis {
  domain: string;
  professionalRole: string;
  lifecycle: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
  sourceVerification: string;
  recentUpdates: string[];
  numericalLimits: string[];
  coreConceptsCount: number;
  conceptNames: string[];
}

export interface ParsedLearningPath {
  stages: {
    order: number;
    name: string;
    concepts: string[];
    capabilitiesGained: string;
    narrativeBridge?: string;
  }[];
}

export interface ParsedAcronym {
  acronym: string;
  expansion: string;
  mnemonic: string;
}

export interface ParsedMentalAnchor {
  name: string;
  metaphor: string;
  mappings: { concept: string; metaphorElement: string }[];
  whyItHelps: string;
  acronym?: ParsedAcronym;
}

export interface ParsedGeneratedContent {
  domainAnalysis: ParsedDomainAnalysis;
  concepts: ParsedConcept[];
  learningPath: ParsedLearningPath;
  mentalAnchors: ParsedMentalAnchor[];
  rawContent: string;
}
