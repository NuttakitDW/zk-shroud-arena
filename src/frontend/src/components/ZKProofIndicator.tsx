'use client';

import React from 'react';
import { Shield, CheckCircle, AlertTriangle, Loader2, Clock, X } from 'lucide-react';
import { ZKProofStatus } from '../types/gameState';

interface ZKProofIndicatorProps {
  status: ZKProofStatus;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ZKProofIndicator - Visual indicator for ZK proof status
 */
export const ZKProofIndicator: React.FC<ZKProofIndicatorProps> = ({
  status,
  className = '',
  showLabel = true,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case ZKProofStatus.NONE:
        return {
          icon: Shield,
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          label: 'Ready',
          description: 'Ready to generate proof'
        };
      
      case ZKProofStatus.GENERATING:
        return {
          icon: Loader2,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/20',
          label: 'Generating',
          description: 'Creating ZK proof...',
          animate: 'animate-spin'
        };
      
      case ZKProofStatus.PENDING:
        return {
          icon: Clock,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/20',
          label: 'Verifying',
          description: 'Proof verification in progress',
          animate: 'animate-pulse'
        };
      
      case ZKProofStatus.VALID:
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/20',
          label: 'Valid',
          description: 'Proof verified successfully'
        };
      
      case ZKProofStatus.INVALID:
        return {
          icon: X,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          label: 'Invalid',
          description: 'Proof verification failed'
        };
      
      case ZKProofStatus.EXPIRED:
        return {
          icon: Clock,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-400/20',
          label: 'Expired',
          description: 'Proof has expired'
        };
      
      case ZKProofStatus.ERROR:
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          label: 'Error',
          description: 'Error during proof generation'
        };
      
      default:
        return {
          icon: Shield,
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          label: 'Unknown',
          description: 'Unknown status'
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 'h-3 w-3',
          padding: 'p-1',
          textSize: 'text-xs',
          containerSize: 'h-6'
        };
      case 'lg':
        return {
          iconSize: 'h-6 w-6',
          padding: 'p-3',
          textSize: 'text-base',
          containerSize: 'h-12'
        };
      default: // md
        return {
          iconSize: 'h-4 w-4',
          padding: 'p-2',
          textSize: 'text-sm',
          containerSize: 'h-8'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();
  const Icon = statusConfig.icon;

  if (!showLabel) {
    return (
      <div 
        className={`
          inline-flex items-center justify-center rounded-full border
          ${statusConfig.bgColor} ${statusConfig.borderColor}
          ${sizeConfig.padding} ${sizeConfig.containerSize}
          ${className}
        `}
        title={`${statusConfig.label}: ${statusConfig.description}`}
      >
        <Icon 
          className={`
            ${sizeConfig.iconSize} ${statusConfig.color}
            ${statusConfig.animate || ''}
          `}
        />
      </div>
    );
  }

  return (
    <div 
      className={`
        inline-flex items-center space-x-2 rounded-full border px-3
        ${statusConfig.bgColor} ${statusConfig.borderColor}
        ${sizeConfig.padding}
        ${className}
      `}
      title={statusConfig.description}
    >
      <Icon 
        className={`
          ${sizeConfig.iconSize} ${statusConfig.color}
          ${statusConfig.animate || ''}
        `}
      />
      <span className={`font-medium ${statusConfig.color} ${sizeConfig.textSize}`}>
        {statusConfig.label}
      </span>
    </div>
  );
};

export default ZKProofIndicator;