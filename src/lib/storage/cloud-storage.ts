import type { SavedResult, StorageProvider } from './types';

export class CloudStorage implements StorageProvider {
  private readonly apiEndpoint: string;

  constructor(apiEndpoint?: string) {
    this.apiEndpoint = apiEndpoint || import.meta.env.VITE_CLOUD_STORAGE_API || '';
  }

  async saveResult(result: SavedResult): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!this.apiEndpoint) {
      return { 
        success: false, 
        error: 'Cloud storage not configured. Set VITE_CLOUD_STORAGE_API environment variable.' 
      };
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { 
        success: true, 
        path: data.url || data.path 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save to cloud' 
      };
    }
  }

  async loadResult(id: string): Promise<SavedResult | null> {
    if (!this.apiEndpoint) return null;

    try {
      const response = await fetch(`${this.apiEndpoint}/results/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async deleteResult(id: string): Promise<boolean> {
    if (!this.apiEndpoint) return false;

    try {
      const response = await fetch(`${this.apiEndpoint}/results/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listResults(): Promise<SavedResult[]> {
    if (!this.apiEndpoint) return [];

    try {
      const response = await fetch(`${this.apiEndpoint}/results`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  isConfigured(): boolean {
    return !!this.apiEndpoint;
  }
}

export const cloudStorage = new CloudStorage();
