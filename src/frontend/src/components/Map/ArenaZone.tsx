'use client';

import React, { useMemo } from 'react';

export interface ZoneCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Zone {
  id: string;
  name: string;
  coordinates: ZoneCoordinates;
  type: 'safe' | 'danger' | 'shrinking' | 'eliminated';
  shrinkProgress?: number; // 0-1, for shrinking zones
  timeRemaining?: number; // seconds
}

export interface ArenaZoneProps {
  zones: Zone[];
  width: number;
  height: number;
  viewBox?: string;
  className?: string;
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string | null) => void;
  showLabels?: boolean;
  showTimers?: boolean;
  animated?: boolean;
}

export const ArenaZone: React.FC<ArenaZoneProps> = ({
  zones,
  width,
  height,
  viewBox,
  className = '',
  onZoneClick,
  onZoneHover,
  showLabels = true,
  showTimers = true,
  animated = true,
}) => {
  const actualViewBox = viewBox || `0 0 ${width} ${height}`;

  // Zone styling configuration
  const zoneStyles = useMemo(() => ({
    safe: {
      fill: 'rgba(34, 197, 94, 0.2)',
      stroke: '#22c55e',
      strokeWidth: 2,
      strokeDasharray: 'none',
    },
    danger: {
      fill: 'rgba(239, 68, 68, 0.3)',
      stroke: '#ef4444',
      strokeWidth: 2,
      strokeDasharray: '8,4',
    },
    shrinking: {
      fill: 'rgba(251, 191, 36, 0.25)',
      stroke: '#fbbf24',
      strokeWidth: 3,
      strokeDasharray: '12,6',
    },
    eliminated: {
      fill: 'rgba(107, 114, 128, 0.1)',
      stroke: '#6b7280',
      strokeWidth: 1,
      strokeDasharray: '4,8',
    },
  }), []);

  // Generate zone elements
  const renderZone = (zone: Zone) => {
    const style = zoneStyles[zone.type];
    const { x, y, width: zoneWidth, height: zoneHeight } = zone.coordinates;

    // Calculate progress for shrinking zones
    const shrinkOffset = zone.shrinkProgress ? 
      Math.max(zoneWidth, zoneHeight) * zone.shrinkProgress * 0.1 : 0;

    const adjustedX = x + shrinkOffset;
    const adjustedY = y + shrinkOffset;
    const adjustedWidth = zoneWidth - (shrinkOffset * 2);
    const adjustedHeight = zoneHeight - (shrinkOffset * 2);

    return (
      <g key={zone.id}>
        {/* Main zone rectangle */}
        <rect
          x={adjustedX}
          y={adjustedY}
          width={Math.max(0, adjustedWidth)}
          height={Math.max(0, adjustedHeight)}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.strokeDasharray}
          rx={4}
          ry={4}
          className={`transition-all duration-300 ${
            onZoneClick ? 'cursor-pointer hover:opacity-80' : ''
          } ${animated ? 'animate-pulse' : ''}`}
          onClick={() => onZoneClick?.(zone.id)}
          onMouseEnter={() => onZoneHover?.(zone.id)}
          onMouseLeave={() => onZoneHover?.(null)}
        >
          {animated && zone.type === 'shrinking' && (
            <animate
              attributeName="stroke-dashoffset"
              values="0;24;0"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        {/* Zone border glow for special zones */}
        {(zone.type === 'danger' || zone.type === 'shrinking') && (
          <rect
            x={adjustedX - 2}
            y={adjustedY - 2}
            width={Math.max(0, adjustedWidth + 4)}
            height={Math.max(0, adjustedHeight + 4)}
            fill="none"
            stroke={style.stroke}
            strokeWidth={1}
            strokeOpacity={0.4}
            rx={6}
            ry={6}
            className={animated ? 'animate-pulse' : ''}
          />
        )}

        {/* Zone label */}
        {showLabels && adjustedWidth > 60 && adjustedHeight > 30 && (
          <text
            x={adjustedX + adjustedWidth / 2}
            y={adjustedY + adjustedHeight / 2 - 8}
            textAnchor="middle"
            className="fill-white text-sm font-semibold pointer-events-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {zone.name}
          </text>
        )}

        {/* Timer display */}
        {showTimers && zone.timeRemaining !== undefined && adjustedWidth > 80 && adjustedHeight > 50 && (
          <text
            x={adjustedX + adjustedWidth / 2}
            y={adjustedY + adjustedHeight / 2 + 8}
            textAnchor="middle"
            className="fill-white text-xs pointer-events-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {formatTime(zone.timeRemaining)}
          </text>
        )}

        {/* Shrink progress indicator */}
        {zone.type === 'shrinking' && zone.shrinkProgress !== undefined && (
          <g>
            <rect
              x={adjustedX + 4}
              y={adjustedY + adjustedHeight - 12}
              width={Math.max(0, adjustedWidth - 8)}
              height={4}
              fill="rgba(0,0,0,0.3)"
              rx={2}
            />
            <rect
              x={adjustedX + 4}
              y={adjustedY + adjustedHeight - 12}
              width={Math.max(0, (adjustedWidth - 8) * (1 - zone.shrinkProgress))}
              height={4}
              fill="#fbbf24"
              rx={2}
              className={animated ? 'transition-all duration-500' : ''}
            />
          </g>
        )}

        {/* Warning indicators for danger zones */}
        {zone.type === 'danger' && animated && (
          <g>
            {[...Array(3)].map((_, i) => (
              <circle
                key={i}
                cx={adjustedX + 20 + i * 15}
                cy={adjustedY + 20}
                r={3}
                fill="#ef4444"
                className="animate-ping"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </g>
        )}
      </g>
    );
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate grid background
  const renderGridBackground = () => (
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
      </pattern>
    </defs>
  );

  // Zone priority order (render danger zones on top)
  const sortedZones = useMemo(() => {
    const priority = { eliminated: 0, safe: 1, shrinking: 2, danger: 3 };
    return [...zones].sort((a, b) => priority[a.type] - priority[b.type]);
  }, [zones]);

  return (
    <div className={`relative ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={actualViewBox}
        className="w-full h-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {renderGridBackground()}
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Render zones in priority order */}
        {sortedZones.map(renderZone)}
        
        {/* Overall arena boundary */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="none"
          stroke="#4b5563"
          strokeWidth="2"
          strokeDasharray="10,5"
          rx="8"
          ry="8"
        />
      </svg>

      {/* Zone legend */}
      <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 text-white text-xs p-2 rounded space-y-1">
        <div className="font-semibold mb-1">Zone Types</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded opacity-50"></div>
          <span>Safe Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded opacity-50"></div>
          <span>Shrinking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded opacity-50"></div>
          <span>Danger Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded opacity-50"></div>
          <span>Eliminated</span>
        </div>
      </div>

      {/* Zone count indicator */}
      <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-90 text-white text-xs p-2 rounded">
        <div className="font-semibold">Active Zones: {zones.filter(z => z.type !== 'eliminated').length}</div>
      </div>
    </div>
  );
};

export default ArenaZone;