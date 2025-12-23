import { SYSTEM_PROMPT_V4 } from '@/lib/system-prompt';
import {
  getBedrockClient,
  invokeClaudeModel,
  invokeClaudeModelStream,
  parseJsonFromResponse,
  type BedrockConfig,
} from './claude-client';
import {
  applyFixes,
  assembleFinalDocument,
} from './validation';
import {
  createLifecycleAnalysisPrompt,
  parseLifecycleResponse,
  createLifecycleScopePrompt,
  getDefaultLifecycle,
} from './dynamic-lifecycle';
import type { Pass1Result, ProgressCallback, GenerationResult, ValidationResult, DynamicLifecycle } from '@/lib/types';

export async function generateChartIteratively(
  subject: string,
  config: BedrockConfig,
  onProgress: ProgressCallback
): Promise<GenerationResult> {
  const bedrockClient = getBedrockClient(config);

  onProgress(1, 'in-progress', { message: 'Analyzing subject and generating optimal lifecycle...' });

  const lifecyclePrompt = createLifecycleAnalysisPrompt(subject);
  const lifecycleText = await invokeClaudeModel(
    bedrockClient,
    [{ role: 'user', content: lifecyclePrompt }],
    'You are an expert curriculum designer. Analyze subjects and determine the optimal operational lifecycle.',
    2000
  );

  let dynamicLifecycle: DynamicLifecycle | null = parseLifecycleResponse(lifecycleText);
  if (!dynamicLifecycle) {
    dynamicLifecycle = getDefaultLifecycle(subject);
  }

  onProgress(1, 'in-progress', { 
    message: `Lifecycle detected: ${dynamicLifecycle.phase1} → ${dynamicLifecycle.phase2} → ${dynamicLifecycle.phase3}`,
    lifecycle: {
      phase1: dynamicLifecycle.phase1,
      phase2: dynamicLifecycle.phase2,
      phase3: dynamicLifecycle.phase3,
    },
    roleScope: dynamicLifecycle.roleScope,
  });

  const pass1Content = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASS 1 TASK: Execute ONLY STEP 1 (Live Verification) and Concept Extraction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subject: "${subject}"

PRE-DETERMINED LIFECYCLE (USE EXACTLY):
Domain: ${dynamicLifecycle.domain}
Role: ${dynamicLifecycle.roleScope}
Phase 1: ${dynamicLifecycle.phase1} - ${dynamicLifecycle.phase1Description}
Phase 2: ${dynamicLifecycle.phase2} - ${dynamicLifecycle.phase2Description}
Phase 3: ${dynamicLifecycle.phase3} - ${dynamicLifecycle.phase3Description}

INSTRUCTIONS:
1. Browse the web for the most recent official syllabus/standard
2. Extract 3 specific recent updates (last 12 months)
3. Identify numerical limits/thresholds
4. Extract ALL core concepts from the official syllabus

OUTPUT FORMAT (JSON ONLY):
{
  "sourceVerification": "Name of official source found",
  "recentUpdates": ["Update 1", "Update 2", "Update 3"],
  "numericalLimits": ["Limit 1 with value", "Limit 2 with value"] OR ["None found - marked for verification"],
  "domain": "${dynamicLifecycle.domain}",
  "lifecycle": {
    "phase1": "${dynamicLifecycle.phase1}",
    "phase2": "${dynamicLifecycle.phase2}",
    "phase3": "${dynamicLifecycle.phase3}"
  },
  "roleScope": "${dynamicLifecycle.roleScope}",
  "excludedActions": ${JSON.stringify(dynamicLifecycle.excludedActions)},
  "concepts": ["Concept 1", "Concept 2", ...] (Identify ALL core concepts - typically 15-35),
  "lifecycleJustification": "${dynamicLifecycle.justification}"
}

CRITICAL: Use the EXACT lifecycle phases provided above. Do NOT modify them.
  `;

  const pass1Text = await invokeClaudeModel(
    bedrockClient,
    [{ role: 'user', content: pass1Content }],
    SYSTEM_PROMPT_V4,
    8000
  );

  let pass1Data = parseJsonFromResponse<Pass1Result>(pass1Text);
  
  pass1Data.lifecycle = {
    phase1: dynamicLifecycle.phase1,
    phase2: dynamicLifecycle.phase2,
    phase3: dynamicLifecycle.phase3,
  };
  pass1Data.roleScope = dynamicLifecycle.roleScope;
  pass1Data.domain = dynamicLifecycle.domain;
  pass1Data.excludedActions = dynamicLifecycle.excludedActions;
  pass1Data.lifecycleJustification = dynamicLifecycle.justification;

  onProgress(1, 'complete', pass1Data);

  onProgress(2, 'in-progress', { message: 'Building concept dependencies...' });

  const pass2Content = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASS 2 TASK: Execute ONLY Steps 2.5, 3.5, and 6 from the System Prompt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT re-run Step 1 (Live Verification). Use the verified data below.

VERIFIED DATA FROM PASS 1:
${JSON.stringify(pass1Data, null, 2)}

EXACT CONCEPTS TO USE (DO NOT MODIFY):
${pass1Data.concepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

TASKS FOR THIS PASS:
1. STEP 2.5: Create Concept Dependency Graph showing how these ${pass1Data.concepts.length} concepts build upon each other
2. STEP 3.5: Create 2-3 Decision Framework Trees for common "When do I use X vs Y?" questions
3. STEP 6: Create Mental Map Summary Diagram showing all concepts as connected nodes

LIFECYCLE TO USE:
${pass1Data.lifecycle.phase1} → ${pass1Data.lifecycle.phase2} → ${pass1Data.lifecycle.phase3}

ROLE SCOPE: ${pass1Data.roleScope}
EXCLUDED ACTIONS: ${pass1Data.excludedActions.join(', ')}

POSITIVE FRAMING REQUIRED:
- Use "enables", "extends", "builds upon", "connects to"
- NO "requires", "depends on", "cannot work without"

OUTPUT: Generate only the three structures listed above. No chart content yet.
  `;

  const lifecycleScopePrompt = createLifecycleScopePrompt(dynamicLifecycle, subject);

  const pass2Text = await invokeClaudeModel(
    bedrockClient,
    [{ role: 'user', content: pass2Content }],
    SYSTEM_PROMPT_V4 + '\n\n' + lifecycleScopePrompt,
    6000
  );

  onProgress(2, 'complete', { content: pass2Text });

  onProgress(3, 'in-progress', { message: 'Creating detailed content (batch generation)...' });

  const totalConcepts = pass1Data.concepts.length;
  const batchSize = 10;
  const batches = Math.ceil(totalConcepts / batchSize);
  let allConceptsContent = '';

  const basePromptInfo = `
FOUNDATION DATA (DO NOT MODIFY):
Domain: ${pass1Data.domain}
Role Scope: ${pass1Data.roleScope}
Lifecycle: ${pass1Data.lifecycle.phase1} → ${pass1Data.lifecycle.phase2} → ${pass1Data.lifecycle.phase3}
Source: ${pass1Data.sourceVerification}

DETAIL REQUIREMENTS FOR EACH CONCEPT:

${pass1Data.lifecycle.phase1} (Foundation Phase):
  - Prerequisite: State what must exist first, or write "[None]"
  - Selection: List 2-3 specific options/types with their key capabilities
  - Execution: Name the EXACT tool/command/portal/form to use

${pass1Data.lifecycle.phase2} (Configuration Phase):
  • Provide 5-8 configuration items per concept
  • Include SPECIFIC commands, settings, or procedures
  • Add **[Critical Distinction]:** for key comparisons
  • Add **[Design Boundary]:** for limitations (positively framed)
  • Add **[Prerequisite Check]:** for requirements (positively framed)
  • Add **[Exam Focus]:** for tested concepts

${pass1Data.lifecycle.phase3} (Verification Phase):
  ○ Name the EXACT tool/document
  ○ Specify metrics to monitor
  ○ Include deadlines or thresholds

QUALITY: Each concept = 15-25 lines with specific commands, portal paths, and callouts.
`;

  for (let batch = 0; batch < batches; batch++) {
    const startIdx = batch * batchSize;
    const endIdx = Math.min(startIdx + batchSize, totalConcepts);
    const batchConcepts = pass1Data.concepts.slice(startIdx, endIdx);
    
    onProgress(3, 'in-progress', { 
      message: `Generating concepts ${startIdx + 1}-${endIdx} of ${totalConcepts}...`,
      progress: Math.round((batch / batches) * 100)
    });

    const batchPrompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH ${batch + 1}/${batches}: Generate concepts ${startIdx + 1}-${endIdx}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${basePromptInfo}

CONCEPTS TO GENERATE IN THIS BATCH:
${batchConcepts.map((c, i) => `${startIdx + i + 1}. ${c}`).join('\n')}

OUTPUT FORMAT:
\`\`\`
## ${startIdx + 1}. ${batchConcepts[0]}
- ${pass1Data.lifecycle.phase1}:
  [detailed content]
• ${pass1Data.lifecycle.phase2}:
  [detailed content with callouts]
○ ${pass1Data.lifecycle.phase3}:
  [monitoring details]

[Continue for each concept in this batch]
\`\`\`

CRITICAL: Generate ALL ${batchConcepts.length} concepts completely. No skipping. No asking to continue.
`;

    let batchText = '';
    const batchStream = invokeClaudeModelStream(
      bedrockClient,
      [{ role: 'user', content: batchPrompt }],
      lifecycleScopePrompt + '\nYou are an automated content generator. Output content only. No questions. No conversational phrases.',
      32000
    );

    for await (const chunk of batchStream) {
      batchText += chunk;
      onProgress(3, 'in-progress', {
        partial: allConceptsContent + batchText,
        progress: Math.round(((batch + 0.5) / batches) * 100),
      });
    }

    allConceptsContent += batchText + '\n\n';
  }

  onProgress(3, 'in-progress', { message: 'Generating mental anchors and learning path...' });

  const supplementaryPrompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate Steps 4, 5, and 7 for: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Domain: ${pass1Data.domain}
Role Scope: ${pass1Data.roleScope}
Lifecycle: ${pass1Data.lifecycle.phase1} → ${pass1Data.lifecycle.phase2} → ${pass1Data.lifecycle.phase3}

Concepts covered: ${pass1Data.concepts.join(', ')}

GENERATE:

## STEP 4: VISUAL MENTAL ANCHORS
Create 3 vivid mental anchors with:
- Concrete physical metaphors (buildings, vehicles, nature)
- Map 3-4 technical concepts to physical elements
- "Why It Helps" section with positive framing

## STEP 5: WORKED EXAMPLE
- Student Question: Realistic troubleshooting scenario
- Chart Navigation: Which concepts to consult
- The Diagnosis: What the chart reveals
- The Solution: Concrete action items
- Learning Point: How the lifecycle structure helped

## STEP 7: LEARNING PATH SEQUENCE
Create 4-5 progressive stages:
- Stage name and concepts included
- "Capabilities Gained" after each stage
- Use positive language: "enables", "unlocks", "extends"

OUTPUT ALL THREE SECTIONS NOW:
`;

  let supplementaryText = '';
  const suppStream = invokeClaudeModelStream(
    bedrockClient,
    [{ role: 'user', content: supplementaryPrompt }],
    'You are an automated content generator. Output content only. No questions.',
    16000
  );

  for await (const chunk of suppStream) {
    supplementaryText += chunk;
  }

  let pass3Text = `## STEP 3: MASTER HIERARCHICAL CHART

${allConceptsContent}

${supplementaryText}`;

  pass3Text = pass3Text
    .replace(/\[Continue with.*?\]/gi, '')
    .replace(/\[.*?truncated.*?\]/gi, '')
    .replace(/\[Additional concepts follow.*?\]/gi, '')
    .replace(/\[.*?same.*?pattern.*?\]/gi, '')
    .replace(/Note: I can provide.*?$/s, '')
    .replace(/Would you like me to.*?$/s, '')
    .replace(/I apologize.*?$/s, '')
    .replace(/I'll execute.*?framing.*?\./gi, '')
    .replace(/I'll create.*?\./gi, '')
    .replace(/Let me.*?\./gi, '')
    .trim();

  onProgress(3, 'complete', { content: pass3Text });

  onProgress(4, 'in-progress', { message: 'Running quality checks...' });

  const pass4Content = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASS 4 TASK: Validate Generated Content Against Standards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPECTED STRUCTURE FROM PASS 1:
Domain: ${pass1Data.domain}
Lifecycle: ${pass1Data.lifecycle.phase1} → ${pass1Data.lifecycle.phase2} → ${pass1Data.lifecycle.phase3}
Role Scope: ${pass1Data.roleScope}
Excluded Actions: ${pass1Data.excludedActions.join(', ')}
Expected Concept Count: ${pass1Data.concepts.length}

CONTENT TO VALIDATE:
${pass3Text}

OUTPUT FORMAT (JSON ONLY):
{
  "valid": true | false,
  "conceptCount": { "expected": ${pass1Data.concepts.length}, "found": number },
  "lifecycleConsistency": number (0-100),
  "positiveFraming": number (0-100),
  "formatConsistency": number (0-100),
  "completeness": number (0-100),
  "issues": [],
  "violations": {
    "outOfScope": [],
    "negativeFraming": []
  },
  "fixes": {}
}
  `;

  const validationText = await invokeClaudeModel(
    bedrockClient,
    [{ role: 'user', content: pass4Content }],
    `You are a quality assurance validator for educational content.`,
    4000
  );

  const validation = parseJsonFromResponse<ValidationResult>(validationText);
  onProgress(4, 'complete', validation);

  let finalContent = pass3Text;
  if (validation.fixes && Object.keys(validation.fixes).length > 0) {
    onProgress(4, 'fixing', {
      message: `Auto-correcting ${Object.keys(validation.fixes).length} issues...`,
    });
    finalContent = applyFixes(pass3Text, validation.fixes);
  }

  const fullDocument = assembleFinalDocument(pass1Data, pass2Text, finalContent);

  return {
    pass1: pass1Data,
    pass2: pass2Text,
    pass3: finalContent,
    validation,
    fullDocument,
    metadata: {
      subject,
      generatedAt: new Date().toISOString(),
      qualityMetrics: {
        lifecycleConsistency: validation.lifecycleConsistency,
        positiveFraming: validation.positiveFraming,
        formatConsistency: validation.formatConsistency,
        completeness: validation.completeness,
      },
    },
  };
}
