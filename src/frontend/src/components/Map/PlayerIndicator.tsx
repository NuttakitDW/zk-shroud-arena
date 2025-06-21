'use client';

import React, { useMemo, useState, useEffect } from 'react';

export interface PlayerPosition {
  x: number;
  y: number;
  zone?: string;
  accuracy?: number;
}

export interface PlayerIndicatorData {
  id: string;
  username: string;
  position: PlayerPosition;
  status: 'online' | 'offline' | 'idle' | 'in-game' | 'eliminated';
  avatar?: string;
  isCurrentPlayer?: boolean;
  lastSeen?: number;
  healthStatus?: 'healthy' | 'injured' | 'critical';
  team?: string;
  rank?: number;
}

export interface PlayerIndicatorProps {
  players: PlayerIndicatorData[];
  privacyLevel: 'high' | 'medium' | 'low';
  currentPlayerId?: string;
  showUsernames?: boolean;
  showHealthStatus?: boolean;
  showTeams?: boolean;
  showRanks?: boolean;
  enableHover?: boolean;
  enableClick?: boolean;
  animateMovement?: boolean;
  maxVisiblePlayers?: number;
  className?: string;
  onPlayerClick?: (playerId: string) => void;
  onPlayerHover?: (playerId: string | null) => void;
}

type PrivacyObfuscation = {
  positionNoise: number;
  showExact: boolean;
  showZone: boolean;
  hideDistance: number; // Hide players beyond this distance
};

export const PlayerIndicator: React.FC<PlayerIndicatorProps> = ({
  players,
  privacyLevel,
  currentPlayerId,
  showUsernames = true,
  showHealthStatus = false,
  showTeams = false,
  showRanks = false,
  enableHover = true,
  enableClick = true,
  animateMovement = true,
  maxVisiblePlayers = 50,
  className = '',
  onPlayerClick,
  onPlayerHover,
}) => {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [animationTick, setAnimationTick] = useState(0);

  // Privacy configuration
  const privacyConfig: Record<string, PrivacyObfuscation> = {
    high: {
      positionNoise: 50, // ±50 pixel random offset
      showExact: false,
      showZone: true,
      hideDistance: 200, // Hide players more than 200 units away
    },
    medium: {
      positionNoise: 25, // ±25 pixel random offset
      showExact: false,
      showZone: true,
      hideDistance: 500,
    },
    low: {
      positionNoise: 5, // ±5 pixel random offset
      showExact: true,
      showZone: true,
      hideDistance: 1000,
    },
  };

  const currentPrivacyConfig = privacyConfig[privacyLevel];

  // Animation tick for player indicators
  useEffect(() => {
    if (!animateMovement) return;
    
    const interval = setInterval(() => {
      setAnimationTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [animateMovement]);

  // Apply privacy obfuscation to player positions
  const obfuscatePosition = useMemo(() => {
    const cache = new Map<string, { x: number; y: number; timestamp: number }>();
    
    return (playerId: string, originalPos: PlayerPosition): PlayerPosition => {
      // Use cached position for consistency (update every 10 seconds for high privacy)
      const cacheKey = `${playerId}_${Math.floor(Date.now() / (privacyLevel === 'high' ? 10000 : 5000))}`;
      
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        return { ...originalPos, x: cached.x, y: cached.y };
      }

      const noise = currentPrivacyConfig.positionNoise;
      const obfuscatedX = originalPos.x + (Math.random() - 0.5) * noise * 2;
      const obfuscatedY = originalPos.y + (Math.random() - 0.5) * noise * 2;
      
      cache.set(cacheKey, { x: obfuscatedX, y: obfuscatedY, timestamp: Date.now() });
      
      return {
        ...originalPos,
        x: obfuscatedX,
        y: obfuscatedY,
      };
    };
  }, [privacyLevel, currentPrivacyConfig.positionNoise]);

  // Filter and sort players based on privacy and distance
  const visiblePlayers = useMemo(() => {
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    
    return players
      .filter(player => {
        // Always show current player
        if (player.id === currentPlayerId) return true;
        
        // Filter based on status
        if (player.status === 'offline') return false;
        
        // Apply distance-based hiding for privacy
        if (currentPlayer && currentPrivacyConfig.hideDistance > 0) {
          const distance = Math.sqrt(
            Math.pow(player.position.x - currentPlayer.position.x, 2) +
            Math.pow(player.position.y - currentPlayer.position.y, 2)
          );
          if (distance > currentPrivacyConfig.hideDistance) return false;
        }
        
        return true;
      })
      .slice(0, maxVisiblePlayers)
      .map(player => ({
        ...player,
        position: player.id === currentPlayerId ? player.position : obfuscatePosition(player.id, player.position),
      }));
  }, [players, currentPlayerId, currentPrivacyConfig.hideDistance, maxVisiblePlayers, obfuscatePosition]);

  // Get player color based on status and team
  const getPlayerColor = (player: PlayerIndicatorData): string => {
    if (player.isCurrentPlayer) return '#4ade80'; // Green for current player
    
    if (player.team) {
      const teamColors: Record<string, string> = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        purple: '#a855f7',
        orange: '#f97316',
      };
      return teamColors[player.team.toLowerCase()] || '#6b7280';
    }
    
    switch (player.status) {
      case 'online': return '#3b82f6';
      case 'in-game': return '#8b5cf6';
      case 'eliminated': return '#ef4444';
      case 'idle': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Get health status color
  const getHealthColor = (health?: string): string => {
    switch (health) {
      case 'healthy': return '#22c55e';
      case 'injured': return '#eab308';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Handle player click
  const handlePlayerClick = (playerId: string) => {
    if (enableClick && onPlayerClick) {
      onPlayerClick(playerId);
    }
  };

  // Handle player hover
  const handlePlayerHover = (playerId: string | null) => {
    if (enableHover) {
      setHoveredPlayer(playerId);
      onPlayerHover?.(playerId);
    }
  };

  // Render individual player indicator
  const renderPlayerIndicator = (player: PlayerIndicatorData) => {
    const color = getPlayerColor(player);
    const isHovered = hoveredPlayer === player.id;
    const radius = player.isCurrentPlayer ? 8 : 6;
    const pulseOffset = player.isCurrentPlayer ? Math.sin(animationTick * 0.5) * 2 : 0;

    return (
      <g
        key={player.id}
        transform={`translate(${player.position.x}, ${player.position.y})`}
        className={enableClick ? 'cursor-pointer' : ''}
        onClick={() => handlePlayerClick(player.id)}
        onMouseEnter={() => handlePlayerHover(player.id)}
        onMouseLeave={() => handlePlayerHover(null)}
      >
        {/* Player glow effect for current player */}
        {player.isCurrentPlayer && (
          <circle
            cx="0"
            cy="0"
            r={radius + 4 + pulseOffset}
            fill={color}
            fillOpacity="0.3"
            className={animateMovement ? 'animate-pulse' : ''}
          />
        )}
        
        {/* Main player circle */}
        <circle
          cx="0"
          cy="0"
          r={radius}
          fill={color}
          stroke="#ffffff"
          strokeWidth="2"
          className={`transition-all duration-200 ${isHovered ? 'scale-110' : ''}`}
        />
        
        {/* Health status indicator */}
        {showHealthStatus && player.healthStatus && (
          <circle
            cx={radius - 2}
            cy={-radius + 2}
            r="3"
            fill={getHealthColor(player.healthStatus)}
            stroke="#ffffff"
            strokeWidth="1"
          />
        )}
        
        {/* Status indicator */}
        <circle
          cx={radius - 1}
          cy={radius - 1}
          r="2"
          fill={player.status === 'online' ? '#22c55e' : player.status === 'in-game' ? '#8b5cf6' : '#6b7280'}
        />
        
        {/* Player username */}
        {showUsernames && (currentPrivacyConfig.showExact || player.isCurrentPlayer) && (
          <text
            x="0"
            y={radius + 15}
            textAnchor="middle"
            className="fill-white text-xs font-medium pointer-events-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {player.username}
          </text>
        )}
        
        {/* Team indicator */}
        {showTeams && player.team && (
          <text
            x="0"
            y={radius + 28}
            textAnchor="middle"
            className="fill-gray-300 text-xs pointer-events-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            Team {player.team}
          </text>
        )}
        
        {/* Rank indicator */}
        {showRanks && player.rank && (
          <text
            x={-radius - 5}
            y={-radius + 5}
            textAnchor="middle"
            className="fill-yellow-400 text-xs font-bold pointer-events-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            #{player.rank}
          </text>
        )}
        
        {/* Privacy zone indicator */}
        {!currentPrivacyConfig.showExact && !player.isCurrentPlayer && (
          <circle
            cx="0"
            cy="0"
            r={radius + 8}
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="2,2"
            fillOpacity="0.1"
          />
        )}
      </g>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Enable pointer events for interactive elements */}
        <g className={enableClick || enableHover ? 'pointer-events-auto' : 'pointer-events-none'}>
          {visiblePlayers.map(renderPlayerIndicator)}
        </g>
      </svg>
      
      {/* Player tooltip */}
      {hoveredPlayer && enableHover && (
        <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-95 text-white p-3 rounded-lg shadow-lg z-20 pointer-events-none">
          {(() => {
            const player = visiblePlayers.find(p => p.id === hoveredPlayer);
            if (!player) return null;
            
            return (
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{player.username}</div>
                <div className="text-gray-300">Status: {player.status}</div>
                {player.team && showTeams && (
                  <div className="text-gray-300">Team: {player.team}</div>
                )}
                {player.rank && showRanks && (
                  <div className="text-gray-300">Rank: #{player.rank}</div>
                )}
                {player.healthStatus && showHealthStatus && (
                  <div className="text-gray-300">Health: {player.healthStatus}</div>
                )}
                {player.position.zone && (
                  <div className="text-gray-300">Zone: {player.position.zone}</div>
                )}
                {player.lastSeen && (
                  <div className="text-gray-500 text-xs">
                    Last seen: {new Date(player.lastSeen).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Privacy level indicator */}
      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 text-white text-xs p-2 rounded">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            privacyLevel === 'high' ? 'bg-red-400' :
            privacyLevel === 'medium' ? 'bg-yellow-400' :
            'bg-green-400'
          }`}></div>
          <span>Privacy: {privacyLevel.toUpperCase()}</span>
        </div>
      </div>
      
      {/* Player count */}
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-90 text-white text-xs p-2 rounded">
        <div>Players: {visiblePlayers.length}</div>
        {visiblePlayers.length >= maxVisiblePlayers && (
          <div className="text-yellow-400">Max reached</div>
        )}
      </div>
    </div>
  );
};

export default PlayerIndicator;