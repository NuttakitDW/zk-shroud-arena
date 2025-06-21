/**
 * Core Game Engine for ZK Shroud Arena
 * Orchestrates all game systems and provides unified interface
 */

import { 
  GameState, 
  GamePhase, 
  SafeZone, 
  Coordinates,
  ZKProofStatus,
  ZKProofData,
  PlayerState
} from '../../types/gameState';
import { LocationCoordinates } from '../../types/zkProof';
import { generateLocationProofControlled } from '../../services/apiController';
import { getWebSocketService } from '../../services/websocketService';
import { GameRulesEngine, GameEvent as RulesEvent } from './GameRulesEngine';

export interface GameEngineConfig {
  arenaSize: { width: number; height: number };
  maxPlayers: number;
  zoneSettings: {
    initialRadius: number;
    shrinkInterval: number;
    shrinkRate: number;
    damagePerSecond: number;
  };
  zkSettings: {
    proofRequired: boolean;
    proofInterval: number;
    h3Resolution: number;
  };
  realWorldSettings: {
    enabled: boolean;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    coordinateScale: number; // Scale factor for lat/lng to game coordinates
  };
  enableRealtime: boolean;
  enableBots: boolean;
  botCount: number;
}

export const DEFAULT_ENGINE_CONFIG: GameEngineConfig = {
  arenaSize: { width: 2000, height: 2000 },
  maxPlayers: 100,
  zoneSettings: {
    initialRadius: 800,
    shrinkInterval: 120000, // 2 minutes
    shrinkRate: 0.8, // Shrink to 80% of current size
    damagePerSecond: 5
  },
  zkSettings: {
    proofRequired: true,
    proofInterval: 60000, // 1 minute
    h3Resolution: 9
  },
  realWorldSettings: {
    enabled: false,
    centerLat: 37.7749, // San Francisco by default
    centerLng: -122.4194,
    radiusKm: 5, // 5km radius for real-world arena
    coordinateScale: 100000 // Scale factor for converting lat/lng to game units
  },
  enableRealtime: true,
  enableBots: true,
  botCount: 20
};

export interface BotPlayer {
  id: string;
  position: Coordinates;
  health: number;
  isAlive: boolean;
  movementTarget?: Coordinates;
  lastMove: number;
  aiState: 'moving_to_zone' | 'random_movement' | 'staying_safe';
}

export interface GameEngineState {
  isRunning: boolean;
  gameStartTime: number;
  botPlayers: Map<string, BotPlayer>;
  spawnPoints: Coordinates[];
  realWorldSpawnPoints?: LocationCoordinates[];
  damageZoneTimer?: number;
  botMovementTimer?: number;
  lastZoneShrink: number;
  realWorldMode: boolean;
  realWorldCenter?: LocationCoordinates;
  currentGameId?: string;
}

export class GameEngine {
  private config: GameEngineConfig;
  private state: GameEngineState;
  private gameStateUpdater: (updater: (state: GameState) => GameState) => void;
  private currentGameId?: string;
  private rulesEngine: GameRulesEngine;
  private rulesProcessingTimer?: number;
  
  constructor(
    config: Partial<GameEngineConfig> = {},
    gameStateUpdater: (updater: (state: GameState) => GameState) => void
  ) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.gameStateUpdater = gameStateUpdater;
    this.rulesEngine = new GameRulesEngine();
    
    this.state = {
      isRunning: false,
      gameStartTime: 0,
      botPlayers: new Map(),
      spawnPoints: this.generateSpawnPoints(),
      realWorldSpawnPoints: this.generateRealWorldSpawnPoints(),
      lastZoneShrink: 0,
      realWorldMode: this.config.realWorldSettings.enabled,
      realWorldCenter: this.config.realWorldSettings.enabled ? {
        latitude: this.config.realWorldSettings.centerLat,
        longitude: this.config.realWorldSettings.centerLng
      } : undefined
    };
  }

  /**
   * Initialize and start the game engine
   */
  public async initialize(): Promise<void> {
    console.log('🎮 Initializing ZK Shroud Arena Game Engine...');
    
    // Initialize spawn points
    this.state.spawnPoints = this.generateSpawnPoints();
    
    // Initialize real-world spawn points if enabled
    if (this.config.realWorldSettings.enabled) {
      this.state.realWorldSpawnPoints = this.generateRealWorldSpawnPoints();
      console.log('🌍 Real-world spawn points generated');
    }
    
    // Create bot players if enabled
    if (this.config.enableBots) {
      this.createBotPlayers();
    }
    
    // Initialize WebSocket if enabled
    if (this.config.enableRealtime) {
      const wsService = getWebSocketService({
        url: 'ws://localhost:8080/ws'
      });
      
      try {
        await wsService.connect('zk-shroud-arena');
        console.log('🔗 WebSocket connected for real-time multiplayer');
      } catch (error) {
        console.warn('⚠️ WebSocket connection failed, running in offline mode:', error);
      }
    }
    
    console.log(`✅ Game Engine initialized successfully (Real-world mode: ${this.state.realWorldMode ? 'enabled' : 'disabled'})`);
  }

  /**
   * Start the game
   */
  public startGame(): void {
    if (this.state.isRunning) {
      console.warn('Game is already running');
      return;
    }

    console.log('🚀 Starting ZK Shroud Arena Battle Royale...');
    
    this.state.isRunning = true;
    this.state.gameStartTime = Date.now();
    this.state.lastZoneShrink = Date.now();
    
    // Update game phase to preparation
    this.gameStateUpdater(state => ({
      ...state,
      gamePhase: {
        ...state.gamePhase,
        phase: GamePhase.PREPARATION,
        timer: {
          ...state.gamePhase.timer,
          phaseStartTime: Date.now(),
          phaseEndTime: Date.now() + 30000, // 30 seconds preparation
          remainingTime: 30000,
          isRunning: true
        }
      }
    }));
    
    // Start game loops
    this.startDamageZoneLoop();
    this.startBotMovementLoop();
    this.startZoneShrinkLoop();
    this.startRulesProcessingLoop();
    
    // Transition to active phase after preparation
    setTimeout(() => {
      this.transitionToActivePhase();
    }, 30000);
  }

  /**
   * Stop the game
   */
  public stopGame(): void {
    console.log('🛑 Stopping game...');
    
    this.state.isRunning = false;
    
    // Clear timers
    if (this.state.damageZoneTimer) {
      clearInterval(this.state.damageZoneTimer);
    }
    if (this.state.botMovementTimer) {
      clearInterval(this.state.botMovementTimer);
    }
    if (this.rulesProcessingTimer) {
      clearInterval(this.rulesProcessingTimer);
    }
    
    // Update game phase
    this.gameStateUpdater(state => ({
      ...state,
      gamePhase: {
        ...state.gamePhase,
        phase: GamePhase.GAME_OVER,
        timer: {
          ...state.gamePhase.timer,
          isRunning: false
        }
      }
    }));
  }

  /**
   * Spawn player at random spawn point (supports both virtual and real-world modes)
   */
  public spawnPlayer(playerId: string, useRealWorld: boolean = false): Coordinates {
    let spawnPoint: Coordinates;
    let realWorldSpawn: LocationCoordinates | undefined;
    
    if (useRealWorld && this.state.realWorldMode && this.state.realWorldSpawnPoints) {
      // Use real-world spawn point
      const realWorldPoint = this.state.realWorldSpawnPoints[Math.floor(Math.random() * this.state.realWorldSpawnPoints.length)];
      realWorldSpawn = realWorldPoint;
      spawnPoint = this.realWorldToGameCoordinates(realWorldPoint);
      
      console.log(`👤 Spawning player ${playerId} at real-world location (${realWorldPoint.latitude.toFixed(6)}, ${realWorldPoint.longitude.toFixed(6)})`);
    } else {
      // Use virtual spawn point
      spawnPoint = this.getRandomSpawnPoint();
      
      console.log(`👤 Spawning player ${playerId} at virtual location (${spawnPoint.x}, ${spawnPoint.y})`);
    }
    
    // Update player location in game state
    this.gameStateUpdater(state => ({
      ...state,
      playerState: {
        ...state.playerState,
        id: playerId,
        location: {
          x: spawnPoint.x,
          y: spawnPoint.y,
          timestamp: Date.now(),
          zone: 'safe',
          realWorldCoordinates: realWorldSpawn
        },
        health: 100,
        maxHealth: 100,
        isAlive: true,
        coins: 0,
        eliminations: 0,
        survivalTime: 0,
        score: 0
      }
    }));
    
    // Initialize player in rules engine
    this.rulesEngine.initializePlayer(playerId);
    
    return spawnPoint;
  }

  /**
   * Handle player movement with ZK proof validation
   * Supports both virtual coordinates and real-world GPS coordinates
   */
  public async movePlayer(
    playerId: string, 
    newPosition: Coordinates | LocationCoordinates, 
    requireProof: boolean = false,
    isRealWorldCoordinate: boolean = false
  ): Promise<{ success: boolean; requiresProof?: boolean; error?: string }> {
    let gamePosition: Coordinates;
    let realWorldLocation: LocationCoordinates | undefined;
    
    if (isRealWorldCoordinate) {
      // Convert real-world coordinates to game coordinates
      const rwPos = newPosition as LocationCoordinates;
      realWorldLocation = rwPos;
      gamePosition = this.realWorldToGameCoordinates(rwPos);
      
      if (!this.isValidRealWorldPosition(rwPos)) {
        return { success: false, error: 'Invalid real-world position - outside arena bounds' };
      }
    } else {
      // Use virtual coordinates directly
      gamePosition = newPosition as Coordinates;
      
      if (!this.isValidPosition(gamePosition)) {
        return { success: false, error: 'Invalid position - outside arena bounds' };
      }
    }
    
    // Check if ZK proof is required
    if (requireProof || this.config.zkSettings.proofRequired) {
      try {
        console.log('🔐 Generating ZK proof for location...');
        
        // Get h3Map from game state - wait for it to be available
        const h3Map = await this.getH3MapFromState();
        if (!h3Map || h3Map.length === 0) {
          console.warn('⚠️ H3 map not yet received from server, proof generation postponed');
          return { 
            success: true, 
            requiresProof: true, 
            error: 'Waiting for arena map data from server' 
          };
        }
        
        // Use real-world coordinates for proof if available, otherwise convert game coordinates
        const proofLocation = realWorldLocation || {
          latitude: gamePosition.y / 100,
          longitude: gamePosition.x / 100
        };
        
        const proofResult = await generateLocationProofControlled(
          proofLocation,
          this.config.zkSettings.h3Resolution,
          h3Map
        );
        
        if (!proofResult.success) {
          console.error('❌ ZK proof generation failed:', proofResult.error);
          return { success: false, error: 'Failed to generate location proof' };
        }
        
        console.log('✅ ZK proof generated successfully');
        
        // Update game state with new location and proof
        this.gameStateUpdater(state => ({
          ...state,
          playerState: {
            ...state.playerState,
            location: {
              x: gamePosition.x,
              y: gamePosition.y,
              timestamp: Date.now(),
              zone: this.isInSafeZone(gamePosition, state.arenaState.currentZone) ? 'safe' : 'danger',
              realWorldCoordinates: realWorldLocation
            }
          },
          zkProofState: {
            ...state.zkProofState,
            validationStatus: ZKProofStatus.VALID,
            lastProof: {
              proof: proofResult.data.proof,
              publicInputs: proofResult.data.public_inputs,
              timestamp: Date.now(),
              location: gamePosition,
              realWorldLocation: realWorldLocation,
              hash: `hash_${Date.now()}`
            } as ZKProofData
          }
        }));
        
      } catch (error) {
        console.error('❌ ZK proof error:', error);
        return { success: false, error: 'ZK proof validation failed' };
      }
    } else {
      // Move without proof (for testing/offline mode)
      this.gameStateUpdater(state => ({
        ...state,
        playerState: {
          ...state.playerState,
          location: {
            x: gamePosition.x,
            y: gamePosition.y,
            timestamp: Date.now(),
            zone: this.isInSafeZone(gamePosition, state.arenaState.currentZone) ? 'safe' : 'danger',
            realWorldCoordinates: realWorldLocation
          }
        }
      }));
    }
    
    return { success: true };
  }

  /**
   * Get current game statistics
   */
  public getGameStats(): {
    playersAlive: number;
    gameTime: number;
    currentZoneRadius: number;
    nextShrinkIn: number;
    realWorldMode: boolean;
    realWorldCenter?: LocationCoordinates;
  } {
    const gameTime = this.state.isRunning ? Date.now() - this.state.gameStartTime : 0;
    const nextShrinkIn = Math.max(0, 
      this.state.lastZoneShrink + this.config.zoneSettings.shrinkInterval - Date.now()
    );
    
    return {
      playersAlive: 1 + Array.from(this.state.botPlayers.values()).filter(bot => bot.isAlive).length,
      gameTime,
      currentZoneRadius: 800, // Would get from game state
      nextShrinkIn,
      realWorldMode: this.state.realWorldMode,
      realWorldCenter: this.state.realWorldCenter
    };
  }

  /**
   * Get bot players for rendering
   */
  public getBotPlayers(): BotPlayer[] {
    return Array.from(this.state.botPlayers.values());
  }

  /**
   * Enable/disable real-world mode
   */
  public setRealWorldMode(enabled: boolean, center?: LocationCoordinates): void {
    this.state.realWorldMode = enabled;
    if (center) {
      this.state.realWorldCenter = center;
      this.config.realWorldSettings.centerLat = center.latitude;
      this.config.realWorldSettings.centerLng = center.longitude;
    }
    
    console.log(`🌍 Real world mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current real-world mode status
   */
  public isRealWorldMode(): boolean {
    return this.state.realWorldMode;
  }

  /**
   * Convert real-world coordinates to game coordinates
   */
  public realWorldToGameCoordinates(location: LocationCoordinates): Coordinates {
    const { centerLat, centerLng, coordinateScale } = this.config.realWorldSettings;
    
    // Convert lat/lng offset from center to game coordinates
    const deltaLat = location.latitude - centerLat;
    const deltaLng = location.longitude - centerLng;
    
    const x = (deltaLng * coordinateScale) + (this.config.arenaSize.width / 2);
    const y = (deltaLat * coordinateScale) + (this.config.arenaSize.height / 2);
    
    return { x, y };
  }

  /**
   * Convert game coordinates to real-world coordinates
   */
  public gameToRealWorldCoordinates(position: Coordinates): LocationCoordinates {
    const { centerLat, centerLng, coordinateScale } = this.config.realWorldSettings;
    
    const deltaX = position.x - (this.config.arenaSize.width / 2);
    const deltaY = position.y - (this.config.arenaSize.height / 2);
    
    const latitude = centerLat + (deltaY / coordinateScale);
    const longitude = centerLng + (deltaX / coordinateScale);
    
    return { latitude, longitude };
  }

  // Private helper methods

  private generateSpawnPoints(): Coordinates[] {
    const points: Coordinates[] = [];
    const { width, height } = this.config.arenaSize;
    // const margin = 100; // Keep spawn points away from edges - TODO: implement spawn point logic
    
    // Generate spawn points in a circle around the center
    const centerX = width / 2;
    const centerY = height / 2;
    const spawnRadius = Math.min(width, height) * 0.3;
    
    for (let i = 0; i < this.config.maxPlayers; i++) {
      const angle = (i / this.config.maxPlayers) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * spawnRadius;
      const y = centerY + Math.sin(angle) * spawnRadius;
      
      points.push({ x, y });
    }
    
    return points;
  }

  private getRandomSpawnPoint(): Coordinates {
    const availableSpawns = this.state.spawnPoints.filter(point => {
      // Check if spawn point is not too close to existing players
      const minDistance = 50;
      for (const bot of this.state.botPlayers.values()) {
        const distance = Math.sqrt(
          Math.pow(bot.position.x - point.x, 2) + 
          Math.pow(bot.position.y - point.y, 2)
        );
        if (distance < minDistance) return false;
      }
      return true;
    });
    
    return availableSpawns.length > 0 
      ? availableSpawns[Math.floor(Math.random() * availableSpawns.length)]
      : this.state.spawnPoints[Math.floor(Math.random() * this.state.spawnPoints.length)];
  }

  private createBotPlayers(): void {
    console.log(`🤖 Creating ${this.config.botCount} bot players...`);
    
    for (let i = 0; i < this.config.botCount; i++) {
      const botId = `bot_${i}`;
      const spawnPoint = this.getRandomSpawnPoint();
      
      const bot: BotPlayer = {
        id: botId,
        position: spawnPoint,
        health: 100,
        isAlive: true,
        lastMove: Date.now(),
        aiState: 'random_movement'
      };
      
      this.state.botPlayers.set(botId, bot);
    }
    
    console.log(`✅ Created ${this.state.botPlayers.size} bot players`);
  }

  private transitionToActivePhase(): void {
    console.log('⚡ Transitioning to active battle phase!');
    
    this.gameStateUpdater(state => ({
      ...state,
      gamePhase: {
        ...state.gamePhase,
        phase: GamePhase.ACTIVE,
        timer: {
          ...state.gamePhase.timer,
          phaseStartTime: Date.now(),
          phaseEndTime: Date.now() + 600000, // 10 minutes active phase
          remainingTime: 600000,
          isRunning: true
        }
      }
    }));
  }

  private startDamageZoneLoop(): void {
    this.state.damageZoneTimer = setInterval(() => {
      this.processDamageZone();
    }, 1000) as unknown as number; // Type assertion for browser compatibility
  }

  private startBotMovementLoop(): void {
    this.state.botMovementTimer = setInterval(() => {
      this.updateBotMovements();
    }, 2000) as unknown as number; // Update bot movements every 2 seconds
  }

  private startZoneShrinkLoop(): void {
    setInterval(() => {
      if (Date.now() - this.state.lastZoneShrink >= this.config.zoneSettings.shrinkInterval) {
        this.shrinkZone();
      }
    }, 1000);
  }

  private processDamageZone(): void {
    if (!this.state.isRunning) return;
    
    // Apply damage to players outside safe zone
    this.gameStateUpdater(state => {
      const isPlayerInSafe = this.isInSafeZone(state.playerState.location, state.arenaState.currentZone);
      
      if (!isPlayerInSafe && state.playerState.isAlive) {
        // Let rules engine handle damage calculation
        return state; // Damage is now handled by rules engine
      }
      
      return state;
    });
    
    // Apply damage to bots
    for (const bot of this.state.botPlayers.values()) {
      if (bot.isAlive) {
        // Check if bot is in safe zone (simplified)
        const distanceFromCenter = Math.sqrt(
          Math.pow(bot.position.x - 1000, 2) + Math.pow(bot.position.y - 1000, 2)
        );
        
        if (distanceFromCenter > 800) { // Outside safe zone
          bot.health = Math.max(0, bot.health - this.config.zoneSettings.damagePerSecond);
          if (bot.health <= 0) {
            bot.isAlive = false;
            console.log(`💀 Bot ${bot.id} eliminated by zone damage`);
          }
        }
      }
    }
  }

  private updateBotMovements(): void {
    if (!this.state.isRunning) return;
    
    for (const bot of this.state.botPlayers.values()) {
      if (!bot.isAlive) continue;
      
      // Simple bot AI: move towards center if outside safe zone
      const distanceFromCenter = Math.sqrt(
        Math.pow(bot.position.x - 1000, 2) + Math.pow(bot.position.y - 1000, 2)
      );
      
      if (distanceFromCenter > 700) {
        // Move towards center
        const angle = Math.atan2(1000 - bot.position.y, 1000 - bot.position.x);
        const moveDistance = 30;
        
        bot.position.x += Math.cos(angle) * moveDistance;
        bot.position.y += Math.sin(angle) * moveDistance;
        bot.aiState = 'moving_to_zone';
      } else {
        // Random movement within safe zone
        const angle = Math.random() * 2 * Math.PI;
        const moveDistance = 20;
        
        const newX = bot.position.x + Math.cos(angle) * moveDistance;
        const newY = bot.position.y + Math.sin(angle) * moveDistance;
        
        if (this.isValidPosition({ x: newX, y: newY })) {
          bot.position.x = newX;
          bot.position.y = newY;
          bot.aiState = 'random_movement';
        }
      }
      
      bot.lastMove = Date.now();
    }
  }

  /**
   * Start rules processing loop
   */
  private startRulesProcessingLoop(): void {
    this.rulesProcessingTimer = setInterval(() => {
      this.processRulesEngine();
    }, 100) as unknown as number; // Process rules 10 times per second
  }

  /**
   * Process game rules and events
   */
  private processRulesEngine(): void {
    if (!this.state.isRunning) return;
    
    this.gameStateUpdater(state => {
      // Create player map for rules engine
      const players = new Map<string, PlayerState>();
      players.set(state.playerState.id, state.playerState);
      
      // Add bot players
      this.state.botPlayers.forEach((bot, id) => {
        players.set(id, {
          id,
          location: { ...bot.position, timestamp: Date.now(), zone: 'unknown' },
          health: bot.health,
          maxHealth: 100,
          proofStatus: ZKProofStatus.NONE,
          isAlive: bot.isAlive,
          lastActivity: bot.lastMove,
          coins: 0,
          eliminations: 0,
          survivalTime: 0,
          score: 0
        });
      });
      
      // Process game tick
      const events = this.rulesEngine.processTick(state, players);
      
      // Handle events
      let newState = { ...state };
      events.forEach(event => {
        newState = this.handleRulesEvent(newState, event);
      });
      
      // Update leaderboard
      const leaderboard = this.rulesEngine.getLeaderboard();
      const leaderboardEntries = leaderboard.map((stats, index) => ({
        playerId: stats.id,
        name: stats.id === state.playerState.id ? 'You' : stats.id,
        coins: stats.coins,
        eliminations: stats.eliminations,
        score: stats.totalScore,
        isAlive: players.get(stats.id)?.isAlive || false,
        rank: index + 1
      }));
      
      return {
        ...newState,
        leaderboard: leaderboardEntries
      };
    });
  }

  /**
   * Handle events from rules engine
   */
  private handleRulesEvent(state: GameState, event: RulesEvent): GameState {
    switch (event.type) {
      case 'coin_earned':
        if (event.playerId === state.playerState.id) {
          return {
            ...state,
            playerState: {
              ...state.playerState,
              coins: event.data.total
            }
          };
        }
        break;
        
      case 'health_changed':
        if (event.playerId === state.playerState.id) {
          const newHealth = event.data.newHealth;
          return {
            ...state,
            playerState: {
              ...state.playerState,
              health: newHealth,
              isAlive: newHealth > 0
            }
          };
        } else {
          // Update bot health
          const bot = this.state.botPlayers.get(event.playerId);
          if (bot) {
            bot.health = event.data.newHealth;
            bot.isAlive = event.data.newHealth > 0;
          }
        }
        break;
        
      case 'warning_issued':
        if (event.playerId === state.playerState.id) {
          const warning = {
            id: `warning_${Date.now()}`,
            message: event.data.message,
            severity: event.data.severity,
            timestamp: event.timestamp,
            expiresAt: event.timestamp + 10000
          };
          return {
            ...state,
            warnings: [...(state.warnings || []), warning].slice(-5)
          };
        }
        break;
        
      case 'player_eliminated':
        if (event.playerId === state.playerState.id) {
          return {
            ...state,
            playerState: {
              ...state.playerState,
              isAlive: false,
              health: 0
            },
            gamePhase: {
              ...state.gamePhase,
              phase: GamePhase.GAME_OVER
            }
          };
        } else {
          // Update bot status
          const bot = this.state.botPlayers.get(event.playerId);
          if (bot) {
            bot.isAlive = false;
            bot.health = 0;
          }
        }
        break;
    }
    
    return state;
  }

  private shrinkZone(): void {
    console.log('🔥 Zone is shrinking!');
    
    this.state.lastZoneShrink = Date.now();
    
    // Get players in current zone before shrinking
    const playersInZone: string[] = [];
    this.gameStateUpdater(state => {
      if (this.isInSafeZone(state.playerState.location, state.arenaState.currentZone)) {
        playersInZone.push(state.playerState.id);
      }
      return state;
    });
    
    this.gameStateUpdater(state => {
      const currentZone = state.arenaState.currentZone;
      const newRadius = currentZone.radius * this.config.zoneSettings.shrinkRate;
      
      const newZone = {
        ...currentZone,
        radius: newRadius,
        shrinkStartTime: Date.now(),
        shrinkEndTime: Date.now() + 30000 // 30 seconds to shrink
      };
      
      // Notify rules engine about zone shrink
      this.rulesEngine.handleZoneShrink(newZone, playersInZone);
      
      return {
        ...state,
        arenaState: {
          ...state.arenaState,
          currentZone: newZone
        },
        gamePhase: {
          ...state.gamePhase,
          phase: GamePhase.ZONE_SHRINKING
        }
      };
    });
    
    // Transition back to active phase after shrinking
    setTimeout(() => {
      this.gameStateUpdater(state => ({
        ...state,
        gamePhase: {
          ...state.gamePhase,
          phase: GamePhase.ACTIVE
        }
      }));
    }, 30000);
  }

  private isValidPosition(position: Coordinates): boolean {
    return position.x >= 0 && position.x <= this.config.arenaSize.width &&
           position.y >= 0 && position.y <= this.config.arenaSize.height;
  }

  private isInSafeZone(position: Coordinates, zone: SafeZone): boolean {
    const distance = Math.sqrt(
      Math.pow(position.x - zone.center.x, 2) + 
      Math.pow(position.y - zone.center.y, 2)
    );
    return distance <= zone.radius;
  }

  private generateRealWorldSpawnPoints(): LocationCoordinates[] {
    const points: LocationCoordinates[] = [];
    const { centerLat, centerLng, radiusKm } = this.config.realWorldSettings;
    
    // Generate spawn points in a circle around the real-world center
    for (let i = 0; i < this.config.maxPlayers; i++) {
      const angle = (i / this.config.maxPlayers) * 2 * Math.PI;
      const distance = radiusKm * 0.7; // 70% of max radius
      
      // Convert km to degrees (approximate)
      const latOffset = (distance / 111) * Math.cos(angle); // 111 km per degree latitude
      const lngOffset = (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
      
      points.push({
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset
      });
    }
    
    return points;
  }

  private isValidRealWorldPosition(location: LocationCoordinates): boolean {
    const { centerLat, centerLng, radiusKm } = this.config.realWorldSettings;
    
    // Calculate distance from center using Haversine formula (simplified)
    const R = 6371; // Earth's radius in km
    const dLat = (location.latitude - centerLat) * Math.PI / 180;
    const dLng = (location.longitude - centerLng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(centerLat * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radiusKm;
  }

  /**
   * Get H3 map from current game state
   */
  private async getH3MapFromState(): Promise<string[] | null> {
    return new Promise((resolve) => {
      this.gameStateUpdater(state => {
        const h3Map = state.arenaState.h3Map;
        resolve(h3Map && h3Map.length > 0 ? h3Map : null);
        return state; // No state change
      });
    });
  }

  /**
   * Request H3 map from server (called during initialization)
   */
  public requestH3MapFromServer(): void {
    if (this.config.enableRealtime) {
      const wsService = getWebSocketService();
      if (wsService.isConnected()) {
        console.log('📍 Requesting H3 map from server...');
        wsService.send('request_h3_map' as any, { 
          gameId: this.currentGameId,
          resolution: this.config.zkSettings.h3Resolution 
        });
      }
    }
  }
}