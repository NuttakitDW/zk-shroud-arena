// Arena Components for ZK Shroud Arena Battle Royale
export { BattleArena } from './BattleArena';
// Note: RealWorldArena excluded from exports to prevent SSR issues with Leaflet
// Import RealWorldArena directly where needed using dynamic imports

// Re-export types for convenience
export type { BattleArenaProps } from './BattleArena';