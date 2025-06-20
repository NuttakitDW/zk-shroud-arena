'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, Skull, Zap, Crown, AlertCircle } from 'lucide-react';

export interface GameNotification {
  id: string;
  type: 'elimination' | 'zone_warning' | 'phase_change' | 'proof_status' | 'achievement' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after this many ms
  playerId?: string;
  data?: unknown;
}

export interface GameNotificationsProps {
  notifications: GameNotification[];
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  className?: string;
  onDismiss?: (id: string) => void;
  onNotificationClick?: (notification: GameNotification) => void;
}

export const GameNotifications: React.FC<GameNotificationsProps> = ({
  notifications,
  maxVisible = 5,
  position = 'top-right',
  className = '',
  onDismiss,
  onNotificationClick,
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<GameNotification[]>([]);

  // Update visible notifications when props change
  useEffect(() => {
    const sorted = [...notifications]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxVisible);
    setVisibleNotifications(sorted);
  }, [notifications, maxVisible]);

  // Auto-dismiss notifications with duration
  useEffect(() => {
    visibleNotifications.forEach((notification) => {
      if (notification.duration) {
        const timeElapsed = Date.now() - notification.timestamp;
        const timeRemaining = notification.duration - timeElapsed;
        
        if (timeRemaining > 0) {
          setTimeout(() => {
            handleDismiss(notification.id);
          }, timeRemaining);
        } else {
          handleDismiss(notification.id);
        }
      }
    });
  }, [visibleNotifications]); // handleDismiss is stable, no need to include

  const handleDismiss = (id: string) => {
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const getNotificationIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'elimination':
        return <Skull className="h-5 w-5 text-accent-danger" />;
      case 'zone_warning':
        return <AlertTriangle className="h-5 w-5 text-accent-warning" />;
      case 'phase_change':
        return <Info className="h-5 w-5 text-accent-primary" />;
      case 'proof_status':
        return <Zap className="h-5 w-5 text-accent-secondary" />;
      case 'achievement':
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-accent-warning" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-accent-danger" />;
      default:
        return <Info className="h-5 w-5 text-accent-primary" />;
    }
  };

  const getNotificationStyle = (type: GameNotification['type']) => {
    switch (type) {
      case 'elimination':
        return 'border-accent-danger bg-accent-danger bg-opacity-10';
      case 'zone_warning':
        return 'border-accent-warning bg-accent-warning bg-opacity-10';
      case 'phase_change':
        return 'border-accent-primary bg-accent-primary bg-opacity-10';
      case 'proof_status':
        return 'border-accent-secondary bg-accent-secondary bg-opacity-10';
      case 'achievement':
        return 'border-yellow-400 bg-yellow-400 bg-opacity-10';
      case 'warning':
        return 'border-accent-warning bg-accent-warning bg-opacity-10';
      case 'error':
        return 'border-accent-danger bg-accent-danger bg-opacity-10';
      default:
        return 'border-glass-border bg-glass-bg';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-20 left-4';
      case 'top-right':
        return 'top-20 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-20 right-4';
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 ${className}`}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`glass border ${getNotificationStyle(notification.type)} rounded-lg p-4 min-w-80 max-w-96 transform transition-all duration-300 ease-in-out ${
            index === 0 ? 'animate-slide-in-right' : ''
          } cursor-pointer hover:scale-105`}
          onClick={() => onNotificationClick?.(notification)}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-foreground font-semibold text-sm truncate">
                  {notification.title}
                </h4>
                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(notification.timestamp)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(notification.id);
                    }}
                    className="text-gray-400 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                {notification.message}
              </p>

              {/* Additional data display - commented out for type safety */}
              {/* TODO: Fix type-safe rendering of notification data
              {notification.data && (
                <div className="mt-2 text-xs text-gray-400">
                  Additional data rendering here
                </div>
              )} */}
            </div>
          </div>

          {/* Progress bar for timed notifications */}
          {notification.duration && (
            <div className="mt-3">
              <div className="w-full bg-background-tertiary rounded-full h-1">
                <div 
                  className="bg-accent-primary h-1 rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${Math.max(0, 100 - ((Date.now() - notification.timestamp) / notification.duration) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Notification counter if there are more */}
      {notifications.length > maxVisible && (
        <div className="glass border border-glass-border rounded-full px-3 py-2 text-center">
          <span className="text-sm text-gray-400">
            +{notifications.length - maxVisible} more notifications
          </span>
        </div>
      )}
    </div>
  );
};

// Helper component for creating notifications
export const createNotification = (
  type: GameNotification['type'],
  title: string,
  message: string,
  options: {
    duration?: number;
    playerId?: string;
    data?: unknown;
  } = {}
): GameNotification => ({
  id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  title,
  message,
  timestamp: Date.now(),
  ...options,
});

// Pre-defined notification creators
export const NotificationCreators = {
  playerEliminated: (playerName: string, eliminatedBy?: string, weapon?: string) =>
    createNotification(
      'elimination',
      'Player Eliminated',
      eliminatedBy 
        ? `${playerName} was eliminated by ${eliminatedBy}${weapon ? ` using ${weapon}` : ''}`
        : `${playerName} was eliminated`,
      { duration: 5000, data: { weapon } }
    ),

  zoneWarning: (timeRemaining: number) =>
    createNotification(
      'zone_warning',
      'Zone Shrinking',
      `Get to the safe zone! ${Math.ceil(timeRemaining / 1000)} seconds remaining`,
      { duration: 3000, data: { timeRemaining } }
    ),

  phaseChange: (newPhase: string) =>
    createNotification(
      'phase_change',
      'Game Phase Change',
      `Game phase changed to: ${newPhase.replace('_', ' ').toUpperCase()}`,
      { duration: 4000 }
    ),

  proofGenerated: (status: 'success' | 'failed', proofId?: string) =>
    createNotification(
      'proof_status',
      status === 'success' ? 'ZK Proof Generated' : 'ZK Proof Failed',
      status === 'success' 
        ? 'Your location proof has been successfully generated and verified'
        : 'Failed to generate location proof. Try again.',
      { duration: 4000, data: { proofId } }
    ),

  achievement: (title: string, description: string) =>
    createNotification(
      'achievement',
      title,
      description,
      { duration: 6000 }
    ),

  gameStart: () =>
    createNotification(
      'info',
      'Game Started',
      'The battle royale has begun! Good luck!',
      { duration: 3000 }
    ),

  victory: () =>
    createNotification(
      'achievement',
      'Victory!',
      'Congratulations! You are the last player standing!',
      { duration: 10000 }
    ),

  defeat: () =>
    createNotification(
      'info',
      'Defeated',
      'You have been eliminated. Better luck next time!',
      { duration: 5000 }
    ),
};

export default GameNotifications;