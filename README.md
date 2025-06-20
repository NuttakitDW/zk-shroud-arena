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
# Start development environment
make dev

# Run tests
make test

# Build for production
make build
```

## 🔐 Privacy Features

- **Location Privacy**: Your exact position is never revealed to other players or the server
- **Strategy Protection**: Movement patterns and tactical decisions remain confidential
- **Fair Competition**: All players can verify rule compliance without information leakage
- **Cheat Prevention**: Cryptographic proofs prevent common exploits like wallhacking and teleportation

## 🏆 Competitive Integrity

ZK Shroud Arena demonstrates how zero-knowledge proofs can create truly fair competitive environments where privacy and verifiability coexist, opening new possibilities for esports and gaming tournaments.