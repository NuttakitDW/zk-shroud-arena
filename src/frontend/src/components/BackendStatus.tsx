'use client';

import React, { useState, useEffect } from 'react';
import { Server, Check, X, AlertCircle } from 'lucide-react';
import { env } from '../config/environment';

export const BackendStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(env.getApiUrl(env.API.HEALTHZ));
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <div className={`
      bg-gray-800 border rounded-lg p-3
      ${isConnected ? 'border-green-500/50' : 'border-red-500/50'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            Backend Status
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isChecking ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : isConnected ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          Environment: <span className="font-mono text-gray-400">{isProduction ? 'Production' : 'Development'}</span>
        </div>
        <div className="text-xs text-gray-500">
          Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {lastChecked && (
          <div className="text-xs text-gray-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-400">
              <p className="font-semibold">Connection Failed</p>
              <p className="mt-1">
                Unable to connect to backend server. The server might be down or unreachable.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="mt-2 w-full text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isChecking ? 'Checking...' : 'Check Now'}
      </button>
    </div>
  );
};