import { openDB, type IDBPDatabase } from 'idb';
import type { StoredPanorama } from './types';

const DB_NAME = 'sensa-panoramas';
const DB_VERSION = 1;
const STORE_NAME = 'panoramas';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('palaceId', 'palaceId', { unique: false });
                    store.createIndex('buildingId', 'buildingId', { unique: false });
                }
            },
        });
    }
    return dbPromise;
}

export function generatePanoramaId(palaceId: string, buildingId: string): string {
    return `${palaceId}-${buildingId}`;
}

export async function savePanorama(panorama: StoredPanorama): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, panorama);
}

export async function getPanorama(id: string): Promise<StoredPanorama | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
}

export async function getPanoramaByBuilding(palaceId: string, buildingId: string): Promise<StoredPanorama | undefined> {
    const id = generatePanoramaId(palaceId, buildingId);
    return getPanorama(id);
}

export async function getPanoramasByPalace(palaceId: string): Promise<StoredPanorama[]> {
    const db = await getDB();
    const index = db.transaction(STORE_NAME).store.index('palaceId');
    return index.getAll(palaceId);
}

export async function deletePanorama(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
}

export async function deletePanoramasByPalace(palaceId: string): Promise<void> {
    const panoramas = await getPanoramasByPalace(palaceId);
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(panoramas.map(p => tx.store.delete(p.id)));
    await tx.done;
}

export async function getPanoramaAsDataUrl(id: string): Promise<string | null> {
    const panorama = await getPanorama(id);
    if (!panorama) return null;
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(panorama.imageBlob);
    });
}

export async function hasPanorama(palaceId: string, buildingId: string): Promise<boolean> {
    const panorama = await getPanoramaByBuilding(palaceId, buildingId);
    return !!panorama;
}
