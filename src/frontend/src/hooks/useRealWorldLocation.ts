/**
 * Real World Location Hook for ZK Shroud Arena
 * Manages real-world location tracking with ZK proof integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { locationService, LocationUpdate, LocationError } from '../services/locationService';
import { generateLocationProofControlled, verifyLocationProofControlled } from '../services/apiController';
import { LocationCoordinates, ZkProof, H3Index } from '../types/zkProof';
import { GamePhase } from '../types/gameState';
import { h3Service } from '../services/h3Service';
import { geofenceMonitor, GeofenceState, H3GeofenceEvent, ZoneProximityInfo } from '../services/geofenceMonitor';

export interface LocationTrackingOptions {
  enableAutoProofs?: boolean;
  proofInterval?: number; // seconds between automatic proofs
  movementThreshold?: number; // meters before triggering new proof
  enableHighAccuracy?: boolean;
  maxAge?: number; // milliseconds
  timeout?: number; // milliseconds
  enableGeofencing?: boolean;
  activeZones?: H3Index[];
  h3Resolution?: number;
  proximityThreshold?: number; // meters for proximity alerts
}

export interface RealWorldLocationState {
  currentLocation: LocationCoordinates | null;
  locationAccuracy: number;
  isTracking: boolean;
  hasPermission: boolean;
  permissionDenied: boolean;
  lastProof: ZkProof | null;
  proofHistory: ZkProof[];
  error: LocationError | null;
  isGeneratingProof: boolean;
  lastProofTime: number | null;
  currentH3Index: H3Index | null;
  nearbyZones: H3Index[];
  geofenceState: GeofenceState | null;
  lastGeofenceEvent: H3GeofenceEvent | null;
  proximityAlerts: ZoneProximityInfo[];
}

export interface LocationProofResult {
  proof: ZkProof;
  location: LocationCoordinates;
  timestamp: number;
}

const DEFAULT_OPTIONS: Required<LocationTrackingOptions> = {
  enableAutoProofs: true,
  proofInterval: 30, // 30 seconds
  movementThreshold: 10, // 10 meters
  enableHighAccuracy: true,
  maxAge: 60000, // 1 minute
  timeout: 10000, // 10 seconds
  enableGeofencing: true,
  activeZones: [],
  h3Resolution: 8,
  proximityThreshold: 50 // 50 meters
};

export const useRealWorldLocation = (
  gamePhase: GamePhase = GamePhase.LOBBY,
  options: LocationTrackingOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<RealWorldLocationState>({
    currentLocation: null,
    locationAccuracy: 0,
    isTracking: false,
    hasPermission: false,
    permissionDenied: false,
    lastProof: null,
    proofHistory: [],
    error: null,
    isGeneratingProof: false,
    lastProofTime: null,
    currentH3Index: null,
    nearbyZones: [],
    geofenceState: null,
    lastGeofenceEvent: null,
    proximityAlerts: []
  });

  const lastLocationRef = useRef<LocationCoordinates | null>(null);
  const proofTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProofLocationRef = useRef<LocationCoordinates | null>(null);
  const geofenceEventHandlerRef = useRef<(event: H3GeofenceEvent) => void>();
  const proximityHandlerRef = useRef<(alerts: ZoneProximityInfo[]) => void>();

  // Handle location updates
  const handleLocationUpdate = useCallback((update: LocationUpdate) => {
    const newLocation = update.coordinates;
    
    // Calculate H3 index for current location
    const currentH3 = h3Service.latLngToH3(newLocation, opts.h3Resolution);
    
    // Get nearby zones if geofencing is enabled
    let nearbyZones: H3Index[] = [];
    if (opts.enableGeofencing && opts.activeZones.length > 0) {
      const neighbors = h3Service.getH3Neighbors(currentH3);
      nearbyZones = neighbors.filter(neighbor => opts.activeZones.includes(neighbor));
    }
    
    setState(prev => ({
      ...prev,
      currentLocation: newLocation,
      locationAccuracy: update.accuracy,
      error: null,
      hasPermission: true,
      permissionDenied: false,
      currentH3Index: currentH3,
      nearbyZones
    }));

    lastLocationRef.current = newLocation;

    // Auto-generate proof if conditions are met
    if (opts.enableAutoProofs && gamePhase === GamePhase.ACTIVE) {
      const now = Date.now();
      const timeSinceLastProof = state.lastProofTime ? now - state.lastProofTime : Infinity;
      const shouldGenerateTimeProof = timeSinceLastProof > opts.proofInterval * 1000;
      
      let shouldGenerateMovementProof = false;
      if (lastProofLocationRef.current) {
        const distance = locationService.calculateDistance(
          lastProofLocationRef.current,
          newLocation
        );
        shouldGenerateMovementProof = distance > opts.movementThreshold;
      }

      if (shouldGenerateTimeProof || shouldGenerateMovementProof || !lastProofLocationRef.current) {
        generateLocationProof(newLocation);
      }
    }
  }, [opts.enableAutoProofs, opts.proofInterval, opts.movementThreshold, gamePhase, state.lastProofTime]);

  // Handle location errors
  const handleLocationError = useCallback((error: LocationError) => {
    setState(prev => ({
      ...prev,
      error,
      isTracking: false,
      hasPermission: error.type !== 'PERMISSION_DENIED',
      permissionDenied: error.type === 'PERMISSION_DENIED',
    }));
  }, []);

  // Generate ZK proof for current location
  const generateLocationProof = useCallback(async (
    location?: LocationCoordinates
  ): Promise<LocationProofResult | null> => {
    const targetLocation = location || state.currentLocation;
    
    if (!targetLocation) {
      console.warn('No location available for proof generation');
      return null;
    }

    setState(prev => ({ ...prev, isGeneratingProof: true }));

    try {
      // Generate H3 indices for the target location
      const resolution = opts.h3Resolution;
      const targetH3 = h3Service.latLngToH3(targetLocation, resolution);
      
      // Get H3 cells within a small radius for the proof (including neighbors)
      const h3Map: H3Index[] = [targetH3, ...h3Service.getH3Neighbors(targetH3)];
      
      // Use the actual ZK proof service
      const proofResult = await generateLocationProofControlled(
        targetLocation,
        resolution,
        h3Map,
        { useCache: true, timeout: 15000 }
      );
      
      if (!proofResult.success) {
        throw new Error(`ZK proof generation failed: ${proofResult.error.message}`);
      }
      
      const proof = proofResult.data;
      const now = Date.now();

      const result: LocationProofResult = {
        proof,
        location: targetLocation,
        timestamp: now
      };

      setState(prev => ({
        ...prev,
        lastProof: proof,
        proofHistory: [...prev.proofHistory.slice(-9), proof], // Keep last 10 proofs
        isGeneratingProof: false,
        lastProofTime: now,
      }));

      lastProofLocationRef.current = targetLocation;

      return result;
    } catch (error) {
      console.error('Failed to generate location proof:', error);
      setState(prev => ({
        ...prev,
        isGeneratingProof: false,
        error: {
          code: 0,
          message: `Failed to generate ZK proof: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'POSITION_UNAVAILABLE'
        }
      }));
      return null;
    }
  }, [state.currentLocation, state.locationAccuracy, gamePhase]);

  // Verify a location proof
  const verifyLocationProofFn = useCallback(async (proof?: ZkProof): Promise<boolean> => {
    try {
      const targetProof = proof || state.lastProof;
      if (!targetProof) {
        console.warn('No proof available to verify');
        return false;
      }
      
      const verifyResult = await verifyLocationProofControlled(
        targetProof.proof,
        targetProof.public_inputs,
        { timeout: 10000 }
      );
      
      if (!verifyResult.success) {
        console.error('Proof verification failed:', verifyResult.error.message);
        return false;
      }
      
      return verifyResult.data.valid;
    } catch (error) {
      console.error('Failed to verify location proof:', error);
      return false;
    }
  }, [state.lastProof]);

  // Start location tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // First get current position
      const initialLocation = await locationService.requestLocation({
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maxAge
      });

      handleLocationUpdate(initialLocation);

      // Start watching for changes
      locationService.watchLocation(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maxAge
        }
      );

      // Start geofencing if enabled
      if (opts.enableGeofencing && opts.activeZones.length > 0) {
        geofenceMonitor.updateConfig({
          proximityThreshold: opts.proximityThreshold,
          zoneResolution: opts.h3Resolution
        });
        geofenceMonitor.startMonitoring(opts.activeZones);
      }

      setState(prev => ({ ...prev, isTracking: true }));
      return true;
    } catch (error) {
      handleLocationError(error as LocationError);
      return false;
    }
  }, [opts, handleLocationUpdate, handleLocationError]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    locationService.stopWatching();
    
    if (proofTimeoutRef.current) {
      clearTimeout(proofTimeoutRef.current);
      proofTimeoutRef.current = null;
    }

    // Stop geofencing if active
    if (opts.enableGeofencing) {
      geofenceMonitor.stopMonitoring();
    }

    setState(prev => ({ ...prev, isTracking: false }));
  }, [opts.enableGeofencing]);

  // Request current location without tracking
  const getCurrentLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    try {
      const location = await locationService.requestLocation({
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maxAge
      });
      
      handleLocationUpdate(location);
      return location.coordinates;
    } catch (error) {
      handleLocationError(error as LocationError);
      return null;
    }
  }, [opts, handleLocationUpdate, handleLocationError]);

  // Calculate distance from current location
  const calculateDistanceFromCurrent = useCallback((
    targetLocation: LocationCoordinates
  ): number | null => {
    if (!state.currentLocation) {
      return null;
    }
    
    return locationService.calculateDistance(state.currentLocation, targetLocation);
  }, [state.currentLocation]);

  // Get location proof status
  const getProofStatus = useCallback(() => {
    if (!state.lastProof) return 'none';
    if (state.isGeneratingProof) return 'generating';
    
    const now = Date.now();
    const timeSinceLastProof = state.lastProofTime ? now - state.lastProofTime : Infinity;
    const isRecentProof = timeSinceLastProof < opts.proofInterval * 1000 * 2; // 2x interval threshold
    
    return isRecentProof ? 'valid' : 'expired';
  }, [state.lastProof, state.isGeneratingProof, state.lastProofTime, opts.proofInterval]);

  // Handle geofence events
  const handleGeofenceEvent = useCallback((event: H3GeofenceEvent) => {
    setState(prev => ({
      ...prev,
      lastGeofenceEvent: event,
      geofenceState: geofenceMonitor.getState()
    }));

    // Trigger vibration for zone entry (if enabled)
    if (event.type === 'enter' && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }, []);

  // Handle proximity alerts
  const handleProximityAlerts = useCallback((alerts: ZoneProximityInfo[]) => {
    setState(prev => ({
      ...prev,
      proximityAlerts: alerts
    }));
  }, []);

  // Set up geofence event listeners
  useEffect(() => {
    if (opts.enableGeofencing && state.isTracking) {
      // Store handler references
      geofenceEventHandlerRef.current = handleGeofenceEvent;
      proximityHandlerRef.current = handleProximityAlerts;

      // Add listeners
      geofenceMonitor.addEventListener('enter', handleGeofenceEvent);
      geofenceMonitor.addEventListener('exit', handleGeofenceEvent);
      geofenceMonitor.addProximityListener(handleProximityAlerts);

      // Update geofence state
      setState(prev => ({
        ...prev,
        geofenceState: geofenceMonitor.getState()
      }));

      return () => {
        // Clean up listeners
        if (geofenceEventHandlerRef.current) {
          geofenceMonitor.removeEventListener('enter', geofenceEventHandlerRef.current);
          geofenceMonitor.removeEventListener('exit', geofenceEventHandlerRef.current);
        }
        if (proximityHandlerRef.current) {
          geofenceMonitor.removeProximityListener(proximityHandlerRef.current);
        }
      };
    }
  }, [opts.enableGeofencing, state.isTracking, handleGeofenceEvent, handleProximityAlerts]);

  // Update active zones when they change
  useEffect(() => {
    if (opts.enableGeofencing && state.isTracking && opts.activeZones.length > 0) {
      geofenceMonitor.updateActiveZones(opts.activeZones);
    }
  }, [opts.activeZones, opts.enableGeofencing, state.isTracking]);

  // Auto-start tracking based on game phase
  useEffect(() => {
    if (gamePhase === GamePhase.ACTIVE && !state.isTracking && !state.permissionDenied) {
      startTracking();
    } else if (gamePhase !== GamePhase.ACTIVE && state.isTracking) {
      stopTracking();
    }
  }, [gamePhase, state.isTracking, state.permissionDenied, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    // State
    ...state,
    proofStatus: getProofStatus(),
    
    // Actions
    startTracking,
    stopTracking,
    getCurrentLocation,
    generateLocationProof,
    verifyLocationProof: verifyLocationProofFn,
    calculateDistanceFromCurrent,
    
    // Geofencing actions
    updateActiveZones: (zones: H3Index[]) => {
      if (opts.enableGeofencing) {
        geofenceMonitor.updateActiveZones(zones);
        setState(prev => ({
          ...prev,
          geofenceState: geofenceMonitor.getState()
        }));
      }
    },
    
    getPlayerZonePath: () => {
      return opts.enableGeofencing ? geofenceMonitor.getPlayerPath() : [];
    },
    
    clearZonePath: () => {
      if (opts.enableGeofencing) {
        geofenceMonitor.clearPlayerPath();
      }
    },
    
    // H3 utilities
    getCurrentH3Cells: (radius = 1) => {
      if (!state.currentLocation) return [];
      const centerCell = h3Service.latLngToH3(state.currentLocation, opts.h3Resolution);
      return h3Service.getH3Disk(centerCell, radius);
    },
    
    getH3CellForLocation: (location: LocationCoordinates) => {
      return h3Service.latLngToH3(location, opts.h3Resolution);
    },
    
    isInZone: (zoneIndex: H3Index) => {
      return state.currentH3Index === zoneIndex;
    },
    
    getDistanceToZone: (zoneIndex: H3Index) => {
      if (!state.currentLocation) return null;
      const zoneCenter = h3Service.h3ToLatLng(zoneIndex);
      return h3Service.calculateDistance(state.currentLocation, zoneCenter);
    },
    
    // Utils
    hasLocationChanged: (threshold = opts.movementThreshold) => {
      if (!state.currentLocation || !lastProofLocationRef.current) return false;
      const distance = locationService.calculateDistance(
        lastProofLocationRef.current,
        state.currentLocation
      );
      return distance > threshold;
    },
    
    needsNewProof: () => {
      if (!state.lastProofTime) return true;
      const timeSinceLastProof = Date.now() - state.lastProofTime;
      return timeSinceLastProof > opts.proofInterval * 1000;
    }
  };
};

export default useRealWorldLocation;