import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FleetTrackingDashboard from '../../../pages/fleet/FleetTrackingDashboard';
import { useAuth } from '../../../context/AuthContext';
import { connectSocket } from '../../../services/socket';

// Mock AuthContext
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Socket.IO
vi.mock('../../../services/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

// Mock components
vi.mock('../../../components/fleet/TruckLocationMap', () => ({
  default: () => <div data-testid="truck-location-map">Truck Location Map</div>,
}));

vi.mock('../../../components/fleet/DriverFilter', () => ({
  default: () => <div data-testid="driver-filter">Driver Filter</div>,
}));

vi.mock('../../../components/NotificationBelll', () => ({
  default: () => <div data-testid="notification-bell">Notification Bell</div>,
}));

vi.mock('../../../components/PageHeader', () => ({
  default: ({ title }) => <div data-testid="page-header">{title}</div>,
}));

describe('FleetTrackingDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1, role: 'super_admin' },
      token: 'test-token',
    });
  });

  it('should render dashboard components', () => {
    render(<FleetTrackingDashboard />);

    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByTestId('driver-filter')).toBeInTheDocument();
    expect(screen.getByTestId('truck-location-map')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('should connect to Socket.IO on mount', () => {
    render(<FleetTrackingDashboard />);

    expect(connectSocket).toHaveBeenCalled();
  });

  it('should render page header with correct title', () => {
    render(<FleetTrackingDashboard />);

    expect(screen.getByText('Fleet Tracking Dashboard')).toBeInTheDocument();
  });

  it('should handle missing token gracefully', () => {
    useAuth.mockReturnValue({
      user: { id: 1, role: 'super_admin' },
      token: null,
    });

    render(<FleetTrackingDashboard />);

    // Should still render, but socket might not connect
    expect(screen.getByTestId('truck-location-map')).toBeInTheDocument();
  });
});

