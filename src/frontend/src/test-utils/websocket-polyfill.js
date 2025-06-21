/**
 * WebSocket Polyfill for Jest Testing Environment
 * Provides enhanced WebSocket mocking capabilities for tests
 */

// Enhanced MockWebSocket implementation
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols || [];
    this.readyState = MockWebSocket.CONNECTING;
    this.bufferedAmount = 0;
    this.extensions = '';
    this.protocol = '';
    this.binaryType = 'blob';
    
    // Event handlers
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    
    // Event listeners map
    this._eventListeners = new Map();
    
    // Queue for messages sent during disconnected state
    this._messageQueue = [];
    
    // Control flags for testing
    this._shouldFailConnection = false;
    this._connectionDelay = 10;
    this._closeCode = null;
    this._closeReason = null;
    
    // Simulate async connection
    this._simulateConnection();
  }

  // Core WebSocket methods
  send(data) {
    if (this.readyState === MockWebSocket.CONNECTING) {
      throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
    }
    
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open: readyState ' + this.readyState);
    }
    
    // Simulate successful send
    this.bufferedAmount += data.length || 0;
    
    // Trigger any mock server responses
    this._triggerMockServerResponse(data);
    
    // Simulate buffered amount clearing
    setTimeout(() => {
      this.bufferedAmount = Math.max(0, this.bufferedAmount - (data.length || 0));
    }, 1);
  }

  close(code = 1000, reason = '') {
    if (this.readyState === MockWebSocket.CLOSED || this.readyState === MockWebSocket.CLOSING) {
      return;
    }
    
    this.readyState = MockWebSocket.CLOSING;
    
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this._closeCode = code;
      this._closeReason = reason;
      
      const closeEvent = new CloseEvent('close', {
        code,
        reason,
        wasClean: code === 1000
      });
      
      this._dispatchEvent(closeEvent);
    }, 1);
  }

  // Event listener management
  addEventListener(type, listener, options) {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, new Set());
    }
    this._eventListeners.get(type).add(listener);
    
    // Also set the on* property for backward compatibility
    if (type === 'open') this.onopen = listener;
    if (type === 'close') this.onclose = listener;
    if (type === 'error') this.onerror = listener;
    if (type === 'message') this.onmessage = listener;
  }

  removeEventListener(type, listener) {
    const listeners = this._eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
    
    // Clear on* property if it matches
    if (type === 'open' && this.onopen === listener) this.onopen = null;
    if (type === 'close' && this.onclose === listener) this.onclose = null;
    if (type === 'error' && this.onerror === listener) this.onerror = null;
    if (type === 'message' && this.onmessage === listener) this.onmessage = null;
  }

  dispatchEvent(event) {
    return this._dispatchEvent(event);
  }

  // Private methods for simulation
  _simulateConnection() {
    setTimeout(() => {
      if (this._shouldFailConnection) {
        this.readyState = MockWebSocket.CLOSED;
        const errorEvent = new Event('error');
        this._dispatchEvent(errorEvent);
        return;
      }
      
      this.readyState = MockWebSocket.OPEN;
      const openEvent = new Event('open');
      this._dispatchEvent(openEvent);
    }, this._connectionDelay);
  }

  _dispatchEvent(event) {
    // Call on* handler
    if (event.type === 'open' && this.onopen) {
      this.onopen(event);
    }
    if (event.type === 'close' && this.onclose) {
      this.onclose(event);
    }
    if (event.type === 'error' && this.onerror) {
      this.onerror(event);
    }
    if (event.type === 'message' && this.onmessage) {
      this.onmessage(event);
    }
    
    // Call addEventListener handlers
    const listeners = this._eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
    
    return true;
  }

  _triggerMockServerResponse(data) {
    // Override this method in tests to simulate server responses
    if (this._mockServerHandler) {
      this._mockServerHandler(data);
    }
  }

  // Test utilities
  _setMockServerHandler(handler) {
    this._mockServerHandler = handler;
  }

  _simulateServerMessage(data) {
    if (this.readyState === MockWebSocket.OPEN) {
      const messageEvent = new MessageEvent('message', { data });
      this._dispatchEvent(messageEvent);
    }
  }

  _simulateConnectionFailure() {
    this._shouldFailConnection = true;
  }

  _setConnectionDelay(delay) {
    this._connectionDelay = delay;
  }

  _forceClose(code = 1006, reason = 'Connection lost') {
    this.readyState = MockWebSocket.CLOSED;
    const closeEvent = new CloseEvent('close', {
      code,
      reason,
      wasClean: false
    });
    this._dispatchEvent(closeEvent);
  }

  _getEventListenerCount(type) {
    const listeners = this._eventListeners.get(type);
    return listeners ? listeners.size : 0;
  }
}

// Mock CloseEvent for environments that don't have it
class MockCloseEvent extends Event {
  constructor(type, eventInitDict) {
    super(type, eventInitDict);
    this.code = eventInitDict?.code || 1000;
    this.reason = eventInitDict?.reason || '';
    this.wasClean = eventInitDict?.wasClean || true;
  }
}

// Mock MessageEvent for environments that don't have it
class MockMessageEvent extends Event {
  constructor(type, eventInitDict) {
    super(type, eventInitDict);
    this.data = eventInitDict?.data;
    this.origin = eventInitDict?.origin || '';
    this.lastEventId = eventInitDict?.lastEventId || '';
    this.source = eventInitDict?.source || null;
    this.ports = eventInitDict?.ports || [];
  }
}

// Set up global WebSocket mock
global.WebSocket = MockWebSocket;
global.CloseEvent = global.CloseEvent || MockCloseEvent;
global.MessageEvent = global.MessageEvent || MockMessageEvent;

// Export for use in tests
global.MockWebSocket = MockWebSocket;
global.MockCloseEvent = MockCloseEvent;
global.MockMessageEvent = MockMessageEvent;

// WebSocket test utilities
global.WebSocketTestUtils = {
  createMockWebSocket: (url, protocols) => new MockWebSocket(url, protocols),
  
  createMockServer: () => ({
    connections: new Set(),
    
    connect(ws) {
      this.connections.add(ws);
      ws._setMockServerHandler((data) => {
        this.onMessage?.(ws, data);
      });
    },
    
    disconnect(ws) {
      this.connections.delete(ws);
    },
    
    broadcast(data) {
      this.connections.forEach(ws => {
        if (ws.readyState === MockWebSocket.OPEN) {
          ws._simulateServerMessage(data);
        }
      });
    },
    
    sendTo(ws, data) {
      if (ws.readyState === MockWebSocket.OPEN) {
        ws._simulateServerMessage(data);
      }
    },
    
    onMessage: null
  }),
  
  waitForConnection: (ws, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, timeout);
      
      if (ws.readyState === MockWebSocket.OPEN) {
        clearTimeout(timeoutId);
        resolve();
        return;
      }
      
      const openHandler = () => {
        clearTimeout(timeoutId);
        ws.removeEventListener('open', openHandler);
        resolve();
      };
      
      ws.addEventListener('open', openHandler);
    });
  },
  
  waitForMessage: (ws, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('WebSocket message timeout'));
      }, timeout);
      
      const messageHandler = (event) => {
        clearTimeout(timeoutId);
        ws.removeEventListener('message', messageHandler);
        resolve(event.data);
      };
      
      ws.addEventListener('message', messageHandler);
    });
  },
  
  waitForClose: (ws, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('WebSocket close timeout'));
      }, timeout);
      
      if (ws.readyState === MockWebSocket.CLOSED) {
        clearTimeout(timeoutId);
        resolve({ code: ws._closeCode, reason: ws._closeReason });
        return;
      }
      
      const closeHandler = (event) => {
        clearTimeout(timeoutId);
        ws.removeEventListener('close', closeHandler);
        resolve({ code: event.code, reason: event.reason });
      };
      
      ws.addEventListener('close', closeHandler);
    });
  }
};

// Export constants
global.WEBSOCKET_STATES = {
  CONNECTING: MockWebSocket.CONNECTING,
  OPEN: MockWebSocket.OPEN,
  CLOSING: MockWebSocket.CLOSING,
  CLOSED: MockWebSocket.CLOSED
};