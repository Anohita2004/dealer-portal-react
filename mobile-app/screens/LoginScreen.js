import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket } from '../services/socket';
import { getNetworkErrorMessage, isNetworkError } from '../utils/network';
import { API_BASE_URL } from '../utils/config';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          console.log('LoginScreen: User already authenticated, redirecting...');
          // User is authenticated - App.js will handle showing Main screen
          // Just trigger a navigation state change by going back and forth
          // Actually, we can't navigate to Main here because it doesn't exist yet
          // The App.js will detect the token on its next check
        }
      };
      checkAuth();
    }, [])
  );

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.login(username, password);

      console.log('Login response:', JSON.stringify(response, null, 2));

      // Check if OTP is required (backend returns { otpSent: true, userId: "..." })
      if (response.otpSent === true && response.userId) {
        console.log('OTP required, navigating to OTP screen with userId:', response.userId);
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerify', { userId: response.userId });
        return;
      }

      // If token is directly provided (no OTP required - some backends might skip OTP)
      if (response.token && response.user) {
        console.log('Direct token received, logging in...');
        // Store token and user data
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));

        // Initialize Socket.IO connection (don't wait - it's async)
        initSocket().catch(err => {
          console.warn('Socket initialization failed:', err);
          // Continue anyway - socket is optional
        });

        // Navigate to dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        console.error('Unexpected response format:', response);
        Alert.alert('Error', `Unexpected response from server: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error messages with platform-specific info
      let errorMessage = 'Login failed. Please try again.';
      
      if (isNetworkError(error)) {
        errorMessage = getNetworkErrorMessage(error);
        // Add API URL info for mobile debugging
        if (Platform.OS !== 'web') {
          errorMessage += `\n\nCurrent API URL: ${API_BASE_URL}`;
        }
      } else if (error.response?.status === 401) {
        // Check if backend provides a specific error message
        const backendError = error.response?.data?.error || error.response?.data?.message;
        if (backendError) {
          errorMessage = backendError;
        } else {
          errorMessage = 'Invalid username or password. Please check your credentials and try again.';
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Login endpoint not found. Check API URL configuration.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Log full error for debugging
      console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Dealer Portal</Text>
        <Text style={styles.subtitle}>Driver Login</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;

