'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { H3Zone } from '../Map/types';

interface SimpleZoneProximityProps {
  nearbyZones: H3Zone[];
  onZoneEnter?: (zone: H3Zone) => void;
  onZoneExit?: () => void;
}

const SimpleZoneProximity: React.FC<SimpleZoneProximityProps> = ({
  nearbyZones,
  onZoneEnter,
  onZoneExit
}) => {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentZone, setCurrentZone] = useState<H3Zone | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation(position);
        setLocationError(null);
        
        // Simple zone detection (for demo purposes)
        // In a real app, you'd use proper H3 geofencing
        const nearestZone = nearbyZones.find(zone => {
          const distance = getDistance(
            position.coords.latitude,
            position.coords.longitude,
            zone.center.lat,
            zone.center.lng
          );
          // Assuming zone radius of ~100m for demo
          return distance < 100;
        });

        if (nearestZone && !currentZone) {
          setCurrentZone(nearestZone);
          onZoneEnter?.(nearestZone);
        } else if (!nearestZone && currentZone) {
          setCurrentZone(null);
          onZoneExit?.();
        } else if (nearestZone && currentZone && nearestZone.id !== currentZone.id) {
          setCurrentZone(nearestZone);
          onZoneEnter?.(nearestZone);
        }
      },
      (error) => {
        setLocationError(error.message);
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
  }, [nearbyZones, currentZone, onZoneEnter, onZoneExit]);

  // Simple distance calculation
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  if (locationError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Location Error</p>
            <p className="text-sm text-gray-300 mt-1">{locationError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Zone Proximity
      </h3>
      
      {userLocation ? (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-400">Current Status: </span>
            {currentZone ? (
              <span className="text-green-400 font-semibold">Inside {currentZone.name}</span>
            ) : (
              <span className="text-yellow-400">Outside all zones</span>
            )}
          </div>
          
          {userLocation.coords.accuracy > 50 && (
            <p className="text-xs text-gray-500">
              Location accuracy: {Math.round(userLocation.coords.accuracy)}m
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Acquiring location...</p>
      )}
    </div>
  );
};

export { SimpleZoneProximity };