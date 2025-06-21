/**
 * Demo component showcasing API Controller functionality
 */

import React, { useState } from 'react';
import { useAPIController } from '../../hooks/useAPIController';
import { generateLocationProofControlled } from '../../services/apiController';
import { APIControllerStatus } from '../ui/APIControllerStatus';
import { LocationCoordinates } from '../../types/zkProof';

export const APIControllerDemo: React.FC = () => {
  const [proofResult, setProofResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { isProofAllowed, currentPhase } = useAPIController();

  const testProofGeneration = async () => {
    setIsLoading(true);
    setProofResult('');

    try {
      const mockLocation: LocationCoordinates = {
        latitude: 37.7749,
        longitude: -122.4194
      };

      const result = await generateLocationProofControlled(
        mockLocation,
        9,
        ['85283473fffffff'] // Mock H3 index
      );

      if (result.success) {
        setProofResult('✅ Proof generated successfully!');
      } else {
        setProofResult(`❌ ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setProofResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">API Controller Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Controller Status */}
        <div>
          <APIControllerStatus />
        </div>

        {/* Test Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Test API Calls</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">
              Current Phase: <span className={isProofAllowed ? 'text-green-400' : 'text-red-400'}>
                {currentPhase}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {isProofAllowed 
                ? '✅ API calls are allowed in this phase'
                : '❌ API calls are blocked in this phase'}
            </p>
          </div>

          <button
            onClick={testProofGeneration}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded font-medium transition-colors ${
              isLoading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? 'Testing...' : 'Test Proof Generation'}
          </button>

          {proofResult && (
            <div className={`mt-4 p-3 rounded ${
              proofResult.startsWith('✅') 
                ? 'bg-green-900 bg-opacity-30 border border-green-800' 
                : 'bg-red-900 bg-opacity-30 border border-red-800'
            }`}>
              <p className="text-sm">{proofResult}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-800 rounded">
            <p className="text-xs text-blue-400">
              💡 Try changing the game phase in your game state to see how the API controller 
              blocks or allows calls based on the current phase.
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">How it works:</h3>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• API calls are blocked during WAITING, PREPARATION, and GAME_OVER phases</li>
          <li>• API calls are allowed during ACTIVE, SHRINKING, and FINAL_CIRCLE phases</li>
          <li>• Minimum 30-second interval is enforced between proof generations</li>
          <li>• All blocked calls are tracked and displayed in the status panel</li>
        </ul>
      </div>
    </div>
  );
};

export default APIControllerDemo;