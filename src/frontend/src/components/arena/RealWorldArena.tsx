'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, MapPin, Users, Clock, Wifi, WifiOff, Eye, Settings } from 'lucide-react';
import { LocationPrivacyControls, PrivacySettings } from '../Location/LocationPrivacyControls';
import { useRealWorldLocation } from '../../hooks/useRealWorldLocation';
// import { useGameState } from '../../hooks/useGameState'; // TODO: integrate with game state
import { LocationCoordinates } from '../../types/zkProof';
import { GamePhase, ZKProofStatus } from '../../types/gameState';

// Dynamic import for RealWorldMap to prevent SSR issues with Leaflet
const RealWorldMap = dynamic(
  () => import('../Map/RealWorldMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }
);

export interface RealWorldArenaProps {
  className?: string;
  gamePhase?: GamePhase;
  onLocationUpdate?: (location: LocationCoordinates) => void;
  onZKProofGenerated?: (proof: unknown) => void;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  accuracyLevel: 'medium',
  shareFrequency: 'periodic',
  proofInterval: 30,
  movementThreshold: 10,
  enableObfuscation: true,
  showToOthers: false,
  anonymousMode: true,
};

export const RealWorldArena: React.FC<RealWorldArenaProps> = ({
  className = '',
  gamePhase = GamePhase.LOBBY,
  onLocationUpdate,
  onZKProofGenerated
}) => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const [isConnected] = useState(true);
  const [gameStats, setGameStats] = useState({
    playersAlive: 1,
    gameTime: 0,
    zkProofCount: 0
  });

  // const { playerState, actions } = useGameState(); // TODO: integrate with game state

  const {
    currentLocation,
    locationAccuracy,
    isTracking,
    hasPermission,
    permissionDenied,
    lastProof,
    proofHistory,
    error,
    isGeneratingProof,
    proofStatus,
    // startTracking,
    // stopTracking,
    generateLocationProof
  } = useRealWorldLocation(gamePhase, {
    enableAutoProofs: privacySettings.shareFrequency !== 'manual',
    proofInterval: privacySettings.proofInterval,
    movementThreshold: privacySettings.movementThreshold,
    enableHighAccuracy: privacySettings.accuracyLevel === 'high',
  });

  // Handle location updates
  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate(currentLocation);
    }
  }, [currentLocation, onLocationUpdate]);

  // Handle proof generation
  useEffect(() => {
    if (lastProof && onZKProofGenerated) {
      onZKProofGenerated(lastProof);
      setGameStats(prev => ({
        ...prev,
        zkProofCount: prev.zkProofCount + 1
      }));
    }
  }, [lastProof, onZKProofGenerated]);

  // Manual proof generation
  const handleManualProofGeneration = useCallback(async () => {
    if (currentLocation) {
      await generateLocationProof(currentLocation);
    }
  }, [currentLocation, generateLocationProof]);

  // Handle ZK proof request from map
  const handleZKProofRequest = useCallback(async (location: LocationCoordinates) => {
    if (gamePhase === GamePhase.ACTIVE) {
      await generateLocationProof(location);
    }
  }, [gamePhase, generateLocationProof]);

  // Get ZK proof status for UI
  const getZKProofStatusEnum = useCallback((): ZKProofStatus => {
    if (isGeneratingProof) return ZKProofStatus.GENERATING;
    if (!lastProof) return ZKProofStatus.NONE;
    
    switch (proofStatus) {
      case 'valid':
        return ZKProofStatus.VALID;
      case 'expired':
        return ZKProofStatus.EXPIRED;
      default:
        return ZKProofStatus.NONE;
    }
  }, [isGeneratingProof, lastProof, proofStatus]);

  // Game timer effect
  useEffect(() => {
    if (gamePhase === GamePhase.ACTIVE) {
      const interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          gameTime: prev.gameTime + 1
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLocationStatusColor = () => {
    if (!hasPermission || permissionDenied) return 'text-red-400';
    if (isTracking && currentLocation) return 'text-green-400';
    if (currentLocation) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getLocationStatusText = () => {
    if (permissionDenied) return 'Permission Denied';
    if (!hasPermission) return 'No Permission';
    if (isTracking && currentLocation) return 'Live Tracking';
    if (currentLocation) return 'Location Found';
    return 'No Location';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with Game Stats */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold">{gameStats.playersAlive}</span>
              <span className="text-gray-400 text-sm">alive</span>
            </div>
            
            {gamePhase === GamePhase.ACTIVE && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-white font-semibold">{formatTime(gameStats.gameTime)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">{gameStats.zkProofCount}</span>
              <span className="text-gray-400 text-sm">proofs</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {isConnected ? (
                <Wifi className="w-4 h-4 text-gray-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>

            <button
              onClick={() => setShowPrivacyControls(!showPrivacyControls)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Privacy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      {showPrivacyControls && (
        <div className="bg-gray-900 border-b border-gray-700 p-4">
          <LocationPrivacyControls
            settings={privacySettings}
            onSettingsChange={setPrivacySettings}
            isGameActive={gamePhase === GamePhase.ACTIVE}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar with Location Info */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 space-y-4">
          {/* Location Status */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className={`w-5 h-5 ${getLocationStatusColor()}`} />
              <div>
                <h3 className="font-semibold text-white">Location Status</h3>
                <p className={`text-sm ${getLocationStatusColor()}`}>
                  {getLocationStatusText()}
                </p>
              </div>
            </div>

            {currentLocation && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Latitude:</span>
                  <span className="text-white font-mono">
                    {currentLocation.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Longitude:</span>
                  <span className="text-white font-mono">
                    {currentLocation.longitude.toFixed(6)}
                  </span>
                </div>
                {locationAccuracy > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy:</span>
                    <span className="text-white">±{Math.round(locationAccuracy)}m</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-sm">
                {error.message}
              </div>
            )}
          </div>

          {/* ZK Proof Status */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className={`w-5 h-5 ${
                getZKProofStatusEnum() === ZKProofStatus.VALID ? 'text-green-400' :
                getZKProofStatusEnum() === ZKProofStatus.GENERATING ? 'text-yellow-400' :
                'text-gray-400'
              }`} />
              <div>
                <h3 className="font-semibold text-white">ZK Proof Status</h3>
                <p className={`text-sm ${
                  getZKProofStatusEnum() === ZKProofStatus.VALID ? 'text-green-400' :
                  getZKProofStatusEnum() === ZKProofStatus.GENERATING ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {isGeneratingProof ? 'Generating...' : 
                   lastProof ? 'Verified' : 'No Proof'}
                </p>
              </div>
            </div>

            {lastProof && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Proof Type:</span>
                  <span className="text-white">Location</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">Valid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Proofs:</span>
                  <span className="text-white">{proofHistory.length}</span>
                </div>
              </div>
            )}

            {/* Manual Proof Generation */}
            {privacySettings.shareFrequency === 'manual' && currentLocation && (
              <button
                onClick={handleManualProofGeneration}
                disabled={isGeneratingProof}
                className="w-full mt-3 px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                {isGeneratingProof ? 'Generating...' : 'Generate Proof'}
              </button>
            )}
          </div>

          {/* Game Phase Info */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white">Game Phase</h3>
                <p className="text-sm text-purple-400 capitalize">
                  {gamePhase.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              {gamePhase === GamePhase.LOBBY && 'Waiting to start the game'}
              {gamePhase === GamePhase.PREPARATION && 'Preparing arena...'}
              {gamePhase === GamePhase.ACTIVE && 'Battle in progress!'}
              {gamePhase === GamePhase.ZONE_SHRINKING && 'Safe zone shrinking'}
              {gamePhase === GamePhase.GAME_OVER && 'Game completed'}
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1">
          <RealWorldMap
            height="100%"
            gamePhase={gamePhase}
            onLocationUpdate={onLocationUpdate}
            onZKProofRequest={handleZKProofRequest}
            showAccuracyCircle={privacySettings.accuracyLevel === 'high'}
            enableLocationTracking={privacySettings.shareFrequency !== 'manual'}
            centerOnUser={true}
          />
        </div>
      </div>
    </div>
  );
};

export default RealWorldArena;