'use client';

import React from 'react';
import { Shield, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

/**
 * LoadingScreen - Displays loading state with ZK Shroud Arena branding
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  progress
}) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ZK Shroud Arena</h1>
          <p className="text-gray-400">Tactical Stealth Battle Royale</p>
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <Loader2 className="h-8 w-8 text-purple-500 mx-auto animate-spin" />
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-64 mx-auto mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Loading Message */}
        <p className="text-gray-300 text-lg">{message}</p>

        {/* Loading Tips */}
        <div className="mt-8 text-sm text-gray-500">
          <p>💡 Tip: Use ZK proofs to hide your movements from enemies</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;