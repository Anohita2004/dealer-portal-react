import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { fleetAPI } from '../services/api';
import LocationTracker from '../services/locationTracker';

const AssignmentScreen = ({ route, navigation }) => {
  const { assignmentId } = route.params;
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracker, setTracker] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAssignment();
    initializeTracker();

    return () => {
      // Cleanup tracker on unmount
      if (tracker) {
        tracker.stopTracking();
      }
    };
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await fleetAPI.getAssignmentById(assignmentId);
      const assignmentData = response.assignment || response;
      setAssignment(assignmentData);

      // Check if tracking is active
      if (
        assignmentData.status === 'picked_up' ||
        assignmentData.status === 'in_transit'
      ) {
        setIsTracking(true);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      Alert.alert('Error', 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const initializeTracker = async () => {
    try {
      const assignmentData = await fleetAPI.getAssignmentById(assignmentId);
      const assignment = assignmentData.assignment || assignmentData;

      if (assignment.truckId && assignmentId) {
        const locationTracker = new LocationTracker(
          assignment.truckId,
          assignmentId
        );
        await locationTracker.initialize();
        setTracker(locationTracker);

        // Check tracking status
        const status = locationTracker.getTrackingStatus();
        setIsTracking(status.isTracking);
      }
    } catch (error) {
      console.error('Error initializing tracker:', error);
    }
  };

  const handlePickup = async () => {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the order from the warehouse?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(true);
              await tracker.markPickup();
              setIsTracking(true);
              await fetchAssignment();
              Alert.alert(
                'Success',
                'Pickup confirmed! GPS tracking is now active.'
              );
            } catch (error) {
              console.error('Pickup error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to mark pickup'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeliver = async () => {
    Alert.alert(
      'Confirm Delivery',
      'Have you delivered the order to the destination?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(true);
              await tracker.markDelivered();
              setIsTracking(false);
              await fetchAssignment();
              Alert.alert('Success', 'Delivery confirmed!');
              navigation.goBack();
            } catch (error) {
              console.error('Delivery error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to mark delivery'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: '#ffc107',
      picked_up: '#17a2b8',
      in_transit: '#007bff',
      delivered: '#28a745',
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Assignment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>
          {assignment.order?.orderNumber || `Order #${assignment.orderId}`}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(assignment.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {assignment.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {isTracking && (
        <View style={styles.trackingBanner}>
          <Text style={styles.trackingText}>
            📍 GPS Tracking Active - Your location is being tracked
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignment Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Truck:</Text>
          <Text style={styles.value}>
            {assignment.truck?.truckName || 'N/A'} (
            {assignment.truck?.licenseNumber || 'N/A'})
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Driver:</Text>
          <Text style={styles.value}>{assignment.driverName || 'N/A'}</Text>
        </View>

        {assignment.driverPhone && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Driver Phone:</Text>
            <Text style={styles.value}>{assignment.driverPhone}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>
            {assignment.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warehouse</Text>
        <Text style={styles.value}>
          {assignment.warehouse?.name || 'N/A'}
        </Text>
        {assignment.warehouse?.address && (
          <Text style={styles.subValue}>{assignment.warehouse.address}</Text>
        )}
        {assignment.warehouse?.city && (
          <Text style={styles.subValue}>
            {assignment.warehouse.city}, {assignment.warehouse.state}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Destination</Text>
        <Text style={styles.value}>
          {assignment.order?.dealer?.businessName || 'N/A'}
        </Text>
        {assignment.order?.dealer?.address && (
          <Text style={styles.subValue}>
            {assignment.order.dealer.address}
          </Text>
        )}
        {assignment.order?.dealer?.city && (
          <Text style={styles.subValue}>
            {assignment.order.dealer.city}, {assignment.order.dealer.state}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {assignment.assignedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Assigned:</Text>
            <Text style={styles.value}>
              {new Date(assignment.assignedAt).toLocaleString()}
            </Text>
          </View>
        )}
        {assignment.pickupAt && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Picked Up:</Text>
            <Text style={styles.value}>
              {new Date(assignment.pickupAt).toLocaleString()}
            </Text>
          </View>
        )}
        {assignment.deliveredAt && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Delivered:</Text>
            <Text style={styles.value}>
              {new Date(assignment.deliveredAt).toLocaleString()}
            </Text>
          </View>
        )}
        {assignment.estimatedDeliveryAt && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Est. Delivery:</Text>
            <Text style={styles.value}>
              {new Date(assignment.estimatedDeliveryAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {assignment.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.value}>{assignment.notes}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {assignment.status === 'assigned' && (
          <TouchableOpacity
            style={[styles.button, styles.pickupButton]}
            onPress={handlePickup}
            disabled={actionLoading || !tracker}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirm Pickup</Text>
            )}
          </TouchableOpacity>
        )}

        {(assignment.status === 'picked_up' ||
          assignment.status === 'in_transit') && (
          <TouchableOpacity
            style={[styles.button, styles.deliverButton]}
            onPress={handleDeliver}
            disabled={actionLoading || !tracker}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mark as Delivered</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  trackingBanner: {
    backgroundColor: '#d4edda',
    padding: 12,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  trackingText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    fontWeight: '500',
  },
  subValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    padding: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  pickupButton: {
    backgroundColor: '#17a2b8',
  },
  deliverButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AssignmentScreen;

