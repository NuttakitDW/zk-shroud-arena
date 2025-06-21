'use client';

import React, { useEffect, useState } from 'react';
import { Coins, Sparkles } from 'lucide-react';

interface MiningAnimationProps {
  isActive: boolean;
  pointsPerTick?: number;
  className?: string;
}

export const MiningAnimation: React.FC<MiningAnimationProps> = ({ 
  isActive, 
  pointsPerTick = 10,
  className = '' 
}) => {
  const [showCoin, setShowCoin] = useState(false);
  const [coinCount, setCoinCount] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCoinCount(0);
      return;
    }

    // Show coin animation every 2 seconds when mining
    const interval = setInterval(() => {
      setShowCoin(true);
      setCoinCount(prev => prev + 1);
      
      // Hide coin after animation
      setTimeout(() => {
        setShowCoin(false);
      }, 1500);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 pointer-events-none ${className}`}>
      {/* Mining indicator */}
      <div className="relative">
        {/* Pulsing ring effect */}
        <div className="absolute inset-0 animate-ping">
          <div className="w-12 h-12 bg-green-400 rounded-full opacity-20"></div>
        </div>
        
        {/* Central mining icon */}
        <div className="relative bg-green-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>

        {/* Coin collection animation */}
        {showCoin && (
          <div 
            key={coinCount}
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 animate-float-up"
          >
            <div className="flex items-center gap-1 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              <Coins className="w-3 h-3" />
              +{pointsPerTick}
            </div>
          </div>
        )}

        {/* Mining status text */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-semibold text-green-400 bg-gray-900/80 px-2 py-1 rounded">
            Mining...
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px);
          }
        }
        
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Mining overlay for map markers
interface MiningOverlayProps {
  position: [number, number];
  isInSafeZone: boolean;
  pointsPerTick?: number;
}

export const MiningOverlay: React.FC<MiningOverlayProps> = ({ 
  position, 
  isInSafeZone, 
  pointsPerTick = 10 
}) => {
  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      <MiningAnimation 
        isActive={isInSafeZone} 
        pointsPerTick={pointsPerTick}
      />
    </div>
  );
};