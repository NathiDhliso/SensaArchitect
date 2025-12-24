import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, Check, Eye, X } from 'lucide-react';
import { checkStreetViewCoverage } from '@/lib/google-maps';
import styles from './AddressAutocomplete.module.css';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
    streetViewAvailable: boolean;
    streetViewPanoId?: string;
  }) => void;
  onStreetViewPreview?: (coords: { lat: number; lng: number }) => void;
  placeholder?: string;
  disabled?: boolean;
  coordinates?: { lat: number; lng: number } | null;
  streetViewStatus?: 'unchecked' | 'checking' | 'available' | 'unavailable';
  isConfirmed?: boolean;
  compact?: boolean;
  mapsLoaded?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  onStreetViewPreview,
  placeholder = 'Search for an address...',
  disabled = false,
  coordinates,
  streetViewStatus,
  isConfirmed,
  compact = false,
  mapsLoaded = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStreetView, setIsCheckingStreetView] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mapsLoaded && window.google?.maps?.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
    }
  }, [mapsLoaded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
        autocompleteServiceRef.current!.getPlacePredictions(
          {
            input,
            types: ['geocode'],
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          }
        );
      });
      setSuggestions(response);
      setIsOpen(response.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setIsOpen(false);
    setIsCheckingStreetView(true);
    onChange(suggestion.description);

    try {
      const placeDetails = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
        placesServiceRef.current!.getDetails(
          {
            placeId: suggestion.place_id,
            fields: ['geometry', 'formatted_address'],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              resolve(null);
            }
          }
        );
      });

      if (placeDetails?.geometry?.location) {
        const coords = {
          lat: placeDetails.geometry.location.lat(),
          lng: placeDetails.geometry.location.lng(),
        };

        const streetViewResult = await checkStreetViewCoverage(coords.lat, coords.lng);

        onLocationSelect({
          address: placeDetails.formatted_address || suggestion.description,
          coordinates: coords,
          streetViewAvailable: streetViewResult.available,
          streetViewPanoId: streetViewResult.nearestPanoId,
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsCheckingStreetView(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const getStatusIcon = () => {
    if (isLoading || isCheckingStreetView || streetViewStatus === 'checking') {
      return <Loader2 size={16} className={styles.spinner} />;
    }
    if (streetViewStatus === 'available' && isConfirmed) {
      return <Check size={16} className={styles.confirmedIcon} />;
    }
    if (streetViewStatus === 'available') {
      return <MapPin size={16} className={styles.availableIcon} />;
    }
    if (streetViewStatus === 'unavailable') {
      return <AlertCircle size={16} className={styles.unavailableIcon} />;
    }
    if (coordinates) {
      return <MapPin size={16} className={styles.hasCoordinatesIcon} />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (streetViewStatus === 'checking') return 'Checking Street View...';
    if (streetViewStatus === 'available' && isConfirmed) return 'Location confirmed';
    if (streetViewStatus === 'available') return 'Street View available - click to preview';
    if (streetViewStatus === 'unavailable') return 'No Street View coverage at this location';
    return null;
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${streetViewStatus === 'unavailable' ? styles.inputError : ''} ${isConfirmed ? styles.inputConfirmed : ''}`}
        />
        <div className={styles.inputActions}>
          {getStatusIcon()}
          {value && !disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          {coordinates && streetViewStatus === 'available' && onStreetViewPreview && (
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => onStreetViewPreview(coordinates)}
              title="Preview Street View"
            >
              <Eye size={16} />
            </button>
          )}
        </div>
      </div>

      {getStatusMessage() && (
        <div className={`${styles.statusMessage} ${streetViewStatus === 'unavailable' ? styles.statusError : streetViewStatus === 'available' ? styles.statusSuccess : ''}`}>
          {getStatusMessage()}
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className={styles.dropdown}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={styles.suggestion}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin size={14} className={styles.suggestionIcon} />
              <div className={styles.suggestionText}>
                <span className={styles.suggestionMain}>
                  {suggestion.structured_formatting.main_text}
                </span>
                <span className={styles.suggestionSecondary}>
                  {suggestion.structured_formatting.secondary_text}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
