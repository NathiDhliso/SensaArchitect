export interface StoredPanorama {
    id: string;
    palaceId: string;
    buildingId: string;
    imageBlob: Blob;
    width: number;
    height: number;
    capturedAt: string;
    originalPanoId?: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface MarkerPlacement {
    id: string;
    conceptId: string;
    conceptName: string;
    yaw: number;
    pitch: number;
}

export interface PanoramaViewState {
    yaw: number;
    pitch: number;
    hfov: number;
}
