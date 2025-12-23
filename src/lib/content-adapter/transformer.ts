import type { ParsedGeneratedContent, ParsedConcept, ParsedMentalAnchor } from './types';
import type { LearningStage, LearningConcept, ConceptLifecycle } from '@/lib/types/learning';

const DEFAULT_ICONS = ['📌', '🔷', '⭐', '🎯', '💡', '🔧', '📊', '🌟', '🎓', '🔬'];
const DEFAULT_STAGE_ICONS = ['🏁', '🚀', '⚡', '🎯', '🏆', '💎', '🌟'];

function extractIconFromMetaphor(metaphor: string): string {
  const iconMap: Record<string, string> = {
    'door': '🚪', 'gate': '🚪', 'entrance': '🚪',
    'building': '🏢', 'foundation': '🏗️', 'structure': '🏛️',
    'security': '🔐', 'lock': '🔒', 'key': '🔑',
    'network': '🌐', 'connection': '🔗', 'link': '🔗',
    'road': '🛣️', 'highway': '🛤️', 'path': '🛤️',
    'factory': '🏭', 'production': '⚙️', 'machine': '⚙️',
    'monitor': '📺', 'control': '🎛️', 'dashboard': '📊',
    'storage': '📦', 'warehouse': '🏪', 'container': '📦',
    'vehicle': '🚗', 'car': '🚗', 'truck': '🚚',
    'tool': '🔧', 'wrench': '🔧', 'hammer': '🔨',
    'heart': '❤️', 'blood': '🩸', 'organ': '🫀',
    'brain': '🧠', 'nerve': '🧬', 'cell': '🦠',
    'water': '💧', 'river': '🌊', 'flow': '🌊',
    'tree': '🌳', 'plant': '🌱', 'root': '🌿',
    'book': '📚', 'document': '📄', 'file': '📁',
  };
  
  const lowerMetaphor = metaphor.toLowerCase();
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lowerMetaphor.includes(keyword)) {
      return icon;
    }
  }
  
  return DEFAULT_ICONS[0];
}

function findMetaphorForConcept(conceptName: string, mentalAnchors: ParsedMentalAnchor[]): string {
  const lowerName = conceptName.toLowerCase();
  
  for (const anchor of mentalAnchors) {
    for (const mapping of anchor.mappings) {
      if (mapping.concept.toLowerCase().includes(lowerName) || 
          lowerName.includes(mapping.concept.toLowerCase())) {
        return mapping.metaphorElement;
      }
    }
  }
  
  return conceptName;
}

function getConceptIcon(conceptName: string, mentalAnchors: ParsedMentalAnchor[]): string {
  const metaphor = findMetaphorForConcept(conceptName, mentalAnchors);
  return extractIconFromMetaphor(metaphor);
}

function generateHookSentence(concept: ParsedConcept, metaphor: string): string {
  
  if (concept.provision.prerequisite) {
    return `${metaphor} - ${concept.name} provides the foundation for secure operations.`;
  }
  
  return `Every system needs a ${metaphor.toLowerCase()}. ${concept.name} makes it possible.`;
}

function extractPrerequisites(concept: ParsedConcept, allConcepts: ParsedConcept[]): string[] {
  const prereqText = concept.provision.prerequisite.toLowerCase();
  const prerequisites: string[] = [];
  
  for (const other of allConcepts) {
    if (other.id === concept.id) continue;
    
    const otherNameLower = other.name.toLowerCase();
    if (prereqText.includes(otherNameLower) || 
        prereqText.includes(other.id.replace(/-/g, ' '))) {
      prerequisites.push(other.id);
    }
  }
  
  return prerequisites;
}

function generateWhyYouNeed(concept: ParsedConcept): string {
  if (concept.criticalDistinctions.length > 0) {
    return concept.criticalDistinctions[0];
  }
  
  if (concept.designBoundaries.length > 0) {
    return concept.designBoundaries[0];
  }
  
  return `${concept.name} is essential for mastering this subject effectively.`;
}

function generateRealWorldExample(concept: ParsedConcept, metaphor: string): string {
  return `Just like ${metaphor.toLowerCase()}, ${concept.name} provides essential functionality in this domain.`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function transformToLearningStages(
  parsed: ParsedGeneratedContent
): LearningStage[] {
  const stages: LearningStage[] = [];
  
  if (parsed.learningPath.stages.length > 0) {
    for (const stage of parsed.learningPath.stages) {
      const stageId = `stage-${stage.order}-${slugify(stage.name)}`;
      const conceptIds = stage.concepts.map(c => slugify(c));
      
      const stageIcon = DEFAULT_STAGE_ICONS[stage.order - 1] || DEFAULT_STAGE_ICONS[0];
      const metaphorDesc = stage.capabilitiesGained || `Master the ${stage.name.toLowerCase()} concepts`;
      
      stages.push({
        id: stageId,
        order: stage.order,
        name: stage.name,
        metaphor: stage.name,
        metaphorDescription: metaphorDesc,
        icon: stageIcon,
        concepts: conceptIds,
        celebrationTitle: `${stage.name} Complete!`,
        celebrationMessage: stage.capabilitiesGained || `You've mastered the ${stage.name.toLowerCase()} concepts!`,
        narrativeBridge: stage.narrativeBridge,
      });
    }
  } else {
    stages.push({
      id: 'stage-1-foundation',
      order: 1,
      name: 'Foundation',
      metaphor: 'Foundation',
      metaphorDescription: 'Establish the core concepts.',
      icon: DEFAULT_STAGE_ICONS[0],
      concepts: parsed.concepts.slice(0, 8).map(c => c.id),
      celebrationTitle: 'Foundation Complete!',
      celebrationMessage: 'You\'ve mastered the foundational concepts!',
    });
  }
  
  return stages;
}

export function transformToLearningConcepts(
  parsed: ParsedGeneratedContent,
  stages: LearningStage[]
): LearningConcept[] {
  const concepts: LearningConcept[] = [];
  
  const lifecycleLabels = parsed.domainAnalysis.lifecycle;
  
  for (const parsedConcept of parsed.concepts) {
    const stage = stages.find(s => s.concepts.includes(parsedConcept.id)) || stages[0];
    const stageConceptIndex = stage?.concepts.indexOf(parsedConcept.id) ?? 0;
    
    const howToUse = parsedConcept.configure.slice(0, 3);
    if (howToUse.length === 0 && parsedConcept.provision.execution) {
      howToUse.push(parsedConcept.provision.execution);
    }
    
    const technicalDetails = [
      ...parsedConcept.criticalDistinctions,
      ...parsedConcept.designBoundaries,
      ...parsedConcept.examFocus,
    ].join(' ');
    
    const provisionSteps: string[] = [];
    if (parsedConcept.provision.prerequisite) {
      provisionSteps.push(`Prerequisite: ${parsedConcept.provision.prerequisite}`);
    }
    if (parsedConcept.provision.selection.length > 0) {
      provisionSteps.push(...parsedConcept.provision.selection);
    }
    if (parsedConcept.provision.execution) {
      provisionSteps.push(parsedConcept.provision.execution);
    }
    
    const monitorSteps: string[] = [];
    if (parsedConcept.monitor.tool) {
      monitorSteps.push(`Tool: ${parsedConcept.monitor.tool}`);
    }
    if (parsedConcept.monitor.metrics.length > 0) {
      monitorSteps.push(`Metrics: ${parsedConcept.monitor.metrics.join(', ')}`);
    }
    if (parsedConcept.monitor.thresholds) {
      monitorSteps.push(`Thresholds: ${parsedConcept.monitor.thresholds}`);
    }
    
    const lifecycle: ConceptLifecycle = {
      phase1: {
        title: lifecycleLabels.phase1 || 'PROVISION',
        steps: provisionSteps.length > 0 ? provisionSteps : ['Set up prerequisites', 'Select appropriate tier', 'Execute deployment'],
      },
      phase2: {
        title: lifecycleLabels.phase2 || 'CONFIGURE',
        steps: parsedConcept.configure.length > 0 ? parsedConcept.configure : ['Configure settings', 'Set up access', 'Apply policies'],
      },
      phase3: {
        title: lifecycleLabels.phase3 || 'MONITOR',
        steps: monitorSteps.length > 0 ? monitorSteps : ['Set up monitoring', 'Configure alerts', 'Review metrics'],
      },
    };
    
    const metaphor = findMetaphorForConcept(parsedConcept.name, parsed.mentalAnchors);
    const icon = getConceptIcon(parsedConcept.name, parsed.mentalAnchors);
    
    concepts.push({
      id: parsedConcept.id,
      stageId: stage?.id || 'stage-1-foundation',
      order: stageConceptIndex + 1,
      name: parsedConcept.name,
      icon,
      metaphor,
      hookSentence: generateHookSentence(parsedConcept, metaphor),
      whyYouNeed: generateWhyYouNeed(parsedConcept),
      realWorldExample: generateRealWorldExample(parsedConcept, metaphor),
      howToUse: howToUse.length > 0 ? howToUse : ['Review the concept details', 'Understand the lifecycle', 'Practice application'],
      technicalDetails: technicalDetails || `${parsedConcept.name} is a core concept in this domain.`,
      prerequisites: extractPrerequisites(parsedConcept, parsed.concepts),
      visualElement: slugify(parsedConcept.name),
      actionButtonText: `Master ${parsedConcept.name}`,
      lifecycle,
      logicalConnection: parsedConcept.logicalConnection,
    });
  }
  
  return concepts;
}

export function transformGeneratedContent(parsed: ParsedGeneratedContent): {
  stages: LearningStage[];
  concepts: LearningConcept[];
  metadata: {
    domain: string;
    role: string;
    source: string;
    conceptCount: number;
  };
} {
  const stages = transformToLearningStages(parsed);
  const concepts = transformToLearningConcepts(parsed, stages);
  
  return {
    stages,
    concepts,
    metadata: {
      domain: parsed.domainAnalysis.domain,
      role: parsed.domainAnalysis.professionalRole,
      source: parsed.domainAnalysis.sourceVerification,
      conceptCount: concepts.length,
    },
  };
}
