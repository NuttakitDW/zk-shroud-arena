'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { H3Zone } from '../components/Map/types';

// Dynamic import to avoid SSR issues with Leaflet
const RealWorldMap = dynamic(
  () => import('../components/Map/RealWorldMap').then(mod => mod.RealWorldMap),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96 bg-gray-900">Loading map...</div>
  }
);

/**
 * Example page demonstrating the Game Manager zone drawing functionality
 * 
 * This example shows how to:
 * 1. Enable game manager mode on RealWorldMap
 * 2. Handle zone creation events
 * 3. Display created zones
 * 4. Sync zone data for multiplayer
 */
export default function GameManagerZoneDrawing() {
  const [zones, setZones] = useState<H3Zone[]>([]);
  const [isGameManager] = useState(true); // In real app, check user role
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Handle zone creation
  const handleZoneCreate = useCallback(async (zone: H3Zone) => {
    console.log('New zone created:', zone);
    
    // Add to local state
    setZones(prev => [...prev, zone]);
    
    // Simulate syncing to backend
    setSyncStatus('syncing');
    
    try {
      // In real app, send to backend API
      // await api.createZone(zone);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to sync zone:', error);
      setSyncStatus('idle');
    }
  }, []);

  // Export zones as JSON
  const exportZones = useCallback(() => {
    const data = {
      version: '1.0',
      timestamp: Date.now(),
      zones: zones
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zones-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [zones]);

  // Clear all zones
  const clearAllZones = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all zones?')) {
      setZones([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Manager - Zone Drawing</h1>
          <p className="text-gray-400">
            Draw H3 hexagonal zones on the map to define safe and danger areas for the game.
          </p>
        </div>

        {/* Zone Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Zones</div>
            <div className="text-2xl font-bold">{zones.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Safe Zones</div>
            <div className="text-2xl font-bold text-green-400">
              {zones.filter(z => z.type === 'safe').length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Danger Zones</div>
            <div className="text-2xl font-bold text-red-400">
              {zones.filter(z => z.type === 'danger').length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Sync Status</div>
            <div className="text-lg font-bold">
              {syncStatus === 'idle' && <span className="text-gray-400">Ready</span>}
              {syncStatus === 'syncing' && <span className="text-yellow-400">Syncing...</span>}
              {syncStatus === 'synced' && <span className="text-green-400">Synced ✓</span>}
            </div>
          </div>
        </div>

        {/* Map with Zone Drawing */}
        <div className="mb-6">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <RealWorldMap
              height="600px"
              isGameManager={isGameManager}
              onZoneCreate={handleZoneCreate}
              existingZones={zones}
              enableLocationTracking={false}
              centerOnUser={false}
              className="w-full"
            />
          </div>
        </div>

        {/* Zone Management Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={exportZones}
            disabled={zones.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Export Zones ({zones.length})
          </button>
          <button
            onClick={clearAllZones}
            disabled={zones.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Clear All Zones
          </button>
        </div>

        {/* Zone List */}
        {zones.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Created Zones</h2>
            <div className="space-y-2">
              {zones.map((zone, index) => (
                <div 
                  key={zone.id} 
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      zone.type === 'safe' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-gray-400">
                        {zone.pointValue} points/tick • H3: {zone.h3Index.substring(0, 10)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(zone.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">How to Draw Zones</h2>
          <ol className="space-y-2 text-gray-300">
            <li>1. Click "Start Drawing" in the control panel on the left</li>
            <li>2. Select drawing mode: Single (click hexagons), Area (drag to select), or Path (connected hexagons)</li>
            <li>3. Choose zone type: Safe (green) or Danger (red)</li>
            <li>4. Set point value per tick for the zone</li>
            <li>5. Draw hexagons on the map by clicking/dragging</li>
            <li>6. Enter a name for the zone</li>
            <li>7. Click "Confirm Zone" to save</li>
          </ol>
          
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-400">
              <strong>Note:</strong> H3 hexagon resolution adjusts automatically based on zoom level. 
              Zoom in for finer control over zone boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}