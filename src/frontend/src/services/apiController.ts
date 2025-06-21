/**
 * API Controller Service
 * Controls API calls based on game phase to prevent unnecessary backend requests
 */

import { GamePhase } from '../types/gameState';
import { zkProofService } from './zkProofService';
import { phaseManager } from './phaseManager';
import {
  LocationCoordinates,
  H3Index,
  ProveResult,
  VerifyResult,
  ProofRequestOptions,
  ZkProofError,
  ZkProofErrorType
} from '../types/zkProof';

// Define which API operations are allowed in each game phase
const PHASE_PERMISSIONS: Record<GamePhase, string[]> = {
  [GamePhase.LOBBY]: [], // No API calls allowed
  [GamePhase.PREPARATION]: ['generateProof'], // Allow test proofs during preparation
  [GamePhase.ACTIVE]: ['generateProof', 'verifyProof'],
  [GamePhase.SHRINKING]: ['generateProof', 'verifyProof'], 
  [GamePhase.ZONE_SHRINKING]: ['generateProof', 'verifyProof'],
  [GamePhase.FINAL_ZONE]: ['generateProof', 'verifyProof'],
  [GamePhase.GAME_OVER]: [], // No API calls allowed
  [GamePhase.ENDED]: [] // No API calls allowed
};

// Track API call statistics
interface APICallStats {
  totalCalls: number;
  blockedCalls: number;
  allowedCalls: number;
  lastBlockedReason: string;
  callsByPhase: Record<GamePhase, number>;
}

class APIController {
  private currentPhase: GamePhase = GamePhase.LOBBY;
  private stats: APICallStats = {
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
  };
  private lastProofTime: number = 0;
  private minProofInterval: number = 30000; // 30 seconds minimum between proofs

  /**
   * Update the current game phase
   */
  public setGamePhase(phase: GamePhase): void {
    console.log(`🎮 API Controller: Game phase changed from ${this.currentPhase} to ${phase}`);
    this.currentPhase = phase;
    // Sync with phase manager
    phaseManager.setPhase(phase, 'server');
  }

  /**
   * Get current game phase
   */
  public getGamePhase(): GamePhase {
    // Always use phase manager as source of truth
    return phaseManager.getCurrentPhase();
  }

  /**
   * Check if an API operation is allowed in the current phase
   */
  private isOperationAllowed(operation: string): boolean {
    // First check with phase manager permissions
    if (operation === 'generateProof' && !phaseManager.isActionAllowed('canGenerateProofs')) {
      return false;
    }
    if (operation === 'verifyProof' && !phaseManager.isActionAllowed('canVerifyProofs')) {
      return false;
    }
    
    // Then check specific operation permissions
    const currentPhase = phaseManager.getCurrentPhase();
    const allowedOps = PHASE_PERMISSIONS[currentPhase] || [];
    return allowedOps.includes(operation);
  }

  /**
   * Check if enough time has passed since last proof
   */
  private isProofIntervalValid(): boolean {
    const now = Date.now();
    const timeSinceLastProof = now - this.lastProofTime;
    return timeSinceLastProof >= this.minProofInterval;
  }

  /**
   * Generate a location proof with phase control
   */
  public async generateProof(
    coordinates: LocationCoordinates,
    resolution: number,
    h3Map: H3Index[],
    options: ProofRequestOptions = {}
  ): Promise<ProveResult> {
    this.stats.totalCalls++;
    this.stats.callsByPhase[this.currentPhase]++;

    // Check if operation is allowed in current phase
    if (!this.isOperationAllowed('generateProof')) {
      this.stats.blockedCalls++;
      this.stats.lastBlockedReason = `Proof generation not allowed in ${this.currentPhase} phase`;
      
      console.warn(`⚠️ API Controller: Blocked proof generation - game is in ${this.currentPhase} phase`);
      
      return {
        success: false,
        error: {
          name: 'PhaseRestriction',
          message: `Cannot generate proofs during ${this.currentPhase} phase. Please wait for the game to start.`,
          type: ZkProofErrorType.VALIDATION_ERROR,
          retryable: true
        } as ZkProofError
      };
    }

    // Check proof interval to prevent spam
    if (!this.isProofIntervalValid() && !options.force) {
      const timeRemaining = Math.ceil((this.minProofInterval - (Date.now() - this.lastProofTime)) / 1000);
      this.stats.blockedCalls++;
      this.stats.lastBlockedReason = `Proof interval not met (${timeRemaining}s remaining)`;
      
      console.warn(`⚠️ API Controller: Blocked proof generation - too soon (${timeRemaining}s remaining)`);
      
      return {
        success: false,
        error: {
          name: 'RateLimited',
          message: `Please wait ${timeRemaining} seconds before generating another proof`,
          type: ZkProofErrorType.RATE_LIMITED,
          retryable: true
        } as ZkProofError
      };
    }

    // Proceed with the actual API call
    console.log(`✅ API Controller: Allowing proof generation in ${this.currentPhase} phase`);
    this.stats.allowedCalls++;
    
    const result = await zkProofService.generateProof(coordinates, resolution, h3Map, options);
    
    if (result.success) {
      this.lastProofTime = Date.now();
    }
    
    return result;
  }

  /**
   * Verify a proof with phase control
   */
  public async verifyProof(
    proof: string,
    publicInputs: unknown[],
    options: ProofRequestOptions = {}
  ): Promise<VerifyResult> {
    this.stats.totalCalls++;
    this.stats.callsByPhase[this.currentPhase]++;

    // Check if operation is allowed in current phase
    if (!this.isOperationAllowed('verifyProof')) {
      this.stats.blockedCalls++;
      this.stats.lastBlockedReason = `Proof verification not allowed in ${this.currentPhase} phase`;
      
      console.warn(`⚠️ API Controller: Blocked proof verification - game is in ${this.currentPhase} phase`);
      
      return {
        success: false,
        error: {
          name: 'PhaseRestriction',
          message: `Cannot verify proofs during ${this.currentPhase} phase`,
          type: ZkProofErrorType.VALIDATION_ERROR,
          retryable: true
        } as ZkProofError
      };
    }

    // Proceed with the actual API call
    console.log(`✅ API Controller: Allowing proof verification in ${this.currentPhase} phase`);
    this.stats.allowedCalls++;
    
    return await zkProofService.verifyProof(proof, publicInputs, options);
  }

  /**
   * Get API controller statistics
   */
  public getStats(): APICallStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
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
    };
    this.lastProofTime = 0;
  }

  /**
   * Set minimum interval between proofs
   */
  public setMinProofInterval(intervalMs: number): void {
    this.minProofInterval = intervalMs;
  }

  /**
   * Get time until next proof is allowed
   */
  public getTimeUntilNextProof(): number {
    const timeSinceLastProof = Date.now() - this.lastProofTime;
    return Math.max(0, this.minProofInterval - timeSinceLastProof);
  }
}

// Export singleton instance
export const apiController = new APIController();

// Export convenience functions that wrap the controller
export const generateLocationProofControlled = (
  coordinates: LocationCoordinates,
  resolution: number,
  h3Map: H3Index[],
  options?: ProofRequestOptions
) => apiController.generateProof(coordinates, resolution, h3Map, options);

export const verifyLocationProofControlled = (
  proof: string,
  publicInputs: unknown[],
  options?: ProofRequestOptions
) => apiController.verifyProof(proof, publicInputs, options);