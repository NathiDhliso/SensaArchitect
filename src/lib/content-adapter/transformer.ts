import type { ParsedGeneratedContent, ParsedConcept } from './types';
import type { LearningStage, LearningConcept, ConceptLifecycle } from '@/lib/types/learning';

const STAGE_METAPHORS: Record<number, { metaphor: string; description: string; icon: string }> = {
  1: {
    metaphor: 'Building the Foundation',
    description: 'Every secure environment starts with identity. We\'ll establish who can access what.',
    icon: '🏢',
  },
  2: {
    metaphor: 'Security Checkpoint',
    description: 'Now that people can enter, let\'s add smart security systems to protect your resources.',
    icon: '🔐',
  },
  3: {
    metaphor: 'City Infrastructure',
    description: 'Time to build the roads and traffic systems that connect everything together.',
    icon: '🌐',
  },
  4: {
    metaphor: 'Factory Production',
    description: 'With infrastructure ready, let\'s add the workstations and storage that power your applications.',
    icon: '⚙️',
  },
  5: {
    metaphor: 'Control Room',
    description: 'Finally, let\'s add the monitoring systems to watch over everything you\'ve built.',
    icon: '📊',
  },
};

const CONCEPT_ICONS: Record<string, string> = {
  'identity': '🚪',
  'active directory': '🚪',
  'entra': '🚪',
  'users': '👥',
  'groups': '👥',
  'rbac': '🔑',
  'role': '🔑',
  'access control': '🔑',
  'policy': '📋',
  'resource group': '📁',
  'arm': '📝',
  'template': '📝',
  'management group': '🏛️',
  'subscription': '💳',
  'virtual network': '🏘️',
  'vnet': '🏘️',
  'subnet': '🏠',
  'nsg': '🚦',
  'security group': '🚦',
  'firewall': '🏰',
  'vpn': '🔒',
  'expressroute': '🛤️',
  'load balancer': '⚖️',
  'application gateway': '🚏',
  'virtual machine': '💻',
  'vm': '💻',
  'availability': '🛡️',
  'scale set': '📈',
  'storage': '📦',
  'blob': '🗄️',
  'files': '📂',
  'backup': '💾',
  'recovery': '🔄',
  'monitor': '📺',
  'log analytics': '🔎',
  'insights': '🔬',
  'alerts': '🚨',
  'container': '📦',
  'app service': '🚀',
  'key vault': '🔒',
  'managed identity': '🤖',
  'conditional access': '🔍',
  'pim': '⏰',
  'privileged': '⏰',
};

function getConceptIcon(conceptName: string): string {
  const lowerName = conceptName.toLowerCase();
  
  for (const [keyword, icon] of Object.entries(CONCEPT_ICONS)) {
    if (lowerName.includes(keyword)) {
      return icon;
    }
  }
  
  return '📌';
}

function generateMetaphor(conceptName: string): string {
  const lowerName = conceptName.toLowerCase();
  
  const metaphors: Record<string, string> = {
    'active directory': 'The Front Door',
    'entra': 'The Front Door',
    'users': 'Employee Badges',
    'groups': 'Department Teams',
    'rbac': 'The Key System',
    'role': 'Access Keys',
    'policy': 'Building Codes',
    'resource group': 'Project Folders',
    'arm template': 'Blueprint Documents',
    'management group': 'Corporate Hierarchy',
    'subscription': 'Department Budgets',
    'virtual network': 'Neighborhood Districts',
    'vnet': 'Neighborhood Districts',
    'subnet': 'City Blocks',
    'nsg': 'Traffic Lights',
    'security group': 'Traffic Lights',
    'firewall': 'Central Control Tower',
    'vpn': 'Secure Tunnel',
    'expressroute': 'Private Highway',
    'load balancer': 'Traffic Distributor',
    'application gateway': 'Smart Postal Service',
    'virtual machine': 'Workstations',
    'vm': 'Workstations',
    'availability set': 'Backup Stations',
    'availability zone': 'Separate Buildings',
    'scale set': 'Modular Production Lines',
    'storage account': 'Warehouse System',
    'blob': 'Raw Materials Bins',
    'files': 'Shared Tool Cabinets',
    'backup': 'Nightly Snapshots',
    'recovery': 'Emergency Site',
    'monitor': 'Central Monitoring Station',
    'log analytics': 'Investigation Center',
    'insights': 'Quality Lab',
    'alerts': 'Alarm System',
    'container': 'Shipping Containers',
    'app service': 'Managed Assembly Line',
    'key vault': 'Safe Deposit Boxes',
    'managed identity': 'Robot Employees',
    'conditional access': 'Smart Security Scanner',
    'pim': 'Time-Locked Elevator',
    'privileged': 'Executive Access',
  };
  
  for (const [keyword, metaphor] of Object.entries(metaphors)) {
    if (lowerName.includes(keyword)) {
      return metaphor;
    }
  }
  
  return 'Essential Component';
}

function generateHookSentence(concept: ParsedConcept): string {
  const metaphor = generateMetaphor(concept.name);
  
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
  
  return `${concept.name} is essential for managing your Azure environment effectively.`;
}

function generateRealWorldExample(concept: ParsedConcept): string {
  const metaphor = generateMetaphor(concept.name);
  return `Just like a ${metaphor.toLowerCase()} in a real building, ${concept.name} provides structure and control to your cloud environment.`;
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
      const stageMetadata = STAGE_METAPHORS[stage.order] || STAGE_METAPHORS[1];
      
      const conceptIds = stage.concepts.map(c => slugify(c));
      
      stages.push({
        id: stageId,
        order: stage.order,
        name: stage.name,
        metaphor: stageMetadata.metaphor,
        metaphorDescription: stageMetadata.description,
        icon: stageMetadata.icon,
        concepts: conceptIds,
        celebrationTitle: `${stage.name} Complete!`,
        celebrationMessage: stage.capabilitiesGained || `You've mastered the ${stage.name.toLowerCase()} concepts!`,
      });
    }
  } else {
    stages.push({
      id: 'stage-1-foundation',
      order: 1,
      name: 'Foundation',
      metaphor: 'Building the Foundation',
      metaphorDescription: 'Establish the core identity and organization structure.',
      icon: '🏢',
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
    
    concepts.push({
      id: parsedConcept.id,
      stageId: stage?.id || 'stage-1-foundation',
      order: stageConceptIndex + 1,
      name: parsedConcept.name,
      icon: getConceptIcon(parsedConcept.name),
      metaphor: generateMetaphor(parsedConcept.name),
      hookSentence: generateHookSentence(parsedConcept),
      whyYouNeed: generateWhyYouNeed(parsedConcept),
      realWorldExample: generateRealWorldExample(parsedConcept),
      howToUse: howToUse.length > 0 ? howToUse : ['Configure in Azure Portal', 'Set up access controls', 'Monitor and maintain'],
      technicalDetails: technicalDetails || `${parsedConcept.name} is a core Azure service for administrators.`,
      prerequisites: extractPrerequisites(parsedConcept, parsed.concepts),
      visualElement: slugify(parsedConcept.name),
      actionButtonText: `Set up ${parsedConcept.name}`,
      lifecycle,
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
