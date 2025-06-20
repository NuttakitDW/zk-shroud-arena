'use client';

import React, { useEffect, useState } from 'react';
import { Crown, Trophy, Target, Shield, RefreshCw, Home, Share2, Copy, Check } from 'lucide-react';

export interface GameStats {
  placement: number;
  totalPlayers: number;
  eliminations: number;
  damageDealt: number;
  timeAlive: number;
  distanceTraveled: number;
  proofsGenerated: number;
  accurateProofs: number;
  highestRank: number;
}

export interface GameEndScreenProps {
  isVisible: boolean;
  isVictory: boolean;
  gameStats: GameStats;
  playerName: string;
  gameId: string;
  onPlayAgain?: () => void;
  onMainMenu?: () => void;
  onShare?: () => void;
  className?: string;
}

export const GameEndScreen: React.FC<GameEndScreenProps> = ({
  isVisible,
  isVictory,
  gameStats,
  playerName,
  gameId,
  onPlayAgain,
  onMainMenu,
  className = '',
}) => {
  const [showStats, setShowStats] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animate stats reveal
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowStats(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowStats(false);
    }
  }, [isVisible]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${Math.round(distance)}m`;
  };

  const getPlacementSuffix = (placement: number): string => {
    if (placement === 1) return 'st';
    if (placement === 2) return 'nd';
    if (placement === 3) return 'rd';
    return 'th';
  };

  const getPlacementColor = (placement: number): string => {
    if (placement === 1) return 'text-yellow-400';
    if (placement === 2) return 'text-gray-300';
    if (placement === 3) return 'text-amber-500';
    if (placement <= 10) return 'text-accent-success';
    return 'text-accent-primary';
  };

  const handleCopyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy game ID:', err);
    }
  };

  const shareableStats = `🎮 ZK Shroud Arena Results 🎮\n\n` +
    `Player: ${playerName}\n` +
    `Placement: ${gameStats.placement}${getPlacementSuffix(gameStats.placement)} / ${gameStats.totalPlayers}\n` +
    `Eliminations: ${gameStats.eliminations}\n` +
    `Time Alive: ${formatTime(gameStats.timeAlive)}\n` +
    `ZK Proofs: ${gameStats.proofsGenerated} generated, ${gameStats.accurateProofs} accurate\n` +
    `\n#ZKShroudArena #BattleRoyale #ZeroKnowledge`;

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm ${className}`}>
      <div className="glass border border-glass-border rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            {isVictory ? (
              <Crown className="h-20 w-20 text-yellow-400 mx-auto animate-pulse" />
            ) : (
              <Trophy className={`h-20 w-20 mx-auto ${getPlacementColor(gameStats.placement)}`} />
            )}
          </div>
          
          <h1 className={`text-4xl font-bold mb-2 ${
            isVictory ? 'text-yellow-400' : getPlacementColor(gameStats.placement)
          }`}>
            {isVictory ? 'VICTORY!' : 'GAME OVER'}
          </h1>
          
          <div className="text-xl text-foreground mb-2">
            <span className={`font-bold ${getPlacementColor(gameStats.placement)}`}>
              {gameStats.placement}{getPlacementSuffix(gameStats.placement)} Place
            </span>
            <span className="text-gray-400"> out of {gameStats.totalPlayers} players</span>
          </div>
          
          <p className="text-gray-400">
            {isVictory 
              ? 'Congratulations! You are the last player standing!' 
              : 'Better luck next time, champion!'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className={`transition-all duration-1000 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-accent-primary" />
            Match Statistics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Eliminations */}
            <div className="glass bg-background-secondary p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-accent-danger mb-1">
                {gameStats.eliminations}
              </div>
              <div className="text-sm text-gray-400">Eliminations</div>
            </div>

            {/* Time Alive */}
            <div className="glass bg-background-secondary p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-accent-success mb-1">
                {formatTime(gameStats.timeAlive)}
              </div>
              <div className="text-sm text-gray-400">Time Alive</div>
            </div>

            {/* Damage Dealt */}
            <div className="glass bg-background-secondary p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-accent-warning mb-1">
                {gameStats.damageDealt}
              </div>
              <div className="text-sm text-gray-400">Damage Dealt</div>
            </div>

            {/* Distance Traveled */}
            <div className="glass bg-background-secondary p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-accent-primary mb-1">
                {formatDistance(gameStats.distanceTraveled)}
              </div>
              <div className="text-sm text-gray-400">Distance</div>
            </div>
          </div>

          {/* ZK Proof Stats */}
          <div className="glass bg-background-secondary p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-accent-secondary" />
              Zero-Knowledge Proofs
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-accent-secondary mb-1">
                  {gameStats.proofsGenerated}
                </div>
                <div className="text-sm text-gray-400">Generated</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-accent-success mb-1">
                  {gameStats.accurateProofs}
                </div>
                <div className="text-sm text-gray-400">Accurate</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-accent-primary mb-1">
                  {gameStats.proofsGenerated > 0 
                    ? Math.round((gameStats.accurateProofs / gameStats.proofsGenerated) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Game ID */}
          <div className="glass bg-background-secondary p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Game ID</h3>
                <p className="text-xs text-gray-400 font-mono">{gameId}</p>
              </div>
              <button
                onClick={handleCopyGameId}
                className="game-button glass px-3 py-2 rounded-lg text-accent-primary hover:bg-accent-primary hover:text-background transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-glass-border">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="game-button flex-1 glass px-6 py-3 rounded-lg text-accent-success border border-accent-success hover:bg-accent-success hover:text-background transition-all font-semibold"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Play Again
            </button>
          )}
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'ZK Shroud Arena Results',
                  text: shareableStats,
                });
              } else {
                navigator.clipboard.writeText(shareableStats);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="game-button flex-1 glass px-6 py-3 rounded-lg text-accent-primary border border-accent-primary hover:bg-accent-primary hover:text-background transition-all font-semibold"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Results
          </button>
          
          {onMainMenu && (
            <button
              onClick={onMainMenu}
              className="game-button flex-1 glass px-6 py-3 rounded-lg text-gray-400 border border-gray-400 hover:bg-gray-400 hover:text-background transition-all font-semibold"
            >
              <Home className="h-5 w-5 mr-2" />
              Main Menu
            </button>
          )}
        </div>

        {/* Achievement Badges (if any) */}
        {(gameStats.placement === 1 || gameStats.eliminations >= 5 || gameStats.accurateProofs >= 10) && (
          <div className="mt-6 pt-4 border-t border-glass-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {gameStats.placement === 1 && (
                <div className="glass bg-yellow-400 bg-opacity-20 border border-yellow-400 px-3 py-1 rounded-full text-yellow-400 text-sm font-medium">
                  👑 Victory Royale
                </div>
              )}
              {gameStats.eliminations >= 5 && (
                <div className="glass bg-accent-danger bg-opacity-20 border border-accent-danger px-3 py-1 rounded-full text-accent-danger text-sm font-medium">
                  💀 Eliminator ({gameStats.eliminations} eliminations)
                </div>
              )}
              {gameStats.accurateProofs >= 10 && (
                <div className="glass bg-accent-secondary bg-opacity-20 border border-accent-secondary px-3 py-1 rounded-full text-accent-secondary text-sm font-medium">
                  🛡️ Proof Master ({gameStats.accurateProofs} accurate proofs)
                </div>
              )}
              {gameStats.placement <= 3 && gameStats.placement > 1 && (
                <div className="glass bg-accent-success bg-opacity-20 border border-accent-success px-3 py-1 rounded-full text-accent-success text-sm font-medium">
                  🏆 Top 3 Finish
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEndScreen;