/**
 * GameRulesEngine Unit Tests
 */

import { GameRulesEngine, DEFAULT_RULES_CONFIG } from '../../components/game/GameRulesEngine';
import { GameState, PlayerState, GamePhase, ZKProofStatus } from '../../types/gameState';

describe('GameRulesEngine', () => {
  let rulesEngine: GameRulesEngine;
  let mockGameState: GameState;
  let mockPlayers: Map<string, PlayerState>;

  beforeEach(() => {
    jest.useFakeTimers();
    rulesEngine = new GameRulesEngine();
    
    mockGameState = {
      playerState: {
        id: 'player1',
        location: { x: 500, y: 500, timestamp: Date.now(), zone: 'safe' },
        health: 100,
        maxHealth: 100,
        proofStatus: ZKProofStatus.NONE,
        isAlive: true,
        lastActivity: Date.now(),
        coins: 0,
        eliminations: 0,
        survivalTime: 0,
        score: 0
      },
      arenaState: {
        currentZone: {
          id: 'zone1',
          center: { x: 500, y: 500 },
          radius: 300,
          isActive: true
        },
        shrinkTimer: 0,
        safeZones: [],
        arenaSize: { width: 1000, height: 1000 },
        dangerZones: [],
        h3Map: [],
        h3Resolution: 9
      },
      gamePhase: {
        phase: GamePhase.ACTIVE,
        timer: {
          totalTime: 600000,
          remainingTime: 300000,
          phaseStartTime: Date.now() - 300000,
          phaseEndTime: Date.now() + 300000,
          isRunning: true
        },
        playerCount: 10,
        maxPlayers: 100,
        minPlayers: 2,
        roundNumber: 1
      },
      zkProofState: {
        validationStatus: ZKProofStatus.NONE,
        errors: [],
        proofHistory: [],
        nextProofRequired: Date.now() + 60000,
        proofCooldown: 30000
      },
      realtimeState: {
        connectionStatus: 'connected',
        lastUpdate: Date.now(),
        updates: [],
        latency: 50
      },
      gameId: 'test-game',
      lastUpdated: Date.now()
    };

    mockPlayers = new Map();
    mockPlayers.set('player1', mockGameState.playerState);
  });

  describe('Player Initialization', () => {
    it('should initialize player stats correctly', () => {
      rulesEngine.initializePlayer('player2');
      const stats = rulesEngine.getPlayerStats('player2');
      
      expect(stats).toBeDefined();
      expect(stats?.coins).toBe(0);
      expect(stats?.eliminations).toBe(0);
      expect(stats?.survivalTime).toBe(0);
      expect(stats?.totalScore).toBe(0);
    });
  });

  describe('Coin Earning System', () => {
    it('should earn coins when in safe zone', () => {
      // Process first tick to initialize
      rulesEngine.processTick(mockGameState, mockPlayers);
      
      // Simulate 1 second passing
      jest.advanceTimersByTime(1000);
      
      // Process second tick after time has passed
      const events = rulesEngine.processTick(mockGameState, mockPlayers);
      
      // Should have coin earned event
      const coinEvent = events.find(e => e.type === 'coin_earned');
      expect(coinEvent).toBeDefined();
      expect(coinEvent?.data.amount).toBeGreaterThan(0);
    });

    it('should apply zone occupancy bonus after 10 seconds', () => {
      // Initialize and set time in zone
      rulesEngine.processTick(mockGameState, mockPlayers);
      const stats = rulesEngine.getPlayerStats('player1');
      
      // Mock 11 seconds in zone
      if (stats) {
        stats.inZoneSince = Date.now() - 11000;
      }
      
      // Advance time by 1 second for calculation
      jest.advanceTimersByTime(1000);
      
      const events = rulesEngine.processTick(mockGameState, mockPlayers);
      const coinEvent = events.find(e => e.type === 'coin_earned');
      
      // Should earn base + bonus coins (for 1 second)
      expect(coinEvent).toBeDefined();
      expect(coinEvent?.data.amount).toBe(
        Math.floor(DEFAULT_RULES_CONFIG.coins.baseCoinsPerSecond + 
        DEFAULT_RULES_CONFIG.coins.zoneOccupancyBonus)
      );
    });

    it('should apply final zone multiplier', () => {
      mockGameState.gamePhase.phase = GamePhase.FINAL_ZONE;
      
      // Initialize
      rulesEngine.processTick(mockGameState, mockPlayers);
      
      // Advance time
      jest.advanceTimersByTime(1000);
      
      const events = rulesEngine.processTick(mockGameState, mockPlayers);
      const coinEvent = events.find(e => e.type === 'coin_earned');
      
      // Should have multiplied coins
      expect(coinEvent).toBeDefined();
      expect(coinEvent?.data.amount).toBe(
        Math.floor(DEFAULT_RULES_CONFIG.coins.baseCoinsPerSecond * 
        DEFAULT_RULES_CONFIG.coins.finalZoneMultiplier)
      );
    });
  });

  describe('Damage System', () => {
    it('should not take damage during grace period', () => {
      // Move player outside safe zone
      mockGameState.playerState.location = { x: 100, y: 100, timestamp: Date.now(), zone: 'danger' };
      
      // Initialize with grace period
      rulesEngine.initializePlayer('player1');
      
      const events = rulesEngine.processTick(mockGameState, mockPlayers);
      const healthEvent = events.find(e => e.type === 'health_changed');
      
      expect(healthEvent).toBeUndefined();
    });

    it('should take damage when outside safe zone after grace period', () => {
      // Move player outside safe zone
      mockGameState.playerState.location = { x: 100, y: 100, timestamp: Date.now(), zone: 'danger' };
      
      // Initialize
      rulesEngine.processTick(mockGameState, mockPlayers);
      const stats = rulesEngine.getPlayerStats('player1');
      if (stats) {
        stats.gracePeriodEnds = Date.now() - 1000; // Expired
      }
      
      // Advance time
      jest.advanceTimersByTime(1000);
      
      const events = rulesEngine.processTick(mockGameState, mockPlayers);
      const healthEvent = events.find(e => e.type === 'health_changed');
      
      expect(healthEvent).toBeDefined();
      expect(healthEvent?.data.damage).toBeGreaterThan(0);
    });

    it('should issue warning when grace period is ending', () => {
      mockGameState.playerState.location = { x: 100, y: 100, timestamp: Date.now(), zone: 'danger' };
      
      rulesEngine.initializePlayer('player1');
      const stats = rulesEngine.getPlayerStats('player1');
      if (stats) {
        stats.gracePeriodEnds = Date.now() + 3000; // 3 seconds remaining
      }
      
      const events = rulesEngine.processTick(mockGameState, mockPlayers);
      const warningEvent = events.find(e => e.type === 'warning_issued');
      
      expect(warningEvent).toBeDefined();
      expect(warningEvent?.data.severity).toBe('high');
    });
  });

  describe('Elimination System', () => {
    it('should handle player elimination and award coins to eliminator', () => {
      rulesEngine.initializePlayer('player1');
      rulesEngine.initializePlayer('player2');
      
      rulesEngine.handleElimination('player1', 'player2');
      
      const player2Stats = rulesEngine.getPlayerStats('player2');
      expect(player2Stats?.eliminations).toBe(1);
      expect(player2Stats?.coins).toBe(DEFAULT_RULES_CONFIG.coins.eliminationReward);
    });

    it('should handle zone elimination without eliminator', () => {
      rulesEngine.initializePlayer('player1');
      
      const events: any[] = [];
      rulesEngine.handleElimination('player1');
      
      // Get events after elimination
      const allEvents = rulesEngine.getEvents();
      const eliminationEvent = allEvents.find(e => e.type === 'player_eliminated');
      
      expect(eliminationEvent).toBeDefined();
      expect(eliminationEvent?.data.eliminatedBy).toBe('zone');
    });
  });

  describe('Zone Shrink Rewards', () => {
    it('should award survival bonus when zone shrinks', () => {
      rulesEngine.initializePlayer('player1');
      
      const newZone = {
        id: 'zone2',
        center: { x: 500, y: 500 },
        radius: 200,
        isActive: true
      };
      
      rulesEngine.handleZoneShrink(newZone, ['player1']);
      
      const events = rulesEngine.getEvents();
      const coinEvent = events.find(e => e.type === 'coin_earned' && e.data.reason === 'zone_survival');
      
      expect(coinEvent).toBeDefined();
      expect(coinEvent?.data.amount).toBe(DEFAULT_RULES_CONFIG.coins.survivalBonus);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate total score correctly', () => {
      // Initialize player
      rulesEngine.processTick(mockGameState, mockPlayers);
      
      // Get stats and manually set values
      const stats = rulesEngine.getPlayerStats('player1');
      if (stats) {
        stats.eliminations = 3;
        stats.coins = 150;
      }
      
      // Advance time by 2 minutes (120 seconds)
      jest.advanceTimersByTime(120000);
      
      // Process tick to update survival time and score
      rulesEngine.processTick(mockGameState, mockPlayers);
      
      const updatedStats = rulesEngine.getPlayerStats('player1');
      const expectedScore = Math.floor(
        120 * DEFAULT_RULES_CONFIG.scoring.survivalTimeWeight +
        3 * DEFAULT_RULES_CONFIG.scoring.eliminationWeight +
        150 * DEFAULT_RULES_CONFIG.scoring.coinWeight
      );
      
      expect(updatedStats?.totalScore).toBe(expectedScore);
    });
  });

  describe('Leaderboard', () => {
    it('should return players sorted by score', () => {
      // Create multiple players
      for (let i = 1; i <= 3; i++) {
        rulesEngine.initializePlayer(`player${i}`);
        const stats = rulesEngine.getPlayerStats(`player${i}`);
        if (stats) {
          stats.totalScore = i * 100; // Different scores
        }
      }
      
      const leaderboard = rulesEngine.getLeaderboard();
      
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].totalScore).toBe(300); // Highest score first
      expect(leaderboard[1].totalScore).toBe(200);
      expect(leaderboard[2].totalScore).toBe(100);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});