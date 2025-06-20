'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useGameState, usePlayerState, useGamePhase, useRealtimeState } from '../hooks/useGameState';
import { GameMap } from './Map/GameMap';
import { GameHUD } from './GameHUD';
import { GameLobby } from './GameLobby';
import { GameStats } from './GameStats';
import { ZKProofIndicator } from './ZKProofIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { GamePhase } from '../types/gameState';
import { Shield, Users, Target, Clock, AlertTriangle } from 'lucide-react';

interface GameOrchestratorProps {
  initError?: string | null;
  onError?: (error: Error) => void;
}

/**
 * GameOrchestrator - Main game coordination component
 * Orchestrates all game systems and provides the main game interface
 */
export const GameOrchestrator: React.FC<GameOrchestratorProps> = ({
  initError,
  onError: _onError // Mark as used by prefixing with underscore
}) => {
  const { state } = useGameState();
  const { playerState, actions: playerActions, isInSafeZone } = usePlayerState();
  const { gamePhase, actions: phaseActions, timeUntilNextShrink, isGameActive } = useGamePhase();
  const { isConnected, latency, connectionError } = useRealtimeState();
  
  const [currentPlayers, setCurrentPlayers] = useState([
    {
      id: playerState.id || 'player-1',
      position: { x: playerState.location.x, y: playerState.location.y },
      status: playerState.isAlive ? 'active' : 'eliminated' as const,
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
              status: playerState.isAlive ? 'active' : 'eliminated'
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
  if (initError || connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md mx-auto text-center p-8 bg-gray-800 rounded-xl border border-red-500/50">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Game Error</h2>
          <p className="text-gray-300 mb-4">
            {initError || connectionError?.message || 'An error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 h-[calc(100vh-4rem)]">
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