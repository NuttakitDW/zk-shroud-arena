/**
 * Zone Proximity Indicator Component
 * Displays visual feedback for nearby zones and geofencing status
 */

import React, { useEffect, useState } from 'react';
import { ZoneProximityInfo } from '../../services/geofenceMonitor';
import { H3Zone } from '../../services/h3Service';
import { H3GeofenceEvent } from '../../services/geofenceMonitor';

interface ZoneProximityIndicatorProps {
  currentZone: H3Zone | null;
  nearbyZones: H3Zone[];
  proximityAlerts: ZoneProximityInfo[];
  lastGeofenceEvent: H3GeofenceEvent | null;
  isTracking: boolean;
  showDebugInfo?: boolean;
}

const ZoneProximityIndicator: React.FC<ZoneProximityIndicatorProps> = ({
  currentZone,
  nearbyZones,
  proximityAlerts,
  lastGeofenceEvent,
  isTracking,
  showDebugInfo = false
}) => {
  const [recentEvent, setRecentEvent] = useState<H3GeofenceEvent | null>(null);
  const [eventAnimation, setEventAnimation] = useState(false);

  // Handle zone entry/exit animations
  useEffect(() => {
    if (lastGeofenceEvent) {
      setRecentEvent(lastGeofenceEvent);
      setEventAnimation(true);
      
      // Clear animation after 3 seconds
      const timer = setTimeout(() => {
        setEventAnimation(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [lastGeofenceEvent]);

  // Get proximity status color
  const getProximityColor = (distance: number): string => {
    if (distance < 10) return 'text-red-500';
    if (distance < 25) return 'text-orange-500';
    if (distance < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get direction arrow
  const getDirectionArrow = (direction: string): string => {
    const arrows: Record<string, string> = {
      'north': '↑',
      'northeast': '↗',
      'east': '→',
      'southeast': '↘',
      'south': '↓',
      'southwest': '↙',
      'west': '←',
      'northwest': '↖'
    };
    return arrows[direction] || '•';
  };

  if (!isTracking) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-400 text-center">Location tracking inactive</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Zone Status */}
      <div className={`bg-gray-800 border rounded-lg p-4 transition-all duration-300 ${
        currentZone ? 'border-green-500 shadow-green-500/20 shadow-lg' : 'border-gray-700'
      }`}>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Zone</h3>
        {currentZone ? (
          <div>
            <p className="text-green-400 font-mono text-xs">{currentZone.index}</p>
            <p className="text-green-300 text-sm mt-1">You are inside a game zone</p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Not in any active zone</p>
        )}
      </div>

      {/* Zone Entry/Exit Event */}
      {eventAnimation && recentEvent && (
        <div className={`transform transition-all duration-500 ${
          eventAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          <div className={`rounded-lg p-4 ${
            recentEvent.type === 'enter' 
              ? 'bg-green-900/50 border border-green-500' 
              : 'bg-red-900/50 border border-red-500'
          }`}>
            <p className={`text-center font-semibold ${
              recentEvent.type === 'enter' ? 'text-green-300' : 'text-red-300'
            }`}>
              {recentEvent.type === 'enter' ? 'Entered Zone!' : 'Exited Zone'}
            </p>
            <p className="text-center text-xs text-gray-400 mt-1 font-mono">
              {recentEvent.zone.index.substring(0, 8)}...
            </p>
          </div>
        </div>
      )}

      {/* Proximity Alerts */}
      {proximityAlerts.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Nearby Zones</h3>
          <div className="space-y-2">
            {proximityAlerts.slice(0, 3).map((alert, index) => (
              <div 
                key={alert.zone.index}
                className="flex items-center justify-between bg-gray-900/50 rounded p-2"
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl ${getProximityColor(alert.distance)}`}>
                    {getDirectionArrow(alert.direction)}
                  </span>
                  <div>
                    <p className="text-xs font-mono text-gray-400">
                      {alert.zone.index.substring(0, 8)}...
                    </p>
                    {alert.isAdjacent && (
                      <p className="text-xs text-blue-400">Adjacent</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getProximityColor(alert.distance)}`}>
                    {Math.round(alert.distance)}m
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">Debug Info</h4>
          <div className="space-y-1 text-xs font-mono text-gray-500">
            <p>Nearby Zones: {nearbyZones.length}</p>
            <p>Proximity Alerts: {proximityAlerts.length}</p>
            <p>Last Event: {recentEvent?.type || 'None'}</p>
            {currentZone && (
              <p>Resolution: {currentZone.resolution}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneProximityIndicator;