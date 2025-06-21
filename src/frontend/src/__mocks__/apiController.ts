/**
 * Mock implementation of API Controller
 */

import { GamePhase } from '../types/gameState';
import {
  LocationCoordinates,
  H3Index,
  ProveResult,
  VerifyResult,
  ProofRequestOptions,
  ZkProof
} from '../types/zkProof';

// Mock successful proof generation
const mockGenerateProof = jest.fn(async (
  coordinates: LocationCoordinates,
  resolution: number,
  h3Map: H3Index[],
  options?: ProofRequestOptions
): Promise<ProveResult> => {
  return {
    success: true,
    data: {
      proof: 'mock_proof_' + Date.now(),
      public_inputs: [coordinates.latitude, coordinates.longitude, resolution],
      metadata: {
        generated_at: new Date().toISOString(),
        location: coordinates,
        resolution,
        h3_indices: h3Map
      }
    } as ZkProof
  };
});

// Mock successful proof verification
const mockVerifyProof = jest.fn(async (
  proof: string,
  publicInputs: unknown[],
  options?: ProofRequestOptions
): Promise<VerifyResult> => {
  return {
    success: true,
    data: {
      valid: true,
      message: 'Proof verified successfully'
    }
  };
});

// Mock API controller instance
export const apiController = {
  setGamePhase: jest.fn(),
  getGamePhase: jest.fn(() => GamePhase.ACTIVE),
  generateProof: mockGenerateProof,
  verifyProof: mockVerifyProof,
  getStats: jest.fn(() => ({
    totalCalls: 0,
    blockedCalls: 0,
    allowedCalls: 0,
    lastBlockedReason: '',
    callsByPhase: {
      [GamePhase.LOBBY]: 0,
      [GamePhase.PREPARATION]: 0,
      [GamePhase.ACTIVE]: 0,
      [GamePhase.SHRINKING]: 0,
      [GamePhase.ZONE_SHRINKING]: 0,
      [GamePhase.FINAL_ZONE]: 0,
      [GamePhase.GAME_OVER]: 0,
      [GamePhase.ENDED]: 0
    }
  })),
  resetStats: jest.fn(),
  setMinProofInterval: jest.fn(),
  getTimeUntilNextProof: jest.fn(() => 0)
};

// Export convenience functions
export const generateLocationProofControlled = mockGenerateProof;
export const verifyLocationProofControlled = mockVerifyProof;