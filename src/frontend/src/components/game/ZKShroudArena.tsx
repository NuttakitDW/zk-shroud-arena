'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shield, MapPin, Users, Clock, Heart, Zap, Target, Info } from 'lucide-react';
import { GameEngine } from './GameEngine';
import { GameContextProvider, useGameContext } from '../../contexts/GameContext';
import { GameMap } from '../Map/GameMap';
import { ArenaZone } from '../Map/ArenaZone';
import { Coordinates, GamePhase, ZKProofStatus } from '../../types/gameState';
import { Player } from '../Map/types';

interface GameHUDProps {
  gameEngine: GameEngine;
  onMove: (position: Coordinates) => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameEngine }) => {
  const { state } = useGameContext();
  const [gameStats, setGameStats] = useState({
    playersAlive: 1,
    gameTime: 0,
    currentZoneRadius: 800,
    nextShrinkIn: 0
  });

  // Update game stats
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = gameEngine.getGameStats();
      setGameStats(stats);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameEngine]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return `${Math.round(distance)}m`;
  };

  const getPhaseColor = (phase: GamePhase): string => {
    switch (phase) {
      case GamePhase.LOBBY: return 'bg-blue-500';
      case GamePhase.PREPARATION: return 'bg-yellow-500';
      case GamePhase.ACTIVE: return 'bg-green-500';
      case GamePhase.ZONE_SHRINKING: return 'bg-red-500';
      case GamePhase.FINAL_ZONE: return 'bg-purple-500';
      case GamePhase.GAME_OVER: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getProofStatusColor = (status: ZKProofStatus): string => {
    switch (status) {
      case ZKProofStatus.VALID: return 'text-green-400';
      case ZKProofStatus.GENERATING: return 'text-yellow-400';
      case ZKProofStatus.PENDING: return 'text-blue-400';
      case ZKProofStatus.ERROR: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <div className="flex space-x-4">
          {/* Player Health */}
          <div className="bg-black bg-opacity-70 rounded-lg p-3 flex items-center space-x-2">
            <Heart className={`h-5 w-5 ${state.playerState.health > 30 ? 'text-red-500' : 'text-red-300'}`} />
            <div className="text-white">
              <div className="text-sm font-bold">{state.playerState.health}/100</div>
              <div className="w-16 h-2 bg-gray-600 rounded">
                <div 
                  className={`h-full rounded transition-all duration-300 ${
                    state.playerState.health > 50 ? 'bg-green-500' : 
                    state.playerState.health > 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${state.playerState.health}%` }}
                />
              </div>
            </div>
          </div>

          {/* Players Alive */}
          <div className="bg-black bg-opacity-70 rounded-lg p-3 flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-400" />
            <div className="text-white">
              <div className="text-sm font-bold">{gameStats.playersAlive}</div>
              <div className="text-xs text-gray-300">Alive</div>
            </div>
          </div>

          {/* Game Timer */}
          <div className="bg-black bg-opacity-70 rounded-lg p-3 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-400" />
            <div className="text-white">
              <div className="text-sm font-bold">{formatTime(gameStats.gameTime)}</div>
              <div className="text-xs text-gray-300">Game Time</div>
            </div>
          </div>
        </div>

        {/* Game Phase Indicator */}
        <div className="bg-black bg-opacity-70 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getPhaseColor(state.gamePhase.phase)}`}></div>
            <span className="text-white font-semibold capitalize">
              {state.gamePhase.phase.replace('_', ' ')}
            </span>
          </div>
          {state.gamePhase.timer.remainingTime > 0 && (
            <div className="text-xs text-gray-300 mt-1">
              {formatTime(state.gamePhase.timer.remainingTime)}
            </div>
          )}
        </div>
      </div>

      {/* Zone Information */}
      <div className="absolute top-4 right-4 space-y-2 pointer-events-auto">
        <div className="bg-black bg-opacity-70 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-5 w-5 text-orange-400" />
            <span className="text-white font-semibold">Safe Zone</span>
          </div>
          <div className="text-sm text-gray-300">
            <div>Radius: {formatDistance(gameStats.currentZoneRadius)}</div>
            {gameStats.nextShrinkIn > 0 && (
              <div>Next shrink: {formatTime(gameStats.nextShrinkIn)}</div>
            )}
          </div>
        </div>

        {/* ZK Proof Status */}
        <div className="bg-black bg-opacity-70 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <span className="text-white font-semibold">ZK Proof</span>
          </div>
          <div className={`text-sm ${getProofStatusColor(state.zkProofState.validationStatus)}`}>
            {state.zkProofState.validationStatus.toUpperCase()}
          </div>
          {state.zkProofState.lastProof && (
            <div className="text-xs text-gray-400 mt-1">
              Last: {formatTime(Date.now() - state.zkProofState.lastProof.timestamp)} ago
            </div>
          )}
        </div>
      </div>

      {/* Movement Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 pointer-events-auto">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="h-4 w-4 text-blue-400" />
          <span className="text-white text-sm font-semibold">Controls</span>
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>• Click on map to move</div>
          <div>• Stay in the safe zone</div>
          <div>• ZK proofs validate your location</div>
          <div>• Last player standing wins!</div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="flex items-center space-x-2 bg-black bg-opacity-70 rounded-lg p-2">
          <div className={`w-2 h-2 rounded-full ${
            state.realtimeState.connectionStatus === 'connected' ? 'bg-green-500' : 
            state.realtimeState.connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
          } animate-pulse`}></div>
          <span className="text-white text-xs">
            {state.realtimeState.connectionStatus === 'connected' ? 'Online' : 
             state.realtimeState.connectionStatus === 'disconnected' ? 'Offline' : 'Connecting...'}
          </span>
          {state.realtimeState.latency > 0 && (
            <span className="text-gray-400 text-xs">
              {state.realtimeState.latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Zone Shrinking Warning */}
      {state.gamePhase.phase === GamePhase.ZONE_SHRINKING && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center pointer-events-auto">
          <div className="bg-red-600 bg-opacity-90 text-white px-6 py-3 rounded-lg border-2 border-red-400 animate-pulse">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6" />
              <div>
                <div className="font-bold text-lg">ZONE SHRINKING!</div>
                <div className="text-sm">Get to the safe zone or take damage</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ZKShroudArenaGameProps {
  gameId?: string;
}

const ZKShroudArenaGame: React.FC<ZKShroudArenaGameProps> = () => {
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [botPlayers, setBotPlayers] = useState<Player[]>([]);
  const { state, actions } = useGameContext();

  // Initialize game engine
  useEffect(() => {
    if (!gameEngineRef.current) {
      console.log('🚀 Initializing Game Engine...');
      
      const gameUpdater = (updater: (state: any) => any) => {
        // Integration with game context
        const currentState = state;
        const newState = updater(currentState);
        
        // Apply any state changes if needed
        if (newState.arenaState?.h3Map && newState.arenaState.h3Map !== currentState.arenaState?.h3Map) {
          console.log('📍 H3 map received in game state');
        }
        
        return newState;
      };
      
      gameEngineRef.current = new GameEngine({
        arenaSize: { width: 2000, height: 2000 },
        maxPlayers: 100,
        enableBots: true,
        botCount: 15,
        enableRealtime: false, // Disable for demo
        zkSettings: {
          proofRequired: true, // Enable ZK proof
          proofInterval: 60000,
          h3Resolution: 9
        }
      }, gameUpdater);
      
      // Initialize the engine and request h3Map
      gameEngineRef.current.initialize().then(() => {
        console.log('✅ Game Engine initialized successfully');
        
        // Request H3 map from server after initialization
        if (gameEngineRef.current) {
          gameEngineRef.current.requestH3MapFromServer();
        }
      });
    }
  }, [state]);

  // Update bot positions for rendering
  useEffect(() => {
    if (!gameEngineRef.current || !isGameStarted) return;
    
    const interval = setInterval(() => {
      const bots = gameEngineRef.current!.getBotPlayers();
      setBotPlayers(bots.map(bot => ({
        id: bot.id,
        position: bot.position,
        status: bot.isAlive ? 'active' as const : 'eliminated' as const
      })));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isGameStarted]);

  const handleStartGame = useCallback(() => {
    if (gameEngineRef.current && !isGameStarted) {
      console.log('🎮 Starting game...');
      
      // Spawn player
      gameEngineRef.current.spawnPlayer('player-1');
      
      // Start the game
      gameEngineRef.current.startGame();
      setIsGameStarted(true);
      
      console.log('✅ Game started successfully!');
    }
  }, [isGameStarted]);

  const handleMapClick = useCallback(async (position: Coordinates) => {
    if (gameEngineRef.current && isGameStarted) {
      console.log(`🏃 Moving player to (${position.x}, ${position.y})`);
      
      // Check if we have h3Map data
      const hasH3Map = state.arenaState.h3Map && state.arenaState.h3Map.length > 0;
      
      if (!hasH3Map) {
        console.warn('⚠️ Cannot move yet - waiting for arena map data from server');
        alert('Waiting for arena map data from server. Please try again in a moment.');
        return;
      }
      
      // Move player with ZK proof validation
      const result = await gameEngineRef.current.movePlayer('player-1', position, true); // Enable proof generation
      
      if (result.success) {
        console.log('✅ Player moved successfully');
        actions.updatePlayerLocation({
          x: position.x,
          y: position.y,
          timestamp: Date.now(),
          zone: 'safe' // Would be calculated properly
        });
      } else {
        console.error('❌ Failed to move player:', result.error);
      }
    }
  }, [isGameStarted, actions]);

  // Create player list for map rendering
  const allPlayers: Player[] = [
    {
      id: 'player-1',
      position: { x: state.playerState.location.x, y: state.playerState.location.y },
      status: state.playerState.isAlive ? 'active' as const : 'eliminated' as const,
      isCurrentPlayer: true
    },
    ...botPlayers
  ];

  const arenaBounds = {
    minX: 0,
    maxX: 2000,
    minY: 0,
    maxY: 2000
  };

  // Create zone data for ArenaZone component
  const zones = [
    {
      id: 'safe-zone',
      name: 'Safe Zone',
      coordinates: {
        x: state.arenaState.currentZone.center.x - state.arenaState.currentZone.radius,
        y: state.arenaState.currentZone.center.y - state.arenaState.currentZone.radius,
        width: state.arenaState.currentZone.radius * 2,
        height: state.arenaState.currentZone.radius * 2
      },
      type: state.gamePhase.phase === GamePhase.ZONE_SHRINKING ? 'shrinking' as const : 'safe' as const,
      shrinkProgress: state.gamePhase.phase === GamePhase.ZONE_SHRINKING ? 0.5 : undefined,
      timeRemaining: state.gamePhase.phase === GamePhase.ZONE_SHRINKING ? 
        Math.floor(state.gamePhase.timer.remainingTime / 1000) : undefined
    }
  ];

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Shield className="h-24 w-24 text-purple-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">ZK Shroud Arena</h1>
            <p className="text-xl text-gray-300">Battle Royale with Zero-Knowledge Location Proofs</p>
          </div>
          
          <div className="bg-black bg-opacity-50 rounded-lg p-6 mb-6 max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-3">Game Features</h2>
            <div className="text-sm text-gray-300 space-y-2 text-left">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Real-time location tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>Zero-knowledge proof validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-400" />
                <span>Shrinking safe zones</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-400" />
                <span>Multiplayer battle royale</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleStartGame}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
          >
            Start Battle Royale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Game Map */}
      <div className="absolute inset-0">
        <GameMap
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
          arenaBounds={arenaBounds}
          players={allPlayers}
          showGrid={true}
          enableZoom={true}
          enablePan={true}
          onMapClick={handleMapClick}
        />
        
        {/* Zone Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <ArenaZone
            zones={zones}
            width={typeof window !== 'undefined' ? window.innerWidth : 1920}
            height={typeof window !== 'undefined' ? window.innerHeight : 1080}
            showLabels={true}
            showTimers={true}
            animated={true}
          />
        </div>
      </div>

      {/* Game HUD */}
      {gameEngineRef.current && (
        <GameHUD 
          gameEngine={gameEngineRef.current} 
          onMove={handleMapClick}
        />
      )}
    </div>
  );
};

// Main exported component with game context provider
const ZKShroudArena: React.FC<ZKShroudArenaGameProps> = (props) => {
  return (
    <GameContextProvider 
      gameId={props.gameId || 'zk-shroud-arena'}
      enablePersistence={true}
      enableRealtime={false} // Disable for demo
    >
      <ZKShroudArenaGame {...props} />
    </GameContextProvider>
  );
};

export { ZKShroudArena };
export default ZKShroudArena;