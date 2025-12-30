import React, { useState, useEffect } from 'react';
import { trackingAPI, warehouseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaTruck, FaWarehouse } from 'react-icons/fa';
import { Chip, TextField, MenuItem, Grid, FormControlLabel, Switch } from '@mui/material';
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

const LiveTracking = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showWarehouses, setShowWarehouses] = useState(true);

  // Check if user is dealer admin/staff - filter to their orders only
  const isDealerUser = user?.role === 'dealer_admin' || user?.role === 'dealer_staff';
  const dealerId = user?.dealerId || user?.dealer?.id;

  useEffect(() => {
    fetchLiveLocations();
    fetchWarehouses();

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
      
      // Ensure truck locations have valid coordinates
      // The API returns: { locations: [{ truck: { lat, lng, ... }, ... }] }
      locationsList = locationsList.map(loc => {
        // The truck object already has lat/lng from the API
        const truck = loc.truck || {};
        const lat = truck.lat;
        const lng = truck.lng;
        
        // Normalize coordinates to numbers
        const normalizedLat = lat != null ? Number(lat) : null;
        const normalizedLng = lng != null ? Number(lng) : null;
        
        // Return location with normalized truck coordinates
        return {
          ...loc,
          truck: {
            ...truck,
            lat: normalizedLat,
            lng: normalizedLng,
            truckName: truck.truckName || 'Unknown',
            licenseNumber: truck.licenseNumber || 'N/A',
            lastUpdate: truck.lastUpdate || new Date().toISOString()
          }
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

  // Calculate map bounds
  const getMapBounds = () => {
    const allPoints = [];
    
    // Add truck locations
    filteredLocations.forEach(loc => {
      if (loc.truck?.lat && loc.truck?.lng) {
        allPoints.push([loc.truck.lat, loc.truck.lng]);
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
          
          <div>
            <strong>Total Trucks:</strong> {filteredLocations.length}
            {showWarehouses && warehouses.length > 0 && (
              <> | <strong>Warehouses:</strong> {warehouses.length}</>
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
              bounds={bounds}
            >
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
                  assignmentId: location.assignmentId 
                });

                return (
                  <Marker
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

