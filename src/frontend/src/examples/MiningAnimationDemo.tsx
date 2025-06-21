'use client';

import React, { useState } from 'react';
import { PlayerMap } from '../components/Map/PlayerMap';
import { H3Zone } from '../components/Map/types';
import { MiningAnimation } from '../components/Map/MiningAnimation';

// Demo zones for testing
const demoZones: H3Zone[] = [
  {
    id: 'zone-1',
    h3Index: '8c2a100d2cb25ff',
    type: 'safe',
    name: 'Mining Zone Alpha',
    pointValue: 15,
    center: { latitude: 13.7563, longitude: 100.5018 }
  },
  {
    id: 'zone-2', 
    h3Index: '8c2a100d2cb27ff',
    type: 'safe',
    name: 'Mining Zone Beta',
    pointValue: 20,
    center: { latitude: 13.7573, longitude: 100.5028 }
  },
  {
    id: 'zone-3',
    h3Index: '8c2a100d2cb29ff',
    type: 'danger',
    name: 'Danger Zone',
    pointValue: -10,
    center: { latitude: 13.7553, longitude: 100.5008 }
  }
];

export default function MiningAnimationDemo() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Mining Animation Demo</h1>
        
        {/* Feature description */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">New Feature: Mining Graphics</h2>
          <p className="text-gray-300 mb-4">
            When players enter a safe zone, they will now see a mining animation that indicates they are earning points.
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Green pulsing animation when in safe zones</li>
            <li>Shows points earned per tick (+15, +20, etc.)</li>
            <li>Player marker changes color from blue to green</li>
            <li>Accuracy circle also changes to green when mining</li>
          </ul>
        </div>

        {/* Animation preview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Animation Preview</h3>
          <div className="flex justify-around items-center py-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Not Mining</p>
              <div className="relative inline-block">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Mining Active</p>
              <div className="relative inline-block">
                <MiningAnimation isActive={true} pointsPerTick={15} />
              </div>
            </div>
          </div>
        </div>

        {/* Map controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Try It Out</h3>
          <button
            onClick={() => setLocationEnabled(!locationEnabled)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              locationEnabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {locationEnabled ? 'Disable Location' : 'Enable Location'}
          </button>
          {locationEnabled && (
            <p className="text-sm text-gray-400 mt-2">
              Move near a green safe zone to see the mining animation
            </p>
          )}
        </div>

        {/* Map */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Interactive Map</h3>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <PlayerMap
              existingZones={demoZones}
              locationEnabled={locationEnabled}
              onLocationUpdate={(lat, lng) => setUserLocation({ lat, lng })}
              defaultCenter={[13.7563, 100.5018]}
              defaultZoom={17}
            />
          </div>
          
          {userLocation && (
            <div className="mt-4 text-sm text-gray-400">
              Current Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}