import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSocket } from '../services/socket';

const OTPVerifyScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.verifyOTP(userId, otp);

      // Store token and user data
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      console.log('OTP verified successfully, token stored');

      // Initialize Socket.IO connection (don't wait - it's async)
      initSocket().catch(err => {
        console.warn('Socket initialization failed:', err);
        // Continue anyway - socket is optional
      });

      // Navigate back to Login - App.js will detect the token within 2 seconds
      // and automatically re-render with Main screen
      console.log('Navigating back to Login - App.js will auto-redirect to Main');
      navigation.goBack();
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.background}>
        <View style={styles.gradientOverlay} />
      </View>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <Icon name="verified-user" size={48} color="#4A90E2" />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your email
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#ccc"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <View style={styles.otpDots}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.otpDot,
                    otp.length > index && styles.otpDotFilled,
                  ]}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || otp.length !== 6) && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verify Code</Text>
                <Icon name="check-circle" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={18} color="#fff" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: '#764ba2',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '300',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  otpContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  otpDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  otpDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  otpDotFilled: {
    opacity: 1,
    backgroundColor: '#4A90E2',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  backButton: {
    marginTop: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backButtonIcon: {
    marginRight: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
});

export default OTPVerifyScreen;

