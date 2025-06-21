/**
 * Zone Sync Manager for ZK Shroud Arena
 * Handles real-time synchronization of zone updates between Game Managers and Players
 * Provides efficient diff-based updates, conflict resolution, and latency compensation
 */

import { WebSocketService } from './websocketService';
import { 
  WebSocketMessageType,
  ArenaZoneUpdateMessage 
} from '../types/websocket';
import { SafeZone } from '../types/gameState';

// Zone sync specific message types
export interface ZoneDiff {
  added: string[];      // H3 indices added to zone
  removed: string[];    // H3 indices removed from zone
  modified: string[];   // H3 indices with changed properties
  timestamp: number;
  source: 'manager' | 'server' | 'player';
}

export interface ZoneSyncState {
  currentZone: SafeZone;
  pendingChanges: ZoneDiff[];
  lastSyncTime: number;
  lastServerUpdate: number;
  conflictCount: number;
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'disconnected';
}

export interface ZoneConflict {
  localChange: ZoneDiff;
  serverChange: ZoneDiff;
  resolution: 'local' | 'server' | 'merge';
  timestamp: number;
}

export interface ZoneSyncConfig {
  enableOptimisticUpdates: boolean;
  conflictResolutionMode: 'server-wins' | 'client-wins' | 'merge';
  syncInterval: number; // ms between sync checks
  maxPendingChanges: number;
  diffBatchSize: number; // max diffs to send in one message
  latencyCompensation: boolean;
  debug: boolean;
}

const DEFAULT_ZONE_SYNC_CONFIG: ZoneSyncConfig = {
  enableOptimisticUpdates: true,
  conflictResolutionMode: 'server-wins',
  syncInterval: 100, // 100ms
  maxPendingChanges: 50,
  diffBatchSize: 20,
  latencyCompensation: true,
  debug: false
};

export class ZoneSyncManager {
  private ws: WebSocketService;
  private config: ZoneSyncConfig;
  private syncState: Map<string, ZoneSyncState> = new Map(); // Zone ID -> Sync State
  private syncTimer: NodeJS.Timeout | null = null;
  private conflictHistory: ZoneConflict[] = [];
  private optimisticUpdates: Map<string, ZoneDiff> = new Map(); // Pending optimistic updates
  private latencyBuffer: number = 0;
  private onStateChange?: (zoneId: string, state: ZoneSyncState) => void;
  private onConflict?: (conflict: ZoneConflict) => void;

  constructor(
    webSocketService: WebSocketService,
    config: Partial<ZoneSyncConfig> = {},
    callbacks?: {
      onStateChange?: (zoneId: string, state: ZoneSyncState) => void;
      onConflict?: (conflict: ZoneConflict) => void;
    }
  ) {
    this.ws = webSocketService;
    this.config = { ...DEFAULT_ZONE_SYNC_CONFIG, ...config };
    this.onStateChange = callbacks?.onStateChange;
    this.onConflict = callbacks?.onConflict;
    
    this.setupWebSocketHandlers();
    this.startSyncTimer();
  }

  // Initialize zone sync for a specific zone
  public initializeZone(zone: SafeZone): void {
    const state: ZoneSyncState = {
      currentZone: zone,
      pendingChanges: [],
      lastSyncTime: Date.now(),
      lastServerUpdate: Date.now(),
      conflictCount: 0,
      syncStatus: 'synced'
    };
    
    this.syncState.set(zone.id, state);
    this.notifyStateChange(zone.id);
    
    if (this.config.debug) {
      console.log(`[ZoneSyncManager] Initialized zone: ${zone.id}`);
    }
  }

  // Apply zone changes with optimistic updates
  public applyZoneChanges(zoneId: string, changes: Partial<SafeZone>): void {
    const state = this.syncState.get(zoneId);
    if (!state) {
      console.warn(`[ZoneSyncManager] Zone ${zoneId} not initialized`);
      return;
    }

    // Generate diff from changes
    const diff = this.generateDiff(state.currentZone, changes);
    
    if (this.config.enableOptimisticUpdates) {
      // Apply changes optimistically
      this.applyOptimisticUpdate(zoneId, diff);
      
      // Queue for server sync
      state.pendingChanges.push(diff);
      this.trimPendingChanges(state);
    }

    // Send update to server
    this.sendZoneUpdate(zoneId, diff);
    
    state.syncStatus = 'syncing';
    this.notifyStateChange(zoneId);
  }

  // Handle incoming server updates
  private handleServerZoneUpdate(update: ArenaZoneUpdateMessage): void {
    const zoneId = update.currentZone.id;
    const state = this.syncState.get(zoneId);
    
    if (!state) {
      // New zone from server
      this.initializeZone(update.currentZone);
      return;
    }

    state.lastServerUpdate = Date.now();
    
    // Check for conflicts with pending changes
    if (state.pendingChanges.length > 0) {
      const conflicts = this.detectConflicts(state, update.currentZone);
      
      if (conflicts.length > 0) {
        this.resolveConflicts(zoneId, conflicts, update.currentZone);
      } else {
        // No conflicts, apply server update
        this.applyServerUpdate(zoneId, update.currentZone);
      }
    } else {
      // No pending changes, direct apply
      this.applyServerUpdate(zoneId, update.currentZone);
    }
  }

  // Detect conflicts between local and server state
  private detectConflicts(state: ZoneSyncState, serverZone: SafeZone): ZoneConflict[] {
    const conflicts: ZoneConflict[] = [];
    
    for (const pendingChange of state.pendingChanges) {
      // Simple conflict detection based on overlapping changes
      // In a real implementation, this would be more sophisticated
      const serverDiff = this.generateDiff(state.currentZone, { ...serverZone });
      
      const hasConflict = 
        pendingChange.modified.some(h3 => serverDiff.modified.includes(h3)) ||
        (pendingChange.added.some(h3 => serverDiff.removed.includes(h3))) ||
        (pendingChange.removed.some(h3 => serverDiff.added.includes(h3)));
      
      if (hasConflict) {
        conflicts.push({
          localChange: pendingChange,
          serverChange: serverDiff,
          resolution: this.config.conflictResolutionMode === 'server-wins' ? 'server' : 'local',
          timestamp: Date.now()
        });
      }
    }
    
    return conflicts;
  }

  // Resolve conflicts based on configuration
  private resolveConflicts(zoneId: string, conflicts: ZoneConflict[], serverZone: SafeZone): void {
    const state = this.syncState.get(zoneId)!;
    state.conflictCount += conflicts.length;
    
    for (const conflict of conflicts) {
      this.conflictHistory.push(conflict);
      this.onConflict?.(conflict);
      
      switch (conflict.resolution) {
        case 'server':
          // Server wins: discard local changes
          this.rollbackOptimisticUpdates(zoneId);
          this.applyServerUpdate(zoneId, serverZone);
          break;
          
        case 'local':
          // Client wins: re-apply local changes
          this.reapplyLocalChanges(zoneId);
          break;
          
        case 'merge':
          // Merge: combine changes intelligently
          this.mergeChanges(zoneId, serverZone, conflict);
          break;
      }
    }
    
    if (this.config.debug) {
      console.log(`[ZoneSyncManager] Resolved ${conflicts.length} conflicts for zone ${zoneId}`);
    }
  }

  // Apply server update to local state
  private applyServerUpdate(zoneId: string, serverZone: SafeZone): void {
    const state = this.syncState.get(zoneId)!;
    
    state.currentZone = serverZone;
    state.pendingChanges = [];
    state.syncStatus = 'synced';
    state.lastSyncTime = Date.now();
    
    this.optimisticUpdates.delete(zoneId);
    this.notifyStateChange(zoneId);
  }

  // Apply optimistic update locally
  private applyOptimisticUpdate(zoneId: string, diff: ZoneDiff): void {
    const state = this.syncState.get(zoneId)!;
    
    // Store optimistic update
    this.optimisticUpdates.set(zoneId, diff);
    
    // Apply diff to current zone (simplified - in real implementation would modify H3 indices)
    // For now, we'll just mark the state as having optimistic updates
    state.syncStatus = 'syncing';
    
    if (this.config.debug) {
      console.log(`[ZoneSyncManager] Applied optimistic update to zone ${zoneId}`);
    }
  }

  // Rollback optimistic updates
  private rollbackOptimisticUpdates(zoneId: string): void {
    this.optimisticUpdates.delete(zoneId);
    
    if (this.config.debug) {
      console.log(`[ZoneSyncManager] Rolled back optimistic updates for zone ${zoneId}`);
    }
  }

  // Re-apply local changes after conflict
  private reapplyLocalChanges(zoneId: string): void {
    const state = this.syncState.get(zoneId)!;
    const optimisticUpdate = this.optimisticUpdates.get(zoneId);
    
    if (optimisticUpdate) {
      // Re-send the update to server
      this.sendZoneUpdate(zoneId, optimisticUpdate);
    }
  }

  // Merge conflicting changes
  private mergeChanges(zoneId: string, serverZone: SafeZone, conflict: ZoneConflict): void {
    // Implement intelligent merge logic
    // For now, we'll just take server changes and re-apply non-conflicting local changes
    const state = this.syncState.get(zoneId)!;
    
    state.currentZone = serverZone;
    
    // Re-apply non-conflicting local changes
    const nonConflictingAdded = conflict.localChange.added.filter(
      h3 => !conflict.serverChange.removed.includes(h3)
    );
    
    if (nonConflictingAdded.length > 0) {
      const mergeDiff: ZoneDiff = {
        added: nonConflictingAdded,
        removed: [],
        modified: [],
        timestamp: Date.now(),
        source: 'manager'
      };
      
      this.sendZoneUpdate(zoneId, mergeDiff);
    }
  }

  // Generate diff between two zone states
  private generateDiff(oldZone: SafeZone, changes: Partial<SafeZone>): ZoneDiff {
    // Simplified diff generation
    // In real implementation, would compare H3 indices
    const diff: ZoneDiff = {
      added: [],
      removed: [],
      modified: [],
      timestamp: Date.now(),
      source: 'manager'
    };
    
    // Check for changes in zone properties
    if (changes.center && (changes.center.x !== oldZone.center.x || changes.center.y !== oldZone.center.y)) {
      diff.modified.push('center');
    }
    
    if (changes.radius !== undefined && changes.radius !== oldZone.radius) {
      diff.modified.push('radius');
    }
    
    return diff;
  }

  // Send zone update to server
  private sendZoneUpdate(zoneId: string, diff: ZoneDiff): void {
    if (!this.ws.isConnected()) {
      if (this.config.debug) {
        console.warn('[ZoneSyncManager] Cannot send update - WebSocket disconnected');
      }
      return;
    }

    // Apply latency compensation
    if (this.config.latencyCompensation) {
      diff.timestamp -= this.latencyBuffer;
    }

    // Send batched diffs
    const batches = this.batchDiffs([diff]);
    
    for (const batch of batches) {
      this.ws.send(WebSocketMessageType.ARENA_ZONE_UPDATE, {
        zoneId,
        diffs: batch,
        timestamp: Date.now()
      });
    }
  }

  // Batch diffs for efficient transmission
  private batchDiffs(diffs: ZoneDiff[]): ZoneDiff[][] {
    const batches: ZoneDiff[][] = [];
    
    for (let i = 0; i < diffs.length; i += this.config.diffBatchSize) {
      batches.push(diffs.slice(i, i + this.config.diffBatchSize));
    }
    
    return batches;
  }

  // Trim pending changes to prevent memory growth
  private trimPendingChanges(state: ZoneSyncState): void {
    if (state.pendingChanges.length > this.config.maxPendingChanges) {
      state.pendingChanges = state.pendingChanges.slice(-this.config.maxPendingChanges);
    }
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    this.ws.addEventListener('onArenaZoneUpdate', this.handleServerZoneUpdate.bind(this));
    
    this.ws.addEventListener('onConnect', () => {
      // Re-sync all zones on reconnect
      for (const [zoneId, state] of this.syncState) {
        state.syncStatus = 'syncing';
        this.notifyStateChange(zoneId);
      }
    });
    
    this.ws.addEventListener('onDisconnect', () => {
      // Mark all zones as disconnected
      for (const [zoneId, state] of this.syncState) {
        state.syncStatus = 'disconnected';
        this.notifyStateChange(zoneId);
      }
    });
  }

  // Start periodic sync timer
  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      this.performPeriodicSync();
    }, this.config.syncInterval);
  }

  // Perform periodic sync operations
  private performPeriodicSync(): void {
    const now = Date.now();
    
    for (const [zoneId, state] of this.syncState) {
      // Update latency buffer based on WebSocket latency
      this.latencyBuffer = this.ws.getLatency() / 2;
      
      // Check for stale pending changes
      const staleChanges = state.pendingChanges.filter(
        change => now - change.timestamp > 5000 // 5 seconds
      );
      
      if (staleChanges.length > 0) {
        // Re-send stale changes
        for (const change of staleChanges) {
          this.sendZoneUpdate(zoneId, change);
        }
      }
      
      // Update sync status based on pending changes
      if (state.pendingChanges.length === 0 && state.syncStatus === 'syncing') {
        state.syncStatus = 'synced';
        this.notifyStateChange(zoneId);
      }
    }
  }

  // Notify state change
  private notifyStateChange(zoneId: string): void {
    const state = this.syncState.get(zoneId);
    if (state) {
      this.onStateChange?.(zoneId, state);
    }
  }

  // Public API methods
  public getSyncState(zoneId: string): ZoneSyncState | undefined {
    return this.syncState.get(zoneId);
  }

  public getAllSyncStates(): Map<string, ZoneSyncState> {
    return new Map(this.syncState);
  }

  public getConflictHistory(): ZoneConflict[] {
    return [...this.conflictHistory];
  }

  public clearConflictHistory(): void {
    this.conflictHistory = [];
  }

  public getSyncStatus(zoneId: string): 'synced' | 'syncing' | 'conflict' | 'disconnected' | undefined {
    return this.syncState.get(zoneId)?.syncStatus;
  }

  public getPendingChangesCount(zoneId: string): number {
    return this.syncState.get(zoneId)?.pendingChanges.length || 0;
  }

  public getLatencyCompensation(): number {
    return this.latencyBuffer;
  }

  public updateConfig(config: Partial<ZoneSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Cleanup
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.syncState.clear();
    this.optimisticUpdates.clear();
    this.conflictHistory = [];
  }
}

// Singleton instance
let globalZoneSyncManager: ZoneSyncManager | null = null;

export function getZoneSyncManager(
  webSocketService: WebSocketService,
  config?: Partial<ZoneSyncConfig>,
  callbacks?: {
    onStateChange?: (zoneId: string, state: ZoneSyncState) => void;
    onConflict?: (conflict: ZoneConflict) => void;
  }
): ZoneSyncManager {
  if (!globalZoneSyncManager) {
    globalZoneSyncManager = new ZoneSyncManager(webSocketService, config, callbacks);
  } else if (config) {
    globalZoneSyncManager.updateConfig(config);
  }
  return globalZoneSyncManager;
}

export function resetZoneSyncManager(): void {
  if (globalZoneSyncManager) {
    globalZoneSyncManager.destroy();
    globalZoneSyncManager = null;
  }
}