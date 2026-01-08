import React, { useState, useEffect, useRef, useMemo } from 'react';
import { trackingAPI, warehouseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, LayersControl, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaTruck, FaWarehouse, FaRoad, FaClock } from 'react-icons/fa';
import { Chip, TextField, MenuItem, Grid, FormControlLabel, Switch, Typography, Box } from '@mui/material';
import { onTruckLocationUpdate, offTruckLocationUpdate, trackTruck, untrackTruck } from '../../services/socket';
import { getCachedRoute } from '../../services/routing';
import 'leaflet/dist/leaflet.css';

// Add CSS for live route animation
const style = document.createElement('style');
style.textContent = `
  @keyframes dash {
    to {
      stroke-dashoffset: -30;
    }
  }
  
  .live-route-animation {
    animation: dash 1s linear infinite;
  }
`;
document.head.appendChild(style);

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
const createTruckIcon = (status, isSelected = false) => {
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
      border: 3px solid ${isSelected ? '#FF4081' : 'white'};
      box-shadow: ${isSelected ? '0 0 20px rgba(255, 64, 129, 0.8), 0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.3)'};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
      transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
      transition: all 0.3s ease;
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

// Start Location Icon
const createStartIcon = () => {
  return L.divIcon({
    className: 'start-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: #333;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
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

// Component to capture map reference
const MapRefSetter = ({ mapRef }) => {
  const map = useMap();

  useEffect(() => {
    if (map && mapRef) {
      mapRef.current = map;
    }
  }, [map, mapRef]);

  return null;
};

// Helper: Haversine Distance (km)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Format Duration (hours/mins)
const formatDuration = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} mins`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const LiveTracking = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showDealers, setShowDealers] = useState(true);
  const [showGeofence, setShowGeofence] = useState(true);
  const [routes, setRoutes] = useState({}); // Store routes by assignmentId
  const routeLoadingRef = useRef({}); // Track loading state per route (using ref to avoid dependency issues)
  const [selectedTruck, setSelectedTruck] = useState(null); // Track clicked truck for route display
  const [liveRoute, setLiveRoute] = useState(null); // Store live route from current position
  const mapRef = useRef(null); // Reference to map instance
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
      // console.log('Socket.IO location update received:', data);
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
          return updated;
        }
        return prev;
      });

      // Update truck paths (breadcrumbs)
      setTruckPaths(prev => {
        const truckId = data.truckId;
        const currentPath = prev[truckId] || [];
        const lastPoint = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

        // Only add point if it moved significantly to avoid clutter
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

  // Separate effect to join/leave truck tracking rooms when locations change
  useEffect(() => {
    const currentTruckIds = new Set(
      locations.map(loc => loc.truck?.id).filter(Boolean)
    );

    // Join rooms for new trucks
    currentTruckIds.forEach(truckId => {
      if (!trackedTrucksRef.current.has(truckId)) {
        // console.log('Joining truck tracking room:', truckId);
        trackTruck(truckId);
        trackedTrucksRef.current.add(truckId);
      }
    });

    // Leave rooms for trucks no longer in the list
    trackedTrucksRef.current.forEach(truckId => {
      if (!currentTruckIds.has(truckId)) {
        // console.log('Leaving truck tracking room:', truckId);
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

      // Handle different response structures
      let locationsList = [];
      if (Array.isArray(response)) {
        locationsList = response;
      } else if (response.locations && Array.isArray(response.locations)) {
        locationsList = response.locations;
      } else if (response.data && Array.isArray(response.data)) {
        locationsList = response.data;
      }

      // Ensure truck locations have valid coordinates and extract dealer data
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
      locationsList = locationsList.filter(loc => {
        const truck = loc.truck || {};
        const lat = truck.lat;
        const lng = truck.lng;
        return lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
      });

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
    }
  };

  const filteredLocations = filterStatus
    ? locations.filter(loc => {
      const status = loc.status || loc.assignment?.status;
      return status === filterStatus;
    })
    : locations;

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

          // Standardize and sort points
          if (history.length > 0) {
            updates[truckId] = history
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              .map(h => [Number(h.lat), Number(h.lng)])
              .filter(p => !isNaN(p[0]) && !isNaN(p[1]));
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
              // Prepend history to existing live points (simplification)
              // Ideally we merge and sort, but prepend is usually okay on load
              next[id] = [...points, ...next[id]];
            }
          });
          return next;
        });
      }
    };

    fetchHistory();
  }, [filteredLocations]);

  // Helper function to check if truck has moved significantly
  const hasSignificantMovement = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return true;
    const latDiff = Math.abs(lat1 - lat2);
    const lngDiff = Math.abs(lng1 - lng2);
    return latDiff > 0.01 || lngDiff > 0.01;
  };

  // Fetch routes for all locations
  useEffect(() => {
    const fetchRoutes = async () => {
      const routesToFetch = filteredLocations.filter(loc => {
        const warehouse = loc.warehouse || {};
        const dealer = loc.dealer || {};
        const key = loc.assignmentId || loc.id;
        const truck = loc.truck || {};

        const hasEndpoints = warehouse.lat && warehouse.lng && dealer.lat && dealer.lng;
        if (!hasEndpoints) return false;

        const lastPosition = lastTruckPositions[key];
        const hasMoved = !lastPosition || hasSignificantMovement(
          lastPosition.lat, lastPosition.lng,
          truck.lat || warehouse.lat, truck.lng || warehouse.lng
        );

        const routeExists = routes[key];
        const isLoading = routeLoadingRef.current[key];

        return hasMoved && !isLoading && !routeExists;
      });

      if (routesToFetch.length === 0) return;

      routesToFetch.forEach(loc => {
        const key = loc.assignmentId || loc.id;
        routeLoadingRef.current[key] = true;
      });

      const routePromises = routesToFetch.map(async (location) => {
        try {
          const warehouse = location.warehouse || {};
          const dealer = location.dealer || {};
          const startLocation = location.startLocation || {};
          const routeSegments = [];

          // Segment 1: Start -> Warehouse
          if (startLocation.lat && startLocation.lng && warehouse.lat && warehouse.lng) {
            const leg1 = await getCachedRoute(
              Number(startLocation.lat), Number(startLocation.lng),
              Number(warehouse.lat), Number(warehouse.lng)
            );
            routeSegments.push(...leg1);
          }

          // Segment 2: Warehouse -> Dealer
          if (warehouse.lat && warehouse.lng && dealer.lat && dealer.lng) {
            const leg2 = await getCachedRoute(
              Number(warehouse.lat), Number(warehouse.lng),
              Number(dealer.lat), Number(dealer.lng)
            );
            if (routeSegments.length > 0 && leg2.length > 0) {
              routeSegments.push(...leg2.slice(1));
            } else {
              routeSegments.push(...leg2);
            }
          }

          return {
            assignmentId: location.assignmentId || location.id,
            route: routeSegments.length > 0 ? routeSegments : [
              startLocation.lat ? [startLocation.lat, startLocation.lng] : null,
              [warehouse.lat, warehouse.lng],
              [dealer.lat, dealer.lng]
            ].filter(Boolean)
          };
        } catch (error) {
          console.error(`Error fetching route:`, error);
          return {
            assignmentId: location.assignmentId || location.id,
            route: []
          };
        }
      });

      const fetchedRoutes = await Promise.all(routePromises);

      setRoutes(prev => {
        const newRoutes = { ...prev };
        fetchedRoutes.forEach(({ assignmentId, route }) => {
          if (route.length > 0) newRoutes[assignmentId] = route;
        });
        return newRoutes;
      });

      fetchedRoutes.forEach(({ assignmentId }) => {
        delete routeLoadingRef.current[assignmentId];
      });
    };

    fetchRoutes();
  }, [filteredLocations, lastTruckPositions, routes]);

  // Calculate map bounds
  const bounds = useMemo(() => {
    const allPoints = [];
    filteredLocations.forEach(loc => {
      if (loc.truck?.lat && loc.truck?.lng) allPoints.push([loc.truck.lat, loc.truck.lng]);
      if (loc.warehouse?.lat && loc.warehouse?.lng) allPoints.push([Number(loc.warehouse.lat), Number(loc.warehouse.lng)]);
      if (loc.dealer?.lat && loc.dealer?.lng) allPoints.push([Number(loc.dealer.lat), Number(loc.dealer.lng)]);
    });
    if (showWarehouses) {
      warehouses.forEach(w => {
        if (w.lat && w.lng) allPoints.push([Number(w.lat), Number(w.lng)]);
      });
    }

    if (allPoints.length === 0) return [[19.0760, 72.8777], [19.0760, 72.8777]]; // Default Mumbai

    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
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

  // Calculate metrics for trucks (Distance & ETA)
  const getTruckMetrics = (location) => {
    const truck = location.truck || {};
    const dealer = location.dealer || {};
    const status = location.status || location.assignment?.status;

    if (!truck.lat || !truck.lng || !dealer.lat || !dealer.lng) return null;
    if (status === 'delivered') return { distance: 0, eta: 'Arrived' };

    // Calculate distance (Haversine) - adding 20% buffer for road winding
    const rawDist = getDistanceKm(truck.lat, truck.lng, dealer.lat, dealer.lng);
    const roadDist = rawDist * 1.2;

    // Estimate speed: Use current speed or avg 40km/h
    const currentSpeed = truck.speed > 5 ? truck.speed : 40;
    const timeHours = roadDist / currentSpeed;

    return {
      distance: roadDist.toFixed(1),
      eta: formatDuration(timeHours)
    };
  };

  // Handle truck marker click - show live route from current position
  const handleTruckClick = async (location) => {
    const truck = location.truck || {};
    const warehouse = location.warehouse || {};
    const dealer = location.dealer || {};

    // If clicking the same truck, deselect it
    if (selectedTruck?.assignmentId === (location.assignmentId || location.id)) {
      setSelectedTruck(null);
      setLiveRoute(null);
      return;
    }

    setSelectedTruck({ ...location, assignmentId: location.assignmentId || location.id });

    // Build live route: Current Truck Position → Warehouse → Dealer
    try {
      const routeSegments = [];
      const status = location.status || location.assignment?.status;

      // Segment 1: Truck → Warehouse (if not yet picked up)
      if (status === 'assigned' && truck.lat && truck.lng && warehouse.lat && warehouse.lng) {
        const leg1 = await getCachedRoute(
          Number(truck.lat), Number(truck.lng),
          Number(warehouse.lat), Number(warehouse.lng)
        );
        routeSegments.push(...leg1);
      }

      // Segment 2: Warehouse → Dealer (or Truck → Dealer if already picked up)
      if (dealer.lat && dealer.lng) {
        const startLat = (status === 'assigned' && warehouse.lat) ? Number(warehouse.lat) : Number(truck.lat);
        const startLng = (status === 'assigned' && warehouse.lng) ? Number(warehouse.lng) : Number(truck.lng);

        const leg2 = await getCachedRoute(
          startLat, startLng,
          Number(dealer.lat), Number(dealer.lng)
        );

        if (routeSegments.length > 0 && leg2.length > 0) {
          routeSegments.push(...leg2.slice(1)); // Avoid duplicate point
        } else {
          routeSegments.push(...leg2);
        }
      }

      setLiveRoute(routeSegments.length > 0 ? routeSegments : null);

      // Auto-zoom to fit the route
      if (mapRef.current && routeSegments.length > 0) {
        const lats = routeSegments.map(p => p[0]);
        const lngs = routeSegments.map(p => p[1]);
        const bounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        ];
        mapRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
      }
    } catch (error) {
      console.error('Error fetching live route:', error);
      toast.error('Failed to load route');
    }
  };


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

          <FormControlLabel
            control={
              <Switch
                checked={showGeofence}
                onChange={(e) => setShowGeofence(e.target.checked)}
                color="secondary"
              />
            }
            label="Show Geofences"
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

          {selectedTruck && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#FF4081',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <FaTruck />
              <span>Showing route for: <strong>{selectedTruck.truck?.truckName || 'Truck'}</strong></span>
              <button
                onClick={() => {
                  setSelectedTruck(null);
                  setLiveRoute(null);
                }}
                style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'white',
                  color: '#FF4081',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                Clear Route
              </button>
            </div>
          )}
        </div>
      </Card>

      {filteredLocations.length === 0 && (!showWarehouses || warehouses.length === 0) ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            No trucks or warehouses are currently being tracked.
          </div>
        </Card>
      ) : (
        <Card style={{ position: 'relative', zIndex: 1 }}> {/* Ensure Card z-index doesn't block map controls if configured poorly, but Card usually okay. */}
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(mapInstance) => {
                // console.log('Map created');
              }}
            >
              <FitBoundsOnce bounds={bounds} />
              <MapRefSetter mapRef={mapRef} />

              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Street View">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite View">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
                  />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay checked={showGeofence} name="Geofences">
                  <LayerGroup>
                    {/* Warehouse Geofences (1000m) */}
                    {showWarehouses && warehouses.map((w, i) => (
                      w.lat && w.lng && (
                        <Circle
                          key={`geo-wh-${i}`}
                          center={[Number(w.lat), Number(w.lng)]}
                          radius={1000}
                          pathOptions={{ color: '#6c757d', fillColor: '#6c757d', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                        />
                      )
                    ))}
                    {/* Dealer Geofences (500m) */}
                    {showDealers && filteredLocations.map((loc, i) => {
                      const d = loc.dealer;
                      // Avoid duplicate dealers circles if possible, but map will handle overlap fine visually
                      if (d && d.lat && d.lng) {
                        return (
                          <Circle
                            key={`geo-dlr-${i}`}
                            center={[Number(d.lat), Number(d.lng)]}
                            radius={500}
                            pathOptions={{ color: '#28a745', fillColor: '#28a745', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                          />
                        );
                      }
                      return null;
                    })}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>

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
                      {warehouse.address}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Render Truck Paths (Breadcrumbs) */}
              {Object.entries(truckPaths).map(([truckId, path]) => {
                const safePath = path.filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
                if (safePath.length < 1) return null;

                return (
                  <React.Fragment key={`path-${truckId}`}>
                    <Polyline
                      positions={safePath}
                      pathOptions={{ color: '#2196F3', weight: 4, opacity: 0.8 }}
                    />
                    {safePath.map((point, idx) => (
                      <CircleMarker
                        key={`path-point-${truckId}-${idx}`}
                        center={point}
                        radius={2}
                        pathOptions={{ color: '#2196F3', fillColor: '#2196F3', fillOpacity: 1, stroke: false }}
                      />
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Route lines */}
              {filteredLocations.map(location => {
                const key = location.assignmentId || location.id;
                const status = location.status || location.assignment?.status || '';
                const route = routes[key];

                if (!route || route.length === 0) return null;

                return (
                  <Polyline
                    key={`route-${key}`}
                    positions={route}
                    color={status === 'assigned' ? '#ffc107' : '#007bff'}
                    weight={4}
                    opacity={status === 'assigned' ? 0.5 : 0.7}
                    dashArray={status === 'assigned' ? '20, 10' : '10, 5'}
                  />
                );
              })}

              {/* Live Route - Shown when truck is clicked */}
              {liveRoute && liveRoute.length > 0 && (
                <Polyline
                  positions={liveRoute}
                  pathOptions={{
                    color: '#FF4081',
                    weight: 6,
                    opacity: 0.9,
                    dashArray: '10, 5',
                    className: 'live-route-animation'
                  }}
                />
              )}


              {/* Truck Markers */}
              {filteredLocations.map((location, index) => {
                const truck = location.truck || {};
                const lat = truck.lat;
                const lng = truck.lng;
                const status = location.status || location.assignment?.status || 'unknown';
                const metrics = getTruckMetrics(location);
                const isSelected = selectedTruck?.assignmentId === (location.assignmentId || location.id);

                if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return null;

                return (
                  <DynamicMarker
                    key={location.assignmentId || location.id || `truck-${index}`}
                    position={[Number(lat), Number(lng)]}
                    icon={createTruckIcon(status, isSelected)}
                    eventHandlers={{
                      click: () => handleTruckClick(location)
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '1.1em' }}>
                            <FaTruck style={{ marginRight: '6px' }} />
                            {truck.truckName || 'Truck'}
                          </strong>
                          <Chip
                            label={status.replace('_', ' ')}
                            color={getStatusColor(status)}
                            size="small"
                            style={{ marginLeft: 'auto', float: 'right', height: '20px', fontSize: '10px' }}
                          />
                        </div>

                        <Grid container spacing={1} style={{ fontSize: '13px' }}>
                          {metrics && (
                            <>
                              <Grid item xs={6}>
                                <Box display="flex" alignItems="center" color="text.secondary">
                                  <FaRoad style={{ marginRight: '4px' }} /> Distance
                                </Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {metrics.distance} km
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Box display="flex" alignItems="center" color="text.secondary">
                                  <FaClock style={{ marginRight: '4px' }} /> ETA
                                </Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {metrics.eta}
                                </Typography>
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12} style={{ marginTop: '8px' }}>
                            <strong>Order:</strong> {location.orderNumber || location.orderId || 'N/A'}
                          </Grid>
                          <Grid item xs={12}>
                            <strong>Driver:</strong> {location.driverName || 'N/A'}
                          </Grid>
                          {location.warehouse && (
                            <Grid item xs={12}>
                              <strong>From:</strong> {location.warehouse.name}
                            </Grid>
                          )}
                          {location.dealer && (
                            <Grid item xs={12}>
                              <strong>To:</strong> {location.dealer.businessName || location.dealer.name}
                            </Grid>
                          )}
                        </Grid>
                      </div>
                    </Popup>
                  </DynamicMarker>
                );
              })}

              {/* Dealer Markers */}
              {showDealers && filteredLocations.map((location, index) => {
                const dealer = location.dealer;
                // Avoid rendering duplicates if possible, or let React handle it essentially by key
                // Using assignmentId to differentiate even if same dealer
                if (dealer?.lat && dealer?.lng) {
                  return (
                    <Marker
                      key={`dealer-${location.assignmentId || index}`}
                      position={[Number(dealer.lat), Number(dealer.lng)]}
                      icon={createDealerIcon()}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <strong>{dealer.businessName || dealer.name}</strong>
                          <br />
                          {dealer.city}, {dealer.state}
                        </div>
                      </Popup>
                    </Marker>
                  )
                }
                return null;
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
            const metrics = getTruckMetrics(location);
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
                  {metrics && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                      <span><FaRoad /> {metrics.distance} km</span>
                      <span><FaClock /> {metrics.eta}</span>
                    </div>
                  )}
                  <div>License: {truck?.licenseNumber || 'N/A'}</div>
                  <div>Driver: {location.driverName}</div>
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
