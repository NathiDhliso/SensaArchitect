# SensaPBL - Dynamic Lifecycle Refactoring Task

## Overview
Remove all hardcoded lifecycle values (PROVISION, CONFIGURE, MONITOR) and make the application fully dynamic to support any subject domain with its own custom lifecycle phases.

## Status: ✅ COMPLETED

---

## Completed Tasks

### 1. Core Lifecycle Registry Removal
- [x] Deleted `src/constants/lifecycle-registry.ts`
- [x] Removed `DomainType` enum from `src/lib/types.ts`
- [x] Removed `UniversalLifecycle` type from `src/lib/types.ts`
- [x] Updated `src/lib/generation/lifecycle-engine.ts` - removed hardcoded domain detection
- [x] Updated `src/lib/generation/validation.ts` - removed `correctLifecycleToRegistry` function
- [x] Updated `src/lib/system-prompt.ts` - removed hardcoded lifecycle examples

### 2. Dynamic Lifecycle Fallbacks
- [x] Updated `src/lib/generation/dynamic-lifecycle.ts` - removed Power BI and Azure specific fallbacks
- [x] Generic fallback now uses FOUNDATION → ACTION → VERIFICATION

### 3. Palace Store Types
- [x] Updated `src/lib/types/palace.ts` - changed `provision/configure/monitor` to `phase1/phase2/phase3`
- [x] Updated `src/store/palace-store.ts` - updated interface to use generic phase names
- [x] Updated `src/pages/Results.tsx` - updated lifecycle mapping

### 4. Content Adapter - Parser
- [x] Updated `src/lib/content-adapter/parser.ts` - fallback uses FOUNDATION/ACTION/VERIFICATION
- [x] Renamed variable names to phase1Section/phase2Section/phase3Section
- [x] Dynamic phase marker detection based on parsed lifecycle

### 5. Content Adapter - Transformer
- [x] Updated `src/lib/content-adapter/transformer.ts` - generic fallback steps
- [x] Renamed variables to phase1Steps/phase3Steps/phase2Items

### 6. Content Adapter - Types
- [x] Updated `src/lib/content-adapter/types.ts` - renamed to phase1/phase2/phase3 in ParsedConcept

### 7. Palace Components
- [x] Updated `src/components/palace/LifecycleCard.tsx` - accepts lifecycleLabels prop, displays dynamically
- [x] Updated `src/components/palace/ConceptTooltip.tsx` - uses dynamic phase labels from marker
- [x] Updated `src/components/palace/ConceptMarker.tsx` - uses dynamic phase labels
- [x] Updated `src/components/palace/GuidedTour.tsx` - uses dynamic phase labels
- [x] Updated `src/components/palace/QuizMode.tsx` - uses phase1 instead of provision

### 8. Google Maps Marker Types
- [x] Updated `src/lib/google-maps/marker-positioning.ts` - MarkerPosition uses phase1/phase2/phase3
- [x] Added optional lifecycleLabels property for display names

### 9. UI Constants
- [x] Updated `src/constants/ui-constants.ts` - renamed RECENT_SUBJECTS to EXAMPLE_SUBJECTS with generic examples

### 10. CSS Updates
- [x] Updated `src/components/palace/LifecycleCard.module.css` - renamed to .phase1Label/.phase2Label/.phase3Label
- [x] Updated `src/components/palace/ConceptTooltip.module.css` - renamed to .phase1Icon/.phase2Icon/.phase3Icon

---

## Architecture Changes

### New Data Flow
1. **Generation**: AI determines lifecycle phases dynamically based on subject
2. **Storage**: Lifecycle labels stored with generated content in `domainAnalysis.lifecycle`
3. **Parsing**: Parser extracts lifecycle from content, uses for concept parsing
4. **Display**: Components receive lifecycle labels as props, display dynamically

### Type Changes Summary
```typescript
// Internal property names (consistent across all types)
lifecycle: {
  phase1: string[];
  phase2: string[];
  phase3: string[];
}

// Display labels (passed separately for UI rendering)
lifecycleLabels: {
  phase1: string; // e.g., "PROVISION" or "PREPARE" or "ASSESS"
  phase2: string; // e.g., "CONFIGURE" or "MODEL" or "TREAT"
  phase3: string; // e.g., "MONITOR" or "DELIVER" or "EVALUATE"
}
```

---

## Testing Checklist
- [ ] Generate content for IT/Cloud subject
- [ ] Generate content for non-IT subject (e.g., Medicine, Law)
- [ ] Verify lifecycle labels display correctly in Learn page
- [ ] Verify lifecycle labels display correctly in Palace view
- [ ] Verify Results page shows correct lifecycle
- [ ] Test backward compatibility with saved results

---

## Notes
- All internal property names use `phase1/phase2/phase3` for consistency
- Display labels are passed via `lifecycleLabels` prop or extracted from parsed content
- Generic fallback lifecycle: FOUNDATION → ACTION → VERIFICATION
- All components can now render any lifecycle labels dynamically
