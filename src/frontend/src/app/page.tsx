"use client";

import React, { useState, useEffect } from 'react';
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

export default function ZKShroudArena() {
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [zkStatus, setZkStatus] = useState<ZKProofStatus>(ZKProofStatus.NONE);
  const [playerCount] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: 'player-1',
    position: { x: 500, y: 500 },
    status: 'active',
    isCurrentPlayer: true,
  });

  // Check backend connection
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8080/health');
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
          {gamePhase === GamePhase.LOBBY && (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold mb-6">Ready to Enter the Arena?</h2>
              <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto mb-8">
                <h3 className="text-xl font-semibold mb-4">Game Features:</h3>
                <ul className="text-left space-y-2 text-gray-300">
                  <li>🎯 Battle royale with shrinking safe zones</li>
                  <li>🔐 Zero-knowledge location proofs for privacy</li>
                  <li>🗺️ Interactive map with real-time updates</li>
                  <li>⚔️ Stealth gameplay mechanics</li>
                  <li>🏆 Last player standing wins</li>
                </ul>
              </div>
              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105"
              >
                Start Game
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
                    <span className="text-gray-400">Game Phase:</span>
                    <span className="font-semibold capitalize">{gamePhase}</span>
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
                </div>
              </div>

              {/* Game Map */}
              <div className="lg:col-span-3">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Arena Map</h3>
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
                    Click on the map to move your player. ZK proofs will be generated to verify your position.
                  </p>
                </div>
              </div>
            </div>
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