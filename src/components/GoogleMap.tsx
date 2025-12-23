import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
};

// Default center (can be overridden by props)
const defaultCenter = {
    lat: -26.2041, // Johannesburg coordinates as default
    lng: 28.0473
};

interface GoogleMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Array<{ lat: number; lng: number; title?: string }>;
    className?: string;
}

export const GoogleMapComponent: React.FC<GoogleMapProps> = ({
    center = defaultCenter,
    zoom = 13,
    markers = [],
    className = "w-full h-[400px]"
}) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', // Ensure this is set in .env
    });

    const [_map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (loadError) {
        return (
            <div className={`flex items-center justify-center bg-red-50 text-red-500 rounded-lg ${className}`}>
                Error loading maps. Check your API Key.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 animate-pulse rounded-lg text-gray-400 ${className}`}>
                Loading Maps...
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-lg shadow-md border border-gray-200 ${className}`}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
            >
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        title={marker.title}
                    />
                ))}
                {/* Default marker if no markers provided but we want to show center */}
                {markers.length === 0 && <Marker position={center} />}
            </GoogleMap>
        </div>
    );
};

export default GoogleMapComponent;
