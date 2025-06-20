/**
 * Component Tests for LocationPrivacyControls
 * Tests for privacy settings management and UI interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationPrivacyControls, PrivacySettings } from '../../components/Location/LocationPrivacyControls';

const defaultSettings: PrivacySettings = {
  accuracyLevel: 'medium',
  shareFrequency: 'periodic',
  proofInterval: 30,
  movementThreshold: 10,
  enableObfuscation: true,
  showToOthers: false,
  anonymousMode: true,
};

describe('LocationPrivacyControls', () => {
  const mockOnSettingsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default collapsed state', () => {
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('Location Privacy')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('Anonymous mode') && element?.textContent?.includes('medium') && element?.textContent?.includes('accuracy') || false;
      })).toBeInTheDocument();
      
      // Should not show expanded controls initially
      expect(screen.queryByText('Privacy Level')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should show correct status indicators', () => {
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            anonymousMode: false,
            accuracyLevel: 'high',
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText((content, element) => {
        return element?.textContent?.includes('Identified mode') && element?.textContent?.includes('high') && element?.textContent?.includes('accuracy') || false;
      })).toBeInTheDocument();
    });

    it('should show correct privacy indicator color', () => {
      const { container } = render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            showToOthers: true,
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const indicator = container.querySelector('.w-2.h-2.rounded-full');
      expect(indicator).toHaveClass('bg-yellow-400');
    });
  });

  describe('Expansion/Collapse', () => {
    it('should expand when header is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      
      expect(screen.getByText('Privacy Level')).toBeInTheDocument();
      expect(screen.getByText('Update Frequency')).toBeInTheDocument();
    });

    it('should collapse when header is clicked again', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Expand
      await user.click(screen.getByText('Location Privacy'));
      expect(screen.getByText('Privacy Level')).toBeInTheDocument();

      // Collapse
      await user.click(screen.getByText('Location Privacy'));
      expect(screen.queryByText('Privacy Level')).not.toBeInTheDocument();
    });
  });

  describe('Accuracy Level Settings', () => {
    it('should render accuracy level options', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText('High Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Balanced')).toBeInTheDocument();
      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('should highlight selected accuracy level', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{ ...defaultSettings, accuracyLevel: 'high' }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      const highAccuracyButton = screen.getByText('High Accuracy').closest('button');
      expect(highAccuracyButton).toHaveClass('border-cyan-500', 'bg-cyan-500/10');
    });

    it('should call onSettingsChange when accuracy level is changed', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByText('High Accuracy'));

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        accuracyLevel: 'high',
      });
    });

    it('should show accuracy descriptions', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText(/Approximate location.*Balanced accuracy and privacy/)).toBeInTheDocument();
    });
  });

  describe('Share Frequency Settings', () => {
    it('should render frequency options', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText('Real-time')).toBeInTheDocument();
      expect(screen.getByText('Periodic')).toBeInTheDocument();
      expect(screen.getByText('Manual only')).toBeInTheDocument();
    });

    it('should select correct frequency option', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{ ...defaultSettings, shareFrequency: 'realtime' }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      const realtimeRadio = screen.getByDisplayValue('realtime');
      expect(realtimeRadio).toBeChecked();
    });

    it('should call onSettingsChange when frequency is changed', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByDisplayValue('realtime'));

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        shareFrequency: 'realtime',
      });
    });

    it('should disable manual option when game is active', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
          isGameActive={true}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      const manualRadio = screen.getByDisplayValue('manual');
      expect(manualRadio).toBeDisabled();
      expect(screen.getByText('Manual only').closest('label')).toHaveClass('opacity-50');
    });

    it('should show frequency descriptions', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText(/Regular intervals.*Good balance/)).toBeInTheDocument();
    });
  });

  describe('Privacy Toggles', () => {
    it('should render privacy toggle switches', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText('Anonymous Mode')).toBeInTheDocument();
      expect(screen.getByText('Location Obfuscation')).toBeInTheDocument();
    });

    it('should show correct toggle states', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            anonymousMode: true,
            enableObfuscation: false,
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      // Anonymous mode should be ON (cyan background)
      const anonymousToggle = screen.getByText('Anonymous Mode').closest('div')?.querySelector('button');
      expect(anonymousToggle).toHaveClass('bg-cyan-500');

      // Obfuscation should be OFF (gray background)
      const obfuscationToggle = screen.getByText('Location Obfuscation').closest('div')?.querySelector('button');
      expect(obfuscationToggle).toHaveClass('bg-gray-600');
    });

    it('should toggle anonymous mode', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      const anonymousToggle = screen.getByText('Anonymous Mode').closest('div')?.querySelector('button');
      
      if (anonymousToggle) {
        await user.click(anonymousToggle);
      }

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        anonymousMode: false,
      });
    });

    it('should toggle location obfuscation', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      const obfuscationToggle = screen.getByText('Location Obfuscation').closest('div')?.querySelector('button');
      
      if (obfuscationToggle) {
        await user.click(obfuscationToggle);
      }

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        enableObfuscation: false,
      });
    });
  });

  describe('Advanced Settings', () => {
    it('should show advanced settings when expanded', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByText('Advanced Settings'));

      expect(screen.getByText('Proof Generation Interval')).toBeInTheDocument();
      expect(screen.getByText('Movement Threshold')).toBeInTheDocument();
    });

    it('should update proof interval via slider', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByText('Advanced Settings'));

      const proofSlider = screen.getByDisplayValue('30');
      fireEvent.change(proofSlider, { target: { value: '60' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        proofInterval: 60,
      });
    });

    it('should update movement threshold via slider', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByText('Advanced Settings'));

      const thresholdSlider = screen.getByDisplayValue('10');
      fireEvent.change(thresholdSlider, { target: { value: '25' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        movementThreshold: 25,
      });
    });

    it('should display current slider values', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            proofInterval: 45,
            movementThreshold: 15,
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByText('Advanced Settings'));

      expect(screen.getByText('45s')).toBeInTheDocument();
      expect(screen.getByText('15m')).toBeInTheDocument();
    });
  });

  describe('Privacy Summary', () => {
    it('should render privacy summary', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText('Privacy Summary')).toBeInTheDocument();
      expect(screen.getByText(/Your exact location is never shared/)).toBeInTheDocument();
      expect(screen.getByText(/Anonymous gameplay mode active/)).toBeInTheDocument();
      expect(screen.getByText(/Location accuracy: ±50m/)).toBeInTheDocument();
    });

    it('should show correct accuracy in summary', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            accuracyLevel: 'high',
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText(/Location accuracy: ±5m/)).toBeInTheDocument();
    });

    it('should show identified mode in summary', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            anonymousMode: false,
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText(/Identified gameplay mode active/)).toBeInTheDocument();
    });

    it('should show obfuscation status in summary', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            enableObfuscation: true,
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      expect(screen.getByText(/Additional coordinate obfuscation enabled/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3); // 3 frequency options

      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(0); // Sliders hidden initially

      await user.click(screen.getByText('Advanced Settings'));
      const advancedSliders = screen.getAllByRole('slider');
      expect(advancedSliders).toHaveLength(2); // 2 sliders in advanced
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Should be able to activate with Enter
      const header = screen.getByText('Location Privacy').closest('div');
      if (header) {
        await user.tab();
        await user.keyboard('{Enter}');
        expect(screen.getByText('Privacy Level')).toBeInTheDocument();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined settings gracefully', () => {
      render(
        <LocationPrivacyControls
          settings={undefined as unknown as PrivacySettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Location Privacy')).toBeInTheDocument();
    });

    it('should handle missing onSettingsChange gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={defaultSettings}
          onSettingsChange={undefined as unknown as (settings: PrivacySettings) => void}
        />
      );

      await user.click(screen.getByText('Location Privacy'));

      // Should not crash when trying to change settings
      const highAccuracyButton = screen.getByText('High Accuracy');
      await user.click(highAccuracyButton);
    });

    it('should handle extreme slider values', async () => {
      const user = userEvent.setup();
      
      render(
        <LocationPrivacyControls
          settings={{
            ...defaultSettings,
            proofInterval: 300, // Max value
            movementThreshold: 100, // Max value
          }}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      await user.click(screen.getByText('Location Privacy'));
      await user.click(screen.getByText('Advanced Settings'));

      expect(screen.getByText('300s')).toBeInTheDocument();
      expect(screen.getByText('100m')).toBeInTheDocument();
    });
  });
});