import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL, SOCKET_URL } from './utils/config';

// Screens
import LoginScreen from './screens/LoginScreen';
import OTPVerifyScreen from './screens/OTPVerifyScreen';
import DashboardScreen from './screens/DashboardScreen';
import AssignmentScreen from './screens/AssignmentScreen';

// Services
import { initSocket } from './services/socket';

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
    try {
      const { authAPI } = await import('./services/api');
      const { disconnectSocket } = await import('./services/socket');
      
      await authAPI.logout();
      disconnectSocket();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.profileName}>
        {user?.name || user?.username || 'Driver'}
      </Text>
      <Text style={styles.profileEmail}>{user?.email || ''}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
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
    
    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
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
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
        <Text style={styles.loadingSubtext}>
          {__DEV__ ? 'Checking authentication...' : ''}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
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
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  debugContainer: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '90%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
