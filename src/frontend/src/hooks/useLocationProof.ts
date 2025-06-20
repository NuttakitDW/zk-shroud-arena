'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { zkProofService } from '../services/zkProofService';
import {
  ZkProof,
  LocationCoordinates,
  H3Index,
  ProveResult,
  VerifyResult,
  ZkProofError,
  ZkProofErrorType
} from '../types/zkProof';
import { PrivacyLocation } from '../components/Location/LocationTracker';

// Battle royale specific types
export interface LocationVerificationState {
  isGenerating: boolean;
  isVerifying: boolean; 
  lastProof: ZkProof | null;
  lastProofTimestamp: number;
  error: ZkProofError | null;
  verificationHistory: LocationVerification[];
  nextProofRequired: number;
  antiCheatScore: number; // 0-100, higher = more suspicious
}

export interface LocationVerification {
  id: string;
  timestamp: number;
  coordinates: LocationCoordinates;
  proof: ZkProof;
  verified: boolean;
  zone: string;
  movementDistance: number;
  movementSpeed: number; // meters per second
  suspicious: boolean;
}

export interface AntiCheatDetection {
  speedViolation: boolean;
  teleportDetection: boolean;
  impossibleMovement: boolean;
  proofReplay: boolean;
  locationSpoofing: boolean;
  reasonableMoveDistance: number; // maximum reasonable movement distance
}

export interface UseLocationProofOptions {
  autoGenerateProofs?: boolean;
  proofInterval?: number; // milliseconds between automatic proofs
  maxMovementSpeed?: number; // meters per second
  h3Resolution?: number;
  enableAntiCheat?: boolean;
  onProofGenerated?: (proof: ZkProof) => void;
  onVerificationComplete?: (verification: LocationVerification) => void;
  onAntiCheatAlert?: (detection: AntiCheatDetection) => void;
}

export interface UseLocationProofReturn {
  state: LocationVerificationState;
  generateLocationProof: (location: LocationCoordinates, zone?: string) => Promise<ProveResult>;
  verifyLocationProof: (proof: ZkProof) => Promise<VerifyResult>;
  validatePlayerMovement: (
    previousLocation: LocationCoordinates,
    currentLocation: LocationCoordinates,
    timeDelta: number
  ) => AntiCheatDetection;
  getPlayerTrustScore: () => number;
  clearVerificationHistory: () => void;
  isLocationReasonable: (location: LocationCoordinates) => boolean;
  getMovementMetrics: () => {
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
    suspiciousMovements: number;
  };
}

// Default H3 map for battle royale area - represents valid game zones
const DEFAULT_H3_MAP: H3Index[] = [
  '85283473fffffff',
  '85283477fffffff', 
  '8528347bfffffff',
  '8528347ffffffff',
  '85283463fffffff',
  '85283467fffffff',
  '8528346bfffffff',
  '8528346ffffffff'
];

// Battle royale constants
const DEFAULT_OPTIONS: Required<UseLocationProofOptions> = {
  autoGenerateProofs: true,
  proofInterval: 30000, // 30 seconds
  maxMovementSpeed: 15, // 15 m/s (running speed)
  h3Resolution: 5,
  enableAntiCheat: true,
  onProofGenerated: () => {},
  onVerificationComplete: () => {},
  onAntiCheatAlert: () => {}
};

/**
 * Hook for ZK location proofs in battle royale game
 * Provides anti-cheat location verification and movement validation
 */
export const useLocationProof = (
  options: UseLocationProofOptions = {}
): UseLocationProofReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<LocationVerificationState>({
    isGenerating: false,
    isVerifying: false,
    lastProof: null,
    lastProofTimestamp: 0,
    error: null,
    verificationHistory: [],
    nextProofRequired: Date.now(),
    antiCheatScore: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationCoordinates | null>(null);
  const lastMovementRef = useRef<{
    location: LocationCoordinates;
    timestamp: number;
    speed: number;
  } | null>(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((
    coord1: LocationCoordinates, 
    coord2: LocationCoordinates
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lon - coord1.lon) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Generate ZK proof for current location
  const generateLocationProof = useCallback(async (
    location: LocationCoordinates,
    zone?: string
  ): Promise<ProveResult> => {
    if (state.isGenerating) {
      return {
        success: false,
        error: {
          name: 'ProofGenerationInProgress',
          message: 'Proof generation already in progress',
          type: ZkProofErrorType.VALIDATION_ERROR,
          retryable: false
        } as ZkProofError
      };
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const result = await zkProofService.generateProof(
        location,
        config.h3Resolution,
        DEFAULT_H3_MAP,
        { useCache: true }
      );

      if (result.success) {
        const verification: LocationVerification = {
          id: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          coordinates: location,
          proof: result.data,
          verified: false,
          zone: zone || 'unknown',
          movementDistance: lastLocationRef.current 
            ? calculateDistance(lastLocationRef.current, location) 
            : 0,
          movementSpeed: 0,
          suspicious: false
        };

        // Calculate movement speed if we have previous location
        if (lastMovementRef.current) {
          const timeDelta = (Date.now() - lastMovementRef.current.timestamp) / 1000;
          const distance = calculateDistance(lastMovementRef.current.location, location);
          verification.movementSpeed = timeDelta > 0 ? distance / timeDelta : 0;
          
          // Check for suspicious movement
          if (verification.movementSpeed > config.maxMovementSpeed) {
            verification.suspicious = true;
          }
        }

        setState(prev => ({
          ...prev,
          isGenerating: false,
          lastProof: result.data,
          lastProofTimestamp: Date.now(),
          verificationHistory: [...prev.verificationHistory, verification].slice(-50), // Keep last 50
          nextProofRequired: Date.now() + config.proofInterval
        }));

        // Update tracking refs
        lastLocationRef.current = location;
        lastMovementRef.current = {
          location,
          timestamp: Date.now(),
          speed: verification.movementSpeed
        };

        config.onProofGenerated(result.data);
        return result;
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: result.error
        }));
        return result;
      }
    } catch (error) {
      const zkError = {
        name: 'ProofGenerationError',
        message: String(error),
        type: ZkProofErrorType.SERVER_ERROR,
        retryable: true
      } as ZkProofError;

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: zkError
      }));

      return { success: false, error: zkError };
    }
  }, [state.isGenerating, config, calculateDistance]);

  // Verify a ZK proof
  const verifyLocationProof = useCallback(async (
    proof: ZkProof
  ): Promise<VerifyResult> => {
    if (state.isVerifying) {
      return {
        success: false,
        error: {
          name: 'VerificationInProgress',
          message: 'Verification already in progress',
          type: ZkProofErrorType.VALIDATION_ERROR,
          retryable: false
        } as ZkProofError
      };
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const result = await zkProofService.verifyProof(
        proof.proof,
        proof.public_inputs
      );

      setState(prev => ({ ...prev, isVerifying: false }));

      // Update verification history if this proof exists
      if (result.success) {
        setState(prev => ({
          ...prev,
          verificationHistory: prev.verificationHistory.map(v => 
            v.proof.proof === proof.proof 
              ? { ...v, verified: result.data.valid }
              : v
          )
        }));

        // Find the verification and trigger callback
        const verification = state.verificationHistory.find(v => v.proof.proof === proof.proof);
        if (verification) {
          config.onVerificationComplete({ ...verification, verified: result.data.valid });
        }
      }

      return result;
    } catch (error) {
      const zkError = {
        name: 'VerificationError',
        message: String(error),
        type: ZkProofErrorType.SERVER_ERROR,
        retryable: true
      } as ZkProofError;

      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: zkError
      }));

      return { success: false, error: zkError };
    }
  }, [state.isVerifying, state.verificationHistory, config]);

  // Validate player movement for anti-cheat
  const validatePlayerMovement = useCallback((
    previousLocation: LocationCoordinates,
    currentLocation: LocationCoordinates,
    timeDelta: number // seconds
  ): AntiCheatDetection => {
    const distance = calculateDistance(previousLocation, currentLocation);
    const speed = timeDelta > 0 ? distance / timeDelta : 0;
    const reasonableMoveDistance = config.maxMovementSpeed * timeDelta;

    const detection: AntiCheatDetection = {
      speedViolation: speed > config.maxMovementSpeed * 1.5, // 50% tolerance
      teleportDetection: distance > reasonableMoveDistance * 2, // 200% tolerance  
      impossibleMovement: speed > 50, // 50 m/s is impossible for human
      proofReplay: false, // Would need proof content analysis
      locationSpoofing: false, // Would need additional GPS validation
      reasonableMoveDistance
    };

    // Calculate suspicion level
    let suspicionIncrease = 0;
    if (detection.speedViolation) suspicionIncrease += 10;
    if (detection.teleportDetection) suspicionIncrease += 25;
    if (detection.impossibleMovement) suspicionIncrease += 50;

    if (suspicionIncrease > 0) {
      setState(prev => ({
        ...prev,
        antiCheatScore: Math.min(100, prev.antiCheatScore + suspicionIncrease)
      }));

      config.onAntiCheatAlert(detection);
    } else {
      // Gradually reduce suspicion for good behavior
      setState(prev => ({
        ...prev,
        antiCheatScore: Math.max(0, prev.antiCheatScore - 1)
      }));
    }

    return detection;
  }, [calculateDistance, config]);

  // Get player trust score (0-100, higher = more trustworthy)
  const getPlayerTrustScore = useCallback((): number => {
    const baseScore = 100 - state.antiCheatScore;
    const historyBonus = Math.min(20, state.verificationHistory.length * 2);
    const verificationRate = state.verificationHistory.length > 0
      ? state.verificationHistory.filter(v => v.verified).length / state.verificationHistory.length
      : 0;
    const verificationBonus = verificationRate * 10;

    return Math.max(0, Math.min(100, baseScore + historyBonus + verificationBonus));
  }, [state.antiCheatScore, state.verificationHistory]);

  // Clear verification history
  const clearVerificationHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      verificationHistory: [],
      antiCheatScore: 0
    }));
    lastLocationRef.current = null;
    lastMovementRef.current = null;
  }, []);

  // Check if location is reasonable for the game
  const isLocationReasonable = useCallback((location: LocationCoordinates): boolean => {
    // Basic bounds checking - could be enhanced with game-specific zones
    const isValidLatLon = location.lat >= -90 && location.lat <= 90 &&
                         location.lon >= -180 && location.lon <= 180;
    
    // Check if location is within expected game area (example bounds)
    const gameAreaBounds = {
      minLat: 37.7, maxLat: 37.8,  // San Francisco area for example
      minLon: -122.5, maxLon: -122.3
    };
    
    const inGameArea = location.lat >= gameAreaBounds.minLat && 
                      location.lat <= gameAreaBounds.maxLat &&
                      location.lon >= gameAreaBounds.minLon && 
                      location.lon <= gameAreaBounds.maxLon;

    return isValidLatLon && inGameArea;
  }, []);

  // Get movement metrics
  const getMovementMetrics = useCallback(() => {
    const history = state.verificationHistory;
    if (history.length === 0) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        suspiciousMovements: 0
      };
    }

    const totalDistance = history.reduce((sum, v) => sum + v.movementDistance, 0);
    const speeds = history.map(v => v.movementSpeed).filter(s => s > 0);
    const averageSpeed = speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const suspiciousMovements = history.filter(v => v.suspicious).length;

    return {
      totalDistance,
      averageSpeed,
      maxSpeed,
      suspiciousMovements
    };
  }, [state.verificationHistory]);

  // Auto-generate proofs if enabled
  useEffect(() => {
    if (!config.autoGenerateProofs) return;

    intervalRef.current = setInterval(() => {
      if (Date.now() >= state.nextProofRequired && 
          !state.isGenerating && 
          lastLocationRef.current) {
        generateLocationProof(lastLocationRef.current);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.autoGenerateProofs, state.nextProofRequired, state.isGenerating, generateLocationProof]);

  return {
    state,
    generateLocationProof,
    verifyLocationProof,
    validatePlayerMovement,
    getPlayerTrustScore,
    clearVerificationHistory,
    isLocationReasonable,
    getMovementMetrics
  };
};