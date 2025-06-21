'use client';

import React, { useState, useCallback } from 'react';
import { 
  Hexagon, 
  MapPin, 
  MousePointer, 
  Square,
  Undo2,
  RotateCcw,
  Check,
  X,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { ZoneDrawingState } from './types';

export interface GameManagerControlsProps {
  onZoneDrawingStateChange: (state: ZoneDrawingState) => void;
  onConfirmZone: (zone: { h3Indices: string[], type: 'safe' | 'danger', pointValue: number, name: string }) => void;
  onUndo: () => void;
  onClear: () => void;
  currentZoneCount: number;
  isDrawing: boolean;
  className?: string;
}

export const GameManagerControls: React.FC<GameManagerControlsProps> = ({
  onZoneDrawingStateChange,
  onConfirmZone,
  onUndo,
  onClear,
  currentZoneCount,
  isDrawing,
  className = ''
}) => {
  const [zoneType, setZoneType] = useState<'safe' | 'danger'>('safe');
  const [pointValue, setPointValue] = useState(10);
  const [drawMode, setDrawMode] = useState<'single' | 'area' | 'path'>('single');
  const [zoneName, setZoneName] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Handle drawing mode change
  const handleDrawModeChange = useCallback((mode: 'single' | 'area' | 'path') => {
    setDrawMode(mode);
    onZoneDrawingStateChange({
      isDrawing: true,
      currentZone: [],
      zoneType,
      pointValue,
      drawMode: mode
    });
  }, [zoneType, pointValue, onZoneDrawingStateChange]);

  // Handle zone type change
  const handleZoneTypeChange = useCallback((type: 'safe' | 'danger') => {
    setZoneType(type);
    // Always notify parent when zone type changes
    onZoneDrawingStateChange({
      isDrawing: isDrawing,
      currentZone: [],
      zoneType: type,
      pointValue,
      drawMode
    });
  }, [isDrawing, pointValue, drawMode, onZoneDrawingStateChange]);

  // Handle point value change
  const handlePointValueChange = useCallback((value: number) => {
    setPointValue(value);
    // Update drawing state with new point value
    onZoneDrawingStateChange({
      isDrawing: isDrawing,
      currentZone: [],
      zoneType,
      pointValue: value,
      drawMode
    });
  }, [isDrawing, zoneType, drawMode, onZoneDrawingStateChange]);

  // Start drawing
  const startDrawing = useCallback(() => {
    onZoneDrawingStateChange({
      isDrawing: true,
      currentZone: [],
      zoneType,
      pointValue,
      drawMode
    });
  }, [zoneType, pointValue, drawMode, onZoneDrawingStateChange]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    onZoneDrawingStateChange({
      isDrawing: false,
      currentZone: [],
      zoneType,
      pointValue,
      drawMode
    });
  }, [zoneType, pointValue, drawMode, onZoneDrawingStateChange]);

  // Confirm current zone
  const handleConfirmZone = useCallback(() => {
    if (currentZoneCount > 0 && zoneName.trim()) {
      onConfirmZone({
        h3Indices: [], // Will be filled by the map component
        type: zoneType,
        pointValue: pointValue, // Use current state value
        name: zoneName.trim()
      });
      setZoneName('');
      stopDrawing();
    }
  }, [currentZoneCount, zoneName, zoneType, pointValue, onConfirmZone, stopDrawing]);

  return (
    <div className={`absolute top-20 left-4 z-[500] ${className}`}>
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
        {/* Main Controls */}
        <div className="p-4">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Zone Drawing Controls
          </h3>

          {/* Drawing Mode Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-gray-300 text-xs font-medium">Drawing Mode</label>
            <div className="flex gap-1">
              <button
                onClick={() => handleDrawModeChange('single')}
                className={`flex-1 p-2 rounded text-xs font-medium transition-all ${
                  drawMode === 'single'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                title="Single hexagon selection"
              >
                <Hexagon className="w-4 h-4 mx-auto mb-1" />
                Single
              </button>
              <button
                onClick={() => handleDrawModeChange('area')}
                className={`flex-1 p-2 rounded text-xs font-medium transition-all ${
                  drawMode === 'area'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                title="Area selection"
              >
                <Square className="w-4 h-4 mx-auto mb-1" />
                Area
              </button>
              <button
                onClick={() => handleDrawModeChange('path')}
                className={`flex-1 p-2 rounded text-xs font-medium transition-all ${
                  drawMode === 'path'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                title="Path drawing"
              >
                <MapPin className="w-4 h-4 mx-auto mb-1" />
                Path
              </button>
            </div>
          </div>

          {/* Zone Type Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-gray-300 text-xs font-medium">Zone Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleZoneTypeChange('safe')}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                  zoneType === 'safe'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Safe Zone
              </button>
              <button
                onClick={() => handleZoneTypeChange('danger')}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                  zoneType === 'danger'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Danger Zone
              </button>
            </div>
          </div>

          {/* Point Value */}
          <div className="space-y-2 mb-4">
            <label className="text-gray-300 text-xs font-medium">Point Value</label>
            <input
              type="number"
              min="1"
              max="100"
              value={pointValue}
              onChange={(e) => {
                const rawValue = e.target.value;
                if (rawValue === '') {
                  setPointValue(1);
                  return;
                }
                const value = parseInt(rawValue);
                if (!isNaN(value)) {
                  const clampedValue = Math.max(1, Math.min(100, value));
                  setPointValue(clampedValue);
                }
              }}
              className="w-full px-3 py-1.5 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
              placeholder="Points per tick"
            />
          </div>

          {/* Zone Name */}
          <div className="space-y-2 mb-4">
            <label className="text-gray-300 text-xs font-medium">Zone Name</label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
              placeholder="Enter zone name..."
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isDrawing ? (
              <button
                onClick={startDrawing}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-medium rounded transition-all flex items-center justify-center gap-2"
              >
                <MousePointer className="w-4 h-4" />
                Start Drawing
              </button>
            ) : (
              <>
                <button
                  onClick={handleConfirmZone}
                  disabled={currentZoneCount === 0 || !zoneName.trim()}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Zone ({currentZoneCount} hexes)
                </button>
                <button
                  onClick={stopDrawing}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}

            {/* Utility Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onUndo}
                disabled={currentZoneCount === 0}
                className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-300 text-xs font-medium rounded transition-all flex items-center justify-center gap-1"
              >
                <Undo2 className="w-3 h-3" />
                Undo
              </button>
              <button
                onClick={onClear}
                disabled={currentZoneCount === 0}
                className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-300 text-xs font-medium rounded transition-all flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded transition-all flex items-center justify-center gap-1"
              >
                {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-medium border-t border-gray-700 transition-all"
        >
          {showSettings ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {/* Advanced Settings */}
        {showSettings && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              <p className="mb-2">Drawing Tips:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Single: Click individual hexagons</li>
                <li>Area: Click and drag to select area</li>
                <li>Path: Click to create connected path</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Current Status */}
      {isDrawing && (
        <div className="mt-2 p-3 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-300">
            <div className="flex items-center justify-between mb-1">
              <span>Mode:</span>
              <span className="font-medium text-cyan-400">{drawMode}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span>Type:</span>
              <span className={`font-medium ${zoneType === 'safe' ? 'text-green-400' : 'text-red-400'}`}>
                {zoneType === 'safe' ? 'Safe' : 'Danger'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hexagons:</span>
              <span className="font-medium text-white">{currentZoneCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManagerControls;