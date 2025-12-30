import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL - change this to your backend URL
// For local development, use your computer's IP address instead of localhost
// Example: 'http://192.168.1.100:3000/api'
// To find your IP: Windows: ipconfig | findstr IPv4 | Mac/Linux: ifconfig | grep inet
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ||'http://192.168.29.61:3000/api';

// Log API URL for debugging (remove in production)
if (__DEV__) {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigate to login (handled by navigation)
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (username, password) => {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      console.log('Login payload:', { username, password: '***' }); // Don't log password
      const response = await api.post('/auth/login', { username, password });
      console.log('Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        requestData: error.config?.data, // Log what was sent
      });
      throw error;
    }
  },
  
  verifyOTP: async (userId, otp) => {
    try {
      console.log('Verifying OTP for userId:', userId);
      const response = await api.post('/auth/verify-otp', { userId, otp });
      console.log('OTP verification successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
  
  getProfile: () =>
    api.get('/auth/profile').then((r) => r.data),
};

// Fleet Assignment APIs
export const fleetAPI = {
  getMyAssignments: (params) => {
    // Convert status array to comma-separated string if needed
    const processedParams = { ...params };
    if (Array.isArray(processedParams.status)) {
      processedParams.status = processedParams.status.join(',');
    }
    
    console.log('Fetching assignments with params:', processedParams);
    return api.get('/fleet/assignments', { params: processedParams })
      .then((r) => {
        console.log('Assignments response:', r.data);
        return r.data;
      })
      .catch((error) => {
        console.error('Fleet assignments API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw error;
      });
  },
  
  getAssignmentById: (id) =>
    api.get(`/fleet/assignments/${id}`).then((r) => r.data),
  
  markPickup: (id) =>
    api.post(`/fleet/assignments/${id}/pickup`).then((r) => r.data),
  
  markDeliver: (id) =>
    api.post(`/fleet/assignments/${id}/deliver`).then((r) => r.data),
  
  updateStatus: (id, status, notes) =>
    api.patch(`/fleet/assignments/${id}/status`, { status, notes }).then((r) => r.data),
};

// Tracking APIs
export const trackingAPI = {
  updateLocation: (locationData) =>
    api.post('/tracking/location', locationData).then((r) => r.data),
  
  getOrderTracking: (orderId) =>
    api.get(`/tracking/order/${orderId}`).then((r) => r.data),
  
  getLiveLocations: () =>
    api.get('/tracking/live').then((r) => r.data),
};

// Truck APIs
export const truckAPI = {
  getMyTruck: () =>
    api.get('/trucks/my').then((r) => r.data),
  
  getTruckById: (id) =>
    api.get(`/trucks/${id}`).then((r) => r.data),
};

export default api;

