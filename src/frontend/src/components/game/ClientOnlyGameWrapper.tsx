"use client";

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import ZKShroudArena from './ZKShroudArena';

interface ClientOnlyGameWrapperProps {
  gameId: string;
}

export default function ClientOnlyGameWrapper({ gameId }: ClientOnlyGameWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <div className="text-white text-xl font-semibold mb-2">Loading ZK Shroud Arena...</div>
          <div className="text-gray-300">Initializing cryptographic systems</div>
        </div>
      </div>
    );
  }

  return <ZKShroudArena gameId={gameId} />;
}