'use client';

import React from 'react';
import { Shield, Heart, MapPin, Clock, Users, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { ZKProofStatus, GamePhase } from '../../types/gameState';

export interface GameHUDProps {
  playerHealth: number;
  maxHealth: number;
  position: { x: number; y: number };
  playersAlive: number;
  totalPlayers: number;
  gamePhase: GamePhase;
  timeRemaining: number;
  zkProofStatus: ZKProofStatus;
  isInSafeZone: boolean;
  distanceToZone: number;
  className?: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerHealth,
  maxHealth,
  position,
  playersAlive,
  totalPlayers,
  gamePhase,
  timeRemaining,
  zkProofStatus,
  isInSafeZone,
  distanceToZone,
  className = '',
}) => {
  const healthPercentage = (playerHealth / maxHealth) * 100;
  
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 1000 / 60);
    const secs = Math.floor((seconds / 1000) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get health bar color
  const getHealthBarColor = () => {
    if (healthPercentage > 60) return 'bg-accent-success';
    if (healthPercentage > 30) return 'bg-accent-warning';
    return 'bg-accent-danger';
  };

  // Get zone status color
  const getZoneStatusColor = () => {
    if (isInSafeZone) return 'text-accent-success';
    if (distanceToZone < 50) return 'text-accent-warning';
    return 'text-accent-danger';
  };

  // Get ZK proof status display
  const getZKProofDisplay = () => {
    switch (zkProofStatus) {
      case ZKProofStatus.VALID:
        return { icon: CheckCircle, color: 'text-accent-success', text: 'Verified' };
      case ZKProofStatus.GENERATING:
        return { icon: Zap, color: 'text-accent-warning', text: 'Generating...' };
      case ZKProofStatus.PENDING:
        return { icon: Clock, color: 'text-accent-warning', text: 'Pending' };
      case ZKProofStatus.INVALID:
        return { icon: AlertTriangle, color: 'text-accent-danger', text: 'Invalid' };
      case ZKProofStatus.ERROR:
        return { icon: AlertTriangle, color: 'text-accent-danger', text: 'Error' };
      default:
        return { icon: Shield, color: 'text-gray-400', text: 'None' };
    }
  };

  const zkProofDisplay = getZKProofDisplay();
  const ZKIcon = zkProofDisplay.icon;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      {/* Main HUD Container */}
      <div className="glass border-b border-glass-border p-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Row - Game Phase & Timer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gamePhase === GamePhase.ACTIVE ? 'bg-accent-success animate-pulse' :
                  gamePhase === GamePhase.ZONE_SHRINKING ? 'bg-accent-warning animate-pulse' :
                  gamePhase === GamePhase.FINAL_ZONE ? 'bg-accent-danger animate-pulse' :
                  'bg-accent-primary'
                }`}></div>
                <span className="text-foreground font-semibold uppercase tracking-wide text-sm">
                  {gamePhase.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 glass px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 text-accent-primary" />
                <span className="text-foreground font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 glass px-3 py-2 rounded-full">
              <Users className="h-4 w-4 text-accent-primary" />
              <span className="text-foreground font-bold">
                {playersAlive}/{totalPlayers}
              </span>
              <span className="text-gray-400 text-sm">alive</span>
            </div>
          </div>

          {/* Bottom Row - Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            {/* Health */}
            <div className="glass px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-accent-danger" />
                  <span className="text-foreground font-semibold">Health</span>
                </div>
                <span className="text-foreground font-bold">{playerHealth}/{maxHealth}</span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div 
                  className={`${getHealthBarColor()} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${healthPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Position */}
            <div className="glass px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-accent-primary" />
                <span className="text-foreground font-semibold">Position</span>
              </div>
              <div className="font-mono text-foreground">
                X: {Math.round(position.x)} Y: {Math.round(position.y)}
              </div>
            </div>

            {/* Zone Status */}
            <div className="glass px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  isInSafeZone ? 'bg-accent-success' : 'bg-accent-danger'
                }`}></div>
                <span className="text-foreground font-semibold">Zone</span>
              </div>
              <div className={`font-bold ${getZoneStatusColor()}`}>
                {isInSafeZone ? 'Safe' : `${Math.round(distanceToZone)}m away`}
              </div>
            </div>

            {/* ZK Proof Status */}
            <div className="glass px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-accent-secondary" />
                <span className="text-foreground font-semibold">ZK Proof</span>
              </div>
              <div className={`flex items-center space-x-2 ${zkProofDisplay.color}`}>
                <ZKIcon className="h-4 w-4" />
                <span className="font-bold">{zkProofDisplay.text}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Optimization */}
      <style jsx>{`
        @media (max-width: 768px) {
          .grid-cols-1 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .grid-cols-1 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GameHUD;