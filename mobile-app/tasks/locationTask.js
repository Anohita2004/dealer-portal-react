import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('❌ Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      console.log('📍 Background location received:', {
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        timestamp: new Date().toISOString(),
      });

      try {
        // Get truckId from AsyncStorage
        const user = await AsyncStorage.getItem('user');
        if (!user) {
          console.warn('⚠️ No user data in background task');
          return;
        }

        const userData = JSON.parse(user);
        
        // Get truckId - we need to store it in AsyncStorage when tracking starts
        const trackingData = await AsyncStorage.getItem('tracking_data');
        if (!trackingData) {
          console.warn('⚠️ No tracking data in background task');
          return;
        }

        const { truckId } = JSON.parse(trackingData);
        if (!truckId) {
          console.warn('⚠️ No truckId in background task');
          return;
        }

        // Get auth token
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No auth token in background task');
          return;
        }

        // Send location update
        const locationData = {
          truckId: truckId,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          speed: location.coords.speed ? location.coords.speed * 3.6 : null,
          heading: location.coords.heading,
          timestamp: new Date().toISOString(),
        };

        // Make API call directly (can't use api service in background task)
        await axios.post(
          `${API_BASE_URL}/api/tracking/location`,
          locationData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        console.log('✅ Background location sent successfully:', {
          truckId: locationData.truckId,
          lat: locationData.lat.toFixed(6),
          lng: locationData.lng.toFixed(6),
        });
      } catch (error) {
        console.error('❌ Error sending background location:', error.message);
      }
    }
  }
});

export default LOCATION_TASK_NAME;

