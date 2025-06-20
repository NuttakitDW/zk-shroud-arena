/**
 * Core Game Engine for ZK Shroud Arena
 * Orchestrates all game systems and provides unified interface
 */

import { 
  GameState, 
  GamePhase, 
  PlayerLocation, 
  SafeZone, 
  Coordinates,
  ZKProofStatus,
  ZKProofData
} from '../../types/gameState';
import { generateLocationProof, verifyLocationProof } from '../../services/zkProofService';
import { getWebSocketService } from '../../services/websocketService';

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
  damageZoneTimer?: number;
  botMovementTimer?: number;
  lastZoneShrink: number;
}

export class GameEngine {
  private config: GameEngineConfig;
  private state: GameEngineState;
  private gameStateUpdater: (updater: (state: GameState) => GameState) => void;
  
  constructor(
    config: Partial<GameEngineConfig> = {},
    gameStateUpdater: (updater: (state: GameState) => GameState) => void
  ) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.gameStateUpdater = gameStateUpdater;
    
    this.state = {
      isRunning: false,
      gameStartTime: 0,
      botPlayers: new Map(),
      spawnPoints: this.generateSpawnPoints(),
      lastZoneShrink: 0
    };
  }

  /**
   * Initialize and start the game engine
   */
  public async initialize(): Promise<void> {
    console.log('🎮 Initializing ZK Shroud Arena Game Engine...');
    
    // Initialize spawn points
    this.state.spawnPoints = this.generateSpawnPoints();
    
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
    
    console.log('✅ Game Engine initialized successfully');
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
   * Spawn player at random spawn point
   */
  public spawnPlayer(playerId: string): Coordinates {
    const spawnPoint = this.getRandomSpawnPoint();
    
    console.log(`👤 Spawning player ${playerId} at (${spawnPoint.x}, ${spawnPoint.y})`);
    
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
          zone: 'safe'
        },
        health: 100,
        maxHealth: 100,
        isAlive: true
      }
    }));
    
    return spawnPoint;
  }

  /**
   * Handle player movement with ZK proof validation
   */
  public async movePlayer(
    playerId: string, 
    newPosition: Coordinates, 
    requireProof: boolean = false
  ): Promise<{ success: boolean; requiresProof?: boolean; error?: string }> {
    
    // Basic position validation
    if (!this.isValidPosition(newPosition)) {
      return { success: false, error: 'Invalid position - outside arena bounds' };
    }
    
    // Check if ZK proof is required
    if (requireProof || this.config.zkSettings.proofRequired) {
      try {
        console.log('🔐 Generating ZK proof for location...');
        
        // Generate H3 indices for the area (simplified)
        const h3Map = [`h3_${Math.floor(newPosition.x / 100)}_${Math.floor(newPosition.y / 100)}`];
        
        const proofResult = await generateLocationProof(
          { lat: newPosition.y / 100, lon: newPosition.x / 100 },
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
              x: newPosition.x,
              y: newPosition.y,
              timestamp: Date.now(),
              zone: this.isInSafeZone(newPosition, state.arenaState.currentZone) ? 'safe' : 'danger'
            }
          },
          zkProofState: {
            ...state.zkProofState,
            validationStatus: ZKProofStatus.VALID,
            lastProof: {
              proof: proofResult.data.proof,
              publicInputs: proofResult.data.public_inputs,
              timestamp: Date.now(),
              location: newPosition,
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
            x: newPosition.x,
            y: newPosition.y,
            timestamp: Date.now(),
            zone: this.isInSafeZone(newPosition, state.arenaState.currentZone) ? 'safe' : 'danger'
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
  } {
    const gameTime = this.state.isRunning ? Date.now() - this.state.gameStartTime : 0;
    const nextShrinkIn = Math.max(0, 
      this.state.lastZoneShrink + this.config.zoneSettings.shrinkInterval - Date.now()
    );
    
    return {
      playersAlive: 1 + Array.from(this.state.botPlayers.values()).filter(bot => bot.isAlive).length,
      gameTime,
      currentZoneRadius: 800, // Would get from game state
      nextShrinkIn
    };
  }

  /**
   * Get bot players for rendering
   */
  public getBotPlayers(): BotPlayer[] {
    return Array.from(this.state.botPlayers.values());
  }

  // Private helper methods

  private generateSpawnPoints(): Coordinates[] {
    const points: Coordinates[] = [];
    const { width, height } = this.config.arenaSize;
    const margin = 100; // Keep spawn points away from edges
    
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
    }, 1000) as any; // Type assertion for Node.js/browser compatibility
  }

  private startBotMovementLoop(): void {
    this.state.botMovementTimer = setInterval(() => {
      this.updateBotMovements();
    }, 2000) as any; // Update bot movements every 2 seconds
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
        const newHealth = Math.max(0, state.playerState.health - this.config.zoneSettings.damagePerSecond);
        
        return {
          ...state,
          playerState: {
            ...state.playerState,
            health: newHealth,
            isAlive: newHealth > 0
          }
        };
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

  private shrinkZone(): void {
    console.log('🔥 Zone is shrinking!');
    
    this.state.lastZoneShrink = Date.now();
    
    this.gameStateUpdater(state => {
      const currentZone = state.arenaState.currentZone;
      const newRadius = currentZone.radius * this.config.zoneSettings.shrinkRate;
      
      return {
        ...state,
        arenaState: {
          ...state.arenaState,
          currentZone: {
            ...currentZone,
            radius: newRadius,
            shrinkStartTime: Date.now(),
            shrinkEndTime: Date.now() + 30000 // 30 seconds to shrink
          }
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
}