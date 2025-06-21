'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import * as h3 from 'h3-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { H3Zone } from './types';

// Create a custom icon for player location
const createPlayerIcon = () => {
  if (typeof window === 'undefined') return null;
  
  return L.divIcon({
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
};

interface PlayerMapProps {
  existingZones?: H3Zone[];
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  onLocationUpdate?: (lat: number, lng: number) => void;
  locationEnabled?: boolean;
}

// Component to handle map centering on user location
const LocationTracker: React.FC<{ 
  onLocationUpdate?: (lat: number, lng: number) => void;
  locationEnabled?: boolean;
}> = ({ onLocationUpdate, locationEnabled }) => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!locationEnabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLocation);
        onLocationUpdate?.(position.coords.latitude, position.coords.longitude);
        
        // Center map on first location update
        if (!userLocation) {
          map.setView(newLocation, 16);
        }
      },
      (error) => {
        console.error('Location error:', error);
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
  }, [locationEnabled, map, onLocationUpdate, userLocation]);

  if (!userLocation || !locationEnabled) return null;

  const playerIcon = createPlayerIcon();

  return (
    <>
      {/* Player location marker */}
      {playerIcon && (
        <Marker position={userLocation} icon={playerIcon}>
          <Popup>Your location</Popup>
        </Marker>
      )}
      
      {/* Accuracy circle */}
      <Circle
        center={userLocation}
        radius={20}
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

// H3 zone renderer component
const H3ZoneRenderer: React.FC<{ zones: H3Zone[] }> = ({ zones }) => {
  const map = useMap();
  
  React.useEffect(() => {
    // Clear existing H3 layers
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
        color: zone.type === 'safe' ? '#10b981' : '#ef4444',
        fillColor: zone.type === 'safe' ? '#34d399' : '#f87171',
        fillOpacity: 0.4,
        weight: 2
      });
      
      (polygon as any).isH3Zone = true;
      polygon.bindPopup(`<b>${zone.name}</b><br/>${zone.type} zone<br/>${zone.pointValue} points`);
      polygon.addTo(map);
    });
  }, [zones, map]);
  
  return null;
};

const PlayerMap: React.FC<PlayerMapProps> = ({
  existingZones = [],
  height = '100%',
  defaultCenter = [13.7563, 100.5018], // Bangkok
  defaultZoom = 15,
  onLocationUpdate,
  locationEnabled = false
}) => {
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
        
        <H3ZoneRenderer zones={existingZones} />
        
        <LocationTracker 
          onLocationUpdate={onLocationUpdate}
          locationEnabled={locationEnabled}
        />
      </MapContainer>
      
      {/* Location permission prompt */}
      {!locationEnabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-black px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm font-semibold">Enable location to see your position on the map</p>
        </div>
      )}
    </div>
  );
};

export { PlayerMap };