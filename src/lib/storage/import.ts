import type { SavedResult } from './types';

export interface ImportResult {
  success: boolean;
  result?: SavedResult;
  error?: string;
}

export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    if (!file.name.endsWith('.json')) {
      return {
        success: false,
        error: 'Invalid file type. Please select a JSON file.',
      };
    }

    const text = await file.text();
    const data = JSON.parse(text);

    if (!validateSavedResult(data)) {
      return {
        success: false,
        error: 'Invalid file format. This does not appear to be a valid saved result.',
      };
    }

    return {
      success: true,
      result: data as SavedResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
}

function validateSavedResult(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const result = data as Record<string, unknown>;

  return (
    typeof result.id === 'string' &&
    typeof result.subject === 'string' &&
    typeof result.generatedAt === 'string' &&
    typeof result.fullDocument === 'string' &&
    typeof result.pass1Data === 'object' &&
    result.pass1Data !== null &&
    typeof result.validation === 'object' &&
    result.validation !== null
  );
}

export function createFileInput(
  onFileSelected: (file: File) => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  });

  return input;
}
