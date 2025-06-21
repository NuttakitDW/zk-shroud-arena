'use client';

import React, { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  GameState,
  GameAction,
  GameActionType,
  GamePhase,
  ZKProofStatus,
  PlayerLocation,
  SafeZone,
  ZKProofData,
  GameStateSnapshot,
  GameContextProviderProps,
  UseGameStateReturn,
  GameUpdate
} from '../types/gameState';
import { useWebSocket } from '../hooks/useWebSocket';
import { phaseManager } from '../services/phaseManager';
import {
  PlayerMoveMessage,
  PlayerHealthUpdateMessage,
  PlayerEliminationMessage,
  ArenaZoneUpdateMessage,
  GamePhaseChangeMessage,
  GameTimerUpdateMessage,
  GameStateSyncMessage,
  ZKProofValidatedMessage,
  ZKProofRequestMessage,
  SystemAnnouncementMessage,
  WebSocketConnectionInfo,
  H3MapUpdateMessage
} from '../types/websocket';

// Initial state factory
const createInitialState = (gameId: string = 'default'): GameState => ({
  playerState: {
    id: '',
    location: {
      x: 0,
      y: 0,
      timestamp: Date.now(),
      zone: 'lobby'
    },
    health: 100,
    maxHealth: 100,
    proofStatus: ZKProofStatus.NONE,
    isAlive: true,
    lastActivity: Date.now(),
  },
  arenaState: {
    currentZone: {
      id: 'initial',
      center: { x: 500, y: 500 },
      radius: 1000,
      isActive: true,
    },
    shrinkTimer: 0,
    safeZones: [],
    arenaSize: {
      width: 2000,
      height: 2000,
    },
    dangerZones: [],
    h3Map: [], // Initially empty, will be populated from server
    h3Resolution: 9, // Default resolution
  },
  gamePhase: {
    phase: GamePhase.LOBBY,
    timer: {
      totalTime: 0,
      remainingTime: 0,
      phaseStartTime: Date.now(),
      phaseEndTime: Date.now() + 30000, // 30 seconds default
      isRunning: false,
    },
    playerCount: 0,
    maxPlayers: 100,
    minPlayers: 2,
    roundNumber: 1,
  },
  zkProofState: {
    validationStatus: ZKProofStatus.NONE,
    errors: [],
    proofHistory: [],
    nextProofRequired: Date.now() + 60000, // 1 minute from now
    proofCooldown: 30000, // 30 seconds
  },
  realtimeState: {
    connectionStatus: 'disconnected',
    lastUpdate: Date.now(),
    updates: [],
    latency: 0,
  },
  gameId,
  lastUpdated: Date.now(),
});

// Game state reducer
const gameStateReducer = (state: GameState, action: GameAction): GameState => {
  const timestamp = action.timestamp || Date.now();
  
  switch (action.type) {
    case GameActionType.UPDATE_PLAYER_LOCATION:
      return {
        ...state,
        playerState: {
          ...state.playerState,
          location: {
            ...(action.payload as PlayerLocation),
            timestamp,
          },
          lastActivity: timestamp,
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.UPDATE_PLAYER_HEALTH:
      return {
        ...state,
        playerState: {
          ...state.playerState,
          health: Math.max(0, Math.min(state.playerState.maxHealth, action.payload as number)),
          isAlive: (action.payload as number) > 0,
          lastActivity: timestamp,
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.UPDATE_PROOF_STATUS:
      return {
        ...state,
        zkProofState: {
          ...state.zkProofState,
          validationStatus: (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).status,
          lastProof: (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).proof || state.zkProofState.lastProof,
          errors: (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).status === ZKProofStatus.ERROR 
            ? [...state.zkProofState.errors, (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).error || 'Unknown error']
            : state.zkProofState.errors,
          proofHistory: (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).proof 
            ? [...state.zkProofState.proofHistory, (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).proof!].slice(-10) // Keep last 10 proofs
            : state.zkProofState.proofHistory,
          nextProofRequired: (action.payload as { status: ZKProofStatus; proof?: ZKProofData; error?: string }).proof 
            ? timestamp + state.zkProofState.proofCooldown
            : state.zkProofState.nextProofRequired,
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.UPDATE_ARENA_ZONE:
      return {
        ...state,
        arenaState: {
          ...state.arenaState,
          currentZone: action.payload as SafeZone,
          shrinkTimer: timestamp,
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.UPDATE_GAME_PHASE:
      const phaseDurations = {
        [GamePhase.LOBBY]: 60000,
        [GamePhase.PREPARATION]: 30000,
        [GamePhase.ACTIVE]: 300000,
        [GamePhase.ZONE_SHRINKING]: 120000,
        [GamePhase.SHRINKING]: 120000, // Alias
        [GamePhase.FINAL_ZONE]: 180000,
        [GamePhase.GAME_OVER]: 30000,
        [GamePhase.ENDED]: 30000, // Alias
      };
      
      const phaseDuration = phaseDurations[action.payload as GamePhase] || 60000;
      
      // Sync with phase manager
      phaseManager.setPhase(action.payload as GamePhase, 'server');
      
      return {
        ...state,
        gamePhase: {
          ...state.gamePhase,
          phase: action.payload as GamePhase,
          timer: {
            ...state.gamePhase.timer,
            phaseStartTime: timestamp,
            phaseEndTime: timestamp + phaseDuration,
            remainingTime: phaseDuration,
            isRunning: action.payload !== GamePhase.GAME_OVER,
          },
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.UPDATE_TIMER:
      return {
        ...state,
        gamePhase: {
          ...state.gamePhase,
          timer: {
            ...state.gamePhase.timer,
            remainingTime: Math.max(0, action.payload as number),
          },
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.ADD_GAME_UPDATE:
      return {
        ...state,
        realtimeState: {
          ...state.realtimeState,
          updates: [...state.realtimeState.updates, action.payload as GameUpdate].slice(-50), // Keep last 50 updates
          lastUpdate: timestamp,
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.SET_CONNECTION_STATUS:
      return {
        ...state,
        realtimeState: {
          ...state.realtimeState,
          connectionStatus: (action.payload as { status: 'connected' | 'disconnected' | 'reconnecting'; latency?: number }).status,
          latency: (action.payload as { status: 'connected' | 'disconnected' | 'reconnecting'; latency?: number }).latency || state.realtimeState.latency,
        },
        lastUpdated: timestamp,
      };
      
    case GameActionType.HYDRATE_STATE:
      return {
        ...(action.payload as GameState),
        lastUpdated: timestamp,
      };
      
    case GameActionType.RESET_GAME_STATE:
      return createInitialState(state.gameId);
      
    case GameActionType.UPDATE_H3_MAP:
      const { h3Map, resolution } = action.payload as { h3Map: string[]; resolution: number };
      return {
        ...state,
        arenaState: {
          ...state.arenaState,
          h3Map,
          h3Resolution: resolution,
        },
        lastUpdated: timestamp,
      };
      
    default:
      return state;
  }
};

// Create context
export const GameContext = createContext<UseGameStateReturn | null>(null);

// Storage keys for persistence
const STORAGE_KEY = 'zk-shroud-arena-game-state';
const STORAGE_VERSION = '1.0.0';

// Game Context Provider
export const GameContextProvider: React.FC<GameContextProviderProps> = ({
  children,
  gameId = 'default',
  enablePersistence = true,
  enableRealtime = false,
}) => {
  const [state, dispatch] = useReducer(gameStateReducer, createInitialState(gameId));

  // WebSocket integration for real-time updates
  const webSocketHandlers = useMemo(() => ({
    onConnect: (connectionInfo: WebSocketConnectionInfo) => {
      dispatch({
        type: GameActionType.SET_CONNECTION_STATUS,
        payload: {
          status: 'connected',
          latency: connectionInfo.latency
        }
      });
    },
    
    onDisconnect: () => {
      dispatch({
        type: GameActionType.SET_CONNECTION_STATUS,
        payload: {
          status: 'disconnected',
          latency: 0
        }
      });
    },
    
    onReconnecting: () => {
      dispatch({
        type: GameActionType.SET_CONNECTION_STATUS,
        payload: {
          status: 'reconnecting',
          latency: 0
        }
      });
    },
    
    onPlayerMove: (data: PlayerMoveMessage) => {
      // Only update if it's not our own movement
      if (data.playerId !== state.playerState.id) {
        dispatch({
          type: GameActionType.ADD_GAME_UPDATE,
          payload: {
            type: 'player_move',
            timestamp: Date.now(),
            data,
            playerId: data.playerId
          } as GameUpdate
        });
      }
    },
    
    onPlayerHealthUpdate: (data: PlayerHealthUpdateMessage) => {
      // Update health for any player including self (server is authoritative)
      if (data.playerId === state.playerState.id) {
        dispatch({
          type: GameActionType.UPDATE_PLAYER_HEALTH,
          payload: data.health
        });
      }
      
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'player_move', // Using existing type, could add new ones
          timestamp: Date.now(),
          data,
          playerId: data.playerId
        } as GameUpdate
      });
    },
    
    onPlayerElimination: (data: PlayerEliminationMessage) => {
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'player_elimination',
          timestamp: Date.now(),
          data,
          playerId: data.playerId
        } as GameUpdate
      });
    },
    
    onArenaZoneUpdate: (data: ArenaZoneUpdateMessage) => {
      dispatch({
        type: GameActionType.UPDATE_ARENA_ZONE,
        payload: data.currentZone
      });
      
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'zone_shrink',
          timestamp: Date.now(),
          data
        } as GameUpdate
      });
    },
    
    onGamePhaseChange: (data: GamePhaseChangeMessage) => {
      dispatch({
        type: GameActionType.UPDATE_GAME_PHASE,
        payload: data.phase
      });
      
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'game_phase',
          timestamp: Date.now(),
          data
        } as GameUpdate
      });
    },
    
    onGameTimerUpdate: (data: GameTimerUpdateMessage) => {
      dispatch({
        type: GameActionType.UPDATE_TIMER,
        payload: data.remainingTime
      });
    },
    
    onGameStateSync: (data: GameStateSyncMessage) => {
      // Handle full game state synchronization
      const timestamp = Date.now();
      
      // Update arena state
      dispatch({
        type: GameActionType.UPDATE_ARENA_ZONE,
        payload: data.arena.currentZone,
        timestamp
      });
      
      // Update game phase
      dispatch({
        type: GameActionType.UPDATE_GAME_PHASE,
        payload: data.gamePhase.phase,
        timestamp
      });
      
      // Add sync update
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'game_phase', // Using existing type
          timestamp,
          data
        } as GameUpdate
      });
    },
    
    onZKProofValidated: (data: ZKProofValidatedMessage) => {
      // Only update if it's our proof
      if (data.playerId === state.playerState.id) {
        dispatch({
          type: GameActionType.UPDATE_PROOF_STATUS,
          payload: {
            status: data.isValid ? ZKProofStatus.VALID : ZKProofStatus.INVALID
          }
        });
      }
      
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'proof_validation',
          timestamp: Date.now(),
          data,
          playerId: data.playerId
        } as GameUpdate
      });
    },
    
    onZKProofRequest: (data: ZKProofRequestMessage) => {
      // Only handle if it's for our player
      if (data.playerId === state.playerState.id) {
        dispatch({
          type: GameActionType.UPDATE_PROOF_STATUS,
          payload: {
            status: ZKProofStatus.PENDING
          }
        });
      }
    },
    
    onSystemAnnouncement: (data: SystemAnnouncementMessage) => {
      dispatch({
        type: GameActionType.ADD_GAME_UPDATE,
        payload: {
          type: 'game_phase', // Using existing type for announcements
          timestamp: Date.now(),
          data
        } as GameUpdate
      });
    },
    
    onH3MapUpdate: (data: H3MapUpdateMessage) => {
      console.log('📍 Received H3 map update from server:', data);
      dispatch({
        type: GameActionType.UPDATE_H3_MAP,
        payload: {
          h3Map: data.h3Map,
          resolution: data.resolution
        }
      });
    },
    
    onError: (error: Error) => {
      console.error('WebSocket error:', error);
      dispatch({
        type: GameActionType.SET_CONNECTION_STATUS,
        payload: {
          status: 'disconnected',
          latency: 0
        }
      });
    }
  }), [state.playerState.id]); // Dependencies for the handlers

  // WebSocket hook integration
  const webSocket = useWebSocket({
    gameId,
    autoConnect: enableRealtime,
    handlers: enableRealtime ? webSocketHandlers : undefined
  });

  // Utility functions
  const isPlayerInSafeZone = useCallback((): boolean => {
    const playerLocation = state.playerState.location;
    const currentZone = state.arenaState.currentZone;
    
    const distance = Math.sqrt(
      Math.pow(playerLocation.x - currentZone.center.x, 2) +
      Math.pow(playerLocation.y - currentZone.center.y, 2)
    );
    
    return distance <= currentZone.radius;
  }, [state.playerState.location, state.arenaState.currentZone]);

  const getDistanceToZoneCenter = useCallback((): number => {
    const playerLocation = state.playerState.location;
    const currentZone = state.arenaState.currentZone;
    
    return Math.sqrt(
      Math.pow(playerLocation.x - currentZone.center.x, 2) +
      Math.pow(playerLocation.y - currentZone.center.y, 2)
    );
  }, [state.playerState.location, state.arenaState.currentZone]);

  const getTimeUntilNextShrink = useCallback((): number => {
    return Math.max(0, state.gamePhase.timer.phaseEndTime - Date.now());
  }, [state.gamePhase.timer.phaseEndTime]);

  const canGenerateProof = useCallback((): boolean => {
    return Date.now() >= state.zkProofState.nextProofRequired &&
           state.zkProofState.validationStatus !== ZKProofStatus.GENERATING;
  }, [state.zkProofState.nextProofRequired, state.zkProofState.validationStatus]);

  // State persistence
  const saveStateSnapshot = useCallback((): GameStateSnapshot => {
    const snapshot = {
      state,
      timestamp: Date.now(),
      version: STORAGE_VERSION,
    };
    
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.warn('Failed to save game state to localStorage:', error);
      }
    }
    
    return snapshot;
  }, [state, enablePersistence]);

  const loadStateSnapshot = useCallback((snapshot: GameStateSnapshot) => {
    if (snapshot.version === STORAGE_VERSION) {
      dispatch({
        type: GameActionType.HYDRATE_STATE,
        payload: snapshot.state,
      });
    }
  }, []);

  // Action creators
  const actions = useMemo(() => ({
    updatePlayerLocation: (location: PlayerLocation) => {
      dispatch({
        type: GameActionType.UPDATE_PLAYER_LOCATION,
        payload: location,
      });
      
      // Send real-time update if WebSocket is enabled
      if (enableRealtime && webSocket.isConnected) {
        webSocket.sendPlayerMove(location);
      }
    },
    
    updatePlayerHealth: (health: number) => {
      dispatch({
        type: GameActionType.UPDATE_PLAYER_HEALTH,
        payload: health,
      });
    },
    
    updateProofStatus: (status: ZKProofStatus, proof?: ZKProofData) => {
      // Check if proof updates are allowed in current phase
      if (!phaseManager.isActionAllowed('canGenerateProofs') && status === ZKProofStatus.GENERATING) {
        console.warn('[GameContext] Proof generation blocked in current phase:', phaseManager.getCurrentPhase());
        return;
      }
      
      dispatch({
        type: GameActionType.UPDATE_PROOF_STATUS,
        payload: { status, proof },
      });
      
      // Send ZK proof if generated and WebSocket is enabled
      if (enableRealtime && webSocket.isConnected && proof && status === ZKProofStatus.VALID) {
        webSocket.sendZKProof(proof);
      }
    },
    
    updateArenaZone: (zone: SafeZone) => {
      dispatch({
        type: GameActionType.UPDATE_ARENA_ZONE,
        payload: zone,
      });
    },
    
    updateGamePhase: (phase: GamePhase) => {
      dispatch({
        type: GameActionType.UPDATE_GAME_PHASE,
        payload: phase,
      });
    },
    
    resetGame: () => {
      dispatch({
        type: GameActionType.RESET_GAME_STATE,
        payload: null,
      });
    },
    
    hydrateState: (snapshot: GameStateSnapshot) => {
      loadStateSnapshot(snapshot);
    },
    
    // Real-time specific actions
    sendChatMessage: (message: string, channel: 'global' | 'team' = 'global') => {
      if (enableRealtime && webSocket.isConnected) {
        webSocket.sendChatMessage(message, channel);
      }
    },
    
    connectToGame: async () => {
      if (enableRealtime && !webSocket.isConnected) {
        try {
          await webSocket.connect(gameId);
        } catch (error) {
          console.error('Failed to connect to game:', error);
          throw error;
        }
      }
    },
    
    disconnectFromGame: () => {
      if (enableRealtime && webSocket.isConnected) {
        webSocket.disconnect();
      }
    },
    
    getWebSocketStatus: () => {
      return enableRealtime ? webSocket.connectionInfo : null;
    }
  }), [loadStateSnapshot, enableRealtime, webSocket, gameId]);

  const utils = useMemo(() => ({
    isPlayerInSafeZone,
    getDistanceToZoneCenter,
    getTimeUntilNextShrink,
    canGenerateProof,
    saveStateSnapshot,
    loadStateSnapshot,
  }), [
    isPlayerInSafeZone,
    getDistanceToZoneCenter,
    getTimeUntilNextShrink,
    canGenerateProof,
    saveStateSnapshot,
    loadStateSnapshot,
  ]);

  // Load persisted state on mount
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const snapshot: GameStateSnapshot = JSON.parse(stored);
          loadStateSnapshot(snapshot);
        }
      } catch (error) {
        console.warn('Failed to load game state from localStorage:', error);
      }
    }
    
    // Initialize phase manager with current game phase
    phaseManager.setPhase(state.gamePhase.phase, 'auto', 'Initial sync with game state');
  }, [enablePersistence, loadStateSnapshot, state.gamePhase.phase]);

  // Timer updates
  useEffect(() => {
    if (!state.gamePhase.timer.isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, state.gamePhase.timer.phaseEndTime - now);
      
      dispatch({
        type: GameActionType.UPDATE_TIMER,
        payload: remaining,
      });
      
      // Auto-advance phases when timer expires
      if (remaining === 0) {
        const nextPhase = getNextGamePhase(state.gamePhase.phase);
        if (nextPhase) {
          dispatch({
            type: GameActionType.UPDATE_GAME_PHASE,
            payload: nextPhase,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.gamePhase.timer.isRunning, state.gamePhase.timer.phaseEndTime, state.gamePhase.phase]);

  // Auto-save state periodically
  useEffect(() => {
    if (!enablePersistence) return;

    const interval = setInterval(() => {
      saveStateSnapshot();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [enablePersistence, saveStateSnapshot]);

  const contextValue: UseGameStateReturn = {
    state,
    actions,
    utils,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Helper function to determine next game phase
function getNextGamePhase(currentPhase: GamePhase): GamePhase | null {
  const phaseOrder = [
    GamePhase.LOBBY,
    GamePhase.PREPARATION,
    GamePhase.ACTIVE,
    GamePhase.ZONE_SHRINKING,
    GamePhase.FINAL_ZONE,
    GamePhase.GAME_OVER,
  ];
  
  const currentIndex = phaseOrder.indexOf(currentPhase);
  return currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : null;
}

// Context consumer hook
export const useGameContext = (): UseGameStateReturn => {
  const context = React.useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameContextProvider');
  }
  return context;
};