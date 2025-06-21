/**
 * Location Service for ZK Shroud Arena
 * Handles real-world location tracking with privacy controls
 */

import { LocationCoordinates } from '../types/zkProof';

export interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  unavailable: boolean;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchLocation?: boolean;
}

export interface LocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';
}

export interface LocationUpdate {
  coordinates: LocationCoordinates;
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

export type LocationUpdateCallback = (update: LocationUpdate) => void;
export type LocationErrorCallback = (error: LocationError) => void;

class LocationService {
  private watchId: number | null = null;
  private lastKnownPosition: LocationUpdate | null = null;
  private permissionState: LocationPermissionState = {
    granted: false,
    denied: false,
    prompt: true,
    unavailable: false
  };

  constructor() {
    this.checkGeolocationSupport();
    this.initializePermissionState();
  }

  /**
   * Check if geolocation is supported by the browser
   */
  private checkGeolocationSupport(): boolean {
    if (!navigator.geolocation) {
      this.permissionState.unavailable = true;
      console.warn('Geolocation is not supported by this browser');
      return false;
    }
    return true;
  }

  /**
   * Initialize permission state by checking current permissions
   */
  private async initializePermissionState(): Promise<void> {
    if (!navigator.permissions) {
      // Fallback for browsers without Permissions API
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      
      this.permissionState = {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt',
        unavailable: this.permissionState.unavailable
      };

      // Listen for permission changes
      result.addEventListener('change', () => {
        this.permissionState = {
          granted: result.state === 'granted',
          denied: result.state === 'denied',
          prompt: result.state === 'prompt',
          unavailable: this.permissionState.unavailable
        };
      });
    } catch (error) {
      console.warn('Could not query geolocation permission:', error);
    }
  }

  /**
   * Get current permission state
   */
  public getPermissionState(): LocationPermissionState {
    return { ...this.permissionState };
  }

  /**
   * Request location permission and get current position
   */
  public async requestLocation(options: LocationOptions = {}): Promise<LocationUpdate> {
    if (this.permissionState.unavailable) {
      throw {
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'UNSUPPORTED'
      } as LocationError;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 300000 // 5 minutes
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const update = this.processPosition(position);
          this.lastKnownPosition = update;
          this.permissionState.granted = true;
          this.permissionState.denied = false;
          this.permissionState.prompt = false;
          resolve(update);
        },
        (error) => {
          const locationError = this.processError(error);
          this.updatePermissionStateFromError(locationError);
          reject(locationError);
        },
        defaultOptions
      );
    });
  }

  /**
   * Start watching location changes
   */
  public watchLocation(
    onUpdate: LocationUpdateCallback,
    onError: LocationErrorCallback,
    options: LocationOptions = {}
  ): void {
    if (this.permissionState.unavailable) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'UNSUPPORTED'
      });
      return;
    }

    if (this.watchId !== null) {
      this.stopWatching();
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000 // 1 minute for watch
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const update = this.processPosition(position);
        this.lastKnownPosition = update;
        this.permissionState.granted = true;
        this.permissionState.denied = false;
        this.permissionState.prompt = false;
        onUpdate(update);
      },
      (error) => {
        const locationError = this.processError(error);
        this.updatePermissionStateFromError(locationError);
        onError(locationError);
      },
      defaultOptions
    );
  }

  /**
   * Stop watching location changes
   */
  public stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get last known position
   */
  public getLastKnownPosition(): LocationUpdate | null {
    return this.lastKnownPosition ? { ...this.lastKnownPosition } : null;
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  public calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Check if location has changed significantly
   */
  public hasLocationChanged(
    oldCoord: LocationCoordinates,
    newCoord: LocationCoordinates,
    threshold: number = 10 // meters
  ): boolean {
    return this.calculateDistance(oldCoord, newCoord) > threshold;
  }

  /**
   * Process position from geolocation API
   */
  private processPosition(position: GeolocationPosition): LocationUpdate {
    return {
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || undefined
      },
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined
    };
  }

  /**
   * Process error from geolocation API
   */
  private processError(error: GeolocationPositionError): LocationError {
    let type: LocationError['type'];
    let message: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        type = 'PERMISSION_DENIED';
        message = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        type = 'POSITION_UNAVAILABLE';
        message = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        type = 'TIMEOUT';
        message = 'Location request timed out';
        break;
      default:
        type = 'POSITION_UNAVAILABLE';
        message = 'An unknown error occurred';
    }

    return {
      code: error.code,
      message,
      type
    };
  }

  /**
   * Update permission state based on error
   */
  private updatePermissionStateFromError(error: LocationError): void {
    if (error.type === 'PERMISSION_DENIED') {
      this.permissionState.denied = true;
      this.permissionState.granted = false;
      this.permissionState.prompt = false;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopWatching();
    this.lastKnownPosition = null;
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;