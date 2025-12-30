import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TruckLocationMap from '../../../components/fleet/TruckLocationMap';
import { useLiveLocations } from '../../../hooks/useLiveLocations';

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
}));

// Mock useLiveLocations hook
vi.mock('../../../hooks/useLiveLocations', () => ({
  useLiveLocations: vi.fn(),
}));

describe('TruckLocationMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    useLiveLocations.mockReturnValue({
      locations: [],
      loading: true,
      error: null,
    });

    render(<TruckLocationMap />);

    expect(screen.getByText(/loading locations/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    useLiveLocations.mockReturnValue({
      locations: [],
      loading: false,
      error: 'Failed to load locations',
    });

    render(<TruckLocationMap />);

    expect(screen.getByText(/error: failed to load locations/i)).toBeInTheDocument();
  });

  it('should render map with truck markers', async () => {
    const mockLocations = [
      {
        assignmentId: 1,
        truck: {
          id: 5,
          truckName: 'Truck-001',
          licenseNumber: 'MH-01-AB-1234',
          lat: 19.0760,
          lng: 72.8777,
        },
        driverName: 'John Doe',
        driverPhone: '+919876543210',
        orderNumber: 'ORD-001',
        status: 'in_transit',
      },
    ];

    useLiveLocations.mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    });

    // Mock Leaflet L.latLngBounds
    global.L = {
      latLngBounds: vi.fn(() => ({
        getCenter: () => ({ lat: 19.0760, lng: 72.8777 }),
      })),
    };

    render(<TruckLocationMap />);

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  it('should filter locations by driver phone', () => {
    const mockLocations = [
      {
        assignmentId: 1,
        driverPhone: '+919876543210',
        truck: { lat: 19.0760, lng: 72.8777 },
      },
      {
        assignmentId: 2,
        driverPhone: '+919876543211',
        truck: { lat: 19.0761, lng: 72.8778 },
      },
    ];

    useLiveLocations.mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    });

    global.L = {
      latLngBounds: vi.fn(() => ({
        getCenter: () => ({ lat: 19.0760, lng: 72.8777 }),
      })),
    };

    render(<TruckLocationMap driverPhone="+919876543210" />);

    expect(useLiveLocations).toHaveBeenCalledWith('+919876543210');
  });

  it('should render warehouse markers', async () => {
    const mockLocations = [
      {
        assignmentId: 1,
        warehouse: {
          id: 1,
          name: 'Mumbai Warehouse',
          lat: 19.0759,
          lng: 72.8776,
        },
        truck: { lat: 19.0760, lng: 72.8777 },
      },
    ];

    useLiveLocations.mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    });

    global.L = {
      latLngBounds: vi.fn(() => ({
        getCenter: () => ({ lat: 19.0760, lng: 72.8777 }),
      })),
    };

    render(<TruckLocationMap />);

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  it('should show sidebar with active trucks', async () => {
    const mockLocations = [
      {
        assignmentId: 1,
        truck: { truckName: 'Truck-001', lat: 19.0760, lng: 72.8777 },
        driverName: 'John Doe',
        driverPhone: '+919876543210',
        orderNumber: 'ORD-001',
        status: 'in_transit',
      },
    ];

    useLiveLocations.mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    });

    global.L = {
      latLngBounds: vi.fn(() => ({
        getCenter: () => ({ lat: 19.0760, lng: 72.8777 }),
      })),
    };

    render(<TruckLocationMap />);

    await waitFor(() => {
      expect(screen.getByText(/active trucks/i)).toBeInTheDocument();
      expect(screen.getByText('Truck-001')).toBeInTheDocument();
    });
  });

  it('should show empty state when no trucks', async () => {
    useLiveLocations.mockReturnValue({
      locations: [],
      loading: false,
      error: null,
    });

    render(<TruckLocationMap />);

    await waitFor(() => {
      expect(screen.getByText(/no active trucks/i)).toBeInTheDocument();
    });
  });
});

