# Code Consolidation Tasks

## Overview
This document outlines duplicate code patterns identified in the codebase that should be consolidated into shared utilities.

---

## Task 1: Time Formatting Utilities
**Priority: High**
**Files Affected:**
- `src/pages/Sprint.tsx` - `formatTime()` function
- `src/components/diagnostic/DiagnosticModal.tsx` - `formatTime()` function  
- `src/components/learning/SessionSummary.tsx` - `formatDuration()`, `formatPace()` functions

**Duplicated Code:**
```typescript
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

**Solution:** Create `src/lib/utils/time-formatters.ts` with:
- `formatTime(seconds)` - mm:ss format
- `formatDuration(seconds)` - handles hours
- `formatPace(seconds)` - for pace display

---

## Task 2: Timer Urgency Classes
**Priority: High**
**Files Affected:**
- `src/pages/Sprint.tsx` - `getTimerClass()`, `getQuestionTimerClass()`
- `src/components/diagnostic/DiagnosticModal.tsx` - `getTimerClass()`, `getQuestionTimerClass()`

**Duplicated Code:**
```typescript
const getTimerClass = () => {
    if (totalTimeRemaining <= 30) return styles.critical;
    if (totalTimeRemaining <= 60) return styles.urgent;
    return '';
};
```

**Solution:** Create utility functions in `src/lib/utils/timer-utils.ts`:
- `getTimerUrgencyLevel(remaining, thresholds)` - returns 'critical' | 'warning' | 'normal'

---

## Task 3: Quiz State Management Hook
**Priority: High**
**Files Affected:**
- `src/components/learning/LearningToolbar/QuickQuiz.tsx`
- `src/components/palace/QuizMode.tsx`
- `src/components/learning/ConfusionDrill.tsx`
- `src/components/diagnostic/DiagnosticModal.tsx`
- `src/pages/Sprint.tsx`

**Duplicated Patterns:**
- State: `currentIndex`, `selectedOption`, `showFeedback`, `answers`
- Logic: answer selection, feedback display, advancing to next question

**Solution:** Create `src/hooks/useQuizState.ts` hook with:
- Common quiz state management
- `handleSelectAnswer()`, `handleNext()`, `reset()` actions
- Progress tracking

---

## Task 4: Keyboard Shortcut Handlers
**Priority: Medium**
**Files Affected:**
- `src/pages/Sprint.tsx` - Y/N/1/2 keyboard handling
- `src/components/diagnostic/DiagnosticModal.tsx` - 1/2/3/4/a/b/c/d handling
- `src/components/learning/ConfusionDrill.tsx` - A/B/1/2 handling

**Duplicated Pattern:**
```typescript
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (phase !== 'quiz' || selectedOption !== null) return;
        const keyMap: Record<string, number> = { ... };
        const optionIndex = keyMap[e.key.toLowerCase()];
        if (optionIndex !== undefined) handleAnswer(optionIndex);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [phase, selectedOption, handleAnswer]);
```

**Solution:** Create `src/hooks/useQuizKeyboard.ts` hook

---

## Task 5: Timer Countdown Hook
**Priority: Medium**
**Files Affected:**
- `src/pages/Sprint.tsx` - total timer + question timer
- `src/components/diagnostic/DiagnosticModal.tsx` - total timer + question timer
- `src/components/learning/ConfusionDrill.tsx` - question timer

**Duplicated Pattern:**
```typescript
useEffect(() => {
    if (phase !== 'active') return;
    const interval = setInterval(() => {
        setTimeRemaining(prev => {
            if (prev <= 0) { onTimeout(); return initialValue; }
            return prev - 0.1;
        });
    }, 100);
    return () => clearInterval(interval);
}, [phase]);
```

**Solution:** Create `src/hooks/useCountdownTimer.ts` hook with:
- `timeRemaining`, `isExpired`, `reset()`, `pause()`, `resume()`

---

## Task 6: QuizQuestion Type Consolidation
**Priority: Medium**
**Files Affected:**
- `src/components/learning/LearningToolbar/QuickQuiz.tsx` - local QuizQuestion interface
- `src/components/palace/QuizMode.tsx` - local QuizQuestion interface

**Solution:** Move to `src/lib/types/quiz.ts`:
- `QuizQuestion` base interface
- `QuizAnswer` interface
- `QuizState` type

---

## Implementation Order

1. **Task 1** - Time formatting utilities (standalone, no dependencies)
2. **Task 2** - Timer urgency utilities (standalone)
3. **Task 6** - Quiz types consolidation (types first, then hooks)
4. **Task 5** - Countdown timer hook
5. **Task 4** - Keyboard shortcut hook
6. **Task 3** - Quiz state management hook (depends on types)

---

## Progress Tracking

- [x] Task 1: Time Formatting Utilities - Added to `src/lib/utils.ts`
- [x] Task 2: Timer Urgency Classes - Added to `src/lib/utils.ts`
- [ ] Task 3: Quiz State Management Hook - Skipped (each quiz has unique requirements)
- [x] Task 4: Keyboard Shortcut Handlers - Created `src/hooks/useQuizKeyboard.ts`
- [x] Task 5: Timer Countdown Hook - Created `src/hooks/useCountdownTimer.ts`
- [x] Task 6: QuizQuestion Type Consolidation - Existing types in `src/lib/types/` are already well-organized

## Files Updated
- `src/lib/utils.ts` - Added `formatTime`, `formatDuration`, `formatPace`, `getTimerUrgency`
- `src/pages/Sprint.tsx` - Uses consolidated utilities, removed duplicate code
- `src/components/diagnostic/DiagnosticModal.tsx` - Uses consolidated utilities, removed duplicate code
- `src/components/learning/SessionSummary.tsx` - Uses consolidated utilities, removed duplicate code
- `src/hooks/index.ts` - Exports new hooks
- `src/hooks/useCountdownTimer.ts` - New consolidated timer hook
- `src/hooks/useQuizKeyboard.ts` - New consolidated keyboard shortcut hook
