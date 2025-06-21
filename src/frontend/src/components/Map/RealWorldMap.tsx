'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService, LocationUpdate, LocationError } from '../../services/locationService';
import { LocationCoordinates } from '../../types/zkProof';
import { GamePhase } from '../../types/gameState';
import { H3Zone, ZoneDrawingState } from './types';
import { GameManagerControls } from './GameManagerControls';
import { H3Layer } from './H3Layer';
import * as h3 from 'h3-js';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface RealWorldMapProps {
  className?: string;
  height?: string;
  gamePhase?: GamePhase;
  onLocationUpdate?: (location: LocationCoordinates) => void;
  onLocationError?: (error: LocationError) => void;
  onZKProofRequest?: (location: LocationCoordinates) => void;
  showAccuracyCircle?: boolean;
  enableLocationTracking?: boolean;
  centerOnUser?: boolean;
  isGameManager?: boolean;
  onZoneCreate?: (zone: H3Zone) => void;
  existingZones?: H3Zone[];
}

interface LocationPermissionPromptProps {
  onRequestPermission: () => void;
  onCancel: () => void;
  error?: LocationError;
}

const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({
  onRequestPermission,
  onCancel,
  error
}) => (
  <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-[1000]">
    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          Location Access Required
        </h3>
        
        <p className="text-gray-300 mb-4">
          ZK Shroud Arena needs access to your location to create zero-knowledge proofs of your position for fair gameplay.
        </p>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">
              {error.type === 'PERMISSION_DENIED' && 'Location access was denied. Please enable location permissions in your browser settings.'}
              {error.type === 'POSITION_UNAVAILABLE' && 'Unable to determine your location. Please check your GPS/location services.'}
              {error.type === 'TIMEOUT' && 'Location request timed out. Please try again.'}
              {error.type === 'UNSUPPORTED' && 'Your browser does not support location services.'}
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRequestPermission}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg transition-all"
          >
            Allow Location
          </button>
        </div>
        
        <p className="text-gray-400 text-xs mt-3">
          Your exact location is protected by zero-knowledge proofs and never shared with other players.
        </p>
      </div>
    </div>
  </div>
);

interface MapControllerProps {
  userLocation: LocationCoordinates | null;
  centerOnUser: boolean;
}

const MapController: React.FC<MapControllerProps> = ({ userLocation, centerOnUser }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && centerOnUser) {
      map.setView([userLocation.latitude, userLocation.longitude], 16);
    }
  }, [map, userLocation, centerOnUser]);

  return null;
};

interface MapClickHandlerProps {
  onMapClick: (location: LocationCoordinates) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    }
  });

  return null;
};

export const RealWorldMap: React.FC<RealWorldMapProps> = ({
  className = '',
  height = '400px',
  gamePhase = GamePhase.LOBBY,
  onLocationUpdate,
  onLocationError,
  onZKProofRequest,
  showAccuracyCircle = true,
  enableLocationTracking = true,
  centerOnUser = true,
  isGameManager = false,
  onZoneCreate,
  existingZones = []
}) => {
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to San Francisco
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  
  // Zone drawing state
  const [zones, setZones] = useState<H3Zone[]>(existingZones);
  const [drawingState, setDrawingState] = useState<ZoneDrawingState>({
    isDrawing: false,
    currentZone: [],
    zoneType: 'safe',
    pointValue: 10,
    drawMode: 'single'
  });
  const [currentDrawnIndices, setCurrentDrawnIndices] = useState<string[]>([]);

  // Handle location updates
  const handleLocationUpdate = useCallback((update: LocationUpdate) => {
    setUserLocation(update.coordinates);
    setLocationAccuracy(update.accuracy);
    setLocationError(null);
    
    if (onLocationUpdate) {
      onLocationUpdate(update.coordinates);
    }

    // Auto-generate ZK proof when location changes significantly
    if (onZKProofRequest && gamePhase === GamePhase.ACTIVE) {
      onZKProofRequest(update.coordinates);
    }
  }, [onLocationUpdate, onZKProofRequest, gamePhase]);

  // Handle location errors
  const handleLocationError = useCallback((error: LocationError) => {
    setLocationError(error);
    setIsTracking(false);
    
    if (onLocationError) {
      onLocationError(error);
    }
  }, [onLocationError]);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      setLocationError(null);
      const location = await locationService.requestLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
      
      handleLocationUpdate(location);
      setShowPermissionPrompt(false);
      setHasRequestedLocation(true);
      
      if (enableLocationTracking) {
        setIsTracking(true);
        locationService.watchLocation(
          handleLocationUpdate,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          }
        );
      }
    } catch (error) {
      handleLocationError(error as LocationError);
    }
  }, [enableLocationTracking, handleLocationUpdate, handleLocationError]);

  // Initialize location when component mounts
  useEffect(() => {
    const permissionState = locationService.getPermissionState();
    
    if (permissionState.granted) {
      // Permission already granted, get location
      requestLocationPermission();
    } else if (!permissionState.denied && !hasRequestedLocation) {
      // Show permission prompt
      setShowPermissionPrompt(true);
    }

    return () => {
      locationService.stopWatching();
    };
  }, [requestLocationPermission, hasRequestedLocation]);

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  // Handle map clicks for manual location selection
  const handleMapClick = useCallback((location: LocationCoordinates) => {
    if (gamePhase === GamePhase.ACTIVE && onZKProofRequest && !drawingState.isDrawing) {
      onZKProofRequest(location);
    }
  }, [gamePhase, onZKProofRequest, drawingState.isDrawing]);

  // Handle zone confirmation
  const handleConfirmZone = useCallback((zoneData: { h3Indices: string[], type: 'safe' | 'danger', pointValue: number, name: string }) => {
    const newZones: H3Zone[] = currentDrawnIndices.map((h3Index, index) => {
      const [lat, lng] = h3.cellToLatLng(h3Index);
      return {
        id: `zone-${Date.now()}-${index}`,
        h3Index,
        center: { latitude: lat, longitude: lng },
        type: zoneData.type,
        pointValue: zoneData.pointValue,
        name: zoneData.name,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    });

    setZones(prev => [...prev, ...newZones]);
    setCurrentDrawnIndices([]);
    
    // Notify parent component
    if (onZoneCreate) {
      newZones.forEach(zone => onZoneCreate(zone));
    }
  }, [currentDrawnIndices, onZoneCreate]);

  // Handle undo
  const handleUndo = useCallback(() => {
    setCurrentDrawnIndices(prev => prev.slice(0, -1));
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setCurrentDrawnIndices([]);
  }, []);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {showPermissionPrompt && (
        <LocationPermissionPrompt
          onRequestPermission={requestLocationPermission}
          onCancel={() => setShowPermissionPrompt(false)}
          error={locationError || undefined}
        />
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          userLocation={userLocation}
          centerOnUser={centerOnUser}
        />
        
        {!isGameManager && <MapClickHandler onMapClick={handleMapClick} />}
        
        {/* H3 Zone Layer for Game Managers */}
        {isGameManager && (
          <H3Layer
            zones={zones}
            drawingState={drawingState}
            currentDrawnIndices={currentDrawnIndices}
            onDrawnIndicesChange={setCurrentDrawnIndices}
            showPreview={true}
          />
        )}
        
        {userLocation && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div style="
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(45deg, #06b6d4, #8b5cf6);
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    animation: pulse 2s infinite;
                  "></div>
                  <style>
                    @keyframes pulse {
                      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                    }
                  </style>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            />
            
            {showAccuracyCircle && locationAccuracy > 0 && (
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={locationAccuracy}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  color: '#3b82f6',
                  weight: 2,
                  opacity: 0.5
                }}
              />
            )}
          </>
        )}
      </MapContainer>
      
      {/* Location Status Overlay */}
      <div className="absolute top-4 left-4 z-[400]">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              isTracking ? 'bg-green-400' : userLocation ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-sm font-medium">
              {isTracking ? 'Live Tracking' : userLocation ? 'Location Found' : 'No Location'}
            </span>
          </div>
          
          {userLocation && (
            <div className="text-xs text-gray-300">
              <div>Lat: {userLocation.latitude.toFixed(6)}</div>
              <div>Lng: {userLocation.longitude.toFixed(6)}</div>
              {locationAccuracy > 0 && (
                <div>Accuracy: ±{Math.round(locationAccuracy)}m</div>
              )}
            </div>
          )}
          
          {locationError && (
            <div className="text-xs text-red-300 mt-1">
              {locationError.message}
            </div>
          )}
        </div>
      </div>
      
      {/* Game Phase Indicator */}
      {gamePhase === GamePhase.ACTIVE && (
        <div className="absolute top-4 right-4 z-[400]">
          <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs text-cyan-300 font-medium">
                ZK PROOF ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Manager Controls */}
      {isGameManager && (
        <GameManagerControls
          onZoneDrawingStateChange={setDrawingState}
          onConfirmZone={handleConfirmZone}
          onUndo={handleUndo}
          onClear={handleClear}
          currentZoneCount={currentDrawnIndices.length}
          isDrawing={drawingState.isDrawing}
        />
      )}
    </div>
  );
};

export default RealWorldMap;