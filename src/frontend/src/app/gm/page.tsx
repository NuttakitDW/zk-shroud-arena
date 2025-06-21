'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Users, Radio, Save } from 'lucide-react';
import { H3Zone } from '../../components/Map/types';

// Dynamic import to prevent SSR issues with Leaflet
const SimpleH3Map = dynamic(
  () => import('../../components/Map/SimpleH3Map').then(m => m.SimpleH3Map),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <p className="text-gray-400">Loading map...</p>
      </div>
    )
  }
);

export default function GameManagerPage() {
  const [zones, setZones] = useState<H3Zone[]>([]);
  const [activePlayers, setActivePlayers] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Load existing zones on mount and request location
  useEffect(() => {
    const savedZones = localStorage.getItem('gm-zones');
    if (savedZones) {
      setZones(JSON.parse(savedZones));
    }

    // Request location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationEnabled(true);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }

    // Simulate player count
    const interval = setInterval(() => {
      const playerData = localStorage.getItem('active-players');
      if (playerData) {
        setActivePlayers(JSON.parse(playerData).length);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleZonesChange = (newZones: H3Zone[]) => {
    setZones(newZones);
    
    // Save to localStorage for demo (in production, this would be WebSocket)
    localStorage.setItem('gm-zones', JSON.stringify(newZones));
    localStorage.setItem('zones-updated', Date.now().toString());
    
    setLastSync(new Date());
    setIsBroadcasting(true);
    setTimeout(() => setIsBroadcasting(false), 1000);
  };

  const clearAllZones = () => {
    setZones([]);
    localStorage.setItem('gm-zones', JSON.stringify([]));
    localStorage.setItem('zones-updated', Date.now().toString());
    setLastSync(new Date());
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-purple-400">Game Manager View</h1>
            <span className="text-sm text-gray-400">You control the battlefield - spawn zones anywhere!</span>
            {locationEnabled && (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Map centered on your location
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            {/* Broadcasting Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isBroadcasting ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              <Radio className="w-4 h-4" />
              <span className="text-sm">
                {isBroadcasting ? 'Broadcasting...' : 'Ready'}
              </span>
            </div>

            {/* Active Players */}
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>{activePlayers} Players Online</span>
            </div>

            {/* Last Sync */}
            {lastSync && (
              <div className="text-sm text-gray-400">
                Last update: {lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Zone Management</h2>
          
          {/* Zone Stats */}
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Hexagons</span>
              <span className="text-2xl font-bold text-cyan-400">{zones.length}</span>
            </div>
          </div>

          {/* Simple Instructions */}
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              How to Use
            </h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Choose your zone size before drawing</li>
              <li>• Once you start, all zones use the same size</li>
              <li>• Check "Add neighbors" for larger areas</li>
              <li>• Click "Clear" to reset and change size</li>
              <li>• Zones sync instantly to all players</li>
            </ul>
          </div>

          {/* Zone List */}
          <div className="space-y-2">
            <h3 className="font-semibold mb-2">Created Zones</h3>
            {zones.length === 0 ? (
              <p className="text-gray-500 text-sm">No zones created yet</p>
            ) : (
              zones.slice(-10).reverse().map((zone, index) => (
                <div
                  key={zone.id}
                  className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Zone {zones.length - index}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(zone.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2">
            <button
              onClick={clearAllZones}
              className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Clear All Zones
            </button>
            <a
              href="/"
              className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-center rounded-lg transition-colors"
            >
              Back to Menu
            </a>
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative">
          <SimpleH3Map
            onZonesChange={handleZonesChange}
            existingZones={zones}
            height="100%"
            defaultCenter={userLocation || [13.7563, 100.5018]}
          />
          
          {/* Demo Notice */}
          <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-3 max-w-sm">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-purple-400">You're in control!</span> Unlike traditional battle royales, 
              YOU decide when and where zones appear. Create dynamic battlefields that evolve with your strategy!
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Demo: Open another tab as a player to see zones appear instantly.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}