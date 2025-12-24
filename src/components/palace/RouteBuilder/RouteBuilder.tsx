import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    Sparkles,
    Map,
    CheckCircle2,
    Eye
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import type { RouteBuilding } from '@/lib/types/palace';
import { MAP_COLORS } from '@/constants/theme-colors';
import {
    type LocationInput,
    LOCATION_TEMPLATES,
    PLACEMENT_SLOTS
} from './types';
import { AddressAutocomplete } from './AddressAutocomplete';
import { StreetViewPreview } from './StreetViewPreview';
import styles from './RouteBuilder.module.css';

export interface RouteBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (routeName: string, buildings: RouteBuilding[]) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];

const createEmptyLocation = (id: string): LocationInput => ({
    id,
    name: '',
    address: '',
    coordinates: null,
    isLoading: false,
    error: null,
    streetViewStatus: 'unchecked',
    isConfirmed: false,
});

export function RouteBuilder({ isOpen, onClose, onSave }: RouteBuilderProps) {
    const [routeName, setRouteName] = useState('My Memory Palace');
    const [locations, setLocations] = useState<LocationInput[]>([
        createEmptyLocation('1'),
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [previewLocation, setPreviewLocation] = useState<LocationInput | null>(null);

    const { isLoaded: mapsLoaded } = useJsApiLoader({
        id: 'route-builder-map',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const confirmedLocations = locations.filter(loc => loc.name.trim() && loc.coordinates && loc.isConfirmed);
    const locationsWithAddress = locations.filter(loc => loc.name.trim() && loc.coordinates);
    const isReadyToCreate = confirmedLocations.length >= 1;

    const addLocation = () => {
        if (locations.length >= 7) return;
        setLocations([...locations, createEmptyLocation(Date.now().toString())]);
    };

    const removeLocation = (id: string) => {
        if (locations.length <= 1) return;
        setLocations(locations.filter(loc => loc.id !== id));
    };

    const updateLocation = (id: string, field: keyof LocationInput, value: unknown) => {
        setLocations(locations.map(loc =>
            loc.id === id
                ? {
                    ...loc,
                    [field]: value,
                    ...(field === 'address' ? { coordinates: null, error: null, isConfirmed: false } : {}),
                }
                : loc
        ));
    };

    // Apply template - fills the next empty location with a suggested name
    const applyTemplate = (template: typeof LOCATION_TEMPLATES[0]) => {
        const emptyIndex = locations.findIndex(loc => !loc.name.trim());
        if (emptyIndex >= 0) {
            setLocations(locations.map((loc, idx) =>
                idx === emptyIndex
                    ? { ...loc, name: template.description, template }
                    : loc
            ));
        } else if (locations.length < 7) {
            // Add new location with template
            const newLoc = createEmptyLocation(Date.now().toString());
            newLoc.name = template.description;
            newLoc.template = template;
            setLocations([...locations, newLoc]);
        }
    };

    const handleSave = async () => {
        if (!isReadyToCreate) return;

        setIsSaving(true);

        const buildings: RouteBuilding[] = confirmedLocations.map((loc, index) => {
            const placements = loc.customPlacements && loc.customPlacements.length > 0
                ? loc.customPlacements.map(cp => ({
                    id: cp.id,
                    location: cp.label,
                    visualAnchor: cp.label,
                    position: 'center' as const,
                    headingOffset: cp.headingOffset,
                    pitch: cp.pitch,
                }))
                : PLACEMENT_SLOTS;

            return {
                id: `custom-${index}`,
                name: loc.name,
                visualTheme: loc.template
                    ? `${loc.template.icon} ${loc.template.name}: ${loc.address}`
                    : `Your personal location: ${loc.address}`,
                coordinates: loc.coordinates!,
                heading: loc.streetViewHeading || 0,
                placements,
                panoId: loc.streetViewPanoId,
            };
        });

        onSave(routeName, buildings);
        setIsSaving(false);
        onClose();
    };

    const mapCenter = locationsWithAddress.length > 0
        ? {
            lat: locationsWithAddress.reduce((sum, loc) => sum + (loc.coordinates?.lat || 0), 0) / locationsWithAddress.length,
            lng: locationsWithAddress.reduce((sum, loc) => sum + (loc.coordinates?.lng || 0), 0) / locationsWithAddress.length,
        }
        : { lat: -26.2041, lng: 28.0473 };

    if (!isOpen) return null;

    // Only allow closing via overlay click when StreetViewPreview is not open
    const handleOverlayClick = () => {
        if (!previewLocation) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <motion.div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onMouseUp={e => e.stopPropagation()}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerIcon}>🏛️</span>
                        <h2 className={styles.headerTitle}>Create Memory Palace</h2>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Palace Name - Inline */}
                    <div className={styles.nameSection}>
                        <input
                            type="text"
                            value={routeName}
                            onChange={e => setRouteName(e.target.value)}
                            className={styles.palaceNameInline}
                            placeholder="Name your palace..."
                        />
                    </div>

                    {/* Quick Templates */}
                    <div className={styles.quickTemplates}>
                        <span className={styles.quickTemplatesLabel}>Quick add:</span>
                        <div className={styles.templateChips}>
                            {LOCATION_TEMPLATES.slice(0, 6).map(template => (
                                <button
                                    key={template.id}
                                    className={styles.templateChip}
                                    onClick={() => applyTemplate(template)}
                                    title={template.emotionalTip}
                                >
                                    <span>{template.icon}</span>
                                    <span>{template.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Locations List */}
                    <div className={styles.locationsGrid}>
                        <div className={styles.locationsList}>
                            <AnimatePresence mode="popLayout">
                                {locations.map((loc, idx) => (
                                    <motion.div
                                        key={loc.id}
                                        className={`${styles.locationRow} ${loc.isConfirmed ? styles.locationConfirmed : ''}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className={styles.locationNum}>
                                            {loc.isConfirmed ? (
                                                <CheckCircle2 size={18} className={styles.confirmedIcon} />
                                            ) : (
                                                <span>{idx + 1}</span>
                                            )}
                                        </div>

                                        <div className={styles.locationFields}>
                                            <input
                                                type="text"
                                                value={loc.name}
                                                onChange={e => updateLocation(loc.id, 'name', e.target.value)}
                                                className={styles.locNameInput}
                                                placeholder={`Location ${idx + 1} (e.g., Mom's House)`}
                                            />
                                            <AddressAutocomplete
                                                value={loc.address}
                                                onChange={(value) => updateLocation(loc.id, 'address', value)}
                                                onLocationSelect={(result) => {
                                                    setLocations(prev => prev.map(l =>
                                                        l.id === loc.id
                                                            ? {
                                                                ...l,
                                                                address: result.address,
                                                                coordinates: result.coordinates,
                                                                streetViewStatus: result.streetViewAvailable ? 'available' : 'unavailable',
                                                                streetViewPanoId: result.streetViewPanoId,
                                                                error: result.streetViewAvailable ? null : 'No Street View',
                                                                isConfirmed: false,
                                                            }
                                                            : l
                                                    ));
                                                }}
                                                onStreetViewPreview={() => setPreviewLocation(loc)}
                                                placeholder="Search address..."
                                                coordinates={loc.coordinates}
                                                streetViewStatus={loc.streetViewStatus}
                                                isConfirmed={loc.isConfirmed}
                                                compact
                                                mapsLoaded={mapsLoaded}
                                            />
                                        </div>

                                        <div className={styles.locationActions}>
                                            {/* Preview button when ready */}
                                            {loc.streetViewStatus === 'available' && loc.coordinates && !loc.isConfirmed && (
                                                <button
                                                    className={styles.previewBtn}
                                                    onClick={() => setPreviewLocation(loc)}
                                                    title="Preview & confirm"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}

                                            {/* Remove button */}
                                            {locations.length > 1 && (
                                                <button
                                                    className={styles.removeBtn}
                                                    onClick={() => removeLocation(loc.id)}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                            {/* Error indicator */}
                                            {loc.streetViewStatus === 'unavailable' && (
                                                <span className={styles.errorBadge} title="No Street View coverage">
                                                    <AlertCircle size={14} />
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Add location button */}
                            {locations.length < 7 && (
                                <button className={styles.addLocBtn} onClick={addLocation}>
                                    <Plus size={16} />
                                    Add Location
                                </button>
                            )}
                        </div>

                        {/* Mini map preview */}
                        {mapsLoaded && locationsWithAddress.length > 0 && (
                            <div className={styles.miniMap}>
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={mapCenter}
                                    zoom={locationsWithAddress.length === 1 ? 14 : 10}
                                    options={{
                                        disableDefaultUI: true,
                                        zoomControl: false,
                                        styles: [
                                            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                                        ],
                                    }}
                                >
                                    {locationsWithAddress.map((loc, idx) => (
                                        <Marker
                                            key={loc.id}
                                            position={loc.coordinates!}
                                            label={{
                                                text: String(idx + 1),
                                                color: MAP_COLORS.markerText,
                                                fontWeight: 'bold',
                                            }}
                                            opacity={loc.isConfirmed ? 1 : 0.5}
                                        />
                                    ))}
                                    {locationsWithAddress.length > 1 && (
                                        <Polyline
                                            path={locationsWithAddress.map(loc => loc.coordinates!)}
                                            options={{
                                                strokeColor: MAP_COLORS.polylineStroke,
                                                strokeOpacity: 0.8,
                                                strokeWeight: 3,
                                                geodesic: true,
                                            }}
                                        />
                                    )}
                                </GoogleMap>
                            </div>
                        )}

                        {!mapsLoaded && locationsWithAddress.length > 0 && (
                            <div className={styles.miniMap}>
                                <div className={styles.mapPlaceholder}>
                                    <Map size={24} />
                                    <span>Map preview</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status message */}
                    <div className={styles.statusBar}>
                        {confirmedLocations.length < 1 ? (
                            <span className={styles.statusPending}>
                                {1 - confirmedLocations.length} more confirmed location{1 - confirmedLocations.length > 1 ? 's' : ''} needed
                            </span>
                        ) : (
                            <span className={styles.statusReady}>
                                <CheckCircle2 size={16} />
                                {confirmedLocations.length} locations ready
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.createButton}
                        onClick={handleSave}
                        disabled={!isReadyToCreate || isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className={styles.spinner} />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Create Palace
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            {previewLocation && previewLocation.coordinates && (
                <StreetViewPreview
                    isOpen={!!previewLocation}
                    coordinates={previewLocation.coordinates}
                    locationName={previewLocation.name || previewLocation.address}
                    panoId={previewLocation.streetViewPanoId}
                    onConfirm={(heading, customPlacements) => {
                        setLocations(prev => prev.map(loc =>
                            loc.id === previewLocation.id
                                ? { ...loc, isConfirmed: true, streetViewHeading: heading, customPlacements }
                                : loc
                        ));
                        setPreviewLocation(null);
                    }}
                    onCancel={() => setPreviewLocation(null)}
                    onReject={() => {
                        setLocations(prev => prev.map(loc =>
                            loc.id === previewLocation.id
                                ? { ...loc, coordinates: null, address: '', streetViewStatus: 'unchecked', isConfirmed: false }
                                : loc
                        ));
                        setPreviewLocation(null);
                    }}
                />
            )}
        </div>
    );
}
