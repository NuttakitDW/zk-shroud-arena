'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import * as h3 from 'h3-js';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { H3Zone } from './types';
import { MiningAnimation } from './MiningAnimation';

// Create a custom icon for player location
const createPlayerIcon = (isInSafeZone: boolean = false, pointsPerTick: number = 10) => {
  if (typeof window === 'undefined') return null;
  
  const miningAnimation = isInSafeZone ? `
    <div style="
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
    ">
      <!-- Pulsing ring -->
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        background-color: #22c55e;
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse 2s infinite;
        top: -8px;
        left: -8px;
      "></div>
      
      <!-- Mining icon -->
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background-color: #22c55e;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.6);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <!-- Mining text -->
      <div style="
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        background-color: rgba(0, 0, 0, 0.8);
        color: #22c55e;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
      ">Mining +${pointsPerTick}</div>
    </div>
    
    <style>
      @keyframes pulse {
        0% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.2;
        }
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
      }
    </style>
  ` : '';
  
  return L.divIcon({
    className: 'player-location-marker',
    html: `
      <div style="position: relative;">
        ${miningAnimation}
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${isInSafeZone ? '#22c55e' : '#3b82f6'};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        "></div>
      </div>
    `,
    iconSize: isInSafeZone ? [80, 80] : [24, 24],
    iconAnchor: isInSafeZone ? [40, 60] : [12, 12],
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
  zones?: H3Zone[];
}> = ({ onLocationUpdate, locationEnabled, zones = [] }) => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isInSafeZone, setIsInSafeZone] = useState(false);
  const [currentZonePoints, setCurrentZonePoints] = useState(10);

  useEffect(() => {
    if (!locationEnabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLocation);
        onLocationUpdate?.(position.coords.latitude, position.coords.longitude);
        
        // Center map on first location update
        if (!userLocation) {
          map.setView(newLocation, 19);
        }
        
        // Check if player is in a safe zone
        const safeZone = zones.find(zone => {
          if (zone.type !== 'safe') return false;
          
          // Check if player's position is within the H3 cell
          const zoneH3Index = zone.h3Index;
          const zoneResolution = h3.getResolution(zoneH3Index);
          
          // Get the player's H3 cell at the same resolution as the zone
          const playerH3Index = h3.latLngToCell(position.coords.latitude, position.coords.longitude, zoneResolution);
          
          // Direct match check
          if (playerH3Index === zoneH3Index) {
            return true;
          }
          
          // For coarser resolutions (Area, Neighborhood), check if player is within the zone's cell
          // by checking if the player's finer resolution cell is a child of the zone's cell
          if (zoneResolution <= 10) { // Resolution 10 and below are coarser (Area, Neighborhood)
            // Check if player's position at a finer resolution is within the zone's cell
            const finerResolution = Math.min(zoneResolution + 2, 15); // Use a finer resolution
            const playerFinerH3Index = h3.latLngToCell(position.coords.latitude, position.coords.longitude, finerResolution);
            
            // Get the parent of the player's finer cell at the zone's resolution
            const playerParentAtZoneRes = h3.cellToParent(playerFinerH3Index, zoneResolution);
            
            return playerParentAtZoneRes === zoneH3Index;
          }
          
          return false;
        });
        
        setIsInSafeZone(!!safeZone);
        if (safeZone) {
          setCurrentZonePoints(safeZone.pointValue || 10);
        }
      },
      (error) => {
        // Handle geolocation errors properly
        let errorMessage = 'Unknown location error';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = error.message || 'Unknown location error';
        }
        console.warn('Location service:', errorMessage);
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
  }, [locationEnabled, map, onLocationUpdate, userLocation, zones]);

  if (!userLocation || !locationEnabled) return null;

  const playerIcon = createPlayerIcon(isInSafeZone, currentZonePoints);

  return (
    <>
      {/* Player location marker with mining animation */}
      {playerIcon && (
        <Marker position={userLocation} icon={playerIcon}>
          <Popup>
            Your location
            {isInSafeZone && (
              <div className="mt-2 text-green-500 font-semibold">
                Mining: +{currentZonePoints} points/tick
              </div>
            )}
          </Popup>
        </Marker>
      )}
      
      {/* Accuracy circle */}
      <Circle
        center={userLocation}
        radius={5}
        pathOptions={{
          fillColor: isInSafeZone ? '#22c55e' : '#3b82f6',
          fillOpacity: 0.2,
          color: isInSafeZone ? '#22c55e' : '#3b82f6',
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
  defaultZoom = 19,
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
          zones={existingZones}
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