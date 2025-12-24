import { describe, it, expect } from 'vitest';
import { parseGeneratedContent } from './parser';

describe('parseGeneratedContent', () => {
    it('should parse content with PREPARE/MODEL/DELIVER lifecycle (PL-300 format)', () => {
        const content = `
================================================================================
VISUAL MASTER CHART: PL-300 Test
================================================================================

DOMAIN ANALYSIS
---------------
Domain: Business Intelligence & Data Analytics
Professional Role: Power BI Data Analyst
Lifecycle: PREPARE → MODEL → DELIVER

Source Verification: Microsoft Learn

Core Concepts Identified: 2
  1. Power BI Service
  2. DAX Measures

================================================================================
MASTER HIERARCHICAL CHART
================================================================================

## 1. Power BI Service

- PREPARE:
  • Prerequisite: Power BI Pro license required for workspaces
  • Selection: Choose between Workspace vs My Workspace based on collaboration needs
  • Execution: Navigate to app.powerbi.com and create new workspace

• MODEL:
  • Workspace Access Role: Admin has full control
  • **[Critical Distinction]:** Workspace supports collaboration vs My Workspace is personal only
  • **[Design Boundary]:** Maximum 1000 workspaces per tenant

○ DELIVER:
  • Tool: Power BI Service Admin Portal
  • Metric: Check workspace capacity utilization < 80%
  • Validation: Confirm deployment pipeline shows correct stage

## 2. DAX Measures

- PREPARE:
  • Prerequisite: Data model with at least one fact table
  • Selection: Choose between Measure vs Calculated Column based on requirements
  • Execution: Home tab > New Measure > Enter DAX formula

• MODEL:
  • Measure Syntax: Total Sales = SUM(Sales[Amount])
  • **[Critical Distinction]:** Measures evaluate at query time vs Calculated Columns at refresh
  • **[Exam Focus]:** Understand filter context propagation

○ DELIVER:
  • Tool: Performance Analyzer to measure query duration
  • Metric: DAX query time should be < 120ms
  • Validation: Test measure in different filter contexts

================================================================================
VISUAL MENTAL ANCHORS
================================================================================

### Anchor 1: Power BI as a Control Tower
Imagine an airport control tower managing data traffic.

**Why It Helps:** Makes abstract data concepts tangible.

================================================================================
LEARNING PATH SEQUENCE
================================================================================

### Stage 1: Foundation
**Concepts:** Power BI Service, DAX Measures
**Capabilities Gained:** Basic understanding of Power BI components
`;

        const result = parseGeneratedContent(content);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.domainAnalysis.lifecycle.phase1).toBe('PREPARE');
            expect(result.data.domainAnalysis.lifecycle.phase2).toBe('MODEL');
            expect(result.data.domainAnalysis.lifecycle.phase3).toBe('DELIVER');
            expect(result.data.concepts.length).toBe(2);
            expect(result.data.concepts[0].name).toBe('Power BI Service');
            expect(result.data.concepts[0].phase1.prerequisite).toContain('Power BI Pro license');
            expect(result.data.concepts[0].phase2.length).toBeGreaterThan(0);
            expect(result.data.concepts[0].phase3.tool).toContain('Power BI Service Admin Portal');
        }
    });

    it('should parse content with classic PROVISION/CONFIGURE/MONITOR lifecycle (backward compatibility)', () => {
        const content = `
DOMAIN ANALYSIS
---------------
Domain: IT/Cloud
Professional Role: Cloud Architect
Lifecycle: PROVISION → CONFIGURE → MONITOR

Core Concepts Identified: 1
  1. Virtual Machines

================================================================================
MASTER HIERARCHICAL CHART
================================================================================

## 1. Virtual Machines

- PROVISION:
  • Prerequisite: Azure subscription required
  • Selection: Choose VM size based on workload
  • Execution: Azure Portal > Create VM

• CONFIGURE:
  • Set up networking rules
  • **[Critical Distinction]:** Standard vs Premium SSD

○ MONITOR:
  • Tool: Azure Monitor
  • Metric: Check CPU utilization
  • Validation: Verify VM health

================================================================================
VISUAL MENTAL ANCHORS
================================================================================
`;

        const result = parseGeneratedContent(content);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.domainAnalysis.lifecycle.phase1).toBe('PROVISION');
            expect(result.data.domainAnalysis.lifecycle.phase2).toBe('CONFIGURE');
            expect(result.data.domainAnalysis.lifecycle.phase3).toBe('MONITOR');
            expect(result.data.concepts.length).toBe(1);
            expect(result.data.concepts[0].name).toBe('Virtual Machines');
        }
    });

    it('should parse content with custom lifecycle phases', () => {
        const content = `
DOMAIN ANALYSIS
---------------
Domain: Law
Professional Role: Legal Analyst
Lifecycle: RESEARCH → DRAFT → REVIEW

Core Concepts Identified: 1
  1. Contract Analysis

================================================================================
MASTER HIERARCHICAL CHART
================================================================================

## 1. Contract Analysis

- RESEARCH:
  • Prerequisite: Access to legal database
  • Selection: Choose jurisdiction
  • Execution: Begin precedent review

• DRAFT:
  • Draft initial findings
  • **[Critical Distinction]:** Binding vs non-binding clauses

○ REVIEW:
  • Tool: Document management system
  • Metric: Review turnaround time
  • Validation: Partner sign-off

================================================================================
VISUAL MENTAL ANCHORS
================================================================================
`;

        const result = parseGeneratedContent(content);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.domainAnalysis.lifecycle.phase1).toBe('RESEARCH');
            expect(result.data.domainAnalysis.lifecycle.phase2).toBe('DRAFT');
            expect(result.data.domainAnalysis.lifecycle.phase3).toBe('REVIEW');
            expect(result.data.concepts.length).toBe(1);
            expect(result.data.concepts[0].name).toBe('Contract Analysis');
            expect(result.data.concepts[0].phase1.prerequisite).toContain('legal database');
        }
    });
});
