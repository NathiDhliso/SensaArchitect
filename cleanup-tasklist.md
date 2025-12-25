# Code Cleanup Tasklist

This document outlines verified unused code to be deleted and code to consolidate.

---

## PHASE 1: DELETE UNUSED CODE (High Priority)

All items below have been **verified as definitively unused** by searching for imports across the codebase.

### 1.1 Delete Diagnostic Components (VERIFIED UNUSED)

**Files to Delete:**
```
src/components/diagnostic/
├── DiagnosticModal.tsx        # Never imported anywhere
├── DiagnosticModal.module.css # Only used by DiagnosticModal.tsx
├── DiagnosticResults.tsx      # Never imported anywhere
├── DiagnosticResults.module.css # Only used by DiagnosticResults.tsx
└── index.ts                   # Exports unused components
```

**Verification:**
- `grep "import.*DiagnosticModal"` - Only self-import in own CSS file
- `grep "import.*DiagnosticResults"` - Only self-import in own CSS file
- `grep "from.*components/diagnostic"` - Zero matches
- These components were orphaned when diagnostic blocking was removed from Generate.tsx

---

### 1.2 Delete Diagnostic Generator (VERIFIED UNUSED)

**File to Delete:**
```
src/lib/generation/diagnostic-generator.ts
```

**Verification:**
- `grep "import.*diagnostic-generator"` - Only imported by DiagnosticModal.tsx (being deleted)
- This file is only consumed by the unused diagnostic component

---

### 1.3 Delete Diagnostic Types (VERIFIED UNUSED AFTER STORE CLEANUP)

**File to Delete:**
```
src/lib/types/diagnostic.ts
```

**Verification:**
- Imported by:
  1. `generation-store.ts` - Needs cleanup (see Phase 2)
  2. `diagnostic-generator.ts` - Being deleted
  3. `DiagnosticModal.tsx` - Being deleted
- After generation-store cleanup, this file has zero consumers

---

## PHASE 2: CLEAN ORPHANED REFERENCES

### 2.1 Clean generation-store.ts

**Location:** `src/store/generation-store.ts`

**Remove:**
1. Import: `import type { DiagnosticResult } from '@/lib/types/diagnostic';`
2. State properties:
   - `diagnosticResult: DiagnosticResult | null`
   - `conceptsToSkip: string[]`
3. Initial state:
   - `diagnosticResult: null`
   - `conceptsToSkip: []`
4. Actions:
   - `setDiagnosticResult: (result: DiagnosticResult, conceptsToSkip: string[]) => void`
   - `clearDiagnosticResult: () => void`
5. Action implementations (setDiagnosticResult and clearDiagnosticResult functions)

---

## PHASE 3: BUILD VERIFICATION

After completing Phases 1-2, run:
```bash
npm run build
```

Expected result: Build succeeds with no import errors.

---

## LOW PRIORITY: CSS DUPLICATION (Deferred)

The following CSS patterns are duplicated across multiple files but are **intentionally NOT consolidated** because:
1. Minor variations exist (z-index, backdrop-filter, animation timing)
2. CSS Modules scope prevents conflicts
3. Consolidation would add complexity with minimal benefit
4. Risk of breaking visual consistency across components

**Observed duplication (for awareness only):**
- `.overlay` pattern: 12 files (HelpModal, SettingsPanel, RoutePreviewCard, StreetViewPreview, RouteBuilder, PlacementGuide, ConfusionDrill, LearningToolbar, SessionSummary, DiagnosticResults, DiagnosticModal, CelebrationModal)
- `.closeButton` pattern: Multiple modal files

**Recommendation:** Do NOT consolidate CSS at this time. Each modal has intentional visual differences.

---

## EXECUTION ORDER

1. ✅ Create this tasklist
2. 🔲 Delete `src/components/diagnostic/` folder
3. 🔲 Delete `src/lib/generation/diagnostic-generator.ts`
4. 🔲 Clean `src/store/generation-store.ts`
5. 🔲 Delete `src/lib/types/diagnostic.ts`
6. 🔲 Run `npm run build`
7. 🔲 Run `npm run dev` and test manually

---

## DO NOT DELETE (Confirmed In Use)

The following were investigated but confirmed to be actively used:

| File | Used By |
|------|---------|
| `src/lib/utils.ts` (formatTime, getTimerUrgency) | Sprint.tsx |
| `src/components/learning/NeuralResetModal.tsx` | Learn.tsx (exported as NeuralResetBanner) |
| `src/components/learning/UnifiedSessionBar.tsx` | Learn.tsx |
| `src/lib/generation/sprint-generator.ts` | Sprint.tsx |
| `src/lib/generation/confusion-generator.ts` | ConfusionDrill.tsx |
