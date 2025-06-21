/**
 * H3 Service Unit Tests
 */

import { h3Service } from '../../services/h3Service';
import { LocationCoordinates } from '../../types/zkProof';

describe('H3 Service', () => {
  const mockLocation: LocationCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194
  };

  const mockLocation2: LocationCoordinates = {
    latitude: 37.7850,
    longitude: -122.4094
  };

  beforeEach(() => {
    h3Service.clearCache();
  });

  describe('Coordinate Conversions', () => {
    it('should convert lat/lng to H3 index', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      expect(h3Index).toBeDefined();
      expect(typeof h3Index).toBe('string');
      expect(h3Index.length).toBeGreaterThan(0);
    });

    it('should convert H3 index back to lat/lng', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const coords = h3Service.h3ToLatLng(h3Index);
      
      // H3 returns the center of the hexagon, which may differ slightly from input
      expect(coords.latitude).toBeCloseTo(mockLocation.latitude, 2);
      expect(coords.longitude).toBeCloseTo(mockLocation.longitude, 2);
    });

    it('should respect resolution parameter', () => {
      const h3Index5 = h3Service.latLngToH3(mockLocation, 5);
      const h3Index9 = h3Service.latLngToH3(mockLocation, 9);
      
      // H3 indices have the same string length, but represent different resolutions
      expect(h3Index5).not.toBe(h3Index9);
      expect(h3Index5.startsWith('85')).toBe(true); // All indices start with resolution indicator
    });
  });

  describe('Zone Operations', () => {
    it('should get H3 cell boundary vertices', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const boundary = h3Service.h3ToGeoBoundary(h3Index);
      
      expect(Array.isArray(boundary)).toBe(true);
      expect(boundary.length).toBe(6); // Hexagon has 6 vertices
      boundary.forEach(vertex => {
        expect(vertex).toHaveProperty('latitude');
        expect(vertex).toHaveProperty('longitude');
      });
    });

    it('should get neighboring H3 cells', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const neighbors = h3Service.getH3Neighbors(h3Index);
      
      expect(Array.isArray(neighbors)).toBe(true);
      expect(neighbors.length).toBe(6); // Hexagon has 6 neighbors
      expect(neighbors).not.toContain(h3Index);
    });

    it('should create H3Zone object with all properties', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const zone = h3Service.createH3Zone(h3Index);
      
      expect(zone.index).toBe(h3Index);
      expect(zone.center).toBeDefined();
      expect(zone.vertices.length).toBe(6);
      expect(zone.neighbors.length).toBe(6);
      expect(zone.resolution).toBe(8); // Default resolution
    });

    it('should cache H3Zone objects', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const zone1 = h3Service.createH3Zone(h3Index);
      const zone2 = h3Service.createH3Zone(h3Index);
      
      expect(zone1).toBe(zone2); // Should be same object reference
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance between coordinates', () => {
      const distance = h3Service.calculateDistance(mockLocation, mockLocation2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10000); // Less than 10km
    });

    it('should return 0 distance for same location', () => {
      const distance = h3Service.calculateDistance(mockLocation, mockLocation);
      
      expect(distance).toBe(0);
    });

    it('should calculate H3 grid distance', () => {
      const h3Index1 = h3Service.latLngToH3(mockLocation);
      const h3Index2 = h3Service.latLngToH3(mockLocation2);
      const gridDistance = h3Service.h3Distance(h3Index1, h3Index2);
      
      expect(gridDistance).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(gridDistance)).toBe(true);
    });
  });

  describe('Zone Detection', () => {
    it('should detect point in H3 cell', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const isInCell = h3Service.isPointInH3Cell(mockLocation, h3Index);
      
      expect(isInCell).toBe(true);
    });

    it('should detect point not in H3 cell', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const isInCell = h3Service.isPointInH3Cell(mockLocation2, h3Index);
      
      expect(isInCell).toBe(false);
    });

    it('should detect zone transitions', () => {
      const h3Index = h3Service.latLngToH3(mockLocation);
      const activeZones = [h3Index];
      
      const events = h3Service.checkZoneTransitions(
        mockLocation2, // Not in zone
        mockLocation,  // In zone
        activeZones
      );
      
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('enter');
      expect(events[0].zone.index).toBe(h3Index);
    });

    it('should find nearest zone', () => {
      const h3Index1 = h3Service.latLngToH3(mockLocation);
      const h3Index2 = h3Service.latLngToH3(mockLocation2);
      const zones = [h3Index1, h3Index2];
      
      const result = h3Service.findNearestZone(mockLocation, zones);
      
      expect(result).toBeDefined();
      expect(result?.zone.index).toBe(h3Index1);
      // Distance to zone center, not zero since we measure to cell center
      expect(result?.distance).toBeLessThan(500); // Less than 500 meters
    });
  });

  describe('Resolution Calculations', () => {
    it('should get appropriate resolution for target area', () => {
      const resolution = h3Service.getResolutionForArea(1); // 1 km²
      
      expect(resolution).toBeGreaterThanOrEqual(7);
      expect(resolution).toBeLessThanOrEqual(9);
    });
  });

  describe('Configuration', () => {
    it('should set and get default resolution', () => {
      h3Service.setDefaultResolution(10);
      expect(h3Service.getDefaultResolution()).toBe(10);
      
      // Reset to default
      h3Service.setDefaultResolution(8);
    });

    it('should not set invalid resolution', () => {
      const currentRes = h3Service.getDefaultResolution();
      h3Service.setDefaultResolution(20); // Invalid
      expect(h3Service.getDefaultResolution()).toBe(currentRes);
    });
  });
});