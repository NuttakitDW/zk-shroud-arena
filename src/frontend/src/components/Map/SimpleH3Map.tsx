'use client';

import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import * as h3 from 'h3-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SimpleH3Controls } from './SimpleH3Controls';
import { H3Zone } from './types';

interface SimpleH3MapProps {
  onZonesChange?: (zones: H3Zone[]) => void;
  existingZones?: H3Zone[];
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
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
            center: { lat: centerLat, lng: centerLng },
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

const SimpleH3Map: React.FC<SimpleH3MapProps> = ({
  onZonesChange,
  existingZones = [],
  height = '100%',
  defaultCenter = [13.7563, 100.5018], // Bangkok
  defaultZoom = 15
}) => {
  const [zones, setZones] = useState<H3Zone[]>(existingZones);
  const [resolution, setResolution] = useState(8); // Default to "Area" size
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