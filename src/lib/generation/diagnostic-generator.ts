/**
 * Diagnostic Generator
 * 
 * Generates diagnostic questions to assess user's prior knowledge
 * and personalize their 2-hour learning path.
 */

import { getBedrockClient, invokeClaudeModel, type BedrockConfig } from './claude-client';
import { DIAGNOSTIC_CONFIG } from '@/constants/ui-constants';
import type { DiagnosticQuestion, DiagnosticResult, DiagnosticAnswer } from '@/lib/types/diagnostic';

const DIAGNOSTIC_SYSTEM_PROMPT = `You are a diagnostic assessment expert. Generate rapid-fire multiple choice questions to quickly assess a learner's knowledge level.

RULES:
1. Questions must be answerable in under 6 seconds by someone who knows the material
2. Each question has exactly 4 options (A, B, C, D)
3. Questions should test pattern recognition, not obscure details
4. Stratify difficulty: beginner (basic terminology), intermediate (concepts), advanced (application)
5. Cover the full breadth of the subject domain
6. Questions should be unambiguous - only one clearly correct answer

OUTPUT FORMAT (JSON array):
[
  {
    "id": "q1",
    "question": "Which AWS service provides serverless compute?",
    "options": ["EC2", "Lambda", "ECS", "Lightsail"],
    "correctIndex": 1,
    "conceptId": "aws-lambda",
    "conceptName": "AWS Lambda",
    "difficulty": "beginner"
  }
]`;

/**
 * Generate diagnostic questions for a subject using Claude
 * When concepts are provided (from Pass 1), questions are based on actual curriculum
 */
export async function generateDiagnosticQuestions(
    subject: string,
    config: BedrockConfig,
    concepts?: string[] // Optional concepts from Pass 1
): Promise<DiagnosticQuestion[]> {
    const { beginner, intermediate, advanced } = DIAGNOSTIC_CONFIG.DISTRIBUTION;

    // Build prompt based on whether we have concepts from Pass 1
    let prompt: string;
    
    if (concepts && concepts.length > 0) {
        // Use actual concepts from the generated learning system
        prompt = `Generate exactly ${DIAGNOSTIC_CONFIG.QUESTION_COUNT} diagnostic questions for: "${subject}"

THESE ARE THE ACTUAL CURRICULUM CONCEPTS (from the learning system):
${concepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Distribution:
- ${beginner} beginner questions (basic terminology)
- ${intermediate} intermediate questions (concept relationships)
- ${advanced} advanced questions (application scenarios)

IMPORTANT: 
- Each question MUST relate to one of the concepts listed above
- Use the exact concept name in the "conceptName" field
- Create conceptId by slugifying the concept name (lowercase, hyphens)

Return ONLY the JSON array, no other text.`;
    } else {
        // Fallback to generic subject questions
        prompt = `Generate exactly ${DIAGNOSTIC_CONFIG.QUESTION_COUNT} diagnostic questions for the subject: "${subject}"

Distribution:
- ${beginner} beginner questions (basic terminology and concepts)
- ${intermediate} intermediate questions (understanding relationships)
- ${advanced} advanced questions (application and problem-solving)

Ensure questions cover diverse topics within the subject domain.
Return ONLY the JSON array, no other text.`;
    }

    const client = getBedrockClient(config);
    const messages = [{ role: 'user' as const, content: prompt }];

    const response = await invokeClaudeModel(
        client,
        messages,
        DIAGNOSTIC_SYSTEM_PROMPT
    );

    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in response');
        }

        const questions: DiagnosticQuestion[] = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Invalid questions array');
        }

        // Validate each question
        return questions.map((q, index) => ({
            id: q.id || `q${index + 1}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            conceptId: q.conceptId || `concept-${index + 1}`,
            conceptName: q.conceptName || q.question.slice(0, 30),
            difficulty: q.difficulty || 'intermediate',
        }));
    } catch (error) {
        console.error('Failed to parse diagnostic questions:', error);
        throw new Error('Failed to generate diagnostic questions. Please try again.');
    }
}

/**
 * Calculate diagnostic result from answers
 */
export function calculateDiagnosticResult(
    questions: DiagnosticQuestion[],
    answers: DiagnosticAnswer[]
): DiagnosticResult {
    const correctAnswers = answers.filter(a => a.correct).length;
    const strengthScore = Math.round((correctAnswers / questions.length) * 100);

    // Identify known and weak concepts
    const knownConcepts: string[] = [];
    const weakAreas: string[] = [];

    answers.forEach((answer, index) => {
        const question = questions[index];
        if (answer.correct) {
            knownConcepts.push(question.conceptId);
        } else {
            weakAreas.push(question.conceptId);
        }
    });

    // Calculate average response time
    const avgResponseTimeMs = answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / answers.length;

    // Estimate learning time: ~5 minutes per weak concept
    const estimatedGapMinutes = weakAreas.length * 5;

    return {
        knownConcepts,
        weakAreas,
        strengthScore,
        totalQuestions: questions.length,
        correctAnswers,
        avgResponseTimeMs: Math.round(avgResponseTimeMs),
        estimatedGapMinutes,
        answers,
        completedAt: new Date().toISOString(),
    };
}

/**
 * Get concepts to skip based on diagnostic result
 * These are concepts the user already knows well
 */
export function getConceptsToSkip(result: DiagnosticResult): string[] {
    // Skip concepts where user demonstrated mastery
    // (answered correctly and quickly)
    const fastThresholdMs = 4000; // Under 4 seconds = automatic recall

    const fastCorrectIndexes = result.answers
        .map((a, index) => (a.correct && a.responseTimeMs < fastThresholdMs) ? index : -1)
        .filter(index => index !== -1);

    return fastCorrectIndexes
        .map(index => result.knownConcepts[index])
        .filter(Boolean);
}
