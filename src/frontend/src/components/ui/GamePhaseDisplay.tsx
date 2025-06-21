'use client';

import React, { useEffect, useState } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import { GamePhase } from '../../types/gameState';
import { phaseManager } from '../../services/phaseManager';
import { apiController } from '../../services/apiController';

export interface GamePhaseDisplayProps {
  className?: string;
  showApiStatus?: boolean;
  showTimeRemaining?: boolean;
  compact?: boolean;
}

export const GamePhaseDisplay: React.FC<GamePhaseDisplayProps> = ({
  className = '',
  showApiStatus = true,
  showTimeRemaining = true,
  compact = false
}) => {
  const { state: gameState } = useGameContext();
  const [apiStats, setApiStats] = useState(apiController.getStats());
  const [timeUntilNextProof, setTimeUntilNextProof] = useState(0);
  const [phasePermissions, setPhasePermissions] = useState(phaseManager.getPhasePermissions());

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      setApiStats(apiController.getStats());
      setTimeUntilNextProof(Math.ceil(apiController.getTimeUntilNextProof() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for phase changes
  useEffect(() => {
    const listenerId = 'phase-display';
    phaseManager.addPhaseListener(listenerId, () => {
      setPhasePermissions(phaseManager.getPhasePermissions());
    });

    return () => {
      phaseManager.removePhaseListener(listenerId);
    };
  }, []);

  const getPhaseColor = (phase: GamePhase): string => {
    switch (phase) {
      case GamePhase.LOBBY:
        return 'bg-gray-600 text-gray-200';
      case GamePhase.PREPARATION:
        return 'bg-blue-600 text-blue-200';
      case GamePhase.ACTIVE:
        return 'bg-green-600 text-green-200';
      case GamePhase.ZONE_SHRINKING:
      case GamePhase.SHRINKING:
        return 'bg-yellow-600 text-yellow-200';
      case GamePhase.FINAL_ZONE:
        return 'bg-orange-600 text-orange-200';
      case GamePhase.GAME_OVER:
      case GamePhase.ENDED:
        return 'bg-red-600 text-red-200';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const getPhaseIcon = (phase: GamePhase): string => {
    switch (phase) {
      case GamePhase.LOBBY:
        return '🎮';
      case GamePhase.PREPARATION:
        return '⏳';
      case GamePhase.ACTIVE:
        return '⚔️';
      case GamePhase.ZONE_SHRINKING:
      case GamePhase.SHRINKING:
        return '⚠️';
      case GamePhase.FINAL_ZONE:
        return '🔥';
      case GamePhase.GAME_OVER:
      case GamePhase.ENDED:
        return '🏆';
      default:
        return '🎮';
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getPhaseColor(gameState.gamePhase.phase)} ${className}`}>
        <span className="text-lg">{getPhaseIcon(gameState.gamePhase.phase)}</span>
        <span className="font-medium">{gameState.gamePhase.phase.toUpperCase()}</span>
        {showTimeRemaining && gameState.gamePhase.timer.isRunning && (
          <span className="text-sm opacity-80">
            {formatTime(gameState.gamePhase.timer.remainingTime)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg p-4 border border-gray-700 ${className}`}>
      {/* Phase Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getPhaseIcon(gameState.gamePhase.phase)}</span>
          <div>
            <h4 className="text-lg font-semibold text-white">
              {gameState.gamePhase.phase.charAt(0).toUpperCase() + gameState.gamePhase.phase.slice(1).replace('_', ' ')}
            </h4>
            <p className="text-sm text-gray-400">
              {phaseManager.getPhaseDescription()}
            </p>
          </div>
        </div>
        {showTimeRemaining && gameState.gamePhase.timer.isRunning && (
          <div className="text-right">
            <div className="text-2xl font-mono text-white">
              {formatTime(gameState.gamePhase.timer.remainingTime)}
            </div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-800 rounded px-3 py-2">
          <div className="text-xs text-gray-500">Players</div>
          <div className="text-sm font-medium text-white">
            {gameState.gamePhase.playerCount}/{gameState.gamePhase.maxPlayers}
          </div>
        </div>
        <div className="bg-gray-800 rounded px-3 py-2">
          <div className="text-xs text-gray-500">Round</div>
          <div className="text-sm font-medium text-white">
            #{gameState.gamePhase.roundNumber}
          </div>
        </div>
      </div>

      {/* API Status */}
      {showApiStatus && (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
            <span className="text-sm text-gray-400">API Status</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                phasePermissions.canMakeAPIRequests ? 'text-green-400' : 'text-red-400'
              }`}>
                {phasePermissions.canMakeAPIRequests ? 'Active' : 'Blocked'}
              </span>
              <div className={`w-2 h-2 rounded-full ${
                phasePermissions.canMakeAPIRequests ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
          </div>

          {/* Proof Generation Status */}
          <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
            <span className="text-sm text-gray-400">Proof Generation</span>
            <div className="flex items-center gap-2">
              {phasePermissions.canGenerateProofs ? (
                <>
                  {timeUntilNextProof > 0 ? (
                    <span className="text-sm text-yellow-400">
                      {timeUntilNextProof}s cooldown
                    </span>
                  ) : (
                    <span className="text-sm text-green-400">Ready</span>
                  )}
                </>
              ) : (
                <span className="text-sm text-red-400">Disabled</span>
              )}
            </div>
          </div>

          {/* API Call Stats */}
          {apiStats.totalCalls > 0 && (
            <div className="bg-gray-800 rounded px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">API Call Statistics</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Calls:</span>
                <span className="text-white">{apiStats.totalCalls}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Blocked:</span>
                <span className="text-red-400">{apiStats.blockedCalls}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Allowed:</span>
                <span className="text-green-400">{apiStats.allowedCalls}</span>
              </div>
              {apiStats.blockedCalls > 0 && apiStats.lastBlockedReason && (
                <div className="mt-1 text-xs text-red-400 italic">
                  Last blocked: {apiStats.lastBlockedReason}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Phase-specific messages */}
      {gameState.gamePhase.phase === GamePhase.LOBBY && (
        <div className="mt-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded p-2">
          <div className="text-sm text-blue-200">
            Waiting for players to join. API calls are disabled to prevent server load.
          </div>
        </div>
      )}

      {gameState.gamePhase.phase === GamePhase.PREPARATION && (
        <div className="mt-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-2">
          <div className="text-sm text-yellow-200">
            Prepare for battle! Test proofs are allowed during this phase.
          </div>
        </div>
      )}

      {(gameState.gamePhase.phase === GamePhase.ZONE_SHRINKING || gameState.gamePhase.phase === GamePhase.SHRINKING) && (
        <div className="mt-3 bg-orange-900 bg-opacity-30 border border-orange-700 rounded p-2">
          <div className="text-sm text-orange-200">
            ⚠️ Zone is shrinking! Move to the safe area!
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePhaseDisplay;