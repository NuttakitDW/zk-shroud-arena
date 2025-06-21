'use client';

import React, { useState, useCallback } from 'react';
import { Shield, Eye, EyeOff, Settings, MapPin, AlertTriangle } from 'lucide-react';

export interface PrivacySettings {
  accuracyLevel: 'high' | 'medium' | 'low';
  shareFrequency: 'realtime' | 'periodic' | 'manual';
  proofInterval: number; // seconds
  movementThreshold: number; // meters
  enableObfuscation: boolean;
  showToOthers: boolean;
  anonymousMode: boolean;
}

export interface LocationPrivacyControlsProps {
  settings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
  isGameActive?: boolean;
  className?: string;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  accuracyLevel: 'medium',
  shareFrequency: 'periodic',
  proofInterval: 30,
  movementThreshold: 10,
  enableObfuscation: true,
  showToOthers: false,
  anonymousMode: true,
};

export const LocationPrivacyControls: React.FC<LocationPrivacyControlsProps> = ({
  settings = DEFAULT_SETTINGS,
  onSettingsChange,
  isGameActive = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSetting = useCallback(<K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        [key]: value
      });
    }
  }, [settings, onSettingsChange]);

  const getAccuracyDescription = (level: string) => {
    switch (level) {
      case 'high':
        return 'Exact GPS coordinates (±5m) - Most accurate, least private';
      case 'medium':
        return 'Approximate location (±50m) - Balanced accuracy and privacy';
      case 'low':
        return 'General area (±200m) - Most private, least accurate';
      default:
        return '';
    }
  };

  const getFrequencyDescription = (frequency: string) => {
    switch (frequency) {
      case 'realtime':
        return 'Continuous location updates - Best gameplay, more tracking';
      case 'periodic':
        return 'Regular intervals - Good balance of gameplay and privacy';
      case 'manual':
        return 'Manual updates only - Maximum privacy, limited gameplay';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-semibold text-white">Location Privacy</h3>
            <p className="text-sm text-gray-400">
              {settings.anonymousMode ? 'Anonymous mode' : 'Identified mode'} • 
              {settings.accuracyLevel} accuracy
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            settings.showToOthers ? 'bg-yellow-400' : 'bg-green-400'
          }`} />
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Quick Privacy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Privacy Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 'high', label: 'High Accuracy', icon: MapPin, color: 'text-red-400' },
                { level: 'medium', label: 'Balanced', icon: Shield, color: 'text-yellow-400' },
                { level: 'low', label: 'Private', icon: EyeOff, color: 'text-green-400' }
              ].map(({ level, label, icon: Icon, color }) => (
                <button
                  key={level}
                  onClick={() => updateSetting('accuracyLevel', level as 'high' | 'medium' | 'low')}
                  className={`p-3 rounded-lg border transition-all ${
                    settings.accuracyLevel === level
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                      : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${
                    settings.accuracyLevel === level ? 'text-cyan-400' : color
                  }`} />
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {getAccuracyDescription(settings.accuracyLevel)}
            </p>
          </div>

          {/* Share Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Update Frequency
            </label>
            <div className="space-y-2">
              {[
                { value: 'realtime', label: 'Real-time', disabled: false },
                { value: 'periodic', label: 'Periodic', disabled: false },
                { value: 'manual', label: 'Manual only', disabled: isGameActive }
              ].map(({ value, label, disabled }) => (
                <label key={value} className={`flex items-center ${disabled ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="shareFrequency"
                    value={value}
                    checked={settings.shareFrequency === value}
                    onChange={(e) => updateSetting('shareFrequency', e.target.value as 'realtime' | 'periodic' | 'manual')}
                    disabled={disabled}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    settings.shareFrequency === value && !disabled
                      ? 'border-cyan-500 bg-cyan-500'
                      : 'border-gray-500'
                  }`}>
                    {settings.shareFrequency === value && !disabled && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-300'}`}>
                    {label}
                  </span>
                  {disabled && (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {getFrequencyDescription(settings.shareFrequency)}
            </p>
          </div>

          {/* Privacy Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EyeOff className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-300">Anonymous Mode</span>
                  <p className="text-xs text-gray-500">Hide player identity in proofs</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('anonymousMode', !settings.anonymousMode)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.anonymousMode ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.anonymousMode ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-300">Location Obfuscation</span>
                  <p className="text-xs text-gray-500">Add random noise to exact coordinates</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('enableObfuscation', !settings.enableObfuscation)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.enableObfuscation ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.enableObfuscation ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Advanced Settings
              <svg 
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 pl-6 border-l border-gray-700">
                {/* Proof Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Proof Generation Interval
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="300"
                      value={settings.proofInterval}
                      onChange={(e) => updateSetting('proofInterval', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-400 w-16">
                      {settings.proofInterval}s
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    How often to generate new ZK proofs automatically
                  </p>
                </div>

                {/* Movement Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Movement Threshold
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={settings.movementThreshold}
                      onChange={(e) => updateSetting('movementThreshold', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-400 w-16">
                      {settings.movementThreshold}m
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum distance moved before generating new proof
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Summary */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">Privacy Summary</span>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Your exact location is never shared with other players</li>
              <li>• ZK proofs verify position without revealing coordinates</li>
              <li>• {settings.anonymousMode ? 'Anonymous' : 'Identified'} gameplay mode active</li>
              <li>• Location accuracy: ±{
                settings.accuracyLevel === 'high' ? '5m' :
                settings.accuracyLevel === 'medium' ? '50m' : '200m'
              }</li>
              {settings.enableObfuscation && (
                <li>• Additional coordinate obfuscation enabled</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPrivacyControls;