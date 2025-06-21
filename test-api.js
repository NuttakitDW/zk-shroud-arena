#!/usr/bin/env node

/**
 * ZK Hack 2025 - API Test Script
 * Tests the /prove and /verify endpoints
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

// Test data for the prove endpoint
const testProveData = {
  lat: 40.689247,
  lon: -74.044502,
  resolution: 10,
  h3_map: [
    "8a2a1072b5affff",
    "8a2a1072b51ffff", 
    "8a2a1072b50ffff"
  ]
};

async function makeRequest(endpoint, data) {
  try {
    console.log(`\n🔍 Testing ${endpoint}...`);
    console.log(`📤 Request: ${JSON.stringify(data, null, 2)}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📥 Response: ${JSON.stringify(responseData, null, 2)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function testProveEndpoint() {
  console.log('\n🚀 Testing /prove endpoint');
  console.log('=' .repeat(50));
  
  return await makeRequest('/prove', testProveData);
}

async function testVerifyEndpoint(proofData) {
  console.log('\n🔍 Testing /verify endpoint');
  console.log('=' .repeat(50));
  
  if (!proofData || !proofData.proof || !proofData.public_inputs) {
    console.log('❌ Cannot test verify - no valid proof data from prove endpoint');
    return null;
  }

  const verifyData = {
    proof: proofData.proof,
    public_inputs: proofData.public_inputs
  };
  
  return await makeRequest('/verify', verifyData);
}

async function runTests() {
  console.log('🧪 ZK Hack 2025 - API Testing Suite');
  console.log('=' .repeat(50));
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  
  // Test prove endpoint
  const proveResult = await testProveEndpoint();
  
  // Test verify endpoint with the proof from prove
  const verifyResult = await testVerifyEndpoint(proveResult);
  
  // Summary
  console.log('\n📋 Test Summary');
  console.log('=' .repeat(50));
  console.log(`✅ /prove endpoint: ${proveResult ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ /verify endpoint: ${verifyResult ? 'PASSED' : 'FAILED'}`);
  
  if (proveResult && verifyResult) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the API server status.');
  }
}

// Run the tests
runTests().catch(console.error);