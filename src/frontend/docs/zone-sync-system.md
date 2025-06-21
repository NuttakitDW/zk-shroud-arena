# Zone Sync System Documentation

## Overview

The Zone Sync System provides real-time synchronization of zone updates between Game Managers and Players in the ZK Shroud Arena. It features efficient diff-based updates, conflict resolution, latency compensation, and optimistic updates.

## Architecture

### Core Components

1. **ZoneSyncManager Service** (`/services/zoneSyncManager.ts`)
   - Handles real-time zone synchronization
   - Manages diff-based updates
   - Provides conflict resolution
   - Implements latency compensation

2. **useZoneSync Hook** (`/hooks/useZoneSync.ts`)
   - React hook for easy integration
   - Manages sync state
   - Provides zone update actions
   - Tracks connection status

3. **ZoneSyncStatus Component** (`/components/ZoneSyncStatus.tsx`)
   - Visual indicators for sync status
   - Displays pending changes
   - Shows conflict information
   - Real-time status updates

## Usage

### Basic Setup

```typescript
import { useZoneSync } from '../hooks/useZoneSync';
import { ZoneSyncStatus } from '../components/ZoneSyncStatus';

function GameManagerView() {
  const {
    currentZoneSyncState,
    updateZone,
    getSyncStatus,
    isConnected
  } = useZoneSync({
    config: {
      enableOptimisticUpdates: true,
      conflictResolutionMode: 'server-wins'
    }
  });

  // Update zone radius
  const handleZoneResize = (zoneId: string, newRadius: number) => {
    updateZone(zoneId, { radius: newRadius });
  };

  return (
    <div>
      <ZoneSyncStatus
        zoneId={currentZone.id}
        syncState={currentZoneSyncState}
        showDetails={true}
      />
      {/* Your zone controls */}
    </div>
  );
}
```

### Configuration Options

```typescript
interface ZoneSyncConfig {
  enableOptimisticUpdates: boolean;  // Apply changes locally before server confirmation
  conflictResolutionMode: 'server-wins' | 'client-wins' | 'merge';
  syncInterval: number;               // Milliseconds between sync checks
  maxPendingChanges: number;          // Maximum queued changes
  diffBatchSize: number;              // Changes per batch
  latencyCompensation: boolean;       // Adjust timestamps for latency
  debug: boolean;                     // Enable debug logging
}
```

### Zone Updates

The system tracks changes using a diff-based approach:

```typescript
interface ZoneDiff {
  added: string[];      // H3 indices added to zone
  removed: string[];    // H3 indices removed from zone
  modified: string[];   // H3 indices with changed properties
  timestamp: number;
  source: 'manager' | 'server' | 'player';
}
```

### Conflict Resolution

When conflicts occur between local and server updates:

1. **Server Wins** (default): Server updates override local changes
2. **Client Wins**: Local changes are re-applied after server update
3. **Merge**: Intelligently combines non-conflicting changes

### Status Indicators

The system provides several sync states:

- **Synced**: All changes synchronized with server
- **Syncing**: Changes being sent to server
- **Conflict**: Conflicting changes detected
- **Disconnected**: No connection to server

## API Reference

### useZoneSync Hook

```typescript
const {
  // State
  syncStates,              // Map of all zone sync states
  currentZoneSyncState,    // Sync state for current zone
  conflicts,               // Array of recent conflicts
  
  // Actions
  initializeZone,          // Initialize sync for a zone
  updateZone,              // Apply zone changes
  
  // Status
  getSyncStatus,           // Get sync status for zone
  getPendingChangesCount,  // Count pending changes
  getLatencyCompensation,  // Get latency compensation value
  
  // Controls
  clearConflicts,          // Clear conflict history
  updateConfig,            // Update sync configuration
  
  // Connection
  isConnected,             // WebSocket connection status
  connectionLatency        // Connection latency in ms
} = useZoneSync(options);
```

### ZoneSyncStatus Component

```typescript
<ZoneSyncStatus
  zoneId={string}              // Zone identifier
  syncState={ZoneSyncState}    // Sync state object
  conflicts={ZoneConflict[]}   // Conflict history
  showDetails={boolean}        // Show expanded details
  position={'top-right'}       // Position on screen
/>
```

### ZoneSyncIndicator Component

```typescript
<ZoneSyncIndicator
  syncStatus={'synced'}        // Current sync status
  size={'sm' | 'md' | 'lg'}    // Indicator size
  showLabel={boolean}          // Show status label
/>
```

## WebSocket Integration

The Zone Sync System integrates with the existing WebSocket service to handle real-time updates:

### Message Types

- **ARENA_ZONE_UPDATE**: Zone changes from server
- **Zone Diff Messages**: Batched diff updates (custom implementation)

### Event Handlers

The system automatically handles:
- Connection/disconnection events
- Zone update messages
- Sync state changes
- Conflict detection

## Performance Considerations

1. **Diff-Based Updates**: Only changed H3 indices are transmitted
2. **Batch Processing**: Multiple changes are batched for efficiency
3. **Optimistic Updates**: Immediate UI feedback while syncing
4. **Latency Compensation**: Timestamps adjusted for network delay
5. **Automatic Cleanup**: Old pending changes are trimmed

## Best Practices

1. **Enable Optimistic Updates** for responsive UI
2. **Use Server-Wins** conflict resolution for consistency
3. **Monitor Pending Changes** to detect sync issues
4. **Clear Conflicts Periodically** to free memory
5. **Handle Disconnections** gracefully with status indicators

## Example: Complete Zone Manager

```typescript
import React from 'react';
import { useZoneSync } from '../hooks/useZoneSync';
import { ZoneSyncStatus } from '../components/ZoneSyncStatus';
import { useGameContext } from '../contexts/GameContext';

export const ZoneManager: React.FC = () => {
  const { state: gameState } = useGameContext();
  const {
    currentZoneSyncState,
    updateZone,
    conflicts,
    isConnected
  } = useZoneSync({
    config: {
      enableOptimisticUpdates: true,
      conflictResolutionMode: 'server-wins',
      debug: process.env.NODE_ENV === 'development'
    },
    onConflict: (conflict) => {
      console.warn('Zone sync conflict:', conflict);
    }
  });

  const currentZone = gameState.arenaState.currentZone;

  const handleShrinkZone = () => {
    updateZone(currentZone.id, {
      radius: currentZone.radius * 0.8
    });
  };

  const handleMoveZone = (deltaX: number, deltaY: number) => {
    updateZone(currentZone.id, {
      center: {
        x: currentZone.center.x + deltaX,
        y: currentZone.center.y + deltaY
      }
    });
  };

  return (
    <div className="zone-manager">
      <ZoneSyncStatus
        zoneId={currentZone.id}
        syncState={currentZoneSyncState}
        conflicts={conflicts}
        showDetails={true}
        position="top-right"
      />
      
      <div className="zone-controls">
        <button 
          onClick={handleShrinkZone}
          disabled={!isConnected}
        >
          Shrink Zone
        </button>
        
        <div className="move-controls">
          <button onClick={() => handleMoveZone(0, -50)}>↑</button>
          <button onClick={() => handleMoveZone(-50, 0)}>←</button>
          <button onClick={() => handleMoveZone(50, 0)}>→</button>
          <button onClick={() => handleMoveZone(0, 50)}>↓</button>
        </div>
      </div>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **Changes Not Syncing**
   - Check WebSocket connection status
   - Verify zone is initialized with `initializeZone`
   - Check for pending changes in sync state

2. **Frequent Conflicts**
   - Increase sync interval to reduce conflicts
   - Consider using 'merge' conflict resolution
   - Check for multiple managers updating same zone

3. **High Latency**
   - Enable latency compensation
   - Reduce diff batch size
   - Check network connection quality

### Debug Mode

Enable debug mode to see detailed logs:

```typescript
useZoneSync({
  config: {
    debug: true
  }
});
```

This will log:
- Zone initialization
- Diff generation
- Conflict detection
- Sync state changes
- WebSocket events