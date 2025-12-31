import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

  const handleStatusUpdate = async () => {
    // Define available statuses based on current status
    let statusOptions = [];
    const statusLabels = {
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delayed: 'Delayed',
      on_hold: 'On Hold',
    };

    if (assignment.status === 'assigned') {
      // From assigned, can only update to delayed or on_hold
      statusOptions = ['delayed', 'on_hold'];
    } else if (assignment.status === 'picked_up') {
      // From picked_up, can update to in_transit, delayed, or on_hold
      statusOptions = ['in_transit', 'delayed', 'on_hold'];
    } else if (assignment.status === 'in_transit') {
      // From in_transit, can update to delayed or on_hold (can't go back to picked_up)
      statusOptions = ['delayed', 'on_hold'];
    } else {
      // For other statuses, show all available options
      statusOptions = ['picked_up', 'in_transit', 'delayed', 'on_hold'];
    }

    // Filter out current status
    const availableStatuses = statusOptions.filter(status => status !== assignment.status);

    if (availableStatuses.length === 0) {
      Alert.alert('Info', 'No status updates available');
      return;
    }

    Alert.alert(
      'Update Status',
      'Select new status:',
      [
        ...availableStatuses.map(status => ({
          text: statusLabels[status] || status.replace('_', ' ').toUpperCase(),
          onPress: async () => {
            try {
              setActionLoading(true);
              const { fleetAPI } = await import('../services/api');
              await fleetAPI.updateStatus(assignmentId, status, `Status changed to ${statusLabels[status]} by driver`);
              await fetchAssignment();
              Alert.alert('Success', 'Status updated successfully!');
            } catch (error) {
              console.error('Status update error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to update status'
              );
            } finally {
              setActionLoading(false);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
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
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading assignment...</Text>
        </View>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Assignment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.orderInfo}>
            <Icon name="assignment" size={28} color="#4A90E2" style={styles.headerIcon} />
            <View>
              <Text style={styles.orderLabel}>Order Number</Text>
              <Text style={styles.orderNumber}>
                {assignment.order?.orderNumber || `Order #${assignment.orderId}`}
              </Text>
            </View>
          </View>
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
      </View>

      {isTracking && (
        <View style={styles.trackingBanner}>
          <Icon name="gps-fixed" size={20} color="#28a745" style={styles.trackingIcon} />
          <Text style={styles.trackingText}>
            GPS Tracking Active - Your location is being tracked
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="info" size={20} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Assignment Details</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="local-shipping" size={18} color="#999" style={styles.detailIcon} />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Truck</Text>
            <Text style={styles.value}>
              {`${assignment.truck?.truckName || 'N/A'} (${assignment.truck?.licenseNumber || 'N/A'})`}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Icon name="person" size={18} color="#999" style={styles.detailIcon} />
          <View style={styles.detailContent}>
            <Text style={styles.label}>Driver</Text>
            <Text style={styles.value}>{assignment.driverName || 'N/A'}</Text>
          </View>
        </View>

        {assignment.driverPhone && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Icon name="phone" size={18} color="#999" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Driver Phone</Text>
                <Text style={styles.value}>{assignment.driverPhone}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="warehouse" size={20} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Warehouse</Text>
        </View>
        <Text style={styles.sectionValue}>
          {assignment.warehouse?.name || 'N/A'}
        </Text>
        {assignment.warehouse?.address && (
          <Text style={styles.subValue}>{assignment.warehouse.address}</Text>
        )}
        {assignment.warehouse?.city && (
          <Text style={styles.subValue}>
            {`${assignment.warehouse.city}, ${assignment.warehouse.state}`}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="place" size={20} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Destination</Text>
        </View>
        <Text style={styles.sectionValue}>
          {assignment.order?.dealer?.businessName || 'N/A'}
        </Text>
        {assignment.order?.dealer?.address && (
          <Text style={styles.subValue}>
            {assignment.order.dealer.address}
          </Text>
        )}
        {assignment.order?.dealer?.city && (
          <Text style={styles.subValue}>
            {`${assignment.order.dealer.city}, ${assignment.order.dealer.state}`}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="schedule" size={20} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Timeline</Text>
        </View>
        {assignment.assignedAt && (
          <>
            <View style={styles.detailRow}>
              <Icon name="assignment-turned-in" size={18} color="#999" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Assigned</Text>
                <Text style={styles.value}>
                  {new Date(assignment.assignedAt).toLocaleString()}
                </Text>
              </View>
            </View>
            {(assignment.pickupAt || assignment.deliveredAt || assignment.estimatedDeliveryAt) && (
              <View style={styles.divider} />
            )}
          </>
        )}
        {assignment.pickupAt && (
          <>
            <View style={styles.detailRow}>
              <Icon name="inventory" size={18} color="#999" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Picked Up</Text>
                <Text style={styles.value}>
                  {new Date(assignment.pickupAt).toLocaleString()}
                </Text>
              </View>
            </View>
            {(assignment.deliveredAt || assignment.estimatedDeliveryAt) && (
              <View style={styles.divider} />
            )}
          </>
        )}
        {assignment.deliveredAt && (
          <>
            <View style={styles.detailRow}>
              <Icon name="check-circle" size={18} color="#999" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.label}>Delivered</Text>
                <Text style={styles.value}>
                  {new Date(assignment.deliveredAt).toLocaleString()}
                </Text>
              </View>
            </View>
            {assignment.estimatedDeliveryAt && <View style={styles.divider} />}
          </>
        )}
        {assignment.estimatedDeliveryAt && (
          <View style={styles.detailRow}>
            <Icon name="access-time" size={18} color="#999" style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.label}>Est. Delivery</Text>
              <Text style={styles.value}>
                {new Date(assignment.estimatedDeliveryAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {assignment.notes && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="notes" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <Text style={styles.sectionValue}>{assignment.notes}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {assignment?.status === 'assigned' && (
          <View>
            <TouchableOpacity
              style={[styles.button, styles.pickupButton]}
              onPress={handlePickup}
              disabled={actionLoading || !tracker}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="inventory" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Confirm Pickup</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.statusUpdateButton]}
              onPress={handleStatusUpdate}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="update" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Update Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {(assignment.status === 'picked_up' ||
          assignment.status === 'in_transit') && (
          <View>
            <TouchableOpacity
              style={[styles.button, styles.deliverButton]}
              onPress={handleDeliver}
              disabled={actionLoading || !tracker}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.statusUpdateButton]}
              onPress={handleStatusUpdate}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="update" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Update Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
    }),
  },
  scrollContent: {
    paddingBottom: 30,
    ...(Platform.OS === 'web' && {
      minHeight: '100%',
    }),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingWrapper: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  orderLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trackingBanner: {
    backgroundColor: '#d4edda',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingIcon: {
    marginRight: 12,
  },
  trackingText: {
    color: '#155724',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
  },
  sectionValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
    marginLeft: 32,
  },
  subValue: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pickupButton: {
    backgroundColor: '#17a2b8',
  },
  deliverButton: {
    backgroundColor: '#28a745',
  },
  statusUpdateButton: {
    backgroundColor: '#4A90E2',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default AssignmentScreen;

