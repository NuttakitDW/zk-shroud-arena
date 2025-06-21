/**
 * API Controller Status Component
 * Displays real-time status of API calls and phase restrictions
 */

import React from 'react';
import { useAPIController } from '../../hooks/useAPIController';
import { GamePhase } from '../../types/gameState';

export interface APIControllerStatusProps {
  className?: string;
  compact?: boolean;
}

export const APIControllerStatus: React.FC<APIControllerStatusProps> = ({
  className = '',
  compact = false
}) => {
  const { currentPhase, stats, timeUntilNextProof, isProofAllowed } = useAPIController();

  const getPhaseColor = (phase: GamePhase): string => {
    switch (phase) {
      case GamePhase.WAITING:
      case GamePhase.PREPARATION:
      case GamePhase.GAME_OVER:
        return 'text-red-400';
      case GamePhase.ACTIVE:
      case GamePhase.SHRINKING:
      case GamePhase.ZONE_SHRINKING:
      case GamePhase.FINAL_CIRCLE:
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (): JSX.Element => {
    if (!isProofAllowed) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    }
    if (timeUntilNextProof > 0) {
      return (
        <svg className="w-5 h-5 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  if (compact) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getPhaseColor(currentPhase)}`}>
              {currentPhase}
            </span>
          </div>
          {stats.blockedCalls > 0 && (
            <span className="text-xs text-red-400">
              {stats.blockedCalls} blocked
            </span>
          )}
        </div>
        {timeUntilNextProof > 0 && isProofAllowed && (
          <div className="mt-2 text-xs text-yellow-400">
            Next proof in {timeUntilNextProof}s
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">API Controller</h3>
        {getStatusIcon()}
      </div>

      {/* Current Phase Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Game Phase</span>
          <span className={`text-sm font-medium ${getPhaseColor(currentPhase)}`}>
            {currentPhase}
          </span>
        </div>
        <div className="mt-1">
          <span className="text-xs text-gray-500">
            Proofs: {isProofAllowed ? 'Allowed' : 'Blocked'}
          </span>
        </div>
      </div>

      {/* API Call Statistics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-800 rounded p-2">
          <div className="text-xs text-gray-500">Total Calls</div>
          <div className="text-lg font-bold text-white">{stats.totalCalls}</div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <div className="text-xs text-gray-500">Blocked</div>
          <div className="text-lg font-bold text-red-400">{stats.blockedCalls}</div>
        </div>
      </div>

      {/* Block Rate */}
      {stats.totalCalls > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Block Rate</span>
            <span className={stats.blockRate > 50 ? 'text-red-400' : 'text-green-400'}>
              {stats.blockRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.blockRate > 50 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${stats.blockRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Last Blocked Reason */}
      {stats.lastBlockedReason && (
        <div className="mb-3 p-2 bg-red-900 bg-opacity-30 border border-red-800 rounded">
          <div className="text-xs text-red-400">
            <span className="font-medium">Last Block:</span> {stats.lastBlockedReason}
          </div>
        </div>
      )}

      {/* Proof Cooldown */}
      {isProofAllowed && timeUntilNextProof > 0 && (
        <div className="p-2 bg-yellow-900 bg-opacity-30 border border-yellow-800 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs text-yellow-400">Proof Cooldown</span>
            <span className="text-sm font-bold text-yellow-300">{timeUntilNextProof}s</span>
          </div>
        </div>
      )}

      {/* Phase Hint */}
      {!isProofAllowed && (
        <div className="mt-3 p-2 bg-blue-900 bg-opacity-30 border border-blue-800 rounded">
          <div className="text-xs text-blue-400">
            💡 Proofs will be enabled when the game starts
          </div>
        </div>
      )}
    </div>
  );
};

export default APIControllerStatus;