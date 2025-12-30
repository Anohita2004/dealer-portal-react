import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackingAPI, fleetAPI, orderAPI } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import LiveTrackingMap from './LiveTrackingMap';
import FleetAssignments from './FleetAssignments';
import { toast } from 'react-toastify';
import { FaTruck, FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Button, Chip, Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchTrackingData();
      const interval = setInterval(fetchTrackingData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      const response = await trackingAPI.getOrderTracking(orderId);
      setTrackingData(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking data');
      setLoading(false);
    }
  };

  const handlePickup = async () => {
    try {
      await fleetAPI.markPickup(trackingData.assignment.id);
      toast.success('Pickup marked successfully');
      fetchTrackingData();
    } catch (error) {
      console.error('Error marking pickup:', error);
      toast.error('Failed to mark pickup');
    }
  };

  const handleDeliver = async () => {
    try {
      await fleetAPI.markDeliver(trackingData.assignment.id);
      toast.success('Delivery marked successfully');
      fetchTrackingData();
    } catch (error) {
      console.error('Error marking delivery:', error);
      toast.error('Failed to mark delivery');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Order Tracking" icon={<FaTruck />} />
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading tracking data...</div>
        </Card>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div>
        <PageHeader title="Order Tracking" icon={<FaTruck />} />
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No tracking data available for this order.</p>
            <Button variant="contained" onClick={() => navigate('/orders')}>
              Back to Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!trackingData.hasAssignment) {
    return (
      <div>
        <PageHeader title={`Order Tracking: ${trackingData.orderNumber || orderId}`} icon={<FaTruck />} />
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No truck assigned to this order yet.</p>
            <Button
              variant="contained"
              onClick={() => setShowAssignModal(true)}
              style={{ marginTop: '16px' }}
            >
              Assign Truck
            </Button>
            {showAssignModal && (
              <div style={{ marginTop: '20px' }}>
                <FleetAssignments />
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const { assignment, currentLocation, locationHistory, order } = trackingData;
  const warehouse = assignment?.warehouse;

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

  return (
    <div>
      <PageHeader
        title={`Order Tracking: ${trackingData.orderNumber || orderId}`}
        icon={<FaTruck />}
      />

      <Grid container spacing={3}>
        {/* Assignment Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <Typography variant="h6" gutterBottom>
              Assignment Details
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Truck:</strong> {assignment.truck?.truckName} ({assignment.truck?.licenseNumber})
              </div>
              <div>
                <strong>Driver:</strong> {assignment.driverName}
                {assignment.driverPhone && ` - ${assignment.driverPhone}`}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <Chip
                  label={assignment.status?.replace('_', ' ')}
                  color={getStatusColor(assignment.status)}
                  size="small"
                />
              </div>
              <div>
                <strong>Warehouse:</strong> {warehouse?.name} - {warehouse?.city}
              </div>
              <div>
                <strong>Assigned At:</strong>{' '}
                {new Date(assignment.assignedAt).toLocaleString()}
              </div>
              {assignment.pickupAt && (
                <div>
                  <strong>Picked Up At:</strong>{' '}
                  {new Date(assignment.pickupAt).toLocaleString()}
                </div>
              )}
              {assignment.deliveredAt && (
                <div>
                  <strong>Delivered At:</strong>{' '}
                  {new Date(assignment.deliveredAt).toLocaleString()}
                </div>
              )}
              {assignment.estimatedDeliveryAt && (
                <div>
                  <strong>Estimated Delivery:</strong>{' '}
                  {new Date(assignment.estimatedDeliveryAt).toLocaleString()}
                </div>
              )}
              {assignment.notes && (
                <div>
                  <strong>Notes:</strong> {assignment.notes}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {assignment.status === 'assigned' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FaCheckCircle />}
                    onClick={handlePickup}
                  >
                    Mark as Picked Up
                  </Button>
                )}
                {(assignment.status === 'picked_up' || assignment.status === 'in_transit') && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<FaCheckCircle />}
                    onClick={handleDeliver}
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </Grid>

        {/* Current Location */}
        <Grid item xs={12} md={6}>
          <Card>
            <Typography variant="h6" gutterBottom>
              Current Location
            </Typography>
            {currentLocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}
                </div>
                <div>
                  <strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}
                </div>
                <div>
                  <strong>Last Update:</strong>{' '}
                  {new Date(currentLocation.lastUpdate).toLocaleString()}
                </div>
                {currentLocation.speed && (
                  <div>
                    <strong>Speed:</strong> {currentLocation.speed} km/h
                  </div>
                )}
                {currentLocation.heading && (
                  <div>
                    <strong>Heading:</strong> {currentLocation.heading}°
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'gray' }}>No location data available</div>
            )}
          </Card>
        </Grid>

        {/* Map */}
        <Grid item xs={12}>
          <LiveTrackingMap orderId={orderId} assignmentId={assignment.id} />
        </Grid>

        {/* Location History */}
        {locationHistory && locationHistory.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <Typography variant="h6" gutterBottom>
                Location History
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Latitude</TableCell>
                      <TableCell>Longitude</TableCell>
                      <TableCell>Speed</TableCell>
                      <TableCell>Heading</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locationHistory.map((point, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {new Date(point.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{point.lat.toFixed(6)}</TableCell>
                        <TableCell>{point.lng.toFixed(6)}</TableCell>
                        <TableCell>{point.speed ? `${point.speed} km/h` : 'N/A'}</TableCell>
                        <TableCell>{point.heading ? `${point.heading}°` : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default OrderTracking;

