import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { trackingAPI } from '../../services/api';
import { trackOrder, untrackOrder, onOrderTrackingUpdate, offOrderTrackingUpdate, onTruckLocationUpdate, offTruckLocationUpdate } from '../../services/socket';
import Card from '../../components/Card';
import { FaTruck, FaWarehouse, FaMapMarkerAlt } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';

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
    delivered: '#28a745',
    cancelled: '#dc3545'
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

const LiveTrackingMap = ({ orderId, assignmentId, initialTrackingData, initialOrder }) => {
  const [trackingData, setTrackingData] = useState(initialTrackingData || null);
  // Get initial truck location from tracking data or order assignment
  const initialTruckLoc = initialTrackingData?.currentLocation || 
                          initialOrder?.truckAssignment?.currentLocation ||
                          (initialOrder?.truckAssignment?.lat && initialOrder?.truckAssignment?.lng ? {
                            lat: initialOrder.truckAssignment.lat,
                            lng: initialOrder.truckAssignment.lng,
                            lastUpdate: new Date().toISOString()
                          } : null);
  const [truckLocation, setTruckLocation] = useState(initialTruckLoc);
  const [loading, setLoading] = useState(!initialTrackingData && !initialOrder?.truckAssignment);
  const mapRef = useRef(null);

  // Update truck location when tracking data changes
  useEffect(() => {
    if (initialTrackingData?.currentLocation) {
      setTruckLocation(initialTrackingData.currentLocation);
    }
  }, [initialTrackingData?.currentLocation]);

  useEffect(() => {
    if (initialTrackingData) {
      setTrackingData(initialTrackingData);
      if (initialTrackingData.currentLocation) {
        setTruckLocation(initialTrackingData.currentLocation);
      }
      setLoading(false);
    } else if (initialOrder?.truckAssignment) {
      // If we have order data with assignment, use it
      setLoading(false);
    }
  }, [initialTrackingData, initialOrder]);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial tracking data if not provided
    if (!initialTrackingData) {
      fetchTrackingData();
    }

    // Setup Socket.IO listeners
    const handleOrderUpdate = (data) => {
      if (data.orderId === orderId) {
        setTruckLocation(data.currentLocation);
        updateMapCenter(data.currentLocation);
      }
    };

    const handleTruckUpdate = (data) => {
      if (data.orderId === orderId) {
        setTruckLocation({
          lat: data.lat,
          lng: data.lng,
          lastUpdate: data.timestamp
        });
        updateMapCenter({ lat: data.lat, lng: data.lng });
      }
    };

    // Join tracking room
    trackOrder(orderId);

    // Listen to events
    onOrderTrackingUpdate(handleOrderUpdate);
    onTruckLocationUpdate(handleTruckUpdate);

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      if (!initialTrackingData) {
        fetchTrackingData();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      untrackOrder(orderId);
      offOrderTrackingUpdate();
      offTruckLocationUpdate();
    };
  }, [orderId, initialTrackingData]);

  const fetchTrackingData = async () => {
    try {
      const response = await trackingAPI.getOrderTracking(orderId);
      setTrackingData(response);
      if (response.currentLocation) {
        setTruckLocation(response.currentLocation);
        updateMapCenter(response.currentLocation);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setLoading(false);
    }
  };

  const updateMapCenter = (location) => {
    if (mapRef.current && location) {
      mapRef.current.setView([location.lat, location.lng], 13);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading tracking data...</div>
      </Card>
    );
  }

  // Use initialOrder if provided, otherwise use trackingData.order
  const orderData = initialOrder || trackingData?.order;
  const assignment = trackingData?.assignment || initialOrder?.truckAssignment;
  // Check if we have assignment data - be more lenient
  const hasAssignment = trackingData?.hasAssignment !== false && !!assignment;

  if (!hasAssignment || !assignment) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No truck assigned to this order yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tracking will be available once a truck is assigned and location data is received.
          </Typography>
        </div>
      </Card>
    );
  }

  const { locationHistory } = trackingData || {};
  const warehouse = assignment?.warehouse;
  const dealer = orderData?.dealer;
  const startLocation = assignment?.startLocation || trackingData?.startLocation;
  const status = assignment?.status || trackingData?.status || '';

  // Build route path: Start → Warehouse → Dealer
  // Dealer only shows after pickup status
  const routePath = [];
  const boundsPoints = [];
  
  // Start point: Start Location (if exists)
  if (startLocation && startLocation.lat && startLocation.lng) {
    routePath.push([startLocation.lat, startLocation.lng]);
    boundsPoints.push([startLocation.lat, startLocation.lng]);
  }
  
  // Warehouse (pickup point)
  if (warehouse && warehouse.lat && warehouse.lng) {
    routePath.push([warehouse.lat, warehouse.lng]);
    boundsPoints.push([warehouse.lat, warehouse.lng]);
  }
  
  // Historical route points (truck movement after pickup)
  if (locationHistory && locationHistory.length > 0 && 
      (status === 'picked_up' || status === 'in_transit' || status === 'delivered')) {
    // Add historical points
    [...locationHistory].reverse().forEach(point => {
      if (point.lat && point.lng) {
        routePath.push([point.lat, point.lng]);
        boundsPoints.push([point.lat, point.lng]);
      }
    });
  }
  
  // Current truck location
  if (truckLocation && truckLocation.lat && truckLocation.lng) {
    routePath.push([truckLocation.lat, truckLocation.lng]);
    boundsPoints.push([truckLocation.lat, truckLocation.lng]);
  }
  
  // End point: Dealer location (always show if coordinates available)
  if (dealer && dealer.lat && dealer.lng) {
    routePath.push([dealer.lat, dealer.lng]);
    boundsPoints.push([dealer.lat, dealer.lng]);
  }

  // Determine map center and bounds
  let center = [19.0760, 72.8777]; // Default to Mumbai
  let bounds = null;
  
  if (boundsPoints.length > 0) {
    try {
      bounds = L.latLngBounds(boundsPoints);
      const centerLatLng = bounds.getCenter();
      // Safely get center coordinates
      if (centerLatLng && typeof centerLatLng.lat === 'number' && typeof centerLatLng.lng === 'number') {
        center = [centerLatLng.lat, centerLatLng.lng];
      } else if (centerLatLng && Array.isArray(centerLatLng)) {
        center = centerLatLng;
      } else if (typeof centerLatLng?.toArray === 'function') {
        center = centerLatLng.toArray();
      } else {
        // Fallback: calculate center manually
        const lats = boundsPoints.map(p => p[0]);
        const lngs = boundsPoints.map(p => p[1]);
        center = [
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lngs) + Math.max(...lngs)) / 2
        ];
      }
    } catch (error) {
      console.error('Error calculating bounds center:', error);
      // Fallback: calculate center manually
      const lats = boundsPoints.map(p => p[0]);
      const lngs = boundsPoints.map(p => p[1]);
      center = [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2
      ];
    }
  } else {
    // Fallback to individual locations
    center = truckLocation && truckLocation.lat && truckLocation.lng
      ? [truckLocation.lat, truckLocation.lng]
      : warehouse && warehouse.lat && warehouse.lng
      ? [warehouse.lat, warehouse.lng]
      : dealer && dealer.lat && dealer.lng
      ? [dealer.lat, dealer.lng]
      : [19.0760, 72.8777];
  }

  return (
    <Card>
      <div style={{ height: '600px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={bounds ? undefined : 10}
          bounds={bounds || undefined}
          boundsOptions={bounds ? { padding: [50, 50] } : undefined}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Warehouse Marker */}
          {warehouse && warehouse.lat && warehouse.lng && (
            <Marker position={[warehouse.lat, warehouse.lng]}>
              <Popup>
                <div>
                  <strong><FaWarehouse /> Warehouse: {warehouse.name || 'Warehouse'}</strong>
                  {warehouse.address && (
                    <>
                      <br />
                      {warehouse.address}
                    </>
                  )}
                  {(warehouse.city || warehouse.state) && (
                    <>
                      <br />
                      {warehouse.city}{warehouse.city && warehouse.state ? ', ' : ''}{warehouse.state}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Truck Current Location */}
          {truckLocation && truckLocation.lat && truckLocation.lng && assignment?.truck && (
            <Marker
              position={[truckLocation.lat, truckLocation.lng]}
              icon={createTruckIcon(assignment.status)}
            >
              <Popup>
                <div>
                  <strong><FaTruck /> Truck: {assignment.truck.truckName || 'Truck'}</strong>
                  {assignment.truck.licenseNumber && (
                    <>
                      <br />
                      License: {assignment.truck.licenseNumber}
                    </>
                  )}
                  {assignment.driverName && (
                    <>
                      <br />
                      Driver: {assignment.driverName}
                    </>
                  )}
                  {assignment.driverPhone && (
                    <>
                      <br />
                      Phone: {assignment.driverPhone}
                    </>
                  )}
                  {assignment.status && (
                    <>
                      <br />
                      Status: <strong>{assignment.status.replace('_', ' ')}</strong>
                    </>
                  )}
                  {truckLocation.lastUpdate && (
                    <>
                      <br />
                      Last Update: {new Date(truckLocation.lastUpdate).toLocaleString()}
                    </>
                  )}
                  {truckLocation.speed && (
                    <>
                      <br />
                      Speed: {truckLocation.speed} km/h
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Dealer/Destination Marker - Always show if coordinates available */}
          {dealer && dealer.lat && dealer.lng && (
            <Marker position={[dealer.lat, dealer.lng]}>
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
                  {status && (
                    <>
                      <br />
                      Status: <strong>{status.replace('_', ' ')}</strong>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Path: Start → Warehouse → Dealer */}
          {/* Show planned route (warehouse to dealer) even before pickup */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath}
              color={status === 'assigned' ? '#ffc107' : 'blue'}
              weight={4}
              opacity={status === 'assigned' ? 0.5 : 0.7}
              dashArray={status === 'assigned' ? '20, 10' : '10, 5'}
            />
          )}
        </MapContainer>
      </div>
    </Card>
  );
};

export default LiveTrackingMap;

