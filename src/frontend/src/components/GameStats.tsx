'use client';

import React from 'react';
import { 
  Heart, 
  Shield, 
  Clock, 
  Target, 
  Activity, 
  Zap, 
  Users, 
  MapPin,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { PlayerState, GamePhaseState, ArenaState, ZKProofState, ZKProofStatus } from '../types/gameState';

interface GameStatsProps {
  playerState: PlayerState;
  gamePhase: GamePhaseState;
  arenaState: ArenaState;
  zkProofState: ZKProofState;
}

/**
 * GameStats - Right sidebar showing comprehensive game statistics
 */
export const GameStats: React.FC<GameStatsProps> = ({
  playerState,
  gamePhase,
  arenaState,
  zkProofState
}) => {
  const proofSuccessRate = zkProofState.proofHistory.length > 0 
    ? (zkProofState.proofHistory.filter(p => p.timestamp > 0).length / zkProofState.proofHistory.length) * 100
    : 0;

  const timeSinceLastActivity = Date.now() - playerState.lastActivity;
  const isPlayerActive = timeSinceLastActivity < 10000; // 10 seconds

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getZoneDistance = (): number => {
    const dx = playerState.location.x - arenaState.currentZone.center.x;
    const dy = playerState.location.y - arenaState.currentZone.center.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Player Stats */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-400" />
          Player Stats
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Health</span>
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-white font-medium">
                {playerState.health}/{playerState.maxHealth}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                playerState.isAlive ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                playerState.isAlive ? 'text-green-400' : 'text-red-400'
              }`}>
                {playerState.isAlive ? 'Alive' : 'Eliminated'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Activity</span>
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${
                isPlayerActive ? 'text-green-400' : 'text-gray-400'
              }`} />
              <span className="text-white text-sm">
                {formatTime(timeSinceLastActivity)} ago
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Arena Stats */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-purple-400" />
          Arena Info
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Zone Radius</span>
            <span className="text-white font-medium">
              {Math.round(arenaState.currentZone.radius)}m
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Distance to Center</span>
            <span className="text-white font-medium">
              {Math.round(getZoneDistance())}m
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Arena Size</span>
            <span className="text-white font-medium">
              {arenaState.arenaSize.width}×{arenaState.arenaSize.height}
            </span>
          </div>
        </div>
      </div>

      {/* Game Phase */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-yellow-400" />
          Game Phase
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Current Phase</span>
            <span className="text-white font-medium capitalize">
              {gamePhase.phase.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Time Remaining</span>
            <span className="text-white font-medium">
              {formatTime(gamePhase.timer.remainingTime)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Players</span>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-white font-medium">
                {gamePhase.playerCount}/{gamePhase.maxPlayers}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Round</span>
            <span className="text-white font-medium">
              #{gamePhase.roundNumber}
            </span>
          </div>
        </div>
      </div>

      {/* ZK Proof Stats */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-400" />
          ZK Proofs
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Status</span>
            <div className="flex items-center space-x-2">
              {zkProofState.validationStatus === ZKProofStatus.VALID && (
                <CheckCircle className="h-4 w-4 text-green-400" />
              )}
              {zkProofState.validationStatus === ZKProofStatus.ERROR && (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                zkProofState.validationStatus === ZKProofStatus.VALID ? 'text-green-400' :
                zkProofState.validationStatus === ZKProofStatus.ERROR ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {zkProofState.validationStatus}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Success Rate</span>
            <span className="text-white font-medium">
              {proofSuccessRate.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total Proofs</span>
            <span className="text-white font-medium">
              {zkProofState.proofHistory.length}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Errors</span>
            <span className="text-red-400 font-medium">
              {zkProofState.errors.length}
            </span>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-400" />
          Performance
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Game Uptime</span>
            <span className="text-white font-medium">
              {formatTime(Date.now() - gamePhase.timer.phaseStartTime)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Last Update</span>
            <span className="text-white font-medium">
              {formatTime(Date.now() - playerState.lastActivity)} ago
            </span>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {zkProofState.errors.length > 0 && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/50">
          <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Recent Errors
          </h3>
          
          <div className="space-y-2">
            {zkProofState.errors.slice(-3).map((error, index) => (
              <div key={index} className="text-sm text-red-300 bg-red-900/30 rounded p-2">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStats;