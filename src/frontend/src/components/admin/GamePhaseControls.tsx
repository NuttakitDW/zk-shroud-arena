'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import { GamePhase } from '../../types/gameState';
import { phaseManager, PhasePermissions } from '../../services/phaseManager';

export interface GamePhaseControlsProps {
  isAdmin?: boolean;
  className?: string;
  showPermissions?: boolean;
  onPhaseChange?: (newPhase: GamePhase) => void;
}

export const GamePhaseControls: React.FC<GamePhaseControlsProps> = ({
  isAdmin = true,
  className = '',
  showPermissions = true,
  onPhaseChange
}) => {
  const { state: gameState, actions } = useGameContext();
  const [currentPermissions, setCurrentPermissions] = useState<PhasePermissions>(phaseManager.getPhasePermissions());
  const [transitionHistory, setTransitionHistory] = useState(phaseManager.getTransitionHistory());
  const [showHistory, setShowHistory] = useState(false);

  // Update phase manager when game context phase changes
  useEffect(() => {
    phaseManager.setPhase(gameState.gamePhase.phase, 'auto');
  }, [gameState.gamePhase.phase]);

  // Listen for phase changes
  useEffect(() => {
    const listenerId = 'game-phase-controls';
    phaseManager.addPhaseListener(listenerId, (phase) => {
      setCurrentPermissions(phaseManager.getPhasePermissions());
      setTransitionHistory(phaseManager.getTransitionHistory());
    });

    return () => {
      phaseManager.removePhaseListener(listenerId);
    };
  }, []);

  const handlePhaseChange = useCallback((newPhase: GamePhase) => {
    if (!isAdmin) return;
    
    // Update both game context and phase manager
    actions.updateGamePhase(newPhase);
    phaseManager.setPhase(newPhase, 'admin', 'Manual phase change by admin');
    
    if (onPhaseChange) {
      onPhaseChange(newPhase);
    }
  }, [isAdmin, actions, onPhaseChange]);

  const togglePermission = useCallback((permission: keyof PhasePermissions) => {
    if (!isAdmin) return;
    
    const currentValue = currentPermissions[permission];
    phaseManager.setPermissionOverride(permission, !currentValue);
    setCurrentPermissions(phaseManager.getPhasePermissions());
  }, [isAdmin, currentPermissions]);

  const clearOverrides = useCallback(() => {
    if (!isAdmin) return;
    
    phaseManager.clearPermissionOverrides();
    setCurrentPermissions(phaseManager.getPhasePermissions());
  }, [isAdmin]);

  const phaseButtons = [
    { phase: GamePhase.LOBBY, label: 'Lobby', color: 'bg-gray-600 hover:bg-gray-700' },
    { phase: GamePhase.PREPARATION, label: 'Preparation', color: 'bg-blue-600 hover:bg-blue-700' },
    { phase: GamePhase.ACTIVE, label: 'Active', color: 'bg-green-600 hover:bg-green-700' },
    { phase: GamePhase.ZONE_SHRINKING, label: 'Shrinking', color: 'bg-yellow-600 hover:bg-yellow-700' },
    { phase: GamePhase.FINAL_ZONE, label: 'Final Zone', color: 'bg-orange-600 hover:bg-orange-700' },
    { phase: GamePhase.GAME_OVER, label: 'Game Over', color: 'bg-red-600 hover:bg-red-700' }
  ];

  const permissionLabels: Record<keyof PhasePermissions, string> = {
    canGenerateProofs: 'Generate Proofs',
    canVerifyProofs: 'Verify Proofs',
    canMakeAPIRequests: 'API Requests',
    canJoinGame: 'Join Game',
    canMovePlayer: 'Move Player',
    canAccessInventory: 'Access Inventory',
    canChat: 'Chat'
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-4 border-2 border-purple-600 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Game Phase Controls</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Admin Mode</span>
          <div className={`w-3 h-3 rounded-full ${isAdmin ? 'bg-green-400' : 'bg-gray-400'}`}></div>
        </div>
      </div>

      {/* Current Phase Display */}
      <div className="bg-gray-800 rounded p-3 mb-4">
        <div className="text-sm text-gray-400 mb-1">Current Phase</div>
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            {gameState.gamePhase.phase.toUpperCase()}
          </div>
          <div className="text-sm text-gray-400">
            {phaseManager.getPhaseDescription()}
          </div>
        </div>
        {gameState.gamePhase.timer.isRunning && (
          <div className="mt-2 text-sm text-gray-400">
            Time Remaining: {Math.ceil(gameState.gamePhase.timer.remainingTime / 1000)}s
          </div>
        )}
      </div>

      {/* Phase Controls */}
      {isAdmin && (
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Change Phase</div>
          <div className="grid grid-cols-3 gap-2">
            {phaseButtons.map(({ phase, label, color }) => (
              <button
                key={phase}
                onClick={() => handlePhaseChange(phase)}
                disabled={phase === gameState.gamePhase.phase}
                className={`px-3 py-2 text-white text-sm rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  phase === gameState.gamePhase.phase ? 'ring-2 ring-white' : ''
                } ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Display */}
      {showPermissions && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Permissions</span>
            {isAdmin && (
              <button
                onClick={clearOverrides}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Clear Overrides
              </button>
            )}
          </div>
          <div className="space-y-1">
            {(Object.entries(currentPermissions) as [keyof PhasePermissions, boolean][]).map(
              ([permission, value]) => (
                <div
                  key={permission}
                  className="flex items-center justify-between bg-gray-800 rounded px-2 py-1"
                >
                  <span className="text-sm text-gray-300">
                    {permissionLabels[permission]}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      value ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    {isAdmin && (
                      <button
                        onClick={() => togglePermission(permission)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Toggle
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* API Status Indicator */}
      <div className="bg-gray-800 rounded p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">API Status</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              currentPermissions.canMakeAPIRequests ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentPermissions.canMakeAPIRequests ? 'Enabled' : 'Disabled'}
            </span>
            <div className={`w-3 h-3 rounded-full ${
              currentPermissions.canMakeAPIRequests ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentPermissions.canMakeAPIRequests
            ? 'API requests are allowed in this phase'
            : 'API requests are blocked to prevent spamming'}
        </div>
      </div>

      {/* Phase History */}
      <div className="mt-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-gray-300"
        >
          <span>Phase History ({transitionHistory.length})</span>
          <span className="text-xs">{showHistory ? '▼' : '▶'}</span>
        </button>
        
        {showHistory && transitionHistory.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto bg-gray-800 rounded p-2 space-y-1">
            {transitionHistory.slice(-10).reverse().map((transition, index) => (
              <div key={index} className="text-xs text-gray-400">
                <span className="text-gray-500">{formatTimestamp(transition.timestamp)}</span>
                {' '}
                <span className="text-gray-300">
                  {transition.from} → {transition.to}
                </span>
                {' '}
                <span className="text-gray-500">({transition.triggeredBy})</span>
                {transition.reason && (
                  <div className="text-gray-600 ml-4">{transition.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Message */}
      {!currentPermissions.canMakeAPIRequests && (
        <div className="mt-4 bg-red-900 bg-opacity-50 border border-red-700 rounded p-3">
          <div className="text-red-200 text-sm">
            <div className="font-medium mb-1">API Requests Disabled</div>
            <div className="text-xs">
              The game is currently in {gameState.gamePhase.phase} phase. 
              API requests are disabled to prevent server overload. 
              {isAdmin && 'Use admin controls to change the phase.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePhaseControls;