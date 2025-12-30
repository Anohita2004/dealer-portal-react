import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure Socket.IO URL - change this to your backend URL
// For local development, use your computer's IP address instead of localhost
// Example: 'http://192.168.1.100:3000'
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ||'http://192.168.29.61:3000';

let socket = null;

// Initialize Socket.IO connection
export const initSocket = async () => {
  try {
    if (socket?.connected) {
      return socket;
    }

    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found - skipping socket initialization');
      return null;
    }
    
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', async () => {
      console.log('Socket connected');
      
      // Authenticate socket
      if (token) {
        socket.emit('authenticate', { token });
      }
    });

    socket.on('authenticated', ({ ok, user }) => {
      if (ok) {
        console.log('Socket authenticated for user:', user);
      } else {
        console.error('Socket authentication failed');
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Don't throw - socket is optional
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
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
