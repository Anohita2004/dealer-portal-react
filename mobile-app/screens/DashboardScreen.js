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
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>
          Order: {item.order?.orderNumber || item.orderId}
        </Text>
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
        <Text style={styles.label}>Warehouse:</Text>
        <Text style={styles.value}>
          {item.warehouse?.name || 'N/A'}
        </Text>

        <Text style={styles.label}>Destination:</Text>
        <Text style={styles.value}>
          {item.order?.dealer?.businessName || 'N/A'}
        </Text>

        <Text style={styles.label}>Driver:</Text>
        <Text style={styles.value}>{item.driverName || 'N/A'}</Text>

        {item.assignedAt && (
          <>
            <Text style={styles.label}>Assigned:</Text>
            <Text style={styles.value}>
              {new Date(item.assignedAt).toLocaleString()}
            </Text>
          </>
        )}

        {item.estimatedDeliveryAt && (
          <>
            <Text style={styles.label}>Est. Delivery:</Text>
            <Text style={styles.value}>
              {new Date(item.estimatedDeliveryAt).toLocaleString()}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && assignments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Assignments</Text>
        {user && (
          <Text style={styles.headerSubtitle}>
            {user.name || user.username}
          </Text>
        )}
      </View>

      {error && !loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error Loading Assignments</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAssignments}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : assignments.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No assignments found</Text>
          <Text style={styles.emptySubtext}>
            You don't have any active assignments at the moment.
          </Text>
          <Text style={styles.emptySubtext}>
            Pull down to refresh or contact your manager if you expect assignments.
          </Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;

