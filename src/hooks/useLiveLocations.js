import { useState, useEffect, useCallback } from 'react';
import {
  onTruckLocationUpdate,
  offTruckLocationUpdate,
  onTruckTrackingStarted,
  offTruckTrackingStarted,
  onTruckWarehouseArrived,
  offTruckWarehouseArrived,
  onTruckWarehouseApproaching,
  offTruckWarehouseApproaching,
  onTruckEtaUpdated,
  offTruckEtaUpdated,
  onOrderTrackingUpdate,
  offOrderTrackingUpdate,
  onTrackingStarted,
  offTrackingStarted
} from '../services/socket';
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
  }, [fetchLocations]);

  // Listen to real-time location updates
  useEffect(() => {
    const handleLocationUpdate = (data) => {
      console.log('📍 Socket.IO location update received:', {
        truckId: data.truckId,
        lat: data.lat,
        lng: data.lng,
        assignmentId: data.assignmentId,
        timestamp: data.timestamp
      });
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
              speed: data.speed,
              heading: data.heading,
              lastUpdate: data.timestamp || new Date().toISOString()
            },
            status: data.status || updated[existingIndex].status,
            currentEta: data.eta || updated[existingIndex].currentEta,
            warehouseProximity: data.warehouseProximity || updated[existingIndex].warehouseProximity
          };
          return updated;
        } else {
          // New location - fetch full details
          fetchLocations();
          return prev;
        }
      });
    };

    // Handle tracking started event
    const handleTrackingStarted = (data) => {
      console.log('Tracking started event:', data);
      // Refresh locations to get new tracking data
      fetchLocations();
    };

    // Handle warehouse arrival
    const handleWarehouseArrived = (data) => {
      console.log('Warehouse arrived event:', data);
      setLocations(prev => {
        const index = prev.findIndex(loc => loc.assignmentId === data.assignmentId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: 'picked_up',
            warehouse: data.warehouse || updated[index].warehouse
          };
          return updated;
        }
        return prev;
      });
    };

    // Handle warehouse approaching
    const handleWarehouseApproaching = (data) => {
      console.log('Warehouse approaching event:', data);
      setLocations(prev => {
        const index = prev.findIndex(loc => loc.assignmentId === data.assignmentId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            warehouseProximity: {
              distanceMeters: data.distanceMeters,
              warehouse: data.warehouse
            }
          };
          return updated;
        }
        return prev;
      });
    };

    // Handle ETA updates
    const handleEtaUpdated = (data) => {
      console.log('ETA updated event:', data);
      setLocations(prev => {
        const index = prev.findIndex(loc => loc.assignmentId === data.assignmentId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            currentEta: data.eta,
            durationText: data.durationText,
            distanceText: data.distanceText
          };
          return updated;
        }
        return prev;
      });
    };

    // Handle order tracking updates
    const handleOrderTrackingUpdate = (data) => {
      console.log('Order tracking update event:', data);
      setLocations(prev => {
        const index = prev.findIndex(loc => loc.orderId === data.orderId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            assignment: data.assignment,
            currentLocation: data.currentLocation
          };
          return updated;
        }
        return prev;
      });
    };

    // Setup all event listeners
    onTruckLocationUpdate(handleLocationUpdate);
    onTruckTrackingStarted(handleTrackingStarted);
    onTruckWarehouseArrived(handleWarehouseArrived);
    onTruckWarehouseApproaching(handleWarehouseApproaching);
    onTruckEtaUpdated(handleEtaUpdated);
    onOrderTrackingUpdate(handleOrderTrackingUpdate);
    onTrackingStarted(handleTrackingStarted);

    return () => {
      // Cleanup all listeners
      offTruckLocationUpdate();
      offTruckTrackingStarted();
      offTruckWarehouseArrived();
      offTruckWarehouseApproaching();
      offTruckEtaUpdated();
      offOrderTrackingUpdate();
      offTrackingStarted();
    };
  }, [driverPhone, fetchLocations]);

  return { locations, loading, error, refetch: fetchLocations };
};

