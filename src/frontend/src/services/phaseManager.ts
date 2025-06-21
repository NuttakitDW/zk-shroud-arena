/**
 * Phase Manager Service
 * Centralized game phase management with API access control
 */

import { GamePhase } from '../types/gameState';

export interface PhasePermissions {
  canGenerateProofs: boolean;
  canVerifyProofs: boolean;
  canMakeAPIRequests: boolean;
  canJoinGame: boolean;
  canMovePlayer: boolean;
  canAccessInventory: boolean;
  canChat: boolean;
}

export interface PhaseTransition {
  from: GamePhase;
  to: GamePhase;
  timestamp: number;
  triggeredBy: 'admin' | 'auto' | 'server';
  reason?: string;
}

export class PhaseManager {
  private static instance: PhaseManager;
  private currentPhase: GamePhase = GamePhase.LOBBY;
  private transitionHistory: PhaseTransition[] = [];
  private phaseListeners: Map<string, (phase: GamePhase) => void> = new Map();
  private permissionOverrides: Partial<PhasePermissions> = {};

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): PhaseManager {
    if (!PhaseManager.instance) {
      PhaseManager.instance = new PhaseManager();
    }
    return PhaseManager.instance;
  }

  /**
   * Get current game phase
   */
  public getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Set the current game phase
   */
  public setPhase(phase: GamePhase, triggeredBy: 'admin' | 'auto' | 'server' = 'auto', reason?: string): void {
    if (phase === this.currentPhase) return;

    const transition: PhaseTransition = {
      from: this.currentPhase,
      to: phase,
      timestamp: Date.now(),
      triggeredBy,
      reason
    };

    this.transitionHistory.push(transition);
    this.currentPhase = phase;

    // Notify all listeners
    this.phaseListeners.forEach(listener => {
      listener(phase);
    });

    console.log(`[PhaseManager] Phase transition: ${transition.from} -> ${transition.to} (${triggeredBy})`);
  }

  /**
   * Get permissions for current phase
   */
  public getPhasePermissions(): PhasePermissions {
    const basePermissions = this.getBasePermissions(this.currentPhase);
    return { ...basePermissions, ...this.permissionOverrides };
  }

  /**
   * Check if a specific action is allowed in current phase
   */
  public isActionAllowed(action: keyof PhasePermissions): boolean {
    const permissions = this.getPhasePermissions();
    return permissions[action] ?? false;
  }

  /**
   * Override specific permissions (for testing/admin)
   */
  public setPermissionOverride(permission: keyof PhasePermissions, value: boolean): void {
    this.permissionOverrides[permission] = value;
  }

  /**
   * Clear all permission overrides
   */
  public clearPermissionOverrides(): void {
    this.permissionOverrides = {};
  }

  /**
   * Add phase change listener
   */
  public addPhaseListener(id: string, listener: (phase: GamePhase) => void): void {
    this.phaseListeners.set(id, listener);
  }

  /**
   * Remove phase change listener
   */
  public removePhaseListener(id: string): void {
    this.phaseListeners.delete(id);
  }

  /**
   * Get phase transition history
   */
  public getTransitionHistory(): PhaseTransition[] {
    return [...this.transitionHistory];
  }

  /**
   * Check if API requests are allowed in current phase
   */
  public canMakeAPIRequest(endpoint: string): boolean {
    // Special cases for critical endpoints
    if (endpoint.includes('/health') || endpoint.includes('/status')) {
      return true;
    }

    // Check general API permission
    return this.isActionAllowed('canMakeAPIRequests');
  }

  /**
   * Get base permissions for a phase
   */
  private getBasePermissions(phase: GamePhase): PhasePermissions {
    switch (phase) {
      case GamePhase.LOBBY:
        return {
          canGenerateProofs: false,
          canVerifyProofs: false,
          canMakeAPIRequests: false,
          canJoinGame: true,
          canMovePlayer: false,
          canAccessInventory: true,
          canChat: true
        };

      case GamePhase.PREPARATION:
        return {
          canGenerateProofs: true, // Allow test proofs
          canVerifyProofs: true,
          canMakeAPIRequests: true,
          canJoinGame: false,
          canMovePlayer: true,
          canAccessInventory: true,
          canChat: true
        };

      case GamePhase.ACTIVE:
      case GamePhase.ZONE_SHRINKING:
      case GamePhase.SHRINKING:
      case GamePhase.FINAL_ZONE:
        return {
          canGenerateProofs: true,
          canVerifyProofs: true,
          canMakeAPIRequests: true,
          canJoinGame: false,
          canMovePlayer: true,
          canAccessInventory: true,
          canChat: true
        };

      case GamePhase.GAME_OVER:
      case GamePhase.ENDED:
        return {
          canGenerateProofs: false,
          canVerifyProofs: false,
          canMakeAPIRequests: false,
          canJoinGame: false,
          canMovePlayer: false,
          canAccessInventory: false,
          canChat: true
        };

      default:
        // Default to restrictive permissions
        return {
          canGenerateProofs: false,
          canVerifyProofs: false,
          canMakeAPIRequests: false,
          canJoinGame: false,
          canMovePlayer: false,
          canAccessInventory: false,
          canChat: false
        };
    }
  }

  /**
   * Get human-readable phase description
   */
  public getPhaseDescription(phase: GamePhase = this.currentPhase): string {
    switch (phase) {
      case GamePhase.LOBBY:
        return 'Waiting for players to join';
      case GamePhase.PREPARATION:
        return 'Preparing for battle';
      case GamePhase.ACTIVE:
        return 'Battle in progress';
      case GamePhase.ZONE_SHRINKING:
      case GamePhase.SHRINKING:
        return 'Safe zone shrinking';
      case GamePhase.FINAL_ZONE:
        return 'Final showdown';
      case GamePhase.GAME_OVER:
      case GamePhase.ENDED:
        return 'Game ended';
      default:
        return 'Unknown phase';
    }
  }

  /**
   * Reset phase manager to initial state
   */
  public reset(): void {
    this.currentPhase = GamePhase.LOBBY;
    this.transitionHistory = [];
    this.permissionOverrides = {};
    console.log('[PhaseManager] Reset to initial state');
  }
}

// Export singleton instance
export const phaseManager = PhaseManager.getInstance();

// Export convenience functions
export const getCurrentPhase = () => phaseManager.getCurrentPhase();
export const isActionAllowed = (action: keyof PhasePermissions) => phaseManager.isActionAllowed(action);
export const canMakeAPIRequest = (endpoint: string) => phaseManager.canMakeAPIRequest(endpoint);