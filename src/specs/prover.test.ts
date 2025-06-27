import { describe, it, expect } from 'vitest'
import { getProveData, getVerifyData } from './service';

describe('Integration test for prover', () => {
  it('should return a proof and verify valid', async () => {
    const proveData = {
      lat: 40.689247,
      lon: -74.044502,
      resolution: 10,
      h3_map: [
        "8a2a1072b5affff",
        "8a2a1072b51ffff", 
        "8a2a1072b50ffff"
      ]
    };

    const response = await getProveData(proveData);
    expect(response).toBeDefined();

    const verifyData = {
      proof: response.proof,
      public_inputs: response.public_inputs,
    }

    const verifyResponse = await getVerifyData(verifyData);
    expect(verifyResponse.ok).toBe(true);
  });
});
