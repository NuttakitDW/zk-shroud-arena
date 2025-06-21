'use client';

import React, { useState } from 'react';
import { GameMap, ArenaZone, LocationTracker, PlayerIndicator } from '../index';
import type { 
  Player, 
  Zone, 
  PlayerIndicatorData, 
  ArenaBounds, 
  PrivacyLocation 
} from '../Map/types';

const MapDemo: React.FC = () => {
  const [privacyLevel, setPrivacyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<PrivacyLocation | null>(null);

  // Sample arena bounds
  const arenaBounds: ArenaBounds = {
    minX: 0,
    maxX: 1000,
    minY: 0,
    maxY: 800,
  };

  // Sample zones
  const zones: Zone[] = [
    {
      id: 'safe-zone-1',
      name: 'Safe Harbor',
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
      type: 'safe',
    },
    {
      id: 'danger-zone-1',
      name: 'Red Zone',
      coordinates: { x: 400, y: 200, width: 180, height: 120 },
      type: 'danger',
    },
    {
      id: 'shrinking-zone-1',
      name: 'Shrinking Area',
      coordinates: { x: 600, y: 400, width: 150, height: 100 },
      type: 'shrinking',
      shrinkProgress: 0.3,
      timeRemaining: 45,
    },
  ];

  // Sample players for GameMap
  const players: Player[] = [
    {
      id: 'player-1',
      position: { x: 150, y: 200 },
      status: 'active',
      isCurrentPlayer: true,
    },
    {
      id: 'player-2',
      position: { x: 450, y: 350 },
      status: 'active',
    },
    {
      id: 'player-3',
      position: { x: 700, y: 500 },
      status: 'eliminated',
    },
  ];

  // Sample players for PlayerIndicator
  const playerIndicators: PlayerIndicatorData[] = [
    {
      id: 'player-1',
      username: 'You',
      position: { x: 150, y: 200, zone: 'safe-zone-1' },
      status: 'in-game',
      isCurrentPlayer: true,
      healthStatus: 'healthy',
      team: 'blue',
      rank: 1,
    },
    {
      id: 'player-2',
      username: 'Enemy1',
      position: { x: 450, y: 350 },
      status: 'in-game',
      healthStatus: 'injured',
      team: 'red',
      rank: 2,
    },
    {
      id: 'player-3',
      username: 'Eliminated',
      position: { x: 700, y: 500 },
      status: 'eliminated',
      healthStatus: 'critical',
      team: 'red',
      rank: 15,
    },
  ];

  const handlePlayerClick = (playerId: string) => {
    console.log('Player clicked:', playerId);
  };

  const handleZoneClick = (zoneId: string) => {
    console.log('Zone clicked:', zoneId);
  };

  const handleLocationUpdate = (location: PrivacyLocation | null) => {
    setCurrentLocation(location);
    console.log('Location updated:', location);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">ZK Shroud Arena - Map Components Demo</h1>
        
        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Privacy Level:</label>
              <select
                value={privacyLevel}
                onChange={(e) => setPrivacyLevel(e.target.value as 'high' | 'medium' | 'low')}
                className="bg-gray-700 text-white px-3 py-1 rounded"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Location Tracking:</label>
              <button
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  locationEnabled 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {locationEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Main demo area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Game Map with Arena Zones</h2>
              <div className="relative">
                <GameMap
                  width={800}
                  height={600}
                  arenaBounds={arenaBounds}
                  players={players}
                  onPlayerClick={handlePlayerClick}
                  className="w-full"
                />
                
                {/* Overlay ArenaZone */}
                <div className="absolute inset-0 pointer-events-none">
                  <ArenaZone
                    zones={zones}
                    width={800}
                    height={600}
                    onZoneClick={handleZoneClick}
                    className="pointer-events-auto"
                  />
                </div>
                
                {/* Overlay PlayerIndicator */}
                <div className="absolute inset-0">
                  <PlayerIndicator
                    players={playerIndicators}
                    privacyLevel={privacyLevel}
                    currentPlayerId="player-1"
                    showUsernames={true}
                    showHealthStatus={true}
                    showTeams={true}
                    showRanks={true}
                    onPlayerClick={handlePlayerClick}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Tracker */}
          <div>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Location Tracker</h2>
              <LocationTracker
                enabled={locationEnabled}
                privacyLevel={privacyLevel}
                onLocationUpdate={handleLocationUpdate}
                showStatus={true}
                showAccuracy={true}
              />
            </div>

            {/* Current Location Display */}
            {currentLocation && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Current Location</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <div><span className="text-gray-500">Zone:</span> {currentLocation.zoneName}</div>
                  <div><span className="text-gray-500">Direction:</span> {currentLocation.direction}</div>
                  <div><span className="text-gray-500">Distance:</span> {currentLocation.approximateDistance}</div>
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(currentLocation.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">GameMap</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• HTML5 Canvas rendering</li>
                <li>• Zoom & pan controls</li>
                <li>• Player positioning</li>
                <li>• Interactive clicks</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">ArenaZone</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• SVG zone rendering</li>
                <li>• Animated indicators</li>
                <li>• Shrinking zones</li>
                <li>• Time remaining</li>
                <li>• Zone types</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">PlayerIndicator</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Privacy obfuscation</li>
                <li>• Team indicators</li>
                <li>• Health status</li>
                <li>• Player rankings</li>
                <li>• Hover tooltips</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">LocationTracker</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Privacy-preserving</li>
                <li>• Zone-based location</li>
                <li>• Geolocation API</li>
                <li>• Accuracy display</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDemo;