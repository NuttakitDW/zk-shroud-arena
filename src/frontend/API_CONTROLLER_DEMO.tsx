/**
 * API Controller Demo - shows how the API controller blocks calls based on game phase
 * 
 * To run this demo:
 * 1. Add this component to your app
 * 2. The demo will show real-time API blocking based on game phase
 */

import React from 'react';
import { APIControllerDemo } from './src/components/demo/APIControllerDemo';

// Example usage in your app:
export const App = () => {
  return (
    <div>
      <APIControllerDemo />
    </div>
  );
};

/**
 * The API Controller provides the following features:
 * 
 * 1. Phase-based blocking:
 *    - LOBBY: All API calls blocked
 *    - PREPARATION: All API calls blocked  
 *    - ACTIVE: API calls allowed
 *    - SHRINKING: API calls allowed
 *    - ZONE_SHRINKING: API calls allowed
 *    - FINAL_ZONE: API calls allowed
 *    - GAME_OVER: All API calls blocked
 *    - ENDED: All API calls blocked
 * 
 * 2. Rate limiting:
 *    - 30-second minimum interval between proof generations
 *    - Can be overridden with force: true option
 * 
 * 3. Statistics tracking:
 *    - Total calls made
 *    - Blocked vs allowed calls
 *    - Calls by game phase
 *    - Block rate percentage
 * 
 * 4. Clear error messages:
 *    - Users are informed why calls are blocked
 *    - Countdown timer shows when next proof is allowed
 */

// Example of using the controlled API in your code:
import { generateLocationProofControlled } from './src/services/apiController';
import { useAPIController } from './src/hooks/useAPIController';

export const MyGameComponent = () => {
  const { isProofAllowed, timeUntilNextProof } = useAPIController();
  
  const handleProofGeneration = async () => {
    if (!isProofAllowed) {
      console.log('API calls are blocked in current game phase');
      return;
    }
    
    if (timeUntilNextProof > 0) {
      console.log(`Please wait ${timeUntilNextProof} seconds before next proof`);
      return;
    }
    
    const result = await generateLocationProofControlled(
      { latitude: 37.7749, longitude: -122.4194 },
      9,
      ['85283473fffffff']
    );
    
    if (result.success) {
      console.log('Proof generated successfully!');
    } else {
      console.log('Proof blocked:', result.error?.message);
    }
  };
  
  return (
    <button onClick={handleProofGeneration}>
      Generate Proof
    </button>
  );
};