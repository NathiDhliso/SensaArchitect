/**
 * Panorama Capture Script
 * 
 * This script captures Google Street View panoramas for pre-built routes
 * and saves them as static images in the public folder.
 * 
 * Run with: node scripts/capture-panoramas.js
 * 
 * Note: This runs server-side where CORS doesn't apply.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'panoramas');

// Read API key from .env file
function getApiKey() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/);
        return match ? match[1].trim() : null;
    } catch {
        return null;
    }
}

// Pre-built routes with known panoIds (obtained from Google Maps)
// These are stable panorama IDs for the NYC landmarks
const ROUTES = {
    'tech-campus': {
        name: 'NYC Tech Walk',
        buildings: [
            { 
                id: 'glass-tower', 
                name: 'Empire State Building', 
                lat: 40.7479, 
                lng: -73.9851,
                // Hardcoded panoId from Google Maps Street View
                panoId: 'CAoSLEFGMVFpcE5qeHFJSm9KSE1FRXVYbmxCbVhQM0xZdG1TdUdQM0dHbXRZOFpR'
            },
            { 
                id: 'brick-security', 
                name: 'Grand Central Terminal', 
                lat: 40.7531, 
                lng: -73.9768,
                panoId: 'CAoSLEFGMVFpcE9vSDJScGRCM1otOWl1M1JfeDJQUUpfbkxMOVdQd3ZyMk9mYU9L'
            },
            { 
                id: 'steel-factory', 
                name: 'Times Square', 
                lat: 40.7589, 
                lng: -73.9851,
                panoId: 'CAoSLEFGMVFpcE9HYXZpYlFQTUZ4OC1UUHVqSlQ5RkQ3ejhQWFBYT1NJRzA0M0FR'
            },
            { 
                id: 'warehouse', 
                name: 'New York Public Library', 
                lat: 40.7528, 
                lng: -73.9815,
                panoId: 'CAoSLEFGMVFpcE1fZUpQS3BVN3lSc0VVQkNrYnlBZ0ctX2s3QmVhUm5VX1NQNHE0'
            },
            { 
                id: 'network-hub', 
                name: 'Rockefeller Center', 
                lat: 40.7589, 
                lng: -73.9782,
                panoId: 'CAoSLEFGMVFpcFBxN3JxRklpMjlNQW8wMnoxYmJvM3dQN3RscTZQWE9KdkR5dzhw'
            },
            { 
                id: 'library', 
                name: 'Bryant Park', 
                lat: 40.7536, 
                lng: -73.9845,
                panoId: 'CAoSLEFGMVFpcE9EcWlzX1VBY3lIbTB2YWFoQjNEWkJHN3lfYkp1dVlGeXVIdVJH'
            },
            { 
                id: 'control-tower', 
                name: 'One World Trade Center', 
                lat: 40.7118, 
                lng: -74.0128,
                panoId: 'CAoSLEFGMVFpcE9FLWtKcjRpOGxoUlFSdFVBRW5tLTlGRUhiUnFNQ0F5N0h5cGdV'
            },
        ]
    }
};

// Download panorama using Street View Static API
function downloadPanorama(lat, lng, heading, outputPath, apiKey) {
    return new Promise((resolve, reject) => {
        // Use equirectangular projection for 360 panorama
        // Size: 640x640 is max for free tier
        const size = '640x640';
        const fov = 120; // Field of view
        const pitch = 0;
        
        // We'll capture multiple views and stitch them
        const views = [
            { heading: 0, suffix: 'front' },
            { heading: 90, suffix: 'right' },
            { heading: 180, suffix: 'back' },
            { heading: 270, suffix: 'left' },
        ];

        console.log(`  Downloading 4 views...`);
        
        let completed = 0;
        const results = [];

        views.forEach((view, index) => {
            const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${view.heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
            
            https.get(url, (res) => {
                if (res.statusCode === 200) {
                    const chunks = [];
                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        const viewPath = outputPath.replace('.jpg', `-${view.suffix}.jpg`);
                        fs.writeFileSync(viewPath, buffer);
                        results.push({ view: view.suffix, path: viewPath });
                        completed++;
                        if (completed === views.length) {
                            resolve(results);
                        }
                    });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            }).on('error', reject);
        });
    });
}

// Alternative: Download tiles directly (works without API key but may have rate limits)
function downloadTiles(panoId, outputPath) {
    return new Promise(async (resolve, reject) => {
        const { createCanvas, loadImage } = await import('canvas');
        
        const TILE_SIZE = 512;
        const ZOOM = 2; // Lower zoom for faster capture
        const TILES_X = 4;
        const TILES_Y = 2;
        
        const canvas = createCanvas(TILES_X * TILE_SIZE, TILES_Y * TILE_SIZE);
        const ctx = canvas.getContext('2d');
        
        console.log(`  Downloading ${TILES_X * TILES_Y} tiles...`);
        
        const tilePromises = [];
        
        for (let y = 0; y < TILES_Y; y++) {
            for (let x = 0; x < TILES_X; x++) {
                tilePromises.push(
                    new Promise((res) => {
                        const url = `https://cbk0.google.com/cbk?output=tile&panoid=${panoId}&zoom=${ZOOM}&x=${x}&y=${y}`;
                        
                        https.get(url, (response) => {
                            const chunks = [];
                            response.on('data', chunk => chunks.push(chunk));
                            response.on('end', async () => {
                                try {
                                    const buffer = Buffer.concat(chunks);
                                    if (buffer.length > 1000) {
                                        const img = await loadImage(buffer);
                                        ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE);
                                        res({ success: true, x, y });
                                    } else {
                                        res({ success: false, x, y });
                                    }
                                } catch {
                                    res({ success: false, x, y });
                                }
                            });
                        }).on('error', () => res({ success: false, x, y }));
                    })
                );
            }
        }
        
        const results = await Promise.all(tilePromises);
        const successCount = results.filter(r => r.success).length;
        
        console.log(`  Loaded ${successCount}/${TILES_X * TILES_Y} tiles`);
        
        if (successCount > 0) {
            const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
            fs.writeFileSync(outputPath, buffer);
            console.log(`  Saved: ${outputPath}`);
            resolve(true);
        } else {
            reject(new Error('No tiles loaded'));
        }
    });
}

// Main capture function
async function captureAllPanoramas() {
    console.log('🎯 Panorama Capture Script\n');
    
    const apiKey = getApiKey();
    console.log(`API Key: ${apiKey ? 'Found' : 'Not found'}\n`);
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const manifest = {};

    for (const [routeId, route] of Object.entries(ROUTES)) {
        console.log(`\n📍 Route: ${route.name} (${routeId})`);
        const routeDir = path.join(OUTPUT_DIR, routeId);
        
        if (!fs.existsSync(routeDir)) {
            fs.mkdirSync(routeDir, { recursive: true });
        }

        manifest[routeId] = {};

        for (const building of route.buildings) {
            console.log(`\n  🏛️ ${building.name} (${building.id})`);
            
            try {
                const outputPath = path.join(routeDir, `${building.id}.jpg`);
                
                if (apiKey) {
                    // Use Street View Static API
                    await downloadPanorama(building.lat, building.lng, 0, outputPath, apiKey);
                    manifest[routeId][building.id] = {
                        path: `/panoramas/${routeId}/${building.id}.jpg`,
                        captured: new Date().toISOString(),
                        method: 'static-api'
                    };
                } else if (building.panoId) {
                    // Try direct tile download
                    await downloadTiles(building.panoId, outputPath);
                    manifest[routeId][building.id] = {
                        panoId: building.panoId,
                        path: `/panoramas/${routeId}/${building.id}.jpg`,
                        captured: new Date().toISOString(),
                        method: 'tiles'
                    };
                } else {
                    console.log('  ⚠️ Skipped: No API key and no panoId');
                }
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Save manifest
    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n✅ Manifest saved: ${manifestPath}`);
    console.log('\n🎉 Done! Panoramas captured and saved to public/panoramas/');
}

// Run
captureAllPanoramas().catch(console.error);
