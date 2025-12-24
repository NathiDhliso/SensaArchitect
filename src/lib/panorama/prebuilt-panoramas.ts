/**
 * Pre-captured Panorama Loader
 * 
 * Loads pre-captured panorama images for built-in routes
 * from the public/panoramas folder.
 */

// Manifest of pre-captured panoramas (will be populated when captured)
// For now, use inline URLs that reference the public folder
const PREBUILT_PANORAMAS: Record<string, Record<string, string>> = {
    // Will be populated after running the capture script
    // Format: routeId -> buildingId -> image path
};

/**
 * Check if a pre-captured panorama exists for a route building
 */
export function hasPrebuiltPanorama(routeId: string, buildingId: string): boolean {
    return !!(PREBUILT_PANORAMAS[routeId]?.[buildingId]);
}

/**
 * Get the URL for a pre-captured panorama
 * Returns the path relative to public folder
 */
export function getPrebuiltPanoramaUrl(routeId: string, buildingId: string): string | null {
    return PREBUILT_PANORAMAS[routeId]?.[buildingId] || null;
}

// Track if manifest has been loaded to prevent duplicate loads
let manifestLoaded = false;

/**
 * Load the manifest of pre-captured panoramas
 * Call this on app startup to check what's available
 * Idempotent - only loads once even if called multiple times
 */
export async function loadPanoramaManifest(): Promise<void> {
    // Prevent duplicate loading (e.g., from React StrictMode double-mounting)
    if (manifestLoaded) {
        return;
    }
    manifestLoaded = true;
    
    try {
        const response = await fetch('/panoramas/manifest.json');
        if (response.ok) {
            const manifest = await response.json();
            
            // Update the in-memory manifest
            for (const [routeId, buildings] of Object.entries(manifest)) {
                PREBUILT_PANORAMAS[routeId] = {};
                for (const [buildingId, info] of Object.entries(buildings as Record<string, { path: string }>)) {
                    PREBUILT_PANORAMAS[routeId][buildingId] = info.path;
                }
            }
            
            console.log('Loaded panorama manifest:', Object.keys(PREBUILT_PANORAMAS));
        }
    } catch {
        // Manifest doesn't exist yet - that's ok, reset flag so it can try again later
        manifestLoaded = false;
        console.log('No pre-captured panorama manifest found');
    }
}

/**
 * Check if a panorama image exists at a given URL
 */
export async function checkPanoramaExists(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}
