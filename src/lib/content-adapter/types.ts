export interface ParsedConcept {
  id: string;
  name: string;
  order: number;
  stageId: string;
  provision: {
    prerequisite: string;
    selection: string[];
    execution: string;
  };
  configure: string[];
  monitor: {
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

export interface ParsedDependencyGraph {
  layers: {
    name: string;
    description: string;
    concepts: {
      id: string;
      name: string;
      dependencies: string[];
      relationshipType: string;
    }[];
  }[];
}

export interface ParsedLearningPath {
  stages: {
    order: number;
    name: string;
    concepts: string[];
    capabilitiesGained: string;
  }[];
}

export interface ParsedMentalAnchor {
  name: string;
  metaphor: string;
  mappings: { concept: string; metaphorElement: string }[];
  whyItHelps: string;
}

export interface ParsedGeneratedContent {
  domainAnalysis: ParsedDomainAnalysis;
  dependencyGraph: ParsedDependencyGraph;
  concepts: ParsedConcept[];
  learningPath: ParsedLearningPath;
  mentalAnchors: ParsedMentalAnchor[];
  rawContent: string;
}
