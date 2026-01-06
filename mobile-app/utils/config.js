import { Platform } from 'react-native';

/**
 * Platform-aware configuration
 * Web uses localhost, mobile uses IP address
 */

// Detect if running on web
const isWeb = Platform.OS === 'web';

// For web: use localhost (works because browser is on same machine)
// For mobile: use IP address (device needs to reach computer on network)
const getBaseURL = () => {
  // Check environment variable first (for production builds)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Platform-specific defaults
  if (isWeb) {
    // Web: use localhost
    return 'http://localhost:3000/api';
  } else {
    // Mobile: For standalone APK, you MUST set EXPO_PUBLIC_API_URL environment variable
    // This default is only for development/testing with Expo Go on same WiFi
    // For production APK, use environment variable pointing to your public server
    console.warn('⚠️ Using default local IP. For standalone APK, set EXPO_PUBLIC_API_URL environment variable to your public server URL');
    return 'http://192.168.29.61:3000/api';
  }
};

const getSocketURL = () => {
  // Check environment variable first (for production builds)
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  // Platform-specific defaults
  if (isWeb) {
    // Web: use localhost
    return 'http://localhost:3000';
  } else {
    // Mobile: For standalone APK, you MUST set EXPO_PUBLIC_SOCKET_URL environment variable
    // This default is only for development/testing with Expo Go on same WiFi
    // For production APK, use environment variable pointing to your public server
    console.warn('⚠️ Using default local IP. For standalone APK, set EXPO_PUBLIC_SOCKET_URL environment variable to your public server URL');
    return 'http://192.168.29.61:3000';
  }
};

export const API_BASE_URL = getBaseURL();
export const SOCKET_URL = getSocketURL();

// Log configuration for debugging
if (__DEV__) {
  console.log('📱 Platform:', Platform.OS);
  console.log('🌐 Is Web:', isWeb);
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('🔌 Socket URL:', SOCKET_URL);
}

export default {
  API_BASE_URL,
  SOCKET_URL,
  isWeb,
  platform: Platform.OS,
};

