'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LocationTracker, PrivacyLocation } from '../Location/LocationTracker';
import { ZKLocationVerifier } from '../ZKProofIntegration/ZKLocationVerifier';
import { GameMap, PlayerPosition } from '../Map/GameMap';
import { useGameState } from '../../hooks/useGameState';
import { LocationCoordinates, ZkProof } from '../../types/zkProof';
import { GamePhase } from '../../types/gameState';

export const ZKBattleRoyaleDemo: React.FC = () => {
  // Game state
  const { gameState, updatePlayerLocation, updateGamePhase, recordLocationProof } = useGameState();
  
  // Location tracking
  const [privacyLocation, setPrivacyLocation] = useState<PrivacyLocation | null>(null);
  const [realLocation, setRealLocation] = useState<LocationCoordinates | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  // Game settings
  const [privacyLevel, setPrivacyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.LOBBY);
  
  // Demo state
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [alertCount, setAlertCount] = useState(0);

  // Convert privacy location to real coordinates (simulated)
  const simulateRealLocation = useCallback((privacy: PrivacyLocation): LocationCoordinates => {
    // In a real app, this would come from actual GPS
    // For demo, we'll simulate based on privacy location
    const baseCoords = {
      lat: 37.7749, // San Francisco base
      lon: -122.4194
    };
    
    // Add some randomization based on zone ID
    const hash = privacy.zoneId.split('_').reduce((acc, part) => acc + parseInt(part) || 0, 0);
    const latOffset = (hash % 100) / 10000; // Small offset
    const lonOffset = ((hash * 7) % 100) / 10000;
    
    return {
      lat: baseCoords.lat + latOffset,
      lon: baseCoords.lon + lonOffset
    };
  }, []);

  // Handle location updates from LocationTracker
  const handleLocationUpdate = useCallback((location: PrivacyLocation | null) => {
    setPrivacyLocation(location);
    
    if (location) {
      const realCoords = simulateRealLocation(location);
      setRealLocation(realCoords);
      
      // Update game state
      updatePlayerLocation({
        x: realCoords.lat * 1000000, // Convert to game coordinates
        y: realCoords.lon * 1000000,
        timestamp: Date.now()
      });
      
      addToGameLog(`Location updated: ${location.zoneName} (${location.zoneId})`);
    }
  }, [simulateRealLocation, updatePlayerLocation]);

  // Handle ZK proof events
  const handleProofValidated = useCallback((proof: ZkProof, valid: boolean) => {
    addToGameLog(`ZK Proof ${valid ? 'VALIDATED' : 'REJECTED'}: ${proof.proof.substring(0, 16)}...`);
  }, []);

  const handleAntiCheatAlert = useCallback((alertType: string, details: any) => {
    setAlertCount(prev => prev + 1);
    addToGameLog(`🚨 ANTI-CHEAT ALERT: ${alertType}`);
    
    if (alertType === 'IMPOSSIBLE_MOVEMENT') {
      addToGameLog(`   Detected impossible movement speed: ${details.reasonableMoveDistance}m`);
    } else if (alertType === 'TELEPORT_DETECTED') {
      addToGameLog(`   Teleportation detected - distance too far for time elapsed`);
    } else if (alertType === 'SPEED_VIOLATION') {
      addToGameLog(`   Speed violation - moving faster than humanly possible`);
    }
  }, []);

  // Game control functions
  const startGame = () => {
    setGamePhase(GamePhase.ACTIVE);
    updateGamePhase(GamePhase.ACTIVE);
    addToGameLog('🎮 Game Started - Battle Royale Mode Active!');
    addToGameLog('📍 Location verification required every 30s');
  };

  const startShrinking = () => {
    setGamePhase(GamePhase.SHRINKING);
    updateGamePhase(GamePhase.SHRINKING);
    addToGameLog('⚠️ Arena is shrinking! Move to safe zone!');
  };

  const endGame = () => {
    setGamePhase(GamePhase.ENDED);
    updateGamePhase(GamePhase.ENDED);
    addToGameLog('🏁 Game Ended');
  };

  const resetDemo = () => {
    setGamePhase(GamePhase.LOBBY);
    updateGamePhase(GamePhase.LOBBY);
    setGameLog([]);
    setAlertCount(0);
    addToGameLog('🔄 Demo Reset');
  };

  // Helper function to add log entries
  const addToGameLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]); // Keep last 20 entries
  };

  // Convert game coordinates to player position for map
  const playerPosition: PlayerPosition | null = realLocation ? {
    x: realLocation.lat * 1000000,
    y: realLocation.lon * 1000000,
    rotation: 0,
    health: gameState.playerState.health,
    isAlive: gameState.playerState.isAlive
  } : null;

  useEffect(() => {
    addToGameLog('🚀 ZK Shroud Arena Demo Initialized');
    addToGameLog('📱 Enable location tracking to begin');
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            ZK Shroud Arena - Battle Royale Demo
          </h1>
          <p className="text-gray-400">
            Zero-Knowledge Location Verification for Fair Play
          </p>
        </div>

        {/* Game Controls */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white font-medium">Game Phase:</div>
              <div className={`px-3 py-1 rounded font-medium ${
                gamePhase === GamePhase.ACTIVE ? 'bg-green-900 text-green-200' :
                gamePhase === GamePhase.SHRINKING ? 'bg-yellow-900 text-yellow-200' :
                gamePhase === GamePhase.ENDED ? 'bg-red-900 text-red-200' :
                'bg-gray-700 text-gray-300'
              }`}>
                {gamePhase}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={startGame}
                disabled={gamePhase === GamePhase.ACTIVE || !locationEnabled}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
              >
                Start Game
              </button>
              <button 
                onClick={startShrinking}
                disabled={gamePhase !== GamePhase.ACTIVE}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
              >
                Start Shrinking
              </button>
              <button 
                onClick={endGame}
                disabled={gamePhase === GamePhase.LOBBY || gamePhase === GamePhase.ENDED}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
              >
                End Game
              </button>
              <button 
                onClick={resetDemo}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>
          
          {alertCount > 0 && (
            <div className="mt-3 bg-red-900 bg-opacity-50 border border-red-700 rounded p-2">
              <div className="text-red-200 text-sm font-medium">
                🚨 Anti-Cheat Alerts: {alertCount} detected
              </div>
            </div>
          )}
        </div>

        {/* Main Game Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Location Tracking */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Privacy Controls</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={locationEnabled} 
                    onChange={(e) => setLocationEnabled(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-300">Enable Location</span>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Privacy Level</label>
                <select
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low (Precise)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Anonymous)</option>
                </select>
              </div>
            </div>

            <LocationTracker
              enabled={locationEnabled}
              privacyLevel={privacyLevel}
              onLocationUpdate={handleLocationUpdate}
              onError={(error) => addToGameLog(`❌ Location Error: ${error}`)}
              showStatus={true}
              showAccuracy={true}
            />
          </div>

          {/* Map and Game State */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Battle Arena</h3>
              <GameMap
                width={400}
                height={300}
                playerPosition={playerPosition}
                safeZones={gameState.arenaState.safeZones}
                currentZone={gameState.arenaState.currentZone}
                gamePhase={gameState.gamePhase.phase}
                className="border border-gray-700 rounded"
              />
            </div>
            
            {/* Game Log */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Game Log</h3>
              <div className="bg-gray-800 rounded p-3 h-64 overflow-y-auto">
                {gameLog.map((entry, index) => (
                  <div key={index} className="text-sm text-gray-300 mb-1 font-mono">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ZK Proof Verification */}
          <div>
            <ZKLocationVerifier
              gameId="demo-game"
              currentLocation={privacyLocation}
              realLocation={realLocation}
              onProofValidated={handleProofValidated}
              onAntiCheatAlert={handleAntiCheatAlert}
              showDetails={true}
              enableRealTimeVerification={gamePhase === GamePhase.ACTIVE || gamePhase === GamePhase.SHRINKING}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">How to Use This Demo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Getting Started:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enable location tracking in Privacy Controls</li>
                <li>Wait for location to be detected</li>
                <li>Click "Start Game" to begin battle royale</li>
                <li>ZK proofs will be generated automatically every 30s</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">ZK Proof Features:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Privacy-preserving location verification</li>
                <li>Real-time anti-cheat detection</li>
                <li>Movement speed validation</li>
                <li>Player trust scoring system</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 border border-blue-700 rounded">
            <div className="text-blue-200 text-sm">
              <strong>Note:</strong> This demo simulates location data for demonstration purposes. 
              In a real implementation, actual GPS coordinates would be used for ZK proof generation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZKBattleRoyaleDemo;