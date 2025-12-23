import type {
  ParsedGeneratedContent,
  ParsedDomainAnalysis,
  ParsedConcept,
  ParsedLearningPath,
  ParsedMentalAnchor,
  ParsedStage,
  ParsedAcronym,
} from './types';

export type ParseResult = 
  | { success: true; data: ParsedGeneratedContent }
  | { success: false; error: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractSection(content: string, startMarker: string, endMarker?: string): string {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const startPos = startIndex + startMarker.length;
  
  if (endMarker) {
    const endIndex = content.indexOf(endMarker, startPos);
    if (endIndex === -1) return content.slice(startPos).trim();
    return content.slice(startPos, endIndex).trim();
  }
  
  return content.slice(startPos).trim();
}

function parseDomainAnalysis(content: string): ParsedDomainAnalysis {
  const domainSection = extractSection(content, 'DOMAIN ANALYSIS', 'DECISION FRAMEWORK');
  
  const domainMatch = domainSection.match(/Domain:\s*(.+)/i);
  const roleMatch = domainSection.match(/Professional Role:\s*(.+)/i);
  const lifecycleMatch = domainSection.match(/Lifecycle:\s*(\w+)\s*→\s*(\w+)\s*→\s*(\w+)/i);
  const sourceMatch = domainSection.match(/Source Verification:\s*(.+)/i);
  const conceptCountMatch = domainSection.match(/Core Concepts Identified:\s*(\d+)/i);
  
  const recentUpdates: string[] = [];
  const updatesMatch = domainSection.match(/Recent Updates:([\s\S]*?)(?=Numerical Limits:|Core Concepts|$)/i);
  if (updatesMatch) {
    const updates = updatesMatch[1].match(/•\s*(.+)/g);
    if (updates) {
      updates.forEach(u => recentUpdates.push(u.replace(/•\s*/, '').trim()));
    }
  }
  
  const numericalLimits: string[] = [];
  const limitsMatch = domainSection.match(/Numerical Limits:([\s\S]*?)(?=Core Concepts|$)/i);
  if (limitsMatch) {
    const limits = limitsMatch[1].match(/•\s*(.+)/g);
    if (limits) {
      limits.forEach(l => numericalLimits.push(l.replace(/•\s*/, '').trim()));
    }
  }
  
  const conceptNames: string[] = [];
  const conceptsListMatch = domainSection.match(/Core Concepts Identified:\s*\d+[\s\S]*?((?:\d+\.\s+.+\n?)+)/i);
  if (conceptsListMatch) {
    const conceptLines = conceptsListMatch[1].match(/\d+\.\s+(.+)/g);
    if (conceptLines) {
      conceptLines.forEach(c => {
        const name = c.replace(/^\d+\.\s+/, '').trim();
        conceptNames.push(name);
      });
    }
  }
  
  return {
    domain: domainMatch?.[1]?.trim() || 'Unknown',
    professionalRole: roleMatch?.[1]?.trim() || 'Unknown',
    lifecycle: {
      phase1: lifecycleMatch?.[1] || 'PROVISION',
      phase2: lifecycleMatch?.[2] || 'CONFIGURE',
      phase3: lifecycleMatch?.[3] || 'MONITOR',
    },
    sourceVerification: sourceMatch?.[1]?.trim() || '',
    recentUpdates,
    numericalLimits,
    coreConceptsCount: parseInt(conceptCountMatch?.[1] || '0', 10),
    conceptNames,
  };
}


function parseConceptBlock(block: string, order: number, stageId: string): ParsedConcept | null {
  const nameMatch = block.match(/^##\s*\d+\.\s*(.+)/m);
  if (!nameMatch) return null;
  
  const name = nameMatch[1].trim();
  const id = slugify(name);
  
  const provisionSection = extractSection(block, '- PROVISION:', '• CONFIGURE:');
  const configureSection = extractSection(block, '• CONFIGURE:', '○ MONITOR:');
  const monitorSection = extractSection(block, '○ MONITOR:', '##');
  
  const prereqMatch = provisionSection.match(/Prerequisite:\s*(.+?)(?=Selection:|Execution:|$)/is);
  const selectionMatch = provisionSection.match(/Selection:([\s\S]*?)(?=Execution:|$)/i);
  const executionMatch = provisionSection.match(/Execution:\s*(.+?)$/is);
  
  const selectionItems: string[] = [];
  if (selectionMatch) {
    const items = selectionMatch[1].match(/[•*]\s*(.+)/g);
    if (items) {
      items.forEach(item => selectionItems.push(item.replace(/^[•*]\s*/, '').trim()));
    }
  }
  
  const configureItems: string[] = [];
  const configLines = configureSection.match(/[•*]\s*\*\*(.+?)\*\*:?\s*(.+?)(?=\n|$)/g);
  if (configLines) {
    configLines.forEach(line => {
      const cleaned = line.replace(/^[•*]\s*/, '').replace(/\*\*/g, '').trim();
      configureItems.push(cleaned);
    });
  }
  
  const criticalDistinctions: string[] = [];
  const criticalMatches = block.matchAll(/\*\*\[Critical Distinction\]:\*\*\s*(.+?)(?=\n|$)/gi);
  for (const match of criticalMatches) {
    criticalDistinctions.push(match[1].trim());
  }
  
  const designBoundaries: string[] = [];
  const boundaryMatches = block.matchAll(/\*\*\[Design Boundary\]:\*\*\s*(.+?)(?=\n|$)/gi);
  for (const match of boundaryMatches) {
    designBoundaries.push(match[1].trim());
  }
  
  const examFocus: string[] = [];
  const examMatches = block.matchAll(/\*\*\[Exam Focus\]:\*\*\s*(.+?)(?=\n|$)/gi);
  for (const match of examMatches) {
    examFocus.push(match[1].trim());
  }
  
  const logicalConnectionMatch = block.match(/\*\*\[Logical Connection\]:\*\*\s*(.+?)(?=\n|$)/i);
  
  const toolMatch = monitorSection.match(/Tool:\s*(.+?)(?=\n|Metrics:|$)/i);
  const metricsMatch = monitorSection.match(/Metrics:\s*(.+?)(?=\n|Threshold|$)/i);
  const thresholdMatch = monitorSection.match(/Threshold[s]?:\s*(.+?)$/is);
  
  const metrics: string[] = [];
  if (metricsMatch) {
    metricsMatch[1].split(',').forEach(m => metrics.push(m.trim()));
  }
  
  return {
    id,
    name,
    order,
    stageId,
    logicalConnection: logicalConnectionMatch?.[1]?.trim(),
    provision: {
      prerequisite: prereqMatch?.[1]?.trim() || '',
      selection: selectionItems,
      execution: executionMatch?.[1]?.trim() || '',
    },
    configure: configureItems,
    monitor: {
      tool: toolMatch?.[1]?.trim() || '',
      metrics,
      thresholds: thresholdMatch?.[1]?.trim() || '',
    },
    criticalDistinctions,
    designBoundaries,
    examFocus,
  };
}

function parseConcepts(content: string): ParsedConcept[] {
  const chartSection = extractSection(content, 'MASTER HIERARCHICAL CHART', 'VISUAL MENTAL ANCHORS');
  
  const conceptBlocks = chartSection.split(/(?=^##\s*\d+\.)/m).filter(b => b.trim());
  
  const concepts: ParsedConcept[] = [];
  let order = 1;
  
  for (const block of conceptBlocks) {
    const concept = parseConceptBlock(block, order, 'stage-1');
    if (concept) {
      concepts.push(concept);
      order++;
    }
  }
  
  return concepts;
}

function parseLearningPath(content: string): ParsedLearningPath {
  const pathSection = extractSection(content, 'LEARNING PATH SEQUENCE', '');
  
  const stages: ParsedLearningPath['stages'] = [];
  
  const stageMatches = pathSection.matchAll(/###\s*Stage\s*(\d+):\s*(.+?)(?=\n)/gi);
  
  for (const match of stageMatches) {
    const stageOrder = parseInt(match[1], 10);
    const stageName = match[2].trim();
    
    const stageStart = pathSection.indexOf(match[0]);
    const nextStageMatch = pathSection.slice(stageStart + match[0].length).match(/###\s*Stage\s*\d+/);
    const stageEnd = nextStageMatch 
      ? stageStart + match[0].length + pathSection.slice(stageStart + match[0].length).indexOf(nextStageMatch[0])
      : pathSection.length;
    
    const stageContent = pathSection.slice(stageStart, stageEnd);
    
    const conceptsMatch = stageContent.match(/\*\*Concepts:\*\*\s*(.+?)(?=\n\n|\*\*Capabilities|\*\*Narrative)/is);
    const capabilitiesMatch = stageContent.match(/\*\*Capabilities Gained:\*\*\s*([\s\S]+?)(?=\*\*Narrative|###|$)/i);
    const narrativeBridgeMatch = stageContent.match(/\*\*Narrative Handshake:\*\*\s*([\s\S]+?)(?=###|$)/i);
    
    const conceptNames: string[] = [];
    if (conceptsMatch) {
      conceptsMatch[1].split(',').forEach(c => {
        const name = c.replace(/[()]/g, '').trim();
        if (name) conceptNames.push(name);
      });
    }
    
    stages.push({
      order: stageOrder,
      name: stageName,
      concepts: conceptNames,
      capabilitiesGained: capabilitiesMatch?.[1]?.trim() || '',
      narrativeBridge: narrativeBridgeMatch?.[1]?.trim(),
    });
  }
  
  if (stages.length === 0) {
    stages.push(
      { order: 1, name: 'Foundation', concepts: [], capabilitiesGained: 'Core understanding established' }
    );
  }
  
  return { stages };
}

function parseMentalAnchors(content: string): ParsedMentalAnchor[] {
  const anchorsSection = extractSection(content, 'VISUAL MENTAL ANCHORS', 'WORKED EXAMPLE');
  
  const anchors: ParsedMentalAnchor[] = [];
  
  const anchorMatches = anchorsSection.matchAll(/###\s*Anchor\s*\d+:\s*(.+?)(?=\n)/gi);
  
  for (const match of anchorMatches) {
    const anchorName = match[1].trim();
    
    const anchorStart = anchorsSection.indexOf(match[0]);
    const nextAnchorMatch = anchorsSection.slice(anchorStart + match[0].length).match(/###\s*Anchor\s*\d+/);
    const anchorEnd = nextAnchorMatch
      ? anchorStart + match[0].length + anchorsSection.slice(anchorStart + match[0].length).indexOf(nextAnchorMatch[0])
      : anchorsSection.length;
    
    const anchorContent = anchorsSection.slice(anchorStart, anchorEnd);
    
    const metaphorMatch = anchorContent.match(/(?:Imagine|Picture|Visualize)\s+(.+?)(?=\.\s+[A-Z]|\*\*Why|\*\*Memory)/is);
    const whyMatch = anchorContent.match(/\*\*Why It Helps[^*]*:\*\*\s*([\s\S]+?)(?=###|\*\*Memory|$)/i);
    
    let acronym: ParsedAcronym | undefined;
    const acronymMatch = anchorContent.match(/\*\*\[?([A-Z]{2,10})\]?:\*\*\s*([^-\n]+)\s*-\s*["']?([^"'\n]+)["']?/i);
    if (acronymMatch) {
      acronym = {
        acronym: acronymMatch[1].trim(),
        expansion: acronymMatch[2].trim(),
        mnemonic: acronymMatch[3].trim(),
      };
    }
    
    const mappings: { concept: string; metaphorElement: string }[] = [];
    const mappingMatches = anchorContent.matchAll(/([A-Za-z][A-Za-z\s&-]{2,40})\s+(?:is|are|acts? as|functions? as|serves? as|represents?|like)\s+(?:the\s+)?(?:\*\*)?([^*\n.]{3,60})(?:\*\*)?/gi);
    
    for (const mapping of mappingMatches) {
      const concept = mapping[1].trim();
      const element = mapping[2].trim();
      if (concept.length > 2 && element.length > 2 && !concept.toLowerCase().startsWith('this')) {
        mappings.push({ concept, metaphorElement: element });
      }
    }
    
    anchors.push({
      name: anchorName,
      metaphor: metaphorMatch?.[1]?.trim() || '',
      mappings,
      whyItHelps: whyMatch?.[1]?.trim() || '',
      acronym,
    });
  }
  
  return anchors;
}

export function parseGeneratedContent(rawContent: string): ParseResult {
  try {
    if (!rawContent || rawContent.trim().length === 0) {
      return {
        success: false,
        error: 'Empty content received - please regenerate',
      };
    }
    const domainAnalysis = parseDomainAnalysis(rawContent);
    
    if (!domainAnalysis.domain || domainAnalysis.domain.trim().length === 0) {
      return {
        success: false,
        error: 'Domain analysis incomplete - regeneration recommended',
      };
    }
    
    if (!domainAnalysis.lifecycle.phase1) {
      return {
        success: false,
        error: 'Lifecycle information missing - regeneration recommended',
      };
    }
    
    const concepts = parseConcepts(rawContent);
    
    if (concepts.length === 0) {
      return {
        success: false,
        error: 'No concepts detected - check content format or regenerate',
      };
    }
    
    const learningPath = parseLearningPath(rawContent);
    const mentalAnchors = parseMentalAnchors(rawContent);
    
    return {
      success: true,
      data: {
        domainAnalysis,
        concepts,
        learningPath,
        mentalAnchors,
        rawContent,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parsing failed - please regenerate',
    };
  }
}

export function extractStagesFromLearningPath(learningPath: ParsedLearningPath): ParsedStage[] {
  return learningPath.stages.map(stage => ({
    id: `stage-${stage.order}-${slugify(stage.name)}`,
    order: stage.order,
    name: stage.name,
    concepts: stage.concepts.map(c => slugify(c)),
  }));
}
