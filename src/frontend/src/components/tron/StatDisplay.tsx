import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatDisplayProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export const StatDisplay: React.FC<StatDisplayProps> = ({
  label,
  value,
  trend,
  icon,
  size = 'md',
  animate = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <div className={`glass-panel ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start justify-between mb-2">
        {icon && (
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            {icon}
          </div>
        )}
        {trend && (
          <TrendIcon className={`w-4 h-4 ${trendColors[trend]}`} />
        )}
      </div>
      
      <div className={labelSizeClasses[size] + ' text-gray-400 mb-1'}>
        {label}
      </div>
      
      <div className={`font-bold ${valueSizeClasses[size]} ${animate ? 'animate-pulse' : ''}`}>
        {value}
      </div>
    </div>
  );
};