import { jest } from '@jest/globals'

// Types for ZK Proof Service
export interface ProofInput {
  playerPosition: { x: number; y: number }
  gameState: Record<string, unknown>
  playerSecret: string
  actionType: 'move' | 'attack' | 'defend' | 'hide'
  timestamp: number
}

export interface ProofOutput {
  proof: string
  publicSignals: string[]
  proofHash: string
  gasEstimate: string
  verified: boolean
}

export interface VerificationResult {
  valid: boolean
  proofHash: string
  timestamp: number
  blockNumber?: number
  transactionHash?: string
}

export interface GameStateProof {
  gameId: string
  round: number
  playerId: string
  actionProof: ProofOutput
  stateCommitment: string
}

// Mock implementations with realistic behavior
class MockZKProofService {
  private mockDelay = 100 // Simulate async operations
  private shouldFail = false
  private failureReason = 'Mock failure'

  // Control mock behavior for testing
  setShouldFail(shouldFail: boolean, reason = 'Mock failure') {
    this.shouldFail = shouldFail
    this.failureReason = reason
  }

  setMockDelay(delay: number) {
    this.mockDelay = delay
  }

  async generateProof(input: ProofInput): Promise<ProofOutput> {
    await this.delay()
    
    if (this.shouldFail) {
      throw new Error(`Proof generation failed: ${this.failureReason}`)
    }

    // Generate deterministic mock proof based on input
    const inputHash = this.hashInput(input)
    const proof = `mock-proof-${inputHash.slice(0, 8)}`
    const publicSignals = [
      `0x${inputHash.slice(0, 8)}`, // Position commitment
      `0x${inputHash.slice(8, 16)}`, // Action commitment
      `0x${Math.floor(input.timestamp / 1000).toString(16)}`, // Timestamp
    ]

    return {
      proof,
      publicSignals,
      proofHash: `0x${inputHash}`,
      gasEstimate: '150000',
      verified: true,
    }
  }

  async verifyProof(proof: ProofOutput): Promise<VerificationResult> {
    await this.delay()
    
    if (this.shouldFail) {
      throw new Error(`Proof verification failed: ${this.failureReason}`)
    }

    // Mock verification logic
    const isValid = proof.proof.startsWith('mock-proof-') && 
                   proof.publicSignals.length === 3 &&
                   proof.verified

    return {
      valid: isValid,
      proofHash: proof.proofHash,
      timestamp: Date.now(),
      blockNumber: 12345678,
      transactionHash: `0x${this.generateRandomHash()}`,
    }
  }

  async generateGameStateProof(
    gameId: string,
    round: number,
    playerId: string,
    input: ProofInput
  ): Promise<GameStateProof> {
    await this.delay()
    
    if (this.shouldFail) {
      throw new Error(`Game state proof generation failed: ${this.failureReason}`)
    }

    const actionProof = await this.generateProof(input)
    const stateCommitment = this.generateStateCommitment(gameId, round, playerId)

    return {
      gameId,
      round,
      playerId,
      actionProof,
      stateCommitment,
    }
  }

  async submitProofToBlockchain(): Promise<string> {
    await this.delay(500) // Longer delay for blockchain operations
    
    if (this.shouldFail) {
      throw new Error(`Blockchain submission failed: ${this.failureReason}`)
    }

    return `0x${this.generateRandomHash()}`
  }

  async getProofStatus(proofHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    await this.delay()
    
    if (this.shouldFail) {
      return 'failed'
    }

    // Mock status based on hash
    const hashNum = parseInt(proofHash.slice(-1), 16)
    if (hashNum < 2) return 'pending'
    if (hashNum < 14) return 'confirmed'
    return 'failed'
  }

  // Batch operations for game rounds
  async generateBatchProofs(inputs: ProofInput[]): Promise<ProofOutput[]> {
    await this.delay(inputs.length * 50) // Scale delay with batch size
    
    if (this.shouldFail) {
      throw new Error(`Batch proof generation failed: ${this.failureReason}`)
    }

    return Promise.all(inputs.map(input => this.generateProof(input)))
  }

  async verifyBatchProofs(proofs: ProofOutput[]): Promise<VerificationResult[]> {
    await this.delay(proofs.length * 30)
    
    if (this.shouldFail) {
      throw new Error(`Batch proof verification failed: ${this.failureReason}`)
    }

    return Promise.all(proofs.map(proof => this.verifyProof(proof)))
  }

  // Circuit management
  async loadCircuit(): Promise<boolean> {
    await this.delay(200)
    
    if (this.shouldFail) {
      throw new Error(`Circuit loading failed: ${this.failureReason}`)
    }

    // Mock successful circuit loading
    return true
  }

  async getCircuitInfo(circuitName: string): Promise<{
    name: string;
    constraints: number;
    publicInputs: number;
    privateInputs: number;
    version: string;
    loaded: boolean;
  }> {
    await this.delay()
    
    if (this.shouldFail) {
      throw new Error(`Circuit info retrieval failed: ${this.failureReason}`)
    }

    return {
      name: circuitName,
      constraints: 1000000,
      publicInputs: 3,
      privateInputs: 10,
      version: '1.0.0',
      loaded: true,
    }
  }

  // Utility methods
  private async delay(ms?: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms || this.mockDelay))
  }

  private hashInput(input: ProofInput): string {
    // Simple deterministic hash for testing
    const str = JSON.stringify(input)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0')
  }

  private generateStateCommitment(gameId: string, round: number, playerId: string): string {
    const gameState = {
      gameId,
      round,
      playerId,
      timestamp: Date.now()
    }
    return `0x${this.hashInput({ playerPosition: { x: 0, y: 0 }, gameState, playerSecret: '', actionType: 'move', timestamp: Date.now() })}`
  }

  private generateRandomHash(): string {
    return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
}

// Create mock instance
const mockZKProofService = new MockZKProofService()

// Export mock functions that can be spied on
export const generateProof = jest.fn<(input: ProofInput) => Promise<ProofOutput>>().mockImplementation((input: ProofInput) => 
  mockZKProofService.generateProof(input)
)

export const verifyProof = jest.fn<(proof: ProofOutput) => Promise<VerificationResult>>().mockImplementation((proof: ProofOutput) => 
  mockZKProofService.verifyProof(proof)
)

export const generateGameStateProof = jest.fn<(gameId: string, round: number, playerId: string, input: ProofInput) => Promise<GameStateProof>>().mockImplementation(
  (gameId: string, round: number, playerId: string, input: ProofInput) => 
    mockZKProofService.generateGameStateProof(gameId, round, playerId, input)
)

export const submitProofToBlockchain = jest.fn<(proof?: ProofOutput) => Promise<string>>().mockImplementation((_proof?: ProofOutput) => // eslint-disable-line @typescript-eslint/no-unused-vars
  mockZKProofService.submitProofToBlockchain()
)

export const getProofStatus = jest.fn<(proofHash: string) => Promise<'pending' | 'confirmed' | 'failed'>>().mockImplementation((proofHash: string) => 
  mockZKProofService.getProofStatus(proofHash)
)

export const generateBatchProofs = jest.fn<(inputs: ProofInput[]) => Promise<ProofOutput[]>>().mockImplementation((inputs: ProofInput[]) => 
  mockZKProofService.generateBatchProofs(inputs)
)

export const verifyBatchProofs = jest.fn<(proofs: ProofOutput[]) => Promise<VerificationResult[]>>().mockImplementation((proofs: ProofOutput[]) => 
  mockZKProofService.verifyBatchProofs(proofs)
)

export const loadCircuit = jest.fn<(circuitName?: string) => Promise<boolean>>().mockImplementation((_circuitName?: string) => // eslint-disable-line @typescript-eslint/no-unused-vars
  mockZKProofService.loadCircuit()
)

export const getCircuitInfo = jest.fn<(circuitName: string) => Promise<{ name: string; constraints: number; publicInputs: number; privateInputs: number; version: string; loaded: boolean; }>>().mockImplementation((circuitName: string) => 
  mockZKProofService.getCircuitInfo(circuitName)
)

// Test utilities
export const zkProofTestUtils = {
  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks()
    mockZKProofService.setShouldFail(false)
    mockZKProofService.setMockDelay(100)
  },

  // Configure mock behavior
  setShouldFail: (shouldFail: boolean, reason?: string) => {
    mockZKProofService.setShouldFail(shouldFail, reason)
  },

  setMockDelay: (delay: number) => {
    mockZKProofService.setMockDelay(delay)
  },

  // Get mock instance for advanced testing
  getMockInstance: () => mockZKProofService,

  // Helper to create test inputs
  createTestInput: (overrides: Partial<ProofInput> = {}): ProofInput => ({
    playerPosition: { x: 5, y: 10 },
    gameState: { round: 1, players: 2 },
    playerSecret: 'test-secret-123',
    actionType: 'move',
    timestamp: Date.now(),
    ...overrides,
  }),

  // Helper to create test proofs
  createTestProof: (overrides: Partial<ProofOutput> = {}): ProofOutput => ({
    proof: 'mock-proof-abcd1234',
    publicSignals: ['0xabcd1234', '0x5678efgh', '0x12345678'],
    proofHash: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    gasEstimate: '150000',
    verified: true,
    ...overrides,
  }),
}

// Default export
const zkProofServiceMock = {
  generateProof,
  verifyProof,
  generateGameStateProof,
  submitProofToBlockchain,
  getProofStatus,
  generateBatchProofs,
  verifyBatchProofs,
  loadCircuit,
  getCircuitInfo,
  zkProofTestUtils,
}

export default zkProofServiceMock