/**
 * Zone Sync Status Component
 * Displays real-time synchronization status for zones
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ZoneSyncState, ZoneConflict } from '../services/zoneSyncManager';

export interface ZoneSyncStatusProps {
  zoneId: string;
  syncState?: ZoneSyncState;
  conflicts?: ZoneConflict[];
  showDetails?: boolean;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ZoneSyncStatus: React.FC<ZoneSyncStatusProps> = ({
  zoneId,
  syncState,
  conflicts = [],
  showDetails = false,
  className = '',
  position = 'top-right'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Trigger animation on status change
  useEffect(() => {
    if (syncState?.syncStatus) {
      setAnimationClass('animate-pulse');
      const timer = setTimeout(() => setAnimationClass(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [syncState?.syncStatus]);

  if (!syncState) {
    return null;
  }

  // Status configurations
  const statusConfig = {
    synced: {
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      icon: '✓',
      label: 'Synced',
      pulseColor: 'bg-green-400'
    },
    syncing: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      icon: '↻',
      label: 'Syncing',
      pulseColor: 'bg-yellow-400'
    },
    conflict: {
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      icon: '⚠',
      label: 'Conflict',
      pulseColor: 'bg-red-400'
    },
    disconnected: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500',
      icon: '✕',
      label: 'Disconnected',
      pulseColor: 'bg-gray-400'
    }
  };

  const config = statusConfig[syncState.syncStatus];
  const pendingCount = syncState.pendingChanges.length;
  const recentConflicts = conflicts.slice(-3);

  // Position classes
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div 
      className={`absolute ${positionClasses[position]} z-10 ${className}`}
    >
      {/* Main Status Indicator */}
      <div 
        className={`
          bg-gray-900 bg-opacity-90 text-white rounded-lg shadow-lg
          transition-all duration-300 ${animationClass}
          ${isExpanded ? 'w-64' : 'w-auto'}
        `}
      >
        {/* Status Header */}
        <div 
          className="flex items-center gap-2 p-2 cursor-pointer select-none"
          onClick={() => showDetails && setIsExpanded(!isExpanded)}
        >
          {/* Status Icon with Animation */}
          <div className="relative">
            <div className={`w-3 h-3 ${config.bgColor} rounded-full`}>
              {syncState.syncStatus === 'syncing' && (
                <div className={`absolute inset-0 ${config.pulseColor} rounded-full animate-ping`} />
              )}
            </div>
            <span className={`absolute -top-1 -right-1 text-xs ${config.color} font-bold`}>
              {config.icon}
            </span>
          </div>

          {/* Status Label */}
          <span className={`text-xs font-semibold ${config.color}`}>
            {config.label}
          </span>

          {/* Pending Changes Badge */}
          {pendingCount > 0 && (
            <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}

          {/* Expand/Collapse Indicator */}
          {showDetails && (
            <span className={`ml-1 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && showDetails && (
          <div className="border-t border-gray-700 p-2 space-y-2 text-xs">
            {/* Zone Information */}
            <div className="flex justify-between">
              <span className="text-gray-400">Zone ID:</span>
              <span className="font-mono">{zoneId.slice(0, 8)}...</span>
            </div>

            {/* Sync Times */}
            <div className="flex justify-between">
              <span className="text-gray-400">Last Sync:</span>
              <span>{formatTime(syncState.lastSyncTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Server Update:</span>
              <span>{formatTime(syncState.lastServerUpdate)}</span>
            </div>

            {/* Pending Changes */}
            {pendingCount > 0 && (
              <div className="mt-2">
                <div className="text-gray-400 mb-1">Pending Changes:</div>
                <div className="space-y-1">
                  {syncState.pendingChanges.slice(-3).map((change, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      <span className="text-blue-400">•</span>
                      <span className="text-gray-300">
                        +{change.added.length} -{change.removed.length} ~{change.modified.length}
                      </span>
                      <span className="text-gray-500 ml-auto">
                        {formatTime(change.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflicts */}
            {recentConflicts.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400 mb-1">Recent Conflicts:</div>
                <div className="space-y-1">
                  {recentConflicts.map((conflict, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      <span className="text-red-400">⚠</span>
                      <span className="text-gray-300">
                        {conflict.resolution}
                      </span>
                      <span className="text-gray-500 ml-auto">
                        {formatTime(conflict.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict Count */}
            {syncState.conflictCount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Conflicts:</span>
                <span className="text-red-400">{syncState.conflictCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Status Pills */}
      {!isExpanded && (
        <div className="flex gap-1 mt-1">
          {/* Pending Changes Pill */}
          {pendingCount > 0 && (
            <div className="bg-blue-500 bg-opacity-20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </div>
          )}

          {/* Conflict Warning Pill */}
          {syncState.conflictCount > 0 && (
            <div className="bg-red-500 bg-opacity-20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {syncState.conflictCount} conflicts
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Minimal Status Indicator Component
export interface ZoneSyncIndicatorProps {
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'disconnected';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ZoneSyncIndicator: React.FC<ZoneSyncIndicatorProps> = ({
  syncStatus,
  size = 'sm',
  showLabel = false,
  className = ''
}) => {
  const sizeConfig = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusConfig = {
    synced: { color: 'bg-green-500', label: 'Synced' },
    syncing: { color: 'bg-yellow-500', label: 'Syncing' },
    conflict: { color: 'bg-red-500', label: 'Conflict' },
    disconnected: { color: 'bg-gray-500', label: 'Offline' }
  };

  const config = statusConfig[syncStatus];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`${sizeConfig[size]} ${config.color} rounded-full relative`}>
        {syncStatus === 'syncing' && (
          <div className={`absolute inset-0 ${config.color} rounded-full animate-ping`} />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400">{config.label}</span>
      )}
    </div>
  );
};

export default ZoneSyncStatus;