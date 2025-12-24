import type { StoredPanorama } from './types';
import { generatePanoramaId, savePanorama } from './panorama-store';

const TILE_SIZE = 512;
const ZOOM_LEVEL = 3;
const TILES_X = 7;
const TILES_Y = 4;

function getTileUrl(panoId: string, zoom: number, x: number, y: number): string {
    return `https://cbk0.google.com/cbk?output=tile&panoid=${panoId}&zoom=${zoom}&x=${x}&y=${y}`;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load tile: ${url}`));
        img.src = url;
    });
}

async function stitchTiles(panoId: string): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const width = TILES_X * TILE_SIZE;
    const height = TILES_Y * TILE_SIZE;
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const tilePromises: Promise<{ img: HTMLImageElement; x: number; y: number }>[] = [];
    
    for (let y = 0; y < TILES_Y; y++) {
        for (let x = 0; x < TILES_X; x++) {
            const url = getTileUrl(panoId, ZOOM_LEVEL, x, y);
            tilePromises.push(
                loadImage(url)
                    .then(img => ({ img, x, y }))
                    .catch(() => ({ img: null as unknown as HTMLImageElement, x, y }))
            );
        }
    }

    const tiles = await Promise.all(tilePromises);
    
    for (const tile of tiles) {
        if (tile.img) {
            ctx.drawImage(tile.img, tile.x * TILE_SIZE, tile.y * TILE_SIZE);
        }
    }

    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob from canvas'));
            },
            'image/jpeg',
            quality
        );
    });
}

export interface CaptureResult {
    success: boolean;
    panoramaId?: string;
    error?: string;
}

export async function capturePanorama(
    panoId: string,
    palaceId: string,
    buildingId: string,
    coordinates: { lat: number; lng: number }
): Promise<CaptureResult> {
    try {
        const canvas = await stitchTiles(panoId);
        const blob = await canvasToBlob(canvas);
        
        const panoramaId = generatePanoramaId(palaceId, buildingId);
        
        const storedPanorama: StoredPanorama = {
            id: panoramaId,
            palaceId,
            buildingId,
            imageBlob: blob,
            width: canvas.width,
            height: canvas.height,
            capturedAt: new Date().toISOString(),
            originalPanoId: panoId,
            coordinates,
        };
        
        await savePanorama(storedPanorama);
        
        return { success: true, panoramaId };
    } catch (error) {
        console.error('Failed to capture panorama:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

export async function capturePanoramaFromCoordinates(
    lat: number,
    lng: number,
    palaceId: string,
    buildingId: string
): Promise<CaptureResult> {
    if (!window.google?.maps) {
        return { success: false, error: 'Google Maps not loaded' };
    }

    const sv = new google.maps.StreetViewService();
    
    return new Promise((resolve) => {
        sv.getPanorama(
            { location: { lat, lng }, radius: 200 },
            (data, status) => {
                if (status === google.maps.StreetViewStatus.OK && data?.location?.pano) {
                    capturePanorama(data.location.pano, palaceId, buildingId, { lat, lng })
                        .then(resolve);
                } else {
                    resolve({ success: false, error: 'No Street View coverage' });
                }
            }
        );
    });
}
