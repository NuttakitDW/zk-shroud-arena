/**
 * useZoneSync Hook
 * Integrates ZoneSyncManager with GameContext for real-time zone synchronization
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useWebSocket } from './useWebSocket';
import { 
  ZoneSyncManager, 
  ZoneSyncState, 
  ZoneConflict,
  ZoneSyncConfig,
  getZoneSyncManager,
  resetZoneSyncManager
} from '../services/zoneSyncManager';
import { SafeZone } from '../types/gameState';

export interface UseZoneSyncOptions {
  config?: Partial<ZoneSyncConfig>;
  autoInitialize?: boolean;
  onStateChange?: (zoneId: string, state: ZoneSyncState) => void;
  onConflict?: (conflict: ZoneConflict) => void;
}

export interface UseZoneSyncReturn {
  // Zone sync state
  syncStates: Map<string, ZoneSyncState>;
  currentZoneSyncState?: ZoneSyncState;
  conflicts: ZoneConflict[];
  
  // Zone management actions
  initializeZone: (zone: SafeZone) => void;
  updateZone: (zoneId: string, changes: Partial<SafeZone>) => void;
  
  // Sync status
  getSyncStatus: (zoneId: string) => 'synced' | 'syncing' | 'conflict' | 'disconnected' | undefined;
  getPendingChangesCount: (zoneId: string) => number;
  getLatencyCompensation: () => number;
  
  // Manager controls
  clearConflicts: () => void;
  updateConfig: (config: Partial<ZoneSyncConfig>) => void;
  
  // Connection state
  isConnected: boolean;
  connectionLatency: number;
}

export function useZoneSync(options: UseZoneSyncOptions = {}): UseZoneSyncReturn {
  const { 
    config, 
    autoInitialize = true,
    onStateChange,
    onConflict
  } = options;

  const { state: gameState, actions: gameActions } = useGameContext();
  const { connectionInfo, isConnected } = useWebSocket({
    autoConnect: true
  });

  const [syncStates, setSyncStates] = useState<Map<string, ZoneSyncState>>(new Map());
  const [conflicts, setConflicts] = useState<ZoneConflict[]>([]);
  const [currentZoneSyncState, setCurrentZoneSyncState] = useState<ZoneSyncState>();
  
  const zoneSyncManagerRef = useRef<ZoneSyncManager | null>(null);
  const syncStatesRef = useRef<Map<string, ZoneSyncState>>(new Map());

  // Initialize ZoneSyncManager
  useEffect(() => {
    if (!zoneSyncManagerRef.current) {
      const ws = require('../services/websocketService').getWebSocketService();
      
      zoneSyncManagerRef.current = getZoneSyncManager(ws, config, {
        onStateChange: (zoneId: string, state: ZoneSyncState) => {
          // Update local state
          syncStatesRef.current.set(zoneId, state);
          setSyncStates(new Map(syncStatesRef.current));
          
          // Update current zone state if it matches
          if (zoneId === gameState.arenaState.currentZone.id) {
            setCurrentZoneSyncState(state);
          }
          
          // Call user callback
          onStateChange?.(zoneId, state);
        },
        onConflict: (conflict: ZoneConflict) => {
          setConflicts(prev => [...prev, conflict].slice(-10)); // Keep last 10 conflicts
          onConflict?.(conflict);
        }
      });

      // Auto-initialize current zone
      if (autoInitialize && gameState.arenaState.currentZone) {
        zoneSyncManagerRef.current.initializeZone(gameState.arenaState.currentZone);
      }
    }

    return () => {
      if (zoneSyncManagerRef.current) {
        resetZoneSyncManager();
        zoneSyncManagerRef.current = null;
      }
    };
  }, []);

  // Update config when it changes
  useEffect(() => {
    if (zoneSyncManagerRef.current && config) {
      zoneSyncManagerRef.current.updateConfig(config);
    }
  }, [config]);

  // Sync with game state changes
  useEffect(() => {
    const currentZone = gameState.arenaState.currentZone;
    if (currentZone && zoneSyncManagerRef.current) {
      // Check if zone exists in sync manager
      const syncState = zoneSyncManagerRef.current.getSyncState(currentZone.id);
      
      if (!syncState) {
        // New zone detected, initialize it
        zoneSyncManagerRef.current.initializeZone(currentZone);
      } else {
        // Update current zone sync state
        setCurrentZoneSyncState(syncState);
      }
    }
  }, [gameState.arenaState.currentZone]);

  // Initialize zone
  const initializeZone = useCallback((zone: SafeZone) => {
    if (zoneSyncManagerRef.current) {
      zoneSyncManagerRef.current.initializeZone(zone);
    }
  }, []);

  // Update zone with changes
  const updateZone = useCallback((zoneId: string, changes: Partial<SafeZone>) => {
    if (zoneSyncManagerRef.current) {
      zoneSyncManagerRef.current.applyZoneChanges(zoneId, changes);
      
      // Also update game state for immediate UI feedback
      if (zoneId === gameState.arenaState.currentZone.id) {
        gameActions.updateArenaZone({
          ...gameState.arenaState.currentZone,
          ...changes
        });
      }
    }
  }, [gameState.arenaState.currentZone, gameActions]);

  // Get sync status for a zone
  const getSyncStatus = useCallback((zoneId: string) => {
    return zoneSyncManagerRef.current?.getSyncStatus(zoneId);
  }, []);

  // Get pending changes count
  const getPendingChangesCount = useCallback((zoneId: string) => {
    return zoneSyncManagerRef.current?.getPendingChangesCount(zoneId) || 0;
  }, []);

  // Get latency compensation value
  const getLatencyCompensation = useCallback(() => {
    return zoneSyncManagerRef.current?.getLatencyCompensation() || 0;
  }, []);

  // Clear conflict history
  const clearConflicts = useCallback(() => {
    zoneSyncManagerRef.current?.clearConflictHistory();
    setConflicts([]);
  }, []);

  // Update sync configuration
  const updateConfig = useCallback((newConfig: Partial<ZoneSyncConfig>) => {
    zoneSyncManagerRef.current?.updateConfig(newConfig);
  }, []);

  return {
    // Zone sync state
    syncStates,
    currentZoneSyncState,
    conflicts,
    
    // Zone management actions
    initializeZone,
    updateZone,
    
    // Sync status
    getSyncStatus,
    getPendingChangesCount,
    getLatencyCompensation,
    
    // Manager controls
    clearConflicts,
    updateConfig,
    
    // Connection state
    isConnected,
    connectionLatency: connectionInfo.latency
  };
}

// Context provider for zone sync (optional, for global access)
import React, { createContext, useContext } from 'react';

const ZoneSyncContext = createContext<UseZoneSyncReturn | null>(null);

export interface ZoneSyncProviderProps {
  children: React.ReactNode;
  options?: UseZoneSyncOptions;
}

export const ZoneSyncProvider: React.FC<ZoneSyncProviderProps> = ({ children, options }) => {
  const zoneSync = useZoneSync(options);

  return (
    <ZoneSyncContext.Provider value={zoneSync}>
      {children}
    </ZoneSyncContext.Provider>
  );
};

export const useZoneSyncContext = (): UseZoneSyncReturn => {
  const context = useContext(ZoneSyncContext);
  if (!context) {
    throw new Error('useZoneSyncContext must be used within a ZoneSyncProvider');
  }
  return context;
};