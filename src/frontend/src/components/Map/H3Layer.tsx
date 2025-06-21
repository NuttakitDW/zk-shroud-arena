'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import * as h3 from 'h3-js';
import { H3Zone, ZoneDrawingState, Coordinates } from './types';

export interface H3LayerProps {
  zones: H3Zone[];
  drawingState: ZoneDrawingState;
  currentDrawnIndices: string[];
  resolution?: number;
  onHexClick?: (h3Index: string) => void;
  onHexHover?: (h3Index: string | null) => void;
  onDrawnIndicesChange?: (indices: string[]) => void;
  showPreview?: boolean;
}

// Convert H3 boundary to Leaflet polygon coordinates
const h3ToLeafletPolygon = (h3Index: string): L.LatLngTuple[] => {
  const boundary = h3.cellToBoundary(h3Index, true);
  return boundary.map(coord => [coord[0], coord[1]] as L.LatLngTuple);
};

// Get H3 resolution based on zoom level
const getH3Resolution = (zoom: number): number => {
  if (zoom <= 5) return 2;
  if (zoom <= 7) return 3;
  if (zoom <= 9) return 4;
  if (zoom <= 11) return 5;
  if (zoom <= 13) return 6;
  if (zoom <= 15) return 7;
  if (zoom <= 17) return 8;
  return 9;
};

export const H3Layer: React.FC<H3LayerProps> = ({
  zones,
  drawingState,
  currentDrawnIndices,
  resolution,
  onHexClick,
  onHexHover,
  onDrawnIndicesChange,
  showPreview = true
}) => {
  const map = useMap();
  const layerGroupRef = React.useRef<L.LayerGroup | null>(null);
  const drawnLayerGroupRef = React.useRef<L.LayerGroup | null>(null);
  const [isDrawingPath, setIsDrawingPath] = React.useState(false);
  const [pathStart, setPathStart] = React.useState<string | null>(null);
  const [pathResolution, setPathResolution] = React.useState<number | null>(null);

  // Initialize layer groups
  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    if (!drawnLayerGroupRef.current) {
      drawnLayerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
        layerGroupRef.current = null;
      }
      if (drawnLayerGroupRef.current) {
        drawnLayerGroupRef.current.remove();
        drawnLayerGroupRef.current = null;
      }
    };
  }, [map]);

  // Get style for zone type
  const getZoneStyle = useCallback((zoneType: 'safe' | 'danger', isPreview = false) => {
    const baseStyle = {
      safe: {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: isPreview ? 0.2 : 0.3,
        weight: 2,
        opacity: isPreview ? 0.5 : 0.8
      },
      danger: {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: isPreview ? 0.2 : 0.3,
        weight: 2,
        opacity: isPreview ? 0.5 : 0.8
      }
    };
    return baseStyle[zoneType];
  }, []);

  // Render existing zones
  useEffect(() => {
    if (!layerGroupRef.current) return;

    // Clear existing layers
    layerGroupRef.current.clearLayers();

    // Add zone polygons
    zones.forEach(zone => {
      const polygon = h3ToLeafletPolygon(zone.h3Index);
      const style = getZoneStyle(zone.type);
      
      const poly = L.polygon(polygon, {
        ...style,
        className: 'h3-zone-polygon'
      });

      // Add popup with zone info
      poly.bindPopup(`
        <div class="p-2">
          <h4 class="font-bold text-sm">${zone.name}</h4>
          <p class="text-xs text-gray-600">Type: ${zone.type}</p>
          <p class="text-xs text-gray-600">Points: ${zone.pointValue}/tick</p>
        </div>
      `);

      // Add click handler
      poly.on('click', () => {
        if (onHexClick && !drawingState.isDrawing) {
          onHexClick(zone.h3Index);
        }
      });

      layerGroupRef.current.addLayer(poly);
    });
  }, [zones, getZoneStyle, onHexClick, drawingState.isDrawing]);

  // Render current drawing preview
  useEffect(() => {
    if (!drawnLayerGroupRef.current || !showPreview) return;

    // Clear existing preview layers
    drawnLayerGroupRef.current.clearLayers();

    // Add preview polygons
    currentDrawnIndices.forEach(h3Index => {
      const polygon = h3ToLeafletPolygon(h3Index);
      const style = getZoneStyle(drawingState.zoneType, true);
      
      const poly = L.polygon(polygon, {
        ...style,
        className: 'h3-preview-polygon',
        dashArray: '5, 5'
      });

      drawnLayerGroupRef.current!.addLayer(poly);
    });
  }, [currentDrawnIndices, drawingState.zoneType, getZoneStyle, showPreview]);

  // Get H3 indices within bounds
  const getH3IndicesInBounds = useCallback((bounds: L.LatLngBounds, res: number): string[] => {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    
    // Create a polygon from bounds
    const boundaryPolygon: h3.CoordPair[] = [
      [sw.lat, sw.lng],
      [ne.lat, sw.lng],
      [ne.lat, ne.lng],
      [sw.lat, ne.lng],
      [sw.lat, sw.lng]
    ];

    // Get H3 cells within the polygon
    const cells = h3.polygonToCells(boundaryPolygon, res);
    return cells;
  }, []);

  // Handle map clicks for drawing
  useMapEvents({
    click: (e) => {
      if (!drawingState.isDrawing || !onDrawnIndicesChange) return;

      const currentRes = resolution || getH3Resolution(map.getZoom());
      const clickedH3 = h3.latLngToCell(e.latlng.lat, e.latlng.lng, currentRes);

      if (drawingState.drawMode === 'single') {
        // Toggle hexagon selection
        const newIndices = currentDrawnIndices.includes(clickedH3)
          ? currentDrawnIndices.filter(idx => idx !== clickedH3)
          : [...currentDrawnIndices, clickedH3];
        onDrawnIndicesChange(newIndices);
      } else if (drawingState.drawMode === 'path') {
        // Path drawing mode
        if (!isDrawingPath || !pathStart) {
          // Start new path - store the resolution
          setIsDrawingPath(true);
          setPathStart(clickedH3);
          setPathResolution(currentRes);
          onDrawnIndicesChange([...currentDrawnIndices, clickedH3]);
        } else {
          // Continue path - use stored resolution to ensure compatibility
          const safeRes = pathResolution || currentRes;
          // Re-encode both cells at the same resolution to ensure compatibility
          const startCell = h3.cellToLatLng(pathStart);
          const endCell = h3.cellToLatLng(clickedH3);
          const startH3 = h3.latLngToCell(startCell[0], startCell[1], safeRes);
          const endH3 = h3.latLngToCell(endCell[0], endCell[1], safeRes);
          
          try {
            const pathIndices = h3.gridPathCells(startH3, endH3);
            const newIndices = [...new Set([...currentDrawnIndices, ...pathIndices])];
            onDrawnIndicesChange(newIndices);
            setPathStart(endH3); // Use the re-encoded cell
          } catch (error) {
            // If path creation fails, just add the clicked cell
            console.warn('Failed to create path between cells:', error);
            onDrawnIndicesChange([...currentDrawnIndices, endH3]);
            setPathStart(endH3);
          }
        }
      }
    },
    mousedown: (e) => {
      if (!drawingState.isDrawing || drawingState.drawMode !== 'area') return;
      
      // Start area selection
      const startLatLng = e.latlng;
      let currentBounds = L.latLngBounds(startLatLng, startLatLng);
      
      const selectionRect = L.rectangle(currentBounds, {
        color: drawingState.zoneType === 'safe' ? '#22c55e' : '#ef4444',
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.1,
        dashArray: '5, 5'
      }).addTo(map);

      const handleMouseMove = (event: L.LeafletMouseEvent) => {
        currentBounds = L.latLngBounds(startLatLng, event.latlng);
        selectionRect.setBounds(currentBounds);
      };

      const handleMouseUp = () => {
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', handleMouseUp);
        selectionRect.remove();

        // Get H3 indices within selection
        const currentRes = resolution || getH3Resolution(map.getZoom());
        const indicesInBounds = getH3IndicesInBounds(currentBounds, currentRes);
        
        if (onDrawnIndicesChange) {
          const newIndices = [...new Set([...currentDrawnIndices, ...indicesInBounds])];
          onDrawnIndicesChange(newIndices);
        }
      };

      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
    },
    mousemove: (e) => {
      if (!drawingState.isDrawing || !onHexHover) return;

      const currentRes = resolution || getH3Resolution(map.getZoom());
      const hoveredH3 = h3.latLngToCell(e.latlng.lat, e.latlng.lng, currentRes);
      onHexHover(hoveredH3);
    },
    mouseout: () => {
      if (onHexHover) {
        onHexHover(null);
      }
    }
  });

  // Handle escape key to stop path drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingPath) {
        setIsDrawingPath(false);
        setPathStart(null);
        setPathResolution(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingPath]);

  // Reset path state when drawing stops or mode changes
  useEffect(() => {
    if (!drawingState.isDrawing || drawingState.drawMode !== 'path') {
      setIsDrawingPath(false);
      setPathStart(null);
      setPathResolution(null);
    }
  }, [drawingState.isDrawing, drawingState.drawMode]);

  return null; // This component only manages map layers
};

export default H3Layer;