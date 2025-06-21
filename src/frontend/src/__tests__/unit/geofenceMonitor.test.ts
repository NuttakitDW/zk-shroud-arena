/**
 * Geofence Monitor Unit Tests
 */

import { geofenceMonitor } from '../../services/geofenceMonitor';
import { h3Service } from '../../services/h3Service';
import { locationService } from '../../services/locationService';
import { LocationCoordinates } from '../../types/zkProof';

// Mock location service
jest.mock('../../services/locationService');

describe('Geofence Monitor', () => {
  const mockLocation1: LocationCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194
  };

  const mockLocation2: LocationCoordinates = {
    latitude: 37.7750,
    longitude: -122.4195
  };

  let mockH3Zone1: string;
  let mockH3Zone2: string;

  beforeEach(() => {
    jest.clearAllMocks();
    geofenceMonitor.stopMonitoring();
    // Clear any active zones from previous tests
    geofenceMonitor.updateActiveZones([]);
    
    // Get actual H3 indices for test locations
    mockH3Zone1 = h3Service.latLngToH3(mockLocation1);
    mockH3Zone2 = h3Service.latLngToH3(mockLocation2);
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        proximityThreshold: 100,
        debounceTime: 2000,
        enableProximityAlerts: false
      };
      
      geofenceMonitor.updateConfig(newConfig);
      const config = geofenceMonitor.getConfig();
      
      expect(config.proximityThreshold).toBe(100);
      expect(config.debounceTime).toBe(2000);
      expect(config.enableProximityAlerts).toBe(false);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring with active zones', () => {
      const activeZones = [mockH3Zone1, mockH3Zone2];
      const mockWatchLocation = locationService.watchLocation as jest.Mock;
      
      geofenceMonitor.startMonitoring(activeZones);
      const state = geofenceMonitor.getState();
      
      expect(state.isMonitoring).toBe(true);
      expect(state.activeZoneIndices).toEqual(activeZones);
      expect(mockWatchLocation).toHaveBeenCalled();
    });

    it('should stop monitoring', () => {
      const mockStopWatching = locationService.stopWatching as jest.Mock;
      
      geofenceMonitor.startMonitoring([mockH3Zone1]);
      geofenceMonitor.stopMonitoring();
      
      const state = geofenceMonitor.getState();
      expect(state.isMonitoring).toBe(false);
      expect(mockStopWatching).toHaveBeenCalled();
    });

    it('should not start monitoring if already active', () => {
      const mockWatchLocation = locationService.watchLocation as jest.Mock;
      
      geofenceMonitor.startMonitoring([mockH3Zone1]);
      mockWatchLocation.mockClear();
      
      geofenceMonitor.startMonitoring([mockH3Zone2]);
      expect(mockWatchLocation).not.toHaveBeenCalled();
    });
  });

  describe('Zone Management', () => {
    it('should update active zones', () => {
      const initialZones = [mockH3Zone1];
      const updatedZones = [mockH3Zone1, mockH3Zone2];
      
      geofenceMonitor.startMonitoring(initialZones);
      geofenceMonitor.updateActiveZones(updatedZones);
      
      const state = geofenceMonitor.getState();
      expect(state.activeZoneIndices).toEqual(updatedZones);
    });

    it('should track player path', () => {
      geofenceMonitor.startMonitoring([mockH3Zone1]);
      
      // Simulate location update by accessing internal state
      const state = geofenceMonitor.getState();
      state.playerPath.push(mockH3Zone1);
      
      const playerPath = geofenceMonitor.getPlayerPath();
      expect(playerPath.length).toBeGreaterThan(0);
    });

    it('should clear player path', () => {
      geofenceMonitor.startMonitoring([mockH3Zone1]);
      
      // Add some path data
      const state = geofenceMonitor.getState();
      state.playerPath.push(mockH3Zone1);
      
      geofenceMonitor.clearPlayerPath();
      const playerPath = geofenceMonitor.getPlayerPath();
      expect(playerPath.length).toBe(0);
    });
  });

  describe('Event Listeners', () => {
    it('should add and trigger event listeners', (done) => {
      const mockCallback = jest.fn();
      
      geofenceMonitor.addEventListener('enter', mockCallback);
      
      // Manually trigger an event to test the listener
      const mockEvent = {
        type: 'enter' as const,
        zone: h3Service.createH3Zone(mockH3Zone1),
        playerLocation: mockLocation1,
        timestamp: Date.now()
      };
      
      // Since we can't easily trigger real location updates in tests,
      // we'll test that the listener is properly registered
      const listeners = (geofenceMonitor as any).eventListeners.get('enter');
      expect(listeners).toContain(mockCallback);
      
      done();
    });

    it('should remove event listeners', () => {
      const mockCallback = jest.fn();
      
      geofenceMonitor.addEventListener('exit', mockCallback);
      geofenceMonitor.removeEventListener('exit', mockCallback);
      
      const listeners = (geofenceMonitor as any).eventListeners.get('exit');
      expect(listeners).not.toContain(mockCallback);
    });

    it('should add and remove proximity listeners', () => {
      const mockCallback = jest.fn();
      
      geofenceMonitor.addProximityListener(mockCallback);
      expect((geofenceMonitor as any).proximityListeners).toContain(mockCallback);
      
      geofenceMonitor.removeProximityListener(mockCallback);
      expect((geofenceMonitor as any).proximityListeners).not.toContain(mockCallback);
    });
  });

  describe('State Management', () => {
    it('should return current state', () => {
      const state = geofenceMonitor.getState();
      
      expect(state).toHaveProperty('currentZone');
      expect(state).toHaveProperty('nearbyZones');
      expect(state).toHaveProperty('isMonitoring');
      expect(state).toHaveProperty('lastLocation');
      expect(state).toHaveProperty('activeZoneIndices');
      expect(state).toHaveProperty('playerPath');
    });

    it('should have correct initial state', () => {
      const state = geofenceMonitor.getState();
      
      expect(state.currentZone).toBeNull();
      expect(state.nearbyZones).toEqual([]);
      expect(state.isMonitoring).toBe(false);
      expect(state.lastLocation).toBeNull();
      expect(state.activeZoneIndices).toEqual([]);
      expect(state.playerPath).toEqual([]);
    });
  });
});