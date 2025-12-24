/**
 * Shared Content Loading Utilities
 * 
 * These utilities are used across Results.tsx and SavedResults.tsx
 * to parse generated content and load it into the learning store.
 */

import { parseGeneratedContent, transformGeneratedContent } from '@/lib/content-adapter';
import { useLearningStore } from '@/store/learning-store';

export interface ParseAndLoadResult {
    success: boolean;
    error?: string;
}

/**
 * Parse raw generated content and load it into the learning store.
 * This centralizes the duplicate logic found in Results.tsx and SavedResults.tsx.
 * 
 * @param rawContent - The raw generated document content
 * @returns Result object indicating success or containing error message
 */
export function parseAndLoadContent(rawContent: string): ParseAndLoadResult {
    try {
        const parseResult = parseGeneratedContent(rawContent);

        if (!parseResult.success) {
            return {
                success: false,
                error: parseResult.error || 'Failed to parse content',
            };
        }

        const transformed = transformGeneratedContent(parseResult.data);
        useLearningStore.getState().loadCustomContent(transformed);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Hook version for components that need reactive access
 * Returns a function that can be called with content
 */
export function useParseAndLoadContent() {
    const loadCustomContent = useLearningStore((state) => state.loadCustomContent);

    return (rawContent: string): ParseAndLoadResult => {
        try {
            const parseResult = parseGeneratedContent(rawContent);

            if (!parseResult.success) {
                return {
                    success: false,
                    error: parseResult.error || 'Failed to parse content',
                };
            }

            const transformed = transformGeneratedContent(parseResult.data);
            loadCustomContent(transformed);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    };
}
