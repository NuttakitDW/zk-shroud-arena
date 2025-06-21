'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, CheckCircle, XCircle, Loader2, Terminal, Copy, MapPin } from 'lucide-react';
import { zkProofService } from '../services/zkProofService';
import { H3Zone } from './Map/types';
import * as h3 from 'h3-js';
import { env } from '../config/environment';

interface LiveProofLoggerProps {
  playerLocation?: { latitude: number; longitude: number };
  currentZone?: H3Zone | null;
  className?: string;
  onProofGenerated?: (proof: any) => void;
}

interface ProofEvent {
  id: string;
  timestamp: Date;
  type: 'info' | 'generate' | 'verify' | 'success' | 'error';
  message: string;
  data?: any;
  status?: 'pending' | 'complete' | 'failed';
}

export const LiveProofLogger: React.FC<LiveProofLoggerProps> = ({ 
  playerLocation, 
  currentZone,
  className = '',
  onProofGenerated
}) => {
  const [events, setEvents] = useState<ProofEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastProof, setLastProof] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [demoMode, setDemoMode] = useState(false); // Default to real API mode

  const addEvent = useCallback((event: Omit<ProofEvent, 'id' | 'timestamp'>) => {
    const newEvent: ProofEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
  }, []);

  // Generate simulated proof for demo
  const generateDemoProof = useCallback(async (forceZone?: boolean) => {
    if (!playerLocation || isGenerating) return;
    if (!currentZone && !forceZone) return;

    setIsGenerating(true);
    
    // If forcing, create a mock zone at current location
    const zone = currentZone || (forceZone ? {
      id: 'demo-zone-force',
      name: 'Demo Zone (Current Location)',
      h3Index: h3.latLngToCell(playerLocation.latitude, playerLocation.longitude, 13)
    } : null);

    if (!zone) return;
    
    addEvent({
      type: 'info',
      message: `🎯 ${forceZone ? 'Manual proof generation at' : 'Player entered zone:'} ${zone.name}`,
      data: { zone: zone.id, h3Index: zone.h3Index }
    });

    addEvent({
      type: 'generate',
      message: 'Generating zero-knowledge proof...',
      status: 'pending'
    });

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock proof data
    const mockProof = {
      proof: '0x' + Array(256).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      public_inputs: [
        zone.h3Index,
        Date.now().toString(),
        'zone_validation_proof'
      ],
      metadata: {
        generated_at: new Date().toISOString(),
        zone: zone.name,
        h3_resolution: 13
      }
    };

    setLastProof(mockProof);
    onProofGenerated?.(mockProof);
    
    addEvent({
      type: 'success',
      message: '✅ Proof generated successfully!',
      data: {
        proofLength: mockProof.proof.length,
        publicInputs: mockProof.public_inputs.length
      },
      status: 'complete'
    });

    addEvent({
      type: 'info',
      message: `🔐 Proof validates presence in "${zone.name}" without revealing exact GPS coordinates`,
      data: { proof: mockProof.proof }
    });

    // Simulate verification
    setTimeout(() => {
      addEvent({
        type: 'verify',
        message: 'Verifying proof with smart contract...',
        status: 'pending'
      });

      setTimeout(() => {
        addEvent({
          type: 'success',
          message: '✅ Proof verified! Player confirmed in zone without location exposure.',
          status: 'complete'
        });
      }, 1000);
    }, 500);

    setIsGenerating(false);
  }, [playerLocation, currentZone, isGenerating, addEvent]);

  // Generate proof when entering a zone
  const generateLocationProof = useCallback(async () => {
    if (!playerLocation || !currentZone || isGenerating) return;

    setIsGenerating(true);
    
    addEvent({
      type: 'info',
      message: `🎯 Player entered zone: ${currentZone.name}`,
      data: { zone: currentZone.id, h3Index: currentZone.h3Index }
    });

    addEvent({
      type: 'generate',
      message: 'Generating zero-knowledge proof...',
      status: 'pending'
    });

    try {
      // Get H3 index for current location
      const playerH3 = h3.latLngToCell(
        playerLocation.latitude, 
        playerLocation.longitude, 
        h3.getResolution(currentZone.h3Index)
      );

      addEvent({
        type: 'info',
        message: `📍 Location: ${playerLocation.latitude.toFixed(6)}, ${playerLocation.longitude.toFixed(6)}`,
        data: { h3Index: playerH3 }
      });

      // Log the API request
      const provePayload = {
        lat: playerLocation.latitude,
        lon: playerLocation.longitude,
        resolution: h3.getResolution(currentZone.h3Index),
        h3_map: [currentZone.h3Index]
      };
      
      console.log('🚀 Calling Backend API:');
      console.log(`Endpoint: ${env.BACKEND_URL}/prove`);
      console.log('Request Payload:', JSON.stringify(provePayload, null, 2));

      // Generate the proof
      const result = await zkProofService.generateProof(
        playerLocation,
        h3.getResolution(currentZone.h3Index),
        [currentZone.h3Index],
        { useCache: false }
      );

      if (result.success && result.data) {
        setLastProof(result.data);
        
        // Log the real proof response
        console.log('✅ Proof Generated Successfully!');
        console.log('Full API Response:', JSON.stringify(result.data, null, 2));
        
        // Also log in the format user requested if needed
        const formattedProof = {
          ok: true,
          proof: result.data.proof,
          public_inputs: result.data.public_inputs
        };
        
        console.log('\nFormatted Proof:');
        console.log(JSON.stringify(formattedProof, null, 2));
        
        // Notify parent component
        onProofGenerated?.(formattedProof);
        
        addEvent({
          type: 'success',
          message: '✅ Proof generated successfully!',
          data: {
            proofLength: result.data.proof.length,
            publicInputs: result.data.public_inputs.length
          },
          status: 'complete'
        });

        addEvent({
          type: 'info',
          message: `🔐 Proof generated with ${result.data.public_inputs?.length || 0} public inputs`,
          data: { proof: result.data.proof }
        });

        // Call verify endpoint
        addEvent({
          type: 'verify',
          message: 'Verifying proof with backend...',
          status: 'pending'
        });

        const verifyPayload = {
          proof: result.data.proof,
          public_inputs: result.data.public_inputs
        };
        
        console.log('\n🔍 Calling Verify API:');
        console.log(`Endpoint: ${env.BACKEND_URL}/verify`);
        console.log('Verify Payload:', JSON.stringify(verifyPayload, null, 2));

        const verifyResult = await zkProofService.verifyProof(
          result.data.proof,
          result.data.public_inputs,
          { useCache: false }
        );

        console.log('\n✅ Verify Response:');
        console.log(JSON.stringify({
          success: verifyResult.success,
          valid: verifyResult.data?.valid || false,
          message: verifyResult.data?.message || verifyResult.error?.message
        }, null, 2));

        if (verifyResult.success && verifyResult.data?.valid) {
          addEvent({
            type: 'success',
            message: '✅ Proof verified! Location validated without revealing exact position.',
            status: 'complete'
          });
        } else {
          addEvent({
            type: 'error',
            message: `❌ Verification failed: ${verifyResult.error?.message || 'Invalid proof'}`,
            status: 'failed'
          });
        }
      } else {
        console.error('❌ Proof Generation Failed:', result.error);
        addEvent({
          type: 'error',
          message: `❌ Failed to generate proof: ${result.error?.message || 'Unknown error'}`,
          status: 'failed'
        });
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      addEvent({
        type: 'error',
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'failed'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [playerLocation, currentZone, isGenerating, addEvent]);

  // Auto-generate proofs when entering zones
  useEffect(() => {
    if (autoGenerate && currentZone && playerLocation) {
      if (demoMode) {
        generateDemoProof(false); // Don't force when auto-generating
      } else {
        generateLocationProof();
      }
    }
  }, [currentZone?.id, autoGenerate, demoMode]); // Only trigger when zone changes

  // Add initial message
  useEffect(() => {
    addEvent({
      type: 'info',
      message: '🚀 Zero-Knowledge Proof Logger initialized'
    });
    
    addEvent({
      type: 'info',
      message: demoMode ? '🎮 Demo Mode Active - Simulated proofs will be generated' : '📡 Live Mode - Connected to backend'
    });

    addEvent({
      type: 'info',
      message: '📡 Waiting for player to enter a zone...'
    });
  }, [addEvent, demoMode]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEventIcon = (event: ProofEvent) => {
    switch (event.type) {
      case 'generate':
        return event.status === 'pending' 
          ? <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          : <Shield className="w-3 h-3 text-blue-400" />;
      case 'verify':
        return event.status === 'pending'
          ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
          : <CheckCircle className="w-3 h-3 text-purple-400" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const getEventColor = (event: ProofEvent) => {
    switch (event.type) {
      case 'generate': return 'text-blue-400';
      case 'verify': return 'text-purple-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-black/90 backdrop-blur-sm rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-cyan-900/20 to-purple-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">ZK Proof Logger</h3>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              <span className="text-gray-300">Demo Mode</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              <span className="text-gray-300">Auto-generate</span>
            </label>
            {playerLocation && (
              <button
                onClick={() => demoMode ? generateDemoProof(true) : generateLocationProof()}
                disabled={isGenerating || !playerLocation}
                className="px-3 py-1 text-sm bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Proof'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {playerLocation ? (
            <span className="text-green-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location Active
            </span>
          ) : (
            <span className="text-gray-500">No Location</span>
          )}
          {currentZone ? (
            <span className="text-cyan-400">
              Zone: {currentZone.name}
            </span>
          ) : playerLocation && (
            <span className="text-yellow-400 text-xs">
              Move into a green zone to generate proofs
            </span>
          )}
        </div>
        {lastProof && (
          <button
            onClick={() => copyToClipboard(JSON.stringify(lastProof, null, 2), 'last-proof')}
            className="text-gray-400 hover:text-white flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            {copiedId === 'last-proof' ? 'Copied!' : 'Copy Last Proof'}
          </button>
        )}
      </div>

      {/* Event Log */}
      <div className="h-[400px] overflow-y-auto p-4 font-mono text-xs space-y-1">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-2">
            <span className="text-gray-600 flex-shrink-0">
              {event.timestamp.toLocaleTimeString()}
            </span>
            {getEventIcon(event)}
            <span className={`flex-1 ${getEventColor(event)}`}>
              {event.message}
            </span>
            {event.data?.proof && (
              <button
                onClick={() => copyToClipboard(event.data.proof, event.id)}
                className="text-gray-600 hover:text-gray-400 ml-2"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Events: {events.length}</span>
          <span>
            Proofs: {events.filter(e => e.type === 'success' && e.message.includes('generated')).length}
          </span>
        </div>
      </div>
    </div>
  );
};