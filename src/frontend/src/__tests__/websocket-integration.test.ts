/**
 * WebSocket Integration Tests
 * Tests for real-time game communication and state synchronization
 */

import { WebSocketService, getWebSocketService, resetWebSocketService } from '../services/websocketService';
import { 
  WebSocketConnectionStatus, 
  DEFAULT_WEBSOCKET_CONFIG,
  isWebSocketMessage,
  isPlayerMoveMessage
} from '../types/websocket';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send() {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate successful send
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === 'open') this.onopen = listener as (event: Event) => void;
    if (type === 'close') this.onclose = listener as (event: CloseEvent) => void;
    if (type === 'error') this.onerror = listener as (event: Event) => void;
    if (type === 'message') this.onmessage = listener as (event: MessageEvent) => void;
  }

  removeEventListener(type: string) {
    if (type === 'open') this.onopen = null;
    if (type === 'close') this.onclose = null;
    if (type === 'error') this.onerror = null;
    if (type === 'message') this.onmessage = null;
  }
}

// Mock global WebSocket
(global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;

describe('WebSocket Integration', () => {
  let service: WebSocketService;

  beforeEach(() => {
    service = new WebSocketService({
      ...DEFAULT_WEBSOCKET_CONFIG,
      debug: false
    });
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('Connection Management', () => {
    test('should connect to WebSocket server', async () => {
      const connectPromise = service.connect('test-game');
      
      // Wait for connection
      await connectPromise;
      
      expect(service.isConnected()).toBe(true);
      expect(service.getConnectionInfo().status).toBe(WebSocketConnectionStatus.CONNECTED);
    });

    test('should handle connection failure gracefully', async () => {
      // Mock connection failure
      (global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 5);
        }
      };

      service = new WebSocketService();
      
      try {
        await service.connect('test-game');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(service.isConnected()).toBe(false);
      }
    });

    test('should disconnect cleanly', async () => {
      await service.connect('test-game');
      expect(service.isConnected()).toBe(true);
      
      service.disconnect();
      expect(service.isConnected()).toBe(false);
      expect(service.getConnectionInfo().status).toBe(WebSocketConnectionStatus.DISCONNECTED);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await service.connect('test-game');
    });

    test('should send player movement messages', () => {
      const location = {
        x: 100,
        y: 200,
        timestamp: Date.now(),
        zone: 'arena'
      };

      // This should not throw
      expect(() => {
        service.sendPlayerMove(location);
      }).not.toThrow();
    });

    test('should send ZK proof messages', () => {
      const proof = {
        proof: 'mock-proof-data',
        publicInputs: ['input1', 'input2'],
        timestamp: Date.now(),
        location: { x: 100, y: 200 },
        hash: 'mock-hash'
      };

      expect(() => {
        service.sendZKProof(proof);
      }).not.toThrow();
    });

    test('should send chat messages', () => {
      expect(() => {
        service.sendChatMessage('Hello, world!', 'global');
      }).not.toThrow();
    });

    test('should queue messages when disconnected', () => {
      service.disconnect();
      
      service.sendChatMessage('Queued message');
      
      const queue = service.getMessageQueue();
      expect(queue.length).toBe(1);
      expect((queue[0].message.data as any).message).toBe('Queued message');
    });
  });

  describe('Event Handling', () => {
    test('should register and call event handlers', async () => {
      const connectHandler = jest.fn();
      const disconnectHandler = jest.fn();
      
      service.addEventListener('onConnect', connectHandler);
      service.addEventListener('onDisconnect', disconnectHandler);
      
      await service.connect('test-game');
      expect(connectHandler).toHaveBeenCalled();
      
      service.disconnect();
      expect(disconnectHandler).toHaveBeenCalled();
    });

    test('should remove event handlers', async () => {
      const handler = jest.fn();
      
      service.addEventListener('onConnect', handler);
      service.removeEventListener('onConnect', handler);
      
      await service.connect('test-game');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('should use default configuration', () => {
      const config = service.getConfig();
      expect(config.url).toBe(DEFAULT_WEBSOCKET_CONFIG.url);
      expect(config.maxReconnectAttempts).toBe(DEFAULT_WEBSOCKET_CONFIG.maxReconnectAttempts);
    });

    test('should update configuration', () => {
      const newConfig = {
        maxReconnectAttempts: 5,
        heartbeatInterval: 15000
      };
      
      service.updateConfig(newConfig);
      
      const config = service.getConfig();
      expect(config.maxReconnectAttempts).toBe(5);
      expect(config.heartbeatInterval).toBe(15000);
    });
  });

  describe('Connection Info', () => {
    test('should track connection info correctly', async () => {
      const initialInfo = service.getConnectionInfo();
      expect(initialInfo.status).toBe(WebSocketConnectionStatus.DISCONNECTED);
      expect(initialInfo.reconnectAttempts).toBe(0);
      
      await service.connect('test-game');
      
      const connectedInfo = service.getConnectionInfo();
      expect(connectedInfo.status).toBe(WebSocketConnectionStatus.CONNECTED);
      expect(connectedInfo.lastConnected).toBeDefined();
    });

    test('should track latency', async () => {
      await service.connect('test-game');
      
      const latency = service.getLatency();
      expect(typeof latency).toBe('number');
      expect(latency).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('WebSocket Service Singleton', () => {
  test('should return same instance', () => {
    const service1 = getWebSocketService();
    const service2 = getWebSocketService();
    
    expect(service1).toBe(service2);
  });

  test('should reset service', () => {
    const service1 = getWebSocketService();
    resetWebSocketService();
    const service2 = getWebSocketService();
    
    expect(service1).not.toBe(service2);
  });
});

describe('Message Type Guards', () => {
  test('should validate WebSocket messages', () => {
    const validMessage = {
      type: 'player_move',
      timestamp: Date.now(),
      messageId: 'test-id',
      data: { playerId: 'player1', location: { x: 0, y: 0, timestamp: Date.now(), zone: 'arena' } }
    };
    
    const invalidMessage = {
      type: 'player_move',
      // missing required fields
    };
    
    expect(isWebSocketMessage(validMessage)).toBe(true);
    expect(isWebSocketMessage(invalidMessage)).toBe(false);
    expect(isPlayerMoveMessage({ ...validMessage, type: 'player_move' })).toBe(true);
  });
});