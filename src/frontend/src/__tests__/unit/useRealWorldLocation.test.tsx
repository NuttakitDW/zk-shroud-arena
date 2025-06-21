/**
 * Unit Tests for useRealWorldLocation Hook
 * Tests for real-world location tracking hook with ZK proof integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealWorldLocation } from '../../hooks/useRealWorldLocation';
import { GamePhase } from '../../types/gameState';
import { LocationCoordinates } from '../../types/zkProof';

// Mock the location service
const mockLocationService = {
  requestLocation: jest.fn(),
  watchLocation: jest.fn(),
  stopWatching: jest.fn(),
  calculateDistance: jest.fn(),
  getPermissionState: jest.fn(),
  getLastKnownPosition: jest.fn(),
  cleanup: jest.fn(),
};

jest.mock('../../services/locationService', () => ({
  locationService: {
    requestLocation: jest.fn(),
    watchLocation: jest.fn(),
    stopWatching: jest.fn(),
    calculateDistance: jest.fn(),
    getPermissionState: jest.fn(() => ({ granted: false, denied: false, prompt: true })),
    getLastKnownPosition: jest.fn(() => null),
    cleanup: jest.fn(),
  },
  LocationError: jest.requireActual('../../services/locationService').LocationError,
}));

// Mock timers
jest.useFakeTimers();

describe('useRealWorldLocation Hook', () => {
  const mockLocation: LocationCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  const mockLocationUpdate = {
    coordinates: mockLocation,
    accuracy: 10,
    timestamp: Date.now(),
    heading: 90,
    speed: 2.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Set up default mock implementations
    mockLocationService.getPermissionState.mockReturnValue({
      granted: false,
      denied: false,
      prompt: true,
      unavailable: false,
    });
    
    mockLocationService.requestLocation.mockResolvedValue(mockLocationUpdate);
    mockLocationService.calculateDistance.mockReturnValue(5);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useRealWorldLocation());

      expect(result.current.currentLocation).toBeNull();
      expect(result.current.isTracking).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.permissionDenied).toBe(false);
      expect(result.current.lastProof).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isGeneratingProof).toBe(false);
    });

    it('should accept custom options', () => {
      const options = {
        enableAutoProofs: false,
        proofInterval: 60,
        movementThreshold: 20,
        enableHighAccuracy: false,
      };

      const { result } = renderHook(() => 
        useRealWorldLocation(GamePhase.LOBBY, options)
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('Location Tracking', () => {
    it('should start tracking when game becomes active', async () => {
      const { result, rerender } = renderHook(
        ({ phase }) => useRealWorldLocation(phase),
        { initialProps: { phase: GamePhase.LOBBY } }
      );

      expect(result.current.isTracking).toBe(false);

      // Change to active phase
      rerender({ phase: GamePhase.ACTIVE });

      await waitFor(() => {
        expect(mockLocationService.requestLocation).toHaveBeenCalled();
      });
    });

    it('should stop tracking when game becomes inactive', async () => {
      const { rerender } = renderHook(
        ({ phase }) => useRealWorldLocation(phase),
        { initialProps: { phase: GamePhase.ACTIVE } }
      );

      await waitFor(() => {
        expect(mockLocationService.requestLocation).toHaveBeenCalled();
      });

      // Change to inactive phase
      rerender({ phase: GamePhase.LOBBY });

      expect(mockLocationService.stopWatching).toHaveBeenCalled();
    });

    it('should manually start tracking', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        const success = await result.current.startTracking();
        expect(success).toBe(true);
      });

      expect(mockLocationService.requestLocation).toHaveBeenCalled();
      expect(mockLocationService.watchLocation).toHaveBeenCalled();
    });

    it('should manually stop tracking', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        await result.current.startTracking();
      });

      act(() => {
        result.current.stopTracking();
      });

      expect(mockLocationService.stopWatching).toHaveBeenCalled();
    });

    it('should handle tracking failures', async () => {
      const locationError = {
        code: 1,
        message: 'Permission denied',
        type: 'PERMISSION_DENIED' as const,
      };

      mockLocationService.requestLocation.mockRejectedValue(locationError);

      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        const success = await result.current.startTracking();
        expect(success).toBe(false);
      });

      expect(result.current.error).toEqual(locationError);
      expect(result.current.permissionDenied).toBe(true);
    });
  });

  describe('Current Location Management', () => {
    it('should get current location without tracking', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        const location = await result.current.getCurrentLocation();
        expect(location).toEqual(mockLocation);
      });

      expect(mockLocationService.requestLocation).toHaveBeenCalled();
      expect(result.current.currentLocation).toEqual(mockLocation);
    });

    it('should handle get current location errors', async () => {
      const locationError = {
        code: 2,
        message: 'Position unavailable',
        type: 'POSITION_UNAVAILABLE' as const,
      };

      mockLocationService.requestLocation.mockRejectedValue(locationError);

      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        const location = await result.current.getCurrentLocation();
        expect(location).toBeNull();
      });

      expect(result.current.error).toEqual(locationError);
    });
  });

  describe('ZK Proof Generation', () => {
    it('should generate location proof manually', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      // Set current location first
      await act(async () => {
        await result.current.getCurrentLocation();
      });

      await act(async () => {
        const proofResult = await result.current.generateLocationProof();
        expect(proofResult).toBeDefined();
        expect(proofResult?.location).toEqual(mockLocation);
      });

      expect(result.current.lastProof).toBeDefined();
      expect(result.current.proofHistory).toHaveLength(1);
    });

    it('should generate proof for specific location', async () => {
      const { result } = renderHook(() => useRealWorldLocation());
      const specificLocation: LocationCoordinates = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      await act(async () => {
        const proofResult = await result.current.generateLocationProof(specificLocation);
        expect(proofResult?.location).toEqual(specificLocation);
      });
    });

    it('should handle proof generation without location', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        const proofResult = await result.current.generateLocationProof();
        expect(proofResult).toBeNull();
      });
    });

    it('should auto-generate proofs based on time interval', async () => {
      const { result } = renderHook(() => 
        useRealWorldLocation(GamePhase.ACTIVE, {
          enableAutoProofs: true,
          proofInterval: 30,
        })
      );

      // Mock location update callback
      let locationUpdateCallback: ((update: unknown) => void) | null = null;
      mockLocationService.watchLocation.mockImplementation((updateCallback) => {
        locationUpdateCallback = updateCallback;
      });

      // Start tracking
      await act(async () => {
        await result.current.startTracking();
      });

      // Simulate location updates
      await act(async () => {
        if (locationUpdateCallback) {
          locationUpdateCallback(mockLocationUpdate);
        }
      });

      // Fast forward time for auto proof generation
      act(() => {
        jest.advanceTimersByTime(31000); // 31 seconds
      });

      // Simulate another location update to trigger auto proof
      await act(async () => {
        if (locationUpdateCallback) {
          locationUpdateCallback({
            ...mockLocationUpdate,
            timestamp: Date.now() + 31000,
          });
        }
      });

      await waitFor(() => {
        expect(result.current.lastProof).toBeDefined();
      });
    });

    it('should auto-generate proofs based on movement threshold', async () => {
      mockLocationService.calculateDistance.mockReturnValue(15); // Above threshold

      const { result } = renderHook(() => 
        useRealWorldLocation(GamePhase.ACTIVE, {
          enableAutoProofs: true,
          movementThreshold: 10,
        })
      );

      // Mock location update callback
      let locationUpdateCallback: ((update: unknown) => void) | null = null;
      mockLocationService.watchLocation.mockImplementation((updateCallback) => {
        locationUpdateCallback = updateCallback;
      });

      // Start tracking
      await act(async () => {
        await result.current.startTracking();
      });

      // First location update
      await act(async () => {
        if (locationUpdateCallback) {
          locationUpdateCallback(mockLocationUpdate);
        }
      });

      // Second location update with significant movement
      await act(async () => {
        if (locationUpdateCallback) {
          locationUpdateCallback({
            ...mockLocationUpdate,
            coordinates: {
              latitude: 37.7760, // Moved significantly
              longitude: -122.4194,
            },
          });
        }
      });

      await waitFor(() => {
        expect(result.current.lastProof).toBeDefined();
      });
    });

    it('should not auto-generate proofs when disabled', async () => {
      const { result } = renderHook(() => 
        useRealWorldLocation(GamePhase.ACTIVE, {
          enableAutoProofs: false,
        })
      );

      // Mock location update callback
      let locationUpdateCallback: ((update: unknown) => void) | null = null;
      mockLocationService.watchLocation.mockImplementation((updateCallback) => {
        locationUpdateCallback = updateCallback;
      });

      // Start tracking
      await act(async () => {
        await result.current.startTracking();
      });

      // Simulate location update
      await act(async () => {
        if (locationUpdateCallback) {
          locationUpdateCallback(mockLocationUpdate);
        }
      });

      expect(result.current.lastProof).toBeNull();
    });

    it('should verify location proof', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      await act(async () => {
        const isValid = await result.current.verifyLocationProof();
        expect(isValid).toBe(true); // Mock always returns true
      });
    });

    it('should track proof history', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      // Set location
      await act(async () => {
        await result.current.getCurrentLocation();
      });

      // Generate multiple proofs
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.generateLocationProof();
        });
      }

      expect(result.current.proofHistory).toHaveLength(3);
    });

    it('should limit proof history to 10 proofs', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      // Set location
      await act(async () => {
        await result.current.getCurrentLocation();
      });

      // Generate 15 proofs
      for (let i = 0; i < 15; i++) {
        await act(async () => {
          await result.current.generateLocationProof();
        });
      }

      expect(result.current.proofHistory).toHaveLength(10);
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance from current location', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      // Set current location
      await act(async () => {
        await result.current.getCurrentLocation();
      });

      const targetLocation: LocationCoordinates = {
        latitude: 37.7750,
        longitude: -122.4195,
      };

      const distance = result.current.calculateDistanceFromCurrent(targetLocation);
      expect(distance).toBe(5); // Mock returns 5
      expect(mockLocationService.calculateDistance).toHaveBeenCalledWith(
        mockLocation,
        targetLocation
      );
    });

    it('should return null when no current location', () => {
      const { result } = renderHook(() => useRealWorldLocation());

      const targetLocation: LocationCoordinates = {
        latitude: 37.7750,
        longitude: -122.4195,
      };

      const distance = result.current.calculateDistanceFromCurrent(targetLocation);
      expect(distance).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should detect location changes', async () => {
      mockLocationService.calculateDistance.mockReturnValue(15);

      const { result } = renderHook(() => useRealWorldLocation());

      // Set current location and generate proof
      await act(async () => {
        await result.current.getCurrentLocation();
        await result.current.generateLocationProof();
      });

      // Update location to different position
      act(() => {
        result.current.currentLocation = {
          latitude: 37.7760,
          longitude: -122.4194,
        };
      });

      const hasChanged = result.current.hasLocationChanged();
      expect(hasChanged).toBe(true);
    });

    it('should detect when new proof is needed', async () => {
      const { result } = renderHook(() => 
        useRealWorldLocation(GamePhase.ACTIVE, { proofInterval: 30 })
      );

      // Initially should need proof
      expect(result.current.needsNewProof()).toBe(true);

      // Generate proof
      await act(async () => {
        await result.current.getCurrentLocation();
        await result.current.generateLocationProof();
      });

      // Should not need proof immediately after
      expect(result.current.needsNewProof()).toBe(false);

      // Advance time past interval
      act(() => {
        jest.advanceTimersByTime(31000);
      });

      // Should need proof again
      expect(result.current.needsNewProof()).toBe(true);
    });

    it('should get proof status correctly', async () => {
      const { result } = renderHook(() => useRealWorldLocation());

      // Initially no proof
      expect(result.current.proofStatus).toBe('none');

      // Set location and generate proof
      await act(async () => {
        await result.current.getCurrentLocation();
        await result.current.generateLocationProof();
      });

      // Should be valid
      expect(result.current.proofStatus).toBe('valid');

      // Advance time to make proof expired
      act(() => {
        jest.advanceTimersByTime(61000); // 61 seconds (2x default interval)
      });

      expect(result.current.proofStatus).toBe('expired');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useRealWorldLocation());

      unmount();

      expect(mockLocationService.stopWatching).toHaveBeenCalled();
    });

    it('should cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() => useRealWorldLocation());

      // Start some operation that might set timers
      act(() => {
        result.current.startTracking();
      });

      unmount();

      // Verify timers are cleaned up (no pending timers should remain)
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});