import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { trackingAPI } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LOCATION_TASK_NAME from '../tasks/locationTask';

class DriverLocationService {
  constructor() {
    this.locationSubscription = null;
    this.lastUpdate = 0;
    this.RATE_LIMIT_MS = 10000;
    this.isTracking = false;
    this.truckId = null;
    this.driverId = null;
    this.isSending = false; // Flag to prevent concurrent sends
    this.pendingLocation = null; // Queue for pending location update
    this.watchInterval = null; // Fallback interval for location updates
    this.lastLocationReceived = null; // Track when we last received a location update
    this.watchCheckInterval = null; // Interval to check if watch is still active
  }

  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted - tracking may be limited when app is in background');
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async startTracking() {
    if (this.isTracking) {
      console.log('Driver location tracking already active');
      return;
    }

    try {
      const user = await AsyncStorage.getItem('user');
      if (!user) {
        console.error('No user data found');
        return;
      }

      const userData = JSON.parse(user);
      this.driverId = userData.id || userData.userId;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Location permissions not granted');
        return;
      }

      // Check background permission specifically
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background location permission not granted - requesting again...');
        const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (newBackgroundStatus !== 'granted') {
          console.warn('⚠️ Background location permission still not granted - tracking may stop when app is closed');
        } else {
          console.log('✅ Background location permission granted');
        }
      } else {
        console.log('✅ Background location permission already granted');
      }

      this.isTracking = true;
      console.log('🚀 Starting driver location tracking with background support...');

      // Store tracking data for background task
      await AsyncStorage.setItem('tracking_data', JSON.stringify({
        truckId: this.truckId,
        driverId: this.driverId,
      }));

      // Start background location task - PRIMARY mechanism for background tracking
      try {
        const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
        if (!isTaskDefined) {
          console.error('❌ Background location task not defined');
        } else {
          // Check if task is already running
          const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
          
          if (!isTaskRunning) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.High,
              timeInterval: 10000, // Update every 10 seconds
              distanceInterval: 10, // Or every 10 meters
              foregroundService: {
                notificationTitle: 'Location Tracking Active',
                notificationBody: 'Your location is being tracked for delivery',
                notificationColor: '#4A90E2',
              },
              showsBackgroundLocationIndicator: true, // iOS
              pausesUpdatesAutomatically: false, // Don't pause in background
            });
            console.log('✅ Background location task started successfully');
          } else {
            console.log('✅ Background location task already running');
          }
        }
      } catch (taskError) {
        console.error('❌ Error starting background location task:', taskError);
        // Fall back to watchPositionAsync if task fails
        console.log('⚠️ Falling back to watchPositionAsync...');
      }

      // Also start watchPositionAsync for foreground updates (faster, more responsive)
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Or every 10 meters
        mayShowUserSettingsDialog: false, // Don't show dialog repeatedly
        // Enable background location updates (Android)
        foregroundService: {
          notificationTitle: 'Location Tracking Active',
          notificationBody: 'Your location is being tracked for delivery',
          notificationColor: '#4A90E2',
        },
        // Additional options to ensure continuous updates
        enableHighAccuracy: true,
        // Ensure location updates continue in background
        showsBackgroundLocationIndicator: true, // iOS
      };

      try {
        // Use watchPositionAsync for foreground updates (complements background task)
        this.locationSubscription = await Location.watchPositionAsync(
          locationOptions,
          (position) => {
            this.lastLocationReceived = Date.now();
            console.log('📍 Location update received from watch (foreground):', {
              lat: position.coords.latitude.toFixed(6),
              lng: position.coords.longitude.toFixed(6),
              timestamp: new Date().toISOString()
            });
            this.handleLocationUpdate(position);
          }
        );

        // Verify subscription is valid
        if (!this.locationSubscription || !this.locationSubscription.remove) {
          throw new Error('Invalid location subscription returned');
        }

        console.log('✅ Location watch started successfully - will continue in background');
      } catch (watchError) {
        console.error('❌ Error setting up location watch:', watchError);
        // Fallback: Use interval-based location updates instead
        console.log('⚠️ Using fallback interval-based location tracking');
        this.startFallbackLocationCheck();
        // Still mark as tracking so we can use fallback
        this.isTracking = true;
      }

      // Set up fallback mechanism - check if watch is still working
      this.startWatchMonitoring();

      // CRITICAL: Set up fallback interval-based location check
      // This is the PRIMARY mechanism for background tracking
      // watchPositionAsync may stop working in background, so we rely on this
      this.startFallbackLocationCheck();
      
      console.log('✅ Fallback location check started - will send updates every 12 seconds');

      console.log('✅ Driver location tracking started successfully');
    } catch (error) {
      console.error('❌ Error starting driver location tracking:', error);
      this.isTracking = false;
      throw error;
    }
  }

  // Monitor if watchPositionAsync is still working
  startWatchMonitoring() {
    // Clear existing interval if any
    if (this.watchCheckInterval) {
      clearInterval(this.watchCheckInterval);
    }

    // Check every 30 seconds if we're still receiving location updates
    this.watchCheckInterval = setInterval(() => {
      if (!this.isTracking || !this.truckId) {
        return;
      }

      const timeSinceLastLocation = Date.now() - (this.lastLocationReceived || 0);
      
      // If we haven't received a location update in 45 seconds, restart the watch
      // Increased threshold to account for background delays
      if (timeSinceLastLocation > 45000) {
        console.warn('⚠️ Location watch appears to have stopped (no updates for 45s). Restarting...');
        this.restartTracking();
      } else if (timeSinceLastLocation > 30000) {
        console.log('⏳ Location watch may be slow (no updates for 30s) - monitoring...');
      }
    }, 30000); // Check every 30 seconds
  }

  // Fallback: Periodically get current position - PRIMARY mechanism for background tracking
  // This ensures location updates continue even if watchPositionAsync stops or is throttled
  startFallbackLocationCheck() {
    // Clear existing interval if any
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    // Every 11 seconds, manually get current position and send it
    // This is MORE RELIABLE than watchPositionAsync in background
    // We use 11 seconds to respect the 10-second rate limit with minimal buffer
    // CRITICAL: This interval MUST continue running in background for tracking to work
    let fallbackCounter = 0;
    this.watchInterval = setInterval(async () => {
      fallbackCounter++;
      
      if (!this.isTracking || !this.truckId) {
        console.log('⏭️ Fallback: Skipping (not tracking or no truckId)', {
          isTracking: this.isTracking,
          truckId: this.truckId,
          counter: fallbackCounter
        });
        return;
      }

      console.log(`🔄 Fallback interval running (${fallbackCounter}) - getting location...`);

      try {
        // Use getCurrentPositionAsync with background-friendly options
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 20000, // Accept location up to 20 seconds old (more lenient for background)
          mayShowUserSettingsDialog: false,
        });
        
        // Always send location update via fallback
        // The handleLocationUpdate method will handle rate limiting
        // This ensures continuous updates even if watchPositionAsync stops in background
        const timeSinceLastUpdate = Date.now() - this.lastUpdate;
        const timeSinceLastLocation = Date.now() - (this.lastLocationReceived || 0);
        
        console.log('🔄 Fallback: Got location, sending update', {
          timeSinceLastLocation: Math.round(timeSinceLastLocation / 1000) + 's',
          timeSinceLastUpdate: Math.round(timeSinceLastUpdate / 1000) + 's',
          willSend: timeSinceLastUpdate >= this.RATE_LIMIT_MS,
          lat: currentLocation.coords.latitude.toFixed(6),
          lng: currentLocation.coords.longitude.toFixed(6),
          counter: fallbackCounter
        });
        
        this.lastLocationReceived = Date.now();
        // handleLocationUpdate will respect rate limiting, so it's safe to call always
        this.handleLocationUpdate(currentLocation);
      } catch (error) {
        console.error('❌ Fallback location check failed:', {
          message: error.message,
          code: error.code,
          counter: fallbackCounter
        });
        // If fallback fails repeatedly, try restarting tracking
        const timeSinceLastLocation = Date.now() - (this.lastLocationReceived || 0);
        if (timeSinceLastLocation > 60000) {
          console.warn('⚠️ No location updates for 60+ seconds - attempting restart...');
          this.restartTracking();
        }
      }
    }, 11000); // Check every 11 seconds (slightly more than 10s rate limit)
    
    console.log('✅ Fallback interval started - will run every 11 seconds');
  }

  // Restart tracking if watch stops
  async restartTracking() {
    console.log('🔄 Restarting location tracking...');
    const currentTruckId = this.truckId;
    const wasTracking = this.isTracking;
    
    // Don't stop tracking completely - just restart the watch
    // This prevents gaps in tracking
    if (this.locationSubscription) {
      try {
        this.locationSubscription.remove();
      } catch (error) {
        console.warn('Error removing old subscription:', error);
      }
      this.locationSubscription = null;
    }
    
    // Restart if we had a truckId
    if (currentTruckId && wasTracking) {
      this.truckId = currentTruckId;
      // Temporarily set isTracking to false so startTracking can run
      this.isTracking = false;
      try {
        await this.startTracking();
        console.log('✅ Location tracking restarted successfully');
      } catch (error) {
        console.error('❌ Failed to restart tracking:', error);
        // Restore tracking state
        this.isTracking = wasTracking;
      }
    }
  }

  handleLocationUpdate(position) {
    const now = Date.now();
    
    // Don't send location if we don't have a truckId yet
    if (!this.truckId) {
      console.log('Waiting for truck assignment before sending location...');
      return;
    }

    // Check rate limit - if too soon, queue the update
    if (now - this.lastUpdate < this.RATE_LIMIT_MS) {
      // Store the latest position for when rate limit expires
      this.pendingLocation = position;
      return;
    }

    // If already sending, queue this update
    if (this.isSending) {
      this.pendingLocation = position;
      return;
    }

    const locationData = {
      truckId: this.truckId,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: position.coords.speed ? position.coords.speed * 3.6 : null,
      heading: position.coords.heading,
      timestamp: new Date().toISOString(),
    };

    // Set lastUpdate BEFORE sending to prevent race conditions
    this.lastUpdate = now;
    this.sendLocation(locationData, position);
  }

  async sendLocation(locationData, originalPosition = null) {
    // Prevent concurrent sends
    if (this.isSending) {
      console.log('⏭️ Location send already in progress, skipping...');
      return;
    }

    this.isSending = true;
    
    try {
      console.log('📤 Sending location update to server...', {
        truckId: locationData.truckId,
        lat: locationData.lat.toFixed(6),
        lng: locationData.lng.toFixed(6),
      });
      
      await trackingAPI.updateLocation(locationData);
      console.log('✅ Driver location sent successfully:', {
        truckId: locationData.truckId,
        lat: locationData.lat.toFixed(6),
        lng: locationData.lng.toFixed(6),
        timestamp: locationData.timestamp,
      });
      console.log('📡 This should trigger Socket.IO event on web map');
      
      // After successful send, check if there's a pending location
      // Wait for rate limit period before sending pending update
      if (this.pendingLocation) {
        const pending = this.pendingLocation;
        this.pendingLocation = null;
        
        // Wait for remaining rate limit time
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdate;
        const waitTime = Math.max(0, this.RATE_LIMIT_MS - timeSinceLastUpdate);
        
        if (waitTime > 0) {
          setTimeout(() => {
            this.handleLocationUpdate(pending);
          }, waitTime);
        } else {
          // Rate limit already passed, send immediately
          setTimeout(() => {
            this.handleLocationUpdate(pending);
          }, 100); // Small delay to prevent immediate re-send
        }
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || error.message;
      
      // Log error details for debugging
      console.error('❌ Error sending driver location:', {
        message: errorMessage,
        status: error.response?.status,
        truckId: locationData.truckId,
        timestamp: new Date().toISOString(),
      });
      
      // If rate limit error, wait and retry with the original position
      if (error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded, will retry after delay:', errorMessage);
        // Store the original position for retry (or use pending if available)
        if (originalPosition) {
          this.pendingLocation = originalPosition;
        }
        // Reset lastUpdate so we can retry after rate limit period
        // Subtract RATE_LIMIT_MS so next check will allow retry
        this.lastUpdate = Date.now() - this.RATE_LIMIT_MS;
        
        // Schedule retry after rate limit period
        setTimeout(() => {
          if (this.pendingLocation) {
            const pending = this.pendingLocation;
            this.pendingLocation = null;
            this.handleLocationUpdate(pending);
          }
        }, this.RATE_LIMIT_MS);
      } else if (error.response?.status === 401) {
        console.error('❌ Authentication error - token may have expired');
        // Don't retry auth errors
      } else {
        // For other errors, retry after a delay
        console.warn('⚠️ Will retry location send after delay...');
        if (originalPosition) {
          this.pendingLocation = originalPosition;
          // Retry after 5 seconds
          setTimeout(() => {
            if (this.pendingLocation && this.isTracking) {
              const pending = this.pendingLocation;
              this.pendingLocation = null;
              this.handleLocationUpdate(pending);
            }
          }, 5000);
        }
      }
    } finally {
      this.isSending = false;
    }
  }

  async setTruckId(truckId) {
    const wasTracking = this.isTracking;
    const previousTruckId = this.truckId;
    
    this.truckId = truckId;
    console.log('Truck ID set to:', truckId);
    
    // Update tracking data in AsyncStorage for background task
    if (truckId && this.driverId) {
      await AsyncStorage.setItem('tracking_data', JSON.stringify({
        truckId: truckId,
        driverId: this.driverId,
      }));
    }
    
    // If tracking wasn't started yet, start it now
    if (!wasTracking && truckId) {
      console.log('Starting location tracking for truck:', truckId);
      try {
        await this.startTracking();
      } catch (error) {
        console.error('Failed to start tracking after setting truckId:', error);
      }
    }
    
    // If truckId changed, restart tracking with new truck
    if (wasTracking && truckId && previousTruckId !== truckId) {
      console.log('Truck ID changed, restarting tracking...');
      await this.stopTracking();
      try {
        await this.startTracking();
      } catch (error) {
        console.error('Failed to restart tracking with new truckId:', error);
      }
    }
    
    // Get current location and send immediately when truck is assigned
    // But respect rate limiting
    if (this.isTracking && truckId) {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        // Use handleLocationUpdate to respect rate limiting
        this.handleLocationUpdate(currentLocation);
      } catch (error) {
        console.warn('Could not get immediate location after truck assignment:', error);
      }
    }
  }

  async stopTracking() {
    // Stop background location task
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('✅ Background location task stopped');
      }
    } catch (error) {
      console.warn('⚠️ Error stopping background location task:', error);
    }

    // Stop foreground watch
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Clear monitoring intervals
    if (this.watchCheckInterval) {
      clearInterval(this.watchCheckInterval);
      this.watchCheckInterval = null;
    }

    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }

    // Clear tracking data from AsyncStorage
    await AsyncStorage.removeItem('tracking_data');

    this.isTracking = false;
    this.truckId = null;
    this.driverId = null;
    this.lastLocationReceived = null;
    console.log('✅ Driver location tracking stopped');
  }

  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      truckId: this.truckId,
      driverId: this.driverId,
    };
  }
}

const driverLocationService = new DriverLocationService();
export default driverLocationService;
