// Map components
export * from './Map';

// Location components  
export * from './Location';

// UI components
export * from './ui';

// Admin components
export * from './admin';

// Game components
export { GameOrchestrator } from './GameOrchestrator';
export { LoadingScreen } from './LoadingScreen';
export { ErrorBoundary } from './ErrorBoundary';
export { GameHUD } from './GameHUD';
export { GameLobby } from './GameLobby';
export { GameStats } from './GameStats';
export { ZKProofIndicator } from './ZKProofIndicator';
export { ConnectionStatus } from './ConnectionStatus';

// Zone Sync components
export { ZoneSyncStatus, ZoneSyncIndicator } from './ZoneSyncStatus';
export type { ZoneSyncStatusProps, ZoneSyncIndicatorProps } from './ZoneSyncStatus';
export { ZoneSyncDemo } from './ZoneSyncDemo';

// Example components
export * from './examples';

// Combined exports for easy access
export {
  GameMap,
  ArenaZone, 
  PlayerIndicator,
} from './Map';

export {
  LocationTracker,
} from './Location';

export {
  MapDemo,
} from './examples';

export {
  BattleArena,
  // Note: RealWorldArena excluded from exports to prevent SSR issues with Leaflet
  // Import RealWorldArena directly where needed using dynamic imports
} from './arena';

export type {
  Position,
  ArenaBounds,
  Player,
} from './Map/types';

// Re-export commonly used types
export type {
  GameState,
  PlayerState,
  GamePhase,
  ZKProofStatus,
  ArenaState,
  SafeZone,
  Coordinates
} from '../types/gameState';