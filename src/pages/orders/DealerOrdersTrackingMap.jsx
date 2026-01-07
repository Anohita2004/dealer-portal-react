import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { orderAPI, trackingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { FaTruck, FaWarehouse, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import { Button, Chip, Box, Typography, CircularProgress, Alert, Paper, List, ListItem, ListItemText } from '@mui/material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { trackOrder, untrackOrder, onOrderTrackingUpdate, offOrderTrackingUpdate, onTruckLocationUpdate, offTruckLocationUpdate } from '../../services/socket';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const createTruckIcon = (status, orderNumber) => {
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
      width: 40px;
      height: 40px;
      background-color: ${colors[status] || '#6c757d'};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
      position: relative;
    ">🚚</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Custom warehouse icon
const createWarehouseIcon = () => {
  return L.divIcon({
    className: 'warehouse-marker',
    html: `<div style="
      width: 35px;
      height: 35px;
      background-color: #6c757d;
      border-radius: 4px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
    ">🏭</div>`,
    iconSize: [35, 35],
    iconAnchor: [17, 17]
  });
};

// Custom destination icon
const createDestinationIcon = () => {
  return L.divIcon({
    className: 'destination-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: #28a745;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const DealerOrdersTrackingMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [trackingData, setTrackingData] = useState({}); // { orderId: trackingData }
  const [truckLocations, setTruckLocations] = useState({}); // { orderId: location }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrdersInTransit();
    const interval = setInterval(fetchOrdersInTransit, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user?.dealerId]);

  useEffect(() => {
    if (orders.length === 0) return;

    // Setup Socket.IO listeners for all orders
    const handleOrderUpdate = (data) => {
      setTruckLocations(prev => ({
        ...prev,
        [data.orderId]: data.currentLocation
      }));
    };

    const handleTruckUpdate = (data) => {
      setTruckLocations(prev => ({
        ...prev,
        [data.orderId]: {
          lat: data.lat,
          lng: data.lng,
          lastUpdate: data.timestamp
        }
      }));
    };

    onOrderTrackingUpdate(handleOrderUpdate);
    onTruckLocationUpdate(handleTruckUpdate);

    // Join tracking rooms for all orders
    orders.forEach(order => {
      if (order.id) {
        trackOrder(order.id);
      }
    });

    return () => {
      orders.forEach(order => {
        if (order.id) {
          untrackOrder(order.id);
        }
      });
      offOrderTrackingUpdate();
      offTruckLocationUpdate();
    };
  }, [orders]);

  const fetchOrdersInTransit = async () => {
    try {
      setLoading(true);
      setError(null);

      const dealerId = user?.dealerId || user?.dealer?.id;
      if (!dealerId) {
        setError('Dealer ID not found');
        setLoading(false);
        return;
      }

      // Fetch all orders for the dealer
      const response = await orderAPI.getAllOrders({ dealerId });
      const ordersList = response.orders || response.data || response || [];

      // Filter orders that are in transit or have assignments
      const inTransitOrders = ordersList.filter(order => {
        const orderStatus = (order.status || '').toLowerCase();
        const assignmentStatus = (order.truckAssignment?.status || order.assignment?.status || '').toLowerCase();

        return (
          orderStatus === 'shipped' ||
          assignmentStatus === 'in_transit' ||
          assignmentStatus === 'picked_up' ||
          assignmentStatus === 'assigned'
        );
      });

      setOrders(inTransitOrders);

      // Fetch tracking data for each order
      const trackingPromises = inTransitOrders.map(async (order) => {
        try {
          const trackingResponse = await trackingAPI.getOrderTracking(order.id);
          return { orderId: order.id, trackingData: trackingResponse };
        } catch (err) {
          console.log(`Tracking data not available for order ${order.id}:`, err);
          return { orderId: order.id, trackingData: null };
        }
      });

      const trackingResults = await Promise.all(trackingPromises);
      const trackingMap = {};
      const locationsMap = {};

      trackingResults.forEach(({ orderId, trackingData }) => {
        if (trackingData) {
          trackingMap[orderId] = trackingData;
          if (trackingData.currentLocation) {
            locationsMap[orderId] = trackingData.currentLocation;
          }
        }
      });

      setTrackingData(trackingMap);
      setTruckLocations(locationsMap);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders in transit:', err);
      setError(err.response?.data?.error || 'Failed to load orders in transit');
      setLoading(false);
    }
  };

  // Calculate map bounds to fit all markers
  const getMapBounds = () => {
    const allPoints = [];

    orders.forEach(order => {
      const tracking = trackingData[order.id];
      if (tracking) {
        const assignment = tracking.assignment || order.truckAssignment;
        const warehouse = assignment?.warehouse;
        const dealer = order.dealer;
        const truckLoc = truckLocations[order.id];

        if (warehouse && warehouse.lat && warehouse.lng) {
          allPoints.push([warehouse.lat, warehouse.lng]);
        }
        if (dealer && dealer.lat && dealer.lng) {
          allPoints.push([dealer.lat, dealer.lng]);
        }
        if (truckLoc) {
          allPoints.push([truckLoc.lat, truckLoc.lng]);
        }
      }
    });

    if (allPoints.length === 0) {
      return [[19.0760, 72.8777], [19.0760, 72.8777]]; // Default to Mumbai
    }

    const bounds = L.latLngBounds(allPoints);
    return bounds;
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'warning',
      picked_up: 'info',
      in_transit: 'primary',
      delivered: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Orders in Transit - Map View"
          icon={<FaTruck />}
          action={
            <Button
              variant="outlined"
              startIcon={<FaSync />}
              onClick={fetchOrdersInTransit}
              disabled={loading}
            >
              Refresh
            </Button>
          }
        />
        <Card>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading orders in transit...</Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title="Orders in Transit - Map View" icon={<FaTruck />} />
        <Card>
          <Alert severity="error">{error}</Alert>
        </Card>
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Box>
        <PageHeader
          title="Orders in Transit - Map View"
          icon={<FaTruck />}
          action={
            <Button
              variant="outlined"
              startIcon={<FaSync />}
              onClick={fetchOrdersInTransit}
            >
              Refresh
            </Button>
          }
        />
        <Card>
          <Alert severity="info">No orders in transit at the moment.</Alert>
        </Card>
      </Box>
    );
  }

  const bounds = getMapBounds();
  const center = bounds ? bounds.getCenter().toArray() : [19.0760, 72.8777];

  return (
    <Box>
      <PageHeader
        title={`Orders in Transit - Map View (${orders.length})`}
        icon={<FaTruck />}
        action={
          <Button
            variant="outlined"
            startIcon={<FaSync />}
            onClick={fetchOrdersInTransit}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 2, mt: 2 }}>
        {/* Map */}
        <Card>
          <div style={{ height: '700px', width: '100%', position: 'relative' }}>
            <MapContainer
              center={center}
              zoom={bounds ? undefined : 10}
              style={{ height: '100%', width: '100%' }}
              bounds={bounds || undefined}
              boundsOptions={bounds ? { padding: [50, 50] } : undefined}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {orders.map(order => {
                const tracking = trackingData[order.id];
                if (!tracking || !tracking.hasAssignment) return null;

                const assignment = tracking.assignment || order.truckAssignment;
                const warehouse = assignment?.warehouse;
                const dealer = order.dealer;
                const truckLoc = truckLocations[order.id] || tracking.currentLocation;
                const locationHistory = tracking.locationHistory || [];

                // Build route path
                const routePath = [];
                if (warehouse && warehouse.lat && warehouse.lng) {
                  routePath.push([warehouse.lat, warehouse.lng]);
                }
                if (locationHistory.length > 0) {
                  [...locationHistory].reverse().forEach(point => {
                    routePath.push([point.lat, point.lng]);
                  });
                }
                if (truckLoc) {
                  routePath.push([truckLoc.lat, truckLoc.lng]);
                }
                if (dealer && dealer.lat && dealer.lng) {
                  routePath.push([dealer.lat, dealer.lng]);
                }

                return (
                  <React.Fragment key={order.id}>
                    {/* Warehouse Marker */}
                    {warehouse && warehouse.lat && warehouse.lng && (
                      <Marker position={[warehouse.lat, warehouse.lng]} icon={createWarehouseIcon()}>
                        <Popup>
                          <div>
                            <strong><FaWarehouse /> Warehouse: {warehouse.name}</strong>
                            <br />
                            Order: {order.orderNumber || order.id}
                            <br />
                            {warehouse.address}
                            <br />
                            {warehouse.city}, {warehouse.state}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Truck Current Location */}
                    {truckLoc && assignment?.truck && (
                      <Marker
                        position={[truckLoc.lat, truckLoc.lng]}
                        icon={createTruckIcon(assignment.status, order.orderNumber)}
                      >
                        <Popup>
                          <div>
                            <strong><FaTruck /> Order: {order.orderNumber || order.id}</strong>
                            <br />
                            Truck: {assignment.truck.truckName} ({assignment.truck.licenseNumber})
                            <br />
                            Driver: {assignment.driverName}
                            {assignment.driverPhone && (
                              <>
                                <br />
                                Phone: {assignment.driverPhone}
                              </>
                            )}
                            <br />
                            Status: <strong>{assignment.status?.replace('_', ' ')}</strong>
                            <br />
                            Last Update: {new Date(truckLoc.lastUpdate || Date.now()).toLocaleString()}
                            {truckLoc.speed && (
                              <>
                                <br />
                                Speed: {truckLoc.speed} km/h
                              </>
                            )}
                            <br />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/orders/${order.id}/track`)}
                              sx={{ mt: 1 }}
                            >
                              View Details
                            </Button>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Dealer/Destination Marker */}
                    {dealer && dealer.lat && dealer.lng && (
                      <Marker position={[dealer.lat, dealer.lng]} icon={createDestinationIcon()}>
                        <Popup>
                          <div>
                            <strong><FaMapMarkerAlt /> Destination: {dealer.businessName}</strong>
                            <br />
                            Order: {order.orderNumber || order.id}
                            <br />
                            {dealer.address}
                            {dealer.city && (
                              <>
                                <br />
                                {dealer.city}, {dealer.state}
                              </>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Route Path */}
                    {routePath.length > 1 && (
                      <Polyline
                        key={`route-${order.id}`}
                        positions={routePath}
                        color={assignment.status === 'in_transit' ? '#007bff' : assignment.status === 'picked_up' ? '#17a2b8' : '#ffc107'}
                        weight={3}
                        opacity={0.6}
                        dashArray="10, 5"
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </Card>

        {/* Orders List Sidebar */}
        <Card title={`Orders in Transit (${orders.length})`}>
          <List>
            {orders.map(order => {
              const tracking = trackingData[order.id];
              const assignment = tracking?.assignment || order.truckAssignment;
              const truckLoc = truckLocations[order.id] || tracking?.currentLocation;

              return (
                <ListItem
                  key={order.id}
                  button
                  onClick={() => navigate(`/orders/${order.id}/track`)}
                  sx={{
                    borderBottom: '1px solid #eee',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {order.orderNumber || `Order #${order.id}`}
                        </Typography>
                        {assignment?.status && (
                          <Chip
                            label={assignment.status.replace('_', ' ')}
                            color={getStatusColor(assignment.status)}
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {assignment?.truck && (
                          <Typography variant="caption" display="block">
                            Truck: {assignment.truck.truckName}
                          </Typography>
                        )}
                        {assignment?.driverName && (
                          <Typography variant="caption" display="block">
                            Driver: {assignment.driverName}
                          </Typography>
                        )}
                        {truckLoc && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Last Update: {new Date(truckLoc.lastUpdate || Date.now()).toLocaleTimeString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Card>
      </Box>
    </Box>
  );
};

export default DealerOrdersTrackingMap;

