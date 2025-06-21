# ZK Shroud Arena

A zero-knowledge battle royale survival game where players compete in a shrinking arena while maintaining complete location privacy through cryptographic proofs.

## 🎮 Game Concept

**ZK Shroud Arena** is a revolutionary battle royale game that solves the fundamental privacy problem in competitive gaming: proving you're playing fairly without revealing your strategic position.

### Core Mechanics

- **Private Location Proofs**: Players generate zero-knowledge proofs that they remain within the safe zone without revealing their exact coordinates
- **Shrinking Arena**: The playable area decreases over time, forcing strategic movement and encounters
- **Fair Play Verification**: All players can verify others are following the rules without seeing their positions
- **Encrypted Combat**: Battle mechanics use ZK proofs to validate hits and eliminations while preserving tactical positioning

### Zero-Knowledge Innovation

- **Range Proofs**: Prove your coordinates are within the allowed boundary without revealing them
- **Movement Validation**: Confirm realistic movement patterns without exposing travel paths  
- **Combat Verification**: Validate weapon range and line-of-sight without revealing positions
- **Anti-Cheat System**: Detect impossible movements or teleportation through cryptographic constraints

### Technical Stack

- **Backend**: Rust-based game server with ZK proof verification
- **Frontend**: Next.js real-time game client with WebSocket communication
- **Cryptography**: Custom ZK circuits for location and combat proofs
- **Consensus**: Decentralized verification of game state and outcomes

## 🚀 Getting Started

This project is built for ZK Hack 2025, showcasing practical applications of zero-knowledge proofs in gaming and privacy-preserving competition.

### Development Setup

```bash
# Start frontend development server
cd src/frontend
npm install
npm run dev

# The frontend will be available at http://localhost:3001
# Backend ZK proof service should be running at http://localhost:8080

# Run tests
npm run test

# Build for production
npm run build
```

### Game Features (Implemented)

#### 🎮 Core Battle Royale System
- ✅ **Interactive Battle Royale Interface** - Complete game lobby, preparation, and active gameplay phases
- ✅ **Arena Mode Selection** - Choose between Virtual Arena and Real World Arena
- ✅ **Game State Management** - Complete React context-based state handling
- ✅ **Backend Integration** - Connection to Rust ZK proof service at localhost:8080

#### 🗺️ Dual Arena Modes
- ✅ **Virtual Arena** - Practice mode with simulated 2D battlefield and AI opponents
- ✅ **Real World Arena** - Play using actual GPS location with OpenStreetMap integration
- ✅ **Interactive Maps** - Click-to-move in virtual mode, real-time location tracking in real-world mode
- ✅ **Arena Zones** - Safe zones and shrinking mechanics visualization for both modes

#### 🔐 Zero-Knowledge Privacy System
- ✅ **Location Permission Management** - Smart location access requests with proper error handling
- ✅ **Real-time Location Tracking** - GPS-based gameplay with configurable accuracy levels
- ✅ **Privacy Controls** - Granular settings for location sharing, proof intervals, and movement thresholds
- ✅ **ZK Proof Integration** - Location verification without revealing exact coordinates
- ✅ **Anti-cheat Protection** - Movement validation, speed limits, and trust scoring

#### 🛡️ Advanced Privacy Features
- ✅ **Anonymous Mode** - Hide player identity in ZK proofs
- ✅ **Location Obfuscation** - Add random noise to coordinates for enhanced privacy
- ✅ **Configurable Accuracy** - Choose between high (±5m), medium (±50m), and low (±200m) precision
- ✅ **Manual/Automatic Proofs** - Control when ZK proofs are generated

#### 📱 User Experience
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Real-time UI Updates** - Live status indicators and game statistics
- ✅ **Professional Gaming Interface** - Dark theme with cyan/purple accents
- ✅ **Location Status Monitoring** - Visual feedback for GPS accuracy and connection status

## 🔐 Privacy Features

- **Location Privacy**: Your exact position is never revealed to other players or the server
- **Strategy Protection**: Movement patterns and tactical decisions remain confidential
- **Fair Competition**: All players can verify rule compliance without information leakage
- **Cheat Prevention**: Cryptographic proofs prevent common exploits like wallhacking and teleportation

## 🏆 Competitive Integrity

ZK Shroud Arena demonstrates how zero-knowledge proofs can create truly fair competitive environments where privacy and verifiability coexist, opening new possibilities for esports and gaming tournaments.