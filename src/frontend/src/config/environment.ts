/**
 * Environment configuration
 * Centralizes all environment variables and provides defaults
 */

export const env = {
  /**
   * Backend API URL
   * Defaults to localhost:8080 if not specified
   */
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  
  /**
   * API endpoints
   */
  API: {
    PROVE: '/prove',
    VERIFY: '/verify',
    HEALTHZ: '/healthz'
  },
  
  /**
   * Get full API URL for an endpoint
   */
  getApiUrl(endpoint: string): string {
    return `${this.BACKEND_URL}${endpoint}`;
  }
} as const;

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration:', {
    BACKEND_URL: env.BACKEND_URL,
    NODE_ENV: process.env.NODE_ENV
  });
}