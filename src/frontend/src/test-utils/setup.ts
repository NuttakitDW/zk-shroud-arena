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
if (typeof window !== 'undefined') {
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
} else {
  // Mock matchMedia for test environment when window is not available
  (global as any).matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

// Mock ResizeObserver for components that use it
if (typeof global.ResizeObserver === 'undefined') {
  (global as any).ResizeObserver = class MockResizeObserver {
    observe = jest.fn()
    unobserve = jest.fn()
    disconnect = jest.fn()
  }
}

// Mock IntersectionObserver for components that use it
if (typeof global.IntersectionObserver === 'undefined') {
  (global as any).IntersectionObserver = class MockIntersectionObserver {
    observe = jest.fn()
    unobserve = jest.fn()
    disconnect = jest.fn()
  }
}

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

  // Enhanced WebSocket mocking utilities
  createMockWebSocketService: (config = {}) => {
    const mockService = {
      isConnected: jest.fn(() => true),
      connect: jest.fn(() => Promise.resolve()),
      disconnect: jest.fn(),
      send: jest.fn(),
      sendPlayerMove: jest.fn(),
      sendZKProof: jest.fn(),
      sendChatMessage: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getConnectionInfo: jest.fn(() => ({
        status: 'connected',
        url: 'ws://localhost:8080/ws',
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,
        latency: 50,
        connectionId: 'test-connection-id'
      })),
      getLatency: jest.fn(() => 50),
      getMessageQueue: jest.fn(() => []),
      clearMessageQueue: jest.fn(),
      updateConfig: jest.fn(),
      getConfig: jest.fn(() => ({ ...config })),
      reconnect: jest.fn(() => Promise.resolve()),
      ...config
    };
    return mockService;
  },

  // WebSocket server simulation
  createMockWebSocketServer: () => {
    const server = (global as any).WebSocketTestUtils?.createMockServer() || {
      connections: new Set(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      broadcast: jest.fn(),
      sendTo: jest.fn(),
      onMessage: null
    };
    return server;
  },

  // Mock WebSocket connection
  mockWebSocket: {
    readyState: 1, // OPEN
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    url: 'ws://localhost:8080/ws',
    protocol: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob'
  },
}

// Type declarations for custom matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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

// WebSocket test utilities - enhanced integration with polyfill
const webSocketTestUtils = {
  ...zkTestUtils,
  
  // Enhanced WebSocket utilities
  waitForWebSocketConnection: async (service: any, timeout = 5000) => {
    const start = Date.now();
    while (!service.isConnected() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!service.isConnected()) {
      throw new Error(`WebSocket connection not established within ${timeout}ms`);
    }
  },

  simulateWebSocketMessage: (service: any, type: string, data: any) => {
    // Simulate receiving a message
    const message = {
      type,
      timestamp: Date.now(),
      data,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: 'test-player-id',
      gameId: 'test-game-id'
    };
    
    // Trigger message handlers if they exist
    if (service._messageHandlers && service._messageHandlers.get) {
      const handlers = service._messageHandlers.get('onMessage');
      if (handlers) {
        handlers.forEach((handler: any) => handler(message));
      }
    }
    
    return message;
  },

  createRealisticWebSocketMock: (overrides = {}) => {
    const mockWs = {
      readyState: (global as any).WEBSOCKET_STATES?.CONNECTING || 0,
      url: 'ws://localhost:8080/ws',
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      binaryType: 'blob',
      
      // Event handlers
      onopen: null as ((event: Event) => void) | null,
      onclose: null as ((event: CloseEvent) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      
      // Methods
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      
      // Test utilities
      _simulateOpen: () => {
        mockWs.readyState = (global as any).WEBSOCKET_STATES?.OPEN || 1;
        const event = new Event('open');
        if (mockWs.onopen) mockWs.onopen(event);
      },
      
      _simulateMessage: (data: any) => {
        if (mockWs.readyState === ((global as any).WEBSOCKET_STATES?.OPEN || 1)) {
          const event = new MessageEvent('message', { data });
          if (mockWs.onmessage) mockWs.onmessage(event);
        }
      },
      
      _simulateClose: (code = 1000, reason = '') => {
        mockWs.readyState = (global as any).WEBSOCKET_STATES?.CLOSED || 3;
        const event = new CloseEvent('close', { code, reason, wasClean: code === 1000 });
        if (mockWs.onclose) mockWs.onclose(event);
      },
      
      _simulateError: () => {
        const event = new Event('error');
        if (mockWs.onerror) mockWs.onerror(event);
      },
      
      ...overrides
    };
    
    return mockWs;
  }
};

// Export enhanced test utils
export const enhancedZkTestUtils = {
  ...zkTestUtils,
  ...webSocketTestUtils
};

// Global test configuration - optimized for speed
beforeEach(() => {
  // Only reset what's necessary for test isolation
  // Avoid expensive operations in beforeEach
  
  // Fast DOM reset (only if needed)
  if (document.body.innerHTML !== '') {
    document.body.innerHTML = ''
  }
  
  // Lazy mock reset - only reset what was actually used
  if (global.fetch && (global.fetch as any).mockClear) {
    (global.fetch as any).mockClear()
  } else {
    (global as any).fetch = jest.fn()
  }
})

afterEach(() => {
  // Minimal cleanup for speed - only restore if mocks were actually created
  // jest.restoreAllMocks() is expensive, avoid unless necessary
})

// Global error handling for unhandled promise rejections in tests
// Only log in non-silent mode for speed
if (process.env.JEST_SILENT !== 'true') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })
}

export default enhancedZkTestUtils