/**
 * Application-wide configuration constants
 */

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];

// Common Types
export interface Coordinates {
    lat: number;
    lng: number;
}
