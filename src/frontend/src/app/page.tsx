"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  GameMap,
  ArenaZone,
  LoadingScreen,
  ConnectionStatus,
  ZKProofIndicator,
  type Position,
  type Player
} from '../components';
import { GameContextProvider } from '../contexts/GameContext';
import { GamePhase, ZKProofStatus } from '../types/gameState';
import { LocationCoordinates } from '../types/zkProof';
import { MapPin, Map, Globe, UserCheck, Users, Shield } from 'lucide-react';
import { env } from '../config/environment';

// Dynamic import for RealWorldArena to prevent SSR issues with Leaflet
const RealWorldArena = dynamic(
  () => import('../components/arena/RealWorldArena'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Real World Arena...</p>
          <p className="text-gray-500 text-sm">Initializing map and location services</p>
        </div>
      </div>
    )
  }
);

export default function ZKShroudArena() {
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [zkStatus, setZkStatus] = useState<ZKProofStatus>(ZKProofStatus.NONE);
  const [playerCount] = useState(1);
  const [arenaMode, setArenaMode] = useState<'virtual' | 'real-world'>('virtual');
  const [_realWorldLocation, _setRealWorldLocation] = useState<LocationCoordinates | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: 'player-1',
    position: { x: 500, y: 500 },
    status: 'active',
    isCurrentPlayer: true,
  });
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Check backend connection
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(env.getApiUrl(env.API.HEALTHZ));
        setBackendConnected(response.ok);
      } catch {
        setBackendConnected(false);
      }
      setIsLoading(false);
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  // Game state simulation
  useEffect(() => {
    if (gamePhase === GamePhase.ACTIVE) {
      const interval = setInterval(() => {
        setZkStatus(prev => prev === ZKProofStatus.NONE ? ZKProofStatus.GENERATING : ZKProofStatus.VALID);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  const handleStartGame = () => {
    setGamePhase(GamePhase.PREPARATION);
    setTimeout(() => setGamePhase(GamePhase.ACTIVE), 2000);
  };

  const handlePlayerMove = (position: Position) => {
    setCurrentPlayer(prev => ({ ...prev, position }));
    setZkStatus(ZKProofStatus.GENERATING);
    setTimeout(() => setZkStatus(ZKProofStatus.VALID), 1000);
  };

  const _handleLocationUpdate = (location: LocationCoordinates) => {
    _setRealWorldLocation(location);
    setZkStatus(ZKProofStatus.GENERATING);
    setTimeout(() => setZkStatus(ZKProofStatus.VALID), 1000);
  };

  const _handleZKProofGenerated = (proof: unknown) => {
    console.log('ZK Proof generated:', proof);
    setZkStatus(ZKProofStatus.VALID);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <GameContextProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                ZK Shroud Arena
              </h1>
              <p className="text-gray-400 text-sm">
                Battle Royale with Zero-Knowledge Location Proofs
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus isConnected={backendConnected} />
              <ZKProofIndicator status={zkStatus} />
            </div>
          </div>
        </header>

        {/* Game Content */}
        <main className="max-w-7xl mx-auto p-4">
          {gamePhase === GamePhase.LOBBY && !showRoleSelection && (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold mb-6">ZK Zone Control Demo</h2>
              <p className="text-xl text-gray-400 mb-8">Choose your role to begin</p>
              
              {/* Role Selection */}
              <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto mb-8">
                <h3 className="text-xl font-semibold mb-6">Select Your Role</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Game Manager */}
                  <a
                    href="/gm"
                    className="block p-6 rounded-lg border-2 transition-all border-purple-500 bg-purple-500/10 hover:bg-purple-500/20"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <UserCheck className="w-12 h-12 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Game Manager</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Be the puppet master! Create zones anywhere, anytime - no automatic shrinking!
                    </p>
                    <div className="text-xs text-left space-y-1 text-gray-300">
                      <div>• Spawn zones anywhere on the map instantly</div>
                      <div>• Create dynamic, evolving battlefields</div>
                      <div>• Design strategic scenarios in real-time</div>
                    </div>
                  </a>

                  {/* Player */}
                  <a
                    href="/player"
                    className="block p-6 rounded-lg border-2 transition-all border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Users className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Player</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Survive in an unpredictable battlefield where zones can appear anywhere, anytime!
                    </p>
                    <div className="text-xs text-left space-y-1 text-gray-300">
                      <div>• Adapt to sudden zone changes</div>
                      <div>• Your exact location stays private</div>
                      <div>• Strategic movement is key to survival</div>
                    </div>
                  </a>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium">Demo Mode Instructions</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Open two browser tabs: one as Game Manager to draw zones, and another as Player to see them appear in real-time!
                  </p>
                </div>
              </div>

              {/* ZK Proof Demo Buttons */}
              <div className="text-center mb-8 space-y-4">
                <div className="flex gap-4 justify-center">
                  <a
                    href="/proof-demo"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Simple ZK Demo</span>
                  </a>
                  <a
                    href="/proof-demo-advanced"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 relative"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Advanced ZK Demo</span>
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      NEW
                    </span>
                  </a>
                </div>
                <p className="text-sm text-gray-400">
                  Simple: Pre-made zones | Advanced: Draw H3 zones + real API calls
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto mb-8">
                <h3 className="text-xl font-semibold mb-4">Revolutionary Features:</h3>
                <ul className="text-left space-y-2 text-gray-300">
                  <li>🎮 Human-controlled zones - no predictable shrinking!</li>
                  <li>🎨 Game Master creates dynamic battlefields in real-time</li>
                  <li>🔐 Zero-knowledge proofs protect player locations</li>
                  <li>⚡ Zones can appear/disappear anywhere instantly</li>
                  <li>🎯 Strategic gameplay with unpredictable challenges</li>
                </ul>
              </div>
              
              <div className="mt-8">
                <p className="text-gray-400 mb-4">Or continue to the original game:</p>
                <button
                  onClick={() => setShowRoleSelection(true)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Play Classic Battle Royale
                </button>
              </div>
            </div>
          )}

          {gamePhase === GamePhase.LOBBY && showRoleSelection && (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold mb-6">Ready to Enter the Arena?</h2>
              
              {/* Arena Mode Selection */}
              <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto mb-8">
                <h3 className="text-xl font-semibold mb-6">Choose Your Arena</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Virtual Arena */}
                  <button
                    onClick={() => setArenaMode('virtual')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      arenaMode === 'virtual'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Map className={`w-12 h-12 ${
                        arenaMode === 'virtual' ? 'text-cyan-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Virtual Arena</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Practice in a simulated 2D battlefield with virtual coordinates and AI opponents.
                    </p>
                    <div className="text-xs text-left space-y-1 text-gray-500">
                      <div>• No location permissions required</div>
                      <div>• Instant gameplay</div>
                      <div>• Perfect for testing and practice</div>
                    </div>
                  </button>

                  {/* Real World Arena */}
                  <button
                    onClick={() => setArenaMode('real-world')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      arenaMode === 'real-world'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Globe className={`w-12 h-12 ${
                        arenaMode === 'real-world' ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Real World Arena</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Play in the real world using your actual GPS location with advanced privacy protection.
                    </p>
                    <div className="text-xs text-left space-y-1 text-gray-500">
                      <div>• Uses your real GPS location</div>
                      <div>• Zero-knowledge location proofs</div>
                      <div>• Ultimate privacy protection</div>
                    </div>
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 mr-4"
              >
                Start {arenaMode === 'virtual' ? 'Virtual' : 'Real World'} Game
              </button>
              <button
                onClick={() => setShowRoleSelection(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200"
              >
                Back
              </button>
            </div>
          )}

          {gamePhase === GamePhase.PREPARATION && (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold mb-6">Preparing Arena...</h2>
              <div className="w-64 h-4 bg-gray-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-400 mt-4">Initializing ZK proof system</p>
            </div>
          )}

          {gamePhase === GamePhase.ACTIVE && (
            <>
              {arenaMode === 'virtual' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Game Stats */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Players Alive:</span>
                        <span className="font-semibold">{playerCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Arena Mode:</span>
                        <span className="font-semibold text-cyan-400">Virtual</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ZK Status:</span>
                        <span className={`font-semibold ${
                          zkStatus === ZKProofStatus.VALID ? 'text-green-400' : 
                          zkStatus === ZKProofStatus.GENERATING ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {zkStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Position:</span>
                        <span className="font-semibold text-sm">
                          ({Math.round(currentPlayer.position.x)}, {Math.round(currentPlayer.position.y)})
                        </span>
                      </div>
                      {_realWorldLocation && (
                        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <div className="text-xs text-purple-300 mb-1">Real Location:</div>
                          <div className="text-xs font-mono text-purple-200">
                            {_realWorldLocation.latitude.toFixed(6)}, {_realWorldLocation.longitude.toFixed(6)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Virtual Game Map */}
                  <div className="lg:col-span-3">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Virtual Arena Map</h3>
                      <div className="relative">
                        <GameMap
                          players={[currentPlayer]}
                          arenaBounds={{ minX: 0, maxX: 1000, minY: 0, maxY: 1000 }}
                          onMapClick={handlePlayerMove}
                          className="w-full h-96 border border-gray-600 rounded"
                        />
                        <ArenaZone
                          zones={[{
                            id: 'safe-zone',
                            name: 'Safe Zone',
                            coordinates: { x: 200, y: 200, width: 600, height: 600 },
                            type: 'safe'
                          }]}
                          width={1000}
                          height={1000}
                          className="absolute inset-0 pointer-events-none"
                        />
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        Click on the virtual map to move your player. ZK proofs simulate location verification.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-screen">
                  <RealWorldArena
                    gamePhase={gamePhase}
                    onLocationUpdate={_handleLocationUpdate}
                    onZKProofGenerated={_handleZKProofGenerated}
                    className="h-full"
                  />
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-8">
          <div className="max-w-7xl mx-auto text-center text-gray-400">
            <p>ZK Shroud Arena - Powered by Zero-Knowledge Cryptography</p>
            <p className="text-sm">Built for ZKHack 2025</p>
          </div>
        </footer>
      </div>
    </GameContextProvider>
  );
}