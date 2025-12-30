import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { trackingAPI } from '../../services/api';
import {
  joinOrderRoom,
  leaveOrderRoom,
  onOrderTrackingUpdate,
  offOrderTrackingUpdate,
  onTrackingStarted,
  offTrackingStarted,
} from '../../services/socket';

// Mock API
vi.mock('../../services/api', () => ({
  trackingAPI: {
    getOrderTracking: vi.fn(),
  },
}));

// Mock Socket.IO
const mockSocketHandlers = {};
vi.mock('../../services/socket', () => ({
  joinOrderRoom: vi.fn(),
  leaveOrderRoom: vi.fn(),
  onOrderTrackingUpdate: vi.fn((callback) => {
    mockSocketHandlers.orderUpdate = callback;
  }),
  offOrderTrackingUpdate: vi.fn(),
  onTrackingStarted: vi.fn((callback) => {
    mockSocketHandlers.trackingStarted = callback;
  }),
  offTrackingStarted: vi.fn(),
}));

describe('useOrderTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketHandlers.orderUpdate = null;
    mockSocketHandlers.trackingStarted = null;
  });

  it('should not fetch if orderId is null', () => {
    const { result } = renderHook(() => useOrderTracking(null));

    expect(result.current.loading).toBe(false);
    expect(trackingAPI.getOrderTracking).not.toHaveBeenCalled();
  });

  it('should fetch order tracking data on mount', async () => {
    const mockTrackingData = {
      orderId: 123,
      hasAssignment: true,
      assignment: {
        id: 1,
        status: 'in_transit',
        truck: { id: 5, truckName: 'Truck-001' },
      },
      currentLocation: {
        lat: 19.0760,
        lng: 72.8777,
        timestamp: '2024-01-01T12:00:00Z',
      },
    };

    trackingAPI.getOrderTracking.mockResolvedValue(mockTrackingData);

    const { result } = renderHook(() => useOrderTracking(123));

    expect(result.current.loading).toBe(true);
    expect(trackingAPI.getOrderTracking).toHaveBeenCalledWith(123);
    expect(joinOrderRoom).toHaveBeenCalledWith(123);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tracking).toEqual(mockTrackingData);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch tracking data';
    trackingAPI.getOrderTracking.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useOrderTracking(123));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.tracking).toBeNull();
  });

  it('should listen to order tracking updates', async () => {
    const initialData = {
      orderId: 123,
      hasAssignment: true,
      assignment: { id: 1, status: 'assigned' },
    };

    trackingAPI.getOrderTracking.mockResolvedValue(initialData);

    const { result } = renderHook(() => useOrderTracking(123));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onOrderTrackingUpdate).toHaveBeenCalled();
    expect(onTrackingStarted).toHaveBeenCalled();

    // Simulate Socket.IO update
    const updateData = {
      orderId: 123,
      assignment: { id: 1, status: 'in_transit' },
      currentLocation: { lat: 19.0760, lng: 72.8777 },
    };

    if (mockSocketHandlers.orderUpdate) {
      mockSocketHandlers.orderUpdate(updateData);
    }

    await waitFor(() => {
      expect(result.current.tracking.assignment.status).toBe('in_transit');
    });
  });

  it('should only process updates for matching orderId', async () => {
    const initialData = {
      orderId: 123,
      hasAssignment: true,
      assignment: { id: 1, status: 'assigned' },
    };

    trackingAPI.getOrderTracking.mockResolvedValue(initialData);

    const { result } = renderHook(() => useOrderTracking(123));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to update with different orderId
    const updateData = {
      orderId: 456, // Different order
      assignment: { status: 'delivered' },
    };

    if (mockSocketHandlers.orderUpdate) {
      mockSocketHandlers.orderUpdate(updateData);
    }

    // Should not update
    await waitFor(() => {
      expect(result.current.tracking.assignment.status).toBe('assigned');
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useOrderTracking(123));

    unmount();

    expect(leaveOrderRoom).toHaveBeenCalledWith(123);
    expect(offOrderTrackingUpdate).toHaveBeenCalled();
    expect(offTrackingStarted).toHaveBeenCalled();
  });

  it('should refetch when orderId changes', async () => {
    const { rerender } = renderHook(
      ({ orderId }) => useOrderTracking(orderId),
      { initialProps: { orderId: 123 } }
    );

    await waitFor(() => {
      expect(trackingAPI.getOrderTracking).toHaveBeenCalledWith(123);
    });

    rerender({ orderId: 456 });

    await waitFor(() => {
      expect(trackingAPI.getOrderTracking).toHaveBeenCalledWith(456);
      expect(joinOrderRoom).toHaveBeenCalledWith(456);
    });
  });
});

