/**
 * WebSocket Service for ZK Shroud Arena
 * Handles real-time communication with game server
 */

import {
  WebSocketConnectionStatus,
  WebSocketConnectionInfo,
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketConfig,
  WebSocketEventHandlers,
  IWebSocketService,
  QueuedMessage,
  DEFAULT_WEBSOCKET_CONFIG,
  PlayerMoveMessage,
  PlayerLocation,
  ZKProofData,
  ChatMessage,
  isWebSocketMessage
} from '../types/websocket';

export class WebSocketService implements IWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connectionInfo: WebSocketConnectionInfo;
  private eventHandlers: Map<keyof WebSocketEventHandlers, Set<(...args: unknown[]) => void>> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pingStartTime: number = 0;
  private currentGameId?: string;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_WEBSOCKET_CONFIG, ...config };
    this.connectionInfo = {
      status: WebSocketConnectionStatus.DISCONNECTED,
      url: this.config.url,
      reconnectAttempts: 0,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      latency: 0
    };

    // Bind methods to maintain context
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
  }

  // Connection management
  public async connect(gameId?: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.currentGameId = gameId;
    this.updateConnectionStatus(WebSocketConnectionStatus.CONNECTING);

    try {
      const url = gameId ? `${this.config.url}?gameId=${gameId}` : this.config.url;
      this.ws = new WebSocket(url, this.config.protocols);
      
      this.ws.addEventListener('open', this.handleOpen);
      this.ws.addEventListener('close', this.handleClose);
      this.ws.addEventListener('error', this.handleError);
      this.ws.addEventListener('message', this.handleMessage);

      // Connection timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      const connectPromise = new Promise<void>((resolve, reject) => {
        const openHandler = () => {
          this.ws?.removeEventListener('open', openHandler);
          resolve();
        };
        const errorHandler = () => {
          this.ws?.removeEventListener('error', errorHandler);
          reject(new Error('Connection failed'));
        };
        
        this.ws?.addEventListener('open', openHandler);
        this.ws?.addEventListener('error', errorHandler);
      });

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      // Clean close
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateConnectionStatus(WebSocketConnectionStatus.DISCONNECTED);
    this.connectionInfo.reconnectAttempts = 0;
    this.emit('onDisconnect', 'Manual disconnect');
  }

  public async reconnect(): Promise<void> {
    if (this.connectionInfo.status === WebSocketConnectionStatus.RECONNECTING) {
      return;
    }

    this.updateConnectionStatus(WebSocketConnectionStatus.RECONNECTING);
    this.connectionInfo.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.reconnectBackoffFactor, this.connectionInfo.reconnectAttempts - 1),
      this.config.maxReconnectInterval
    );

    this.emit('onReconnecting', this.connectionInfo.reconnectAttempts);

    if (this.config.debug) {
      console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.connectionInfo.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    }

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect(this.currentGameId);
        this.connectionInfo.reconnectAttempts = 0;
        this.emit('onReconnected', this.connectionInfo);
        this.processMessageQueue();
      } catch {
        if (this.connectionInfo.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.reconnect();
        } else {
          this.updateConnectionStatus(WebSocketConnectionStatus.ERROR);
          this.emit('onError', new Error('Max reconnection attempts reached'));
        }
      }
    }, delay);
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getConnectionInfo(): WebSocketConnectionInfo {
    return { ...this.connectionInfo };
  }

  // Message sending
  public send<T>(type: WebSocketMessageType, data: T): void {
    const message: WebSocketMessage<T> = {
      type,
      timestamp: Date.now(),
      data,
      messageId: this.generateMessageId(),
      playerId: this.getCurrentPlayerId(),
      gameId: this.currentGameId
    };

    if (this.isConnected()) {
      try {
        this.ws!.send(JSON.stringify(message));
        if (this.config.debug) {
          console.log('WebSocket: Sent message', { type, data });
        }
      } catch (error) {
        console.error('WebSocket: Failed to send message', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  public sendPlayerMove(location: PlayerLocation): void {
    const data: PlayerMoveMessage = {
      playerId: this.getCurrentPlayerId() || 'unknown',
      location
    };
    this.send(WebSocketMessageType.PLAYER_MOVE, data);
  }

  public sendZKProof(proof: ZKProofData): void {
    this.send(WebSocketMessageType.ZK_PROOF_GENERATED, {
      playerId: this.getCurrentPlayerId() || 'unknown',
      proof,
      location: proof.location
    });
  }

  public sendChatMessage(message: string, channel: 'global' | 'team' = 'global'): void {
    const data: ChatMessage = {
      playerId: this.getCurrentPlayerId() || 'unknown',
      message,
      channel,
      timestamp: Date.now()
    };
    this.send(WebSocketMessageType.CHAT_MESSAGE, data);
  }

  // Event handling
  public addEventListener<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler: WebSocketEventHandlers[K]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as (...args: unknown[]) => void);
  }

  public removeEventListener<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler: WebSocketEventHandlers[K]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as (...args: unknown[]) => void);
    }
  }

  // Configuration
  public updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
    this.connectionInfo.url = this.config.url;
    this.connectionInfo.maxReconnectAttempts = this.config.maxReconnectAttempts;
  }

  public getConfig(): WebSocketConfig {
    return { ...this.config };
  }

  // Utilities
  public getLatency(): number {
    return this.connectionInfo.latency;
  }

  public getMessageQueue(): QueuedMessage[] {
    return [...this.messageQueue];
  }

  public clearMessageQueue(): void {
    this.messageQueue = [];
  }

  // Private methods
  private handleOpen(): void {
    this.updateConnectionStatus(WebSocketConnectionStatus.CONNECTED);
    this.connectionInfo.lastConnected = Date.now();
    this.connectionInfo.connectionId = this.generateConnectionId();
    
    this.startHeartbeat();
    this.emit('onConnect', this.connectionInfo);
    this.processMessageQueue();

    if (this.config.debug) {
      console.log('WebSocket: Connected to', this.config.url);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.connectionInfo.lastDisconnected = Date.now();
    this.clearTimers();

    if (this.config.debug) {
      console.log('WebSocket: Disconnected', { code: event.code, reason: event.reason });
    }

    // Handle different close codes
    if (event.code === 1000) {
      // Normal closure
      this.updateConnectionStatus(WebSocketConnectionStatus.DISCONNECTED);
      this.emit('onDisconnect', event.reason || 'Normal closure');
    } else if (event.code >= 4000) {
      // Application-specific error, don't reconnect
      this.updateConnectionStatus(WebSocketConnectionStatus.ERROR);
      this.emit('onError', new Error(`Application error: ${event.reason}`));
    } else {
      // Unexpected closure, attempt to reconnect
      this.updateConnectionStatus(WebSocketConnectionStatus.DISCONNECTED);
      this.emit('onDisconnect', event.reason || 'Unexpected closure');
      
      if (this.connectionInfo.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnect();
      }
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket: Connection error', event);
    this.emit('onError', new Error('WebSocket connection error'));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      if (!isWebSocketMessage(data)) {
        console.warn('WebSocket: Received invalid message format', data);
        return;
      }

      const message = data as WebSocketMessage;

      // Handle system messages
      if (message.type === WebSocketMessageType.PONG) {
        this.handlePong();
        return;
      }

      if (message.type === WebSocketMessageType.PING) {
        this.send(WebSocketMessageType.PONG, {});
        return;
      }

      // Emit generic message event
      this.emit('onMessage', message);

      // Emit specific message events
      this.emitSpecificMessageEvent(message);

      if (this.config.debug) {
        console.log('WebSocket: Received message', { type: message.type, data: message.data });
      }
    } catch (error) {
      console.error('WebSocket: Failed to parse message', error, event.data);
    }
  }

  private emitSpecificMessageEvent(message: WebSocketMessage): void {
    const eventMap: Record<WebSocketMessageType, keyof WebSocketEventHandlers> = {
      [WebSocketMessageType.PLAYER_JOIN]: 'onPlayerJoin',
      [WebSocketMessageType.PLAYER_LEAVE]: 'onPlayerLeave',
      [WebSocketMessageType.PLAYER_MOVE]: 'onPlayerMove',
      [WebSocketMessageType.PLAYER_HEALTH_UPDATE]: 'onPlayerHealthUpdate',
      [WebSocketMessageType.PLAYER_ELIMINATION]: 'onPlayerElimination',
      [WebSocketMessageType.ARENA_ZONE_UPDATE]: 'onArenaZoneUpdate',
      [WebSocketMessageType.ARENA_ZONE_SHRINK]: 'onArenaZoneShrink',
      [WebSocketMessageType.GAME_PHASE_CHANGE]: 'onGamePhaseChange',
      [WebSocketMessageType.GAME_TIMER_UPDATE]: 'onGameTimerUpdate',
      [WebSocketMessageType.GAME_STATE_SYNC]: 'onGameStateSync',
      [WebSocketMessageType.ZK_PROOF_GENERATED]: 'onZKProofGenerated',
      [WebSocketMessageType.ZK_PROOF_VALIDATED]: 'onZKProofValidated',
      [WebSocketMessageType.ZK_PROOF_INVALID]: 'onZKProofInvalid',
      [WebSocketMessageType.ZK_PROOF_REQUEST]: 'onZKProofRequest',
      [WebSocketMessageType.CHAT_MESSAGE]: 'onChatMessage',
      [WebSocketMessageType.SYSTEM_ANNOUNCEMENT]: 'onSystemAnnouncement',
      [WebSocketMessageType.RATE_LIMIT]: 'onRateLimit',
      [WebSocketMessageType.ERROR]: 'onError',
      // System messages that don't need specific handlers
      [WebSocketMessageType.PING]: 'onMessage',
      [WebSocketMessageType.PONG]: 'onMessage',
      [WebSocketMessageType.CONNECT]: 'onMessage',
      [WebSocketMessageType.DISCONNECT]: 'onMessage'
    };

    const eventType = eventMap[message.type];
    if (eventType && eventType !== 'onMessage') {
      this.emit(eventType, message.data as any);
    }
  }

  private handleConnectionError(error: Error): void {
    this.updateConnectionStatus(WebSocketConnectionStatus.ERROR);
    this.emit('onError', error);
  }

  private handlePong(): void {
    const latency = Date.now() - this.pingStartTime;
    this.connectionInfo.latency = latency;
    
    if (this.config.debug) {
      console.log(`WebSocket: Latency ${latency}ms`);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  private sendHeartbeat(): void {
    this.pingStartTime = Date.now();
    this.send(WebSocketMessageType.PING, {});
  }

  private queueMessage<T>(message: WebSocketMessage<T>): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }

    this.messageQueue.push({
      message,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    });

    if (this.config.debug) {
      console.log('WebSocket: Message queued', { type: message.type, queueSize: this.messageQueue.length });
    }
  }

  private processMessageQueue(): void {
    const failedMessages: QueuedMessage[] = [];

    for (const queuedMessage of this.messageQueue) {
      try {
        if (this.isConnected()) {
          this.ws!.send(JSON.stringify(queuedMessage.message));
          if (this.config.debug) {
            console.log('WebSocket: Processed queued message', { type: queuedMessage.message.type });
          }
        } else {
          failedMessages.push(queuedMessage);
        }
      } catch (error) {
        queuedMessage.retries++;
        if (queuedMessage.retries < queuedMessage.maxRetries) {
          failedMessages.push(queuedMessage);
        } else {
          console.error('WebSocket: Failed to send queued message after max retries', error);
        }
      }
    }

    this.messageQueue = failedMessages;
  }

  private updateConnectionStatus(status: WebSocketConnectionStatus): void {
    this.connectionInfo.status = status;
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private emit<K extends keyof WebSocketEventHandlers>(
    event: K,
    data: Parameters<NonNullable<WebSocketEventHandlers[K]>>[0]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as (...args: unknown[]) => void)(data);
        } catch (error) {
          console.error(`WebSocket: Error in ${event} handler`, error);
        }
      });
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentPlayerId(): string | undefined {
    // This would typically be obtained from game context or authentication
    // For now, return undefined and let the implementing code handle it
    return undefined;
  }
}

// Singleton instance for global use
let globalWebSocketService: WebSocketService | null = null;

export function getWebSocketService(config?: Partial<WebSocketConfig>): WebSocketService {
  if (!globalWebSocketService) {
    globalWebSocketService = new WebSocketService(config);
  } else if (config) {
    globalWebSocketService.updateConfig(config);
  }
  return globalWebSocketService;
}

export function resetWebSocketService(): void {
  if (globalWebSocketService) {
    globalWebSocketService.disconnect();
    globalWebSocketService = null;
  }
}

export default WebSocketService;