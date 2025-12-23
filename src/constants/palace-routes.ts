import type { PalaceRoute } from '@/lib/types/palace';

/**
 * Pre-built Memory Palace routes
 * Each has 7 buildings with 6 placement slots each
 */

const PLACEMENT_SLOTS = [
    { id: 'top-left', location: 'Entrance (Top Left)', visualAnchor: 'main doors', position: 'top' as const, headingOffset: -40, pitch: 15 },
    { id: 'top-right', location: 'Roof Feature (Top Right)', visualAnchor: 'antenna/sign', position: 'top' as const, headingOffset: 40, pitch: 25 },
    { id: 'center-left', location: 'Left Wing (Center)', visualAnchor: 'side entrance', position: 'center' as const, headingOffset: -60, pitch: 0 },
    { id: 'center-right', location: 'Right Wing (Center)', visualAnchor: 'loading area', position: 'center' as const, headingOffset: 60, pitch: 0 },
    { id: 'bottom-left', location: 'Ground Left', visualAnchor: 'parking/garden', position: 'bottom' as const, headingOffset: -30, pitch: -15 },
    { id: 'bottom-right', location: 'Ground Right', visualAnchor: 'pathway', position: 'bottom' as const, headingOffset: 30, pitch: -15 },
];

export const PALACE_ROUTES: PalaceRoute[] = [
    {
        id: 'tech-campus',
        name: 'NYC Tech Walk',
        description: 'Walk through famous NYC landmarks with distinct buildings',
        buildings: [
            {
                id: 'glass-tower',
                name: 'Empire State Building',
                visualTheme: 'Iconic skyscraper, represents foundations',
                // Street level on 5th Ave looking at Empire State
                coordinates: { lat: 40.7479, lng: -73.9851 },
                heading: 30,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'brick-security',
                name: 'Grand Central Terminal',
                visualTheme: 'Historic station, represents organization',
                // Park Ave looking at Grand Central facade
                coordinates: { lat: 40.7531, lng: -73.9768 },
                heading: 200,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'steel-factory',
                name: 'Times Square',
                visualTheme: 'Busy intersection, represents processing',
                // Broadway in Times Square, looking at billboards
                coordinates: { lat: 40.7589, lng: -73.9851 },
                heading: 0,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'warehouse',
                name: 'New York Public Library',
                visualTheme: 'Classic library, represents storage',
                // 5th Ave looking at library steps
                coordinates: { lat: 40.7528, lng: -73.9815 },
                heading: 270,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'network-hub',
                name: 'Rockefeller Center',
                visualTheme: 'Business complex, represents networking',
                // 5th Ave looking at Rockefeller plaza
                coordinates: { lat: 40.7589, lng: -73.9782 },
                heading: 270,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'library',
                name: 'Bryant Park',
                visualTheme: 'Green space, represents knowledge',
                // 6th Ave looking into Bryant Park
                coordinates: { lat: 40.7536, lng: -73.9845 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'control-tower',
                name: 'One World Trade Center',
                visualTheme: 'Tall tower, represents oversight',
                // Church St looking up at Freedom Tower
                coordinates: { lat: 40.7118, lng: -74.0128 },
                heading: 30,
                placements: PLACEMENT_SLOTS,
            },
        ],
    },
    {
        id: 'university',
        name: 'University Campus',
        description: 'Explore an academic campus perfect for learning journeys',
        buildings: [
            {
                id: 'main-hall',
                name: 'Main Hall',
                visualTheme: 'Grand entrance building',
                coordinates: { lat: 42.3601, lng: -71.0942 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'science-building',
                name: 'Science Building',
                visualTheme: 'Modern lab facility',
                coordinates: { lat: 42.3605, lng: -71.0935 },
                heading: 180,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'engineering-wing',
                name: 'Engineering Wing',
                visualTheme: 'Industrial workshop style',
                coordinates: { lat: 42.3610, lng: -71.0928 },
                heading: 45,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'arts-center',
                name: 'Arts Center',
                visualTheme: 'Creative open spaces',
                coordinates: { lat: 42.3615, lng: -71.0921 },
                heading: 270,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'student-union',
                name: 'Student Union',
                visualTheme: 'Social gathering space',
                coordinates: { lat: 42.3620, lng: -71.0914 },
                heading: 135,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'research-center',
                name: 'Research Center',
                visualTheme: 'Advanced study facility',
                coordinates: { lat: 42.3625, lng: -71.0907 },
                heading: 0,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'admin-tower',
                name: 'Admin Tower',
                visualTheme: 'Oversight and management',
                coordinates: { lat: 42.3630, lng: -71.0900 },
                heading: 225,
                placements: PLACEMENT_SLOTS,
            },
        ],
    },
    {
        id: 'city-street',
        name: 'City Street',
        description: 'Walk down a bustling city street with memorable storefronts',
        buildings: [
            {
                id: 'bookstore',
                name: 'The Bookstore',
                visualTheme: 'Knowledge and fundamentals',
                coordinates: { lat: 51.5074, lng: -0.1278 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'bank',
                name: 'The Bank',
                visualTheme: 'Security and transactions',
                coordinates: { lat: 51.5078, lng: -0.1270 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'workshop',
                name: 'The Workshop',
                visualTheme: 'Building and creation',
                coordinates: { lat: 51.5082, lng: -0.1262 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'depot',
                name: 'The Depot',
                visualTheme: 'Storage and logistics',
                coordinates: { lat: 51.5086, lng: -0.1254 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'cafe',
                name: 'The Café',
                visualTheme: 'Connections and networking',
                coordinates: { lat: 51.5090, lng: -0.1246 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'gallery',
                name: 'The Gallery',
                visualTheme: 'Display and presentation',
                coordinates: { lat: 51.5094, lng: -0.1238 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'tower-office',
                name: 'The Tower Office',
                visualTheme: 'Management and oversight',
                coordinates: { lat: 51.5098, lng: -0.1230 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
        ],
    },
];

/**
 * Generate Street View URL for a location
 */
export function getStreetViewUrl(lat: number, lng: number, heading = 90): string {
    // Use the correct Street View URL format
    return `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=12,${heading},0,0,0`;
}

export function getRouteById(id: string): PalaceRoute | undefined {
    return PALACE_ROUTES.find(r => r.id === id);
}
