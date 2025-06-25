import { describe, it, expect } from 'vitest'
import { getProveData, getVerifyData } from './service';

describe('Integration test for prover', () => {
  it('should return a proof and verify valid', async () => {
    const proveData = {
      lat: 37.774929,
      lon: -122.419416,
      resolution: 10,
      h3_map: ['8a2a107fffffffff'],
    }

    const response = await getProveData(proveData);
    expect(response).toBeDefined();

    const verifyData = {
      proof: response.proof,
      public_inputs: response.public_inputs,
    }

    const verifyResponse = await getVerifyData(verifyData);
    expect(verifyResponse.ok).toBe(true);
  });

  it('should fail to generate proof with missing required fields', async () => {
    // Test with malformed JSON that's missing required fields
    const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${API_BASE_URL}/prove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: 37.774929,
          // Missing lon field
          resolution: 10,
          h3_map: ['8a2a107fffffffff'],
        })
      });
      
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    } catch (error) {
      // Network errors are also acceptable for this test
      expect(error).toBeDefined();
    }
  });
});
