/**
 * ZK Proof Service Type Definitions
 * Defines interfaces for location validation proofs
 */

// Base location coordinates
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// H3 geospatial index representation
export type H3Index = string;

// Proof generation request payload
export interface ProveRequest {
  latitude: number;
  longitude: number;
  resolution: number;
  h3_map: H3Index[];
}

// Proof verification request payload  
export interface VerifyRequest {
  proof: string;
  public_inputs: unknown[];
}

// ZK proof data structure
export interface ZkProof {
  proof: string;
  public_inputs: unknown[];
  metadata?: {
    generated_at: string;
    location: LocationCoordinates;
    resolution: number;
    h3_indices: H3Index[];
  };
}

// API response structures
export interface ProveResponse {
  success: boolean;
  proof: string;
  public_inputs: unknown[];
  message?: string;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  error?: string;
}

// Error types for ZK proof operations
export enum ZkProofErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  INVALID_PROOF = 'INVALID_PROOF',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface ZkProofError extends Error {
  type: ZkProofErrorType;
  code?: number;
  details?: Record<string, unknown>;
  retryable: boolean;
}

// Service configuration
export interface ZkProofServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

// Cache entry structure
export interface ProofCacheEntry {
  proof: ZkProof;
  timestamp: number;
  ttl: number;
  key: string;
}

// Service result types with proper error handling
export type ProveResult = {
  success: true;
  data: ZkProof;
} | {
  success: false;
  error: ZkProofError;
};

export type VerifyResult = {
  success: true;
  data: { valid: boolean; message?: string };
} | {
  success: false;
  error: ZkProofError;
};

// Utility types for better type safety
export type ValidatedCoordinates = {
  lat: number;
  lon: number;
  valid: true;
} | {
  valid: false;
  errors: string[];
};

export type ProofRequestOptions = {
  timeout?: number;
  useCache?: boolean;
  retryAttempts?: number;
};