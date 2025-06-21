/**
 * ZoneSyncStatus Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneSyncStatus, ZoneSyncIndicator } from '../../components/ZoneSyncStatus';
import { ZoneSyncState, ZoneConflict } from '../../services/zoneSyncManager';

describe('ZoneSyncStatus', () => {
  const mockSyncState: ZoneSyncState = {
    currentZone: {
      id: 'test-zone-1',
      center: { x: 500, y: 500 },
      radius: 1000,
      isActive: true
    },
    pendingChanges: [],
    lastSyncTime: Date.now() - 5000,
    lastServerUpdate: Date.now() - 3000,
    conflictCount: 0,
    syncStatus: 'synced'
  };

  it('renders without crashing', () => {
    render(
      <ZoneSyncStatus
        zoneId="test-zone-1"
        syncState={mockSyncState}
      />
    );
  });

  it('displays correct sync status', () => {
    render(
      <ZoneSyncStatus
        zoneId="test-zone-1"
        syncState={mockSyncState}
        showDetails={true}
      />
    );
    
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('shows pending changes count', () => {
    const stateWithPending = {
      ...mockSyncState,
      pendingChanges: [
        {
          added: ['hex1', 'hex2'],
          removed: [],
          modified: [],
          timestamp: Date.now(),
          source: 'manager' as const
        }
      ],
      syncStatus: 'syncing' as const
    };

    render(
      <ZoneSyncStatus
        zoneId="test-zone-1"
        syncState={stateWithPending}
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('expands details when clicked', () => {
    render(
      <ZoneSyncStatus
        zoneId="test-zone-1"
        syncState={mockSyncState}
        showDetails={true}
      />
    );
    
    const header = screen.getByText('Synced').parentElement;
    fireEvent.click(header!);
    
    expect(screen.getByText(/Zone ID:/)).toBeInTheDocument();
    expect(screen.getByText(/test-zon/)).toBeInTheDocument(); // ID is truncated in display
  });

  it('displays conflicts when present', () => {
    const conflicts: ZoneConflict[] = [{
      localChange: {
        added: ['hex1'],
        removed: [],
        modified: [],
        timestamp: Date.now(),
        source: 'manager'
      },
      serverChange: {
        added: [],
        removed: ['hex1'],
        modified: [],
        timestamp: Date.now(),
        source: 'server'
      },
      resolution: 'server',
      timestamp: Date.now()
    }];

    const stateWithConflict = {
      ...mockSyncState,
      conflictCount: 1,
      syncStatus: 'conflict' as const
    };

    render(
      <ZoneSyncStatus
        zoneId="test-zone-1"
        syncState={stateWithConflict}
        conflicts={conflicts}
        showDetails={true}
      />
    );
    
    const header = screen.getByText('Conflict').parentElement;
    fireEvent.click(header!);
    
    expect(screen.getByText(/Total Conflicts:/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

describe('ZoneSyncIndicator', () => {
  it('renders synced status correctly', () => {
    render(
      <ZoneSyncIndicator
        syncStatus="synced"
        showLabel={true}
      />
    );
    
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renders syncing status with animation', () => {
    const { container } = render(
      <ZoneSyncIndicator
        syncStatus="syncing"
        size="md"
      />
    );
    
    const animatedElement = container.querySelector('.animate-ping');
    expect(animatedElement).toBeInTheDocument();
  });

  it('renders conflict status correctly', () => {
    render(
      <ZoneSyncIndicator
        syncStatus="conflict"
        showLabel={true}
      />
    );
    
    expect(screen.getByText('Conflict')).toBeInTheDocument();
  });

  it('renders disconnected status correctly', () => {
    render(
      <ZoneSyncIndicator
        syncStatus="disconnected"
        showLabel={true}
      />
    );
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container } = render(
      <ZoneSyncIndicator
        syncStatus="synced"
        size="lg"
      />
    );
    
    const indicator = container.querySelector('.w-4.h-4');
    expect(indicator).toBeInTheDocument();
  });
});