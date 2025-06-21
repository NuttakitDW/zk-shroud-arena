'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Circle, Users, Map, Navigation } from 'lucide-react';

export interface MinimapPlayer {
  id: string;
  position: { x: number; y: number };
  isCurrentPlayer: boolean;
  isAlive: boolean;
  isTeammate?: boolean;
}

export interface MinimapZone {
  center: { x: number; y: number };
  radius: number;
  isActive: boolean;
  shrinkProgress?: number; // 0-1
}

export interface MinimapProps {
  players: MinimapPlayer[];
  currentZone: MinimapZone;
  nextZone?: MinimapZone;
  arenaSize: { width: number; height: number };
  size?: number;
  className?: string;
  showGrid?: boolean;
  showPlayerNames?: boolean;
  onPlayerClick?: (playerId: string) => void;
  // Real-world map integration
  enableRealWorldToggle?: boolean;
  isRealWorldMode?: boolean;
  onToggleRealWorld?: (enabled: boolean) => void;
  realWorldCenter?: { lat: number; lng: number };
}

export const Minimap: React.FC<MinimapProps> = ({
  players,
  currentZone,
  nextZone,
  arenaSize,
  size = 200,
  className = '',
  showGrid = true,
  showPlayerNames = false,
  onPlayerClick,
  enableRealWorldToggle = false,
  isRealWorldMode = false,
  onToggleRealWorld,
  realWorldCenter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [showRealWorldOverlay, setShowRealWorldOverlay] = useState(false); // TODO: implement real-world overlay
  // const currentPlayer = players.find(p => p.isCurrentPlayer); // TODO: use for player highlighting

  // Scale factor to convert world coordinates to minimap coordinates
  const scale = useMemo(() => {
    return (size - 20) / Math.max(arenaSize.width, arenaSize.height);
  }, [size, arenaSize]);

  // Convert world coordinates to minimap coordinates
  const worldToMinimap = (worldPos: { x: number; y: number }) => {
    return {
      x: (worldPos.x * scale) + 10,
      y: (worldPos.y * scale) + 10,
    };
  };

  // Render minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, size, size);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      const gridSize = 50 * scale;
      for (let x = 10; x < size - 10; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, size - 10);
        ctx.stroke();
      }
      for (let y = 10; y < size - 10; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(size - 10, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // Draw next zone (if exists)
    if (nextZone) {
      const nextCenter = worldToMinimap(nextZone.center);
      const nextRadius = nextZone.radius * scale;

      ctx.strokeStyle = '#fbbf24';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);

      ctx.beginPath();
      ctx.arc(nextCenter.x, nextCenter.y, nextRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw current zone
    const currentCenter = worldToMinimap(currentZone.center);
    const currentRadius = currentZone.radius * scale;

    // Zone fill
    ctx.fillStyle = currentZone.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    ctx.beginPath();
    ctx.arc(currentCenter.x, currentCenter.y, currentRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Zone border
    ctx.strokeStyle = currentZone.isActive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(currentCenter.x, currentCenter.y, currentRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw shrink animation if zone is shrinking
    if (currentZone.shrinkProgress && currentZone.shrinkProgress > 0) {
      const shrinkRadius = currentRadius * (1 - currentZone.shrinkProgress);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.arc(currentCenter.x, currentCenter.y, shrinkRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw players
    players.forEach((player) => {
      const playerPos = worldToMinimap(player.position);
      const radius = player.isCurrentPlayer ? 6 : 4;

      // Player dot
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, radius, 0, 2 * Math.PI);

      // Set color based on player type
      if (player.isCurrentPlayer) {
        ctx.fillStyle = '#4ade80';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
      } else if (player.isTeammate) {
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
      } else if (player.isAlive) {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
      }

      ctx.fill();
      ctx.stroke();

      // Player name (if enabled and current player)
      if (showPlayerNames && player.isCurrentPlayer) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', playerPos.x, playerPos.y - 10);
      }

      // Direction indicator for current player
      if (player.isCurrentPlayer) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerPos.x, playerPos.y - 8);
        ctx.lineTo(playerPos.x + 4, playerPos.y - 12);
        ctx.lineTo(playerPos.x - 4, playerPos.y - 12);
        ctx.closePath();
        ctx.stroke();
      }
    });

    // Draw border
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);

  }, [players, currentZone, nextZone, scale, size, showGrid, showPlayerNames, worldToMinimap]);

  // Handle clicks on minimap
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPlayerClick) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if click is on a player
    players.forEach((player) => {
      const playerPos = worldToMinimap(player.position);
      const distance = Math.sqrt(
        Math.pow(playerPos.x - clickX, 2) + 
        Math.pow(playerPos.y - clickY, 2)
      );

      if (distance <= (player.isCurrentPlayer ? 6 : 4)) {
        onPlayerClick(player.id);
      }
    });
  };

  const alivePlayers = players.filter(p => p.isAlive).length;

  return (
    <div className={`glass rounded-lg p-3 ${className}`}>
      {/* Minimap Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Circle className="h-4 w-4 text-accent-primary" />
          <span className="text-foreground font-semibold text-sm">
            {isRealWorldMode ? 'Real Map' : 'Virtual Map'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Real World Toggle */}
          {enableRealWorldToggle && (
            <button
              onClick={() => {
                const newMode = !isRealWorldMode;
                // setShowRealWorldOverlay(newMode); // TODO: implement when real-world overlay is ready
                onToggleRealWorld?.(newMode);
              }}
              className={`p-1 rounded transition-colors ${
                isRealWorldMode 
                  ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title={isRealWorldMode ? 'Switch to Virtual Map' : 'Switch to Real World Map'}
            >
              {isRealWorldMode ? <Map className="h-3 w-3" /> : <Navigation className="h-3 w-3" />}
            </button>
          )}
          
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-gray-400 text-xs">{alivePlayers}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="cursor-pointer border border-glass-border rounded"
          onClick={handleClick}
        />
        
        {/* Real World Mode Overlay */}
        {isRealWorldMode && realWorldCenter && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded border border-cyan-500/30 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
              <div className="text-xs text-cyan-300 font-medium">Real World Mode</div>
              <div className="text-xs text-gray-400">
                {realWorldCenter.lat.toFixed(4)}°, {realWorldCenter.lng.toFixed(4)}°
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-accent-success rounded-full"></div>
          <span className="text-gray-400">You</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-accent-danger rounded-full"></div>
          <span className="text-gray-400">Enemies</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 border border-accent-primary rounded-full"></div>
          <span className="text-gray-400">{isRealWorldMode ? 'Real Zone' : 'Safe Zone'}</span>
        </div>
        {isRealWorldMode && (
          <div className="flex items-center space-x-2">
            <Map className="w-2 h-2 text-cyan-400" />
            <span className="text-gray-400">GPS Active</span>
          </div>
        )}
      </div>

      {/* Zone Timer */}
      {currentZone.shrinkProgress && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Zone Shrinking</span>
            <span className="text-accent-warning">{Math.round((1 - currentZone.shrinkProgress) * 100)}%</span>
          </div>
          <div className="w-full bg-background-tertiary rounded-full h-1">
            <div 
              className="bg-accent-warning h-1 rounded-full transition-all duration-300"
              style={{ width: `${(1 - currentZone.shrinkProgress) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Minimap;