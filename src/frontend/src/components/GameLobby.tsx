'use client';

import React from 'react';
import { Users, Play, Clock, Shield, Zap, Target } from 'lucide-react';

interface GameLobbyProps {
  playerCount: number;
  maxPlayers: number;
  onStartGame: () => void;
  isReady: boolean;
}

/**
 * GameLobby - Pre-game lobby interface
 */
export const GameLobby: React.FC<GameLobbyProps> = ({
  playerCount,
  maxPlayers,
  onStartGame,
  isReady
}) => {
  const fillPercentage = (playerCount / maxPlayers) * 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Lobby Card */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              ZK Shroud Arena
            </h1>
            <p className="text-xl text-gray-400">
              Tactical Stealth Battle Royale
            </p>
          </div>

          {/* Player Count */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {playerCount}/{maxPlayers}
              </span>
              <span className="text-gray-400">Players</span>
            </div>
            
            {/* Player Count Progress Bar */}
            <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-400">
              {isReady 
                ? 'Ready to start! Waiting for more players or host to begin.'
                : `Need ${Math.max(2, playerCount)} more players to start`}
            </p>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600">
              <Shield className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">ZK Stealth</h3>
              <p className="text-sm text-gray-400">
                Use zero-knowledge proofs to hide your movements from enemies
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600">
              <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Real-time</h3>
              <p className="text-sm text-gray-400">
                Fast-paced tactical combat with instant feedback
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600">
              <Target className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Battle Royale</h3>
              <p className="text-sm text-gray-400">
                Survive the shrinking arena and be the last one standing
              </p>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-gray-900/30 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Game Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Movement & Combat</h4>
                <ul className="space-y-1">
                  <li>• Click on the map to move your character</li>
                  <li>• Stay within the safe zone to avoid damage</li>
                  <li>• Use ZK proofs to conceal your location</li>
                  <li>• Eliminate opponents to win</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-400 mb-2">Zone Mechanics</h4>
                <ul className="space-y-1">
                  <li>• The safe zone shrinks over time</li>
                  <li>• Being outside deals continuous damage</li>
                  <li>• Plan your movements strategically</li>
                  <li>• Last player alive wins the match</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <div className="space-y-4">
            <button
              onClick={onStartGame}
              disabled={!isReady}
              className={`
                w-full md:w-auto px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3
                ${isReady 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Play className="h-5 w-5" />
              <span>{isReady ? 'Start Game' : 'Waiting for Players'}</span>
            </button>

            {!isReady && (
              <p className="text-xs text-gray-500">
                Game will start automatically when enough players join
              </p>
            )}
          </div>

          {/* Status Indicators */}
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-400">Server Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">Waiting for players</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Pro tip: Generate ZK proofs early to establish strategic positions</p>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;