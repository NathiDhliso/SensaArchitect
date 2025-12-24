/**
 * Confusion Generator
 * 
 * Generates confusion pairs and discrimination questions to help
 * learners distinguish between similar concepts.
 */

import { getBedrockClient, invokeClaudeModel, type BedrockConfig } from './claude-client';
import type { ConfusionPair, ConfusionQuestion, ConfusionDrillResult, ConfusionAnswer } from '@/lib/types/confusion';
import type { LearningConcept } from '@/lib/types/learning';

const CONFUSION_SYSTEM_PROMPT = `You are an expert at identifying commonly confused concepts. 
Generate confusion pairs that test the learner's ability to discriminate between similar concepts.

RULES:
1. Focus on concepts that are genuinely confusing
2. Scenarios should be realistic workplace situations
3. Explanations should clarify the key distinction
4. Keep all text concise and action-oriented`;

/**
 * Generate confusion pairs from a list of concepts
 */
export async function generateConfusionPairs(
    concepts: LearningConcept[],
    subject: string,
    config: BedrockConfig,
    maxPairs: number = 5
): Promise<ConfusionPair[]> {
    const conceptNames = concepts.map(c => c.name).join(', ');

    const prompt = `For the subject "${subject}", identify ${maxPairs} pairs of concepts that learners commonly confuse.

Available concepts: ${conceptNames}

For each pair, provide:
1. The two concepts that are confused
2. A one-sentence key distinction
3. When to use each one
4. What people commonly get wrong

OUTPUT JSON ARRAY:
[
  {
    "id": "conf-1",
    "conceptA": {
      "name": "Concept Name A",
      "description": "Brief description"
    },
    "conceptB": {
      "name": "Concept Name B", 
      "description": "Brief description"
    },
    "distinctionKey": "One sentence explaining the key difference",
    "whenToUseA": "Use A when...",
    "whenToUseB": "Use B when...",
    "commonMistake": "People often wrongly think..."
  }
]

Return ONLY the JSON array.`;

    const client = getBedrockClient(config);
    const messages = [{ role: 'user' as const, content: prompt }];

    const response = await invokeClaudeModel(
        client,
        messages,
        CONFUSION_SYSTEM_PROMPT
    );

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in response');
        }

        const pairs: ConfusionPair[] = JSON.parse(jsonMatch[0]);
        return pairs.slice(0, maxPairs);
    } catch (error) {
        console.error('Failed to parse confusion pairs:', error);
        return [];
    }
}

/**
 * Generate discrimination questions for a confusion pair
 */
export async function generateConfusionQuestions(
    pair: ConfusionPair,
    _subject: string,  // Reserved for future use in prompt context
    config: BedrockConfig,
    questionCount: number = 4
): Promise<ConfusionQuestion[]> {
    const prompt = `Create ${questionCount} discrimination questions testing the difference between:
  
A: ${pair.conceptA.name} - ${pair.conceptA.description}
B: ${pair.conceptB.name} - ${pair.conceptB.description}

Key distinction: ${pair.distinctionKey}

Each question should present a realistic scenario where the learner must choose A or B.
Mix it up - some scenarios should need A, others should need B.

OUTPUT JSON ARRAY:
[
  {
    "id": "q1",
    "pairId": "${pair.id}",
    "scenario": "A specific scenario requiring a choice...",
    "correctChoice": "A" or "B",
    "optionA": "${pair.conceptA.name}",
    "optionB": "${pair.conceptB.name}",
    "explanation": "Why this is correct..."
  }
]

Return ONLY the JSON array.`;

    const client = getBedrockClient(config);
    const messages = [{ role: 'user' as const, content: prompt }];

    const response = await invokeClaudeModel(
        client,
        messages,
        CONFUSION_SYSTEM_PROMPT,
        2000
    );

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in response');
        }

        const questions: ConfusionQuestion[] = JSON.parse(jsonMatch[0]);
        return questions.map((q, idx) => ({
            ...q,
            id: q.id || `q${idx + 1}`,
            pairId: pair.id,
            correctChoice: q.correctChoice === 'A' ? 'A' : 'B',
        }));
    } catch (error) {
        console.error('Failed to parse confusion questions:', error);
        return [];
    }
}

/**
 * Calculate drill result from answers
 */
export function calculateConfusionDrillResult(
    pair: ConfusionPair,
    questions: ConfusionQuestion[],
    answers: ConfusionAnswer[]
): ConfusionDrillResult {
    const correctAnswers = answers.filter(a => a.correct).length;
    const validResponses = answers.filter(a => a.selectedChoice !== null);
    const avgResponseTimeMs = validResponses.length > 0
        ? Math.round(validResponses.reduce((sum, a) => sum + a.responseTimeMs, 0) / validResponses.length)
        : 0;

    return {
        pairId: pair.id,
        conceptA: pair.conceptA.name,
        conceptB: pair.conceptB.name,
        correctAnswers,
        totalQuestions: questions.length,
        avgResponseTimeMs,
        mastered: (correctAnswers / questions.length) >= 0.8,
        completedAt: new Date().toISOString(),
    };
}

/**
 * Get pairs that need review based on past performance
 */
export function getPairsNeedingReview(
    allPairs: ConfusionPair[],
    pastResults: ConfusionDrillResult[]
): ConfusionPair[] {
    const resultsByPair = new Map<string, ConfusionDrillResult>();

    // Get latest result for each pair
    pastResults.forEach(result => {
        const existing = resultsByPair.get(result.pairId);
        if (!existing || result.completedAt > existing.completedAt) {
            resultsByPair.set(result.pairId, result);
        }
    });

    // Return pairs that haven't been mastered or haven't been attempted
    return allPairs.filter(pair => {
        const result = resultsByPair.get(pair.id);
        return !result || !result.mastered;
    });
}
