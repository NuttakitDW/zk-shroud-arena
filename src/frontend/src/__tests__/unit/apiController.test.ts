/**
 * API Controller Unit Tests
 */

// Mock the phaseManager first (before importing apiController)
jest.mock('../../services/phaseManager', () => {
  // Need to use string values since GamePhase enum is not available in mock scope
  let currentPhase = 'lobby';
  
  const phaseManager = {
    getCurrentPhase: jest.fn(() => currentPhase),
    setPhase: jest.fn((phase) => { 
      currentPhase = phase.toLowerCase();
    }),
    isActionAllowed: jest.fn((action) => {
      const phase = currentPhase.toLowerCase();
      if (phase === 'lobby') return false;
      if (phase === 'game_over') return false;
      if (phase === 'ended') return false;
      if (action === 'canGenerateProofs' && phase === 'preparation') return true;
      if (action === 'canGenerateProofs' || action === 'canVerifyProofs') {
        return ['active', 'shrinking', 'zone_shrinking', 'final_zone'].includes(phase);
      }
      return false;
    })
  };
  
  return { phaseManager };
});

// Mock the zkProofService to return successful results without phase checks
jest.mock('../../services/zkProofService');

// Import after all mocks are set up
import { GamePhase } from '../../types/gameState';
import { LocationCoordinates } from '../../types/zkProof';
import { apiController } from '../../services/apiController';
import { zkProofService } from '../../services/zkProofService';

// Set up zkProofService mock implementation
const mockZkProofService = zkProofService as jest.Mocked<typeof zkProofService>;
mockZkProofService.generateProof = jest.fn().mockResolvedValue({
  success: true,
  data: {
    proof: 'mock_proof',
    public_inputs: [1, 2, 3],
    metadata: {}
  }
});
mockZkProofService.verifyProof = jest.fn().mockResolvedValue({
  success: true,
  data: {
    valid: true,
    message: 'Valid'
  }
});

describe('API Controller', () => {
  const mockLocation: LocationCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194
  };
  const mockH3Map = ['85283473fffffff'];

  beforeEach(() => {
    jest.clearAllMocks();
    apiController.resetStats();
    apiController.setGamePhase(GamePhase.LOBBY);
  });

  describe('Phase-based API Control', () => {
    it('should block API calls during LOBBY phase', async () => {
      apiController.setGamePhase(GamePhase.LOBBY);
      
      const result = await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate proofs during lobby phase');
      
      const stats = apiController.getStats();
      expect(stats.blockedCalls).toBe(1);
      expect(stats.allowedCalls).toBe(0);
    });

    it('should allow API calls during ACTIVE phase', async () => {
      apiController.setGamePhase(GamePhase.ACTIVE);
      
      const result = await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      expect(result.success).toBe(true);
      
      const stats = apiController.getStats();
      expect(stats.blockedCalls).toBe(0);
      expect(stats.allowedCalls).toBe(1);
    });

    it('should allow API calls during SHRINKING phase', async () => {
      apiController.setGamePhase(GamePhase.SHRINKING);
      
      const result = await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      expect(result.success).toBe(true);
    });

    it('should block API calls during GAME_OVER phase', async () => {
      apiController.setGamePhase(GamePhase.GAME_OVER);
      
      const result = await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate proofs during game_over phase');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce minimum interval between proofs', async () => {
      apiController.setGamePhase(GamePhase.ACTIVE);
      apiController.setMinProofInterval(1000); // 1 second
      
      // First call should succeed
      const result1 = await apiController.generateProof(mockLocation, 9, mockH3Map);
      expect(result1.success).toBe(true);
      
      // Immediate second call should be blocked
      const result2 = await apiController.generateProof(mockLocation, 9, mockH3Map);
      expect(result2.success).toBe(false);
      expect(result2.error?.message).toContain('Please wait');
      
      const stats = apiController.getStats();
      expect(stats.allowedCalls).toBe(1);
      expect(stats.blockedCalls).toBe(1);
    });

    it('should allow forced proof generation', async () => {
      apiController.setGamePhase(GamePhase.ACTIVE);
      apiController.setMinProofInterval(1000);
      
      // First call
      await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      // Forced second call should succeed
      const result2 = await apiController.generateProof(mockLocation, 9, mockH3Map, { force: true });
      expect(result2.success).toBe(true);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track calls by phase', async () => {
      // Make calls in different phases
      apiController.setGamePhase(GamePhase.LOBBY);
      await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      apiController.setGamePhase(GamePhase.ACTIVE);
      await apiController.generateProof(mockLocation, 9, mockH3Map);
      await apiController.verifyProof('proof', [1, 2, 3]);
      
      const stats = apiController.getStats();
      expect(stats.callsByPhase[GamePhase.LOBBY]).toBe(1);
      expect(stats.callsByPhase[GamePhase.ACTIVE]).toBe(2);
      expect(stats.totalCalls).toBe(3);
    });

    it('should track last blocked reason', async () => {
      apiController.setGamePhase(GamePhase.LOBBY);
      await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      const stats = apiController.getStats();
      expect(stats.lastBlockedReason).toContain('Proof generation not allowed in lobby phase');
    });
  });

  describe('Time Until Next Proof', () => {
    it('should calculate time until next proof correctly', async () => {
      apiController.setGamePhase(GamePhase.ACTIVE);
      apiController.setMinProofInterval(5000); // 5 seconds
      
      await apiController.generateProof(mockLocation, 9, mockH3Map);
      
      const timeRemaining = apiController.getTimeUntilNextProof();
      expect(timeRemaining).toBeGreaterThan(4000);
      expect(timeRemaining).toBeLessThanOrEqual(5000);
    });
  });
});