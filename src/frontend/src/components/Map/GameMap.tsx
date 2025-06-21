'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Player {
  id: string;
  position: Position;
  status: 'active' | 'eliminated' | 'hidden';
  isCurrentPlayer?: boolean;
}

export interface GameMapProps {
  width?: number;
  height?: number;
  arenaBounds: ArenaBounds;
  players: Player[];
  showGrid?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  className?: string;
  onPlayerClick?: (playerId: string) => void;
  onMapClick?: (position: Position) => void;
}

export const GameMap: React.FC<GameMapProps> = ({
  width = 800,
  height = 600,
  arenaBounds,
  players,
  showGrid = true,
  enableZoom = true,
  enablePan = true,
  className = '',
  onPlayerClick,
  onMapClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport state for zoom and pan
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  
  // Mouse interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Position | null>(null);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldPos: Position): Position => {
    const screenX = (worldPos.x - arenaBounds.minX) * viewport.scale + viewport.x;
    const screenY = (worldPos.y - arenaBounds.minY) * viewport.scale + viewport.y;
    return { x: screenX, y: screenY };
  }, [arenaBounds, viewport]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenPos: Position): Position => {
    const worldX = (screenPos.x - viewport.x) / viewport.scale + arenaBounds.minX;
    const worldY = (screenPos.y - viewport.y) / viewport.scale + arenaBounds.minY;
    return { x: worldX, y: worldY };
  }, [arenaBounds, viewport]);

  // Draw grid pattern
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showGrid) return;

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    const gridSize = 50 * viewport.scale;
    const startX = viewport.x % gridSize;
    const startY = viewport.y % gridSize;

    // Draw vertical lines
    for (let x = startX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, [showGrid, viewport]);

  // Draw arena boundaries
  const drawArenaBounds = useCallback((ctx: CanvasRenderingContext2D) => {
    const topLeft = worldToScreen({ x: arenaBounds.minX, y: arenaBounds.minY });
    const bottomRight = worldToScreen({ x: arenaBounds.maxX, y: arenaBounds.maxY });

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.rect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    );
    ctx.stroke();

    ctx.setLineDash([]);
  }, [arenaBounds, worldToScreen]);

  // Draw players on the map
  const drawPlayers = useCallback((ctx: CanvasRenderingContext2D) => {
    players.forEach((player) => {
      const screenPos = worldToScreen(player.position);
      
      // Skip if player is outside visible area
      if (screenPos.x < -20 || screenPos.x > width + 20 || 
          screenPos.y < -20 || screenPos.y > height + 20) {
        return;
      }

      const radius = 8 * viewport.scale;
      
      // Player circle
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
      
      // Set color based on player status
      switch (player.status) {
        case 'active':
          ctx.fillStyle = player.isCurrentPlayer ? '#4ade80' : '#3b82f6';
          break;
        case 'eliminated':
          ctx.fillStyle = '#ef4444';
          break;
        case 'hidden':
          ctx.fillStyle = '#6b7280';
          break;
      }
      
      ctx.fill();
      
      // Player border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Player ID label
      if (viewport.scale > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${12 * viewport.scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(player.id, screenPos.x, screenPos.y - radius - 5);
      }
    });
  }, [players, worldToScreen, width, height, viewport.scale]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw arena bounds
    drawArenaBounds(ctx);

    // Draw players
    drawPlayers(ctx);
  }, [drawGrid, drawArenaBounds, drawPlayers]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enablePan) return;
    
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [enablePan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos || !enablePan) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setViewport(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos, enablePan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastMousePos(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!enableZoom) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * scaleFactor));
    
    setViewport(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
      scale: newScale,
    }));
  }, [enableZoom, viewport.scale]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Check if click is on a player
    const clickedPlayer = players.find(player => {
      const screenPos = worldToScreen(player.position);
      const distance = Math.sqrt(
        Math.pow(screenPos.x - clickPos.x, 2) + 
        Math.pow(screenPos.y - clickPos.y, 2)
      );
      return distance <= 12 * viewport.scale;
    });

    if (clickedPlayer && onPlayerClick) {
      onPlayerClick(clickedPlayer.id);
    } else if (onMapClick) {
      const worldPos = screenToWorld(clickPos);
      onMapClick(worldPos);
    }
  }, [players, worldToScreen, screenToWorld, viewport.scale, onPlayerClick, onMapClick]);

  // Update canvas size and re-render when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Re-render
    render();
  }, [width, height, render]);

  // Initial centering of the view
  useEffect(() => {
    const centerX = (arenaBounds.minX + arenaBounds.maxX) / 2;
    const centerY = (arenaBounds.minY + arenaBounds.maxY) / 2;
    
    setViewport({
      x: width / 2 - centerX,
      y: height / 2 - centerY,
      scale: 1,
    });
  }, [arenaBounds, width, height]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 ${className}`}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />
      
      {/* Zoom controls */}
      {enableZoom && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-gray-800 rounded-lg p-2">
          <button
            onClick={() => setViewport(prev => ({ ...prev, scale: Math.min(5, prev.scale * 1.2) }))}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => setViewport(prev => ({ ...prev, scale: Math.max(0.1, prev.scale * 0.8) }))}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center text-lg font-bold"
          >
            −
          </button>
        </div>
      )}
      
      {/* Map info */}
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 text-white text-sm p-2 rounded">
        <div>Scale: {viewport.scale.toFixed(2)}</div>
        <div>Players: {players.length}</div>
      </div>
    </div>
  );
};

export default GameMap;