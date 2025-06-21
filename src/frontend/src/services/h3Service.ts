/**
 * H3 Geospatial Service
 * Handles H3 hexagon operations for geofencing and zone management
 */

import * as h3 from 'h3-js';
import { LocationCoordinates, H3Index } from '../types/zkProof';

export interface H3Zone {
  index: H3Index;
  center: LocationCoordinates;
  vertices: LocationCoordinates[];
  neighbors: H3Index[];
  resolution: number;
  distanceFromPlayer?: number;
}

export interface H3GeofenceEvent {
  type: 'enter' | 'exit' | 'proximity';
  zone: H3Zone;
  playerLocation: LocationCoordinates;
  timestamp: number;
  distance?: number;
}

export interface H3BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

class H3Service {
  // Default resolution for game zones (resolution 8 gives ~0.46 km² hexagons)
  private defaultResolution = 8;
  
  // Cache for frequently accessed zones
  private zoneCache = new Map<H3Index, H3Zone>();
  
  /**
   * Convert latitude/longitude to H3 index at specified resolution
   */
  public latLngToH3(coords: LocationCoordinates, resolution?: number): H3Index {
    return h3.latLngToCell(
      coords.latitude,
      coords.longitude,
      resolution || this.defaultResolution
    );
  }
  
  /**
   * Get center coordinates of an H3 cell
   */
  public h3ToLatLng(h3Index: H3Index): LocationCoordinates {
    const [lat, lng] = h3.cellToLatLng(h3Index);
    return { latitude: lat, longitude: lng };
  }
  
  /**
   * Get boundary vertices of an H3 cell
   */
  public h3ToGeoBoundary(h3Index: H3Index): LocationCoordinates[] {
    const boundary = h3.cellToBoundary(h3Index);
    return boundary.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  }
  
  /**
   * Get all neighboring H3 cells
   */
  public getH3Neighbors(h3Index: H3Index): H3Index[] {
    return h3.gridDisk(h3Index, 1).filter(idx => idx !== h3Index);
  }
  
  /**
   * Get H3 cells within a radius (in ring count)
   */
  public getH3Disk(h3Index: H3Index, radius: number): H3Index[] {
    return h3.gridDisk(h3Index, radius);
  }
  
  /**
   * Get H3 cells forming a ring at specific distance
   */
  public getH3Ring(h3Index: H3Index, ringSize: number): H3Index[] {
    return h3.gridDisk(h3Index, ringSize) || [];
  }
  
  /**
   * Check if a point is inside an H3 cell
   */
  public isPointInH3Cell(coords: LocationCoordinates, h3Index: H3Index): boolean {
    const pointH3 = this.latLngToH3(coords);
    return pointH3 === h3Index;
  }
  
  /**
   * Get distance between two H3 cells (in grid steps)
   */
  public h3Distance(origin: H3Index, destination: H3Index): number {
    return h3.gridDistance(origin, destination);
  }
  
  /**
   * Calculate Haversine distance between two coordinates (in meters)
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
   * Get the H3 resolution for a desired approximate area (in km²)
   */
  public getResolutionForArea(targetAreaKm2: number): number {
    // H3 resolution to average area mapping (approximate)
    const resolutionAreas = [
      { res: 0, area: 4357449.416 },
      { res: 1, area: 609788.441 },
      { res: 2, area: 86801.780 },
      { res: 3, area: 12393.435 },
      { res: 4, area: 1770.324 },
      { res: 5, area: 252.904 },
      { res: 6, area: 36.129 },
      { res: 7, area: 5.161 },
      { res: 8, area: 0.737 },
      { res: 9, area: 0.105 },
      { res: 10, area: 0.015 },
    ];
    
    // Find the resolution with area closest to target
    let bestRes = 8;
    let minDiff = Infinity;
    
    for (const { res, area } of resolutionAreas) {
      const diff = Math.abs(area - targetAreaKm2);
      if (diff < minDiff) {
        minDiff = diff;
        bestRes = res;
      }
    }
    
    return bestRes;
  }
  
  /**
   * Create a full H3Zone object with all properties
   */
  public createH3Zone(h3Index: H3Index): H3Zone {
    // Check cache first
    if (this.zoneCache.has(h3Index)) {
      return this.zoneCache.get(h3Index)!;
    }
    
    const zone: H3Zone = {
      index: h3Index,
      center: this.h3ToLatLng(h3Index),
      vertices: this.h3ToGeoBoundary(h3Index),
      neighbors: this.getH3Neighbors(h3Index),
      resolution: h3.getResolution(h3Index)
    };
    
    // Cache for future use
    this.zoneCache.set(h3Index, zone);
    
    return zone;
  }
  
  /**
   * Get all H3 cells that cover a bounding box
   */
  public getH3CellsInBoundingBox(bbox: H3BoundingBox, resolution?: number): H3Index[] {
    const res = resolution || this.defaultResolution;
    const cells = new Set<H3Index>();
    
    // Create a polygon from bounding box
    const polygon: [number, number][] = [
      [bbox.north, bbox.west],
      [bbox.north, bbox.east],
      [bbox.south, bbox.east],
      [bbox.south, bbox.west],
      [bbox.north, bbox.west], // Close the polygon
    ];
    
    // Get cells that cover the polygon
    const h3Cells = h3.polygonToCells([polygon], res);
    
    h3Cells.forEach(cell => cells.add(cell));
    
    return Array.from(cells);
  }
  
  /**
   * Find the nearest H3 zone to a given location from a list of zones
   */
  public findNearestZone(
    location: LocationCoordinates,
    zones: H3Index[]
  ): { zone: H3Zone; distance: number } | null {
    if (zones.length === 0) return null;
    
    let nearestZone: H3Zone | null = null;
    let minDistance = Infinity;
    
    for (const zoneIndex of zones) {
      const zone = this.createH3Zone(zoneIndex);
      const distance = this.calculateDistance(location, zone.center);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    }
    
    return nearestZone ? { zone: nearestZone, distance: minDistance } : null;
  }
  
  /**
   * Check if player has entered any new zones
   */
  public checkZoneTransitions(
    previousLocation: LocationCoordinates,
    currentLocation: LocationCoordinates,
    activeZones: H3Index[]
  ): H3GeofenceEvent[] {
    const events: H3GeofenceEvent[] = [];
    
    const previousH3 = this.latLngToH3(previousLocation);
    const currentH3 = this.latLngToH3(currentLocation);
    
    // Check each active zone
    for (const zoneIndex of activeZones) {
      const wasInZone = previousH3 === zoneIndex;
      const isInZone = currentH3 === zoneIndex;
      
      if (!wasInZone && isInZone) {
        // Entered zone
        const zone = this.createH3Zone(zoneIndex);
        events.push({
          type: 'enter',
          zone,
          playerLocation: currentLocation,
          timestamp: Date.now()
        });
      } else if (wasInZone && !isInZone) {
        // Exited zone
        const zone = this.createH3Zone(zoneIndex);
        events.push({
          type: 'exit',
          zone,
          playerLocation: currentLocation,
          timestamp: Date.now()
        });
      }
    }
    
    return events;
  }
  
  /**
   * Calculate proximity to nearest zone edge
   */
  public calculateZoneProximity(
    location: LocationCoordinates,
    zoneIndex: H3Index
  ): number {
    const zone = this.createH3Zone(zoneIndex);
    const vertices = zone.vertices;
    
    let minDistance = Infinity;
    
    // Calculate distance to each edge of the hexagon
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      // Calculate distance from point to line segment
      const distance = this.pointToLineSegmentDistance(location, v1, v2);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }
  
  /**
   * Calculate distance from point to line segment
   */
  private pointToLineSegmentDistance(
    point: LocationCoordinates,
    lineStart: LocationCoordinates,
    lineEnd: LocationCoordinates
  ): number {
    const A = point.longitude - lineStart.longitude;
    const B = point.latitude - lineStart.latitude;
    const C = lineEnd.longitude - lineStart.longitude;
    const D = lineEnd.latitude - lineStart.latitude;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.longitude;
      yy = lineStart.latitude;
    } else if (param > 1) {
      xx = lineEnd.longitude;
      yy = lineEnd.latitude;
    } else {
      xx = lineStart.longitude + param * C;
      yy = lineStart.latitude + param * D;
    }
    
    const dx = point.longitude - xx;
    const dy = point.latitude - yy;
    
    // Convert to meters (approximate)
    const metersPerDegree = 111000; // Rough approximation
    return Math.sqrt(dx * dx + dy * dy) * metersPerDegree;
  }
  
  /**
   * Get H3 cells that form a path between two locations
   */
  public getH3Path(start: LocationCoordinates, end: LocationCoordinates): H3Index[] {
    const startH3 = this.latLngToH3(start);
    const endH3 = this.latLngToH3(end);
    
    try {
      return h3.gridPathCells(startH3, endH3);
    } catch (error) {
      // If no path exists, return empty array
      console.warn('No H3 path exists between cells:', error);
      return [];
    }
  }
  
  /**
   * Clear the zone cache
   */
  public clearCache(): void {
    this.zoneCache.clear();
  }
  
  /**
   * Set default resolution
   */
  public setDefaultResolution(resolution: number): void {
    if (resolution >= 0 && resolution <= 15) {
      this.defaultResolution = resolution;
    }
  }
  
  /**
   * Get default resolution
   */
  public getDefaultResolution(): number {
    return this.defaultResolution;
  }
}

// Export singleton instance
export const h3Service = new H3Service();
export default h3Service;