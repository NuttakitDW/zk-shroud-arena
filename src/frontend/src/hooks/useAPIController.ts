/**
 * Hook to manage API Controller state and sync with game phase
 */

import { useEffect, useCallback, useState } from 'react';
import { useGameState } from './useGameState';
import { apiController } from '../services/apiController';
import { GamePhase } from '../types/gameState';

export interface UseAPIControllerReturn {
  currentPhase: GamePhase;
  stats: {
    totalCalls: number;
    blockedCalls: number;
    allowedCalls: number;
    lastBlockedReason: string;
    blockRate: number;
  };
  timeUntilNextProof: number;
  isProofAllowed: boolean;
  resetStats: () => void;
}

export const useAPIController = (): UseAPIControllerReturn => {
  const { state: gameState } = useGameState();
  const [stats, setStats] = useState(apiController.getStats());
  const [timeUntilNextProof, setTimeUntilNextProof] = useState(0);

  // Sync game phase with API controller
  useEffect(() => {
    const currentPhase = gameState.gamePhase.phase;
    apiController.setGamePhase(currentPhase);
    console.log(`🔄 API Controller: Synced to ${currentPhase} phase`);
  }, [gameState.gamePhase.phase]);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStats(apiController.getStats());
      setTimeUntilNextProof(Math.ceil(apiController.getTimeUntilNextProof() / 1000));
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetStats = useCallback(() => {
    apiController.resetStats();
    setStats(apiController.getStats());
  }, []);

  const isProofAllowed = gameState.gamePhase.phase === GamePhase.ACTIVE ||
                         gameState.gamePhase.phase === GamePhase.SHRINKING ||
                         gameState.gamePhase.phase === GamePhase.ZONE_SHRINKING ||
                         gameState.gamePhase.phase === GamePhase.FINAL_CIRCLE;

  return {
    currentPhase: gameState.gamePhase.phase,
    stats: {
      ...stats,
      blockRate: stats.totalCalls > 0 ? (stats.blockedCalls / stats.totalCalls) * 100 : 0
    },
    timeUntilNextProof,
    isProofAllowed,
    resetStats
  };
};