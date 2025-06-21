/**
 * Game Rules Engine for ZK Shroud Arena
 * Manages coin earning, player elimination, and zone-based rewards
 */

import { 
  GameState, 
  PlayerState, 
  SafeZone, 
  Coordinates,
  GamePhase 
} from '../../types/gameState';

export interface CoinRewardConfig {
  baseCoinsPerSecond: number;
  zoneOccupancyBonus: number;
  multiZoneBonus: number;
  eliminationReward: number;
  survivalBonus: number;
  finalZoneMultiplier: number;
}

export interface EliminationConfig {
  gracePeriodSeconds: number;
  damagePerSecondOutsideZone: number;
  instantDeathOnZoneClose: boolean;
  eliminationCoinReward: number;
  healthKitHealAmount: number;
}

export interface GameRulesConfig {
  coins: CoinRewardConfig;
  elimination: EliminationConfig;
  zones: {
    shrinkIntervalSeconds: number;
    shrinkPercentage: number;
    finalZoneRadius: number;
    warningPeriodSeconds: number;
  };
  scoring: {
    survivalTimeWeight: number;
    eliminationWeight: number;
    coinWeight: number;
  };
}

export const DEFAULT_RULES_CONFIG: GameRulesConfig = {
  coins: {
    baseCoinsPerSecond: 1,
    zoneOccupancyBonus: 2,
    multiZoneBonus: 1.5,
    eliminationReward: 50,
    survivalBonus: 10,
    finalZoneMultiplier: 3
  },
  elimination: {
    gracePeriodSeconds: 5,
    damagePerSecondOutsideZone: 10,
    instantDeathOnZoneClose: false,
    eliminationCoinReward: 50,
    healthKitHealAmount: 50
  },
  zones: {
    shrinkIntervalSeconds: 120,
    shrinkPercentage: 20,
    finalZoneRadius: 100,
    warningPeriodSeconds: 30
  },
  scoring: {
    survivalTimeWeight: 1,
    eliminationWeight: 100,
    coinWeight: 0.1
  }
};

export interface PlayerGameStats {
  id: string;
  coins: number;
  eliminations: number;
  survivalTime: number;
  damageDealt: number;
  damageReceived: number;
  zonesVisited: string[];
  lastZoneEntryTime: number;
  inZoneSince: number;
  gracePeriodEnds: number;
  totalScore: number;
}

export interface GameEvent {
  type: 'coin_earned' | 'player_eliminated' | 'zone_changed' | 'health_changed' | 'warning_issued';
  playerId: string;
  data: any;
  timestamp: number;
}

export class GameRulesEngine {
  private config: GameRulesConfig;
  private playerStats: Map<string, PlayerGameStats>;
  private eventQueue: GameEvent[];
  private lastUpdateTime: number;
  private gameStartTime: number;
  
  constructor(config: Partial<GameRulesConfig> = {}) {
    this.config = { ...DEFAULT_RULES_CONFIG, ...config };
    this.playerStats = new Map();
    this.eventQueue = [];
    this.lastUpdateTime = Date.now();
    this.gameStartTime = Date.now();
  }

  /**
   * Initialize player stats
   */
  public initializePlayer(playerId: string): void {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        id: playerId,
        coins: 0,
        eliminations: 0,
        survivalTime: 0,
        damageDealt: 0,
        damageReceived: 0,
        zonesVisited: [],
        lastZoneEntryTime: Date.now(),
        inZoneSince: Date.now(),
        gracePeriodEnds: Date.now() + (this.config.elimination.gracePeriodSeconds * 1000),
        totalScore: 0
      });
    }
  }

  /**
   * Process game tick - handles all time-based mechanics
   */
  public processTick(gameState: GameState, players: Map<string, PlayerState>): GameEvent[] {
    const now = Date.now();
    let deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    
    // Ensure minimum delta time for calculations
    if (deltaTime === 0 || deltaTime > 10) {
      deltaTime = 0.1; // 100ms minimum
    }
    
    this.lastUpdateTime = now;
    this.eventQueue = [];

    // Process each player
    players.forEach((player, playerId) => {
      if (!player.isAlive) return;
      
      this.initializePlayer(playerId);
      const stats = this.playerStats.get(playerId)!;
      
      // Update survival time
      stats.survivalTime = (now - this.gameStartTime) / 1000;
      
      // Check zone status and process accordingly
      const isInSafeZone = this.isPlayerInSafeZone(player.location, gameState.arenaState.currentZone);
      
      if (isInSafeZone) {
        this.processPlayerInZone(playerId, stats, deltaTime, gameState.gamePhase.phase);
      } else {
        this.processPlayerOutsideZone(playerId, player, stats, deltaTime, now);
      }
      
      // Update total score
      stats.totalScore = this.calculatePlayerScore(stats);
    });
    
    return this.eventQueue;
  }

  /**
   * Process player in safe zone - earn coins
   */
  private processPlayerInZone(
    playerId: string, 
    stats: PlayerGameStats, 
    deltaTime: number,
    gamePhase: GamePhase
  ): void {
    // Calculate coins earned
    let coinsPerSecond = this.config.coins.baseCoinsPerSecond;
    
    // Zone occupancy bonus
    const timeInZone = (Date.now() - stats.inZoneSince) / 1000;
    if (timeInZone > 10) {
      coinsPerSecond += this.config.coins.zoneOccupancyBonus;
    }
    
    // Final zone multiplier (applied AFTER other bonuses)
    if (gamePhase === GamePhase.FINAL_ZONE) {
      coinsPerSecond *= this.config.coins.finalZoneMultiplier;
    }
    
    // Calculate coins earned based on time (with minimum threshold)
    const rawCoins = coinsPerSecond * deltaTime;
    const coinsEarned = rawCoins >= 0.5 ? Math.floor(rawCoins) : (Math.random() < rawCoins ? 1 : 0);
    
    if (coinsEarned > 0) {
      stats.coins += coinsEarned;
      this.eventQueue.push({
        type: 'coin_earned',
        playerId,
        data: { amount: coinsEarned, total: stats.coins },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Process player outside safe zone - take damage
   */
  private processPlayerOutsideZone(
    playerId: string,
    player: PlayerState,
    stats: PlayerGameStats,
    deltaTime: number,
    now: number
  ): void {
    // Check grace period
    if (now < stats.gracePeriodEnds) {
      const remainingGrace = Math.ceil((stats.gracePeriodEnds - now) / 1000);
      if (remainingGrace <= 5) {
        this.eventQueue.push({
          type: 'warning_issued',
          playerId,
          data: { 
            message: `Grace period ending in ${remainingGrace} seconds!`,
            severity: 'high'
          },
          timestamp: now
        });
      }
      return;
    }
    
    // Apply damage (at least 1 damage per tick)
    const damage = Math.max(1, Math.floor(this.config.elimination.damagePerSecondOutsideZone * deltaTime));
    stats.damageReceived += damage;
    this.eventQueue.push({
      type: 'health_changed',
      playerId,
      data: { 
        damage,
        newHealth: Math.max(0, player.health - damage),
        reason: 'zone_damage'
      },
      timestamp: now
    });
    
    // Warning when health is low
    if (player.health - damage <= 20 && player.health > 20) {
      this.eventQueue.push({
        type: 'warning_issued',
        playerId,
        data: { 
          message: 'Critical health! Get to the safe zone!',
          severity: 'critical'
        },
        timestamp: now
      });
    }
  }

  /**
   * Handle player elimination
   */
  public handleElimination(
    eliminatedPlayerId: string,
    eliminatorPlayerId?: string
  ): void {
    const eliminatedStats = this.playerStats.get(eliminatedPlayerId);
    if (!eliminatedStats) return;
    
    // Award coins to eliminator
    if (eliminatorPlayerId) {
      const eliminatorStats = this.playerStats.get(eliminatorPlayerId);
      if (eliminatorStats) {
        eliminatorStats.eliminations++;
        eliminatorStats.coins += this.config.coins.eliminationReward;
        
        this.eventQueue.push({
          type: 'coin_earned',
          playerId: eliminatorPlayerId,
          data: { 
            amount: this.config.coins.eliminationReward,
            total: eliminatorStats.coins,
            reason: 'elimination'
          },
          timestamp: Date.now()
        });
      }
    }
    
    this.eventQueue.push({
      type: 'player_eliminated',
      playerId: eliminatedPlayerId,
      data: {
        finalStats: eliminatedStats,
        eliminatedBy: eliminatorPlayerId || 'zone'
      },
      timestamp: Date.now()
    });
  }

  /**
   * Handle zone change/shrink
   */
  public handleZoneShrink(
    newZone: SafeZone,
    playersInOldZone: string[]
  ): void {
    // Award survival bonus to players who were in the old zone
    playersInOldZone.forEach(playerId => {
      const stats = this.playerStats.get(playerId);
      if (stats) {
        stats.coins += this.config.coins.survivalBonus;
        this.eventQueue.push({
          type: 'coin_earned',
          playerId,
          data: { 
            amount: this.config.coins.survivalBonus,
            total: stats.coins,
            reason: 'zone_survival'
          },
          timestamp: Date.now()
        });
      }
    });
    
    this.eventQueue.push({
      type: 'zone_changed',
      playerId: 'system',
      data: { 
        newZone,
        radius: newZone.radius,
        center: newZone.center
      },
      timestamp: Date.now()
    });
  }

  /**
   * Get countdown timers
   */
  public getTimers(gameState: GameState): {
    zoneCountdown: number;
    warningActive: boolean;
    phaseTimeRemaining: number;
  } {
    const now = Date.now();
    const phaseEndTime = gameState.gamePhase.timer.phaseEndTime;
    const phaseTimeRemaining = Math.max(0, phaseEndTime - now);
    
    // Zone countdown
    let zoneCountdown = phaseTimeRemaining;
    if (gameState.gamePhase.phase === GamePhase.ACTIVE) {
      const nextShrinkTime = gameState.arenaState.currentZone.shrinkStartTime || 
                           (phaseEndTime - this.config.zones.warningPeriodSeconds * 1000);
      zoneCountdown = Math.max(0, nextShrinkTime - now);
    }
    
    const warningActive = zoneCountdown <= this.config.zones.warningPeriodSeconds * 1000;
    
    return {
      zoneCountdown,
      warningActive,
      phaseTimeRemaining
    };
  }

  /**
   * Calculate player score
   */
  private calculatePlayerScore(stats: PlayerGameStats): number {
    return Math.floor(
      stats.survivalTime * this.config.scoring.survivalTimeWeight +
      stats.eliminations * this.config.scoring.eliminationWeight +
      stats.coins * this.config.scoring.coinWeight
    );
  }

  /**
   * Get leaderboard data
   */
  public getLeaderboard(): PlayerGameStats[] {
    return Array.from(this.playerStats.values())
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Get player stats
   */
  public getPlayerStats(playerId: string): PlayerGameStats | undefined {
    return this.playerStats.get(playerId);
  }

  /**
   * Check if player is in safe zone
   */
  private isPlayerInSafeZone(location: Coordinates, zone: SafeZone): boolean {
    const distance = Math.sqrt(
      Math.pow(location.x - zone.center.x, 2) +
      Math.pow(location.y - zone.center.y, 2)
    );
    return distance <= zone.radius;
  }

  /**
   * Reset engine for new game
   */
  public reset(): void {
    this.playerStats.clear();
    this.eventQueue = [];
    this.lastUpdateTime = Date.now();
    this.gameStartTime = Date.now();
  }

  /**
   * Get all pending events
   */
  public getEvents(): GameEvent[] {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }
}