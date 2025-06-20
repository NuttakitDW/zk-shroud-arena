'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocationProof, LocationVerificationState } from '../../hooks/useLocationProof';
import { useGameState } from '../../hooks/useGameState';
import { LocationCoordinates, ZkProof } from '../../types/zkProof';
import { GamePhase, ZKProofStatus } from '../../types/gameState';
import { PrivacyLocation } from '../Location/LocationTracker';

export interface ZKLocationVerifierProps {
  gameId: string;
  currentLocation: PrivacyLocation | null;
  realLocation?: LocationCoordinates; // For ZK proof generation
  onProofValidated?: (proof: ZkProof, valid: boolean) => void;
  onAntiCheatAlert?: (alertType: string, details: any) => void;
  className?: string;
  showDetails?: boolean;
  enableRealTimeVerification?: boolean;
}

export interface ProofSubmissionResult {
  success: boolean;
  proof?: ZkProof;
  trustScore: number;
  antiCheatFlags: string[];
  verificationTime: number;
}

export const ZKLocationVerifier: React.FC<ZKLocationVerifierProps> = ({
  gameId,
  currentLocation,
  realLocation,
  onProofValidated,
  onAntiCheatAlert,
  className = '',
  showDetails = true,
  enableRealTimeVerification = true
}) => {
  const { gameState, updateZKProofStatus, recordLocationProof } = useGameState();
  const [verificationStats, setVerificationStats] = useState({
    totalProofs: 0,
    validProofs: 0,
    failedProofs: 0,
    avgVerificationTime: 0,
    lastVerificationTime: 0
  });

  const {
    state: locationProofState,
    generateLocationProof,
    verifyLocationProof,
    validatePlayerMovement,
    getPlayerTrustScore,
    getMovementMetrics,
    isLocationReasonable
  } = useLocationProof({
    autoGenerateProofs: enableRealTimeVerification,
    proofInterval: 30000, // 30 seconds for battle royale
    maxMovementSpeed: 15, // Running speed in m/s
    enableAntiCheat: true,
    onProofGenerated: (proof) => {
      recordLocationProof(proof);
      updateZKProofStatus(ZKProofStatus.VALID);
    },
    onVerificationComplete: (verification) => {
      setVerificationStats(prev => ({
        ...prev,
        totalProofs: prev.totalProofs + 1,
        validProofs: prev.validProofs + (verification.verified ? 1 : 0),
        failedProofs: prev.failedProofs + (verification.verified ? 0 : 1),
        lastVerificationTime: Date.now()
      }));
      
      if (onProofValidated) {
        onProofValidated(verification.proof, verification.verified);
      }
    },
    onAntiCheatAlert: (detection) => {
      const alertType = detection.impossibleMovement ? 'IMPOSSIBLE_MOVEMENT' :
                       detection.teleportDetection ? 'TELEPORT_DETECTED' :
                       detection.speedViolation ? 'SPEED_VIOLATION' : 'SUSPICIOUS_MOVEMENT';
      
      if (onAntiCheatAlert) {
        onAntiCheatAlert(alertType, detection);
      }
    }
  });

  // Submit proof for current location
  const submitLocationProof = useCallback(async (): Promise<ProofSubmissionResult> => {
    if (!realLocation) {
      return {
        success: false,
        trustScore: getPlayerTrustScore(),
        antiCheatFlags: ['NO_LOCATION_DATA'],
        verificationTime: 0
      };
    }

    const startTime = Date.now();
    updateZKProofStatus(ZKProofStatus.GENERATING);

    try {
      // Check if location is reasonable
      if (!isLocationReasonable(realLocation)) {
        updateZKProofStatus(ZKProofStatus.INVALID);
        return {
          success: false,
          trustScore: getPlayerTrustScore(),
          antiCheatFlags: ['INVALID_LOCATION'],
          verificationTime: Date.now() - startTime
        };
      }

      // Generate proof
      const proofResult = await generateLocationProof(
        realLocation, 
        currentLocation?.zoneId || 'unknown'
      );

      if (!proofResult.success) {
        updateZKProofStatus(ZKProofStatus.INVALID);
        return {
          success: false,
          trustScore: getPlayerTrustScore(),
          antiCheatFlags: ['PROOF_GENERATION_FAILED'],
          verificationTime: Date.now() - startTime
        };
      }

      // Verify the proof immediately
      const verifyResult = await verifyLocationProof(proofResult.data);
      const verificationTime = Date.now() - startTime;
      
      if (verifyResult.success && verifyResult.data.valid) {
        updateZKProofStatus(ZKProofStatus.VALID);
        return {
          success: true,
          proof: proofResult.data,
          trustScore: getPlayerTrustScore(),
          antiCheatFlags: [],
          verificationTime
        };
      } else {
        updateZKProofStatus(ZKProofStatus.INVALID);
        return {
          success: false,
          proof: proofResult.data,
          trustScore: getPlayerTrustScore(),
          antiCheatFlags: ['PROOF_VERIFICATION_FAILED'],
          verificationTime
        };
      }
    } catch (error) {
      updateZKProofStatus(ZKProofStatus.INVALID);
      return {
        success: false,
        trustScore: getPlayerTrustScore(),
        antiCheatFlags: ['SYSTEM_ERROR'],
        verificationTime: Date.now() - startTime
      };
    }
  }, [realLocation, currentLocation, generateLocationProof, verifyLocationProof, 
      getPlayerTrustScore, isLocationReasonable, updateZKProofStatus]);

  // Auto-submit proofs during active game phases
  useEffect(() => {
    if (!enableRealTimeVerification) return;
    
    const shouldAutoSubmit = gameState.gamePhase.phase === GamePhase.ACTIVE ||
                            gameState.gamePhase.phase === GamePhase.SHRINKING;
    
    if (shouldAutoSubmit && realLocation && 
        Date.now() >= gameState.zkProofState.nextProofRequired) {
      submitLocationProof();
    }
  }, [gameState.gamePhase.phase, gameState.zkProofState.nextProofRequired, 
      realLocation, submitLocationProof, enableRealTimeVerification]);

  // Calculate status indicators
  const statusIndicators = useMemo(() => {
    const trustScore = getPlayerTrustScore();
    const metrics = getMovementMetrics();
    
    return {
      trustLevel: trustScore >= 80 ? 'high' : trustScore >= 60 ? 'medium' : 'low',
      trustColor: trustScore >= 80 ? 'text-green-400' : trustScore >= 60 ? 'text-yellow-400' : 'text-red-400',
      movementStatus: metrics.suspiciousMovements > 0 ? 'suspicious' : 'normal',
      proofStatus: locationProofState.lastProof ? 'ready' : 'pending',
      verificationRate: verificationStats.totalProofs > 0 
        ? (verificationStats.validProofs / verificationStats.totalProofs * 100).toFixed(1)
        : '0'
    };
  }, [getPlayerTrustScore, getMovementMetrics, locationProofState.lastProof, verificationStats]);

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDistance = (meters: number): string => {
    return meters < 1000 ? `${meters.toFixed(1)}m` : `${(meters / 1000).toFixed(2)}km`;
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-4 border-2 ${
      statusIndicators.trustLevel === 'high' ? 'border-green-500' :
      statusIndicators.trustLevel === 'medium' ? 'border-yellow-500' : 'border-red-500'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">ZK Location Verifier</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            locationProofState.isGenerating ? 'bg-yellow-400 animate-pulse' :
            statusIndicators.proofStatus === 'ready' ? 'bg-green-400' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-400">
            {locationProofState.isGenerating ? 'Generating...' : 
             statusIndicators.proofStatus === 'ready' ? 'Ready' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Trust Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Player Trust Score</span>
          <span className={`text-lg font-bold ${statusIndicators.trustColor}`}>
            {getPlayerTrustScore()}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              statusIndicators.trustLevel === 'high' ? 'bg-green-500' :
              statusIndicators.trustLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${getPlayerTrustScore()}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Trust Level: {statusIndicators.trustLevel.toUpperCase()}
        </div>
      </div>

      {/* Current Location Status */}
      {currentLocation && (
        <div className="bg-gray-800 rounded p-3 mb-4">
          <div className="text-white font-medium mb-2">Current Position</div>
          <div className="space-y-1 text-sm">
            <div className="text-gray-300">
              <span className="text-gray-500">Zone:</span> {currentLocation.zoneName}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Direction:</span> {currentLocation.direction}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Distance:</span> {currentLocation.approximateDistance}
            </div>
            <div className="text-gray-500 text-xs">
              Last Updated: {formatTime(currentLocation.lastUpdated)}
            </div>
          </div>
        </div>
      )}

      {/* Verification Statistics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded p-2">
          <div className="text-xs text-gray-500">Proofs Generated</div>
          <div className="text-lg font-bold text-white">
            {verificationStats.totalProofs}
          </div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <div className="text-xs text-gray-500">Success Rate</div>
          <div className="text-lg font-bold text-green-400">
            {statusIndicators.verificationRate}%
          </div>
        </div>
      </div>

      {/* Movement Metrics */}
      {showDetails && (
        <div className="bg-gray-800 rounded p-3 mb-4">
          <div className="text-white font-medium mb-2">Movement Analysis</div>
          <div className="space-y-1 text-sm">
            {(() => {
              const metrics = getMovementMetrics();
              return (
                <>
                  <div className="flex justify-between text-gray-300">
                    <span>Total Distance:</span>
                    <span>{formatDistance(metrics.totalDistance)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Average Speed:</span>
                    <span>{metrics.averageSpeed.toFixed(1)} m/s</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Max Speed:</span>
                    <span className={metrics.maxSpeed > 15 ? 'text-red-400' : ''}>
                      {metrics.maxSpeed.toFixed(1)} m/s
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Suspicious Moves:</span>
                    <span className={metrics.suspiciousMovements > 0 ? 'text-red-400' : 'text-green-400'}>
                      {metrics.suspiciousMovements}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Manual Proof Generation */}
      <div className="flex gap-2">
        <button
          onClick={submitLocationProof}
          disabled={locationProofState.isGenerating || !realLocation}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded font-medium transition-colors"
        >
          {locationProofState.isGenerating ? 'Generating Proof...' : 'Generate Proof'}
        </button>
      </div>

      {/* Error Display */}
      {locationProofState.error && (
        <div className="mt-3 bg-red-900 bg-opacity-50 border border-red-700 rounded p-2">
          <div className="text-red-200 text-sm">
            <div className="font-medium">Error: {locationProofState.error.type}</div>
            <div>{locationProofState.error.message}</div>
          </div>
        </div>
      )}

      {/* Last Proof Info */}
      {locationProofState.lastProof && showDetails && (
        <div className="mt-3 bg-gray-800 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Last Proof</div>
          <div className="text-xs text-gray-400 font-mono break-all">
            {locationProofState.lastProof.proof.substring(0, 32)}...
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Generated: {formatTime(locationProofState.lastProofTimestamp)}
          </div>
        </div>
      )}

      {/* Game Phase Status */}
      <div className="mt-3 text-xs text-gray-500 bg-gray-800 rounded p-2">
        <div className="flex justify-between items-center">
          <span>Game Phase:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            gameState.gamePhase.phase === GamePhase.ACTIVE ? 'bg-green-900 text-green-200' :
            gameState.gamePhase.phase === GamePhase.SHRINKING ? 'bg-yellow-900 text-yellow-200' :
            'bg-gray-900 text-gray-200'
          }`}>
            {gameState.gamePhase.phase}
          </span>
        </div>
        <div className="mt-1">
          Next proof required: {
            gameState.zkProofState.nextProofRequired > Date.now() 
              ? `${Math.ceil((gameState.zkProofState.nextProofRequired - Date.now()) / 1000)}s`
              : 'Now'
          }
        </div>
      </div>
    </div>
  );
};

export default ZKLocationVerifier;