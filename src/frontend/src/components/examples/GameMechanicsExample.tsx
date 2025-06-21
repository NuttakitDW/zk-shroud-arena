'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedGameHUD } from '../game/EnhancedGameHUD';
import { GameEngine } from '../game/GameEngine';
import { GameContextProvider, useGameContext } from '../../contexts/GameContext';
// import { Button } from '../ui/Button'; // Button component not yet created
import { GamePhase } from '../../types/gameState';

/**
 * Example component demonstrating the new game mechanics
 */
const GameMechanicsDemo: React.FC = () => {
  const { state, actions } = useGameContext();
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize game engine
    const engine = new GameEngine(
      {
        enableBots: true,
        botCount: 20,
        zoneSettings: {
          initialRadius: 800,
          shrinkInterval: 120000,
          shrinkRate: 0.8,
          damagePerSecond: 10
        }
      },
      (updater) => {
        // Apply state updates from engine
        actions.hydrateState({
          state: updater(state),
          timestamp: Date.now(),
          version: '1.0.0'
        });
      }
    );

    engine.initialize().then(() => {
      setGameEngine(engine);
      setIsInitialized(true);
    });

    return () => {
      engine.stopGame();
    };
  }, []);

  const handleStartGame = () => {
    if (gameEngine) {
      gameEngine.startGame();
      actions.updateGamePhase(GamePhase.PREPARATION);
    }
  };

  const handleMovePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    const moveDistance = 50;
    const currentLocation = state.playerState.location;
    let newX = currentLocation.x;
    let newY = currentLocation.y;

    switch (direction) {
      case 'up':
        newY -= moveDistance;
        break;
      case 'down':
        newY += moveDistance;
        break;
      case 'left':
        newX -= moveDistance;
        break;
      case 'right':
        newX += moveDistance;
        break;
    }

    actions.updatePlayerLocation({
      x: newX,
      y: newY,
      timestamp: Date.now(),
      zone: 'unknown'
    });

    // Move in game engine too
    gameEngine?.movePlayer(state.playerState.id, { x: newX, y: newY });
  };

  const handleEarnCoins = () => {
    // Simulate earning coins
    actions.updatePlayerCoins(state.playerState.coins + 10);
    actions.addWarning('You earned 10 coins!', 'low');
  };

  const handleTakeDamage = () => {
    // Simulate taking damage
    const newHealth = Math.max(0, state.playerState.health - 20);
    actions.updatePlayerHealth(newHealth);
    
    if (newHealth <= 30) {
      actions.addWarning('Critical health! Find safety!', 'critical');
    } else {
      actions.addWarning('You took 20 damage!', 'medium');
    }
  };

  const handleZoneWarning = () => {
    actions.addWarning('Zone is closing in 30 seconds!', 'high');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Enhanced Game HUD */}
      <EnhancedGameHUD />

      {/* Demo Controls */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-32 pb-8">
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Game Mechanics Demo
          </h1>

          {!isInitialized ? (
            <div className="text-center text-gray-400">
              <p>Initializing game engine...</p>
            </div>
          ) : (
            <>
              {/* Game Controls */}
              <div className="space-y-6">
                {/* Start Game */}
                {state.gamePhase.phase === GamePhase.LOBBY && (
                  <div className="text-center">
                    <button onClick={handleStartGame} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Start Game
                    </button>
                  </div>
                )}

                {/* Movement Controls */}
                {state.gamePhase.phase !== GamePhase.LOBBY && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Movement</h3>
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      <div></div>
                      <button onClick={() => handleMovePlayer('up')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">↑</button>
                      <div></div>
                      <button onClick={() => handleMovePlayer('left')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">←</button>
                      <div className="text-center text-gray-500 text-sm">Move</div>
                      <button onClick={() => handleMovePlayer('right')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">→</button>
                      <div></div>
                      <button onClick={() => handleMovePlayer('down')} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">↓</button>
                      <div></div>
                    </div>
                  </div>
                )}

                {/* Test Actions */}
                {state.gamePhase.phase !== GamePhase.LOBBY && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Test Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={handleEarnCoins}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                      >
                        Earn 10 Coins
                      </button>
                      <button 
                        onClick={handleTakeDamage}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Take 20 Damage
                      </button>
                      <button 
                        onClick={handleZoneWarning}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Zone Warning
                      </button>
                      <button 
                        onClick={() => actions.updatePlayerEliminations(state.playerState.eliminations + 1)}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        Add Elimination
                      </button>
                    </div>
                  </div>
                )}

                {/* Game Stats */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Current Stats</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Position:</div>
                    <div className="text-white">
                      X: {Math.round(state.playerState.location.x)}, 
                      Y: {Math.round(state.playerState.location.y)}
                    </div>
                    <div className="text-gray-400">Health:</div>
                    <div className="text-white">{state.playerState.health}/{state.playerState.maxHealth}</div>
                    <div className="text-gray-400">Coins:</div>
                    <div className="text-yellow-400">{state.playerState.coins}</div>
                    <div className="text-gray-400">Eliminations:</div>
                    <div className="text-orange-400">{state.playerState.eliminations}</div>
                    <div className="text-gray-400">Score:</div>
                    <div className="text-purple-400">{state.playerState.score}</div>
                    <div className="text-gray-400">Game Phase:</div>
                    <div className="text-white">{state.gamePhase.phase}</div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
                  <h3 className="text-white font-semibold mb-2">Features Demonstrated:</h3>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Real-time coin earning system (1 coin/sec in safe zone)</li>
                    <li>Zone occupancy bonus (+2 coins/sec after 10 seconds)</li>
                    <li>Final zone multiplier (3x coins)</li>
                    <li>Health and damage system with warnings</li>
                    <li>Elimination tracking and rewards</li>
                    <li>Dynamic warning system with severity levels</li>
                    <li>Sound effects for game events</li>
                    <li>Score calculation based on survival, eliminations, and coins</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component with GameContext
export const GameMechanicsExample: React.FC = () => {
  return (
    <GameContextProvider gameId="mechanics-demo" enablePersistence={false}>
      <GameMechanicsDemo />
    </GameContextProvider>
  );
};

export default GameMechanicsExample;