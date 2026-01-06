import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Platform, Alert, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL, SOCKET_URL } from './utils/config';

// Screens
import LoginScreen from './screens/LoginScreen';
import OTPVerifyScreen from './screens/OTPVerifyScreen';
import DashboardScreen from './screens/DashboardScreen';
import AssignmentScreen from './screens/AssignmentScreen';

// Services
import { initSocket } from './services/socket';
import driverLocationService from './services/driverLocationService';
// Import background location task to register it
import './tasks/locationTask';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Profile Screen
const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { authAPI } = await import('./services/api');
              const { disconnectSocket } = await import('./services/socket');
              
              await authAPI.logout();
              disconnectSocket();
              driverLocationService.stopTracking();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={48} color="#4A90E2" />
        </View>
        <Text style={styles.profileName}>
          {user?.name || user?.username || 'Driver'}
        </Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.infoCard}>
          <Icon name="badge" size={24} color="#4A90E2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Driver</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Icon name="logout" size={20} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [navigationReady, setNavigationReady] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      console.log('[App] Starting auth check...');
      const token = await AsyncStorage.getItem('token');
      console.log('[App] Token exists:', !!token);
      
      if (token) {
        console.log('[App] User authenticated, setting authenticated state');
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log('[App] Auth check complete - authenticated');
        
        // Initialize Socket.IO in background (non-blocking)
        // Use setTimeout to ensure it doesn't block the UI
        setTimeout(() => {
          console.log('[App] Initializing socket in background...');
          initSocket().catch(err => {
            console.warn('[App] Socket initialization failed:', err);
            // Continue anyway - socket is optional for initial load
          });

          // Start location tracking for driver (will wait for truckId to be set)
          console.log('[App] Initializing driver location tracking...');
          // Don't start tracking yet - wait for truckId to be set from DashboardScreen
          // Tracking will start automatically when setTruckId() is called
        }, 100);
      } else {
        console.log('[App] No token found, user not authenticated');
        setIsAuthenticated(false);
        setIsLoading(false);
        console.log('[App] Auth check complete - not authenticated');
      }
    } catch (error) {
      console.error('[App] Auth check error:', error);
      console.error('[App] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      setError(error.message);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial auth check
    checkAuth();
    
    // Safety timeout - if loading takes more than 5 seconds, stop loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Loading timeout - forcing stop');
        setIsLoading(false);
      }
    }, 5000);
    
    // Set up interval to periodically check auth state (helps catch OTP verification)
    // Increased interval to 5 seconds to reduce performance impact
    const interval = setInterval(() => {
      // Only check if we're not authenticated yet (to catch OTP verification)
      if (!isAuthenticated && !isLoading) {
        checkAuth();
      }
    }, 5000); // Check every 5 seconds (reduced frequency)
    
    // Handle app state changes (foreground/background)
    let appState = AppState.currentState;
    
    const handleAppStateChange = (nextAppState) => {
      console.log(`[App] App state changed: ${appState} → ${nextAppState}`);
      
      if (nextAppState === 'active' && isAuthenticated) {
        console.log('[App] ✅ App came to foreground - ensuring location tracking is active');
        // Ensure tracking is still active when app comes to foreground
        const status = driverLocationService.getTrackingStatus();
        console.log('[App] Tracking status:', status);
        
        if (status.truckId) {
          if (!status.isTracking) {
            console.log('[App] 🔄 Restarting location tracking (was stopped)...');
            driverLocationService.startTracking().catch(err => {
              console.warn('[App] ❌ Failed to restart tracking:', err);
            });
          } else {
            console.log('[App] ✅ Location tracking is already active');
            // Even if tracking is active, verify it's working by checking last update
            // The monitoring in driverLocationService will handle restart if needed
          }
        } else {
          console.log('[App] ⏳ No truck assigned yet - tracking will start when truck is assigned');
        }
      } else if (nextAppState === 'background' && isAuthenticated) {
        console.log('[App] 📱 App went to background - location tracking should continue');
        const status = driverLocationService.getTrackingStatus();
        if (status.isTracking && status.truckId) {
          console.log('[App] ✅ Location tracking should continue in background');
        } else {
          console.warn('[App] ⚠️ Location tracking not active - may not work in background');
        }
      }
      
      appState = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
      subscription?.remove();
    };
  }, [checkAuth, isAuthenticated, isLoading]);

  // Re-check auth when navigation state changes (e.g., after OTP verification)
  const handleNavigationStateChange = useCallback(async () => {
    if (navigationReady && !isAuthenticated) {
      console.log('Navigation state changed - rechecking auth');
      await checkAuth();
    }
  }, [navigationReady, checkAuth, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading...</Text>
          <Text style={styles.loadingSubtext}>
            {__DEV__ ? 'Checking authentication...' : ''}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.errorWrapper}>
          <Icon name="error-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorSubtext}>
            Please check your network connection and try again.
          </Text>
          {__DEV__ && Platform.OS !== 'web' && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
              <Text style={styles.debugText}>API URL: {API_BASE_URL}</Text>
              <Text style={styles.debugText}>Socket URL: {SOCKET_URL}</Text>
              <Text style={styles.debugHint}>
                Make sure your phone and computer are on the same Wi-Fi network
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              checkAuth();
            }}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={20} color="#fff" style={styles.retryIcon} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer
      onReady={() => setNavigationReady(true)}
      onStateChange={handleNavigationStateChange}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Assignment"
              component={AssignmentScreen}
              options={{
                headerShown: true,
                title: 'Assignment Details',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: '#fff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                },
                headerTitleStyle: {
                  fontWeight: '700',
                  fontSize: 18,
                  color: '#2c3e50',
                },
                headerTintColor: '#4A90E2',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="OTPVerify"
              component={OTPVerifyScreen}
              options={{
                headerShown: true,
                title: 'Verify OTP',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: '#fff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                },
                headerTitleStyle: {
                  fontWeight: '700',
                  fontSize: 18,
                  color: '#2c3e50',
                },
                headerTintColor: '#4A90E2',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingWrapper: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  errorWrapper: {
    alignItems: 'center',
    maxWidth: 350,
  },
  errorText: {
    fontSize: 20,
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorSubtext: {
    fontSize: 15,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  debugContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
  profileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '400',
  },
  profileInfo: {
    marginBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
