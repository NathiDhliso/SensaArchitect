import type { PalaceRoute } from '@/lib/types/palace';

/**
 * Pre-built Memory Palace routes
 * Each has 7 buildings with 6 placement slots each
 */

const PLACEMENT_SLOTS = [
    { id: 'top-left', location: 'Entrance (Top Left)', visualAnchor: 'main doors', position: 'top' as const },
    { id: 'top-right', location: 'Roof Feature (Top Right)', visualAnchor: 'antenna/sign', position: 'top' as const },
    { id: 'center-left', location: 'Left Wing (Center)', visualAnchor: 'side entrance', position: 'center' as const },
    { id: 'center-right', location: 'Right Wing (Center)', visualAnchor: 'loading area', position: 'center' as const },
    { id: 'bottom-left', location: 'Ground Left', visualAnchor: 'parking/garden', position: 'bottom' as const },
    { id: 'bottom-right', location: 'Ground Right', visualAnchor: 'pathway', position: 'bottom' as const },
];

export const PALACE_ROUTES: PalaceRoute[] = [
    {
        id: 'tech-campus',
        name: 'Tech Campus',
        description: 'Walk through a modern technology campus with 7 distinct buildings',
        buildings: [
            {
                id: 'glass-tower',
                name: 'The Glass Tower',
                visualTheme: 'Modern glass entrance, represents foundations',
                coordinates: { lat: 47.6405, lng: -122.1297 },
                heading: 90,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'brick-security',
                name: 'The Brick Security Office',
                visualTheme: 'Red brick building, represents protection/security',
                coordinates: { lat: 47.6410, lng: -122.1285 },
                heading: 180,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'steel-factory',
                name: 'The Steel Factory',
                visualTheme: 'Industrial building, represents heavy processing',
                coordinates: { lat: 47.6415, lng: -122.1275 },
                heading: 45,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'warehouse',
                name: 'The Warehouse',
                visualTheme: 'Wide storage building, represents data/storage',
                coordinates: { lat: 47.6420, lng: -122.1265 },
                heading: 270,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'network-hub',
                name: 'The Network Hub',
                visualTheme: 'Building with cables/infrastructure',
                coordinates: { lat: 47.6425, lng: -122.1255 },
                heading: 135,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'library',
                name: 'The Library',
                visualTheme: 'Classic building with windows, represents knowledge',
                coordinates: { lat: 47.6430, lng: -122.1245 },
                heading: 0,
                placements: PLACEMENT_SLOTS,
            },
            {
                id: 'control-tower',
                name: 'The Control Tower',
                visualTheme: 'Tall observation building, represents oversight',
                coordinates: { lat: 47.6435, lng: -122.1235 },
                heading: 225,
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
    return `https://www.google.com/maps/@${lat},${lng},3a,75y,${heading}h,90t/data=!3m6!1e1!3m4`;
}

export function getRouteById(id: string): PalaceRoute | undefined {
    return PALACE_ROUTES.find(r => r.id === id);
}
