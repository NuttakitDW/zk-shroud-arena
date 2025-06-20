/**
 * Unit Tests for Location Service
 * Tests for real-world location tracking with privacy controls
 */

import { locationService } from '../../services/locationService';
import { LocationCoordinates } from '../../types/zkProof';

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

// Mock permissions API
const mockPermissions = {
  query: jest.fn(),
};

// Mock navigator with geolocation
Object.defineProperty(global, 'navigator', {
  writable: true,
  value: {
    geolocation: mockGeolocation,
    permissions: mockPermissions,
  },
});

// Mock position data
const mockPosition: GeolocationPosition = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: null,
    accuracy: 10,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

const mockHighAccuracyPosition: GeolocationPosition = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 15,
    accuracy: 5,
    altitudeAccuracy: 2,
    heading: 90,
    speed: 2.5,
  },
  timestamp: Date.now(),
};

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    locationService.cleanup();
  });

  afterEach(() => {
    locationService.cleanup();
  });

  describe('Geolocation Support Detection', () => {
    it('should detect geolocation support', () => {
      const permissionState = locationService.getPermissionState();
      expect(permissionState.unavailable).toBe(false);
    });

    it('should handle browsers without geolocation', () => {
      // Temporarily remove geolocation
      const originalGeolocation = global.navigator.geolocation;
      // @ts-expect-error - Intentionally setting to undefined for testing
      global.navigator.geolocation = undefined;

      // Create new instance to trigger support check
      const testService = new (locationService.constructor as new () => typeof locationService)();
      const permissionState = testService.getPermissionState();
      
      expect(permissionState.unavailable).toBe(true);
      
      // Restore
      global.navigator.geolocation = originalGeolocation;
    });
  });

  describe('Permission Management', () => {
    it('should initialize permission state correctly', async () => {
      const mockPermissionResult = {
        state: 'prompt',
        addEventListener: jest.fn(),
      };
      
      mockPermissions.query.mockResolvedValue(mockPermissionResult);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const permissionState = locationService.getPermissionState();
      expect(permissionState.prompt).toBe(true);
      expect(permissionState.granted).toBe(false);
      expect(permissionState.denied).toBe(false);
    });

    it('should handle permission query failures gracefully', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Permission API not supported'));
      
      // Should not throw
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const permissionState = locationService.getPermissionState();
      expect(permissionState).toBeDefined();
    });

    it('should return independent permission state copies', () => {
      const state1 = locationService.getPermissionState();
      const state2 = locationService.getPermissionState();
      
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different objects
    });
  });

  describe('Location Request', () => {
    it('should successfully request current location', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await locationService.requestLocation();
      
      expect(result.coordinates.latitude).toBe(37.7749);
      expect(result.coordinates.longitude).toBe(-122.4194);
      expect(result.accuracy).toBe(10);
      expect(result.timestamp).toBe(mockPosition.timestamp);
    });

    it('should use custom options for location request', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error, options) => {
        expect(options?.enableHighAccuracy).toBe(true);
        expect(options?.timeout).toBe(5000);
        expect(options?.maximumAge).toBe(60000);
        success(mockHighAccuracyPosition);
      });

      const result = await locationService.requestLocation({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      });
      
      expect(result.coordinates.altitude).toBe(15);
      expect(result.accuracy).toBe(5);
      expect(result.heading).toBe(90);
      expect(result.speed).toBe(2.5);
    });

    it('should handle permission denied error', async () => {
      const mockError: GeolocationPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(locationService.requestLocation()).rejects.toEqual({
        code: 1,
        message: 'Location access denied by user',
        type: 'PERMISSION_DENIED',
      });
    });

    it('should handle position unavailable error', async () => {
      const mockError: GeolocationPositionError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(locationService.requestLocation()).rejects.toEqual({
        code: 2,
        message: 'Location information is unavailable',
        type: 'POSITION_UNAVAILABLE',
      });
    });

    it('should handle timeout error', async () => {
      const mockError: GeolocationPositionError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(locationService.requestLocation()).rejects.toEqual({
        code: 3,
        message: 'Location request timed out',
        type: 'TIMEOUT',
      });
    });

    it('should throw error when geolocation is unsupported', async () => {
      // Temporarily remove geolocation
      const originalGeolocation = global.navigator.geolocation;
      // @ts-expect-error - Intentionally setting to undefined for testing
      global.navigator.geolocation = undefined;

      const testService = new (locationService.constructor as new () => typeof locationService)();
      
      await expect(testService.requestLocation()).rejects.toEqual({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'UNSUPPORTED',
      });
      
      // Restore
      global.navigator.geolocation = originalGeolocation;
    });
  });

  describe('Location Watching', () => {
    it('should start watching location successfully', () => {
      const mockUpdateCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const watchId = 123;

      mockGeolocation.watchPosition.mockReturnValue(watchId);
      mockGeolocation.watchPosition.mockImplementation((success) => {
        success(mockPosition);
        return watchId;
      });

      locationService.watchLocation(mockUpdateCallback, mockErrorCallback);

      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      expect(mockUpdateCallback).toHaveBeenCalledWith({
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: undefined,
        },
        accuracy: 10,
        timestamp: mockPosition.timestamp,
        heading: undefined,
        speed: undefined,
      });
    });

    it('should stop previous watch when starting new one', () => {
      const mockUpdateCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const watchId1 = 123;
      const watchId2 = 456;

      mockGeolocation.watchPosition.mockReturnValueOnce(watchId1).mockReturnValueOnce(watchId2);
      mockGeolocation.watchPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Start first watch
      locationService.watchLocation(mockUpdateCallback, mockErrorCallback);
      expect(mockGeolocation.clearWatch).not.toHaveBeenCalled();

      // Start second watch (should clear first)
      locationService.watchLocation(mockUpdateCallback, mockErrorCallback);
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId1);
    });

    it('should stop watching location', () => {
      const mockUpdateCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const watchId = 123;

      mockGeolocation.watchPosition.mockReturnValue(watchId);
      mockGeolocation.watchPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      locationService.watchLocation(mockUpdateCallback, mockErrorCallback);
      locationService.stopWatching();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    });

    it('should handle watch errors', () => {
      const mockUpdateCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      locationService.watchLocation(mockUpdateCallback, mockErrorCallback);

      expect(mockErrorCallback).toHaveBeenCalledWith({
        code: 1,
        message: 'Location access denied by user',
        type: 'PERMISSION_DENIED',
      });
    });
  });

  describe('Last Known Position', () => {
    it('should return null when no position is known', () => {
      const lastPosition = locationService.getLastKnownPosition();
      expect(lastPosition).toBeNull();
    });

    it('should return last known position after successful request', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await locationService.requestLocation();
      const lastPosition = locationService.getLastKnownPosition();

      expect(lastPosition).toEqual({
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: undefined,
        },
        accuracy: 10,
        timestamp: mockPosition.timestamp,
        heading: undefined,
        speed: undefined,
      });
    });

    it('should return independent copies of last position', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await locationService.requestLocation();
      const pos1 = locationService.getLastKnownPosition();
      const pos2 = locationService.getLastKnownPosition();

      expect(pos1).toEqual(pos2);
      expect(pos1).not.toBe(pos2); // Different objects
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance between two close coordinates', () => {
      const coord1: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const coord2: LocationCoordinates = { latitude: 37.7750, longitude: -122.4195 };

      const distance = locationService.calculateDistance(coord1, coord2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(20); // Should be small distance in meters
    });

    it('should calculate distance between distant coordinates', () => {
      const sanFrancisco: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const newYork: LocationCoordinates = { latitude: 40.7128, longitude: -74.0060 };

      const distance = locationService.calculateDistance(sanFrancisco, newYork);
      
      expect(distance).toBeGreaterThan(4000000); // About 4000km
      expect(distance).toBeLessThan(5000000); // Less than 5000km
    });

    it('should return 0 for identical coordinates', () => {
      const coord: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const distance = locationService.calculateDistance(coord, coord);
      
      expect(distance).toBe(0);
    });

    it('should handle coordinates with altitude', () => {
      const coord1: LocationCoordinates = { 
        latitude: 37.7749, 
        longitude: -122.4194, 
        altitude: 100 
      };
      const coord2: LocationCoordinates = { 
        latitude: 37.7750, 
        longitude: -122.4195, 
        altitude: 200 
      };

      const distance = locationService.calculateDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('Location Change Detection', () => {
    it('should detect significant location changes', () => {
      const oldCoord: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const newCoord: LocationCoordinates = { latitude: 37.7760, longitude: -122.4194 };

      const hasChanged = locationService.hasLocationChanged(oldCoord, newCoord, 5);
      expect(hasChanged).toBe(true);
    });

    it('should not detect minor location changes', () => {
      const oldCoord: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const newCoord: LocationCoordinates = { latitude: 37.77491, longitude: -122.41941 };

      const hasChanged = locationService.hasLocationChanged(oldCoord, newCoord, 10);
      expect(hasChanged).toBe(false);
    });

    it('should use default threshold when not specified', () => {
      const oldCoord: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const newCoord: LocationCoordinates = { latitude: 37.7750, longitude: -122.4194 };

      const hasChanged = locationService.hasLocationChanged(oldCoord, newCoord);
      expect(hasChanged).toBe(false); // Default threshold is 10m
    });

    it('should use custom threshold', () => {
      const oldCoord: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 };
      const newCoord: LocationCoordinates = { latitude: 37.7750, longitude: -122.4194 };

      const hasChanged = locationService.hasLocationChanged(oldCoord, newCoord, 1);
      expect(hasChanged).toBe(true); // 1m threshold
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      const mockUpdateCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const watchId = 123;

      mockGeolocation.watchPosition.mockReturnValue(watchId);
      mockGeolocation.watchPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Start watching
      locationService.watchLocation(mockUpdateCallback, mockErrorCallback);
      
      // Get position to set lastKnownPosition
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });
      
      locationService.requestLocation();

      // Cleanup
      locationService.cleanup();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
      expect(locationService.getLastKnownPosition()).toBeNull();
    });
  });
});