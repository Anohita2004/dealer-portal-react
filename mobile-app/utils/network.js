import { Platform } from 'react-native';
import { API_BASE_URL } from './config';

/**
 * Network utility functions
 */

/**
 * Test if the API server is reachable
 */
export const testConnection = async () => {
  try {
    const url = API_BASE_URL.replace('/api', '/health');
    const response = await fetch(url, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error('[Network] Connection test failed:', error);
    return false;
  }
};

/**
 * Get network error message based on platform
 */
export const getNetworkErrorMessage = (error) => {
  const isWeb = Platform.OS === 'web';
  
  if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
    if (isWeb) {
      return 'Cannot connect to server. Make sure the backend is running on port 3000.';
    } else {
      return `Cannot connect to server. Please check:\n\n1. Backend server is running\n2. API URL is correct: ${API_BASE_URL}\n3. Phone and computer are on same Wi-Fi\n4. Firewall allows port 3000`;
    }
  }
  
  if (error.response?.status === 404) {
    return 'Server endpoint not found. Check API URL configuration.';
  }
  
  if (error.response?.status === 401) {
    return 'Authentication failed. Please login again.';
  }
  
  return error.message || 'Network error occurred';
};

/**
 * Check if error is a network connectivity issue
 */
export const isNetworkError = (error) => {
  return (
    error.message === 'Network Error' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    !error.response
  );
};

export default {
  testConnection,
  getNetworkErrorMessage,
  isNetworkError,
};

