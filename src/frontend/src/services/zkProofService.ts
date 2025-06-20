/**
 * ZK Proof Service
 * Provides abstraction layer for location validation proofs
 */

import {
  ProveRequest,
  VerifyRequest,
  ZkProof,
  ProveResponse,
  VerifyResponse,
  ZkProofError,
  ZkProofErrorType,
  ZkProofServiceConfig,
  ProofCacheEntry,
  ProveResult,
  VerifyResult,
  ValidatedCoordinates,
  ProofRequestOptions,
  LocationCoordinates,
  H3Index
} from '../types/zkProof';

/**
 * Default configuration for ZK proof service
 */
const DEFAULT_CONFIG: ZkProofServiceConfig = {
  baseUrl: 'http://localhost:8080',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
};

/**
 * ZK Proof Service Class
 * Handles proof generation and verification with comprehensive error handling
 */
export class ZkProofService {
  private config: ZkProofServiceConfig;
  private cache: Map<string, ProofCacheEntry> = new Map();

  constructor(config: Partial<ZkProofServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a ZK proof for location validation
   */
  async generateProof(
    coordinates: LocationCoordinates,
    resolution: number,
    h3Map: H3Index[],
    options: ProofRequestOptions = {}
  ): Promise<ProveResult> {
    try {
      // Validate input coordinates
      const validatedCoords = this.validateCoordinates(coordinates);
      if (!validatedCoords.valid) {
        return {
          success: false,
          error: this.createError(
            ZkProofErrorType.INVALID_COORDINATES,
            `Invalid coordinates: ${validatedCoords.errors.join(', ')}`
          )
        };
      }

      // Check cache if enabled
      if (options.useCache !== false && this.config.cacheEnabled) {
        const cached = this.getCachedProof(coordinates, resolution, h3Map);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      // Prepare request payload
      const payload: ProveRequest = {
        lat: coordinates.lat,
        lon: coordinates.lon,
        resolution,
        h3_map: h3Map
      };

      // Execute request with retry logic
      const response = await this.executeWithRetry(
        () => this.makeProveRequest(payload, options),
        options.retryAttempts ?? this.config.retryAttempts
      );

      if (!response.success) {
        return {
          success: false,
          error: this.createError(
            ZkProofErrorType.SERVER_ERROR,
            response.error || 'Proof generation failed'
          )
        };
      }

      // Create structured proof object
      const proof: ZkProof = {
        proof: response.proof,
        public_inputs: response.public_inputs,
        metadata: {
          generated_at: new Date().toISOString(),
          location: coordinates,
          resolution,
          h3_indices: h3Map
        }
      };

      // Cache the result if enabled
      if (this.config.cacheEnabled) {
        this.cacheProof(coordinates, resolution, h3Map, proof);
      }

      return { success: true, data: proof };

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Verify a ZK proof
   */
  async verifyProof(
    proof: string,
    publicInputs: unknown[],
    options: ProofRequestOptions = {}
  ): Promise<VerifyResult> {
    try {
      // Validate proof data
      if (!proof || !publicInputs) {
        return {
          success: false,
          error: this.createError(
            ZkProofErrorType.INVALID_PROOF,
            'Proof and public inputs are required'
          )
        };
      }

      // Prepare request payload
      const payload: VerifyRequest = {
        proof,
        public_inputs: publicInputs
      };

      // Execute request with retry logic
      const response = await this.executeWithRetry(
        () => this.makeVerifyRequest(payload, options),
        options.retryAttempts ?? this.config.retryAttempts
      );

      if (!response.success) {
        return {
          success: false,
          error: this.createError(
            ZkProofErrorType.SERVER_ERROR,
            response.error || 'Proof verification failed'
          )
        };
      }

      return {
        success: true,
        data: {
          valid: response.valid,
          message: response.message
        }
      };

    } catch (error) {
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Make HTTP request to /prove endpoint
   */
  private async makeProveRequest(
    payload: ProveRequest,
    options: ProofRequestOptions
  ): Promise<ProveResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 
      options.timeout ?? this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/prove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        proof: data.proof,
        public_inputs: data.public_inputs,
        message: data.message
      };

    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Make HTTP request to /verify endpoint
   */
  private async makeVerifyRequest(
    payload: VerifyRequest,
    options: ProofRequestOptions
  ): Promise<VerifyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 
      options.timeout ?? this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        valid: data.valid || data.success, // Handle different response formats
        message: data.message
      };

    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Validate coordinate inputs
   */
  private validateCoordinates(coords: LocationCoordinates): ValidatedCoordinates {
    const errors: string[] = [];

    if (typeof coords.lat !== 'number' || isNaN(coords.lat)) {
      errors.push('Latitude must be a valid number');
    } else if (coords.lat < -90 || coords.lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (typeof coords.lon !== 'number' || isNaN(coords.lon)) {
      errors.push('Longitude must be a valid number');
    } else if (coords.lon < -180 || coords.lon > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    return errors.length > 0 
      ? { valid: false, errors }
      : { lat: coords.lat, lon: coords.lon, valid: true };
  }

  /**
   * Get cached proof if available and not expired
   */
  private getCachedProof(
    coords: LocationCoordinates,
    resolution: number,
    h3Map: H3Index[]
  ): ZkProof | null {
    const key = this.getCacheKey(coords, resolution, h3Map);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.proof;
  }

  /**
   * Cache a proof result
   */
  private cacheProof(
    coords: LocationCoordinates,
    resolution: number,
    h3Map: H3Index[],
    proof: ZkProof
  ): void {
    const key = this.getCacheKey(coords, resolution, h3Map);
    const entry: ProofCacheEntry = {
      proof,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL,
      key
    };

    this.cache.set(key, entry);

    // Clean up expired entries periodically
    this.cleanupCache();
  }

  /**
   * Generate cache key from proof parameters
   */
  private getCacheKey(
    coords: LocationCoordinates,
    resolution: number,
    h3Map: H3Index[]
  ): string {
    return `${coords.lat},${coords.lon},${resolution},${h3Map.sort().join(',')}`;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Don't retry validation errors or timeouts
      return error.name === 'AbortError' || 
             error.message.includes('validation') ||
             error.message.includes('400');
    }
    return false;
  }

  /**
   * Handle errors and convert to ZkProofError
   */
  private handleError(error: unknown): ZkProofError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return this.createError(ZkProofErrorType.TIMEOUT, 'Request timeout');
      }
      
      if (error.message.includes('fetch')) {
        return this.createError(ZkProofErrorType.NETWORK_ERROR, error.message);
      }
      
      if (error.message.includes('429')) {
        return this.createError(ZkProofErrorType.RATE_LIMITED, 'Rate limit exceeded');
      }
    }

    return this.createError(ZkProofErrorType.SERVER_ERROR, String(error));
  }

  /**
   * Create structured error object
   */
  private createError(
    type: ZkProofErrorType,
    message: string,
    retryable: boolean = true
  ): ZkProofError {
    const error = new Error(message) as ZkProofError;
    error.type = type;
    error.retryable = retryable;
    return error;
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached proofs
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Update service configuration
   */
  public updateConfig(config: Partial<ZkProofServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default service instance
 */
export const zkProofService = new ZkProofService();

/**
 * Convenience functions for direct usage
 */
export const generateLocationProof = (
  coordinates: LocationCoordinates,
  resolution: number,
  h3Map: H3Index[],
  options?: ProofRequestOptions
) => zkProofService.generateProof(coordinates, resolution, h3Map, options);

export const verifyLocationProof = (
  proof: string,
  publicInputs: unknown[],
  options?: ProofRequestOptions
) => zkProofService.verifyProof(proof, publicInputs, options);