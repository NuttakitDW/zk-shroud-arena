# 🎮 Zone Control Demo Instructions

**NOT YOUR TYPICAL BATTLE ROYALE!** 

Unlike classic battle royale games with automatic shrinking zones, this game gives the Game Manager complete creative control. The GM can spawn new zones anywhere on the map, at any time, in any shape they want - creating a dynamic, unpredictable battlefield that changes based on human strategy rather than timers.

## 🚀 Quick Start

1. **Make sure the frontend is running:**
   ```bash
   cd src/frontend
   npm run dev
   ```
   The app runs on http://localhost:3001

2. **Open two browser tabs/windows:**
   - **Tab 1**: Go to http://localhost:3001/gm (Game Manager)
   - **Tab 2**: Go to http://localhost:3001/player (Player)

## 👮 Game Manager Instructions (Tab 1)

**You are the puppet master!** Create an ever-changing battlefield:

1. **Simple Zone Creation:**
   - First, choose your zone size from 4 presets (2m, 25m, 100m, or 350m)
   - Once you place your first zone, the size is locked for consistency
   - Click anywhere on the map to add hexagonal zones
   - Check "Add neighbor cells" to create 7 hexagons at once (one center + 6 neighbors)
   - To change size, click "Clear" to remove all zones and start fresh

2. **Dynamic Control:**
   - Spawn zones ANYWHERE on the map at ANY TIME
   - No automatic shrinking - YOU control when and where zones appear
   - Clear all zones instantly to reshape the battlefield
   - See the total hexagon count in real-time

3. **Real-time Updates:**
   - Zones appear instantly on all player screens
   - Active player count updates every 2 seconds
   - Create dynamic gameplay by adding/removing zones strategically

## 🎯 Player Instructions (Tab 2)

1. **Enable Location:**
   - Click "Enable Location" button
   - Allow browser location permissions

2. **Navigate Zones:**
   - See zones appear on your map in real-time
   - Move to safe zones (green) to earn coins
   - Avoid danger zones (red) to stay alive
   - Watch your coins increase in safe zones

3. **Privacy Protected:**
   - Game Manager CANNOT see your exact location
   - Only zone entry/exit is tracked
   - Your position stays completely private

## 🔧 Technical Details

- **Real-time Sync**: Uses localStorage polling (updates every second)
- **H3 Hexagons**: Uber's H3 geospatial indexing for zone shapes
- **Privacy**: Player locations never leave their device
- **Demo Mode**: Perfect for presentations and testing

## 📝 Demo Script

1. Open Game Manager tab
2. Select your desired zone size (e.g., "Area" for ~100m zones)
3. Click on the map to create hexagonal zones
4. Notice the size selector disappears - all zones now use the same size
5. Switch to Player tab - zones appear instantly!
6. Go back to GM, click "Add neighbor cells" checkbox
7. Click to create larger zone clusters (7 hexagons at once)
8. Use "Clear" button to wipe the map - size selector returns!
9. Try a different size (e.g., "Neighborhood" for ~350m zones)
10. Emphasize that GM controls everything - no automatic shrinking!

## 🎯 What Makes This Unique

- 🎮 **Human-Controlled Battlefield**: No predictable shrinking circles - the Game Manager creates a living, breathing battlefield
- 🎨 **Creative Freedom**: GMs can create any zone pattern - mazes, islands, moving paths, sudden sanctuaries
- ⚡ **Real-time Strategy**: Zones can appear/disappear instantly, creating dynamic gameplay
- 🔐 **Privacy First**: Players' exact locations remain secret even from the GM
- 🎯 **Tactical Depth**: GMs can respond to player behavior by strategically placing zones

## 💡 Creative Game Scenarios

1. **The Moving Path**: Create a path of safe zones that players must follow, removing zones behind them
2. **Island Hopping**: Scatter small safe zones across the map, forcing players to risk danger zones
3. **The Shrinking Maze**: Build a complex maze that changes as you remove walls
4. **Sudden Death**: Instantly turn all zones to danger except one small area
5. **The Hunt**: Create zones that guide players toward each other

Enjoy the demo! 🚀