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

const LiveTrackingMap = ({ orderId, assignmentId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [truckLocation, setTruckLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial tracking data
    fetchTrackingData();

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
    const interval = setInterval(fetchTrackingData, 30000);

    return () => {
      clearInterval(interval);
      untrackOrder(orderId);
      offOrderTrackingUpdate();
      offTruckLocationUpdate();
    };
  }, [orderId]);

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

  if (!trackingData || !trackingData.hasAssignment) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          No truck assigned to this order yet.
        </div>
      </Card>
    );
  }

  const { assignment, locationHistory, order } = trackingData;
  const warehouse = assignment?.warehouse;
  const dealer = order?.dealer;

  // Build route path
  const routePath = [];
  if (warehouse) {
    routePath.push([warehouse.lat, warehouse.lng]);
  }
  if (locationHistory && locationHistory.length > 0) {
    // Add historical points
    [...locationHistory].reverse().forEach(point => {
      routePath.push([point.lat, point.lng]);
    });
  }
  if (truckLocation) {
    routePath.push([truckLocation.lat, truckLocation.lng]);
  }
  if (dealer && dealer.lat && dealer.lng) {
    routePath.push([dealer.lat, dealer.lng]);
  }

  // Determine map center
  const center = truckLocation
    ? [truckLocation.lat, truckLocation.lng]
    : warehouse
    ? [warehouse.lat, warehouse.lng]
    : [19.0760, 72.8777]; // Default to Mumbai

  return (
    <Card>
      <div style={{ height: '600px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Warehouse Marker */}
          {warehouse && (
            <Marker position={[warehouse.lat, warehouse.lng]}>
              <Popup>
                <div>
                  <strong><FaWarehouse /> Warehouse: {warehouse.name}</strong>
                  <br />
                  {warehouse.address}
                  <br />
                  {warehouse.city}, {warehouse.state}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Truck Current Location */}
          {truckLocation && assignment?.truck && (
            <Marker
              position={[truckLocation.lat, truckLocation.lng]}
              icon={createTruckIcon(assignment.status)}
            >
              <Popup>
                <div>
                  <strong><FaTruck /> Truck: {assignment.truck.truckName}</strong>
                  <br />
                  License: {assignment.truck.licenseNumber}
                  <br />
                  Driver: {assignment.driverName}
                  {assignment.driverPhone && (
                    <>
                      <br />
                      Phone: {assignment.driverPhone}
                    </>
                  )}
                  <br />
                  Status: <strong>{assignment.status.replace('_', ' ')}</strong>
                  <br />
                  Last Update: {new Date(truckLocation.lastUpdate).toLocaleString()}
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

          {/* Dealer/Destination Marker */}
          {dealer && dealer.lat && dealer.lng && (
            <Marker position={[dealer.lat, dealer.lng]}>
              <Popup>
                <div>
                  <strong><FaMapMarkerAlt /> Destination: {dealer.businessName}</strong>
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
              positions={routePath}
              color="blue"
              weight={4}
              opacity={0.7}
              dashArray="10, 5"
            />
          )}
        </MapContainer>
      </div>
    </Card>
  );
};

export default LiveTrackingMap;

