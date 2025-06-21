'use client';

import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Clock } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  latency?: number;
  className?: string;
  showLabel?: boolean;
  showLatency?: boolean;
}

/**
 * ConnectionStatus - Shows real-time connection status with latency
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  latency = 0,
  className = '',
  showLabel = true,
  showLatency = true
}) => {
  const getStatusConfig = () => {
    if (isConnected) {
      // Determine connection quality based on latency
      if (latency < 50) {
        return {
          icon: Wifi,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/20',
          label: 'Excellent',
          description: 'Excellent connection'
        };
      } else if (latency < 100) {
        return {
          icon: Wifi,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/20',
          label: 'Good',
          description: 'Good connection'
        };
      } else if (latency < 200) {
        return {
          icon: Wifi,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-400/20',
          label: 'Fair',
          description: 'Fair connection'
        };
      } else {
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          label: 'Poor',
          description: 'Poor connection',
          animate: 'animate-pulse'
        };
      }
    } else {
      return {
        icon: WifiOff,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/20',
        label: 'Offline',
        description: 'Connection lost',
        animate: 'animate-pulse'
      };
    }
  };

  const formatLatency = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  if (!showLabel && !showLatency) {
    return (
      <div 
        className={`
          inline-flex items-center justify-center rounded-full border p-2 h-8
          ${statusConfig.bgColor} ${statusConfig.borderColor}
          ${className}
        `}
        title={`${statusConfig.label}: ${statusConfig.description}${
          showLatency && latency > 0 ? ` (${formatLatency(latency)})` : ''
        }`}
      >
        <Icon 
          className={`h-4 w-4 ${statusConfig.color} ${statusConfig.animate || ''}`}
        />
      </div>
    );
  }

  return (
    <div 
      className={`
        inline-flex items-center space-x-2 rounded-full border px-3 py-2
        ${statusConfig.bgColor} ${statusConfig.borderColor}
        ${className}
      `}
      title={statusConfig.description}
    >
      <Icon 
        className={`h-4 w-4 ${statusConfig.color} ${statusConfig.animate || ''}`}
      />
      
      {showLabel && (
        <span className={`font-medium text-sm ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      )}
      
      {showLatency && isConnected && latency > 0 && (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-400">
            {formatLatency(latency)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;