import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { jest } from '@jest/globals'

// Polyfills for testing environment
Object.assign(global, { TextDecoder, TextEncoder })

// Mock WebAssembly for ZK proof libraries
global.WebAssembly = {
  ...global.WebAssembly,
  instantiate: jest.fn(),
  compile: jest.fn(),
} as typeof WebAssembly

// Mock crypto for testing environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint8Array | Uint16Array | Uint32Array) => {
      // Fill with pseudo-random values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789abc'),
    subtle: {
      digest: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    },
  },
})

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any

// ZK Proof Testing Utilities
export const zkTestUtils = {
  // Mock proof generation that returns predictable results
  generateMockProof: () => ({
    proof: Buffer.from('mock-proof-data'),
    publicSignals: ['0x1234', '0x5678'],
    timestamp: Date.now(),
    verified: true,
  }),

  // Mock circuit compilation
  mockCircuit: {
    wasm: Buffer.from('mock-wasm'),
    zkey: Buffer.from('mock-zkey'),
    verificationKey: {
      protocol: 'groth16',
      curve: 'bn128',
      nPublic: 2,
      vk_alpha_1: ['0x1', '0x2'],
      vk_beta_2: [['0x3', '0x4'], ['0x5', '0x6']],
      vk_gamma_2: [['0x7', '0x8'], ['0x9', '0xa']],
      vk_delta_2: [['0xb', '0xc'], ['0xd', '0xe']],
      vk_alphabeta_12: [['0xf', '0x10'], ['0x11', '0x12']],
      IC: [['0x13', '0x14'], ['0x15', '0x16']],
    },
  },

  // Game state utilities for testing
  mockGameState: {
    players: [
      {
        id: 'player1',
        position: { x: 0, y: 0 },
        health: 100,
        isVisible: false,
        lastAction: 'move',
      },
      {
        id: 'player2',
        position: { x: 10, y: 10 },
        health: 80,
        isVisible: true,
        lastAction: 'attack',
      },
    ],
    gameId: 'test-game-123',
    round: 1,
    phase: 'action' as const,
    startTime: Date.now(),
  },

  // Mock network responses for ZK proof verification
  mockApiResponses: {
    proveEndpoint: {
      success: true,
      proof: 'mock-proof-hash',
      publicSignals: ['0x1234', '0x5678'],
      gasEstimate: '100000',
    },
    verifyEndpoint: {
      valid: true,
      proofHash: 'mock-proof-hash',
      timestamp: Date.now(),
      blockNumber: 12345,
    },
  },

  // Utility to wait for async operations in tests
  waitFor: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
  },

  // Mock WebSocket for real-time game updates
  mockWebSocket: {
    readyState: 1, // OPEN
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidProof(): R;
      toHaveValidGameState(): R;
    }
  }
}

// Custom matchers for ZK proof testing
expect.extend({
  toBeValidProof(received) {
    const pass = received && 
                 received.proof && 
                 received.publicSignals && 
                 Array.isArray(received.publicSignals)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid proof`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid proof with proof and publicSignals`,
        pass: false,
      }
    }
  },

  toHaveValidGameState(received) {
    const pass = received &&
                 received.players &&
                 Array.isArray(received.players) &&
                 received.gameId &&
                 received.phase
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid game state`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to have valid game state with players, gameId, and phase`,
        pass: false,
      }
    }
  },
})

// Global test configuration
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset DOM
  document.body.innerHTML = ''
  
  // Reset any global state
  global.fetch = jest.fn() as any
})

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks()
})

// Global error handling for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

export default zkTestUtils