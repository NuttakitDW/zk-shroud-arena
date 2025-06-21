'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, MapPin, Info, Sparkles } from 'lucide-react';
import { H3Zone } from '../../components/Map/types';

// Dynamic imports for map components
const PlayerMap = dynamic(
  () => import('../../components/Map/PlayerMap').then(m => m.PlayerMap),
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

const SimpleZoneProximity = dynamic(
  () => import('../../components/Location/SimpleZoneProximity').then(m => m.SimpleZoneProximity),
  { ssr: false }
);

// Demo zones
const demoZones: H3Zone[] = [
  {
    id: 'demo-zone-1',
    h3Index: '8c2a100d2cb25ff',
    type: 'safe',
    name: 'Demo Zone Alpha',
    pointValue: 10,
    center: { latitude: 13.7563, longitude: 100.5018 }
  },
  {
    id: 'demo-zone-2', 
    h3Index: '8c2a100d2cb27ff',
    type: 'safe',
    name: 'Demo Zone Beta',
    pointValue: 15,
    center: { latitude: 13.7573, longitude: 100.5028 }
  },
  {
    id: 'demo-zone-3',
    h3Index: '8c2a100d2cb29ff',
    type: 'safe',
    name: 'Demo Zone Gamma',
    pointValue: 20,
    center: { latitude: 13.7553, longitude: 100.5008 }
  }
];

export default function ProofDemoPage() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentZone, setCurrentZone] = useState<H3Zone | null>(null);

  // Auto-enable location for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocationEnabled(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
                  Zero-Knowledge Location Proof Demo
                </h1>
                <p className="text-sm text-gray-400">
                  Privacy-preserving location verification using ZK proofs
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Map and Info */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-white">How it works</h3>
                  <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Enable location permission when prompted</li>
                    <li>Move your location marker into a green demo zone</li>
                    <li>Watch as ZK proofs are automatically generated</li>
                    <li>The proof validates your zone presence without revealing GPS coordinates</li>
                  </ol>
                  <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
                    <p className="text-sm text-cyan-400">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      ZK proofs ensure location privacy while preventing spoofing
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-white">What the proof contains:</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Proof hash (cryptographic proof of zone presence)</li>
                      <li>H3 zone index (which zone you're in)</li>
                      <li>Timestamp (when the proof was generated)</li>
                      <li>NOT your GPS coordinates!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Interactive Map
              </h3>
              <div className="h-[400px] rounded-lg overflow-hidden border border-gray-700">
                <PlayerMap
                  existingZones={demoZones}
                  locationEnabled={locationEnabled}
                  onLocationUpdate={(lat, lng) => setPlayerLocation({ latitude: lat, longitude: lng })}
                  defaultCenter={[13.7563, 100.5018]}
                  defaultZoom={17}
                />
              </div>
              
              {/* Location Controls */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setLocationEnabled(!locationEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    locationEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {locationEnabled ? 'Disable' : 'Enable'} Location
                </button>
                
                {playerLocation && (
                  <span className="text-xs text-gray-400 font-mono">
                    {playerLocation.latitude.toFixed(6)}, {playerLocation.longitude.toFixed(6)}
                  </span>
                )}
              </div>
            </div>

            {/* Zone Proximity */}
            <SimpleZoneProximity
              nearbyZones={demoZones}
              onZoneEnter={setCurrentZone}
              onZoneExit={() => setCurrentZone(null)}
            />
          </div>

          {/* Right Column - Proof Logger */}
          <div className="lg:sticky lg:top-4">
            <LiveProofLogger
              playerLocation={playerLocation || undefined}
              currentZone={currentZone}
              className="h-[700px]"
            />
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-cyan-400 mb-2">Zero-Knowledge Proofs</h4>
              <p className="text-gray-300">
                Cryptographic proofs that validate location presence without revealing exact coordinates.
                Uses zk-SNARKs for efficient verification.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">H3 Geospatial Index</h4>
              <p className="text-gray-300">
                Hexagonal hierarchical spatial index by Uber. Provides discrete location cells 
                for privacy-preserving zone validation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Privacy Guarantees</h4>
              <p className="text-gray-300">
                Exact GPS coordinates never leave the device. Only proof of presence in a zone 
                is shared, protecting user privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}