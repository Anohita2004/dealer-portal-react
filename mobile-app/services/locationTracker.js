import * as Location from 'expo-location';
import { trackingAPI } from './api';
import { getSocket, trackTruck, onTruckStatusChange, offTruckStatusChange, onTrackingStarted, offTrackingStarted } from './socket';

class LocationTracker {
  constructor(truckId, assignmentId) {
    this.truckId = truckId;
    this.assignmentId = assignmentId;
    this.locationSubscription = null;
    this.lastUpdate = 0;
    this.RATE_LIMIT_MS = 10000; // 10 seconds
    this.isTracking = false;
    this.socket = null;
    this.statusChangeHandler = null;
    this.trackingStartedHandler = null;
  }

  // Initialize and check if tracking should be active
  async initialize() {
    try {
      // Get assignment status
      const { fleetAPI } = await import('./api');
      const response = await fleetAPI.getAssignmentById(this.assignmentId);
      const assignment = response.assignment || response;

      // Start tracking if status is "picked_up" or "in_transit"
      if (assignment.status === 'picked_up' || assignment.status === 'in_transit') {
        console.log('Assignment already picked up - starting GPS tracking');
        await this.startTracking();
      } else {
        // Listen for status changes via Socket.IO
        await this.setupSocketListener();
      }
    } catch (error) {
      console.error('Error initializing tracker:', error);
    }
  }

  // Setup Socket.IO to listen for pickup status
  async setupSocketListener() {
    this.socket = getSocket();
    
    if (!this.socket || !this.socket.connected) {
      const { initSocket } = await import('./socket');
      this.socket = await initSocket();
    }

    // Listen for status change to "picked_up" - then start tracking
    this.statusChangeHandler = (data) => {
      if (
        data.assignmentId === this.assignmentId &&
        (data.status === 'picked_up' || data.status === 'in_transit')
      ) {
        console.log('Pickup confirmed via Socket.IO - starting GPS tracking');
        this.startTracking();
      }
    };

    // Listen for tracking started event
    this.trackingStartedHandler = (data) => {
      if (data.assignmentId === this.assignmentId) {
        console.log('Tracking started event received - beginning GPS updates');
        this.startTracking();
      }
    };

    onTruckStatusChange(this.statusChangeHandler);
    onTrackingStarted(this.trackingStartedHandler);

    // Join truck tracking room
    trackTruck(this.truckId);
  }

  // Request location permissions
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Request background location for continuous tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted - tracking may be limited');
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  // Start GPS tracking
  async startTracking() {
    if (this.isTracking) {
      console.log('Tracking already active');
      return;
    }

    try {
      // Request permissions
      await this.requestPermissions();

      this.isTracking = true;
      console.log('Starting GPS location tracking...');

      // Configure location options
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 10, // 10 meters
        mayShowUserSettingsDialog: true,
      };

      // Start watching position
      this.locationSubscription = await Location.watchPositionAsync(
        locationOptions,
        (position) => {
          this.handleLocationUpdate(position);
        }
      );

      console.log('GPS tracking started successfully');
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      this.isTracking = false;
      throw error;
    }
  }

  // Handle location update
  handleLocationUpdate(position) {
    const now = Date.now();
    
    // Rate limiting
    if (now - this.lastUpdate < this.RATE_LIMIT_MS) {
      return;
    }

    const locationData = {
      truckId: this.truckId,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: position.coords.speed ? position.coords.speed * 3.6 : null, // Convert m/s to km/h
      heading: position.coords.heading,
      timestamp: new Date().toISOString(),
    };

    this.sendLocation(locationData);
    this.lastUpdate = now;
  }

  // Send location to backend
  async sendLocation(locationData) {
    try {
      await trackingAPI.updateLocation(locationData);
      console.log('Location sent successfully:', {
        lat: locationData.lat.toFixed(6),
        lng: locationData.lng.toFixed(6),
      });
    } catch (error) {
      console.error('Error sending location:', error);
      // Retry logic can be added here
    }
  }

  // Mark pickup (called when driver confirms pickup at warehouse)
  async markPickup() {
    try {
      const { fleetAPI } = await import('./api');
      const response = await fleetAPI.markPickup(this.assignmentId);

      console.log('Pickup marked successfully');
      
      // Start tracking immediately
      await this.startTracking();

      return response;
    } catch (error) {
      console.error('Error marking pickup:', error);
      throw error;
    }
  }

  // Mark delivered (stops tracking)
  async markDelivered() {
    try {
      const { fleetAPI } = await import('./api');
      const response = await fleetAPI.markDeliver(this.assignmentId);

      // Stop tracking when delivered
      this.stopTracking();

      return response;
    } catch (error) {
      console.error('Error marking delivered:', error);
      throw error;
    }
  }

  // Stop tracking
  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Remove socket listeners
    if (this.statusChangeHandler) {
      offTruckStatusChange();
      this.statusChangeHandler = null;
    }

    if (this.trackingStartedHandler) {
      offTrackingStarted();
      this.trackingStartedHandler = null;
    }

    this.isTracking = false;
    console.log('GPS tracking stopped');
  }

  // Get current tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      truckId: this.truckId,
      assignmentId: this.assignmentId,
    };
  }
}

export default LocationTracker;

