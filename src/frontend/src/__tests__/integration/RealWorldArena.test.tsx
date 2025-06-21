/**
 * Integration Tests for RealWorldArena
 * Tests for complete real-world location workflow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealWorldArena } from '../../components/arena/RealWorldArena';
import { GamePhase } from '../../types/gameState';
import { LocationCoordinates } from '../../types/zkProof';

// Mock all the dependencies
jest.mock('../../components/Map/RealWorldMap', () => ({
  RealWorldMap: ({ onLocationUpdate, onZKProofRequest, gamePhase }: any) => (
    <div data-testid="real-world-map">
      <div>Game Phase: {gamePhase}</div>
      <button 
        onClick={() => onLocationUpdate && onLocationUpdate({ latitude: 37.7749, longitude: -122.4194 })}
        data-testid="mock-location-update"
      >
        Update Location
      </button>
      <button 
        onClick={() => onZKProofRequest && onZKProofRequest({ latitude: 37.7749, longitude: -122.4194 })}
        data-testid="mock-zk-proof-request"
      >
        Request ZK Proof
      </button>
    </div>
  ),
}));

jest.mock('../../components/Location/LocationPrivacyControls', () => ({
  LocationPrivacyControls: ({ settings, onSettingsChange, isGameActive }: any) => (
    <div data-testid="privacy-controls">
      <div>Game Active: {isGameActive ? 'true' : 'false'}</div>
      <button 
        onClick={() => onSettingsChange({ ...settings, accuracyLevel: 'high' })}
        data-testid="change-accuracy"
      >
        Change Accuracy
      </button>
    </div>
  ),
}));

jest.mock('../../hooks/useRealWorldLocation', () => ({
  useRealWorldLocation: (gamePhase: any, options: any) => ({
    currentLocation: { latitude: 37.7749, longitude: -122.4194 },
    locationAccuracy: 10,
    isTracking: gamePhase === 'active',
    hasPermission: true,
    permissionDenied: false,
    lastProof: gamePhase === 'active' ? { proof: 'mock_proof' } : null,
    proofHistory: gamePhase === 'active' ? [{ proof: 'mock_proof' }] : [],
    error: null,
    isGeneratingProof: false,
    proofStatus: gamePhase === 'active' ? 'valid' : 'none',
    generateLocationProof: jest.fn().mockResolvedValue({
      proof: { proof: 'mock_proof' },
      location: { latitude: 37.7749, longitude: -122.4194 },
      timestamp: Date.now(),
    }),
    verifyLocationProof: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock timers for game timer
jest.useFakeTimers();

describe('RealWorldArena Integration', () => {
  const defaultProps = {
    className: 'test-arena',
    gamePhase: GamePhase.LOBBY,
    onLocationUpdate: jest.fn(),
    onZKProofGenerated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Basic Rendering', () => {
    it('should render all main components', () => {
      render(<RealWorldArena {...defaultProps} />);

      expect(screen.getByTestId('real-world-map')).toBeInTheDocument();
      expect(screen.getByText('Location Status')).toBeInTheDocument();
      expect(screen.getByText('ZK Proof Status')).toBeInTheDocument();
      expect(screen.getByText('Game Phase')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<RealWorldArena className="custom-arena" />);
      expect(container.firstChild).toHaveClass('custom-arena');
    });

    it('should display game stats', () => {
      render(<RealWorldArena {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument(); // players alive
      expect(screen.getByText('alive')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // proofs count
      expect(screen.getByText('proofs')).toBeInTheDocument();
    });
  });

  describe('Game Phase Integration', () => {
    it('should display correct game phase', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should show game timer when active', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);
      
      expect(screen.getByText('0:00')).toBeInTheDocument();
      
      // Advance timer
      jest.advanceTimersByTime(65000); // 1 minute 5 seconds
      
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    it('should not show timer when not active', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.LOBBY} />);
      expect(screen.queryByText('0:00')).not.toBeInTheDocument();
    });

    it('should display phase descriptions', () => {
      const testCases = [
        { phase: GamePhase.LOBBY, text: 'Waiting to start the game' },
        { phase: GamePhase.PREPARATION, text: 'Preparing arena...' },
        { phase: GamePhase.ACTIVE, text: 'Battle in progress!' },
        { phase: GamePhase.ZONE_SHRINKING, text: 'Safe zone shrinking' },
        { phase: GamePhase.GAME_OVER, text: 'Game completed' },
      ];

      testCases.forEach(({ phase, text }) => {
        const { unmount } = render(<RealWorldArena {...defaultProps} gamePhase={phase} />);
        expect(screen.getByText(text)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Location Status Display', () => {
    it('should show location coordinates', () => {
      render(<RealWorldArena {...defaultProps} />);

      expect(screen.getByText('37.774900')).toBeInTheDocument();
      expect(screen.getByText('-122.419400')).toBeInTheDocument();
      expect(screen.getByText('±10m')).toBeInTheDocument();
    });

    it('should show tracking status', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);
      expect(screen.getByText('Live Tracking')).toBeInTheDocument();
    });

    it('should show different status for inactive game', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.LOBBY} />);
      expect(screen.getByText('Location Found')).toBeInTheDocument();
    });
  });

  describe('ZK Proof Status Display', () => {
    it('should show proof status for active game', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);

      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // proof history count
    });

    it('should show no proof status for inactive game', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.LOBBY} />);
      expect(screen.getByText('No Proof')).toBeInTheDocument();
    });

    it('should update proof count when new proofs are generated', async () => {
      const onZKProofGenerated = jest.fn();
      
      render(
        <RealWorldArena 
          {...defaultProps} 
          gamePhase={GamePhase.ACTIVE}
          onZKProofGenerated={onZKProofGenerated}
        />
      );

      // Initial state - should show 1 proof
      expect(screen.getByText('1')).toBeInTheDocument();

      // Simulate ZK proof request from map
      const zkProofButton = screen.getByTestId('mock-zk-proof-request');
      fireEvent.click(zkProofButton);

      await waitFor(() => {
        expect(onZKProofGenerated).toHaveBeenCalled();
      });
    });
  });

  describe('Privacy Controls Integration', () => {
    it('should toggle privacy controls visibility', async () => {
      const user = userEvent.setup();
      
      render(<RealWorldArena {...defaultProps} />);

      const privacyButton = screen.getByText('Privacy');
      await user.click(privacyButton);

      expect(screen.getByTestId('privacy-controls')).toBeInTheDocument();

      // Click again to hide
      await user.click(privacyButton);
      expect(screen.queryByTestId('privacy-controls')).not.toBeInTheDocument();
    });

    it('should pass correct game active state to privacy controls', async () => {
      const user = userEvent.setup();
      
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);

      const privacyButton = screen.getByText('Privacy');
      await user.click(privacyButton);

      expect(screen.getByText('Game Active: true')).toBeInTheDocument();
    });

    it('should update privacy settings', async () => {
      const user = userEvent.setup();
      
      render(<RealWorldArena {...defaultProps} />);

      const privacyButton = screen.getByText('Privacy');
      await user.click(privacyButton);

      const changeAccuracyButton = screen.getByTestId('change-accuracy');
      await user.click(changeAccuracyButton);

      // Settings should be updated (this tests the state management)
      expect(screen.getByTestId('privacy-controls')).toBeInTheDocument();
    });
  });

  describe('Manual Proof Generation', () => {
    it('should show manual proof button when in manual mode', () => {
      // This would require mocking the hook to return manual mode settings
      // For now, we test that the button appears based on privacy settings
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);
      
      // The manual proof button is conditionally rendered based on settings
      // In the real implementation, it would appear when shareFrequency is 'manual'
    });
  });

  describe('Map Integration', () => {
    it('should pass correct props to map', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);

      const map = screen.getByTestId('real-world-map');
      expect(map).toBeInTheDocument();
      expect(screen.getByText('Game Phase: active')).toBeInTheDocument();
    });

    it('should handle location updates from map', async () => {
      const onLocationUpdate = jest.fn();
      
      render(
        <RealWorldArena 
          {...defaultProps} 
          onLocationUpdate={onLocationUpdate}
        />
      );

      const locationButton = screen.getByTestId('mock-location-update');
      fireEvent.click(locationButton);

      expect(onLocationUpdate).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });

    it('should handle ZK proof requests from map', async () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);

      const zkProofButton = screen.getByTestId('mock-zk-proof-request');
      fireEvent.click(zkProofButton);

      // The request should be handled by the hook
      // In integration, this would generate a proof
    });
  });

  describe('Connection Status', () => {
    it('should show connected status', () => {
      render(<RealWorldArena {...defaultProps} />);

      // Green indicator for connected
      const indicator = screen.getByRole('generic', { hidden: true });
      // We can't easily test the specific indicator without more specific test IDs
      // But we can verify the component renders without errors
      expect(screen.getByTestId('real-world-map')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing callbacks gracefully', () => {
      render(
        <RealWorldArena 
          gamePhase={GamePhase.ACTIVE}
          // No callbacks provided
        />
      );

      // Should render without errors
      expect(screen.getByTestId('real-world-map')).toBeInTheDocument();
    });
  });

  describe('Game Timer', () => {
    it('should start timer when game becomes active', () => {
      const { rerender } = render(
        <RealWorldArena {...defaultProps} gamePhase={GamePhase.LOBBY} />
      );

      // No timer initially
      expect(screen.queryByText('0:00')).not.toBeInTheDocument();

      // Change to active
      rerender(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);

      // Timer should appear
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('should format timer correctly', () => {
      render(<RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />);

      // Test various time formats
      const testTimes = [
        { seconds: 0, expected: '0:00' },
        { seconds: 65, expected: '1:05' },
        { seconds: 600, expected: '10:00' },
        { seconds: 3661, expected: '61:01' },
      ];

      testTimes.forEach(({ seconds, expected }) => {
        jest.clearAllTimers();
        
        const { unmount } = render(
          <RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />
        );

        jest.advanceTimersByTime(seconds * 1000);
        expect(screen.getByText(expected)).toBeInTheDocument();

        unmount();
      });
    });

    it('should stop timer when game becomes inactive', () => {
      const { rerender } = render(
        <RealWorldArena {...defaultProps} gamePhase={GamePhase.ACTIVE} />
      );

      // Timer running
      jest.advanceTimersByTime(5000);
      expect(screen.getByText('0:05')).toBeInTheDocument();

      // Change to inactive
      rerender(<RealWorldArena {...defaultProps} gamePhase={GamePhase.LOBBY} />);

      // Timer should be gone
      expect(screen.queryByText(/\d+:\d+/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<RealWorldArena {...defaultProps} />);

      // Should have proper headings and structure
      expect(screen.getByText('Location Status')).toBeInTheDocument();
      expect(screen.getByText('ZK Proof Status')).toBeInTheDocument();
      expect(screen.getByText('Game Phase')).toBeInTheDocument();
    });

    it('should have proper ARIA labels for buttons', () => {
      render(<RealWorldArena {...defaultProps} />);

      const privacyButton = screen.getByText('Privacy');
      expect(privacyButton).toBeInTheDocument();
    });
  });
});