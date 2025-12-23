import { useState } from 'react';
import { X, Plus, Trash2, MapPin, Loader2, AlertCircle } from 'lucide-react';
import type { RouteBuilding } from '@/lib/types/palace';
import styles from './RouteBuilder.module.css';

interface RouteBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (routeName: string, buildings: RouteBuilding[]) => void;
}


interface LocationInput {
    id: string;
    name: string;
    address: string;
    coordinates: { lat: number; lng: number } | null;
    isLoading: boolean;
    error: string | null;
}

const PLACEMENT_SLOTS = [
    { id: 'entrance', location: 'Entrance', visualAnchor: 'front door', position: 'top' as const },
    { id: 'left-side', location: 'Left Side', visualAnchor: 'left wall/window', position: 'center' as const },
    { id: 'right-side', location: 'Right Side', visualAnchor: 'right wall/window', position: 'center' as const },
    { id: 'center', location: 'Center', visualAnchor: 'main area', position: 'center' as const },
    { id: 'back', location: 'Back Area', visualAnchor: 'rear section', position: 'bottom' as const },
    { id: 'roof', location: 'Roof/Top', visualAnchor: 'rooftop feature', position: 'top' as const },
];

// Free geocoding using OpenStreetMap Nominatim
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const encoded = encodeURIComponent(address);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
            {
                headers: {
                    'User-Agent': 'SensaApp/1.0 (Educational Memory Palace)',
                },
            }
        );
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch {
        return null;
    }
}

export function RouteBuilder({ isOpen, onClose, onSave }: RouteBuilderProps) {
    const [routeName, setRouteName] = useState('My Memory Palace');
    const [locations, setLocations] = useState<LocationInput[]>([
        { id: '1', name: '', address: '', coordinates: null, isLoading: false, error: null },
        { id: '2', name: '', address: '', coordinates: null, isLoading: false, error: null },
        { id: '3', name: '', address: '', coordinates: null, isLoading: false, error: null },
    ]);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const addLocation = () => {
        if (locations.length >= 7) return;
        setLocations([
            ...locations,
            { id: Date.now().toString(), name: '', address: '', coordinates: null, isLoading: false, error: null },
        ]);
    };

    const removeLocation = (id: string) => {
        if (locations.length <= 3) return;
        setLocations(locations.filter((loc) => loc.id !== id));
    };

    const updateLocation = (id: string, field: 'name' | 'address', value: string) => {
        setLocations(
            locations.map((loc) =>
                loc.id === id
                    ? { ...loc, [field]: value, coordinates: field === 'address' ? null : loc.coordinates, error: null }
                    : loc
            )
        );
    };

    const geocodeLocation = async (id: string) => {
        const location = locations.find((loc) => loc.id === id);
        if (!location || !location.address.trim()) return;

        setLocations(
            locations.map((loc) => (loc.id === id ? { ...loc, isLoading: true, error: null } : loc))
        );

        const coords = await geocodeAddress(location.address);

        setLocations(
            locations.map((loc) =>
                loc.id === id
                    ? {
                        ...loc,
                        isLoading: false,
                        coordinates: coords,
                        error: coords ? null : 'Could not find this address',
                    }
                    : loc
            )
        );
    };

    const handleSave = async () => {
        // Validate all locations have names and coordinates
        const incompleteLocations = locations.filter(
            (loc) => !loc.name.trim() || !loc.coordinates
        );

        if (incompleteLocations.length > 0) {
            // Try to geocode any missing coordinates
            setIsSaving(true);
            const updates = await Promise.all(
                locations.map(async (loc) => {
                    if (!loc.coordinates && loc.address.trim()) {
                        const coords = await geocodeAddress(loc.address);
                        return { ...loc, coordinates: coords, error: coords ? null : 'Address not found' };
                    }
                    return loc;
                })
            );
            setLocations(updates);
            setIsSaving(false);

            // Check again after geocoding
            const stillIncomplete = updates.filter((loc) => !loc.name.trim() || !loc.coordinates);
            if (stillIncomplete.length > 0) {
                return; // Show errors
            }
        }

        // Build the route buildings
        const buildings: RouteBuilding[] = locations
            .filter((loc) => loc.name.trim() && loc.coordinates)
            .map((loc, index) => ({
                id: `custom-${index}`,
                name: loc.name,
                visualTheme: `Your personal location: ${loc.address}`,
                coordinates: loc.coordinates!,
                heading: 0, // Default heading, user can adjust in Street View
                placements: PLACEMENT_SLOTS,
            }));

        onSave(routeName, buildings);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <h2 className={styles.title}>🏛️ Create Your Memory Palace</h2>
                <p className={styles.subtitle}>
                    Choose places you know well – your home, school, favorite spots.
                    <br />
                    <strong>Emotional connection = stronger memories!</strong>
                </p>

                <div className={styles.routeNameSection}>
                    <label className={styles.label}>Palace Name</label>
                    <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        className={styles.input}
                        placeholder="e.g., My Childhood Neighborhood"
                    />
                </div>

                <div className={styles.locationsList}>
                    <label className={styles.label}>Locations (3-7 places)</label>
                    {locations.map((loc, index) => (
                        <div key={loc.id} className={styles.locationItem}>
                            <span className={styles.locationNumber}>{index + 1}</span>
                            <div className={styles.locationInputs}>
                                <input
                                    type="text"
                                    value={loc.name}
                                    onChange={(e) => updateLocation(loc.id, 'name', e.target.value)}
                                    className={styles.input}
                                    placeholder="Name (e.g., Mom's House)"
                                />
                                <div className={styles.addressRow}>
                                    <input
                                        type="text"
                                        value={loc.address}
                                        onChange={(e) => updateLocation(loc.id, 'address', e.target.value)}
                                        onBlur={() => geocodeLocation(loc.id)}
                                        className={styles.input}
                                        placeholder="Address or city name"
                                    />
                                    {loc.isLoading && <Loader2 size={16} className={styles.spinner} />}
                                    {loc.coordinates && !loc.isLoading && (
                                        <MapPin size={16} className={styles.successIcon} />
                                    )}
                                </div>
                                {loc.error && (
                                    <div className={styles.error}>
                                        <AlertCircle size={12} /> {loc.error}
                                    </div>
                                )}
                            </div>
                            {locations.length > 3 && (
                                <button
                                    className={styles.removeButton}
                                    onClick={() => removeLocation(loc.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}

                    {locations.length < 7 && (
                        <button className={styles.addButton} onClick={addLocation}>
                            <Plus size={16} /> Add Location
                        </button>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className={styles.spinner} /> Finding Locations...
                            </>
                        ) : (
                            'Create Palace'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
