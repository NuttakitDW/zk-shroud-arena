'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GameMap, Player, ArenaBounds } from '../Map/GameMap';
import { ArenaZone, Zone } from '../Map/ArenaZone';
import { Minimap, MinimapPlayer, MinimapZone } from '../ui/Minimap';
import { Maximize2, Minimize2, RotateCcw, Crosshair, Map } from 'lucide-react';

export interface BattleArenaProps {
  // Game state
  players: Player[];
  arenaBounds: ArenaBounds;
  currentZone: MinimapZone;
  nextZone?: MinimapZone;
  arenaSize: { width: number; height: number };
  
  // Arena zones for zone visualization
  zones: Zone[];
  
  // UI options
  showMinimap?: boolean;
  showZones?: boolean;
  enableFullscreen?: boolean;
  
  // Event handlers
  onPlayerClick?: (playerId: string) => void;
  onMapClick?: (position: { x: number; y: number }) => void;
  onZoneClick?: (zoneId: string) => void;
  onMinimapPlayerClick?: (playerId: string) => void;
  
  className?: string;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  players,
  arenaBounds,
  currentZone,
  nextZone,
  arenaSize,
  zones,
  showMinimap = true,
  showZones = true,
  enableFullscreen = true,
  onPlayerClick,
  onMapClick,
  onZoneClick,
  onMinimapPlayerClick,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 800, height: 600 });
  const [minimapSize, setMinimapSize] = useState(200);

  // Convert players to minimap format
  const minimapPlayers: MinimapPlayer[] = players.map(player => ({
    id: player.id,
    position: player.position,
    isCurrentPlayer: player.isCurrentPlayer || false,
    isAlive: player.status === 'active',
    isTeammate: false, // Could be extended for team mode
  }));

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      // Expand map to fill available space
      const width = typeof window !== 'undefined' ? window.innerWidth - 100 : 1820;
      const height = typeof window !== 'undefined' ? window.innerHeight - 200 : 880;
      setMapSize({ width, height });
      setMinimapSize(250);
    } else {
      // Reset to normal size
      setMapSize({ width: 800, height: 600 });
      setMinimapSize(200);
    }
  }, [isFullscreen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isFullscreen && typeof window !== 'undefined') {
        setMapSize({ width: window.innerWidth - 100, height: window.innerHeight - 200 });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isFullscreen]);

  // Reset map view to center
  const resetMapView = useCallback(() => {
    // This would trigger a reset in the GameMap component
    // Implementation depends on GameMap's reset functionality
  }, []);

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-40 bg-background' : ''}`}>
      {/* Main Arena Container */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-full">
        
        {/* Main Map Area */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            {enableFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="game-button glass p-2 rounded-lg text-foreground hover:text-accent-primary transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            )}
            
            <button
              onClick={resetMapView}
              className="game-button glass p-2 rounded-lg text-foreground hover:text-accent-primary transition-colors"
              title="Reset View"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          {/* Zone Overlay */}
          {showZones && zones.length > 0 && (
            <div className="absolute inset-0 z-5">
              <ArenaZone
                zones={zones}
                width={mapSize.width}
                height={mapSize.height}
                onZoneClick={onZoneClick}
                animated={true}
                className="absolute inset-0"
              />
            </div>
          )}

          {/* Main Game Map */}
          <GameMap
            width={mapSize.width}
            height={mapSize.height}
            arenaBounds={arenaBounds}
            players={players}
            showGrid={true}
            enableZoom={true}
            enablePan={true}
            onPlayerClick={onPlayerClick}
            onMapClick={onMapClick}
            className="border-2 border-glass-border"
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 glass p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center">
              <Map className="h-4 w-4 mr-2" />
              Legend
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent-success rounded-full"></div>
                <span className="text-gray-400">You</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                <span className="text-gray-400">Allies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent-danger rounded-full"></div>
                <span className="text-gray-400">Enemies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400">Eliminated</span>
              </div>
            </div>
          </div>

          {/* Compass */}
          <div className="absolute top-4 left-4 glass p-2 rounded-lg">
            <Crosshair className="h-6 w-6 text-accent-primary" />
          </div>
        </div>

        {/* Minimap Sidebar */}
        {showMinimap && (
          <div className={`${isFullscreen ? 'absolute top-4 right-20 z-10' : 'lg:w-64'} space-y-4`}>
            <Minimap
              players={minimapPlayers}
              currentZone={currentZone}
              nextZone={nextZone}
              arenaSize={arenaSize}
              size={minimapSize}
              showGrid={true}
              showPlayerNames={false}
              onPlayerClick={onMinimapPlayerClick}
              className="w-full"
            />

            {/* Zone Information */}
            <div className="glass p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">Zone Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Zone:</span>
                  <span className={`font-medium ${currentZone.isActive ? 'text-accent-success' : 'text-accent-danger'}`}>
                    {currentZone.isActive ? 'Safe' : 'Shrinking'}
                  </span>
                </div>
                
                {currentZone.shrinkProgress && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shrink Progress:</span>
                    <span className="text-accent-warning font-medium">
                      {Math.round(currentZone.shrinkProgress * 100)}%
                    </span>
                  </div>
                )}
                
                {nextZone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Zone:</span>
                    <span className="text-accent-primary font-medium">
                      {Math.round(Math.sqrt(
                        Math.pow(nextZone.center.x - currentZone.center.x, 2) +
                        Math.pow(nextZone.center.y - currentZone.center.y, 2)
                      ))}m away
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Players in Zone */}
            <div className="glass p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">Players</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-foreground font-medium">{players.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Alive:</span>
                  <span className="text-accent-success font-medium">
                    {players.filter(p => p.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Eliminated:</span>
                  <span className="text-accent-danger font-medium">
                    {players.filter(p => p.status === 'eliminated').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black via-transparent to-black opacity-20"></div>
      )}
    </div>
  );
};

export default BattleArena;