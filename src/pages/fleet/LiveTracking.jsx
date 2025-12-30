import React, { useState, useEffect } from 'react';
import { trackingAPI } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaTruck } from 'react-icons/fa';
import { Chip, TextField, MenuItem, Grid } from '@mui/material';
import { onTruckLocationUpdate, offTruckLocationUpdate } from '../../services/socket';
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

const LiveTracking = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchLiveLocations();

    // Setup Socket.IO listener for real-time updates
    const handleLocationUpdate = (data) => {
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
              lastUpdate: data.timestamp
            }
          };
          return updated;
        }
        return prev;
      });
    };

    onTruckLocationUpdate(handleLocationUpdate);

    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveLocations, 30000);

    return () => {
      clearInterval(interval);
      offTruckLocationUpdate();
    };
  }, []);

  const fetchLiveLocations = async () => {
    try {
      setLoading(true);
      const response = await trackingAPI.getLiveLocations();
      setLocations(response.locations || []);
    } catch (error) {
      console.error('Error fetching live locations:', error);
      toast.error('Failed to load live truck locations');
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = filterStatus
    ? locations.filter(loc => loc.status === filterStatus)
    : locations;

  // Calculate map bounds
  const getMapBounds = () => {
    if (filteredLocations.length === 0) {
      return [[19.0760, 72.8777], [19.0760, 72.8777]]; // Default to Mumbai
    }

    const lats = filteredLocations.map(loc => loc.truck?.lat).filter(Boolean);
    const lngs = filteredLocations.map(loc => loc.truck?.lng).filter(Boolean);

    if (lats.length === 0) {
      return [[19.0760, 72.8777], [19.0760, 72.8777]];
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return [[minLat, minLng], [maxLat, maxLng]];
  };

  const bounds = getMapBounds();
  const center = [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2
  ];

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
      <PageHeader title="Live Truck Tracking" icon={<FaMapMarkerAlt />} />

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
          <div>
            <strong>Total Trucks:</strong> {filteredLocations.length}
          </div>
        </div>
      </Card>

      {filteredLocations.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            No trucks are currently being tracked.
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={center}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              bounds={bounds}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {filteredLocations.map((location, index) => {
                const truck = location.truck;
                if (!truck || !truck.lat || !truck.lng) return null;

                return (
                  <Marker
                    key={location.assignmentId || index}
                    position={[truck.lat, truck.lng]}
                    icon={createTruckIcon(location.status)}
                  >
                    <Popup>
                      <div>
                        <strong><FaTruck /> Truck: {truck.truckName}</strong>
                        <br />
                        License: {truck.licenseNumber}
                        <br />
                        Order: {location.orderNumber || location.orderId}
                        <br />
                        Driver: {location.driverName}
                        <br />
                        Status:{' '}
                        <Chip
                          label={location.status?.replace('_', ' ')}
                          color={getStatusColor(location.status)}
                          size="small"
                        />
                        <br />
                        Last Update: {new Date(truck.lastUpdate).toLocaleString()}
                        {location.warehouse && (
                          <>
                            <br />
                            Warehouse: {location.warehouse.name}
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
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

