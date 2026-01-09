import React, { useState, useEffect, useRef, useMemo } from 'react';
import { trackingAPI, warehouseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, LayersControl, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-toastify';
import { Chip, TextField, MenuItem, Grid, FormControlLabel, Switch, Typography, Box, Avatar, InputBase, Paper, Divider, IconButton, Tooltip, Button } from '@mui/material';
import { onTruckLocationUpdate, offTruckLocationUpdate, trackTruck, untrackTruck } from '../../services/socket';
import { getCachedRoute } from '../../services/routing';
import { FaMapMarkerAlt, FaTruck, FaWarehouse, FaRoad, FaClock, FaSearch, FaPhone, FaInfoCircle, FaTimes, FaCrosshairs } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';

// Add CSS for premium glass-morphism and animations
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

  .glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  }

  .dark-glass {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }

  .sidebar-container {
    position: absolute;
    top: 20px;
    left: 20px;
    bottom: 20px;
    width: 320px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .hud-container {
    position: absolute;
    top: 20px;
    right: 80px;
    display: flex;
    gap: 12px;
    z-index: 1000;
  }

  .hud-card {
    padding: 12px 20px;
    border-radius: 12px;
    text-align: center;
    min-width: 100px;
  }

  .truck-list-item {
    transition: all 0.2s ease;
    cursor: pointer;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .truck-list-item:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateX(4px);
  }

  .follow-badge {
    position: absolute;
    bottom: 20px;
    left: 360px;
    z-index: 1000;
    background: #FF4081;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(255, 64, 129, 0.4);
    cursor: pointer;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [followingTruckId, setFollowingTruckId] = useState(null);

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

          // If this is the truck we are following, update map center
          if (followingTruckId === data.truckId && mapRef.current) {
            mapRef.current.panTo([data.lat, data.lng]);
          }

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
  }, [followingTruckId]); // Re-subscribe when followingTruckId changes to capture it in closure or use a ref

  const historyFetchedRef = useRef(new Set());

  // Separate effect to join/leave truck tracking rooms when locations change
  useEffect(() => {
    const currentTruckIds = new Set(
      locations.map(loc => loc.truck?.id).filter(Boolean)
    );

    // Join rooms for new trucks
    currentTruckIds.forEach(truckId => {
      if (!trackedTrucksRef.current.has(truckId)) {
        trackTruck(truckId);
        trackedTrucksRef.current.add(truckId);
      }
    });

    // Leave rooms for trucks no longer in the list
    trackedTrucksRef.current.forEach(truckId => {
      if (!currentTruckIds.has(truckId)) {
        untrackTruck(truckId);
        trackedTrucksRef.current.delete(truckId);
      }
    });
  }, [locations]);

  const fetchLiveLocations = async () => {
    try {
      setLoading(true);
      const params = isDealerUser && dealerId ? { dealerId } : {};
      const response = await trackingAPI.getLiveLocations(params);

      let locationsList = [];
      if (Array.isArray(response)) {
        locationsList = response;
      } else if (response.locations && Array.isArray(response.locations)) {
        locationsList = response.locations;
      } else if (response.data && Array.isArray(response.data)) {
        locationsList = response.data;
      }

      locationsList = locationsList.map(loc => {
        const truck = loc.truck || {};
        const lat = truck.lat;
        const lng = truck.lng;
        const normalizedLat = lat != null ? Number(lat) : null;
        const normalizedLng = lng != null ? Number(lng) : null;

        const dealer = loc.dealer ||
          loc.order?.dealer ||
          loc.assignment?.order?.dealer ||
          loc.order?.dealerDetails ||
          loc.assignment?.order?.dealerDetails ||
          null;

        let normalizedDealer = null;
        if (dealer) {
          const dealerLat = dealer.lat;
          const dealerLng = dealer.lng;
          if (dealerLat != null && dealerLng != null && !isNaN(Number(dealerLat)) && !isNaN(Number(dealerLng))) {
            normalizedDealer = { ...dealer, lat: Number(dealerLat), lng: Number(dealerLng) };
          }
        }

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

      locationsList = locationsList.filter(loc => {
        const truck = loc.truck || {};
        return truck.lat != null && truck.lng != null && !isNaN(Number(truck.lat)) && !isNaN(Number(truck.lng));
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
      const warehousesList = Array.isArray(response) ? response : response?.warehouses || response?.data || [];
      const validWarehouses = warehousesList.filter(w => w.lat && w.lng && !isNaN(Number(w.lat)) && !isNaN(Number(w.lng)));
      setWarehouses(validWarehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const status = loc.status || loc.assignment?.status;
      const truckName = loc.truck?.truckName || '';
      const orderNumber = loc.orderNumber || loc.orderId || '';
      const driverName = loc.driverName || '';

      const matchesStatus = !filterStatus || status === filterStatus;
      const matchesSearch = !searchQuery ||
        truckName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driverName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [locations, filterStatus, searchQuery]);

  // Handle truck marker click - show live route from current position
  const handleTruckClick = async (location, options = {}) => {
    const { flyTo = false, follow = false } = options;
    const truck = location.truck || {};
    const assignmentId = location.assignmentId || location.id;

    if (flyTo && mapRef.current && truck.lat && truck.lng) {
      mapRef.current.flyTo([truck.lat, truck.lng], 14, { duration: 1.5 });
    }

    if (follow) {
      setFollowingTruckId(prev => prev === truck.id ? null : truck.id);
    }

    if (selectedTruck?.assignmentId === assignmentId && !follow && !flyTo) {
      setSelectedTruck(null);
      setLiveRoute(null);
      if (followingTruckId === truck.id) setFollowingTruckId(null);
      return;
    }

    setSelectedTruck({ ...location, assignmentId });
    
    // Fetch route logic...
    try {
      const routeSegments = [];
      const status = location.status || location.assignment?.status;
      const warehouse = location.warehouse || {};
      const dealer = location.dealer || {};

      if (status === 'assigned' && truck.lat && truck.lng && warehouse.lat && warehouse.lng) {
        const leg1 = await getCachedRoute(Number(truck.lat), Number(truck.lng), Number(warehouse.lat), Number(warehouse.lng));
        if (leg1) routeSegments.push(...leg1);
      }

      const startLat = (status === 'assigned' && warehouse.lat) ? Number(warehouse.lat) : Number(truck.lat);
      const startLng = (status === 'assigned' && warehouse.lng) ? Number(warehouse.lng) : Number(truck.lng);
      if (dealer.lat && dealer.lng) {
        const leg2 = await getCachedRoute(startLat, startLng, Number(dealer.lat), Number(dealer.lng));
        if (leg2) {
          if (routeSegments.length > 0) routeSegments.push(...leg2.slice(1));
          else routeSegments.push(...leg2);
        }
      }
      setLiveRoute(routeSegments.length > 0 ? routeSegments : null);
    } catch (error) {
       console.error(error);
    }
  };

  // Calculate metrics for trucks (Distance & ETA)
  const getTruckMetrics = (location) => {
    const truck = location.truck || {};
    const dealer = location.dealer || {};
    const status = location.status || location.assignment?.status;
    if (!truck.lat || !truck.lng || !dealer.lat || !dealer.lng) return null;
    if (status === 'delivered') return { distance: 0, eta: 'Arrived' };
    const rawDist = getDistanceKm(truck.lat, truck.lng, dealer.lat, dealer.lng);
    const roadDist = rawDist * 1.2;
    const currentSpeed = truck.speed > 5 ? truck.speed : 40;
    const timeHours = roadDist / currentSpeed;
    return { distance: roadDist.toFixed(1), eta: formatDuration(timeHours) };
  };

  const hudStats = useMemo(() => {
    const stats = { inTransit: 0, stopped: 0, arrivingSoon: 0, delayed: 0 };
    filteredLocations.forEach(loc => {
      const status = loc.status || loc.assignment?.status;
      const speed = loc.truck?.speed || 0;
      const metrics = getTruckMetrics(loc);
      if (status === 'delivered') return;
      if (status === 'in_transit' || status === 'picked_up') stats.inTransit++;
      if (speed <= 5) {
        stats.stopped++;
        if (status === 'in_transit' || status === 'picked_up') stats.delayed++;
      }
      if (metrics?.eta?.includes('mins')) {
        const mins = parseInt(metrics.eta);
        if (mins <= 30) stats.arrivingSoon++;
      }
    });
    return stats;
  }, [filteredLocations]);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      const trucksToFetch = filteredLocations.map(loc => loc.truck?.id).filter(id => id && !historyFetchedRef.current.has(id));
      if (trucksToFetch.length === 0) return;
      trucksToFetch.forEach(id => historyFetchedRef.current.add(id));
      await Promise.all(trucksToFetch.map(async (truckId) => {
        try {
          const response = await trackingAPI.getTruckHistory(truckId, { limit: 50 });
          const history = Array.isArray(response) ? response : (response.data || []);
          if (history.length > 0) {
            setTruckPaths(prev => ({
              ...prev,
              [truckId]: history.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).map(h => [Number(h.lat), Number(h.lng)])
            }));
          }
        } catch (e) {}
      }));
    };
    fetchHistory();
  }, [filteredLocations]);

  const bounds = useMemo(() => {
    const allPoints = [];
    filteredLocations.forEach(loc => {
      if (loc.truck?.lat && loc.truck?.lng) allPoints.push([loc.truck.lat, loc.truck.lng]);
    });
    if (allPoints.length === 0) return [[19.0760, 72.8777], [19.0860, 72.8877]];
    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
  }, [filteredLocations]);

  const center = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];

  const getStatusColor = (status) => {
    const colors = { assigned: 'warning', picked_up: 'info', in_transit: 'primary', delivered: 'success' };
    return colors[status] || 'default';
  };

  if (loading) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <PageHeader title="Live tracking" icon={<FaMapMarkerAlt />} />
      <Card sx={{ p: 4 }}>Loading Dashboard...</Card>
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <Box className="hud-container">
        <Paper className="hud-card dark-glass">
          <Typography variant="caption" sx={{ opacity: 0.8 }}>IN TRANSIT</Typography>
          <Typography variant="h6" fontWeight="bold">{hudStats.inTransit}</Typography>
        </Paper>
        <Paper className="hud-card dark-glass" sx={{ bgcolor: 'rgba(239, 68, 68, 0.4) !important' }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>DELAYED</Typography>
          <Typography variant="h6" fontWeight="bold">{hudStats.delayed}</Typography>
        </Paper>
        <Paper className="hud-card dark-glass" sx={{ bgcolor: 'rgba(234, 179, 8, 0.4) !important' }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>ARRIVING SOON</Typography>
          <Typography variant="h6" fontWeight="bold">{hudStats.arrivingSoon}</Typography>
        </Paper>
        <Paper className="hud-card dark-glass">
          <Typography variant="caption" sx={{ opacity: 0.8 }}>STOPPED</Typography>
          <Typography variant="h6" fontWeight="bold">{hudStats.stopped}</Typography>
        </Paper>
      </Box>

      <Box className="sidebar-container glass-panel">
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary">Fleet Track</Typography>
          <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 2, border: '1px solid #eee' }} elevation={0}>
            <IconButton sx={{ p: '8px' }}><FaSearch size={16} /></IconButton>
            <InputBase sx={{ ml: 1, flex: 1, fontSize: '14px' }} placeholder="Search Fleet..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && <IconButton sx={{ p: '8px' }} onClick={() => setSearchQuery('')}><FaTimes size={14} /></IconButton>}
          </Paper>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
            {['', 'in_transit', 'assigned'].map(s => (
              <Chip key={s} label={s || 'All'} size="small" onClick={() => setFilterStatus(s)} color={filterStatus === s ? 'primary' : 'default'} />
            ))}
          </Box>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
          {filteredLocations.map((location, idx) => {
            const truck = location.truck || {};
            const metrics = getTruckMetrics(location);
            const isFollowing = followingTruckId === truck.id;
            return (
              <Box key={location.assignmentId || idx} className="truck-list-item" sx={{ p: 2, bgcolor: isFollowing ? 'rgba(33, 150, 243, 0.08)' : 'white', border: '1px solid #f0f0f0' }} onClick={() => handleTruckClick(location, { flyTo: true })}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" fontWeight="bold">{truck.truckName}</Typography>
                  <Chip label={location.status?.replace('_', ' ')} size="small" color={getStatusColor(location.status)} sx={{ height: 18, fontSize: 10 }} />
                </Box>
                {metrics && <Typography variant="caption" color="text.secondary">{metrics.distance} km | {metrics.eta}</Typography>}
                <Box display="flex" justifyContent="space-between" mt={1}>
                   <Typography variant="caption" color="text.secondary">Driver: {location.driverName}</Typography>
                   <IconButton size="small" onClick={e => { e.stopPropagation(); handleTruckClick(location, { flyTo: true, follow: true }); }} color={isFollowing ? 'secondary' : 'default'}><FaCrosshairs size={14} /></IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {followingTruckId && (
        <Box className="follow-badge" onClick={() => setFollowingTruckId(null)}>
          <FaCrosshairs /> Following Truck #{followingTruckId.slice(-4)}
        </Box>
      )}

      <Box sx={{ flex: 1 }}>
        <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
          <FitBoundsOnce bounds={bounds} />
          <MapRefSetter mapRef={mapRef} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {filteredLocations.map((location, index) => {
            const truck = location.truck || {};
            const isSelected = selectedTruck?.assignmentId === (location.assignmentId || location.id);
            const metrics = getTruckMetrics(location);
            if (!truck.lat || !truck.lng) return null;

            return (
              <DynamicMarker key={location.assignmentId || index} position={[Number(truck.lat), Number(truck.lng)]} icon={createTruckIcon(location.status, isSelected)}>
                <Popup minWidth={280}>
                  <Box sx={{ p: 1 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{location.driverName?.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{truck.truckName}</Typography>
                        <Chip label={location.status} size="small" color={getStatusColor(location.status)} />
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={6}><Typography variant="caption">Order</Typography><Typography variant="body2" fontWeight="bold">{location.orderNumber}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="caption">Driver</Typography><Typography variant="body2" fontWeight="bold">{location.driverName}</Typography></Grid>
                      {metrics && <Grid item xs={12}><Typography variant="body2" color="primary">ETA: {metrics.eta} ({metrics.distance} km)</Typography></Grid>}
                    </Grid>
                    <Box display="flex" gap={1}>
                       <Button fullWidth variant="contained" component="a" href={`tel:${location.driverPhone}`} startIcon={<FaPhone size={14} />}>Call</Button>
                       <Button fullWidth variant="outlined" startIcon={<FaInfoCircle size={14} />}>Details</Button>
                    </Box>
                    <Box mt={1}>
                       <Button fullWidth color="secondary" onClick={() => handleTruckClick(location)}>{isSelected ? 'Hide Route' : 'Show Route'}</Button>
                    </Box>
                  </Box>
                </Popup>
              </DynamicMarker>
            );
          })}
          
          {liveRoute && <Polyline positions={liveRoute} pathOptions={{ color: '#FF4081', weight: 6, className: 'live-route-animation' }} />}
          {Object.entries(truckPaths).map(([id, path]) => <Polyline key={id} positions={path} color="#333" weight={2} opacity={0.3} dashArray="5, 10" />)}
        </MapContainer>
      </Box>
    </Box>
  );
};

export default LiveTracking;
