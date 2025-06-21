'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, CheckCircle, XCircle, Loader2, Eye, EyeOff, Copy, Sparkles } from 'lucide-react';
import { ZkProof } from '../types/zkProof';

interface ProofDisplayProps {
  className?: string;
}

interface ProofLog {
  id: string;
  timestamp: Date;
  type: 'generate' | 'verify' | 'error';
  status: 'pending' | 'success' | 'failed';
  data?: ZkProof;
  error?: string;
  location?: { lat: number; lng: number };
  h3Index?: string;
}

export const ProofDisplay: React.FC<ProofDisplayProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<ProofLog[]>([]);
  const [showFullProof, setShowFullProof] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulate proof generation for demo
  useEffect(() => {
    const simulateProofGeneration = () => {
      const mockLocation = {
        lat: 13.7563 + (Math.random() - 0.5) * 0.01,
        lng: 100.5018 + (Math.random() - 0.5) * 0.01
      };

      // Add pending log
      const logId = `proof-${Date.now()}`;
      const pendingLog: ProofLog = {
        id: logId,
        timestamp: new Date(),
        type: 'generate',
        status: 'pending',
        location: mockLocation,
        h3Index: '8c2a100d2cb25ff'
      };

      setLogs(prev => [pendingLog, ...prev].slice(0, 10)); // Keep last 10 logs

      // Simulate proof generation after 2 seconds
      setTimeout(() => {
        const mockProof: ZkProof = {
          proof: '0x' + Array(512).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          public_inputs: [
            mockLocation.lat.toFixed(6),
            mockLocation.lng.toFixed(6),
            '8c2a100d2cb25ff',
            Date.now().toString()
          ],
          metadata: {
            generated_at: new Date().toISOString(),
            location: { latitude: mockLocation.lat, longitude: mockLocation.lng },
            resolution: 13,
            h3_indices: ['8c2a100d2cb25ff']
          }
        };

        setLogs(prev => prev.map(log => 
          log.id === logId 
            ? { ...log, status: 'success', data: mockProof }
            : log
        ));

        // Simulate verification after another second
        setTimeout(() => {
          const verifyLogId = `verify-${Date.now()}`;
          const verifyLog: ProofLog = {
            id: verifyLogId,
            timestamp: new Date(),
            type: 'verify',
            status: 'pending'
          };

          setLogs(prev => [verifyLog, ...prev].slice(0, 10));

          setTimeout(() => {
            setLogs(prev => prev.map(log => 
              log.id === verifyLogId 
                ? { ...log, status: 'success' }
                : log
            ));
          }, 1000);
        }, 1000);
      }, 2000);
    };

    // Generate initial proof
    simulateProofGeneration();

    // Generate new proof every 10 seconds
    const interval = setInterval(simulateProofGeneration, 10000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatProof = (proof: string) => {
    if (!showFullProof) {
      return proof.substring(0, 20) + '...' + proof.substring(proof.length - 20);
    }
    // Break into chunks for better display
    const chunks = proof.match(/.{1,64}/g) || [];
    return chunks.join('\n');
  };

  const getStatusIcon = (log: ProofLog) => {
    if (log.status === 'pending') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    }
    if (log.status === 'success') {
      return log.type === 'generate' 
        ? <Lock className="w-4 h-4 text-green-400" />
        : <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getStatusText = (log: ProofLog) => {
    if (log.status === 'pending') {
      return log.type === 'generate' ? 'Generating proof...' : 'Verifying proof...';
    }
    if (log.status === 'success') {
      return log.type === 'generate' ? 'Proof generated' : 'Proof verified';
    }
    return 'Failed';
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Zero-Knowledge Proof Log</h3>
          </div>
          <button
            onClick={() => setShowFullProof(!showFullProof)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {showFullProof ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showFullProof ? 'Hide' : 'Show'} Full Proofs
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Real-time ZK proof generation for location privacy
        </p>
      </div>

      {/* Logs */}
      <div className="max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Waiting for location proofs...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                {/* Log Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log)}
                    <span className="text-sm font-medium text-white">
                      {getStatusText(log)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {log.type === 'generate' && log.location && (
                    <span className="text-xs text-gray-400 font-mono">
                      {log.location.lat.toFixed(6)}, {log.location.lng.toFixed(6)}
                    </span>
                  )}
                </div>

                {/* Proof Data */}
                {log.data && log.status === 'success' && (
                  <div className="mt-3 space-y-2">
                    {/* Proof Hash */}
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Proof Hash:</span>
                        <button
                          onClick={() => copyToClipboard(log.data!.proof, log.id + '-proof')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === log.id + '-proof' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                        {formatProof(log.data.proof)}
                      </pre>
                    </div>

                    {/* Public Inputs */}
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Public Inputs:</span>
                        <span className="text-xs text-gray-500">
                          H3 Cell: {log.h3Index}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Latitude:</span>
                          <span className="ml-2 text-cyan-400 font-mono">
                            {log.data.public_inputs[0]}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Longitude:</span>
                          <span className="ml-2 text-cyan-400 font-mono">
                            {log.data.public_inputs[1]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    {showFullProof && (
                      <div className="bg-gray-800 rounded p-3">
                        <span className="text-xs text-gray-400">Metadata:</span>
                        <div className="mt-1 text-xs text-gray-300 space-y-1">
                          <div>Resolution: {log.data.metadata?.resolution}</div>
                          <div>Generated: {new Date(log.data.metadata?.generated_at || '').toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Status */}
                {log.type === 'verify' && log.status === 'success' && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Unlock className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">
                      Proof successfully verified - Location validated without revealing exact position
                    </span>
                  </div>
                )}

                {/* Error */}
                {log.error && (
                  <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-2">
                    <p className="text-xs text-red-400">{log.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live proof generation active</span>
          </div>
          <span>
            {logs.filter(l => l.status === 'success' && l.type === 'generate').length} proofs generated
          </span>
        </div>
      </div>
    </div>
  );
};