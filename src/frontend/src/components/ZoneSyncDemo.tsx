/**
 * Zone Sync Demo Component
 * Demonstrates real-time zone synchronization for Game Managers
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useZoneSync } from '../hooks/useZoneSync';
import { useGameContext } from '../contexts/GameContext';
import { ZoneSyncStatus, ZoneSyncIndicator } from './ZoneSyncStatus';
import { SafeZone } from '../types/gameState';

export const ZoneSyncDemo: React.FC = () => {
  const { state: gameState } = useGameContext();
  const {
    currentZoneSyncState,
    conflicts,
    updateZone,
    getSyncStatus,
    getPendingChangesCount,
    getLatencyCompensation,
    clearConflicts,
    isConnected,
    connectionLatency
  } = useZoneSync({
    config: {
      enableOptimisticUpdates: true,
      conflictResolutionMode: 'server-wins',
      debug: true
    }
  });

  const [selectedZone, setSelectedZone] = useState<string>(gameState.arenaState.currentZone.id);
  const [radiusAdjustment, setRadiusAdjustment] = useState<number>(0);
  const [centerOffsetX, setCenterOffsetX] = useState<number>(0);
  const [centerOffsetY, setCenterOffsetY] = useState<number>(0);

  // Handle zone radius change
  const handleRadiusChange = useCallback(() => {
    if (!selectedZone) return;
    
    const currentZone = gameState.arenaState.currentZone;
    const newRadius = Math.max(50, currentZone.radius + radiusAdjustment);
    
    updateZone(selectedZone, {
      radius: newRadius
    });
    
    setRadiusAdjustment(0);
  }, [selectedZone, radiusAdjustment, gameState.arenaState.currentZone, updateZone]);

  // Handle zone center change
  const handleCenterChange = useCallback(() => {
    if (!selectedZone) return;
    
    const currentZone = gameState.arenaState.currentZone;
    
    updateZone(selectedZone, {
      center: {
        x: currentZone.center.x + centerOffsetX,
        y: currentZone.center.y + centerOffsetY
      }
    });
    
    setCenterOffsetX(0);
    setCenterOffsetY(0);
  }, [selectedZone, centerOffsetX, centerOffsetY, gameState.arenaState.currentZone, updateZone]);

  // Quick zone actions for testing
  const quickActions = [
    { label: 'Shrink 20%', action: () => setRadiusAdjustment(-gameState.arenaState.currentZone.radius * 0.2) },
    { label: 'Expand 20%', action: () => setRadiusAdjustment(gameState.arenaState.currentZone.radius * 0.2) },
    { label: 'Move North', action: () => setCenterOffsetY(-50) },
    { label: 'Move South', action: () => setCenterOffsetY(50) },
    { label: 'Move East', action: () => setCenterOffsetX(50) },
    { label: 'Move West', action: () => setCenterOffsetX(-50) }
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Zone Sync Manager</h2>
        <div className="flex items-center gap-4">
          <ZoneSyncIndicator 
            syncStatus={getSyncStatus(selectedZone) || 'disconnected'}
            size="md"
            showLabel={true}
          />
          <div className="text-sm text-gray-400">
            Latency: {connectionLatency}ms
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white">
              WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {getLatencyCompensation() > 0 && (
            <span className="text-sm text-gray-400">
              Compensation: {getLatencyCompensation().toFixed(0)}ms
            </span>
          )}
        </div>
      </div>

      {/* Current Zone Info */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-2">
        <h3 className="text-lg font-semibold text-white mb-2">Current Zone</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Zone ID:</span>
            <span className="text-white ml-2 font-mono">{selectedZone}</span>
          </div>
          <div>
            <span className="text-gray-400">Radius:</span>
            <span className="text-white ml-2">{gameState.arenaState.currentZone.radius}m</span>
          </div>
          <div>
            <span className="text-gray-400">Center X:</span>
            <span className="text-white ml-2">{gameState.arenaState.currentZone.center.x}</span>
          </div>
          <div>
            <span className="text-gray-400">Center Y:</span>
            <span className="text-white ml-2">{gameState.arenaState.currentZone.center.y}</span>
          </div>
        </div>
      </div>

      {/* Zone Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Zone Controls</h3>
        
        {/* Radius Adjustment */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <label className="text-sm text-gray-400">Radius Adjustment</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-200"
              max="200"
              value={radiusAdjustment}
              onChange={(e) => setRadiusAdjustment(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white w-16 text-right">{radiusAdjustment > 0 ? '+' : ''}{radiusAdjustment}</span>
            <button
              onClick={handleRadiusChange}
              disabled={radiusAdjustment === 0}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Center Position */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <label className="text-sm text-gray-400">Center Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">X Offset</label>
              <input
                type="number"
                value={centerOffsetX}
                onChange={(e) => setCenterOffsetX(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-700 text-white rounded"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Y Offset</label>
              <input
                type="number"
                value={centerOffsetY}
                onChange={(e) => setCenterOffsetY(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-700 text-white rounded"
              />
            </div>
          </div>
          <button
            onClick={handleCenterChange}
            disabled={centerOffsetX === 0 && centerOffsetY === 0}
            className="w-full px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move Zone
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <label className="text-sm text-gray-400">Quick Actions</label>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  action.action();
                  if (action.label.includes('Shrink') || action.label.includes('Expand')) {
                    setTimeout(handleRadiusChange, 100);
                  } else {
                    setTimeout(handleCenterChange, 100);
                  }
                }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-2">
        <h3 className="text-lg font-semibold text-white mb-2">Sync Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Pending Changes:</span>
            <span className="text-white ml-2">{getPendingChangesCount(selectedZone)}</span>
          </div>
          <div>
            <span className="text-gray-400">Total Conflicts:</span>
            <span className="text-white ml-2">{conflicts.length}</span>
          </div>
        </div>
        {conflicts.length > 0 && (
          <button
            onClick={clearConflicts}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Clear Conflict History
          </button>
        )}
      </div>

      {/* Zone Sync Status Widget */}
      <div className="relative h-32 bg-gray-800 rounded-lg">
        <ZoneSyncStatus
          zoneId={selectedZone}
          syncState={currentZoneSyncState}
          conflicts={conflicts}
          showDetails={true}
          position="top-right"
        />
      </div>
    </div>
  );
};

export default ZoneSyncDemo;