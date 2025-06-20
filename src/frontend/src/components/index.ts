// Map components
export * from './Map';

// Location components  
export * from './Location';

// Game components
export { GameOrchestrator } from './GameOrchestrator';
export { LoadingScreen } from './LoadingScreen';
export { ErrorBoundary } from './ErrorBoundary';
export { GameHUD } from './GameHUD';
export { GameLobby } from './GameLobby';
export { GameStats } from './GameStats';
export { ZKProofIndicator } from './ZKProofIndicator';
export { ConnectionStatus } from './ConnectionStatus';

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