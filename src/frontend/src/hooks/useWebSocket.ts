/**
 * useWebSocket Hook for ZK Shroud Arena
 * React hook for WebSocket integration with game state
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  WebSocketConnectionStatus,
  WebSocketConnectionInfo,
  WebSocketMessageType,
  WebSocketEventHandlers,
  UseWebSocketOptions,
  UseWebSocketReturn,
  QueuedMessage,
  PlayerLocation,
  ZKProofData,
  ZKProofRequestMessage,
  ZKProofValidatedMessage,
  GameStateSyncMessage,
  ChatMessage,
  SystemAnnouncementMessage
} from '../types/websocket';
import { getWebSocketService, WebSocketService } from '../services/websocketService';

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    gameId,
    config,
    handlers,
    autoConnect = true
  } = options;

  // Service instance (persistent across re-renders)
  const serviceRef = useRef<WebSocketService | null>(null);
  
  // Connection state
  const [connectionInfo, setConnectionInfo] = useState<WebSocketConnectionInfo>({
    status: WebSocketConnectionStatus.DISCONNECTED,
    url: config?.url || 'ws://localhost:8080/ws',
    reconnectAttempts: 0,
    maxReconnectAttempts: config?.maxReconnectAttempts || 10,
    latency: 0
  });

  // Message queue state
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = getWebSocketService(config);
    } else if (config) {
      serviceRef.current.updateConfig(config);
    }
  }, [config]);

  // Event handlers setup
  useEffect(() => {
    const service = serviceRef.current;
    if (!service) return;

    // Internal handlers for state updates
    const internalHandlers: WebSocketEventHandlers = {
      onConnect: (info) => {
        setConnectionInfo(info);
        setMessageQueue(service.getMessageQueue());
        handlers?.onConnect?.(info);
      },
      
      onDisconnect: (reason) => {
        setConnectionInfo(service.getConnectionInfo());
        handlers?.onDisconnect?.(reason);
      },
      
      onReconnecting: (attempt) => {
        setConnectionInfo(service.getConnectionInfo());
        handlers?.onReconnecting?.(attempt);
      },
      
      onReconnected: (info) => {
        setConnectionInfo(info);
        setMessageQueue(service.getMessageQueue());
        handlers?.onReconnected?.(info);
      },
      
      onError: (error) => {
        setConnectionInfo(service.getConnectionInfo());
        handlers?.onError?.(error);
      },
      
      onMessage: (message) => {
        setConnectionInfo(service.getConnectionInfo());
        handlers?.onMessage?.(message);
      },
      
      // Forward all specific event handlers
      onPlayerJoin: handlers?.onPlayerJoin,
      onPlayerLeave: handlers?.onPlayerLeave,
      onPlayerMove: handlers?.onPlayerMove,
      onPlayerHealthUpdate: handlers?.onPlayerHealthUpdate,
      onPlayerElimination: handlers?.onPlayerElimination,
      onArenaZoneUpdate: handlers?.onArenaZoneUpdate,
      onGamePhaseChange: handlers?.onGamePhaseChange,
      onGameTimerUpdate: handlers?.onGameTimerUpdate,
      onGameStateSync: handlers?.onGameStateSync,
      onZKProofGenerated: handlers?.onZKProofGenerated,
      onZKProofValidated: handlers?.onZKProofValidated,
      onZKProofRequest: handlers?.onZKProofRequest,
      onChatMessage: handlers?.onChatMessage,
      onSystemAnnouncement: handlers?.onSystemAnnouncement,
      onRateLimit: handlers?.onRateLimit
    };

    // Register all handlers
    Object.entries(internalHandlers).forEach(([event, handler]) => {
      if (handler) {
        service.addEventListener(event as keyof WebSocketEventHandlers, handler);
      }
    });

    // Cleanup handlers on unmount or when handlers change
    return () => {
      Object.entries(internalHandlers).forEach(([event, handler]) => {
        if (handler) {
          service.removeEventListener(event as keyof WebSocketEventHandlers, handler);
        }
      });
    };
  }, [handlers]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && serviceRef.current && !serviceRef.current.isConnected()) {
      serviceRef.current.connect(gameId).catch(error => {
        console.error('Auto-connect failed:', error);
      });
    }
  }, [autoConnect, gameId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount as the service might be used elsewhere
      // Just clean up the handlers (done in the handlers effect)
    };
  }, []);

  // Memoized connection methods
  const connect = useCallback(async (connectGameId?: string) => {
    if (!serviceRef.current) return;
    
    try {
      await serviceRef.current.connect(connectGameId || gameId);
      setConnectionInfo(serviceRef.current.getConnectionInfo());
    } catch (error) {
      console.error('Connect failed:', error);
      throw error;
    }
  }, [gameId]);

  const disconnect = useCallback(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.disconnect();
    setConnectionInfo(serviceRef.current.getConnectionInfo());
    setMessageQueue([]);
  }, []);

  const reconnect = useCallback(async () => {
    if (!serviceRef.current) return;
    
    try {
      await serviceRef.current.reconnect();
      setConnectionInfo(serviceRef.current.getConnectionInfo());
    } catch (error) {
      console.error('Reconnect failed:', error);
      throw error;
    }
  }, []);

  // Memoized message sending methods
  const sendMessage = useCallback(<T>(type: WebSocketMessageType, data: T) => {
    if (!serviceRef.current) return;
    
    serviceRef.current.send(type, data);
    setMessageQueue(serviceRef.current.getMessageQueue());
  }, []);

  const sendPlayerMove = useCallback((location: PlayerLocation) => {
    if (!serviceRef.current) return;
    
    serviceRef.current.sendPlayerMove(location);
    setMessageQueue(serviceRef.current.getMessageQueue());
  }, []);

  const sendZKProof = useCallback((proof: ZKProofData) => {
    if (!serviceRef.current) return;
    
    serviceRef.current.sendZKProof(proof);
    setMessageQueue(serviceRef.current.getMessageQueue());
  }, []);

  const sendChatMessage = useCallback((message: string, channel: 'global' | 'team' = 'global') => {
    if (!serviceRef.current) return;
    
    serviceRef.current.sendChatMessage(message, channel);
    setMessageQueue(serviceRef.current.getMessageQueue());
  }, []);

  const clearMessageQueue = useCallback(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.clearMessageQueue();
    setMessageQueue([]);
  }, []);

  // Derived state
  const isConnected = useMemo(() => {
    return connectionInfo.status === WebSocketConnectionStatus.CONNECTED;
  }, [connectionInfo.status]);

  const latency = useMemo(() => {
    return connectionInfo.latency;
  }, [connectionInfo.latency]);

  return {
    connectionInfo,
    isConnected,
    latency,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    sendPlayerMove,
    sendZKProof,
    sendChatMessage,
    messageQueue,
    clearMessageQueue
  };
}

// Specialized hooks for specific use cases

/**
 * Hook for player movement WebSocket integration
 */
export function usePlayerMovement(gameId?: string) {
  const { sendPlayerMove, isConnected } = useWebSocket({
    gameId,
    autoConnect: true
  });

  const sendMovement = useCallback((location: PlayerLocation) => {
    if (isConnected) {
      sendPlayerMove(location);
    }
  }, [sendPlayerMove, isConnected]);

  return {
    sendMovement,
    isConnected
  };
}

/**
 * Hook for ZK proof WebSocket integration
 */
export function useZKProofWebSocket(gameId?: string) {
  const [proofRequests, setProofRequests] = useState<ZKProofRequestMessage[]>([]);
  const [proofValidations, setProofValidations] = useState<ZKProofValidatedMessage[]>([]);

  const { sendZKProof, isConnected } = useWebSocket({
    gameId,
    autoConnect: true,
    handlers: {
      onZKProofRequest: (data) => {
        setProofRequests(prev => [...prev, data].slice(-10)); // Keep last 10
      },
      onZKProofValidated: (data) => {
        setProofValidations(prev => [...prev, data].slice(-10)); // Keep last 10
      }
    }
  });

  const submitProof = useCallback((proof: ZKProofData) => {
    if (isConnected) {
      sendZKProof(proof);
    }
  }, [sendZKProof, isConnected]);

  const clearProofHistory = useCallback(() => {
    setProofRequests([]);
    setProofValidations([]);
  }, []);

  return {
    submitProof,
    proofRequests,
    proofValidations,
    clearProofHistory,
    isConnected
  };
}

/**
 * Hook for game state synchronization
 */
export function useGameSync(gameId?: string) {
  const [lastSync, setLastSync] = useState<GameStateSyncMessage | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  const { isConnected, connectionInfo } = useWebSocket({
    gameId,
    autoConnect: true,
    handlers: {
      onGameStateSync: (data) => {
        setLastSync(data);
        setSyncCount(prev => prev + 1);
      }
    }
  });

  return {
    lastSync,
    syncCount,
    isConnected,
    latency: connectionInfo.latency
  };
}

/**
 * Hook for chat functionality
 */
export function useChatWebSocket(gameId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncementMessage[]>([]);

  const { sendChatMessage, isConnected } = useWebSocket({
    gameId,
    autoConnect: true,
    handlers: {
      onChatMessage: (data) => {
        setMessages(prev => [...prev, data].slice(-100)); // Keep last 100 messages
      },
      onSystemAnnouncement: (data) => {
        setAnnouncements(prev => [...prev, data].slice(-20)); // Keep last 20 announcements
      }
    }
  });

  const sendMessage = useCallback((message: string, channel: 'global' | 'team' = 'global') => {
    if (isConnected && message.trim()) {
      sendChatMessage(message.trim(), channel);
    }
  }, [sendChatMessage, isConnected]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return {
    messages,
    announcements,
    sendMessage,
    clearMessages,
    clearAnnouncements,
    isConnected
  };
}

export default useWebSocket;