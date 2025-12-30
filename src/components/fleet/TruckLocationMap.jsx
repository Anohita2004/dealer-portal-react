import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useLiveLocations } from '../../hooks/useLiveLocations';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon - Enhanced visibility
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

  const statusLabels = {
    assigned: 'ASSIGNED',
    picked_up: 'PICKED UP',
    in_transit: 'IN TRANSIT',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED',
    delayed: 'DELAYED',
    on_hold: 'ON HOLD'
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
      position: relative;
    ">
      <span style="font-size: 24px;">🚚</span>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${colors[status] || '#6c757d'};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 8px;
        font-weight: bold;
        white-space: nowrap;
        border: 1px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${statusLabels[status] || status?.toUpperCase() || ''}</div>
    </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45]
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

const TruckLocationMap = ({ driverPhone = null, center = [20.5937, 78.9629], zoom = 5 }) => {
  const { locations, loading, error } = useLiveLocations(driverPhone);
  const mapRef = useRef(null);

  // Filter locations by phone number if provided
  const filteredLocations = driverPhone
    ? locations.filter(loc => loc.driverPhone === driverPhone)
    : locations;

  // Update map bounds when locations change
  useEffect(() => {
    if (mapRef.current && filteredLocations.length > 0) {
      const map = mapRef.current;
      const validLocations = filteredLocations.filter(
        loc => loc.truck?.lat && loc.truck?.lng
      );

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(loc => [loc.truck.lat, loc.truck.lng])
        );
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

  // Calculate map bounds
  const getMapBounds = () => {
    const allPoints = [];
    
    filteredLocations.forEach(loc => {
      if (loc.truck?.lat && loc.truck?.lng) {
        allPoints.push([loc.truck.lat, loc.truck.lng]);
      }
      if (loc.warehouse?.lat && loc.warehouse?.lng) {
        allPoints.push([loc.warehouse.lat, loc.warehouse.lng]);
      }
    });

    if (allPoints.length === 0) {
      return null; // Use default center/zoom
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
    : bounds && Array.isArray(bounds) && bounds.length === 2
    ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]
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

        {/* Warehouse markers */}
        {filteredLocations.map(location => {
          if (!location.warehouse?.lat || !location.warehouse?.lng) return null;
          
          return (
            <Marker
              key={`warehouse-${location.assignmentId}`}
              position={[location.warehouse.lat, location.warehouse.lng]}
              icon={createWarehouseIcon()}
            >
              <Popup>
                <div>
                  <strong>Warehouse:</strong> {location.warehouse.name}
                  <br />
                  <strong>Order:</strong> {location.orderNumber || location.orderId}
                  {location.warehouse.address && (
                    <>
                      <br />
                      {location.warehouse.address}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Truck markers with phone number info */}
        {filteredLocations
          .filter(loc => loc.truck?.lat && loc.truck?.lng)
          .map(location => (
            <Marker
              key={`truck-${location.assignmentId}`}
              position={[location.truck.lat, location.truck.lng]}
              icon={createTruckIcon(location.status)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                    🚚 {location.truck.truckName || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>License:</strong> {location.truck.licenseNumber || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Driver:</strong> {location.driverName || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Phone:</strong> {location.driverPhone || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Order:</strong> {location.orderNumber || location.orderId || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>Status:</strong>{' '}
                    <span style={{ 
                      color: location.status === 'delivered' ? '#28a745' : 
                             location.status === 'in_transit' ? '#007bff' :
                             location.status === 'delayed' ? '#dc3545' : '#666',
                      fontWeight: 'bold'
                    }}>
                      {location.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    <strong>Location:</strong> {location.truck.lat?.toFixed(6)}, {location.truck.lng?.toFixed(6)}
                    <br />
                    <strong>Last Update:</strong>{' '}
                    {location.truck.lastUpdate
                      ? new Date(location.truck.lastUpdate).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Route line from warehouse to truck */}
        {filteredLocations
          .filter(
            loc =>
              loc.warehouse?.lat &&
              loc.warehouse?.lng &&
              loc.truck?.lat &&
              loc.truck?.lng
          )
          .map(location => (
            <Polyline
              key={`route-${location.assignmentId}`}
              positions={[
                [location.warehouse.lat, location.warehouse.lng],
                [location.truck.lat, location.truck.lng]
              ]}
              color="blue"
              dashArray="5, 10"
            />
          ))}
      </MapContainer>

      {/* Location list sidebar */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 1,
          boxShadow: 3,
          maxHeight: '400px',
          overflowY: 'auto',
          minWidth: '300px',
          zIndex: 1000
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Active Trucks {driverPhone && `(${driverPhone})`}
        </Typography>
        {filteredLocations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No active trucks
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredLocations.map(location => (
              <Box
                key={location.assignmentId}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {location.truck?.truckName || 'Unknown Truck'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Driver: {location.driverName} ({location.driverPhone || 'N/A'})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Order: {location.orderNumber || location.orderId}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                  Status: {location.status || 'N/A'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TruckLocationMap;

