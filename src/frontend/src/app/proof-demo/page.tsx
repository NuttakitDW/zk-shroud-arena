'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Shield, MapPin, Info, Sparkles, Hexagon, Terminal } from 'lucide-react';
import { H3Zone } from '../../components/Map/types';

// Dynamic imports for map components
const SimpleH3Map = dynamic(
  () => import('../../components/Map/SimpleH3Map').then(m => m.SimpleH3Map),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading map...</p>
      </div>
    )
  }
);

const LiveProofLogger = dynamic(
  () => import('../../components/LiveProofLogger').then(m => m.LiveProofLogger),
  { ssr: false }
);

const BackendStatus = dynamic(
  () => import('../../components/BackendStatus').then(m => m.BackendStatus),
  { ssr: false }
);

export default function ProofDemoAdvancedPage() {
  const [zones, setZones] = useState<H3Zone[]>([]);
  const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentZone, setCurrentZone] = useState<H3Zone | null>(null);
  const [lastProof, setLastProof] = useState<any>(null);

  // Check if player is in any zone
  const checkPlayerInZone = (lat: number, lng: number) => {
    if (zones.length === 0) return;
    
    // Check each zone
    for (const zone of zones) {
      try {
        const playerH3 = h3.latLngToCell(lat, lng, h3.getResolution(zone.h3Index));
        if (playerH3 === zone.h3Index) {
          setCurrentZone(zone);
          return;
        }
      } catch (e) {
        // Ignore H3 errors
      }
    }
    setCurrentZone(null);
  };

  // Update player location and check zones
  const handleLocationUpdate = (lat: number, lng: number) => {
    setPlayerLocation({ latitude: lat, longitude: lng });
    checkPlayerInZone(lat, lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  ZK Proof Demo
                </h1>
                <p className="text-sm text-gray-400">
                  Draw H3 zones and generate real ZK proofs with backend API
                </p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Instructions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <Hexagon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-white">Draw Your Own H3 Zones</h3>
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Select a hexagon size (resolution)</li>
                    <li>Click on the map to create H3 zones</li>
                    <li>Enable location to track your position</li>
                    <li>Enter a zone to generate real ZK proofs</li>
                  </ol>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Terminal className="w-4 h-4" />
                  Open DevTools Console for API logs
                </div>
              </div>
            </div>

            {/* Map with H3 Drawing */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Interactive H3 Map - Draw Your Zones
              </h3>
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
                <SimpleH3Map
                  onZonesChange={setZones}
                  existingZones={zones}
                  onLocationUpdate={handleLocationUpdate}
                  locationEnabled={true}
                  defaultCenter={[13.7563, 100.5018]}
                  defaultZoom={17}
                />
              </div>
              
              {/* Zone Stats */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  Zones created: <span className="text-white font-semibold">{zones.length}</span>
                </div>
                {playerLocation && (
                  <div className="text-gray-400 font-mono text-xs">
                    Player: {playerLocation.latitude.toFixed(6)}, {playerLocation.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Proof Logger & Status */}
          <div className="space-y-4">
            {/* Backend Status */}
            <BackendStatus />

            {/* Current Zone Status */}
            {currentZone && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <h4 className="font-semibold text-green-400">In Zone!</h4>
                </div>
                <p className="text-sm text-gray-300">
                  {currentZone.name} ({currentZone.h3Index})
                </p>
              </div>
            )}

            {/* Proof Logger */}
            <LiveProofLogger
              playerLocation={playerLocation || undefined}
              currentZone={currentZone}
              className="h-[400px]"
              onProofGenerated={(proof) => setLastProof(proof)}
            />

            {/* Last Generated Proof Display */}
            {lastProof && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  Last Generated Proof
                </h4>
                <div className="bg-black/50 rounded p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-green-400">
{JSON.stringify({
  proof: lastProof.proof,
  public_inputs: lastProof.public_inputs,
  metadata: lastProof.metadata || {
    generated_at: new Date().toISOString(),
    zone: currentZone?.name || 'Unknown',
    h3_resolution: 13
  }
}, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(lastProof, null, 2));
                  }}
                  className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                >
                  Copy Proof
                </button>
              </div>
            )}

            {/* API Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                API Endpoints Used
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="text-gray-400">
                  POST {env.BACKEND_URL}/prove
                </div>
                <div className="text-gray-400">
                  POST {env.BACKEND_URL}/verify
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Check browser console for detailed API request/response logs
              </p>
            </div>
          </div>
        </div>

        {/* Console Log Helper */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-400 mb-1">
                Open Browser Console to See API Calls
              </p>
              <p className="text-gray-300">
                Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">F12</kbd> or 
                <kbd className="px-2 py-1 bg-gray-700 rounded text-xs ml-1">Cmd+Option+I</kbd> to open DevTools.
                Look for logs marked with 🚀 (requests) and ✅ (responses).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import h3 for zone checking
import * as h3 from 'h3-js';
import { env } from '../../config/environment';