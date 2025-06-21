/**
 * Geofence Monitor Service
 * Monitors player location and detects zone entry/exit events using H3
 */

import { LocationCoordinates, H3Index } from '../types/zkProof';
import { h3Service, H3Zone, H3GeofenceEvent } from './h3Service';
import { locationService, LocationUpdate, LocationUpdateCallback } from './locationService';

export interface GeofenceConfig {
  proximityThreshold: number; // Distance in meters to trigger proximity alerts
  debounceTime: number; // Time in ms to wait before confirming zone transitions
  enableProximityAlerts: boolean;
  enableVibration: boolean;
  zoneResolution: number; // H3 resolution for zones
}

export interface GeofenceState {
  currentZone: H3Zone | null;
  nearbyZones: H3Zone[];
  isMonitoring: boolean;
  lastLocation: LocationCoordinates | null;
  activeZoneIndices: H3Index[];
  playerPath: H3Index[]; // History of visited zones
}

export interface ZoneProximityInfo {
  zone: H3Zone;
  distance: number;
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  isAdjacent: boolean;
}

export type GeofenceEventCallback = (event: H3GeofenceEvent) => void;
export type ProximityAlertCallback = (proximityInfo: ZoneProximityInfo[]) => void;

const DEFAULT_CONFIG: GeofenceConfig = {
  proximityThreshold: 50, // 50 meters
  debounceTime: 1000, // 1 second
  enableProximityAlerts: true,
  enableVibration: true,
  zoneResolution: 8
};

class GeofenceMonitor {
  private config: GeofenceConfig;
  private state: GeofenceState;
  private eventListeners: Map<string, GeofenceEventCallback[]> = new Map();
  private proximityListeners: ProximityAlertCallback[] = [];
  private locationWatchId: number | null = null;
  private debounceTimers: Map<H3Index, NodeJS.Timeout> = new Map();
  private lastEventTime: Map<string, number> = new Map();
  
  constructor(config: Partial<GeofenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      currentZone: null,
      nearbyZones: [],
      isMonitoring: false,
      lastLocation: null,
      activeZoneIndices: [],
      playerPath: []
    };
    
    // Initialize event listener map
    this.eventListeners.set('enter', []);
    this.eventListeners.set('exit', []);
    this.eventListeners.set('proximity', []);
  }
  
  /**
   * Start monitoring player location for zone transitions
   */
  public startMonitoring(activeZones: H3Index[]): void {
    if (this.state.isMonitoring) {
      console.warn('Geofence monitoring is already active');
      return;
    }
    
    this.state.activeZoneIndices = activeZones;
    this.state.isMonitoring = true;
    
    // Set H3 resolution
    h3Service.setDefaultResolution(this.config.zoneResolution);
    
    // Start watching location
    locationService.watchLocation(
      this.handleLocationUpdate.bind(this),
      (error) => {
        console.error('Geofence location error:', error);
        this.state.isMonitoring = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 // 1 second max age for real-time tracking
      }
    );
  }
  
  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (!this.state.isMonitoring) {
      return;
    }
    
    locationService.stopWatching();
    this.state.isMonitoring = false;
    
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
  
  /**
   * Handle location updates from location service
   */
  private handleLocationUpdate(update: LocationUpdate): void {
    const newLocation = update.coordinates;
    const previousLocation = this.state.lastLocation;
    
    // Update current location
    this.state.lastLocation = newLocation;
    
    // Get current H3 cell
    const currentH3 = h3Service.latLngToH3(newLocation);
    
    // Check if we're in a new zone
    if (!this.state.currentZone || this.state.currentZone.index !== currentH3) {
      this.updateCurrentZone(currentH3);
    }
    
    // Check zone transitions if we have a previous location
    if (previousLocation) {
      this.checkZoneTransitions(previousLocation, newLocation);
    }
    
    // Update nearby zones and check proximity
    this.updateNearbyZones(newLocation);
    
    // Check proximity alerts
    if (this.config.enableProximityAlerts) {
      this.checkProximityAlerts(newLocation);
    }
  }
  
  /**
   * Update current zone information
   */
  private updateCurrentZone(h3Index: H3Index): void {
    const isActiveZone = this.state.activeZoneIndices.includes(h3Index);
    
    if (isActiveZone) {
      this.state.currentZone = h3Service.createH3Zone(h3Index);
      
      // Add to player path if not already there
      if (!this.state.playerPath.includes(h3Index)) {
        this.state.playerPath.push(h3Index);
      }
    } else {
      this.state.currentZone = null;
    }
  }
  
  /**
   * Check for zone entry/exit transitions
   */
  private checkZoneTransitions(
    previousLocation: LocationCoordinates,
    currentLocation: LocationCoordinates
  ): void {
    const events = h3Service.checkZoneTransitions(
      previousLocation,
      currentLocation,
      this.state.activeZoneIndices
    );
    
    // Process each event with debouncing
    events.forEach(event => {
      const eventKey = `${event.type}-${event.zone.index}`;
      
      // Check if we should debounce this event
      if (this.shouldDebounceEvent(eventKey)) {
        this.debounceEvent(event);
      } else {
        this.emitEvent(event);
      }
    });
  }
  
  /**
   * Check if an event should be debounced
   */
  private shouldDebounceEvent(eventKey: string): boolean {
    const lastTime = this.lastEventTime.get(eventKey);
    if (!lastTime) return false;
    
    const timeSinceLastEvent = Date.now() - lastTime;
    return timeSinceLastEvent < this.config.debounceTime * 2;
  }
  
  /**
   * Debounce a geofence event
   */
  private debounceEvent(event: H3GeofenceEvent): void {
    const zoneIndex = event.zone.index;
    
    // Clear existing timer for this zone
    const existingTimer = this.debounceTimers.get(zoneIndex);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      // Verify the player is still in/out of the zone
      if (this.state.lastLocation) {
        const currentH3 = h3Service.latLngToH3(this.state.lastLocation);
        const isInZone = currentH3 === zoneIndex;
        
        if ((event.type === 'enter' && isInZone) || 
            (event.type === 'exit' && !isInZone)) {
          this.emitEvent(event);
        }
      }
      
      this.debounceTimers.delete(zoneIndex);
    }, this.config.debounceTime);
    
    this.debounceTimers.set(zoneIndex, timer);
  }
  
  /**
   * Emit a geofence event to listeners
   */
  private emitEvent(event: H3GeofenceEvent): void {
    const eventKey = `${event.type}-${event.zone.index}`;
    this.lastEventTime.set(eventKey, Date.now());
    
    // Vibrate on zone entry (if supported and enabled)
    if (event.type === 'enter' && this.config.enableVibration && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
    
    // Notify all listeners for this event type
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in geofence event listener:`, error);
      }
    });
  }
  
  /**
   * Update list of nearby zones
   */
  private updateNearbyZones(location: LocationCoordinates): void {
    const nearbyH3Cells = new Set<H3Index>();
    
    // Get current cell and its neighbors
    const currentH3 = h3Service.latLngToH3(location);
    const neighbors = h3Service.getH3Neighbors(currentH3);
    
    // Check which neighbors are active zones
    neighbors.forEach(neighbor => {
      if (this.state.activeZoneIndices.includes(neighbor)) {
        nearbyH3Cells.add(neighbor);
      }
    });
    
    // Also check zones within 2 rings for proximity
    const ring2 = h3Service.getH3Ring(currentH3, 2);
    ring2.forEach(cell => {
      if (this.state.activeZoneIndices.includes(cell)) {
        nearbyH3Cells.add(cell);
      }
    });
    
    // Convert to zone objects
    this.state.nearbyZones = Array.from(nearbyH3Cells).map(index => 
      h3Service.createH3Zone(index)
    );
  }
  
  /**
   * Check proximity to zones and emit alerts
   */
  private checkProximityAlerts(location: LocationCoordinates): void {
    const proximityInfo: ZoneProximityInfo[] = [];
    
    // Check distance to all nearby zones
    this.state.nearbyZones.forEach(zone => {
      const distance = h3Service.calculateDistance(location, zone.center);
      
      if (distance <= this.config.proximityThreshold) {
        const direction = this.calculateDirection(location, zone.center);
        const isAdjacent = h3Service.getH3Neighbors(
          h3Service.latLngToH3(location)
        ).includes(zone.index);
        
        proximityInfo.push({
          zone,
          distance,
          direction,
          isAdjacent
        });
      }
    });
    
    // Sort by distance
    proximityInfo.sort((a, b) => a.distance - b.distance);
    
    // Notify proximity listeners
    if (proximityInfo.length > 0) {
      this.proximityListeners.forEach(callback => {
        try {
          callback(proximityInfo);
        } catch (error) {
          console.error('Error in proximity alert listener:', error);
        }
      });
    }
  }
  
  /**
   * Calculate cardinal direction from one point to another
   */
  private calculateDirection(
    from: LocationCoordinates,
    to: LocationCoordinates
  ): ZoneProximityInfo['direction'] {
    const latDiff = to.latitude - from.latitude;
    const lngDiff = to.longitude - from.longitude;
    
    const angle = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
    const normalizedAngle = (angle + 360) % 360;
    
    if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'north';
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'northeast';
    if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'east';
    if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'southeast';
    if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'south';
    if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'southwest';
    if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'west';
    return 'northwest';
  }
  
  /**
   * Add event listener for geofence events
   */
  public addEventListener(
    eventType: 'enter' | 'exit' | 'proximity',
    callback: GeofenceEventCallback
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(callback);
    this.eventListeners.set(eventType, listeners);
  }
  
  /**
   * Remove event listener
   */
  public removeEventListener(
    eventType: 'enter' | 'exit' | 'proximity',
    callback: GeofenceEventCallback
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const filtered = listeners.filter(cb => cb !== callback);
    this.eventListeners.set(eventType, filtered);
  }
  
  /**
   * Add proximity alert listener
   */
  public addProximityListener(callback: ProximityAlertCallback): void {
    this.proximityListeners.push(callback);
  }
  
  /**
   * Remove proximity alert listener
   */
  public removeProximityListener(callback: ProximityAlertCallback): void {
    this.proximityListeners = this.proximityListeners.filter(cb => cb !== callback);
  }
  
  /**
   * Get current geofence state
   */
  public getState(): GeofenceState {
    return { ...this.state };
  }
  
  /**
   * Update active zones
   */
  public updateActiveZones(zones: H3Index[]): void {
    this.state.activeZoneIndices = zones;
    
    // Re-check current zone
    if (this.state.lastLocation) {
      const currentH3 = h3Service.latLngToH3(this.state.lastLocation);
      this.updateCurrentZone(currentH3);
      this.updateNearbyZones(this.state.lastLocation);
    }
  }
  
  /**
   * Get player's zone history
   */
  public getPlayerPath(): H3Zone[] {
    return this.state.playerPath.map(index => h3Service.createH3Zone(index));
  }
  
  /**
   * Clear player path history
   */
  public clearPlayerPath(): void {
    this.state.playerPath = [];
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<GeofenceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.zoneResolution !== undefined) {
      h3Service.setDefaultResolution(config.zoneResolution);
    }
  }
  
  /**
   * Get configuration
   */
  public getConfig(): GeofenceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const geofenceMonitor = new GeofenceMonitor();
export default geofenceMonitor;