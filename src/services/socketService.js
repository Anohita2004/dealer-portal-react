// src/services/socketService.js
// Comprehensive Socket.IO service matching the Frontend Integration Guide
import { io } from 'socket.io-client';
import {
  connectSocket,
  getSocket,
  onTruckLocationUpdate,
  onTruckTrackingStarted,
  onTruckWarehouseArrived,
  onTruckWarehouseApproaching,
  onTruckEtaUpdated,
  onOrderTrackingUpdate,
  onTrackingStarted,
  onNotification,
  offTruckLocationUpdate,
  offTruckTrackingStarted,
  offTruckWarehouseArrived,
  offTruckWarehouseApproaching,
  offTruckEtaUpdated,
  offOrderTrackingUpdate,
  offTrackingStarted,
  offNotification
} from './socket';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

/**
 * Initialize Socket.IO connection with authentication
 * This matches the Quick Start Guide structure
 */
export const initializeSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('No token found, cannot initialize socket');
    return null;
  }

  // Connect socket (will use existing connection if already connected)
  const socket = connectSocket();

  if (socket) {
    socket.on('connect', () => {
      console.log('🔌 Socket.IO Connected:', socket.id);
      // Authenticate with token
      socket.emit('authenticate', { token });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  return socket;
};

/**
 * Setup all location tracking event listeners
 * This matches the Quick Start Guide event structure
 */
export const setupLocationTrackingListeners = (callbacks = {}) => {
  const {
    onLocationUpdate,
    onTrackingStarted,
    onWarehouseArrived,
    onWarehouseApproaching,
    onEtaUpdated,
    onOrderTrackingUpdate,
    onOrderTrackingStarted,
    onNotificationReceived
  } = callbacks;

  // Listen for location updates
  if (onLocationUpdate) {
    onTruckLocationUpdate((data) => {
      console.log('Location update:', data);
      // data includes: truckId, driverPhone, lat, lng, speed, heading, status, eta, warehouseProximity
      onLocationUpdate(data);
    });
  }

  // Listen for tracking started
  if (onTrackingStarted) {
    onTruckTrackingStarted((data) => {
      console.log('Tracking started:', data);
      // data includes: assignmentId, orderId, startLocation, warehouse
      onTrackingStarted(data);
    });
  }

  // Listen for warehouse arrival (geofencing detected)
  if (onWarehouseArrived) {
    onTruckWarehouseArrived((data) => {
      console.log('Warehouse arrived:', data);
      // data includes: assignmentId, orderId, driverName, warehouse
      onWarehouseArrived(data);
    });
  }

  // Listen for warehouse approaching
  if (onWarehouseApproaching) {
    onTruckWarehouseApproaching((data) => {
      console.log('Approaching warehouse:', data);
      // data includes: assignmentId, distanceMeters, warehouse
      onWarehouseApproaching(data);
    });
  }

  // Listen for ETA updates
  if (onEtaUpdated) {
    onTruckEtaUpdated((data) => {
      console.log('ETA updated:', data);
      // data includes: assignmentId, eta, durationText, distanceText
      onEtaUpdated(data);
    });
  }

  // Listen for order tracking updates
  if (onOrderTrackingUpdate) {
    onOrderTrackingUpdate((data) => {
      console.log('Order tracking update:', data);
      // data: { orderId, assignment: { driverPhone, ... }, currentLocation }
      onOrderTrackingUpdate(data);
    });
  }

  // Listen for order tracking started
  if (onOrderTrackingStarted) {
    onTrackingStarted((data) => {
      console.log('Order tracking started:', data);
      // data: { orderId, assignmentId, truckId, driverPhone }
      onOrderTrackingStarted(data);
    });
  }

  // Listen for notifications
  if (onNotificationReceived) {
    onNotification((data) => {
      console.log('New notification:', data);
      // data: { id, title, message, type, priority, actionUrl }
      onNotificationReceived(data);
    });
  }
};

/**
 * Cleanup all location tracking listeners
 */
export const cleanupLocationTrackingListeners = () => {
  offTruckLocationUpdate();
  offTruckTrackingStarted();
  offTruckWarehouseArrived();
  offTruckWarehouseApproaching();
  offTruckEtaUpdated();
  offOrderTrackingUpdate();
  offTrackingStarted();
  offNotification();
};

/**
 * Get socket instance
 */
export const getSocketInstance = () => getSocket();

/**
 * Check if socket is connected
 */
export const isConnected = () => {
  const socket = getSocket();
  return socket?.connected || false;
};

export default {
  initializeSocket,
  setupLocationTrackingListeners,
  cleanupLocationTrackingListeners,
  getSocketInstance,
  isConnected
};

