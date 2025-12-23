export * from './types';
export { LocalFileStorage, localFileStorage } from './local-storage';
export { CloudStorage, cloudStorage } from './cloud-storage';
export { importFromFile, createFileInput } from './import';
export type { ImportResult } from './import';

import { localFileStorage } from './local-storage';
import { cloudStorage } from './cloud-storage';
import type { SavedResult, StorageProvider } from './types';

export class StorageManager {
  private localProvider: StorageProvider;
  private cloudProvider: StorageProvider;
  private useCloud: boolean;

  constructor() {
    this.localProvider = localFileStorage;
    this.cloudProvider = cloudStorage;
    this.useCloud = false;
  }

  setCloudEnabled(enabled: boolean): void {
    this.useCloud = enabled && cloudStorage.isConfigured();
  }

  async saveResult(result: SavedResult): Promise<{ success: boolean; path?: string; error?: string }> {
    const localResult = await this.localProvider.saveResult(result);

    if (this.useCloud) {
      const cloudResult = await this.cloudProvider.saveResult({
        ...result,
        savedToCloud: true,
      });

      if (cloudResult.success) {
        result.cloudUrl = cloudResult.path;
        await this.localProvider.saveResult(result);
      }
    }

    return localResult;
  }

  async loadResult(id: string): Promise<SavedResult | null> {
    let result = await this.localProvider.loadResult(id);

    if (!result && this.useCloud) {
      result = await this.cloudProvider.loadResult(id);
      if (result) {
        await this.localProvider.saveResult(result);
      }
    }

    return result;
  }

  async deleteResult(id: string): Promise<boolean> {
    const localDeleted = await this.localProvider.deleteResult(id);

    if (this.useCloud) {
      await this.cloudProvider.deleteResult(id);
    }

    return localDeleted;
  }

  async listResults(): Promise<SavedResult[]> {
    const localResults = await this.localProvider.listResults();

    if (this.useCloud) {
      const cloudResults = await this.cloudProvider.listResults();
      const mergedMap = new Map<string, SavedResult>();

      [...localResults, ...cloudResults].forEach(result => {
        mergedMap.set(result.id, result);
      });

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
    }

    return localResults;
  }

  isCloudEnabled(): boolean {
    return this.useCloud;
  }
}

export const storageManager = new StorageManager();
