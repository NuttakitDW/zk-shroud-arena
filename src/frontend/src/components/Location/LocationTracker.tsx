'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface PrivacyLocation {
  zoneId: string;
  zoneName: string;
  approximateDistance: 'very-close' | 'close' | 'medium' | 'far' | 'very-far';
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  lastUpdated: number;
}

export interface LocationTrackerProps {
  enabled: boolean;
  privacyLevel: 'high' | 'medium' | 'low';
  updateInterval?: number; // milliseconds
  onLocationUpdate?: (location: PrivacyLocation | null) => void;
  onError?: (error: string) => void;
  className?: string;
  showStatus?: boolean;
  showAccuracy?: boolean;
  allowHighAccuracy?: boolean;
}

type LocationStatus = 'disabled' | 'requesting' | 'tracking' | 'error' | 'permission-denied';

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  enabled,
  privacyLevel,
  updateInterval = 10000,
  onLocationUpdate,
  onError,
  className = '',
  showStatus = true,
  showAccuracy = true,
  allowHighAccuracy = false,
}) => {
  const [status, setStatus] = useState<LocationStatus>('disabled');
  const [currentLocation, setCurrentLocation] = useState<PrivacyLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Privacy configuration based on privacy level
  const privacyConfig = {
    high: {
      zoneRadius: 500, // meters
      minUpdateInterval: 30000, // 30 seconds
      coordinateObfuscation: 0.001, // ~100 meters
      showDirection: false,
      showDistance: false,
    },
    medium: {
      zoneRadius: 200, // meters
      minUpdateInterval: 15000, // 15 seconds
      coordinateObfuscation: 0.0005, // ~50 meters
      showDirection: true,
      showDistance: false,
    },
    low: {
      zoneRadius: 100, // meters
      minUpdateInterval: 5000, // 5 seconds
      coordinateObfuscation: 0.0001, // ~10 meters
      showDirection: true,
      showDistance: true,
    },
  };

  const currentConfig = privacyConfig[privacyLevel];

  // Convert raw coordinates to privacy-preserving location
  const createPrivacyLocation = useCallback((position: GeolocationPosition): PrivacyLocation => {
    // Obfuscate coordinates based on privacy level
    const obfuscatedLat = Math.round(position.latitude / currentConfig.coordinateObfuscation) * currentConfig.coordinateObfuscation;
    const obfuscatedLng = Math.round(position.longitude / currentConfig.coordinateObfuscation) * currentConfig.coordinateObfuscation;

    // Generate zone ID based on obfuscated coordinates
    const zoneId = `zone_${Math.abs(obfuscatedLat * 1000).toFixed(0)}_${Math.abs(obfuscatedLng * 1000).toFixed(0)}`;
    
    // Generate zone name
    const zoneName = generateZoneName(obfuscatedLat, obfuscatedLng);
    
    // Calculate approximate distance (randomized for privacy)
    const distances: PrivacyLocation['approximateDistance'][] = ['very-close', 'close', 'medium', 'far', 'very-far'];
    const approximateDistance = distances[Math.floor(Math.random() * distances.length)];
    
    // Calculate direction (with some randomization for privacy)
    const directions: PrivacyLocation['direction'][] = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    return {
      zoneId,
      zoneName,
      approximateDistance: currentConfig.showDistance ? approximateDistance : 'medium',
      direction: currentConfig.showDirection ? direction : 'north',
      lastUpdated: Date.now(),
    };
  }, [currentConfig]);

  // Generate human-readable zone names
  const generateZoneName = (lat: number, lng: number): string => {
    const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
    const suffixes = ['Sector', 'Zone', 'District', 'Area', 'Region', 'Quadrant'];
    
    const prefixIndex = Math.abs(Math.floor(lat * 100)) % prefixes.length;
    const suffixIndex = Math.abs(Math.floor(lng * 100)) % suffixes.length;
    const number = Math.abs(Math.floor((lat + lng) * 1000)) % 99 + 1;
    
    return `${prefixes[prefixIndex]} ${suffixes[suffixIndex]} ${number}`;
  };

  // Handle successful position update
  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    setAccuracy(position.accuracy);
    setError(null);
    setStatus('tracking');

    const privacyLocation = createPrivacyLocation(position);
    setCurrentLocation(privacyLocation);
    onLocationUpdate?.(privacyLocation);
  }, [createPrivacyLocation, onLocationUpdate]);

  // Handle geolocation errors
  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Location error';
    let newStatus: LocationStatus = 'error';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        newStatus = 'permission-denied';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
      default:
        errorMessage = 'Unknown location error';
        break;
    }

    setError(errorMessage);
    setStatus(newStatus);
    onError?.(errorMessage);
  }, [onError]);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      const error = 'Geolocation not supported by this browser';
      setError(error);
      setStatus('error');
      onError?.(error);
      return;
    }

    setStatus('requesting');

    const options: PositionOptions = {
      enableHighAccuracy: allowHighAccuracy,
      timeout: 10000,
      maximumAge: Math.max(updateInterval, currentConfig.minUpdateInterval),
    };

    navigator.geolocation.getCurrentPosition(
      (position) => handlePositionSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }),
      handlePositionError,
      options
    );
  }, [allowHighAccuracy, updateInterval, currentConfig.minUpdateInterval, handlePositionSuccess, handlePositionError, onError]);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || !enabled) return;

    // Clear existing tracking
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const options: PositionOptions = {
      enableHighAccuracy: allowHighAccuracy,
      timeout: 10000,
      maximumAge: Math.max(updateInterval, currentConfig.minUpdateInterval),
    };

    // Use watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => handlePositionSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }),
      handlePositionError,
      options
    );

    // Also set up interval-based updates for privacy compliance
    intervalRef.current = setInterval(() => {
      getCurrentPosition();
    }, Math.max(updateInterval, currentConfig.minUpdateInterval));

  }, [enabled, allowHighAccuracy, updateInterval, currentConfig.minUpdateInterval, handlePositionSuccess, handlePositionError, getCurrentPosition]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('disabled');
    setCurrentLocation(null);
    setError(null);
  }, []);

  // Effect to handle enabled state changes
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);

  // Status indicator colors
  const getStatusColor = (status: LocationStatus): string => {
    switch (status) {
      case 'tracking': return 'text-green-400';
      case 'requesting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'permission-denied': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  // Status indicator text
  const getStatusText = (status: LocationStatus): string => {
    switch (status) {
      case 'disabled': return 'Location Disabled';
      case 'requesting': return 'Requesting Location...';
      case 'tracking': return 'Location Active';
      case 'error': return 'Location Error';
      case 'permission-denied': return 'Permission Denied';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Location Tracker</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'tracking' ? 'bg-green-400 animate-pulse' : status === 'requesting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'}`}></div>
          {showStatus && (
            <span className={`text-sm ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          )}
        </div>
      </div>

      {/* Privacy Level Indicator */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Privacy Level:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            privacyLevel === 'high' ? 'bg-red-900 text-red-200' :
            privacyLevel === 'medium' ? 'bg-yellow-900 text-yellow-200' :
            'bg-green-900 text-green-200'
          }`}>
            {privacyLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className="bg-gray-800 rounded p-3 mb-3">
          <div className="text-white font-medium mb-2">Current Zone</div>
          <div className="space-y-1 text-sm">
            <div className="text-gray-300">
              <span className="text-gray-500">Zone:</span> {currentLocation.zoneName}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">ID:</span> {currentLocation.zoneId}
            </div>
            {currentConfig.showDirection && (
              <div className="text-gray-300">
                <span className="text-gray-500">Direction:</span> {currentLocation.direction}
              </div>
            )}
            {currentConfig.showDistance && (
              <div className="text-gray-300">
                <span className="text-gray-500">Distance:</span> {currentLocation.approximateDistance}
              </div>
            )}
            <div className="text-gray-500 text-xs">
              Updated: {new Date(currentLocation.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Accuracy Display */}
      {showAccuracy && accuracy !== null && (
        <div className="mb-3">
          <div className="text-sm text-gray-400">
            Location Accuracy: ±{Math.round(accuracy)}m
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${
                accuracy < 50 ? 'bg-green-500' : 
                accuracy < 100 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${Math.max(10, Math.min(100, (200 - accuracy) / 2))}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded p-2 mb-3">
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={getCurrentPosition}
          disabled={!enabled || status === 'requesting'}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded font-medium transition-colors"
        >
          {status === 'requesting' ? 'Getting Location...' : 'Update Location'}
        </button>
        
        {status === 'permission-denied' && (
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded font-medium transition-colors"
          >
            Reload Page
          </button>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-3 text-xs text-gray-500 bg-gray-800 rounded p-2">
        <div className="font-medium mb-1">Privacy Protection Active</div>
        <div>Your exact location is never stored or transmitted. Only approximate zone information is used for gameplay.</div>
      </div>
    </div>
  );
};

export default LocationTracker;