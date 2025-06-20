'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGameState, usePlayerState, useGamePhase, useRealtimeState } from '../hooks/useGameState';
import { GameMap } from './Map/GameMap';
import { GameHUD } from './GameHUD';
import { GameLobby } from './GameLobby';
import { GameStats } from './GameStats';
import { ZKProofIndicator } from './ZKProofIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { GamePhase } from '../types/gameState';
import { Player } from './Map/types';
import { LocationCoordinates } from '../types/zkProof';
import { Shield, Users, Target, Clock, AlertTriangle, Map, Navigation } from 'lucide-react';

// Dynamic import for RealWorldArena to prevent SSR issues with Leaflet
const RealWorldArena = dynamic(
  () => import('./arena/RealWorldArena'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading real world arena...</p>
        </div>
      </div>
    )
  }
);

interface GameOrchestratorProps {
  initError?: string | null;
  onError?: (error: Error) => void;
  enableRealWorldMode?: boolean;
}

/**
 * GameOrchestrator - Main game coordination component
 * Orchestrates all game systems and provides the main game interface
 */
export const GameOrchestrator: React.FC<GameOrchestratorProps> = ({ 
  enableRealWorldMode = true 
}) => {
  const { state } = useGameState();
  const { playerState, actions: playerActions, isInSafeZone } = usePlayerState();
  const { gamePhase, actions: phaseActions, timeUntilNextShrink, isGameActive } = useGamePhase();
  const { isConnected, latency, connectionError } = useRealtimeState();
  
  const [isRealWorldMode, setIsRealWorldMode] = useState(false);
  const [realWorldLocation, setRealWorldLocation] = useState<LocationCoordinates | null>(null);
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>([
    {
      id: playerState.id || 'player-1',
      position: { x: playerState.location.x, y: playerState.location.y },
      status: playerState.isAlive ? 'active' as const : 'eliminated' as const,
      isCurrentPlayer: true,
    }
  ]);

  // Game loop for continuous updates
  useEffect(() => {
    if (!isGameActive) return;

    const gameLoop = setInterval(() => {
      // Update player position based on safe zone status
      if (!isInSafeZone && playerState.isAlive) {
        // Simulate zone damage
        playerActions.takeDamage(2);
      }

      // Update current players list (in a real game, this would come from server)
      setCurrentPlayers(prev => prev.map(player => 
        player.id === playerState.id 
          ? {
              ...player,
              position: { x: playerState.location.x, y: playerState.location.y },
              status: playerState.isAlive ? 'active' as const : 'eliminated' as const
            }
          : player
      ));
    }, 1000);

    return () => clearInterval(gameLoop);
  }, [isGameActive, isInSafeZone, playerState, playerActions]);

  // Handle player movement
  const handleMapClick = useCallback((position: { x: number; y: number }) => {
    if (isGameActive && playerState.isAlive) {
      playerActions.movePlayer(position);
      
      // Generate ZK proof for movement (if needed)
      if (Math.random() > 0.7) { // 30% chance to require proof
        playerActions.generateProof(position);
      }
    }
  }, [isGameActive, playerState.isAlive, playerActions]);

  // Handle real-world location updates
  const handleRealWorldLocationUpdate = useCallback((location: LocationCoordinates) => {
    setRealWorldLocation(location);
    
    // Convert real-world coordinates to game coordinates
    if (isRealWorldMode && isGameActive) {
      const gamePosition = {
        x: (location.longitude + 180) * (state.arenaState.currentZone.radius * 2) / 360,
        y: (location.latitude + 90) * (state.arenaState.currentZone.radius * 2) / 180
      };
      
      playerActions.movePlayer(gamePosition);
    }
  }, [isRealWorldMode, isGameActive, playerActions, state.arenaState.currentZone.radius]);

  // Handle real-world mode toggle
  const handleToggleRealWorldMode = useCallback(() => {
    setIsRealWorldMode(prev => !prev);
  }, []);

  // Handle ZK proof generation from real world
  const handleZKProofGenerated = useCallback((proof: unknown) => {
    console.log('ZK Proof generated from real-world location:', proof);
    // TODO: Integrate with game state
  }, []);

  // Handle game phase transitions
  const handleStartGame = useCallback(() => {
    phaseActions.startGame();
  }, [phaseActions]);

  // Arena bounds based on current zone
  const arenaBounds = {
    minX: state.arenaState.currentZone.center.x - state.arenaState.currentZone.radius,
    maxX: state.arenaState.currentZone.center.x + state.arenaState.currentZone.radius,
    minY: state.arenaState.currentZone.center.y - state.arenaState.currentZone.radius,
    maxY: state.arenaState.currentZone.center.y + state.arenaState.currentZone.radius,
  };

  // Error handling
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md mx-auto text-center p-8 bg-gray-800 rounded-xl border border-red-500/50">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Game Error</h2>
          <p className="text-gray-300 mb-4">
            {connectionError?.message || 'An error occurred'}
          </p>
          <button
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reload Game
          </button>
        </div>
      </div>
    );
  }

  // Render based on game phase
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Game Title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ZK Shroud Arena</h1>
                <p className="text-sm text-gray-400">Tactical Stealth Battle Royale</p>
              </div>
            </div>
            
            {/* Game Status */}
            <div className="flex items-center space-x-6">
              <ConnectionStatus isConnected={isConnected} latency={latency} />
              <ZKProofIndicator status={state.zkProofState.validationStatus} />
              
              {/* Real World Mode Toggle */}
              {enableRealWorldMode && (gamePhase.phase === GamePhase.LOBBY || gamePhase.phase === GamePhase.PREPARATION) && (
                <button
                  onClick={handleToggleRealWorldMode}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all ${
                    isRealWorldMode 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                  }`}
                  title={isRealWorldMode ? 'Switch to Virtual Arena' : 'Switch to Real World Arena'}
                >
                  {isRealWorldMode ? <Map className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {isRealWorldMode ? 'Real World' : 'Virtual'}
                  </span>
                </button>
              )}
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>{gamePhase.playerCount}/{gamePhase.maxPlayers}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4 text-green-400" />
                  <span>{playerState.health}/100</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>{Math.ceil(timeUntilNextShrink / 1000)}s</span>
                </div>
                {isRealWorldMode && realWorldLocation && (
                  <div className="flex items-center space-x-1">
                    <Map className="h-4 w-4 text-cyan-400" />
                    <span className="text-cyan-300">GPS</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Content */}
      <main className="flex-1">
        {gamePhase.phase === GamePhase.LOBBY && (
          <GameLobby
            playerCount={gamePhase.playerCount}
            maxPlayers={gamePhase.maxPlayers}
            onStartGame={handleStartGame}
            isReady={gamePhase.playerCount >= gamePhase.minPlayers}
          />
        )}

        {(gamePhase.phase === GamePhase.PREPARATION || isGameActive) && (
          <div className="h-[calc(100vh-4rem)]">
            {isRealWorldMode ? (
              /* Real World Arena Mode */
              <RealWorldArena
                gamePhase={gamePhase.phase}
                onLocationUpdate={handleRealWorldLocationUpdate}
                onZKProofGenerated={handleZKProofGenerated}
                className="h-full"
              />
            ) : (
              /* Virtual Arena Mode */
              <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
                {/* Main Game View */}
                <div className="lg:col-span-3 flex flex-col">
                  <div className="flex-1 p-4">
                    <GameMap
                      width={800}
                      height={600}
                      arenaBounds={arenaBounds}
                      players={currentPlayers}
                      onMapClick={handleMapClick}
                      showGrid={true}
                      enableZoom={true}
                      enablePan={true}
                      className="mx-auto"
                    />
                  </div>
                  
                  {/* Game HUD */}
                  <GameHUD
                    health={playerState.health}
                    maxHealth={playerState.maxHealth}
                    isInSafeZone={isInSafeZone}
                    timeUntilShrink={timeUntilNextShrink}
                    gamePhase={gamePhase.phase}
                    zkProofStatus={state.zkProofState.validationStatus}
                  />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 bg-gray-800 border-l border-gray-700">
                  <GameStats
                    playerState={playerState}
                    gamePhase={gamePhase}
                    arenaState={state.arenaState}
                    zkProofState={state.zkProofState}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {gamePhase.phase === GamePhase.GAME_OVER && (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="max-w-md mx-auto text-center p-8 bg-gray-800 rounded-xl border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-4">
                {playerState.isAlive ? '🎉 Victory!' : '💀 Game Over'}
              </h2>
              <p className="text-gray-300 mb-6">
                {playerState.isAlive 
                  ? 'Congratulations! You survived the arena!' 
                  : 'Better luck next time, warrior.'}
              </p>
              <button
                onClick={() => phaseActions.advancePhase()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GameOrchestrator;