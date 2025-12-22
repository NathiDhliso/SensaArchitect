import type { GenerationResult } from '@/lib/types';

export function generateMarkdown(result: GenerationResult): string {
  const { pass1, validation, metadata, fullDocument } = result;

  return `# Visual Master Chart: ${metadata.subject}

> Generated: ${new Date(metadata.generatedAt).toLocaleString()}

## Domain Analysis

| Property | Value |
|----------|-------|
| Domain | ${pass1.domain} |
| Role Scope | ${pass1.roleScope} |
| Lifecycle | ${pass1.lifecycle.phase1} → ${pass1.lifecycle.phase2} → ${pass1.lifecycle.phase3} |
| Source | ${pass1.sourceVerification} |

### Recent Updates
${pass1.recentUpdates.map((u) => `- ${u}`).join('\n')}

### Numerical Limits
${pass1.numericalLimits.map((l) => `- ${l}`).join('\n')}

### Core Concepts
${pass1.concepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Quality Metrics

| Metric | Score |
|--------|-------|
| Lifecycle Consistency | ${validation.lifecycleConsistency}% |
| Positive Framing | ${validation.positiveFraming}% |
| Format Consistency | ${validation.formatConsistency}% |
| Completeness | ${validation.completeness}% |

## Full Content

\`\`\`
${fullDocument}
\`\`\`
`;
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
