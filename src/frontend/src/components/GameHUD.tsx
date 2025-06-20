'use client';

import React from 'react';
import { Heart, Shield, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { GamePhase, ZKProofStatus } from '../types/gameState';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  isInSafeZone: boolean;
  timeUntilShrink: number;
  gamePhase: GamePhase;
  zkProofStatus: ZKProofStatus;
}

/**
 * GameHUD - Heads-up display showing critical game information
 */
export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  maxHealth,
  isInSafeZone,
  timeUntilShrink,
  gamePhase,
  zkProofStatus
}) => {
  const healthPercentage = (health / maxHealth) * 100;
  const shrinkTimeMinutes = Math.floor(timeUntilShrink / 60000);
  const shrinkTimeSeconds = Math.floor((timeUntilShrink % 60000) / 1000);

  const getHealthColor = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getZoneStatusColor = () => {
    return isInSafeZone ? 'text-green-400' : 'text-red-400';
  };

  const getZKProofIcon = () => {
    switch (zkProofStatus) {
      case ZKProofStatus.GENERATING:
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />;
      case ZKProofStatus.VALID:
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case ZKProofStatus.INVALID:
      case ZKProofStatus.ERROR:
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Health Bar */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-gray-300">Health</span>
              </div>
              <span className="text-sm text-gray-400">{health}/{maxHealth}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(healthPercentage)}`}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </div>

          {/* Zone Status */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Shield className={`h-4 w-4 ${getZoneStatusColor()}`} />
                <span className="text-sm font-medium text-gray-300">Zone Status</span>
              </div>
            </div>
            <div className={`text-sm font-medium ${getZoneStatusColor()}`}>
              {isInSafeZone ? 'Safe Zone' : 'Danger Zone'}
            </div>
            {!isInSafeZone && (
              <div className="text-xs text-red-400 mt-1">
                Taking damage!
              </div>
            )}
          </div>

          {/* Zone Timer */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-300">Next Shrink</span>
              </div>
            </div>
            <div className="text-sm font-medium text-yellow-400">
              {shrinkTimeMinutes}:{shrinkTimeSeconds.toString().padStart(2, '0')}
            </div>
            {timeUntilShrink < 30000 && (
              <div className="text-xs text-red-400 mt-1 animate-pulse">
                Zone shrinking soon!
              </div>
            )}
          </div>

          {/* ZK Proof Status */}
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getZKProofIcon()}
                <span className="text-sm font-medium text-gray-300">ZK Proof</span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-400">
              {zkProofStatus === ZKProofStatus.NONE && 'Ready'}
              {zkProofStatus === ZKProofStatus.GENERATING && 'Generating...'}
              {zkProofStatus === ZKProofStatus.PENDING && 'Verifying...'}
              {zkProofStatus === ZKProofStatus.VALID && 'Verified'}
              {zkProofStatus === ZKProofStatus.INVALID && 'Invalid'}
              {zkProofStatus === ZKProofStatus.ERROR && 'Error'}
              {zkProofStatus === ZKProofStatus.EXPIRED && 'Expired'}
            </div>
          </div>
        </div>

        {/* Game Phase Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-purple-600/20 border border-purple-500/50 rounded-full px-4 py-2">
            <span className="text-sm font-medium text-purple-400">
              {gamePhase === GamePhase.LOBBY && 'Waiting in Lobby'}
              {gamePhase === GamePhase.PREPARATION && 'Preparation Phase'}
              {gamePhase === GamePhase.ACTIVE && 'Battle Active'}
              {gamePhase === GamePhase.ZONE_SHRINKING && 'Zone Shrinking'}
              {gamePhase === GamePhase.FINAL_ZONE && 'Final Zone'}
              {gamePhase === GamePhase.GAME_OVER && 'Game Over'}
            </span>
          </div>
        </div>

        {/* Action Hints */}
        <div className="mt-3 text-center">
          <div className="text-xs text-gray-500">
            {gamePhase === GamePhase.ACTIVE && (
              <>
                Click on the map to move • Generate ZK proofs to hide your location
              </>
            )}
            {gamePhase === GamePhase.PREPARATION && (
              <>
                Prepare for battle • Position yourself strategically
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;