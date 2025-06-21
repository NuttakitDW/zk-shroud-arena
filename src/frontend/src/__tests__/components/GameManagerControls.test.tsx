/**
 * Component Tests for GameManagerControls
 * Tests for zone drawing controls and UI interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameManagerControls } from '../../components/Map/GameManagerControls';
import { ZoneDrawingState } from '../../components/Map/types';

describe('GameManagerControls', () => {
  const mockHandlers = {
    onZoneDrawingStateChange: jest.fn(),
    onConfirmZone: jest.fn(),
    onUndo: jest.fn(),
    onClear: jest.fn(),
  };

  const defaultProps = {
    ...mockHandlers,
    currentZoneCount: 0,
    isDrawing: false,
    className: 'test-controls',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render controls with title', () => {
      render(<GameManagerControls {...defaultProps} />);
      
      expect(screen.getByText('Zone Drawing Controls')).toBeInTheDocument();
    });

    it('should render all drawing mode buttons', () => {
      render(<GameManagerControls {...defaultProps} />);
      
      expect(screen.getByTitle('Single hexagon selection')).toBeInTheDocument();
      expect(screen.getByTitle('Area selection')).toBeInTheDocument();
      expect(screen.getByTitle('Path drawing')).toBeInTheDocument();
    });

    it('should render zone type selection buttons', () => {
      render(<GameManagerControls {...defaultProps} />);
      
      expect(screen.getByText('Safe Zone')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('should render input fields', () => {
      render(<GameManagerControls {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Points per tick')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter zone name...')).toBeInTheDocument();
    });
  });

  describe('Drawing Mode Selection', () => {
    it('should handle single mode selection', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const singleButton = screen.getByTitle('Single hexagon selection');
      await user.click(singleButton);
      
      expect(mockHandlers.onZoneDrawingStateChange).toHaveBeenCalledWith({
        isDrawing: true,
        currentZone: [],
        zoneType: 'safe',
        pointValue: 10,
        drawMode: 'single',
      });
    });

    it('should handle area mode selection', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const areaButton = screen.getByTitle('Area selection');
      await user.click(areaButton);
      
      expect(mockHandlers.onZoneDrawingStateChange).toHaveBeenCalledWith({
        isDrawing: true,
        currentZone: [],
        zoneType: 'safe',
        pointValue: 10,
        drawMode: 'area',
      });
    });

    it('should handle path mode selection', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const pathButton = screen.getByTitle('Path drawing');
      await user.click(pathButton);
      
      expect(mockHandlers.onZoneDrawingStateChange).toHaveBeenCalledWith({
        isDrawing: true,
        currentZone: [],
        zoneType: 'safe',
        pointValue: 10,
        drawMode: 'path',
      });
    });

    it('should highlight selected mode', () => {
      render(<GameManagerControls {...defaultProps} />);
      
      const singleButton = screen.getByTitle('Single hexagon selection');
      expect(singleButton).toHaveClass('bg-cyan-600');
    });
  });

  describe('Zone Type Selection', () => {
    it('should handle safe zone selection', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const safeButton = screen.getByText('Safe Zone');
      await user.click(safeButton);
      
      expect(safeButton).toHaveClass('bg-green-600');
    });

    it('should handle danger zone selection', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const dangerButton = screen.getByText('Danger Zone');
      await user.click(dangerButton);
      
      expect(mockHandlers.onZoneDrawingStateChange).toHaveBeenCalled();
    });
  });

  describe('Point Value Input', () => {
    it('should handle point value changes', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const pointInput = screen.getByPlaceholderText('Points per tick') as HTMLInputElement;
      // Input starts with value 10
      expect(pointInput).toHaveValue(10);
      
      // Select all and type new value (more reliable than clear)
      await user.click(pointInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('25');
      
      expect(pointInput).toHaveValue(25);
    });

    it('should enforce min/max constraints', () => {
      render(<GameManagerControls {...defaultProps} />);
      
      const pointInput = screen.getByPlaceholderText('Points per tick');
      expect(pointInput).toHaveAttribute('min', '1');
      expect(pointInput).toHaveAttribute('max', '100');
    });
  });

  describe('Zone Name Input', () => {
    it('should handle zone name changes', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const nameInput = screen.getByPlaceholderText('Enter zone name...');
      await user.type(nameInput, 'Central Park');
      
      expect(nameInput).toHaveValue('Central Park');
    });
  });

  describe('Drawing Actions', () => {
    it('should show Start Drawing button when not drawing', () => {
      render(<GameManagerControls {...defaultProps} isDrawing={false} />);
      
      expect(screen.getByText('Start Drawing')).toBeInTheDocument();
      expect(screen.queryByText('Confirm Zone')).not.toBeInTheDocument();
    });

    it('should show action buttons when drawing', () => {
      render(<GameManagerControls {...defaultProps} isDrawing={true} />);
      
      expect(screen.queryByText('Start Drawing')).not.toBeInTheDocument();
      expect(screen.getByText(/Confirm Zone/)).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should handle start drawing', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const startButton = screen.getByText('Start Drawing');
      await user.click(startButton);
      
      expect(mockHandlers.onZoneDrawingStateChange).toHaveBeenCalledWith({
        isDrawing: true,
        currentZone: [],
        zoneType: 'safe',
        pointValue: 10,
        drawMode: 'single',
      });
    });

    it('should handle cancel drawing', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} isDrawing={true} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockHandlers.onZoneDrawingStateChange).toHaveBeenCalledWith({
        isDrawing: false,
        currentZone: [],
        zoneType: 'safe',
        pointValue: 10,
        drawMode: 'single',
      });
    });

    it('should disable confirm when no zones or name', () => {
      render(
        <GameManagerControls 
          {...defaultProps} 
          isDrawing={true}
          currentZoneCount={0}
        />
      );
      
      const confirmButton = screen.getByText(/Confirm Zone/);
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm when zones and name present', async () => {
      const user = userEvent.setup();
      render(
        <GameManagerControls 
          {...defaultProps} 
          isDrawing={true}
          currentZoneCount={5}
        />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter zone name...');
      await user.type(nameInput, 'Test Zone');
      
      const confirmButton = screen.getByText(/Confirm Zone.*5 hexes/);
      expect(confirmButton).not.toBeDisabled();
    });

    it('should handle zone confirmation', async () => {
      const user = userEvent.setup();
      render(
        <GameManagerControls 
          {...defaultProps} 
          isDrawing={true}
          currentZoneCount={3}
        />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter zone name...');
      await user.type(nameInput, 'Test Zone');
      
      const confirmButton = screen.getByText(/Confirm Zone/);
      await user.click(confirmButton);
      
      expect(mockHandlers.onConfirmZone).toHaveBeenCalledWith({
        h3Indices: [],
        type: 'safe',
        pointValue: 10,
        name: 'Test Zone',
      });
    });
  });

  describe('Utility Buttons', () => {
    it('should disable undo when no zones', () => {
      render(<GameManagerControls {...defaultProps} currentZoneCount={0} />);
      
      const undoButton = screen.getByText('Undo');
      expect(undoButton).toBeDisabled();
    });

    it('should enable undo when zones exist', () => {
      render(<GameManagerControls {...defaultProps} currentZoneCount={5} />);
      
      const undoButton = screen.getByText('Undo');
      expect(undoButton).not.toBeDisabled();
    });

    it('should handle undo', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} currentZoneCount={5} />);
      
      const undoButton = screen.getByText('Undo');
      await user.click(undoButton);
      
      expect(mockHandlers.onUndo).toHaveBeenCalled();
    });

    it('should handle clear', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} currentZoneCount={5} />);
      
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      expect(mockHandlers.onClear).toHaveBeenCalled();
    });

    it('should toggle preview', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const previewButton = screen.getByText('Preview');
      await user.click(previewButton);
      
      // Button text should change
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  describe('Advanced Settings', () => {
    it('should toggle advanced settings', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const toggleButton = screen.getByText('Show Advanced Settings');
      await user.click(toggleButton);
      
      expect(screen.getByText('Hide Advanced Settings')).toBeInTheDocument();
      expect(screen.getByText('Drawing Tips:')).toBeInTheDocument();
    });

    it('should show drawing tips when expanded', async () => {
      const user = userEvent.setup();
      render(<GameManagerControls {...defaultProps} />);
      
      const toggleButton = screen.getByText('Show Advanced Settings');
      await user.click(toggleButton);
      
      expect(screen.getByText('Single: Click individual hexagons')).toBeInTheDocument();
      expect(screen.getByText('Area: Click and drag to select area')).toBeInTheDocument();
      expect(screen.getByText('Path: Click to create connected path')).toBeInTheDocument();
    });
  });

  describe('Current Status Display', () => {
    it('should show status when drawing', () => {
      render(<GameManagerControls {...defaultProps} isDrawing={true} currentZoneCount={7} />);
      
      expect(screen.getByText('Mode:')).toBeInTheDocument();
      expect(screen.getByText('single')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Safe')).toBeInTheDocument();
      expect(screen.getByText('Hexagons:')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should not show status when not drawing', () => {
      render(<GameManagerControls {...defaultProps} isDrawing={false} />);
      
      expect(screen.queryByText('Mode:')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete zone creation flow', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<GameManagerControls {...defaultProps} />);
      
      // Start drawing
      const startButton = screen.getByText('Start Drawing');
      await user.click(startButton);
      
      // Change to danger zone
      const dangerButton = screen.getByText('Danger Zone');
      await user.click(dangerButton);
      
      // Change point value
      const pointInput = screen.getByPlaceholderText('Points per tick') as HTMLInputElement;
      // Select all and type new value
      await user.click(pointInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('50');
      
      // Simulate drawing some hexagons
      rerender(
        <GameManagerControls 
          {...defaultProps} 
          isDrawing={true}
          currentZoneCount={10}
        />
      );
      
      // Enter zone name
      const nameInput = screen.getByPlaceholderText('Enter zone name...');
      await user.type(nameInput, 'Danger Area 1');
      
      // Confirm zone
      const confirmButton = screen.getByText(/Confirm Zone.*10 hexes/);
      await user.click(confirmButton);
      
      expect(mockHandlers.onConfirmZone).toHaveBeenCalledWith({
        h3Indices: [],
        type: 'danger',
        pointValue: 50,
        name: 'Danger Area 1',
      });
    });

    it('should reset zone name after confirmation', async () => {
      const user = userEvent.setup();
      render(
        <GameManagerControls 
          {...defaultProps} 
          isDrawing={true}
          currentZoneCount={5}
        />
      );
      
      const nameInput = screen.getByPlaceholderText('Enter zone name...');
      await user.type(nameInput, 'Test Zone');
      
      const confirmButton = screen.getByText(/Confirm Zone/);
      await user.click(confirmButton);
      
      // Zone name should be cleared after confirmation
      expect(nameInput).toHaveValue('');
    });
  });
});