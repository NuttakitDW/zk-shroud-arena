/**
 * H3 Zone Overlay Component
 * Renders H3 hexagonal zones on a Leaflet map
 */

import React, { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { H3Index } from '../../types/zkProof';
import { h3Service, H3Zone } from '../../services/h3Service';

interface H3ZoneOverlayProps {
  activeZones: H3Index[];
  currentPlayerZone?: H3Index | null;
  nearbyZones?: H3Index[];
  showLabels?: boolean;
  zoneColors?: {
    active?: string;
    player?: string;
    nearby?: string;
    inactive?: string;
  };
  zoneOpacity?: number;
  animatePlayerZone?: boolean;
}

const DEFAULT_COLORS = {
  active: '#10b981', // emerald-500
  player: '#3b82f6', // blue-500
  nearby: '#f59e0b', // amber-500
  inactive: '#6b7280' // gray-500
};

const H3ZoneOverlay: React.FC<H3ZoneOverlayProps> = ({
  activeZones,
  currentPlayerZone,
  nearbyZones = [],
  showLabels = false,
  zoneColors = DEFAULT_COLORS,
  zoneOpacity = 0.3,
  animatePlayerZone = true
}) => {
  const map = useMap();
  const colors = { ...DEFAULT_COLORS, ...zoneColors };

  // Create zone polygons
  const zonePolygons = useMemo(() => {
    const polygons: Map<H3Index, L.Polygon> = new Map();
    
    // Helper function to create a polygon for a zone
    const createZonePolygon = (zoneIndex: H3Index, color: string, weight: number = 2) => {
      const zone = h3Service.createH3Zone(zoneIndex);
      const vertices = zone.vertices.map(v => [v.latitude, v.longitude] as L.LatLngExpression);
      
      const polygon = L.polygon(vertices, {
        color: color,
        weight: weight,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: zoneOpacity,
        className: zoneIndex === currentPlayerZone && animatePlayerZone ? 'zone-pulse' : ''
      });

      // Add label if enabled
      if (showLabels) {
        const center = zone.center;
        const label = L.marker([center.latitude, center.longitude], {
          icon: L.divIcon({
            className: 'zone-label',
            html: `<div class="zone-label-text">${zoneIndex.substring(0, 6)}...</div>`,
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          })
        });
        
        polygon.on('add', () => label.addTo(map));
        polygon.on('remove', () => label.remove());
      }

      // Add hover effects
      polygon.on('mouseover', function() {
        this.setStyle({ weight: 4, fillOpacity: zoneOpacity + 0.2 });
      });
      
      polygon.on('mouseout', function() {
        this.setStyle({ weight: weight, fillOpacity: zoneOpacity });
      });

      // Add click handler for zone info
      polygon.on('click', () => {
        const popupContent = `
          <div class="zone-popup">
            <h4>Zone Information</h4>
            <p><strong>ID:</strong> ${zoneIndex}</p>
            <p><strong>Center:</strong> ${zone.center.latitude.toFixed(4)}, ${zone.center.longitude.toFixed(4)}</p>
            <p><strong>Resolution:</strong> ${zone.resolution}</p>
            ${zoneIndex === currentPlayerZone ? '<p class="player-zone">You are here!</p>' : ''}
          </div>
        `;
        
        L.popup()
          .setLatLng([zone.center.latitude, zone.center.longitude])
          .setContent(popupContent)
          .openOn(map);
      });

      return polygon;
    };

    // Create polygons for all zones
    activeZones.forEach(zoneIndex => {
      let color = colors.active;
      let weight = 2;
      
      // Determine zone styling
      if (zoneIndex === currentPlayerZone) {
        color = colors.player;
        weight = 3;
      } else if (nearbyZones.includes(zoneIndex)) {
        color = colors.nearby;
        weight = 2.5;
      }
      
      const polygon = createZonePolygon(zoneIndex, color, weight);
      polygons.set(zoneIndex, polygon);
    });

    return polygons;
  }, [activeZones, currentPlayerZone, nearbyZones, colors, zoneOpacity, showLabels, animatePlayerZone, map]);

  // Add/remove polygons from map
  useEffect(() => {
    // Add all polygons to map
    zonePolygons.forEach(polygon => {
      polygon.addTo(map);
    });

    // Cleanup function to remove polygons
    return () => {
      zonePolygons.forEach(polygon => {
        polygon.remove();
      });
    };
  }, [zonePolygons, map]);

  // Add custom CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .zone-pulse {
        animation: zone-pulse 2s ease-in-out infinite;
      }
      
      @keyframes zone-pulse {
        0% {
          fill-opacity: ${zoneOpacity};
        }
        50% {
          fill-opacity: ${zoneOpacity + 0.3};
        }
        100% {
          fill-opacity: ${zoneOpacity};
        }
      }
      
      .zone-label {
        background: none !important;
        border: none !important;
      }
      
      .zone-label-text {
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-family: monospace;
        white-space: nowrap;
        text-align: center;
      }
      
      .zone-popup {
        min-width: 200px;
      }
      
      .zone-popup h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: bold;
      }
      
      .zone-popup p {
        margin: 4px 0;
        font-size: 12px;
      }
      
      .zone-popup .player-zone {
        color: #3b82f6;
        font-weight: bold;
        margin-top: 8px;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [zoneOpacity]);

  // Fit map to show all zones when they change
  useEffect(() => {
    if (activeZones.length > 0) {
      const bounds: L.LatLngBounds[] = [];
      
      activeZones.forEach(zoneIndex => {
        const zone = h3Service.createH3Zone(zoneIndex);
        const zoneBounds = L.latLngBounds(
          zone.vertices.map(v => [v.latitude, v.longitude] as L.LatLngExpression)
        );
        bounds.push(zoneBounds);
      });

      if (bounds.length > 0) {
        const combinedBounds = bounds.reduce((acc, curr) => acc.extend(curr));
        map.fitBounds(combinedBounds, { padding: [50, 50] });
      }
    }
  }, [activeZones, map]);

  return null; // This component only adds layers to the map
};

export default H3ZoneOverlay;