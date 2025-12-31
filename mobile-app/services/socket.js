import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../utils/config';

let socket = null;

// Initialize Socket.IO connection
export const initSocket = async () => {
  try {
    if (socket?.connected) {
      console.log('Socket already connected');
      return socket;
    }

    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found - skipping socket initialization');
      return null;
    }
    
    console.log('Initializing socket connection to:', SOCKET_URL);
    
    // Create socket with timeout and better error handling
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
      forceNew: false, // Reuse existing connection if available
      autoConnect: true,
    });

    // Set up event handlers before connecting
    socket.on('connect', async () => {
      console.log('✅ Socket connected:', socket.id);
      
      // Authenticate socket
      if (token) {
        socket.emit('authenticate', { token });
      }
    });

    socket.on('authenticated', ({ ok, user }) => {
      if (ok) {
        console.log('✅ Socket authenticated for user:', user?.username || user?.id);
      } else {
        console.error('❌ Socket authentication failed');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message || error);
      // Don't throw - socket is optional
      // The socket will automatically retry based on reconnection settings
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.warn('⚠️ Socket reconnection error:', error.message || error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed - giving up');
    });

    // Return socket immediately (connection happens asynchronously)
    return socket;
  } catch (error) {
    console.error('❌ Error initializing socket:', error);
    // Return null instead of throwing - socket is optional
    return null;
  }
};

// Get current socket instance
export const getSocket = () => socket;

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Track a specific truck
export const trackTruck = (truckId) => {
  if (socket?.connected) {
    socket.emit('track_truck', { truckId });
  }
};

// Track a specific order
export const trackOrder = (orderId) => {
  if (socket?.connected) {
    socket.emit('track_order', { orderId });
  }
};

// Untrack truck
export const untrackTruck = (truckId) => {
  if (socket?.connected) {
    socket.emit('untrack_truck', { truckId });
  }
};

// Untrack order
export const untrackOrder = (orderId) => {
  if (socket?.connected) {
    socket.emit('untrack_order', { orderId });
  }
};

// Listen to truck location updates
export const onTruckLocationUpdate = (callback) => {
  if (socket) {
    socket.on('truck:location:update', callback);
  }
};

// Remove truck location update listener
export const offTruckLocationUpdate = () => {
  if (socket) {
    socket.off('truck:location:update');
  }
};

// Listen to truck status changes
export const onTruckStatusChange = (callback) => {
  if (socket) {
    socket.on('truck:status:change', callback);
  }
};

// Remove truck status change listener
export const offTruckStatusChange = () => {
  if (socket) {
    socket.off('truck:status:change');
  }
};

// Listen to order tracking updates
export const onOrderTrackingUpdate = (callback) => {
  if (socket) {
    socket.on('order:tracking:update', callback);
  }
};

// Remove order tracking update listener
export const offOrderTrackingUpdate = () => {
  if (socket) {
    socket.off('order:tracking:update');
  }
};

// Listen to tracking started event
export const onTrackingStarted = (callback) => {
  if (socket) {
    socket.on('order:tracking:started', callback);
  }
};

// Remove tracking started listener
export const offTrackingStarted = () => {
  if (socket) {
    socket.off('order:tracking:started');
  }
};
