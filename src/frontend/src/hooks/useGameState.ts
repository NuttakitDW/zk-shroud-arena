import { useEffect, useMemo, useState } from 'react';
import { useGameContext } from '../contexts/GameContext';
import {
  GameState,
  PlayerLocation,
  ZKProofStatus,
  ZKProofData,
  GamePhase,
  SafeZone,
  Coordinates,
  GameUpdate,
  GameError,
  GameStateSnapshot,
} from '../types/gameState';

/**
 * Custom hook for game state management
 * Provides abstraction layer over GameContext with additional utilities
 */
export const useGameState = () => {
  const context = useGameContext();
  
  if (!context) {
    throw new Error('useGameState must be used within GameContextProvider');
  }

  return context;
};

/**
 * Hook for player-specific state and actions
 */
export const usePlayerState = () => {
  const { state, actions, utils } = useGameState();
  
  const playerActions = useMemo(() => ({
    movePlayer: (coordinates: Coordinates) => {
      const location: PlayerLocation = {
        x: coordinates.x,
        y: coordinates.y,
        timestamp: Date.now(),
        zone: utils.isPlayerInSafeZone() ? 'safe' : 'danger',
      };
      actions.updatePlayerLocation(location);
    },
    
    takeDamage: (damage: number) => {
      const newHealth = Math.max(0, state.playerState.health - damage);
      actions.updatePlayerHealth(newHealth);
    },
    
    heal: (amount: number) => {
      const newHealth = Math.min(state.playerState.maxHealth, state.playerState.health + amount);
      actions.updatePlayerHealth(newHealth);
    },
    
    generateProof: async (location: Coordinates): Promise<ZKProofData | null> => {
      if (!utils.canGenerateProof()) {
        return null;
      }
      
      actions.updateProofStatus(ZKProofStatus.GENERATING);
      
      try {
        // Simulate proof generation (replace with actual ZK proof generation)
        const proof: ZKProofData = {
          proof: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          publicInputs: [location.x.toString(), location.y.toString()],
          timestamp: Date.now(),
          location,
          hash: `hash_${Date.now()}`,
        };
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        actions.updateProofStatus(ZKProofStatus.VALID, proof);
        return proof;
      } catch {
        actions.updateProofStatus(ZKProofStatus.ERROR);
        return null;
      }
    },
  }), [state.playerState, actions, utils]);

  return {
    playerState: state.playerState,
    actions: playerActions,
    isInSafeZone: utils.isPlayerInSafeZone(),
    distanceToCenter: utils.getDistanceToZoneCenter(),
    canGenerateProof: utils.canGenerateProof(),
  };
};

/**
 * Hook for arena state management
 */
export const useArenaState = () => {
  const { state, actions } = useGameState();
  
  const arenaActions = useMemo(() => ({
    shrinkZone: (newZone: SafeZone) => {
      actions.updateArenaZone(newZone);
    },
    
    calculateNextZone: (): SafeZone => {
      const current = state.arenaState.currentZone;
      return {
        id: `zone_${Date.now()}`,
        center: {
          x: current.center.x + (Math.random() - 0.5) * 200,
          y: current.center.y + (Math.random() - 0.5) * 200,
        },
        radius: current.radius * 0.8, // Shrink by 20%
        isActive: true,
        shrinkStartTime: Date.now(),
        shrinkEndTime: Date.now() + 120000, // 2 minutes shrink time
      };
    },
  }), [state.arenaState, actions]);

  return {
    arenaState: state.arenaState,
    actions: arenaActions,
  };
};

/**
 * Hook for ZK proof state management
 */
export const useZKProofState = () => {
  const { state, actions } = useGameState();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const proofActions = useMemo(() => ({
    validateProof: async (proof: ZKProofData): Promise<boolean> => {
      actions.updateProofStatus(ZKProofStatus.PENDING);
      
      try {
        // Simulate proof validation (replace with actual validation)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple validation - check if proof is recent
        const isValid = Date.now() - proof.timestamp < 300000; // 5 minutes
        
        actions.updateProofStatus(isValid ? ZKProofStatus.VALID : ZKProofStatus.INVALID);
        return isValid;
      } catch {
        actions.updateProofStatus(ZKProofStatus.ERROR);
        return false;
      }
    },
    
    clearErrors: () => {
      // Clear errors by updating with current status but empty errors
      actions.updateProofStatus(state.zkProofState.validationStatus);
    },
  }), [state.zkProofState, actions]);

  // Update generating state based on proof status
  useEffect(() => {
    setIsGenerating(state.zkProofState.validationStatus === ZKProofStatus.GENERATING);
  }, [state.zkProofState.validationStatus]);

  return {
    zkProofState: state.zkProofState,
    actions: proofActions,
    isGenerating,
  };
};

/**
 * Hook for game phase management
 */
export const useGamePhase = () => {
  const { state, actions, utils } = useGameState();
  
  const phaseActions = useMemo(() => ({
    startGame: () => {
      actions.updateGamePhase(GamePhase.PREPARATION);
    },
    
    endGame: () => {
      actions.updateGamePhase(GamePhase.GAME_OVER);
    },
    
    advancePhase: () => {
      const currentPhase = state.gamePhase.phase;
      const phaseOrder = [
        GamePhase.LOBBY,
        GamePhase.PREPARATION,
        GamePhase.ACTIVE,
        GamePhase.ZONE_SHRINKING,
        GamePhase.FINAL_ZONE,
        GamePhase.GAME_OVER,
      ];
      
      const currentIndex = phaseOrder.indexOf(currentPhase);
      if (currentIndex < phaseOrder.length - 1) {
        actions.updateGamePhase(phaseOrder[currentIndex + 1]);
      }
    },
  }), [state.gamePhase.phase, actions]);

  return {
    gamePhase: state.gamePhase,
    actions: phaseActions,
    timeUntilNextShrink: utils.getTimeUntilNextShrink(),
    isGameActive: state.gamePhase.phase === GamePhase.ACTIVE,
    isGameOver: state.gamePhase.phase === GamePhase.GAME_OVER,
  };
};

/**
 * Hook for real-time updates and connection status
 */
export const useRealtimeState = () => {
  const { state, actions } = useGameState();
  const [connectionError, setConnectionError] = useState<GameError | null>(null);
  
  const realtimeActions = useMemo(() => ({
    addUpdate: (update: GameUpdate) => {
      // TODO: Implement proper update handling based on update type
      console.log('Received update:', update);
    },
    
    simulateLatency: async (): Promise<number> => {
      const start = Date.now();
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      return Date.now() - start;
    },
  }), [actions]);

  // Monitor connection status
  useEffect(() => {
    if (state.realtimeState.connectionStatus === 'disconnected') {
      setConnectionError({
        code: 'CONNECTION_LOST',
        message: 'Lost connection to game server',
        timestamp: Date.now(),
      });
    } else {
      setConnectionError(null);
    }
  }, [state.realtimeState.connectionStatus]);

  return {
    realtimeState: state.realtimeState,
    actions: realtimeActions,
    connectionError,
    isConnected: state.realtimeState.connectionStatus === 'connected',
    latency: state.realtimeState.latency,
  };
};

/**
 * Hook for game statistics and analytics
 */
export const useGameStats = () => {
  const { state } = useGameState();
  
  const stats = useMemo(() => {
    const uptime = Date.now() - state.gamePhase.timer.phaseStartTime;
    const proofSuccessRate = state.zkProofState.proofHistory.length > 0
      ? state.zkProofState.proofHistory.filter(p => p.timestamp > 0).length / state.zkProofState.proofHistory.length
      : 0;
    
    return {
      gameUptime: uptime,
      totalMoves: state.realtimeState.updates.filter(u => u.type === 'player_move').length,
      proofSuccessRate,
      averageLatency: state.realtimeState.latency,
      timeInSafeZone: 0, // Would need to track this over time
      damageReceived: state.playerState.maxHealth - state.playerState.health,
    };
  }, [state]);

  return stats;
};

/**
 * Hook for game state persistence
 */
export const useGamePersistence = () => {
  const { utils } = useGameState();
  
  const persistenceActions = useMemo(() => ({
    save: () => {
      return utils.saveStateSnapshot();
    },
    
    load: (snapshot: GameStateSnapshot) => {
      utils.loadStateSnapshot(snapshot);
    },
    
    exportState: () => {
      const snapshot = utils.saveStateSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-state-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    importState: (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const snapshot = JSON.parse(e.target?.result as string);
            utils.loadStateSnapshot(snapshot);
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      });
    },
  }), [utils]);

  return persistenceActions;
};

/**
 * Hook for debugging and development
 */
export const useGameDebug = () => {
  const { state, actions } = useGameState();
  
  const debugActions = useMemo(() => ({
    logState: () => {
      console.log('Current Game State:', state);
    },
    
    simulateZoneShrink: () => {
      const currentZone = state.arenaState.currentZone;
      const newZone: SafeZone = {
        id: `debug_zone_${Date.now()}`,
        center: currentZone.center,
        radius: currentZone.radius * 0.7,
        isActive: true,
      };
      actions.updateArenaZone(newZone);
    },
    
    simulatePlayerDamage: (damage: number = 10) => {
      const newHealth = Math.max(0, state.playerState.health - damage);
      actions.updatePlayerHealth(newHealth);
    },
    
    skipToPhase: (phase: GamePhase) => {
      actions.updateGamePhase(phase);
    },
    
    resetGame: () => {
      actions.resetGame();
    },
  }), [state, actions]);

  return {
    debugActions,
    gameState: state,
    stateSize: JSON.stringify(state).length,
  };
};