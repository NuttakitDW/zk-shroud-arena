'use client';

import React from 'react';
import { Trophy, Crown, Skull, Shield, Heart, Zap, Clock } from 'lucide-react';
import { ZKProofStatus } from '../../types/gameState';

export interface LeaderboardPlayer {
  id: string;
  name: string;
  rank: number;
  eliminations: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  isCurrentPlayer: boolean;
  zkProofStatus: ZKProofStatus;
  lastSeen: number;
  timeAlive: number;
}

export interface LeaderboardProps {
  players: LeaderboardPlayer[];
  maxPlayers?: number;
  showZKStatus?: boolean;
  showTimeAlive?: boolean;
  compact?: boolean;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  maxPlayers = 10,
  showZKStatus = true,
  showTimeAlive = false,
  compact = false,
  className = '',
}) => {
  const sortedPlayers = [...players]
    .sort((a, b) => {
      // Alive players first
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      // Then by eliminations
      if (a.eliminations !== b.eliminations) return b.eliminations - a.eliminations;
      // Then by time alive
      return b.timeAlive - a.timeAlive;
    })
    .slice(0, maxPlayers);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getZKProofIcon = (status: ZKProofStatus) => {
    switch (status) {
      case ZKProofStatus.VALID:
        return <Shield className="h-3 w-3 text-accent-success" />;
      case ZKProofStatus.GENERATING:
        return <Zap className="h-3 w-3 text-accent-warning animate-pulse" />;
      case ZKProofStatus.PENDING:
        return <Clock className="h-3 w-3 text-accent-warning" />;
      case ZKProofStatus.INVALID:
      case ZKProofStatus.ERROR:
        return <Shield className="h-3 w-3 text-accent-danger" />;
      default:
        return <Shield className="h-3 w-3 text-gray-400" />;
    }
  };

  const getRankIcon = (rank: number, isAlive: boolean) => {
    if (!isAlive) return <Skull className="h-4 w-4 text-gray-400" />;
    
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 2:
        return <Trophy className="h-4 w-4 text-gray-300" />;
      case 3:
        return <Trophy className="h-4 w-4 text-amber-500" />;
      default:
        return <div className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-400">
          {rank}
        </div>;
    }
  };

  if (compact) {
    return (
      <div className={`glass rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-accent-primary" />
            <span className="text-foreground font-semibold text-sm">Players</span>
          </div>
          <span className="text-gray-400 text-xs">
            {players.filter(p => p.isAlive).length} alive
          </span>
        </div>

        <div className="space-y-2">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                player.isCurrentPlayer 
                  ? 'bg-accent-primary bg-opacity-20 border border-accent-primary' 
                  : 'bg-background-secondary hover:bg-background-tertiary'
              }`}
            >
              <div className="flex items-center space-x-2">
                {getRankIcon(player.rank, player.isAlive)}
                <span className={`text-sm font-medium ${
                  player.isCurrentPlayer ? 'text-accent-primary' : 'text-foreground'
                }`}>
                  {player.name}
                </span>
                {player.isCurrentPlayer && (
                  <span className="text-xs text-accent-primary font-bold">(YOU)</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {showZKStatus && getZKProofIcon(player.zkProofStatus)}
                <div className="flex items-center space-x-1">
                  <Skull className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{player.eliminations}</span>
                </div>
                {player.isAlive && (
                  <div className="flex items-center space-x-1">
                    <Heart className="h-3 w-3 text-accent-danger" />
                    <span className="text-xs text-foreground font-medium">
                      {player.health}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-accent-primary" />
          <h3 className="text-foreground font-bold text-lg">Leaderboard</h3>
        </div>
        <div className="text-sm text-gray-400">
          {players.filter(p => p.isAlive).length} / {players.length} alive
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 mb-3 text-xs text-gray-400 font-medium uppercase tracking-wide">
        <div className="col-span-1">Rank</div>
        <div className="col-span-4">Player</div>
        <div className="col-span-1">HP</div>
        <div className="col-span-1">
          <Skull className="h-3 w-3" />
        </div>
        {showZKStatus && <div className="col-span-1">ZK</div>}
        {showTimeAlive && <div className="col-span-2">Time</div>}
        <div className="col-span-2">Status</div>
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`grid grid-cols-12 gap-2 p-3 rounded-lg transition-all ${
              player.isCurrentPlayer 
                ? 'bg-accent-primary bg-opacity-20 border border-accent-primary glow-cyan' 
                : player.isAlive 
                  ? 'bg-background-secondary hover:bg-background-tertiary' 
                  : 'bg-background-secondary opacity-60'
            }`}
          >
            {/* Rank */}
            <div className="col-span-1 flex items-center">
              {getRankIcon(player.rank, player.isAlive)}
            </div>

            {/* Player Name */}
            <div className="col-span-4 flex items-center space-x-2">
              <span className={`font-medium ${
                player.isCurrentPlayer ? 'text-accent-primary' : 'text-foreground'
              }`}>
                {player.name}
              </span>
              {player.isCurrentPlayer && (
                <span className="text-xs text-accent-primary font-bold px-2 py-1 bg-accent-primary bg-opacity-20 rounded-full">
                  YOU
                </span>
              )}
            </div>

            {/* Health */}
            <div className="col-span-1 flex items-center">
              {player.isAlive ? (
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 text-accent-danger" />
                  <span className="text-sm font-medium text-foreground">
                    {player.health}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">-</span>
              )}
            </div>

            {/* Eliminations */}
            <div className="col-span-1 flex items-center">
              <span className="text-sm font-bold text-accent-warning">
                {player.eliminations}
              </span>
            </div>

            {/* ZK Proof Status */}
            {showZKStatus && (
              <div className="col-span-1 flex items-center">
                {getZKProofIcon(player.zkProofStatus)}
              </div>
            )}

            {/* Time Alive */}
            {showTimeAlive && (
              <div className="col-span-2 flex items-center">
                <span className="text-sm text-gray-400">
                  {formatTime(player.timeAlive)}
                </span>
              </div>
            )}

            {/* Status */}
            <div className="col-span-2 flex items-center">
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                player.isAlive 
                  ? 'text-accent-success bg-accent-success bg-opacity-20' 
                  : 'text-gray-400 bg-gray-400 bg-opacity-20'
              }`}>
                {player.isAlive ? 'Alive' : 'Eliminated'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-3 border-t border-glass-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent-success">
              {players.filter(p => p.isAlive).length}
            </div>
            <div className="text-xs text-gray-400">Alive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-danger">
              {players.filter(p => !p.isAlive).length}
            </div>
            <div className="text-xs text-gray-400">Eliminated</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-primary">
              {players.reduce((total, p) => total + p.eliminations, 0)}
            </div>
            <div className="text-xs text-gray-400">Total Eliminations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;