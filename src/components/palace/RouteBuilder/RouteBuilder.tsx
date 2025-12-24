import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Trash2,
    MapPin,
    Loader2,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    GripVertical,
    Eye,
    Sparkles,
    Check,
    Map,
    Lightbulb
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import type { RouteBuilding } from '@/lib/types/palace';
import { MAP_COLORS } from '@/constants/theme-colors';
import {
    type LocationInput,
    type WizardStep,
    LOCATION_TEMPLATES,
    PLACEMENT_SLOTS
} from './types';
import styles from './RouteBuilder.module.css';

export interface RouteBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (routeName: string, buildings: RouteBuilding[]) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

const createEmptyLocation = (id: string): LocationInput => ({
    id,
    name: '',
    address: '',
    coordinates: null,
    isLoading: false,
    error: null,
});

export function RouteBuilder({ isOpen, onClose, onSave }: RouteBuilderProps) {
    const [currentStep, setCurrentStep] = useState<WizardStep>('name');
    const [routeName, setRouteName] = useState('My Memory Palace');
    const [locations, setLocations] = useState<LocationInput[]>([
        createEmptyLocation('1'),
        createEmptyLocation('2'),
        createEmptyLocation('3'),
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTemplatePicker, setActiveTemplatePicker] = useState<string | null>(null);
    const templatePickerRef = useRef<HTMLDivElement>(null);

    const { isLoaded: mapsLoaded } = useJsApiLoader({
        id: 'route-builder-map',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (templatePickerRef.current && !templatePickerRef.current.contains(e.target as Node)) {
                setActiveTemplatePicker(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validLocations = locations.filter(loc => loc.name.trim() && loc.coordinates);
    const isLocationsValid = validLocations.length >= 3;

    const addLocation = () => {
        if (locations.length >= 7) return;
        setLocations([...locations, createEmptyLocation(Date.now().toString())]);
    };

    const removeLocation = (id: string) => {
        if (locations.length <= 3) return;
        setLocations(locations.filter(loc => loc.id !== id));
    };

    const updateLocation = (id: string, field: keyof LocationInput, value: unknown) => {
        setLocations(locations.map(loc =>
            loc.id === id
                ? {
                    ...loc,
                    [field]: value,
                    ...(field === 'address' ? { coordinates: null, error: null } : {}),
                }
                : loc
        ));
    };

    const geocodeLocation = useCallback(async (id: string) => {
        const location = locations.find(loc => loc.id === id);
        if (!location || !location.address.trim()) return;

        setLocations(prev => prev.map(loc =>
            loc.id === id ? { ...loc, isLoading: true, error: null } : loc
        ));

        const coords = await geocodeAddress(location.address);

        setLocations(prev => prev.map(loc =>
            loc.id === id
                ? {
                    ...loc,
                    isLoading: false,
                    coordinates: coords,
                    error: coords ? null : 'Could not find this address',
                }
                : loc
        ));
    }, [locations]);

    const applyTemplate = (locationId: string, templateId: string) => {
        const template = LOCATION_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        setLocations(prev => prev.map(loc =>
            loc.id === locationId
                ? { ...loc, template, name: loc.name || template.name }
                : loc
        ));
        setActiveTemplatePicker(null);
    };

    const handleSave = async () => {
        const incompleteLocations = locations.filter(
            loc => !loc.name.trim() || !loc.coordinates
        );

        if (incompleteLocations.length > 0) {
            setIsSaving(true);
            const updates = await Promise.all(
                locations.map(async loc => {
                    if (!loc.coordinates && loc.address.trim()) {
                        const coords = await geocodeAddress(loc.address);
                        return { ...loc, coordinates: coords, error: coords ? null : 'Address not found' };
                    }
                    return loc;
                })
            );
            setLocations(updates);
            setIsSaving(false);

            const stillIncomplete = updates.filter(loc => !loc.name.trim() || !loc.coordinates);
            if (stillIncomplete.length > 0) return;
        }

        const buildings: RouteBuilding[] = locations
            .filter(loc => loc.name.trim() && loc.coordinates)
            .map((loc, index) => ({
                id: `custom-${index}`,
                name: loc.name,
                visualTheme: loc.template
                    ? `${loc.template.icon} ${loc.template.name}: ${loc.address}`
                    : `Your personal location: ${loc.address}`,
                coordinates: loc.coordinates!,
                heading: loc.streetViewHeading || 0,
                placements: PLACEMENT_SLOTS,
            }));

        onSave(routeName, buildings);
        onClose();
    };

    const goToStep = (step: WizardStep) => {
        setCurrentStep(step);
    };

    const getStepNumber = (step: WizardStep): number => {
        const steps: WizardStep[] = ['name', 'locations', 'preview'];
        return steps.indexOf(step) + 1;
    };

    const isStepCompleted = (step: WizardStep): boolean => {
        const currentNum = getStepNumber(currentStep);
        const stepNum = getStepNumber(step);
        return stepNum < currentNum;
    };

    const mapCenter = validLocations.length > 0
        ? {
            lat: validLocations.reduce((sum, loc) => sum + (loc.coordinates?.lat || 0), 0) / validLocations.length,
            lng: validLocations.reduce((sum, loc) => sum + (loc.coordinates?.lng || 0), 0) / validLocations.length,
        }
        : { lat: -26.2041, lng: 28.0473 };

    if (!isOpen) return null;

    const renderProgressBar = () => (
        <div className={styles.progressBar}>
            {(['name', 'locations', 'preview'] as WizardStep[]).map((step, idx) => (
                <div key={step} className={styles.progressStep}>
                    <div
                        className={`${styles.progressDot} ${currentStep === step ? styles.active :
                            isStepCompleted(step) ? styles.completed : styles.inactive
                            }`}
                    >
                        {isStepCompleted(step) ? <Check size={14} /> : idx + 1}
                        {idx < 2 && (
                            <div className={`${styles.progressLine} ${isStepCompleted(step) ? styles.completed : ''}`} />
                        )}
                    </div>
                    <span className={`${styles.progressLabel} ${currentStep === step ? styles.active : ''}`}>
                        {step === 'name' ? 'Name' : step === 'locations' ? 'Locations' : 'Preview'}
                    </span>
                </div>
            ))}
        </div>
    );

    const renderNameStep = () => (
        <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Name Your Memory Palace</h3>
            <p className={styles.stepDescription}>
                Give your palace a meaningful name that reflects its purpose or the places it contains.
                <br />
                <strong>A good name helps you remember and navigate your palace!</strong>
            </p>

            <div className={styles.palaceNameSection}>
                <label className={styles.label}>Palace Name</label>
                <input
                    type="text"
                    value={routeName}
                    onChange={e => setRouteName(e.target.value)}
                    className={`${styles.input} ${styles.inputLarge}`}
                    placeholder="e.g., My Childhood Neighborhood"
                    autoFocus
                />
            </div>

            <div className={styles.templateSection}>
                <label className={styles.label}>Quick Templates (Optional)</label>
                <p className={styles.stepDescription} style={{ marginBottom: '0.75rem' }}>
                    Click a template to use as inspiration for your locations:
                </p>
                <div className={styles.templateGrid}>
                    {LOCATION_TEMPLATES.slice(0, 8).map(template => (
                        <motion.button
                            key={template.id}
                            className={styles.templateCard}
                            onClick={() => {
                                setRouteName(`My ${template.name} Journey`);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className={styles.templateIcon}>{template.icon}</span>
                            <span className={styles.templateName}>{template.name}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderLocationsStep = () => (
        <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Add Your Locations</h3>
            <p className={styles.stepDescription}>
                Choose <strong>3-7 places</strong> you know well. The stronger your emotional connection,
                the better your memories will stick!
            </p>

            <div className={styles.locationCount}>
                <span className={styles.locationCountLabel}>Locations added:</span>
                <span className={`${styles.locationCountValue} ${isLocationsValid ? styles.valid : styles.invalid}`}>
                    {validLocations.length} / {locations.length} (min 3)
                </span>
            </div>

            <div className={styles.locationsList}>
                <AnimatePresence mode="popLayout">
                    {locations.map((loc, index) => (
                        <motion.div
                            key={loc.id}
                            className={`${styles.locationItem} ${loc.error ? styles.hasError : loc.coordinates ? styles.isValid : ''
                                }`}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div
                                className={styles.dragHandle}
                                onMouseDown={e => e.preventDefault()}
                            >
                                <GripVertical size={16} />
                            </div>

                            <span className={styles.locationNumber}>{index + 1}</span>

                            <div className={styles.locationInputs}>
                                <div className={styles.locationInputRow}>
                                    <input
                                        type="text"
                                        value={loc.name}
                                        onChange={e => updateLocation(loc.id, 'name', e.target.value)}
                                        className={styles.locationInput}
                                        placeholder="Name (e.g., Mom's House)"
                                    />
                                    <div style={{ position: 'relative' }} ref={activeTemplatePicker === loc.id ? templatePickerRef : null}>
                                        <button
                                            className={styles.locationTemplateBtn}
                                            onClick={() => setActiveTemplatePicker(
                                                activeTemplatePicker === loc.id ? null : loc.id
                                            )}
                                            title="Choose a template"
                                        >
                                            {loc.template?.icon || '📍'}
                                        </button>
                                        {activeTemplatePicker === loc.id && (
                                            <div className={styles.templatePicker}>
                                                {LOCATION_TEMPLATES.map(template => (
                                                    <button
                                                        key={template.id}
                                                        className={styles.templatePickerItem}
                                                        onClick={() => applyTemplate(loc.id, template.id)}
                                                    >
                                                        <span className={styles.templatePickerIcon}>{template.icon}</span>
                                                        <span className={styles.templatePickerName}>{template.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.addressInputWrapper}>
                                    <input
                                        type="text"
                                        value={loc.address}
                                        onChange={e => updateLocation(loc.id, 'address', e.target.value)}
                                        onBlur={() => geocodeLocation(loc.id)}
                                        className={styles.addressInput}
                                        placeholder="Address or city name"
                                    />
                                    <div className={styles.addressStatus}>
                                        {loc.isLoading && <Loader2 size={16} className={styles.spinner} />}
                                        {loc.coordinates && !loc.isLoading && (
                                            <MapPin size={16} className={styles.successIcon} />
                                        )}
                                        {loc.error && !loc.isLoading && (
                                            <AlertCircle size={16} className={styles.errorIcon} />
                                        )}
                                    </div>
                                </div>

                                {loc.error && (
                                    <div className={styles.locationError}>
                                        <AlertCircle size={12} /> {loc.error}
                                    </div>
                                )}
                            </div>

                            <div className={styles.locationActions}>
                                {loc.coordinates && (
                                    <button
                                        className={styles.previewButton}
                                        onClick={() => {
                                            const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${loc.coordinates!.lat},${loc.coordinates!.lng}`;
                                            window.open(url, '_blank');
                                        }}
                                        title="Preview in Street View"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}
                                {locations.length > 3 && (
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => removeLocation(loc.id)}
                                        title="Remove location"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button
                    className={styles.addLocationButton}
                    onClick={addLocation}
                    disabled={locations.length >= 7}
                >
                    <Plus size={16} />
                    Add Location {locations.length >= 7 && '(Max 7)'}
                </button>
            </div>

            {mapsLoaded && validLocations.length > 0 && (
                <div className={styles.mapContainer}>
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={validLocations.length === 1 ? 14 : 10}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            styles: [
                                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                            ],
                        }}
                    >
                        {validLocations.map((loc, idx) => (
                            <Marker
                                key={loc.id}
                                position={loc.coordinates!}
                                label={{
                                    text: String(idx + 1),
                                    color: MAP_COLORS.markerText,
                                    fontWeight: 'bold',
                                }}
                            />
                        ))}
                        {validLocations.length > 1 && (
                            <Polyline
                                path={validLocations.map(loc => loc.coordinates!)}
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

            {!mapsLoaded && validLocations.length > 0 && (
                <div className={styles.mapContainer}>
                    <div className={styles.mapPlaceholder}>
                        <Map size={32} className={styles.mapPlaceholderIcon} />
                        <span className={styles.mapPlaceholderText}>
                            {GOOGLE_MAPS_API_KEY ? 'Loading map...' : 'Add Google Maps API key to see route preview'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPreviewStep = () => (
        <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Review Your Memory Palace</h3>
            <p className={styles.stepDescription}>
                Here's your personalized memory palace. You'll walk through these locations to anchor your learning.
            </p>

            <div className={styles.previewStep}>
                <div className={styles.previewSummary}>
                    <div className={styles.previewIcon}>🏛️</div>
                    <div className={styles.previewInfo}>
                        <h3>{routeName}</h3>
                        <p>{validLocations.length} locations • Ready to create</p>
                    </div>
                </div>

                <div className={styles.routeVisualization}>
                    <div className={styles.routeLine} />
                    <div className={styles.previewLocations}>
                        {validLocations.map((loc, idx) => (
                            <motion.div
                                key={loc.id}
                                className={styles.previewLocationItem}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <span className={styles.previewLocationNumber}>{idx + 1}</span>
                                <div className={styles.previewLocationDetails}>
                                    <div className={styles.previewLocationName}>{loc.name}</div>
                                    <div className={styles.previewLocationAddress}>{loc.address}</div>
                                </div>
                                {loc.template && (
                                    <span className={styles.previewLocationTemplate}>{loc.template.icon}</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className={styles.previewTip}>
                    <Lightbulb size={20} className={styles.previewTipIcon} />
                    <p className={styles.previewTipText}>
                        <strong>Pro Tip:</strong> When you walk through your palace, take a moment to
                        visualize yourself physically at each location. The more vivid your mental image,
                        the stronger your memory anchors will be!
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <motion.div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
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

                {renderProgressBar()}

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        {currentStep === 'name' && (
                            <motion.div
                                key="name"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderNameStep()}
                            </motion.div>
                        )}
                        {currentStep === 'locations' && (
                            <motion.div
                                key="locations"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderLocationsStep()}
                            </motion.div>
                        )}
                        {currentStep === 'preview' && (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderPreviewStep()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        {currentStep !== 'name' && (
                            <button
                                className={styles.backButton}
                                onClick={() => goToStep(currentStep === 'preview' ? 'locations' : 'name')}
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}
                    </div>
                    <div className={styles.footerRight}>
                        <button className={styles.cancelButton} onClick={onClose}>
                            Cancel
                        </button>
                        {currentStep === 'name' && (
                            <button
                                className={styles.nextButton}
                                onClick={() => goToStep('locations')}
                                disabled={!routeName.trim()}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        )}
                        {currentStep === 'locations' && (
                            <button
                                className={styles.nextButton}
                                onClick={() => goToStep('preview')}
                                disabled={!isLocationsValid}
                            >
                                Preview <ChevronRight size={16} />
                            </button>
                        )}
                        {currentStep === 'preview' && (
                            <button
                                className={styles.createButton}
                                onClick={handleSave}
                                disabled={isSaving}
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
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
