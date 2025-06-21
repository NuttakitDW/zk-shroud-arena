'use client';

import React, { useState } from 'react';
import { GameContextProvider } from '../../contexts/GameContext';
import { GamePhaseControls } from '../../components/admin/GamePhaseControls';
import { GamePhaseDisplay } from '../../components/ui/GamePhaseDisplay';
import { ZKLocationVerifier } from '../../components/ZKProofIntegration/ZKLocationVerifier';
import { apiController } from '../../services/apiController';
import { phaseManager } from '../../services/phaseManager';

export default function PhaseDemoPage() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [apiStats, setApiStats] = useState(apiController.getStats());
  const [demoLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194
  });

  const refreshStats = () => {
    setApiStats(apiController.getStats());
  };

  const testAPICall = async () => {
    try {
      const result = await apiController.generateProof(
        demoLocation,
        5,
        ['85283473fffffff'], // Sample H3 index
        { force: false }
      );
      
      if (!result.success) {
        alert(`API Call Blocked: ${result.error?.message}`);
      } else {
        alert('API Call Successful!');
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      refreshStats();
    }
  };

  return (
    <GameContextProvider gameId="phase-demo" enablePersistence={false}>
      <div className="min-h-screen bg-gray-950 text-white p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-4xl font-bold mb-2">Game Phase Management Demo</h1>
          <p className="text-gray-400">
            This demo showcases the phase system that prevents API spamming when the game hasn't started.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Phase Controls */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Admin Controls</h2>
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAdmin
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {isAdmin ? 'Admin Mode ON' : 'Admin Mode OFF'}
              </button>
            </div>
            
            <GamePhaseControls
              isAdmin={isAdmin}
              showPermissions={true}
              onPhaseChange={(phase) => {
                console.log('Phase changed to:', phase);
                apiController.setGamePhase(phase);
                refreshStats();
              }}
            />
          </div>

          {/* Middle Column - Status Display */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Game Status</h2>
            
            <GamePhaseDisplay
              showApiStatus={true}
              showTimeRemaining={true}
              compact={false}
            />

            {/* API Test Section */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">API Test</h3>
              <p className="text-sm text-gray-400 mb-4">
                Test API calls to see how they're blocked or allowed based on the current phase.
              </p>
              <button
                onClick={testAPICall}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Test ZK Proof Generation
              </button>
              
              {/* API Stats */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total API Calls:</span>
                  <span className="font-medium">{apiStats.totalCalls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Blocked:</span>
                  <span className="font-medium text-red-400">{apiStats.blockedCalls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Allowed:</span>
                  <span className="font-medium text-green-400">{apiStats.allowedCalls}</span>
                </div>
                {apiStats.lastBlockedReason && (
                  <div className="mt-2 p-2 bg-red-900 bg-opacity-30 rounded text-xs text-red-200">
                    Last blocked: {apiStats.lastBlockedReason}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  apiController.resetStats();
                  refreshStats();
                }}
                className="mt-3 w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
              >
                Reset Stats
              </button>
            </div>
          </div>

          {/* Right Column - ZK Verifier */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Location Verifier</h2>
            
            <ZKLocationVerifier
              gameId="phase-demo"
              currentLocation={{
                zoneName: 'Demo Zone',
                zoneId: 'demo-zone',
                direction: 'N',
                approximateDistance: '100m',
                lastUpdated: Date.now(),
                privacyLevel: 'high',
                h3Index: '85283473fffffff'
              }}
              realLocation={demoLocation}
              showDetails={true}
              enableRealTimeVerification={false}
              onProofValidated={(proof, valid) => {
                console.log('Proof validated:', valid);
                refreshStats();
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-7xl mx-auto mt-12 bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">How the Phase System Works</h3>
          <div className="space-y-3 text-gray-300">
            <div>
              <span className="font-medium text-white">1. Lobby Phase:</span> All API calls are blocked. Players can join but cannot generate proofs.
            </div>
            <div>
              <span className="font-medium text-white">2. Preparation Phase:</span> Test proofs are allowed to help players verify their setup.
            </div>
            <div>
              <span className="font-medium text-white">3. Active Phase:</span> Full API access. Players can generate and verify location proofs.
            </div>
            <div>
              <span className="font-medium text-white">4. Shrinking Phases:</span> API access continues during zone shrinking.
            </div>
            <div>
              <span className="font-medium text-white">5. Game Over:</span> API calls are blocked again to prevent unnecessary server load.
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
            <h4 className="font-medium text-blue-200 mb-2">Try It Out:</h4>
            <ol className="text-sm text-blue-200 space-y-1">
              <li>1. Click "Test ZK Proof Generation" in Lobby phase - it will be blocked</li>
              <li>2. Use admin controls to change to Active phase</li>
              <li>3. Try the API call again - it will succeed</li>
              <li>4. Check the stats to see blocked vs allowed calls</li>
            </ol>
          </div>
        </div>
      </div>
    </GameContextProvider>
  );
}