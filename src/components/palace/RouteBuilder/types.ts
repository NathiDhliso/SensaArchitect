export interface LocationInput {
    id: string;
    name: string;
    address: string;
    coordinates: { lat: number; lng: number } | null;
    isLoading: boolean;
    error: string | null;
    template?: LocationTemplate;
    streetViewHeading?: number;
}

export interface LocationTemplate {
    id: string;
    name: string;
    icon: string;
    description: string;
    emotionalTip: string;
}

export const LOCATION_TEMPLATES: LocationTemplate[] = [
    {
        id: 'home',
        name: 'Home',
        icon: '🏠',
        description: 'Your current or childhood home',
        emotionalTip: 'Where you feel most safe and comfortable',
    },
    {
        id: 'school',
        name: 'School',
        icon: '🏫',
        description: 'School, university, or college',
        emotionalTip: 'Where you learned and grew',
    },
    {
        id: 'work',
        name: 'Workplace',
        icon: '🏢',
        description: 'Office or place of work',
        emotionalTip: 'Where you spend productive time',
    },
    {
        id: 'grandparents',
        name: "Grandparents'",
        icon: '👴',
        description: "Grandparents' or relative's house",
        emotionalTip: 'Warm family memories',
    },
    {
        id: 'park',
        name: 'Favorite Park',
        icon: '🌳',
        description: 'Park or outdoor space you love',
        emotionalTip: 'Nature and relaxation',
    },
    {
        id: 'cafe',
        name: 'Favorite Café',
        icon: '☕',
        description: 'Coffee shop or restaurant',
        emotionalTip: 'Comfort and social memories',
    },
    {
        id: 'gym',
        name: 'Gym/Sports',
        icon: '🏋️',
        description: 'Gym, sports field, or fitness center',
        emotionalTip: 'Energy and achievement',
    },
    {
        id: 'church',
        name: 'Place of Worship',
        icon: '⛪',
        description: 'Church, mosque, temple, or spiritual place',
        emotionalTip: 'Peace and reflection',
    },
    {
        id: 'library',
        name: 'Library',
        icon: '📚',
        description: 'Library or bookstore',
        emotionalTip: 'Knowledge and quiet focus',
    },
    {
        id: 'mall',
        name: 'Shopping Center',
        icon: '🛍️',
        description: 'Mall or shopping area',
        emotionalTip: 'Familiar navigation paths',
    },
    {
        id: 'beach',
        name: 'Beach/Lake',
        icon: '🏖️',
        description: 'Beach, lake, or waterfront',
        emotionalTip: 'Relaxation and vacation memories',
    },
    {
        id: 'custom',
        name: 'Custom Place',
        icon: '📍',
        description: 'Any meaningful location',
        emotionalTip: 'Your unique memory anchor',
    },
];

export const PLACEMENT_SLOTS = [
    { id: 'entrance', location: 'Entrance', visualAnchor: 'front door', position: 'top' as const },
    { id: 'left-side', location: 'Left Side', visualAnchor: 'left wall/window', position: 'center' as const },
    { id: 'right-side', location: 'Right Side', visualAnchor: 'right wall/window', position: 'center' as const },
    { id: 'center', location: 'Center', visualAnchor: 'main area', position: 'center' as const },
    { id: 'back', location: 'Back Area', visualAnchor: 'rear section', position: 'bottom' as const },
    { id: 'roof', location: 'Roof/Top', visualAnchor: 'rooftop feature', position: 'top' as const },
];

export type WizardStep = 'name' | 'locations' | 'preview';
