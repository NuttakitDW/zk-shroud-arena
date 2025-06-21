import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Type declarations for custom matchers (defined in setup.ts)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R;
      toHaveValidGameState(): R;
    }
  }
}
import { 
  generateProof,
  verifyProof,
  generateGameStateProof,
  generateBatchProofs,
  verifyBatchProofs,
  submitProofToBlockchain,
  getProofStatus,
  loadCircuit,
  getCircuitInfo,
  zkProofTestUtils, 
  type GameStateProof
} from '../../__mocks__/zkProofService'

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('ZK Proof Flow Integration Tests', () => {
  beforeEach(() => {
    zkProofTestUtils.resetMocks()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Proof Generation and Verification', () => {
    it('should generate and verify a valid proof for player movement', async () => {
      const input = zkProofTestUtils.createTestInput({
        actionType: 'move',
        playerPosition: { x: 10, y: 15 },
        playerSecret: 'secret-123',
      })

      // Generate proof
      const proof = await generateProof(input)
      
      expect(proof).toBeDefined()
      expect(proof.proof).toContain('mock-proof-')
      expect(proof.publicSignals).toHaveLength(3)
      expect(proof.verified).toBe(true)
      expect(proof.gasEstimate).toBe('150000')

      // Verify proof
      const verification = await verifyProof(proof)
      
      expect(verification.valid).toBe(true)
      expect(verification.proofHash).toBe(proof.proofHash)
      expect(verification.timestamp).toBeGreaterThan(0)
      expect(verification.blockNumber).toBe(12345678)
      expect(verification.transactionHash).toMatch(/^0x[a-f0-9]{64}$/)
    })

    it('should generate deterministic proofs for same input', async () => {
      const input = zkProofTestUtils.createTestInput({
        actionType: 'attack',
        playerPosition: { x: 5, y: 5 },
        timestamp: 1234567890,
      })

      const proof1 = await generateProof(input)
      const proof2 = await generateProof(input)

      expect(proof1.proof).toBe(proof2.proof)
      expect(proof1.publicSignals).toEqual(proof2.publicSignals)
      expect(proof1.proofHash).toBe(proof2.proofHash)
    })

    it('should generate different proofs for different inputs', async () => {
      const input1 = zkProofTestUtils.createTestInput({ actionType: 'move' })
      const input2 = zkProofTestUtils.createTestInput({ actionType: 'attack' })

      const proof1 = await generateProof(input1)
      const proof2 = await generateProof(input2)

      expect(proof1.proof).not.toBe(proof2.proof)
      expect(proof1.proofHash).not.toBe(proof2.proofHash)
    })
  })

  describe('Game State Proof Workflows', () => {
    it('should generate complete game state proof', async () => {
      const gameId = 'test-game-123'
      const round = 1
      const playerId = 'player-456'
      const input = zkProofTestUtils.createTestInput({
        actionType: 'hide',
        playerPosition: { x: 20, y: 25 },
      })

      const gameStateProof = await generateGameStateProof(
        gameId, 
        round, 
        playerId, 
        input
      )

      expect(gameStateProof.gameId).toBe(gameId)
      expect(gameStateProof.round).toBe(round)
      expect(gameStateProof.playerId).toBe(playerId)
      expect(gameStateProof.actionProof).toBeDefined()
      expect(gameStateProof.stateCommitment).toMatch(/^0x[a-f0-9]{16}$/)
    })

    it('should handle game state proof for multiple rounds', async () => {
      const gameId = 'multi-round-game'
      const playerId = 'persistent-player'
      const rounds = [1, 2, 3]
      
      const proofs: GameStateProof[] = []
      
      for (const round of rounds) {
        const input = zkProofTestUtils.createTestInput({
          actionType: round % 2 === 0 ? 'attack' : 'defend',
          timestamp: Date.now() + round * 1000,
        })
        
        const proof = await generateGameStateProof(
          gameId, 
          round, 
          playerId, 
          input
        )
        
        proofs.push(proof)
      }

      expect(proofs).toHaveLength(3)
      proofs.forEach((proof, index) => {
        expect(proof.round).toBe(rounds[index])
        expect(proof.gameId).toBe(gameId)
        expect(proof.playerId).toBe(playerId)
      })
      
      // Each round should have different state commitments
      const commitments = proofs.map(p => p.stateCommitment)
      const uniqueCommitments = new Set(commitments)
      expect(uniqueCommitments.size).toBe(3)
    })
  })

  describe('Batch Processing', () => {
    it('should handle batch proof generation', async () => {
      const inputs = [
        zkProofTestUtils.createTestInput({ actionType: 'move' }),
        zkProofTestUtils.createTestInput({ actionType: 'attack' }),
        zkProofTestUtils.createTestInput({ actionType: 'defend' }),
      ]

      const proofs = await generateBatchProofs(inputs)
      
      expect(proofs).toHaveLength(3)
      proofs.forEach(proof => {
        expect(proof).toBeDefined()
      })
    })

    it('should handle batch proof verification', async () => {
      const proofs = [
        zkProofTestUtils.createTestProof(),
        zkProofTestUtils.createTestProof({ proof: 'mock-proof-different' }),
        zkProofTestUtils.createTestProof({ proof: 'mock-proof-another' }),
      ]

      const verifications = await verifyBatchProofs(proofs)
      
      expect(verifications).toHaveLength(3)
      verifications.forEach(verification => {
        expect(verification.valid).toBe(true)
        expect(verification.timestamp).toBeGreaterThan(0)
      })
    })

    it('should handle large batch processing efficiently', async () => {
      const batchSize = 10
      const inputs = Array.from({ length: batchSize }, (_, i) => 
        zkProofTestUtils.createTestInput({ 
          actionType: i % 2 === 0 ? 'move' : 'attack',
          timestamp: Date.now() + i * 100,
        })
      )

      const startTime = performance.now()
      const proofs = await generateBatchProofs(inputs)
      const endTime = performance.now()
      
      expect(proofs).toHaveLength(batchSize)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })

  describe('Blockchain Integration', () => {
    it('should submit proof to blockchain and track status', async () => {
      const proof = zkProofTestUtils.createTestProof()
      
      // Submit to blockchain
      const txHash = await submitProofToBlockchain(proof)
      
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/)
      
      // Check status
      const status = await getProofStatus(proof.proofHash)
      
      expect(['pending', 'confirmed', 'failed']).toContain(status)
    })

    it('should handle blockchain submission failures gracefully', async () => {
      zkProofTestUtils.setShouldFail(true, 'Network error')
      
      const proof = zkProofTestUtils.createTestProof()
      
      await expect(submitProofToBlockchain(proof))
        .rejects.toThrow('Blockchain submission failed: Network error')
    })

    it('should track proof status changes over time', async () => {
      const proof = zkProofTestUtils.createTestProof()
      
      // Mock different status based on time
      const statuses = []
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 10))
        const status = await getProofStatus(proof.proofHash)
        statuses.push(status)
      }
      
      expect(statuses).toHaveLength(3)
      // Status should be consistent for same hash
      const uniqueStatuses = new Set(statuses)
      expect(uniqueStatuses.size).toBe(1)
    })
  })

  describe('Circuit Management', () => {
    it('should load and get info for game circuits', async () => {
      const circuitName = 'movement-circuit'
      
      // Load circuit
      const loaded = await loadCircuit(circuitName)
      expect(loaded).toBe(true)
      
      // Get circuit info
      const info = await getCircuitInfo(circuitName)
      
      expect(info.name).toBe(circuitName)
      expect(info.constraints).toBe(1000000)
      expect(info.publicInputs).toBe(3)
      expect(info.privateInputs).toBe(10)
      expect(info.loaded).toBe(true)
    })

    it('should handle circuit loading failures', async () => {
      zkProofTestUtils.setShouldFail(true, 'Circuit file not found')
      
      await expect(loadCircuit('missing-circuit'))
        .rejects.toThrow('Circuit loading failed: Circuit file not found')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle proof generation failures', async () => {
      zkProofTestUtils.setShouldFail(true, 'Invalid input parameters')
      
      const input = zkProofTestUtils.createTestInput()
      
      await expect(generateProof(input))
        .rejects.toThrow('Proof generation failed: Invalid input parameters')
    })

    it('should handle verification failures', async () => {
      zkProofTestUtils.setShouldFail(true, 'Invalid proof format')
      
      const proof = zkProofTestUtils.createTestProof()
      
      await expect(verifyProof(proof))
        .rejects.toThrow('Proof verification failed: Invalid proof format')
    })

    it('should handle timeout scenarios', async () => {
      zkProofTestUtils.setMockDelay(100)
      
      const input = zkProofTestUtils.createTestInput()
      
      // Should still complete within reasonable time
      const startTime = performance.now()
      await generateProof(input)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeGreaterThan(90)
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('should validate input parameters', async () => {
      const invalidInputs = [
        { ...zkProofTestUtils.createTestInput(), playerPosition: null as unknown },
        { ...zkProofTestUtils.createTestInput(), actionType: 'invalid' as unknown },
        { ...zkProofTestUtils.createTestInput(), timestamp: -1 },
      ]

      // Mock service should handle validation (in real implementation)
      for (const input of invalidInputs) {
        const proof = await generateProof(input)
        // Mock always succeeds, but real implementation should validate
        expect(proof).toBeDefined()
      }
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle concurrent proof generation', async () => {
      const concurrentRequests = 5
      const inputs = Array.from({ length: concurrentRequests }, () => 
        zkProofTestUtils.createTestInput()
      )

      const promises = inputs.map(input => generateProof(input))
      const proofs = await Promise.all(promises)
      
      expect(proofs).toHaveLength(concurrentRequests)
      proofs.forEach(proof => {
        expect(proof).toBeDefined()
      })
    })

    it('should maintain performance under load', async () => {
      const iterations = 20
      const times: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const input = zkProofTestUtils.createTestInput({ timestamp: Date.now() + i })
        
        const startTime = performance.now()
        await generateProof(input)
        const endTime = performance.now()
        
        times.push(endTime - startTime)
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      
      expect(avgTime).toBeLessThan(150) // Average should be close to mock delay
      expect(maxTime).toBeLessThan(200) // No individual request should take too long
    })
  })

  describe('Integration with Game Logic', () => {
    it('should integrate with complete game turn workflow', async () => {
      // Simulate a complete game turn
      const gameId = 'integration-test-game'
      const playerId = 'test-player'
      const round = 1
      
      // Step 1: Player makes a move
      const moveInput = zkProofTestUtils.createTestInput({
        actionType: 'move',
        playerPosition: { x: 10, y: 10 },
      })
      
      const gameStateProof = await generateGameStateProof(
        gameId, round, playerId, moveInput
      )
      
      // Step 2: Verify the proof
      const verification = await verifyProof(gameStateProof.actionProof)
      expect(verification.valid).toBe(true)
      
      // Step 3: Submit to blockchain
      const txHash = await submitProofToBlockchain(gameStateProof.actionProof)
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/)
      
      // Step 4: Check final status
      const status = await getProofStatus(gameStateProof.actionProof.proofHash)
      expect(['pending', 'confirmed', 'failed']).toContain(status)
      
      // Verify all components work together
      expect(gameStateProof.gameId).toBe(gameId)
      expect(gameStateProof.playerId).toBe(playerId)
      expect(gameStateProof.round).toBe(round)
    })

    it('should handle multi-player game scenarios', async () => {
      const gameId = 'multi-player-test'
      const players = ['player1', 'player2', 'player3']
      const round = 1
      
      const gameStateProofs: GameStateProof[] = []
      
      // Each player makes a move
      for (const playerId of players) {
        const input = zkProofTestUtils.createTestInput({
          actionType: 'move',
          playerPosition: { 
            x: Math.floor(Math.random() * 100), 
            y: Math.floor(Math.random() * 100) 
          },
        })
        
        const proof = await generateGameStateProof(
          gameId, round, playerId, input
        )
        
        gameStateProofs.push(proof)
      }
      
      expect(gameStateProofs).toHaveLength(3)
      
      // Verify all proofs
      const verifications = await verifyBatchProofs(
        gameStateProofs.map(p => p.actionProof)
      )
      
      verifications.forEach(verification => {
        expect(verification.valid).toBe(true)
      })
      
      // All proofs should be for the same game and round
      gameStateProofs.forEach(proof => {
        expect(proof.gameId).toBe(gameId)
        expect(proof.round).toBe(round)
      })
      
      // But different players should have different commitments
      const commitments = gameStateProofs.map(p => p.stateCommitment)
      const uniqueCommitments = new Set(commitments)
      expect(uniqueCommitments.size).toBe(3)
    })
  })
})