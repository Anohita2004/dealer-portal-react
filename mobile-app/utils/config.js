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
  // Check environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Platform-specific defaults
  if (isWeb) {
    // Web: use localhost
    return 'http://localhost:3000/api';
  } else {
    // Mobile: use IP address (UPDATE THIS TO YOUR COMPUTER'S IP)
    // To find your IP: Windows: ipconfig | findstr IPv4
    //                   Mac/Linux: ifconfig | grep inet
    return 'http://192.168.29.61:3000/api';
  }
};

const getSocketURL = () => {
  // Check environment variable first
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  // Platform-specific defaults
  if (isWeb) {
    // Web: use localhost
    return 'http://localhost:3000';
  } else {
    // Mobile: use IP address (UPDATE THIS TO YOUR COMPUTER'S IP)
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

