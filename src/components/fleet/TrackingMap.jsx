import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useLiveLocations } from '../../hooks/useLiveLocations';
import { Box, Typography, CircularProgress, Alert, Chip } from '@mui/material';
import { getCachedRoute } from '../../services/routing';
import 'leaflet/dist/leaflet.css';

// Custom marker component that updates position smoothly
const UpdatingMarker = ({ position, icon, children }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current && position) {
      const latlng = L.latLng(position[0], position[1]);
      markerRef.current.setLatLng(latlng);
    }
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
    >
      {children}
    </Marker>
  );
};

// Fix for default marker icons
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
    delivered: '#28a745',
    cancelled: '#dc3545',
    delayed: '#ff6b6b',
    on_hold: '#95a5a6'
  };

  return L.divIcon({
    className: 'truck-marker',
    html: `<div style="
      width: 40px;
      height: 40px;
      background-color: ${colors[status] || '#6c757d'};
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    ">
      <span style="font-size: 24px;">🚚</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
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

// Custom start location icon
const createStartIcon = () => {
  return L.divIcon({
    className: 'start-marker',
    html: `<div style="
      width: 25px;
      height: 25px;
      background-color: #17a2b8;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">📍</div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12]
  });
};

/**
 * Comprehensive Tracking Map Component
 * Matches the Frontend Integration Guide example
 * Shows warehouse, dealer, start location markers and ETA information
 */
function TrackingMap({ driverPhone = null, center = [20, 77], zoom = 5 }) {
  const { locations, loading, error } = useLiveLocations(driverPhone);
  const mapRef = useRef(null);
  const [routes, setRoutes] = useState({});

  // Filter locations by phone number if provided
  const filteredLocations = driverPhone
    ? locations.filter(loc => loc.driverPhone === driverPhone)
    : locations;

  // Fetch routes: Start → Warehouse → Dealer
  useEffect(() => {
    const fetchRoutes = async () => {
      const routesToFetch = filteredLocations.filter(loc => {
        const status = loc.status || '';
        const warehouse = loc.warehouse || {};
        const dealer = loc.dealer || {};
        const startLocation = loc.startLocation || {};
        const key = loc.assignmentId || loc.id;
        
        // Only build routes if we have warehouse and dealer (dealer shows after pickup)
        const hasWarehouse = warehouse.lat && warehouse.lng;
        const hasDealer = dealer.lat && dealer.lng;
        
        // Need warehouse and dealer for route (dealer shows after pickup)
        if (!hasWarehouse || !hasDealer) {
          return false;
        }
        
        // Only fetch routes after pickup
        if (status !== 'picked_up' && status !== 'in_transit' && status !== 'delivered') {
          return false;
        }
        
        // Check if route already exists
        const routeExists = routes[key];
        return !routeExists;
      });

      if (routesToFetch.length === 0) return;

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
            ].filter(Boolean)
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
            route: fallbackRoute
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
    };

    fetchRoutes();
  }, [filteredLocations, routes]);

  // Update map bounds when locations change - include truck, warehouse, and dealer locations
  useEffect(() => {
    if (mapRef.current && filteredLocations.length > 0) {
      const map = mapRef.current;
      const allPoints = [];
      
      filteredLocations.forEach(loc => {
        if (loc.truck?.lat && loc.truck?.lng) {
          allPoints.push([loc.truck.lat, loc.truck.lng]);
        }
        if (loc.warehouse?.lat && loc.warehouse?.lng) {
          allPoints.push([loc.warehouse.lat, loc.warehouse.lng]);
        }
        if (loc.dealer?.lat && loc.dealer?.lng) {
          allPoints.push([loc.dealer.lat, loc.dealer.lng]);
        }
        if (loc.startLocation?.lat && loc.startLocation?.lng) {
          allPoints.push([loc.startLocation.lat, loc.startLocation.lng]);
        }
      });

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [filteredLocations]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading locations...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">Error: {error}</Alert>
    );
  }

  // Calculate map bounds - include dealer only after pickup
  const getMapBounds = () => {
    const allPoints = [];
    
    filteredLocations.forEach(loc => {
      const status = loc.status || '';
      
      if (loc.truck?.lat && loc.truck?.lng) {
        allPoints.push([loc.truck.lat, loc.truck.lng]);
      }
      if (loc.warehouse?.lat && loc.warehouse?.lng) {
        allPoints.push([loc.warehouse.lat, loc.warehouse.lng]);
      }
      // Dealer location (always show if coordinates available)
      if (loc.dealer?.lat && loc.dealer?.lng) {
        allPoints.push([loc.dealer.lat, loc.dealer.lng]);
      }
      if (loc.startLocation?.lat && loc.startLocation?.lng) {
        allPoints.push([loc.startLocation.lat, loc.startLocation.lng]);
      }
    });

    if (allPoints.length === 0) {
      return null;
    }

    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);
    return L.latLngBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
    );
  };

  const bounds = getMapBounds();
  const mapCenter = bounds && bounds.getCenter
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : center;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={mapInstance => {
          mapRef.current = mapInstance;
          if (bounds) {
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Warehouse markers (always shown) */}
        {filteredLocations
          .filter(loc => loc.warehouse?.lat && loc.warehouse?.lng)
          .map(loc => (
            <Marker 
              key={`warehouse-${loc.assignmentId}`}
              position={[loc.warehouse.lat, loc.warehouse.lng]}
              icon={createWarehouseIcon()}
            >
              <Popup>
                <div>
                  <strong>Warehouse</strong><br />
                  {loc.warehouse.name}
                  {loc.warehouse.address && (
                    <>
                      <br />
                      {loc.warehouse.address}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Dealer markers - Always show if coordinates available */}
        {filteredLocations
          .filter(loc => loc.dealer?.lat && loc.dealer?.lng)
          .map(loc => (
            <Marker 
              key={`dealer-${loc.assignmentId}`}
              position={[loc.dealer.lat, loc.dealer.lng]}
              icon={createDealerIcon()}
            >
              <Popup>
                <div>
                  <strong>Dealer</strong><br />
                  {loc.dealer.businessName || loc.dealer.name}
                  {loc.dealer.dealerCode && (
                    <>
                      <br />
                      Code: {loc.dealer.dealerCode}
                    </>
                  )}
                  {loc.dealer.address && (
                    <>
                      <br />
                      {loc.dealer.address}
                    </>
                  )}
                  {(loc.dealer.city || loc.dealer.state) && (
                    <>
                      <br />
                      {loc.dealer.city}{loc.dealer.city && loc.dealer.state ? ', ' : ''}{loc.dealer.state}
                    </>
                  )}
                  {loc.status && (
                    <>
                      <br />
                      Status: {loc.status.replace('_', ' ')}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Start location markers (if available) */}
        {filteredLocations
          .filter(loc => loc.startLocation?.lat && loc.startLocation?.lng)
          .map(loc => (
            <Marker 
              key={`start-${loc.assignmentId}`}
              position={[loc.startLocation.lat, loc.startLocation.lng]}
              icon={createStartIcon()}
            >
              <Popup>
                <div>
                  <strong>Start Location</strong>
                  {loc.startLocation.address && (
                    <>
                      <br />
                      {loc.startLocation.address}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Truck markers (current location) */}
        {filteredLocations
          .filter(loc => loc.truck?.lat && loc.truck?.lng)
          .map(loc => (
            <UpdatingMarker 
              key={`truck-${loc.assignmentId}-${loc.truck.lat}-${loc.truck.lng}`}
              position={[loc.truck.lat, loc.truck.lng]}
              icon={createTruckIcon(loc.status)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>
                    <strong>{loc.driverName || 'Unknown Driver'}</strong>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Phone:</strong> {loc.driverPhone || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Order:</strong> {loc.orderNumber || loc.orderId || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={loc.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                      size="small"
                      color={
                        loc.status === 'delivered' ? 'success' :
                        loc.status === 'in_transit' ? 'primary' :
                        loc.status === 'delayed' ? 'error' :
                        loc.status === 'picked_up' ? 'info' : 'default'
                      }
                    />
                  </div>
                  {loc.currentEta && (
                    <div style={{ fontSize: '12px', marginBottom: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                      <strong>ETA:</strong> {new Date(loc.currentEta).toLocaleTimeString()}
                    </div>
                  )}
                  {loc.eta && (
                    <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                      <strong>ETA:</strong> {loc.eta}
                    </div>
                  )}
                  {loc.durationText && (
                    <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                      <strong>Duration:</strong> {loc.durationText}
                    </div>
                  )}
                  {loc.distanceText && (
                    <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                      <strong>Distance:</strong> {loc.distanceText}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Route lines: Start → Warehouse → Dealer (show only after pickup) */}
        {filteredLocations
          .filter(loc => {
            const status = loc.status || '';
            const warehouse = loc.warehouse || {};
            const dealer = loc.dealer || {};
            const key = loc.assignmentId || loc.id;
            // Show route if we have warehouse, dealer, and route data
            // Show planned route (warehouse to dealer) even before pickup
            return warehouse.lat && warehouse.lng && 
                   dealer.lat && dealer.lng && 
                   routes[key] && 
                   routes[key].length > 0;
          })
          .map(location => {
            const key = location.assignmentId || location.id;
            const status = location.status || '';
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
    </Box>
  );
}

export default TrackingMap;

