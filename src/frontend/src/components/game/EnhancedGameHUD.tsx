'use client';

import React, { useEffect, useState } from 'react';
import { 
  Heart, Shield, Clock, AlertTriangle, CheckCircle, Loader2, 
  Coins, Skull, Target, TrendingUp, AlertCircle, Volume2 
} from 'lucide-react';
import { GamePhase, ZKProofStatus, GameWarning } from '../../types/gameState';
import { useGameContext } from '../../contexts/GameContext';
import { GameRulesEngine } from './GameRulesEngine';
import { soundEffects } from '../../services/soundEffects';

interface EnhancedGameHUDProps {
  className?: string;
}

/**
 * Enhanced GameHUD with coin display, warnings, and sound effects
 */
export const EnhancedGameHUD: React.FC<EnhancedGameHUDProps> = ({ className = '' }) => {
  const { state, utils } = useGameContext();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [rulesEngine] = useState(() => new GameRulesEngine());
  
  const {
    playerState,
    arenaState,
    gamePhase,
    zkProofState,
    warnings = []
  } = state;

  // Calculate derived values
  const healthPercentage = (playerState.health / playerState.maxHealth) * 100;
  const isInSafeZone = utils.isPlayerInSafeZone();
  const distanceToZone = utils.getDistanceToZoneCenter();
  const timers = rulesEngine.getTimers(state);

  // Format time display
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getHealthColor = () => {
    if (healthPercentage > 60) return 'bg-green-500';
    if (healthPercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500 animate-pulse';
  };

  const getZoneStatusColor = () => {
    if (isInSafeZone) return 'text-green-400';
    if (playerState.gracePeriodEnds && Date.now() < playerState.gracePeriodEnds) return 'text-yellow-400';
    return 'text-red-400 animate-pulse';
  };

  const getZKProofIcon = () => {
    switch (zkProofState.validationStatus) {
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

  // Update sound effects state
  useEffect(() => {
    soundEffects.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // Watch for coin changes
  const [lastCoins, setLastCoins] = useState(playerState.coins);
  useEffect(() => {
    if (playerState.coins > lastCoins) {
      const coinGain = playerState.coins - lastCoins;
      soundEffects.playCoinCollect(coinGain);
    }
    setLastCoins(playerState.coins);
  }, [playerState.coins, lastCoins]);

  // Watch for health changes
  const [lastHealth, setLastHealth] = useState(playerState.health);
  useEffect(() => {
    if (playerState.health < lastHealth) {
      const damage = lastHealth - playerState.health;
      soundEffects.playDamageSound(damage, playerState.maxHealth);
    }
    setLastHealth(playerState.health);
  }, [playerState.health, lastHealth, playerState.maxHealth]);

  // Watch for warnings
  const [lastWarningCount, setLastWarningCount] = useState(warnings.length);
  useEffect(() => {
    if (warnings.length > lastWarningCount) {
      const latestWarning = warnings[warnings.length - 1];
      if (latestWarning.severity === 'critical') {
        soundEffects.play('zone_warning');
      } else if (latestWarning.severity === 'high') {
        soundEffects.play('grace_period_warning');
      }
    }
    setLastWarningCount(warnings.length);
  }, [warnings, lastWarningCount]);
  
  // Watch for zone timer
  useEffect(() => {
    if (timers.warningActive && timers.zoneCountdown <= 5000) {
      soundEffects.playZoneWarningSequence(Math.floor(timers.zoneCountdown / 1000));
    }
  }, [timers.warningActive, Math.floor(timers.zoneCountdown / 1000)]);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      {/* Main HUD Container */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto p-4">
          {/* Top Row - Game Phase & Timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gamePhase.phase === GamePhase.ACTIVE ? 'bg-green-500 animate-pulse' :
                  gamePhase.phase === GamePhase.ZONE_SHRINKING ? 'bg-yellow-500 animate-pulse' :
                  gamePhase.phase === GamePhase.FINAL_ZONE ? 'bg-red-500 animate-pulse' :
                  'bg-purple-500'
                }`}></div>
                <span className="text-white font-semibold uppercase tracking-wide text-sm">
                  {gamePhase.phase.replace('_', ' ')}
                </span>
              </div>
              
              {/* Zone Timer */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                timers.warningActive ? 'bg-red-900/50 animate-pulse' : 'bg-gray-800/50'
              }`}>
                <Clock className={`h-4 w-4 ${timers.warningActive ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className={`font-mono font-bold ${
                  timers.warningActive ? 'text-red-400' : 'text-white'
                }`}>
                  {formatTime(timers.zoneCountdown)}
                </span>
                {timers.warningActive && (
                  <span className="text-xs text-red-400 animate-pulse">ZONE CLOSING!</span>
                )}
              </div>
            </div>

            {/* Players Alive & Score */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-white font-bold">{playerState.score}</span>
                <span className="text-gray-400 text-sm">pts</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-1 rounded-full">
                <Skull className="h-4 w-4 text-orange-400" />
                <span className="text-white font-bold">{playerState.eliminations}</span>
              </div>
              
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <Volume2 className={`h-4 w-4 ${audioEnabled ? 'text-green-400' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>

          {/* Bottom Row - Player Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Health */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Heart className={`h-4 w-4 ${healthPercentage <= 30 ? 'text-red-400 animate-pulse' : 'text-red-400'}`} />
                  <span className="text-sm font-medium text-gray-300">Health</span>
                </div>
                <span className="text-sm text-white font-bold">
                  {playerState.health}/{playerState.maxHealth}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getHealthColor()}`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
            </div>

            {/* Coins */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-300">Coins</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-lg font-bold text-yellow-400">{playerState.coins}</span>
                  {isInSafeZone && gamePhase.phase === GamePhase.ACTIVE && (
                    <span className="text-xs text-green-400">+1/s</span>
                  )}
                  {isInSafeZone && gamePhase.phase === GamePhase.FINAL_ZONE && (
                    <span className="text-xs text-purple-400">+3/s</span>
                  )}
                </div>
              </div>
            </div>

            {/* Zone Status */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isInSafeZone ? 'bg-green-400' : 'bg-red-400 animate-pulse'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-300">Zone</span>
                </div>
                <div className={`text-sm font-bold ${getZoneStatusColor()}`}>
                  {isInSafeZone ? 'Safe' : 
                   playerState.gracePeriodEnds && Date.now() < playerState.gracePeriodEnds ? 
                   `Grace ${Math.ceil((playerState.gracePeriodEnds - Date.now()) / 1000)}s` : 
                   'DANGER'}
                </div>
              </div>
              {!isInSafeZone && (
                <div className="text-xs text-red-400 mt-1">
                  {Math.round(distanceToZone)}m to safety
                </div>
              )}
            </div>

            {/* Position */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Position</span>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-400">
                X:{Math.round(playerState.location.x)} Y:{Math.round(playerState.location.y)}
              </div>
            </div>

            {/* ZK Proof Status */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getZKProofIcon()}
                  <span className="text-sm font-medium text-gray-300">ZK Proof</span>
                </div>
                <span className="text-xs text-gray-400">
                  {zkProofState.validationStatus === ZKProofStatus.VALID && 'Protected'}
                  {zkProofState.validationStatus === ZKProofStatus.GENERATING && 'Generating...'}
                  {zkProofState.validationStatus === ZKProofStatus.NONE && 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Display */}
      {warnings.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 px-4 space-y-2 max-w-md mx-auto">
          {warnings.slice(-3).map((warning) => (
            <div
              key={warning.id}
              className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border flex items-center space-x-2 animate-pulse ${
                warning.severity === 'critical' ? 'bg-red-900/90 border-red-500' :
                warning.severity === 'high' ? 'bg-orange-900/90 border-orange-500' :
                warning.severity === 'medium' ? 'bg-yellow-900/90 border-yellow-500' :
                'bg-gray-800/90 border-gray-600'
              }`}
            >
              <AlertCircle className={`h-5 w-5 ${
                warning.severity === 'critical' ? 'text-red-400' :
                warning.severity === 'high' ? 'text-orange-400' :
                warning.severity === 'medium' ? 'text-yellow-400' :
                'text-gray-400'
              }`} />
              <span className="text-white font-medium text-sm">{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Hints */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="text-xs text-gray-400">
            {gamePhase.phase === GamePhase.ACTIVE && isInSafeZone && (
              <>Stay in the zone to earn coins • Eliminate players for bonus rewards</>
            )}
            {gamePhase.phase === GamePhase.ACTIVE && !isInSafeZone && (
              <>⚠️ Get to the safe zone immediately! Taking damage!</>
            )}
            {gamePhase.phase === GamePhase.PREPARATION && (
              <>Prepare for battle • Find a strategic position</>
            )}
            {gamePhase.phase === GamePhase.ZONE_SHRINKING && (
              <>Zone is shrinking! Move to the new safe area</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGameHUD;