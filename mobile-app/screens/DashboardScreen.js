import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fleetAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
    fetchAssignments();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // Check authentication first
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setAssignments([]);
        return;
      }

      // For drivers, fetch all assignments and filter client-side
      // Backend should return assignments for the logged-in driver
      let response;
      let assignmentsList = [];
      
      try {
        // Try fetching without status filter first (backend should filter by driver)
        console.log('Fetching assignments for driver...');
        response = await fleetAPI.getMyAssignments({});
        
        console.log('Raw response:', response);
        
        // Handle different response formats
        if (response.error) {
          console.error('Backend returned error:', response.error);
          // Check if it's a "no assignments" case vs actual error
          if (response.error.toLowerCase().includes('not found') || 
              response.error.toLowerCase().includes('no assignments')) {
            // This is fine - driver just has no assignments
            assignmentsList = [];
          } else {
            throw new Error(response.error);
          }
        } else {
          const allAssignments = response.assignments || response.data || response || [];
          
          // Ensure it's an array
          if (!Array.isArray(allAssignments)) {
            console.warn('Response is not an array:', allAssignments);
            assignmentsList = [];
          } else {
            // Filter client-side to only show active assignments
            assignmentsList = allAssignments.filter(a => {
              const status = (a.status || '').toLowerCase();
              return ['assigned', 'picked_up', 'in_transit'].includes(status);
            });
          }
        }
        
        console.log(`Loaded ${assignmentsList.length} active assignments`);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
        });
        
        // Extract error message from backend
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Unknown error';
        
        console.error('Backend error message:', errorMessage);
        
        // If it's a 500 error, it's a backend issue
        if (error.response?.status === 500) {
          console.error('Backend server error (500) - check backend logs');
          // Still show empty list - user can retry later
          assignmentsList = [];
        } else if (error.response?.status === 404) {
          // Endpoint not found - backend might not be implemented yet
          console.error('Endpoint not found (404) - backend may not be implemented');
          assignmentsList = [];
        } else if (error.response?.status === 401) {
          // Unauthorized - token issue
          console.error('Unauthorized (401) - token may be invalid');
          assignmentsList = [];
        } else {
          // Other errors - try empty params as fallback
          try {
            console.log('Trying fallback fetch without params...');
            response = await fleetAPI.getMyAssignments();
            assignmentsList = response.assignments || response.data || response || [];
            if (!Array.isArray(assignmentsList)) {
              assignmentsList = [];
            }
          } catch (error2) {
            console.error('Fallback also failed:', error2.response?.data);
            assignmentsList = [];
          }
        }
      }

      setAssignments(Array.isArray(assignmentsList) ? assignmentsList : []);
      setError(null); // Clear any previous errors on success
    } catch (error) {
      console.error('Fatal error fetching assignments:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch assignments';
      setError(errorMessage);
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
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

  const renderAssignment = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Assignment', { assignmentId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Icon name="assignment" size={24} color="#4A90E2" style={styles.orderIcon} />
          <View>
            <Text style={styles.orderLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>
              {item.order?.orderNumber || item.orderId}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Icon name="warehouse" size={18} color="#999" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Warehouse</Text>
            <Text style={styles.value}>
              {item.warehouse?.name || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Icon name="place" size={18} color="#999" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>
              {item.order?.dealer?.businessName || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {item.assignedAt && (
          <>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={18} color="#999" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.label}>Assigned</Text>
                <Text style={styles.value}>
                  {new Date(item.assignedAt).toLocaleString()}
                </Text>
              </View>
            </View>
            {item.estimatedDeliveryAt && <View style={styles.divider} />}
          </>
        )}

        {item.estimatedDeliveryAt && (
          <View style={styles.infoRow}>
            <Icon name="access-time" size={18} color="#999" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Est. Delivery</Text>
              <Text style={styles.value}>
                {new Date(item.estimatedDeliveryAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Icon name="chevron-right" size={24} color="#4A90E2" />
      </View>
    </TouchableOpacity>
  );

  if (loading && assignments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Assignments</Text>
            {user && (
              <Text style={styles.headerSubtitle}>
                Welcome back, {user.name || user.username}
              </Text>
            )}
          </View>
          <View style={styles.headerIcon}>
            <Icon name="dashboard" size={32} color="#4A90E2" />
          </View>
        </View>
      </View>

      {error && !loading ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyWrapper}>
            <Icon name="error-outline" size={64} color="#ff6b6b" />
            <Text style={styles.errorText}>Error Loading Assignments</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchAssignments}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={20} color="#fff" style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : assignments.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyWrapper}>
            <Icon name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No assignments found</Text>
            <Text style={styles.emptySubtext}>
              You don't have any active assignments at the moment.
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh or contact your manager if you expect assignments.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignment}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '400',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIcon: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  cardBody: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
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
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
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
  emptyWrapper: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DashboardScreen;

