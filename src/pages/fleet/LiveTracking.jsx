import React, { useState, useEffect, useRef, useMemo } from 'react';
import { trackingAPI, warehouseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaTruck, FaWarehouse } from 'react-icons/fa';
import { Chip, TextField, MenuItem, Grid, FormControlLabel, Switch } from '@mui/material';
import { onTruckLocationUpdate, offTruckLocationUpdate, trackTruck, untrackTruck } from '../../services/socket';
import { getCachedRoute } from '../../services/routing';
import 'leaflet/dist/leaflet.css';

// Custom marker component that updates position dynamically
const DynamicMarker = ({ position, icon, children, ...props }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon} {...props}>
      {children}
    </Marker>
  );
};

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const createTruckIcon = (status) => {
  const colors = {
    assigned: '#ffc107',
    picked_up: '#17a2b8',
    in_transit: '#007bff',
    delivered: '#28a745'
  };

  return L.divIcon({
    className: 'truck-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: ${colors[status] || '#6c757d'};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">🚚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Custom warehouse icon
const createWarehouseIcon = () => {
  return L.divIcon({
    className: 'warehouse-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: #6c757d;
      border-radius: 4px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">🏭</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Custom dealer icon
const createDealerIcon = () => {
  return L.divIcon({
    className: 'dealer-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: #28a745;
      border-radius: 4px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">🏪</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Component to fit bounds only on initial load
const FitBoundsOnce = ({ bounds }) => {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    if (!hasSetBounds.current && bounds && bounds.length === 2) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        hasSetBounds.current = true;
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [map, bounds]);

  return null;
};

const LiveTracking = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showDealers, setShowDealers] = useState(true);
  const [routes, setRoutes] = useState({}); // Store routes by assignmentId
  const routeLoadingRef = useRef({}); // Track loading state per route (using ref to avoid dependency issues)
  const [lastTruckPositions, setLastTruckPositions] = useState({}); // Track last known truck positions
  const trackedTrucksRef = useRef(new Set()); // Track which trucks are being monitored

  // New state for storing truck paths (breadcrumbs)
  const [truckPaths, setTruckPaths] = useState({});

  // Check if user is dealer admin/staff - filter to their orders only
  const isDealerUser = user?.role === 'dealer_admin' || user?.role === 'dealer_staff';
  const dealerId = user?.dealerId || user?.dealer?.id;

  useEffect(() => {
    fetchLiveLocations();
    fetchWarehouses();

    // Setup Socket.IO listener for real-time updates
    const handleLocationUpdate = (data) => {
      console.log('Socket.IO location update received:', data);
      setLocations(prev => {
        const index = prev.findIndex(loc => loc.truck?.id === data.truckId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            truck: {
              ...updated[index].truck,
              lat: data.lat,
              lng: data.lng,
              speed: data.speed,
              heading: data.heading,
              lastUpdate: data.timestamp
            }
          };
          console.log('Updated truck position:', {
            truckId: data.truckId,
            oldLat: prev[index].truck?.lat,
            newLat: data.lat,
            oldLng: prev[index].truck?.lng,
            newLng: data.lng
          });
          return updated;
        } else {
          console.log('Truck not found in locations list:', data.truckId);
        }
        return prev;
      });

      // Update truck paths (breadcrumbs)
      setTruckPaths(prev => {
        const truckId = data.truckId;
        const currentPath = prev[truckId] || [];
        const lastPoint = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

        // Only add point if it moved significantly to avoid clutter
        // Lowered threshold to catchment finer movements
        const shouldAdd = !lastPoint ||
          Math.abs(data.lat - lastPoint[0]) > 0.00001 ||
          Math.abs(data.lng - lastPoint[1]) > 0.00001;

        if (shouldAdd) {
          return {
            ...prev,
            [truckId]: [...currentPath, [data.lat, data.lng]]
          };
        }
        return prev;
      });
    };

    onTruckLocationUpdate(handleLocationUpdate);

    return () => {
      offTruckLocationUpdate();
      // Untrack all trucks on unmount
      trackedTrucksRef.current.forEach(truckId => {
        untrackTruck(truckId);
      });
      trackedTrucksRef.current.clear();
    };
  }, []);

  const historyFetchedRef = useRef(new Set());

  // Fetch history for trucks when they load
  useEffect(() => {
    const fetchHistory = async () => {
      const trucksToFetch = filteredLocations
        .map(loc => loc.truck?.id)
        .filter(id => id && !historyFetchedRef.current.has(id));

      if (trucksToFetch.length === 0) return;

      // Mark as fetching to prevent duplicate calls
      trucksToFetch.forEach(id => historyFetchedRef.current.add(id));

      const updates = {};
      await Promise.all(trucksToFetch.map(async (truckId) => {
        try {
          // Fetch last 50 points
          const response = await trackingAPI.getTruckHistory(truckId, { limit: 50 });
          const history = Array.isArray(response) ? response : (response.data || []);

          // Extract valid coordinates
          const points = history
            .map(h => [Number(h.lat), Number(h.lng)])
            .filter(p => !isNaN(p[0]) && !isNaN(p[1]));

          // If the points seem to be newest first (based on timestamps if available, or just assumption)
          // Let's reverse them so the path draws chronologically
          if (history.length > 1) {
            const first = new Date(history[0].timestamp || 0);
            const last = new Date(history[history.length - 1].timestamp || 0);
            if (first > last) {
              points.reverse();
            }
          }

          if (points.length > 0) {
            updates[truckId] = points;
          }
        } catch (error) {
          console.error(`Error fetching history for truck ${truckId}:`, error);
        }
      }));

      if (Object.keys(updates).length > 0) {
        setTruckPaths(prev => {
          const next = { ...prev };
          Object.entries(updates).forEach(([id, points]) => {
            if (!next[id] || next[id].length === 0) {
              next[id] = points;
            } else {
              next[id] = [...points, ...next[id]];
            }
          });
          return next;
        });
      }
    };

    fetchHistory();
  }, [filteredLocations]);

  // Separate effect to join/leave truck tracking rooms when locations change
  useEffect(() => {
    const currentTruckIds = new Set(
      locations.map(loc => loc.truck?.id).filter(Boolean)
    );

    // Join rooms for new trucks
    currentTruckIds.forEach(truckId => {
      if (!trackedTrucksRef.current.has(truckId)) {
        console.log('Joining truck tracking room:', truckId);
        trackTruck(truckId);
        trackedTrucksRef.current.add(truckId);
      }
    });

    // Leave rooms for trucks no longer in the list
    trackedTrucksRef.current.forEach(truckId => {
      if (!currentTruckIds.has(truckId)) {
        console.log('Leaving truck tracking room:', truckId);
        untrackTruck(truckId);
        trackedTrucksRef.current.delete(truckId);
      }
    });
  }, [locations]);

  const fetchLiveLocations = async () => {
    try {
      setLoading(true);
      // For dealer users, filter by dealerId
      const params = isDealerUser && dealerId ? { dealerId } : {};
      const response = await trackingAPI.getLiveLocations(params);
      console.log('API Response:', response);

      // Handle different response structures
      let locationsList = [];
      if (Array.isArray(response)) {
        locationsList = response;
        console.log('Response is array, locations:', locationsList.length);
      } else if (response.locations && Array.isArray(response.locations)) {
        locationsList = response.locations;
        console.log('Response.locations found, locations:', locationsList.length);
      } else if (response.data && Array.isArray(response.data)) {
        locationsList = response.data;
        console.log('Response.data found, locations:', locationsList.length);
      } else {
        console.warn('Unexpected response structure:', response);
      }

      console.log('Raw locations from API:', locationsList.length, locationsList);

      // Debug: Log dealer information
      locationsList.forEach((loc, idx) => {
        const dealer = loc.dealer || loc.order?.dealer || loc.assignment?.order?.dealer;
        if (dealer) {
          console.log(`Location ${idx} dealer info:`, {
            hasDealer: !!dealer,
            dealerLat: dealer.lat,
            dealerLng: dealer.lng,
            dealerName: dealer.businessName || dealer.name,
            status: loc.status || loc.assignment?.status
          });
        }
      });

      // Additional client-side filtering for dealer users (in case API doesn't filter)
      // Since we pass dealerId param to API, backend should already filter
      // Only do client-side filtering if dealerId is present in response
      if (isDealerUser && dealerId) {
        const beforeFilter = locationsList.length;
        locationsList = locationsList.filter(loc => {
          // Check multiple possible dealer ID fields
          const locDealerId = loc.dealerId ||
            loc.order?.dealerId ||
            loc.assignment?.order?.dealerId ||
            loc.order?.dealer?.id ||
            loc.assignment?.order?.dealer?.id;

          // If dealerId is not in response, assume API already filtered correctly
          // (since we passed dealerId param) and include the location
          if (!locDealerId) {
            console.log('Location has no dealerId - assuming API filtered correctly:', loc.orderNumber || loc.orderId);
            return true;
          }

          // If dealerId exists, verify it matches
          const matches = locDealerId === dealerId || String(locDealerId) === String(dealerId);
          if (!matches) {
            console.log('Filtered out location - dealer mismatch:', {
              locDealerId,
              dealerId,
              orderId: loc.orderId,
              orderNumber: loc.orderNumber
            });
          }
          return matches;
        });
        console.log(`Dealer filter: ${beforeFilter} -> ${locationsList.length} locations`);
      }

      // Ensure truck locations have valid coordinates and extract dealer data
      // The API returns: { locations: [{ truck: { lat, lng, ... }, ... }] }
      locationsList = locationsList.map(loc => {
        // The truck object already has lat/lng from the API
        const truck = loc.truck || {};
        const lat = truck.lat;
        const lng = truck.lng;

        // Normalize coordinates to numbers
        const normalizedLat = lat != null ? Number(lat) : null;
        const normalizedLng = lng != null ? Number(lng) : null;

        // Extract dealer information from multiple possible locations
        const dealer = loc.dealer ||
          loc.order?.dealer ||
          loc.assignment?.order?.dealer ||
          loc.order?.dealerDetails ||
          loc.assignment?.order?.dealerDetails ||
          null;

        // Normalize dealer coordinates if dealer exists
        let normalizedDealer = null;
        if (dealer) {
          const dealerLat = dealer.lat;
          const dealerLng = dealer.lng;
          if (dealerLat != null && dealerLng != null &&
            !isNaN(Number(dealerLat)) && !isNaN(Number(dealerLng))) {
            normalizedDealer = {
              ...dealer,
              lat: Number(dealerLat),
              lng: Number(dealerLng)
            };
          }
        }

        // Return location with normalized truck coordinates and dealer
        return {
          ...loc,
          truck: {
            ...truck,
            lat: normalizedLat,
            lng: normalizedLng,
            truckName: truck.truckName || 'Unknown',
            licenseNumber: truck.licenseNumber || 'N/A',
            lastUpdate: truck.lastUpdate || new Date().toISOString()
          },
          dealer: normalizedDealer || dealer || null
        };
      });

      // Filter out locations without valid coordinates AFTER normalization
      const beforeCoordFilter = locationsList.length;
      locationsList = locationsList.filter(loc => {
        const truck = loc.truck || {};
        const lat = truck.lat;
        const lng = truck.lng;
        const hasValidCoords = lat != null &&
          lng != null &&
          !isNaN(Number(lat)) &&
          !isNaN(Number(lng));
        if (!hasValidCoords) {
          console.log('Filtered out location - invalid coordinates:', {
            location: loc,
            truck: truck,
            lat: lat,
            lng: lng,
            latType: typeof lat,
            lngType: typeof lng
          });
        }
        return hasValidCoords;
      });

      console.log(`Coordinate filter: ${beforeCoordFilter} -> ${locationsList.length} locations`);
      console.log('Final normalized locations:', locationsList.length, locationsList);
      setLocations(locationsList);
    } catch (error) {
      console.error('Error fetching live locations:', error);
      toast.error('Failed to load live truck locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      const warehousesList = Array.isArray(response)
        ? response
        : response?.warehouses || response?.data || [];

      // Filter warehouses with valid coordinates
      const validWarehouses = warehousesList.filter(
        w => w.lat && w.lng &&
          !isNaN(Number(w.lat)) && !isNaN(Number(w.lng))
      );
      setWarehouses(validWarehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      // Don't show error toast - warehouses are optional
    }
  };

  const filteredLocations = filterStatus
    ? locations.filter(loc => {
      const status = loc.status || loc.assignment?.status;
      return status === filterStatus;
    })
    : locations;

  console.log('Filtered locations for map:', filteredLocations.length, filteredLocations);

  // Helper function to check if truck has moved significantly
  const hasSignificantMovement = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return true;
    // Check if movement is more than ~0.01 degrees (roughly 1km)
    const latDiff = Math.abs(lat1 - lat2);
    const lngDiff = Math.abs(lng1 - lng2);
    return latDiff > 0.01 || lngDiff > 0.01;
  };

  // Fetch routes for all locations: Start → Warehouse → Dealer
  useEffect(() => {
    const fetchRoutes = async () => {
      const routesToFetch = filteredLocations.filter(loc => {
        const status = loc.status || loc.assignment?.status || '';
        const warehouse = loc.warehouse || {};
        const dealer = loc.dealer || {};
        const startLocation = loc.startLocation || {};
        const truck = loc.truck || {};
        const key = loc.assignmentId || loc.id;

        // Only build routes if we have warehouse and dealer (dealer shows after pickup)
        // Route should be: Start → Warehouse → Dealer
        const hasWarehouse = warehouse.lat && warehouse.lng;
        const hasDealer = dealer.lat && dealer.lng;
        const hasStart = startLocation.lat && startLocation.lng;

        // Need at least warehouse and dealer for route (dealer shows after pickup)
        if (!hasWarehouse || !hasDealer) {
          return false;
        }

        // Check if route doesn't exist or truck has moved significantly
        const lastPosition = lastTruckPositions[key];
        const hasMoved = !lastPosition || hasSignificantMovement(
          lastPosition.lat,
          lastPosition.lng,
          truck.lat || warehouse.lat,
          truck.lng || warehouse.lng
        );

        // Check if route already exists or is currently loading
        const routeExists = routes[key];
        const isLoading = routeLoadingRef.current[key];

        return hasMoved && !isLoading && !routeExists;
      });

      if (routesToFetch.length === 0) return;

      // Mark routes as loading
      routesToFetch.forEach(loc => {
        const key = loc.assignmentId || loc.id;
        routeLoadingRef.current[key] = true;
      });

      // Fetch routes in parallel - Build route: Start → Warehouse → Dealer
      const routePromises = routesToFetch.map(async (location) => {
        try {
          const warehouse = location.warehouse || {};
          const dealer = location.dealer || {};
          const startLocation = location.startLocation || {};

          // Build route segments
          const routeSegments = [];

          // Segment 1: Start → Warehouse (if start location exists)
          if (startLocation.lat && startLocation.lng && warehouse.lat && warehouse.lng) {
            const startToWarehouse = await getCachedRoute(
              startLocation.lat,
              startLocation.lng,
              warehouse.lat,
              warehouse.lng
            );
            routeSegments.push(...startToWarehouse);
          }

          // Segment 2: Warehouse → Dealer
          if (warehouse.lat && warehouse.lng && dealer.lat && dealer.lng) {
            const warehouseToDealer = await getCachedRoute(
              warehouse.lat,
              warehouse.lng,
              dealer.lat,
              dealer.lng
            );
            // If we already have start segment, skip first point of warehouseToDealer to avoid duplicate
            if (routeSegments.length > 0 && warehouseToDealer.length > 0) {
              routeSegments.push(...warehouseToDealer.slice(1));
            } else {
              routeSegments.push(...warehouseToDealer);
            }
          }

          return {
            assignmentId: location.assignmentId || location.id,
            route: routeSegments.length > 0 ? routeSegments : [
              startLocation.lat && startLocation.lng ? [startLocation.lat, startLocation.lng] : null,
              [warehouse.lat, warehouse.lng],
              [dealer.lat, dealer.lng]
            ].filter(Boolean),
            truckLat: location.truck?.lat || warehouse.lat,
            truckLng: location.truck?.lng || warehouse.lng
          };
        } catch (error) {
          console.error(`Error fetching route for assignment ${location.assignmentId || location.id}:`, error);
          // Fallback to straight line: Start → Warehouse → Dealer
          const warehouse = location.warehouse || {};
          const dealer = location.dealer || {};
          const startLocation = location.startLocation || {};
          const fallbackRoute = [];
          if (startLocation.lat && startLocation.lng) {
            fallbackRoute.push([startLocation.lat, startLocation.lng]);
          }
          if (warehouse.lat && warehouse.lng) {
            fallbackRoute.push([warehouse.lat, warehouse.lng]);
          }
          if (dealer.lat && dealer.lng) {
            fallbackRoute.push([dealer.lat, dealer.lng]);
          }
          return {
            assignmentId: location.assignmentId || location.id,
            route: fallbackRoute,
            truckLat: location.truck?.lat || warehouse.lat,
            truckLng: location.truck?.lng || warehouse.lng
          };
        }
      });

      const fetchedRoutes = await Promise.all(routePromises);

      // Update routes state
      setRoutes(prev => {
        const newRoutes = { ...prev };
        fetchedRoutes.forEach(({ assignmentId, route }) => {
          newRoutes[assignmentId] = route;
        });
        return newRoutes;
      });

      // Update last known positions
      setLastTruckPositions(prev => {
        const newPositions = { ...prev };
        fetchedRoutes.forEach(({ assignmentId, truckLat, truckLng }) => {
          newPositions[assignmentId] = { lat: truckLat, lng: truckLng };
        });
        return newPositions;
      });

      // Clear loading state
      fetchedRoutes.forEach(({ assignmentId }) => {
        delete routeLoadingRef.current[assignmentId];
      });
    };

    fetchRoutes();
  }, [filteredLocations, lastTruckPositions, routes]);

  // Calculate map bounds (memoized to prevent unnecessary recalculations)
  const bounds = useMemo(() => {
    const allPoints = [];

    // Add truck locations, warehouses, start locations, and dealers (after pickup)
    filteredLocations.forEach(loc => {
      const status = loc.status || loc.assignment?.status || '';

      // Truck location
      if (loc.truck?.lat && loc.truck?.lng) {
        allPoints.push([loc.truck.lat, loc.truck.lng]);
      }

      // Warehouse location
      if (loc.warehouse?.lat && loc.warehouse?.lng) {
        allPoints.push([Number(loc.warehouse.lat), Number(loc.warehouse.lng)]);
      }

      // Start location
      if (loc.startLocation?.lat && loc.startLocation?.lng) {
        allPoints.push([Number(loc.startLocation.lat), Number(loc.startLocation.lng)]);
      }

      // Dealer locations (always show if coordinates available)
      const dealer = loc.dealer;
      if (dealer?.lat && dealer?.lng) {
        allPoints.push([Number(dealer.lat), Number(dealer.lng)]);
      }
    });

    // Add warehouse locations if showing warehouses
    if (showWarehouses) {
      warehouses.forEach(warehouse => {
        if (warehouse.lat && warehouse.lng) {
          allPoints.push([Number(warehouse.lat), Number(warehouse.lng)]);
        }
      });
    }

    if (allPoints.length === 0) {
      return [[19.0760, 72.8777], [19.0760, 72.8777]]; // Default to Mumbai
    }

    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return [[minLat, minLng], [maxLat, maxLng]];
  }, [filteredLocations, warehouses, showWarehouses]);

  const center = useMemo(() => [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2
  ], [bounds]);

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'warning',
      picked_up: 'info',
      in_transit: 'primary',
      delivered: 'success'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Live Truck Tracking" icon={<FaMapMarkerAlt />} />
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading live locations...</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isDealerUser ? "My Orders - Live Tracking" : "Live Truck Tracking"}
        icon={<FaMapMarkerAlt />}
        subtitle={isDealerUser ? `Tracking orders for your dealer` : undefined}
      />

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Filter by Status"
            select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="picked_up">Picked Up</MenuItem>
            <MenuItem value="in_transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={showWarehouses}
                onChange={(e) => setShowWarehouses(e.target.checked)}
                color="primary"
              />
            }
            label="Show Warehouses"
          />

          <FormControlLabel
            control={
              <Switch
                checked={showDealers}
                onChange={(e) => setShowDealers(e.target.checked)}
                color="primary"
              />
            }
            label="Show Dealers"
          />

          <div>
            <strong>Total Trucks:</strong> {filteredLocations.length}
            {showWarehouses && warehouses.length > 0 && (
              <> | <strong>Warehouses:</strong> {warehouses.length}</>
            )}
            {showDealers && filteredLocations.filter(loc => loc.dealer?.lat && loc.dealer?.lng).length > 0 && (
              <> | <strong>Dealers:</strong> {filteredLocations.filter(loc => loc.dealer?.lat && loc.dealer?.lng).length}</>
            )}
          </div>
        </div>
      </Card>

      {filteredLocations.length === 0 && (!showWarehouses || warehouses.length === 0) ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            No trucks or warehouses are currently being tracked.
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(mapInstance) => {
                console.log('Map created');
              }}
            >
              <FitBoundsOnce bounds={bounds} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Warehouse Markers */}
              {showWarehouses && warehouses.map((warehouse, index) => (
                <Marker
                  key={warehouse.id || index}
                  position={[Number(warehouse.lat), Number(warehouse.lng)]}
                  icon={createWarehouseIcon()}
                >
                  <Popup>
                    <div>
                      <strong><FaWarehouse /> Warehouse: {warehouse.name}</strong>
                      <br />
                      {warehouse.address && (
                        <>
                          {warehouse.address}
                          <br />
                        </>
                      )}
                      {warehouse.city && warehouse.state && (
                        <>
                          {warehouse.city}, {warehouse.state}
                          <br />
                        </>
                      )}
                      {warehouse.region?.name && (
                        <>
                          Region: {warehouse.region.name}
                          <br />
                        </>
                      )}
                      {warehouse.area?.name && (
                        <>
                          Area: {warehouse.area.name}
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Render Truck Paths (Breadcrumbs) */}
              {Object.entries(truckPaths).map(([truckId, path]) => (
                <React.Fragment key={`path-${truckId}`}>
                  <Polyline
                    positions={path}
                    pathOptions={{ color: '#ff0000', weight: 3, opacity: 0.6, dashArray: '5, 10' }}
                  />
                  {path.map((point, idx) => (
                    <CircleMarker
                      key={`path-point-${truckId}-${idx}`}
                      center={point}
                      radius={3}
                      pathOptions={{ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.8 }}
                    />
                  ))}
                </React.Fragment>
              ))}

              {/* Truck Markers */}
              {filteredLocations.map((location, index) => {
                const truck = location.truck || {};
                const lat = truck.lat;
                const lng = truck.lng;

                // Skip if no valid coordinates (check for null/undefined and NaN)
                if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
                  console.log('Skipping location - invalid coordinates:', { location, truck, lat, lng });
                  return null;
                }

                const numLat = Number(lat);
                const numLng = Number(lng);
                const status = location.status || location.assignment?.status || 'unknown';

                console.log('Rendering truck marker:', {
                  truckName: truck.truckName,
                  lat: numLat,
                  lng: numLng,
                  status,
                  assignmentId: location.assignmentId,
                  truckId: truck.id
                });

                return (
                  <DynamicMarker
                    key={location.assignmentId || location.id || `truck-${index}`}
                    position={[numLat, numLng]}
                    icon={createTruckIcon(status)}
                  >
                    <Popup>
                      <div>
                        <strong><FaTruck /> Truck: {truck.truckName || truck.name || 'Unknown'}</strong>
                        {truck.licenseNumber && (
                          <>
                            <br />
                            License: {truck.licenseNumber}
                          </>
                        )}
                        {(location.orderNumber || location.orderId) && (
                          <>
                            <br />
                            Order: {location.orderNumber || location.orderId}
                          </>
                        )}
                        {location.driverName && (
                          <>
                            <br />
                            Driver: {location.driverName}
                          </>
                        )}
                        {status && status !== 'unknown' && (
                          <>
                            <br />
                            Status:{' '}
                            <Chip
                              label={status.replace('_', ' ')}
                              color={getStatusColor(status)}
                              size="small"
                            />
                          </>
                        )}
                        {truck.lastUpdate && (
                          <>
                            <br />
                            Last Update: {new Date(truck.lastUpdate).toLocaleString()}
                          </>
                        )}
                        {location.warehouse && (
                          <>
                            <br />
                            <strong>Warehouse:</strong> {location.warehouse.name}
                            {location.warehouse.address && (
                              <>
                                <br />
                                {location.warehouse.address}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </Popup>
                  </DynamicMarker>
                );
              })}

              {/* Dealer Markers - Always show if coordinates available and toggle is on */}
              {showDealers && filteredLocations
                .filter(loc => {
                  const dealer = loc.dealer;
                  return dealer?.lat && dealer?.lng;
                })
                .map((location, index) => {
                  const dealer = location.dealer;
                  const status = location.status || location.assignment?.status || '';
                  return (
                    <Marker
                      key={`dealer-${location.assignmentId || location.id || index}`}
                      position={[Number(dealer.lat), Number(dealer.lng)]}
                      icon={createDealerIcon()}
                    >
                      <Popup>
                        <div>
                          <strong><FaMapMarkerAlt /> Destination: {dealer.businessName || dealer.name || 'Dealer'}</strong>
                          {dealer.dealerCode && (
                            <>
                              <br />
                              Code: {dealer.dealerCode}
                            </>
                          )}
                          {dealer.address && (
                            <>
                              <br />
                              {dealer.address}
                            </>
                          )}
                          {(dealer.city || dealer.state) && (
                            <>
                              <br />
                              {dealer.city}{dealer.city && dealer.state ? ', ' : ''}{dealer.state}
                            </>
                          )}
                          {dealer.phoneNumber && (
                            <>
                              <br />
                              Phone: {dealer.phoneNumber}
                            </>
                          )}
                          {(location.orderNumber || location.orderId) && (
                            <>
                              <br />
                              Order: {location.orderNumber || location.orderId}
                            </>
                          )}
                          {status && (
                            <>
                              <br />
                              Status: <strong>{status.replace('_', ' ')}</strong>
                            </>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Route lines: Start → Warehouse → Dealer */}
              {/* Show planned route (warehouse to dealer) even before pickup */}
              {filteredLocations
                .filter(loc => {
                  const warehouse = loc.warehouse || {};
                  const dealer = loc.dealer || {};
                  const key = loc.assignmentId || loc.id;
                  // Show route if we have warehouse, dealer, and route data
                  return warehouse.lat && warehouse.lng &&
                    dealer.lat && dealer.lng &&
                    routes[key] &&
                    routes[key].length > 0;
                })
                .map(location => {
                  const key = location.assignmentId || location.id;
                  const status = location.status || location.assignment?.status || '';
                  return (
                    <Polyline
                      key={`route-${key}`}
                      positions={routes[key]}
                      color={status === 'assigned' ? '#ffc107' : '#007bff'}
                      weight={4}
                      opacity={status === 'assigned' ? 0.5 : 0.7}
                      dashArray={status === 'assigned' ? '20, 10' : '10, 5'}
                    />
                  );
                })}
            </MapContainer>
          </div>
        </Card>
      )}

      {/* Truck List */}
      <Card style={{ marginTop: '16px' }}>
        <h3>Truck List</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredLocations.map((location, index) => {
            const truck = location.truck;
            return (
              <div
                key={location.assignmentId || index}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <strong>{truck?.truckName || 'Unknown'}</strong>
                  <Chip
                    label={location.status?.replace('_', ' ')}
                    color={getStatusColor(location.status)}
                    size="small"
                  />
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div>License: {truck?.licenseNumber || 'N/A'}</div>
                  <div>Order: {location.orderNumber || location.orderId}</div>
                  <div>Driver: {location.driverName}</div>
                  {truck?.lastUpdate && (
                    <div>Last Update: {new Date(truck.lastUpdate).toLocaleString()}</div>
                  )}
                  {truck?.lat && truck?.lng && (
                    <div>
                      Location: {truck.lat.toFixed(4)}, {truck.lng.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default LiveTracking;

