/**
 * Geofencing Demo Component
 * Demonstrates H3 geofencing integration with location tracking
 */

import React, { useState, useEffect } from 'react';
import { useRealWorldLocation } from '../../hooks/useRealWorldLocation';
import { GamePhase } from '../../types/gameState';
import { H3Index, LocationCoordinates } from '../../types/zkProof';
import { h3Service } from '../../services/h3Service';
import ZoneProximityIndicator from '../Location/ZoneProximityIndicator';

// Demo zones around San Francisco landmarks
const DEMO_ZONES: Record<string, LocationCoordinates> = {
  'Golden Gate Bridge': { latitude: 37.8199, longitude: -122.4783 },
  'Alcatraz Island': { latitude: 37.8267, longitude: -122.4230 },
  'Ferry Building': { latitude: 37.7955, longitude: -122.3937 },
  'Coit Tower': { latitude: 37.8024, longitude: -122.4058 },
  'Palace of Fine Arts': { latitude: 37.8029, longitude: -122.4485 }
};

const GeofencingDemo: React.FC = () => {
  const [activeZones, setActiveZones] = useState<H3Index[]>([]);
  const [selectedResolution, setSelectedResolution] = useState(8);
  const [demoPhase, setDemoPhase] = useState<GamePhase>(GamePhase.LOBBY);

  // Initialize demo zones
  useEffect(() => {
    const zones = Object.values(DEMO_ZONES).map(coord => 
      h3Service.latLngToH3(coord, selectedResolution)
    );
    setActiveZones(zones);
  }, [selectedResolution]);

  // Use the enhanced location hook with geofencing
  const {
    currentLocation,
    currentH3Index,
    nearbyZones,
    geofenceState,
    lastGeofenceEvent,
    proximityAlerts,
    isTracking,
    hasPermission,
    permissionDenied,
    error,
    startTracking,
    stopTracking,
    generateLocationProof,
    isGeneratingProof,
    lastProof,
    proofStatus,
    getCurrentH3Cells,
    isInZone,
    getDistanceToZone,
    updateActiveZones: updateHookZones
  } = useRealWorldLocation(demoPhase, {
    enableGeofencing: true,
    activeZones,
    h3Resolution: selectedResolution,
    proximityThreshold: 100, // 100 meters
    enableAutoProofs: demoPhase === GamePhase.ACTIVE
  });

  // Update zones when they change
  useEffect(() => {
    if (isTracking) {
      updateHookZones(activeZones);
    }
  }, [activeZones, isTracking, updateHookZones]);

  const handleStartDemo = async () => {
    setDemoPhase(GamePhase.ACTIVE);
    await startTracking();
  };

  const handleStopDemo = () => {
    setDemoPhase(GamePhase.LOBBY);
    stopTracking();
  };

  const handleGenerateProof = async () => {
    if (currentLocation) {
      await generateLocationProof(currentLocation);
    }
  };

  const renderZoneList = () => {
    return Object.entries(DEMO_ZONES).map(([name, coords]) => {
      const zoneIndex = h3Service.latLngToH3(coords, selectedResolution);
      const isActive = isInZone(zoneIndex);
      const distance = getDistanceToZone(zoneIndex);
      
      return (
        <div
          key={name}
          className={`p-3 rounded-lg border ${
            isActive 
              ? 'bg-green-900/20 border-green-500' 
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          <h4 className="font-semibold text-sm">{name}</h4>
          <p className="text-xs text-gray-400 font-mono">{zoneIndex.substring(0, 10)}...</p>
          {distance !== null && (
            <p className="text-xs mt-1">
              Distance: <span className="font-semibold">{Math.round(distance)}m</span>
            </p>
          )}
          {isActive && <p className="text-xs text-green-400 mt-1">You are here!</p>}
        </div>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">H3 Geofencing Demo</h2>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={isTracking ? handleStopDemo : handleStartDemo}
            disabled={permissionDenied}
            className={`px-4 py-2 rounded font-medium ${
              isTracking
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600'
            }`}
          >
            {isTracking ? 'Stop Demo' : 'Start Demo'}
          </button>
          
          <button
            onClick={handleGenerateProof}
            disabled={!currentLocation || isGeneratingProof || demoPhase !== GamePhase.ACTIVE}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium"
          >
            {isGeneratingProof ? 'Generating...' : 'Generate Proof'}
          </button>
          
          <select
            value={selectedResolution}
            onChange={(e) => setSelectedResolution(Number(e.target.value))}
            disabled={isTracking}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded"
          >
            <option value={7}>Resolution 7 (~5 km²)</option>
            <option value={8}>Resolution 8 (~0.7 km²)</option>
            <option value={9}>Resolution 9 (~0.1 km²)</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error.message}</p>
          </div>
        )}

        {/* Permission Denied */}
        {permissionDenied && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <p className="text-yellow-300">
              Location permission denied. Please enable location access in your browser settings.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Current Status */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Current Location</h3>
              {currentLocation ? (
                <div className="space-y-2 text-sm">
                  <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
                  <p>Lng: {currentLocation.longitude.toFixed(6)}</p>
                  <p className="font-mono text-xs">H3: {currentH3Index || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-gray-400">No location data</p>
              )}
            </div>

            {/* Zone Proximity Indicator */}
            <ZoneProximityIndicator
              currentZone={geofenceState?.currentZone || null}
              nearbyZones={geofenceState?.nearbyZones || []}
              proximityAlerts={proximityAlerts}
              lastGeofenceEvent={lastGeofenceEvent}
              isTracking={isTracking}
              showDebugInfo={true}
            />

            {/* Proof Status */}
            {lastProof && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Last Proof</h3>
                <p className="text-xs font-mono text-gray-400">
                  {lastProof.proof.substring(0, 20)}...
                </p>
                <p className="text-sm mt-2">
                  Status: <span className={`font-semibold ${
                    proofStatus === 'valid' ? 'text-green-400' : 'text-yellow-400'
                  }`}>{proofStatus}</span>
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Demo Zones */}
          <div className="space-y-4">
            <h3 className="font-semibold">Demo Zones (San Francisco)</h3>
            <div className="space-y-2">
              {renderZoneList()}
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-300">
                This demo uses H3 hexagonal zones around San Francisco landmarks. 
                Move near these locations to trigger zone entry/exit events.
              </p>
            </div>
          </div>
        </div>

        {/* Current H3 Cells */}
        {isTracking && currentLocation && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Nearby H3 Cells</h3>
            <div className="flex flex-wrap gap-2">
              {getCurrentH3Cells(1).map((cell, index) => (
                <span 
                  key={cell}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    index === 0 
                      ? 'bg-blue-900/50 border border-blue-500' 
                      : 'bg-gray-700'
                  }`}
                >
                  {cell.substring(0, 10)}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeofencingDemo;