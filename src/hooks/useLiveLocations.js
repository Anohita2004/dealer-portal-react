import { useState, useEffect, useCallback } from 'react';
import { onTruckLocationUpdate, offTruckLocationUpdate } from '../services/socket';
import { trackingAPI } from '../services/api';

export const useLiveLocations = (driverPhone = null) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await trackingAPI.getLiveLocations();
      let fetchedLocations = response.locations || [];

      // Filter by phone number if provided
      if (driverPhone) {
        fetchedLocations = fetchedLocations.filter(
          loc => loc.driverPhone === driverPhone
        );
      }

      setLocations(fetchedLocations);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch live locations');
      console.error('Failed to fetch live locations:', err);
    } finally {
      setLoading(false);
    }
  }, [driverPhone]);

  // Initial fetch
  useEffect(() => {
    fetchLocations();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // Listen to real-time updates
  useEffect(() => {
    const handleLocationUpdate = (data) => {
      setLocations(prev => {
        // Filter by phone number if specified
        if (driverPhone && data.driverPhone !== driverPhone) {
          return prev;
        }

        // Update or add location
        const existingIndex = prev.findIndex(
          loc => loc.assignmentId === data.assignmentId || 
                 (data.truckId && loc.truck?.id === data.truckId)
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            truck: {
              ...updated[existingIndex].truck,
              lat: data.lat,
              lng: data.lng,
              lastUpdate: data.timestamp || new Date().toISOString()
            }
          };
          return updated;
        } else {
          // New location - fetch full details
          fetchLocations();
          return prev;
        }
      });
    };

    onTruckLocationUpdate(handleLocationUpdate);

    return () => {
      offTruckLocationUpdate();
    };
  }, [driverPhone, fetchLocations]);

  return { locations, loading, error, refetch: fetchLocations };
};

