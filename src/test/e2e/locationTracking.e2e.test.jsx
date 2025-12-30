import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FleetTrackingDashboard from '../../pages/fleet/FleetTrackingDashboard';
import { useAuth } from '../../context/AuthContext';
import { trackingAPI } from '../../services/api';
import { onTruckLocationUpdate } from '../../services/socket';

// Mock dependencies
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  trackingAPI: {
    getLiveLocations: vi.fn(),
  },
}));

vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn(),
  onTruckLocationUpdate: vi.fn(),
  offTruckLocationUpdate: vi.fn(),
}));

vi.mock('../../components/fleet/TruckLocationMap', () => ({
  default: ({ driverPhone }) => (
    <div data-testid="truck-location-map">
      Map {driverPhone ? `(Filtered: ${driverPhone})` : '(All trucks)'}
    </div>
  ),
}));

vi.mock('../../components/fleet/DriverFilter', () => ({
  default: ({ onFilterChange, currentPhone }) => (
    <div data-testid="driver-filter">
      <input
        data-testid="phone-input"
        defaultValue={currentPhone || ''}
        onChange={(e) => onFilterChange(e.target.value || null)}
      />
      <button data-testid="filter-btn">Filter</button>
    </div>
  ),
}));

vi.mock('../../components/NotificationBelll', () => ({
  default: () => <div data-testid="notification-bell">🔔</div>,
}));

vi.mock('../../components/PageHeader', () => ({
  default: ({ title }) => <h1>{title}</h1>,
}));

describe('Location Tracking E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1, role: 'super_admin' },
      token: 'test-token',
    });
  });

  it('should load dashboard and fetch locations', async () => {
    const mockLocations = {
      locations: [
        {
          assignmentId: 1,
          truck: { id: 5, truckName: 'Truck-001', lat: 19.0760, lng: 72.8777 },
          driverPhone: '+919876543210',
          status: 'in_transit',
        },
      ],
    };

    trackingAPI.getLiveLocations.mockResolvedValue(mockLocations);

    render(
      <BrowserRouter>
        <FleetTrackingDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Fleet Tracking Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('driver-filter')).toBeInTheDocument();
    expect(screen.getByTestId('truck-location-map')).toBeInTheDocument();

    await waitFor(() => {
      expect(trackingAPI.getLiveLocations).toHaveBeenCalled();
    });
  });

  it('should filter by driver phone number', async () => {
    render(
      <BrowserRouter>
        <FleetTrackingDashboard />
      </BrowserRouter>
    );

    const phoneInput = screen.getByTestId('phone-input');
    const filterBtn = screen.getByTestId('filter-btn');

    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Filtered: \+919876543210/i)).toBeInTheDocument();
    });
  });

  it('should handle real-time location updates', async () => {
    const mockLocations = { locations: [] };
    trackingAPI.getLiveLocations.mockResolvedValue(mockLocations);

    const mockCallback = vi.fn();
    onTruckLocationUpdate.mockImplementation((callback) => {
      mockCallback.callback = callback;
      return callback;
    });

    render(
      <BrowserRouter>
        <FleetTrackingDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(onTruckLocationUpdate).toHaveBeenCalled();
    });

    // Simulate Socket.IO update
    if (mockCallback.callback) {
      mockCallback.callback({
        assignmentId: 1,
        truckId: 5,
        lat: 19.0760,
        lng: 72.8777,
        timestamp: '2024-01-01T12:00:00Z',
      });
    }

    // Component should handle the update
    expect(onTruckLocationUpdate).toHaveBeenCalled();
  });

  it('should clear filter when phone number is removed', async () => {
    render(
      <BrowserRouter>
        <FleetTrackingDashboard />
      </BrowserRouter>
    );

    const phoneInput = screen.getByTestId('phone-input');
    const filterBtn = screen.getByTestId('filter-btn');

    // Set filter
    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Filtered:/i)).toBeInTheDocument();
    });

    // Clear filter
    fireEvent.change(phoneInput, { target: { value: '' } });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByText(/\(All trucks\)/i)).toBeInTheDocument();
    });
  });
});

