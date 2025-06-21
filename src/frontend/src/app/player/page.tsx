'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, MapPin, Coins, Heart, AlertTriangle, Sparkles } from 'lucide-react';
import { H3Zone } from '../../components/Map/types';
// import { GamePhase } from '../../types/gameState'; // Not needed with SimpleH3Map

// Dynamic imports
const PlayerMap = dynamic(
  () => import('../../components/Map/PlayerMap').then(m => m.PlayerMap),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <p className="text-gray-400">Loading map...</p>
      </div>
    )
  }
);

const SimpleZoneProximity = dynamic(
  () => import('../../components/Location/SimpleZoneProximity').then(m => m.SimpleZoneProximity),
  { ssr: false }
);

export default function PlayerPage() {
  const [zones, setZones] = useState<H3Zone[]>([]);
  const [playerHealth] = useState(100);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [isInSafeZone, setIsInSafeZone] = useState(false);
  const [nearestZone, setNearestZone] = useState<H3Zone | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Poll for zone updates from GM
  useEffect(() => {
    let lastUpdateTime = '0';
    
    const checkForUpdates = () => {
      const updateTime = localStorage.getItem('zones-updated');
      if (updateTime && updateTime !== lastUpdateTime) {
        const gmZones = localStorage.getItem('gm-zones');
        if (gmZones) {
          const parsedZones = JSON.parse(gmZones);
          setZones(parsedZones);
          setLastUpdate(new Date());
          lastUpdateTime = updateTime;
        }
      }
    };

    // Check immediately and then every second
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 1000);

    // Register this player
    const playerId = `player-${Date.now()}`;
    const updatePlayerList = () => {
      const players = JSON.parse(localStorage.getItem('active-players') || '[]');
      const updatedPlayers = players.filter((p: any) => Date.now() - p.lastSeen < 5000);
      updatedPlayers.push({ id: playerId, lastSeen: Date.now() });
      localStorage.setItem('active-players', JSON.stringify(updatedPlayers));
    };
    
    updatePlayerList();
    const playerInterval = setInterval(updatePlayerList, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(playerInterval);
    };
  }, []);

  // Simulate coin earning in safe zones
  useEffect(() => {
    if (isInSafeZone && nearestZone) {
      const coinInterval = setInterval(() => {
        setPlayerCoins(prev => prev + (nearestZone.pointValue || 1));
      }, 1000);
      return () => clearInterval(coinInterval);
    }
  }, [isInSafeZone, nearestZone]);

  const handleLocationUpdate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Simply enable location tracking - permission will be requested by the map component
    setLocationEnabled(true);
  };

  const getZoneTypeColor = (zone: H3Zone | null) => {
    if (!zone) return 'text-gray-400';
    return zone.type === 'safe' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header HUD */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-cyan-400">Player View</h1>
            {locationEnabled ? (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location Active
              </span>
            ) : (
              <span className="text-sm text-gray-400">Location Disabled</span>
            )}
          </div>
          
          {/* Player Stats */}
          <div className="flex items-center gap-6">
            {/* Health */}
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span>{playerHealth}/100</span>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span>{playerCoins}</span>
            </div>

            {/* Zone Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isInSafeZone ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <Shield className={`w-4 h-4 ${isInSafeZone ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-sm">
                {isInSafeZone ? 'Safe Zone' : 'Danger Zone'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Zone Information</h2>
          
          {/* Current Status */}
          <div className={`bg-gray-900 rounded-lg p-4 mb-4 ${isInSafeZone ? 'ring-2 ring-green-500/50 animate-pulse' : ''}`}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              Your Status
              {isInSafeZone && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Mining Active
                </span>
              )}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Zone:</span>
                <span className={getZoneTypeColor(nearestZone)}>
                  {nearestZone ? nearestZone.name : 'No Zone'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Earning Rate:</span>
                <span className={`flex items-center gap-1 ${isInSafeZone ? "text-yellow-400" : "text-gray-400"}`}>
                  {isInSafeZone && (
                    <Coins className="w-3 h-3 animate-pulse" />
                  )}
                  {isInSafeZone && nearestZone ? `+${nearestZone.pointValue} coins/sec` : '0 coins/sec'}
                </span>
              </div>
              {!locationEnabled && (
                <button
                  onClick={handleLocationUpdate}
                  className="w-full mt-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                >
                  Enable Location
                </button>
              )}
            </div>
          </div>

          {/* Zone Proximity */}
          {locationEnabled && (
            <div className="mb-4">
              <SimpleZoneProximity
                nearbyZones={zones}
                onZoneEnter={(zone) => {
                  setNearestZone(zone);
                  setIsInSafeZone(zone.type === 'safe');
                }}
                onZoneExit={() => {
                  setNearestZone(null);
                  setIsInSafeZone(false);
                }}
              />
            </div>
          )}

          {/* Active Zones List */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Active Zones ({zones.length})</h3>
            {zones.length === 0 ? (
              <p className="text-gray-500 text-sm">Waiting for Game Manager to create zones...</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-2 rounded border text-sm ${
                      zone.type === 'safe' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{zone.name}</span>
                      <span className="text-xs">{zone.pointValue} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-2">
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-400">Privacy Protected!</p>
                <p className="text-gray-300 mt-1">
                  The Game Manager cannot see your exact location. Only you can see where you are on the map.
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <a
            href="/"
            className="block mt-6 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-center rounded-lg transition-colors"
          >
            Back to Menu
          </a>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative">
          <PlayerMap
            existingZones={zones}
            height="100%"
            locationEnabled={locationEnabled}
            onLocationUpdate={(lat, lng) => {
              // Could use this to check zone proximity
              console.log('Player location:', lat, lng);
            }}
          />
          
          {/* Privacy Notice */}
          <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-3 max-w-sm">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-cyan-400">Your Privacy:</span> Your exact location is never shared. 
              Only zone entry/exit events are tracked.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}