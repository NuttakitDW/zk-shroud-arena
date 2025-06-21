'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Circle, useMap } from 'react-leaflet';
import * as h3 from 'h3-js';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SimpleH3Controls } from './SimpleH3Controls';
import { H3Zone } from './types';
import dynamic from 'next/dynamic';

interface SimpleH3MapProps {
  onZonesChange?: (zones: H3Zone[]) => void;
  existingZones?: H3Zone[];
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  locationEnabled?: boolean;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

// H3 cell click handler component
const H3ClickHandler: React.FC<{
  resolution: number;
  addNeighbors: boolean;
  zones: H3Zone[];
  onZonesChange?: (zones: H3Zone[]) => void;
}> = ({ resolution, addNeighbors, zones, onZonesChange }) => {
  useMapEvents({
    click: (e) => {
      // Only handle clicks if onZonesChange is provided
      if (!onZonesChange) return;
      
      const { lat, lng } = e.latlng;
      const h3Index = h3.latLngToCell(lat, lng, resolution);
      
      // Get the cells to add
      let cellsToAdd = [h3Index];
      if (addNeighbors) {
        const neighbors = h3.gridDisk(h3Index, 1);
        cellsToAdd = neighbors;
      }
      
      // Create new zones
      const newZones = cellsToAdd
        .filter(cell => !zones.some(z => z.h3Index === cell))
        .map(cell => {
          const [centerLat, centerLng] = h3.cellToLatLng(cell);
          return {
            id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            h3Index: cell,
            name: `Zone ${zones.length + 1}`,
            type: 'safe' as const,
            center: { latitude: centerLat, longitude: centerLng },
            pointValue: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
        });
      
      onZonesChange([...zones, ...newZones]);
    }
  });
  
  return null;
};

// H3 zone renderer component
const H3ZoneRenderer: React.FC<{ zones: H3Zone[] }> = ({ zones }) => {
  const map = useMapEvents({});
  
  React.useEffect(() => {
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon && (layer as any).isH3Zone) {
        map.removeLayer(layer);
      }
    });
    
    // Add zones
    zones.forEach(zone => {
      const boundary = h3.cellToBoundary(zone.h3Index);
      const latLngs = boundary.map(([lat, lng]) => [lat, lng] as [number, number]);
      
      const polygon = L.polygon(latLngs, {
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.4,
        weight: 2
      });
      
      (polygon as any).isH3Zone = true;
      polygon.addTo(map);
    });
  }, [zones, map]);
  
  return null;
};

// Simple location tracker component
const LocationTracker: React.FC<{ 
  enabled?: boolean;
  onLocationUpdate?: (lat: number, lng: number) => void;
}> = ({ enabled, onLocationUpdate }) => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  React.useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLocation);
        onLocationUpdate?.(position.coords.latitude, position.coords.longitude);
        
        // Center map on first location update
        if (!userLocation) {
          map.setView(newLocation, map.getZoom());
        }
      },
      (error) => {
        console.warn('Location error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, map, onLocationUpdate, userLocation]);

  if (!userLocation || !enabled) return null;

  const playerIcon = L.divIcon({
    className: 'player-location-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <>
      <Marker position={userLocation} icon={playerIcon} />
      <Circle
        center={userLocation}
        radius={5}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          color: '#3b82f6',
          weight: 2
        }}
      />
    </>
  );
};

const SimpleH3Map: React.FC<SimpleH3MapProps> = ({
  onZonesChange,
  existingZones = [],
  height = '100%',
  defaultCenter = [13.7563, 100.5018], // Bangkok
  defaultZoom = 19,
  locationEnabled = false,
  onLocationUpdate
}) => {
  const [zones, setZones] = useState<H3Zone[]>(existingZones);
  const [resolution, setResolution] = useState(11); // Default to "Building" size (~25m)
  const [addNeighbors, setAddNeighbors] = useState(false);

  // Update zones when existingZones change
  React.useEffect(() => {
    setZones(existingZones);
  }, [existingZones]);

  const handleZonesChange = useCallback((newZones: H3Zone[]) => {
    setZones(newZones);
    onZonesChange?.(newZones);
  }, [onZonesChange]);

  const handleClear = useCallback(() => {
    setZones([]);
    onZonesChange?.([]);
  }, [onZonesChange]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <H3ClickHandler
          resolution={resolution}
          addNeighbors={addNeighbors}
          zones={zones}
          onZonesChange={handleZonesChange}
        />
        
        <H3ZoneRenderer zones={zones} />
        
        <LocationTracker 
          enabled={locationEnabled}
          onLocationUpdate={onLocationUpdate}
        />
      </MapContainer>
      
      {onZonesChange && (
        <SimpleH3Controls
          currentResolution={resolution}
          onResolutionChange={setResolution}
          onAddNeighborsChange={setAddNeighbors}
          onClear={handleClear}
          hasZones={zones.length > 0}
        />
      )}
    </div>
  );
};

export { SimpleH3Map };