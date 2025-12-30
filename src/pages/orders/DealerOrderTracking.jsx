import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackingAPI, orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import LiveTrackingMap from '../fleet/LiveTrackingMap';
import { toast } from 'react-toastify';
import { FaTruck, FaMapMarkerAlt, FaClock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { Button, Chip, Grid, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';

const DealerOrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderAndTracking();
      const interval = setInterval(fetchOrderAndTracking, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrderAndTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      // First verify the order belongs to this dealer
      const orderResponse = await orderAPI.getOrderById(orderId);
      const orderData = orderResponse.order || orderResponse;

      // Check if order belongs to dealer
      const dealerId = user?.dealerId || user?.dealer?.id;
      if (orderData.dealerId !== dealerId && orderData.dealer?.id !== dealerId) {
        setError('You do not have permission to track this order.');
        setLoading(false);
        return;
      }

      // Check if order is in transit or shipped
      const orderStatus = orderData.status;
      const assignmentStatus = orderData.truckAssignment?.status;
      
      if (orderStatus !== 'Shipped' && assignmentStatus !== 'in_transit' && assignmentStatus !== 'picked_up') {
        setError('Order tracking is only available for orders in transit.');
        setLoading(false);
        setOrder(orderData);
        return;
      }

      setOrder(orderData);

      // Fetch tracking data
      try {
        const response = await trackingAPI.getOrderTracking(orderId);
        setTrackingData(response);
      } catch (trackingError) {
        // If tracking data is not available yet, that's okay
        console.log('Tracking data not available yet:', trackingError);
        setTrackingData(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching order/tracking data:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to track this order.');
      } else {
        setError('Failed to load order tracking data.');
      }
      setLoading(false);
    }
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
        <PageHeader title="Order Tracking" icon={<FaTruck />} />
        <Card>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading tracking data...</Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title="Order Tracking" icon={<FaTruck />} />
        <Card>
          <Box sx={{ p: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              startIcon={<FaArrowLeft />}
              onClick={() => navigate('/orders')}
            >
              Back to Orders
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <PageHeader title="Order Tracking" icon={<FaTruck />} />
        <Card>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Order not found.</Typography>
            <Button
              variant="contained"
              startIcon={<FaArrowLeft />}
              onClick={() => navigate('/orders')}
              sx={{ mt: 2 }}
            >
              Back to Orders
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  const assignment = trackingData?.assignment || order.truckAssignment;
  const hasAssignment = trackingData?.hasAssignment || !!assignment;

  if (!hasAssignment) {
    return (
      <Box>
        <PageHeader 
          title={`Order Tracking: ${order.orderNumber || orderId}`} 
          icon={<FaTruck />} 
        />
        <Card>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No truck assigned yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your order is being prepared. Tracking will be available once a truck is assigned.
            </Typography>
            <Button
              variant="contained"
              startIcon={<FaArrowLeft />}
              onClick={() => navigate('/orders')}
            >
              Back to Orders
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  const { currentLocation, locationHistory } = trackingData || {};
  const warehouse = assignment?.warehouse;
  // Ensure we have assignment data for the map
  const assignmentForMap = assignment || order.truckAssignment;

  return (
    <Box>
      <PageHeader
        title={`Order Tracking: ${order.orderNumber || orderId}`}
        icon={<FaTruck />}
      />

      <Grid container spacing={3}>
        {/* Order & Assignment Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <Typography variant="h6" gutterBottom>
              Order & Delivery Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Order Number
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {order.orderNumber || orderId}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Assignment Status
                </Typography>
                <Chip
                  label={assignment.status?.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(assignment.status)}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              {assignment.truck && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Truck
                  </Typography>
                  <Typography variant="body1">
                    {assignment.truck.truckName} ({assignment.truck.licenseNumber})
                  </Typography>
                </Box>
              )}

              {assignment.driverName && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Driver
                  </Typography>
                  <Typography variant="body1">
                    {assignment.driverName}
                    {assignment.driverPhone && ` - ${assignment.driverPhone}`}
                  </Typography>
                </Box>
              )}

              {warehouse && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Warehouse
                  </Typography>
                  <Typography variant="body1">
                    {warehouse.name} - {warehouse.city}
                  </Typography>
                </Box>
              )}

              {assignment.assignedAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Assigned At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(assignment.assignedAt).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {assignment.pickupAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Picked Up At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(assignment.pickupAt).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {assignment.estimatedDeliveryAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Delivery
                  </Typography>
                  <Typography variant="body1" color="primary">
                    {new Date(assignment.estimatedDeliveryAt).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {assignment.deliveredAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Delivered At
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    {new Date(assignment.deliveredAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Current Location Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <Typography variant="h6" gutterBottom>
              Current Location
            </Typography>
            {currentLocation ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Coordinates
                  </Typography>
                  <Typography variant="body1">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Update
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentLocation.lastUpdate).toLocaleString()}
                  </Typography>
                </Box>
                {currentLocation.speed && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Speed
                    </Typography>
                    <Typography variant="body1">
                      {currentLocation.speed} km/h
                    </Typography>
                  </Box>
                )}
                {currentLocation.heading && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Heading
                    </Typography>
                    <Typography variant="body1">
                      {currentLocation.heading}°
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                Location data will appear once the driver starts tracking.
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Live Tracking Map */}
        <Grid item xs={12}>
          {assignmentForMap ? (
            <LiveTrackingMap 
              orderId={orderId} 
              assignmentId={assignmentForMap.id}
              initialTrackingData={trackingData}
              initialOrder={order}
            />
          ) : (
            <Card>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Map Loading...
                </Typography>
                <Typography color="text.secondary">
                  Preparing map view with truck location...
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<FaArrowLeft />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Box>
    </Box>
  );
};

export default DealerOrderTracking;

