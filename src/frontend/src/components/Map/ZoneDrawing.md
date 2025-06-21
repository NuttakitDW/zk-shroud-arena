# Zone Drawing UI Documentation

## Overview
The Zone Drawing UI enables Game Managers to create H3 hexagonal zones on an interactive map for the real-time multiplayer zone control game. This feature integrates with the existing RealWorldMap component and provides tools for drawing safe and danger zones.

## Components

### 1. GameManagerControls
Location: `src/components/Map/GameManagerControls.tsx`

The main control panel for zone drawing operations.

**Features:**
- Drawing mode selection (Single, Area, Path)
- Zone type selection (Safe/Danger)
- Point value configuration
- Zone naming
- Undo/Clear/Preview functionality

**Props:**
```typescript
interface GameManagerControlsProps {
  onZoneDrawingStateChange: (state: ZoneDrawingState) => void;
  onConfirmZone: (zone: { h3Indices: string[], type: 'safe' | 'danger', pointValue: number, name: string }) => void;
  onUndo: () => void;
  onClear: () => void;
  currentZoneCount: number;
  isDrawing: boolean;
  className?: string;
}
```

### 2. H3Layer
Location: `src/components/Map/H3Layer.tsx`

React Leaflet layer component that handles H3 hexagon rendering and interaction.

**Features:**
- Dynamic H3 resolution based on zoom level
- Zone visualization with different styles
- Interactive drawing modes
- Preview layer for current drawing

**Props:**
```typescript
interface H3LayerProps {
  zones: H3Zone[];
  drawingState: ZoneDrawingState;
  currentDrawnIndices: string[];
  resolution?: number;
  onHexClick?: (h3Index: string) => void;
  onHexHover?: (h3Index: string | null) => void;
  onDrawnIndicesChange?: (indices: string[]) => void;
  showPreview?: boolean;
}
```

### 3. Enhanced RealWorldMap
Location: `src/components/Map/RealWorldMap.tsx`

Extended with game manager capabilities.

**New Props:**
```typescript
isGameManager?: boolean;
onZoneCreate?: (zone: H3Zone) => void;
existingZones?: H3Zone[];
```

## Data Structures

### H3Zone
```typescript
interface H3Zone {
  id: string;
  h3Index: string;
  center: Coordinates;
  type: 'safe' | 'danger';
  pointValue: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}
```

### ZoneDrawingState
```typescript
interface ZoneDrawingState {
  isDrawing: boolean;
  currentZone: string[]; // H3 indices being drawn
  zoneType: 'safe' | 'danger';
  pointValue: number;
  drawMode: 'single' | 'area' | 'path';
}
```

## Drawing Modes

### 1. Single Mode
- Click individual hexagons to add/remove them
- Best for precise zone creation
- Toggle selection on click

### 2. Area Mode
- Click and drag to select rectangular area
- All hexagons within bounds are selected
- Good for large zone creation

### 3. Path Mode
- Click to set start point
- Click again to create connected path
- Uses H3's `gridPathCells` for smooth paths
- Press ESC to stop path drawing

## H3 Resolution Strategy

The system automatically adjusts H3 resolution based on map zoom:
- Zoom ≤ 5: Resolution 2 (very large hexagons)
- Zoom 6-7: Resolution 3
- Zoom 8-9: Resolution 4
- Zoom 10-11: Resolution 5
- Zoom 12-13: Resolution 6
- Zoom 14-15: Resolution 7
- Zoom 16-17: Resolution 8
- Zoom ≥ 18: Resolution 9 (finest detail)

## Usage Example

```typescript
import dynamic from 'next/dynamic';

const RealWorldMap = dynamic(
  () => import('../components/Map/RealWorldMap').then(mod => mod.RealWorldMap),
  { ssr: false }
);

function GameManagerView() {
  const [zones, setZones] = useState<H3Zone[]>([]);
  
  const handleZoneCreate = (zone: H3Zone) => {
    setZones(prev => [...prev, zone]);
    // Sync to backend
  };
  
  return (
    <RealWorldMap
      isGameManager={true}
      onZoneCreate={handleZoneCreate}
      existingZones={zones}
      height="600px"
    />
  );
}
```

## Zone Synchronization

Zones should be synchronized across all game clients:

```typescript
// On zone creation
const syncZone = async (zone: H3Zone) => {
  await fetch('http://localhost:8080/zones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zone)
  });
};

// Real-time sync via WebSocket
ws.on('zone_created', (zone: H3Zone) => {
  setZones(prev => [...prev, zone]);
});
```

## Styling

Zones are styled based on type:
- **Safe Zones**: Green (#22c55e) with 30% opacity
- **Danger Zones**: Red (#ef4444) with 30% opacity
- **Preview**: Dashed border, 20% opacity

## Performance Considerations

1. **Hexagon Rendering**: Use React.memo for H3Layer to prevent unnecessary re-renders
2. **Large Zones**: Consider virtualization for zones with >1000 hexagons
3. **Resolution**: Higher resolutions (8-9) generate many hexagons - use carefully
4. **Batch Updates**: Group multiple hexagon additions before state update

## Testing

Comprehensive test suite available in:
- `src/__tests__/components/GameManagerControls.test.tsx`
- Tests cover all UI interactions and state management

## Future Enhancements

1. **Zone Templates**: Pre-defined zone shapes
2. **Zone Groups**: Combine multiple zones into named groups
3. **Import/Export**: JSON format for zone sharing
4. **Undo/Redo Stack**: Full history management
5. **Zone Validation**: Ensure zones don't overlap inappropriately
6. **Performance Mode**: Simplified rendering for mobile devices