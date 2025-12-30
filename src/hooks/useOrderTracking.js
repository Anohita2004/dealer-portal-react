import { useState, useEffect } from 'react';
import { joinOrderRoom, leaveOrderRoom, onOrderTrackingUpdate, offOrderTrackingUpdate, onTrackingStarted, offTrackingStarted } from '../services/socket';
import { trackingAPI } from '../services/api';

export const useOrderTracking = (orderId) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchTracking = async () => {
      try {
        setLoading(true);
        const response = await trackingAPI.getOrderTracking(orderId);
        setTracking(response);
        setError(null);

        // Join order tracking room
        joinOrderRoom(orderId);
      } catch (err) {
        setError(err.message || 'Failed to fetch order tracking');
        console.error('Failed to fetch order tracking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();

    // Listen to real-time updates
    const handleUpdate = (data) => {
      if (data.orderId === orderId) {
        setTracking(prev => ({
          ...prev,
          assignment: {
            ...prev?.assignment,
            ...data.assignment
          },
          currentLocation: data.currentLocation || prev?.currentLocation
        }));
      }
    };

    const handleTrackingStarted = (data) => {
      if (data.orderId === orderId) {
        setTracking(prev => ({
          ...prev,
          ...data
        }));
      }
    };

    onOrderTrackingUpdate(handleUpdate);
    onTrackingStarted(handleTrackingStarted);

    return () => {
      leaveOrderRoom(orderId);
      offOrderTrackingUpdate();
      offTrackingStarted();
    };
  }, [orderId]);

  return { tracking, loading, error };
};

