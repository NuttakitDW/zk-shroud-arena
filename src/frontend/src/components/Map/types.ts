// Shared type definitions for Map and Location components

// H3 Hexagon zone types
export interface H3Zone {
  id: string;
  h3Index: string;
  center: Coordinates;
  type: 'safe' | 'danger';
  pointValue: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface H3ZoneGroup {
  id: string;
  name: string;
  h3Indices: string[];
  type: 'safe' | 'danger';
  pointValue: number;
  color?: string;
  description?: string;
}

export interface ZoneDrawingState {
  isDrawing: boolean;
  currentZone: string[]; // H3 indices being drawn
  zoneType: 'safe' | 'danger';
  pointValue: number;
  drawMode: 'single' | 'area' | 'path';
}

export interface Position {
  x: number;
  y: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ArenaBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ZoneCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Zone {
  id: string;
  name: string;
  coordinates: ZoneCoordinates;
  type: 'safe' | 'danger' | 'shrinking' | 'eliminated';
  shrinkProgress?: number; // 0-1, for shrinking zones
  timeRemaining?: number; // seconds
}

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface PrivacyLocation {
  zoneId: string;
  zoneName: string;
  approximateDistance: 'very-close' | 'close' | 'medium' | 'far' | 'very-far';
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  lastUpdated: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  zone?: string;
  accuracy?: number;
}

export interface Player {
  id: string;
  position: Position;
  status: 'active' | 'eliminated' | 'hidden';
  isCurrentPlayer?: boolean;
}

export interface PlayerIndicatorData {
  id: string;
  username: string;
  position: PlayerPosition;
  status: 'online' | 'offline' | 'idle' | 'in-game' | 'eliminated';
  avatar?: string;
  isCurrentPlayer?: boolean;
  lastSeen?: number;
  healthStatus?: 'healthy' | 'injured' | 'critical';
  team?: string;
  rank?: number;
}

export type PrivacyLevel = 'high' | 'medium' | 'low';

export type LocationStatus = 'disabled' | 'requesting' | 'tracking' | 'error' | 'permission-denied';

export interface PrivacyObfuscation {
  positionNoise: number;
  showExact: boolean;
  showZone: boolean;
  hideDistance: number; // Hide players beyond this distance
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface MapInteractionHandlers {
  onPlayerClick?: (playerId: string) => void;
  onMapClick?: (position: Position) => void;
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string | null) => void;
  onPlayerHover?: (playerId: string | null) => void;
}

export interface MapConfiguration {
  width: number;
  height: number;
  showGrid?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  showLabels?: boolean;
  showTimers?: boolean;
  animated?: boolean;
  allowHighAccuracy?: boolean;
  updateInterval?: number; // milliseconds
  maxVisiblePlayers?: number;
}

export interface PrivacyConfiguration {
  zoneRadius: number; // meters
  minUpdateInterval: number; // milliseconds
  coordinateObfuscation: number; // coordinate precision reduction
  showDirection: boolean;
  showDistance: boolean;
}

// Game-specific types
export interface GameState {
  id: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  startTime?: number;
  endTime?: number;
  currentPhase?: string;
  playersRemaining: number;
  totalPlayers: number;
}

export interface Arena {
  id: string;
  name: string;
  bounds: ArenaBounds;
  zones: Zone[];
  safeZones: string[];
  dangerZones: string[];
}

export interface GameSession {
  id: string;
  playerId: string;
  gameState: GameState;
  arena: Arena;
  currentPosition?: PrivacyLocation;
  privacyLevel: PrivacyLevel;
  teammates?: string[];
  enemies?: string[];
}

// Event types for real-time updates
export interface LocationUpdateEvent {
  type: 'location_update';
  playerId: string;
  location: PrivacyLocation;
  timestamp: number;
}

export interface PlayerStatusEvent {
  type: 'player_status';
  playerId: string;
  status: PlayerIndicatorData['status'];
  timestamp: number;
}

export interface ZoneUpdateEvent {
  type: 'zone_update';
  zoneId: string;
  zone: Zone;
  timestamp: number;
}

export interface GameStateEvent {
  type: 'game_state';
  gameState: GameState;
  timestamp: number;
}

export type GameEvent = LocationUpdateEvent | PlayerStatusEvent | ZoneUpdateEvent | GameStateEvent;

// Error types
export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  timestamp: number;
}

export interface MapError {
  type: 'RENDER_ERROR' | 'INTERACTION_ERROR' | 'DATA_ERROR';
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

// Utility types
export type MapEventHandler<T = unknown> = (event: T) => void;

export interface MapRef {
  centerOnPlayer: (playerId: string) => void;
  zoomToZone: (zoneId: string) => void;
  resetView: () => void;
  exportMapImage: () => string; // base64 image data
  getCurrentViewport: () => ViewportState;
  setViewport: (viewport: ViewportState) => void;
}

export interface LocationTrackerRef {
  getCurrentLocation: () => Promise<PrivacyLocation | null>;
  requestPermission: () => Promise<boolean>;
  startTracking: () => void;
  stopTracking: () => void;
  getStatus: () => LocationStatus;
}

// Component prop types
export interface BaseMapProps extends MapConfiguration, MapInteractionHandlers {
  className?: string;
}

export interface BaseLocationProps {
  privacyLevel: PrivacyLevel;
  enabled: boolean;
  className?: string;
  onLocationUpdate?: (location: PrivacyLocation | null) => void;
  onError?: (error: string) => void;
}

// Hook types
export interface UseLocationOptions {
  privacyLevel: PrivacyLevel;
  enabled: boolean;
  updateInterval?: number;
  allowHighAccuracy?: boolean;
}

export interface UseLocationReturn {
  location: PrivacyLocation | null;
  status: LocationStatus;
  error: string | null;
  accuracy: number | null;
  requestLocation: () => void;
  startTracking: () => void;
  stopTracking: () => void;
}

export interface UseMapOptions {
  initialBounds: ArenaBounds;
  enableInteractions?: boolean;
  privacyLevel?: PrivacyLevel;
}

export interface UseMapReturn {
  viewport: ViewportState;
  setViewport: (viewport: ViewportState) => void;
  worldToScreen: (worldPos: Position) => Position;
  screenToWorld: (screenPos: Position) => Position;
  centerOnPosition: (position: Position) => void;
  zoomToFit: (bounds: ArenaBounds) => void;
}

// Constants
export const PRIVACY_LEVELS: Record<PrivacyLevel, PrivacyConfiguration> = {
  high: {
    zoneRadius: 500,
    minUpdateInterval: 30000,
    coordinateObfuscation: 0.001,
    showDirection: false,
    showDistance: false,
  },
  medium: {
    zoneRadius: 200,
    minUpdateInterval: 15000,
    coordinateObfuscation: 0.0005,
    showDirection: true,
    showDistance: false,
  },
  low: {
    zoneRadius: 100,
    minUpdateInterval: 5000,
    coordinateObfuscation: 0.0001,
    showDirection: true,
    showDistance: true,
  },
};

export const ZONE_COLORS = {
  safe: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' },
  danger: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' },
  shrinking: { fill: 'rgba(251, 191, 36, 0.25)', stroke: '#fbbf24' },
  eliminated: { fill: 'rgba(107, 114, 128, 0.1)', stroke: '#6b7280' },
} as const;

export const PLAYER_COLORS = {
  active: '#3b82f6',
  eliminated: '#ef4444',
  hidden: '#6b7280',
  current: '#4ade80',
} as const;

export const STATUS_COLORS = {
  online: '#22c55e',
  offline: '#6b7280',
  idle: '#eab308',
  'in-game': '#8b5cf6',
  eliminated: '#ef4444',
} as const;