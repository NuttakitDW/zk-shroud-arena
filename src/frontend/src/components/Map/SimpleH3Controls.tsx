import React, { useState } from 'react';
import { X, MapPin, Building, Map, Users, Eraser, PlusCircle } from 'lucide-react';

interface SimpleH3ControlsProps {
  onResolutionChange: (resolution: number) => void;
  onAddNeighborsChange: (add: boolean) => void;
  onClear: () => void;
  onEraserModeChange?: (enabled: boolean) => void;
  currentResolution: number;
  hasZones: boolean; // Disable size change if zones exist
  eraserMode?: boolean;
}

const H3_SIZES = [
  { 
    name: 'Precise', 
    resolution: 13,  // ~7.9m diameter, closest to 10m requirement
    size: '~10m across',
    icon: MapPin,
    description: 'Precise location tracking'
  },
  { 
    name: 'Building', 
    resolution: 11,  // Actually ~25m - perfect match!
    size: '~25m across',
    icon: Building,
    description: 'Building-sized area'
  },
  { 
    name: 'Area', 
    resolution: 10,  // Actually ~66m, closest to 100m
    size: '~100m across',
    icon: Map,
    description: 'Medium area coverage'
  },
  { 
    name: 'Neighborhood', 
    resolution: 8,   // Actually ~461m, closest to 350m
    size: '~350m across',
    icon: Users,
    description: 'Large area coverage'
  }
];

export const SimpleH3Controls: React.FC<SimpleH3ControlsProps> = ({
  onResolutionChange,
  onAddNeighborsChange,
  onClear,
  onEraserModeChange,
  currentResolution,
  hasZones,
  eraserMode = false
}) => {
  const [addNeighbors, setAddNeighbors] = useState(false);

  const handleAddNeighborsToggle = () => {
    const newValue = !addNeighbors;
    setAddNeighbors(newValue);
    onAddNeighborsChange(newValue);
  };

  const handleClear = () => {
    setAddNeighbors(false); // Reset checkbox when clearing
    onEraserModeChange?.(false); // Exit eraser mode when clearing
    onClear();
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="bg-white rounded-lg shadow-lg p-4 min-w-[500px]">
        {/* Header */}
        <div className="text-center mb-4">
          <p className={`font-medium ${eraserMode ? 'text-red-600' : 'text-green-600'}`}>
            {eraserMode ? 'Click on zones to erase them' : 'Click on the map to draw geofence area'}
          </p>
          {hasZones && !eraserMode && (
            <p className="text-sm text-gray-500 mt-1">
              Size locked to: {H3_SIZES.find(s => s.resolution === currentResolution)?.name} ({H3_SIZES.find(s => s.resolution === currentResolution)?.size})
            </p>
          )}
        </div>

        {/* Size Selection */}
        {!hasZones && !eraserMode && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 text-center mb-3">Choose Geofence Size:</h3>
            <div className="flex justify-center gap-3">
              {H3_SIZES.map((size) => {
                const Icon = size.icon;
                const isSelected = currentResolution === size.resolution;
                return (
                  <button
                    key={size.resolution}
                    onClick={() => onResolutionChange(size.resolution)}
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    title={size.description}
                  >
                    <Icon className={`w-6 h-6 mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                      {size.name}
                    </span>
                    <span className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>
                      {size.size}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mode buttons - Show if we have zones OR if we're in eraser mode */}
            {(hasZones || eraserMode) && onEraserModeChange && (
              <>
                {/* Draw mode button */}
                {eraserMode && (
                  <button
                    onClick={() => onEraserModeChange(false)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Draw Mode</span>
                  </button>
                )}

                {/* Eraser mode button */}
                <button
                  onClick={() => onEraserModeChange(!eraserMode)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-colors ${
                    eraserMode 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                  <span className="text-sm font-medium">{eraserMode ? 'Erasing Mode' : 'Eraser'}</span>
                </button>
              </>
            )}

            {/* Add neighbors checkbox */}
            {!eraserMode && (
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={addNeighbors}
                  onChange={handleAddNeighborsToggle}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Add neighbor cells</span>
              </label>
            )}
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
};