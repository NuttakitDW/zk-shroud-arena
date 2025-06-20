/**
 * WebSocket Types for ZK Shroud Arena
 * Real-time communication interfaces and message types
 */

import type { Coordinates, PlayerLocation, SafeZone, GamePhase, ZKProofData, ZKProofStatus } from './gameState';

// Re-export types for use in other modules
export type { Coordinates, PlayerLocation, SafeZone, GamePhase, ZKProofData, ZKProofStatus };

// Connection status and management
export enum WebSocketConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface WebSocketConnectionInfo {
  status: WebSocketConnectionStatus;
  url: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastConnected?: number;
  lastDisconnected?: number;
  latency: number;
  connectionId?: string;
}

// Message types for different game events
export enum WebSocketMessageType {
  // Connection management
  PING = 'ping',
  PONG = 'pong',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Player actions
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_MOVE = 'player_move',
  PLAYER_HEALTH_UPDATE = 'player_health_update',
  PLAYER_ELIMINATION = 'player_elimination',
  
  // Arena and game state
  ARENA_ZONE_UPDATE = 'arena_zone_update',
  ARENA_ZONE_SHRINK = 'arena_zone_shrink',
  GAME_PHASE_CHANGE = 'game_phase_change',
  GAME_TIMER_UPDATE = 'game_timer_update',
  GAME_STATE_SYNC = 'game_state_sync',
  
  // ZK Proof system
  ZK_PROOF_GENERATED = 'zk_proof_generated',
  ZK_PROOF_VALIDATED = 'zk_proof_validated',
  ZK_PROOF_INVALID = 'zk_proof_invalid',
  ZK_PROOF_REQUEST = 'zk_proof_request',
  
  // Communication
  CHAT_MESSAGE = 'chat_message',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  
  // Error handling
  ERROR = 'error',
  RATE_LIMIT = 'rate_limit'
}

// Base message structure
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  timestamp: number;
  data: T;
  messageId: string;
  playerId?: string;
  gameId?: string;
}

// Specific message payloads
export interface PlayerJoinMessage {
  playerId: string;
  playerName?: string;
  location: PlayerLocation;
  team?: string;
}

export interface PlayerLeaveMessage {
  playerId: string;
  reason: 'disconnect' | 'elimination' | 'quit';
}

export interface PlayerMoveMessage {
  playerId: string;
  location: PlayerLocation;
  velocity?: Coordinates;
}

export interface PlayerHealthUpdateMessage {
  playerId: string;
  health: number;
  maxHealth: number;
  damage?: number;
  source?: string;
}

export interface PlayerEliminationMessage {
  playerId: string;
  eliminatedBy?: string;
  location: PlayerLocation;
  reason: 'zone_damage' | 'combat' | 'proof_invalid';
}

export interface ArenaZoneUpdateMessage {
  currentZone: SafeZone;
  nextZone?: SafeZone;
  shrinkStartTime?: number;
  shrinkDuration?: number;
}

export interface GamePhaseChangeMessage {
  phase: GamePhase;
  phaseStartTime: number;
  phaseDuration: number;
  playerCount: number;
}

export interface GameTimerUpdateMessage {
  remainingTime: number;
  totalTime: number;
  phase: GamePhase;
}

export interface GameStateSyncMessage {
  players: Record<string, {
    id: string;
    location: PlayerLocation;
    health: number;
    isAlive: boolean;
    proofStatus: ZKProofStatus;
  }>;
  arena: ArenaZoneUpdateMessage;
  gamePhase: GamePhaseChangeMessage;
  timestamp: number;
}

export interface ZKProofGeneratedMessage {
  playerId: string;
  proof: ZKProofData;
  location: PlayerLocation;
}

export interface ZKProofValidatedMessage {
  playerId: string;
  proofHash: string;
  isValid: boolean;
  validationTime: number;
}

export interface ZKProofRequestMessage {
  playerId: string;
  deadline: number;
  location: PlayerLocation;
}

export interface ChatMessage {
  playerId: string;
  playerName?: string;
  message: string;
  channel: 'global' | 'team' | 'system';
  timestamp: number;
}

export interface SystemAnnouncementMessage {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

export interface ErrorMessage {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface RateLimitMessage {
  limitType: string;
  resetTime: number;
  remaining: number;
}

// WebSocket service configuration
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  maxReconnectAttempts: number;
  reconnectInterval: number;
  maxReconnectInterval: number;
  reconnectBackoffFactor: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  enableCompression: boolean;
  debug: boolean;
}

// Default configuration
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  url: 'ws://localhost:8080/ws',
  maxReconnectAttempts: 10,
  reconnectInterval: 1000, // 1 second
  maxReconnectInterval: 30000, // 30 seconds
  reconnectBackoffFactor: 1.5,
  heartbeatInterval: 30000, // 30 seconds
  messageQueueSize: 100,
  enableCompression: false,
  debug: false
};

// Message queue for offline scenarios
export interface QueuedMessage {
  message: WebSocketMessage;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// Event handlers for the WebSocket service
export interface WebSocketEventHandlers {
  onConnect?: (connectionInfo: WebSocketConnectionInfo) => void;
  onDisconnect?: (reason: string) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: (connectionInfo: WebSocketConnectionInfo) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onPlayerJoin?: (data: PlayerJoinMessage) => void;
  onPlayerLeave?: (data: PlayerLeaveMessage) => void;
  onPlayerMove?: (data: PlayerMoveMessage) => void;
  onPlayerHealthUpdate?: (data: PlayerHealthUpdateMessage) => void;
  onPlayerElimination?: (data: PlayerEliminationMessage) => void;
  onArenaZoneUpdate?: (data: ArenaZoneUpdateMessage) => void;
  onArenaZoneShrink?: (data: ArenaZoneUpdateMessage) => void;
  onGamePhaseChange?: (data: GamePhaseChangeMessage) => void;
  onGameTimerUpdate?: (data: GameTimerUpdateMessage) => void;
  onGameStateSync?: (data: GameStateSyncMessage) => void;
  onZKProofGenerated?: (data: ZKProofGeneratedMessage) => void;
  onZKProofValidated?: (data: ZKProofValidatedMessage) => void;
  onZKProofInvalid?: (data: ZKProofValidatedMessage) => void;
  onZKProofRequest?: (data: ZKProofRequestMessage) => void;
  onChatMessage?: (data: ChatMessage) => void;
  onSystemAnnouncement?: (data: SystemAnnouncementMessage) => void;
  onRateLimit?: (data: RateLimitMessage) => void;
}

// WebSocket service interface
export interface IWebSocketService {
  // Connection management
  connect(gameId?: string): Promise<void>;
  disconnect(): void;
  reconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionInfo(): WebSocketConnectionInfo;
  
  // Message sending
  send<T>(type: WebSocketMessageType, data: T): void;
  sendPlayerMove(location: PlayerLocation): void;
  sendZKProof(proof: ZKProofData): void;
  sendChatMessage(message: string, channel?: 'global' | 'team'): void;
  
  // Event handling
  addEventListener<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler: WebSocketEventHandlers[K]
  ): void;
  removeEventListener<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler: WebSocketEventHandlers[K]
  ): void;
  
  // Configuration
  updateConfig(config: Partial<WebSocketConfig>): void;
  getConfig(): WebSocketConfig;
  
  // Utilities
  getLatency(): number;
  getMessageQueue(): QueuedMessage[];
  clearMessageQueue(): void;
}

// React hook types
export interface UseWebSocketOptions {
  gameId?: string;
  config?: Partial<WebSocketConfig>;
  handlers?: WebSocketEventHandlers;
  autoConnect?: boolean;
}

export interface UseWebSocketReturn {
  connectionInfo: WebSocketConnectionInfo;
  isConnected: boolean;
  latency: number;
  connect: (gameId?: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  sendMessage: <T>(type: WebSocketMessageType, data: T) => void;
  sendPlayerMove: (location: PlayerLocation) => void;
  sendZKProof: (proof: ZKProofData) => void;
  sendChatMessage: (message: string, channel?: 'global' | 'team') => void;
  messageQueue: QueuedMessage[];
  clearMessageQueue: () => void;
}

// Type guards for message validation
export function isWebSocketMessage(obj: unknown): obj is WebSocketMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).type === 'string' &&
    typeof (obj as Record<string, unknown>).timestamp === 'number' &&
    typeof (obj as Record<string, unknown>).messageId === 'string' &&
    (obj as Record<string, unknown>).data !== undefined
  );
}

export function isPlayerMoveMessage(obj: unknown): obj is WebSocketMessage<PlayerMoveMessage> {
  return (
    isWebSocketMessage(obj) &&
    obj.type === WebSocketMessageType.PLAYER_MOVE &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof (obj.data as Record<string, unknown>).playerId === 'string' &&
    typeof (obj.data as Record<string, unknown>).location === 'object'
  );
}

export function isArenaZoneUpdateMessage(obj: unknown): obj is WebSocketMessage<ArenaZoneUpdateMessage> {
  return (
    isWebSocketMessage(obj) &&
    obj.type === WebSocketMessageType.ARENA_ZONE_UPDATE &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof (obj.data as Record<string, unknown>).currentZone === 'object'
  );
}

export function isGamePhaseChangeMessage(obj: unknown): obj is WebSocketMessage<GamePhaseChangeMessage> {
  return (
    isWebSocketMessage(obj) &&
    obj.type === WebSocketMessageType.GAME_PHASE_CHANGE &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof (obj.data as Record<string, unknown>).phase === 'string'
  );
}

export function isZKProofValidatedMessage(obj: unknown): obj is WebSocketMessage<ZKProofValidatedMessage> {
  return (
    isWebSocketMessage(obj) &&
    obj.type === WebSocketMessageType.ZK_PROOF_VALIDATED &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof (obj.data as Record<string, unknown>).playerId === 'string' &&
    typeof (obj.data as Record<string, unknown>).isValid === 'boolean'
  );
}

export function isChatMessage(obj: unknown): obj is WebSocketMessage<ChatMessage> {
  return (
    isWebSocketMessage(obj) &&
    obj.type === WebSocketMessageType.CHAT_MESSAGE &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    typeof (obj.data as Record<string, unknown>).playerId === 'string' &&
    typeof (obj.data as Record<string, unknown>).message === 'string'
  );
}