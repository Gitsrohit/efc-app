import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView, // Use SafeAreaView for better handling of notches/status bars
  KeyboardAvoidingView, // For better keyboard handling
  Platform, // To check the platform for KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Login = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const navigation = useNavigation();

  const handleInputChange = (key, value) => {
    setLoginData({ ...loginData, [key]: value });
  };

  const handleLogin = async () => {
    const { username, password } = loginData;

    if (!username || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    // --- Login API Call (kept as is) ---
    try {
      const response = await fetch(
        'https://efc-user-backend.onrender.com/api/v1/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { token, user } = data.data;

        if (token && user) {
          const userId = user.id;
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userId', userId);

          Alert.alert('Success', 'Login successful!');
          console.log('Token and UserID saved:', token, userId);
          navigation.navigate('Home');
          onLoginSuccess();
        } else {
          Alert.alert('Error', 'Token or UserID missing in the response');
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Top Section with Logo/Branding */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/images.jpeg')}
              style={styles.logo}
            />
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>Sign in to continue</Text>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                value={loginData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                secureTextEntry
                value={loginData.password}
                onChangeText={(value) => handleInputChange('password', value)}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </TouchableOpacity>

            {/* Optional: Forgot Password Link */}
            <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Forgot Password')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Use white for the entire screen background
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30, // Global padding for a cleaner look
  },
  // --- Logo Section ---
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 50, // More vertical padding for breathing room
  },
  logo: {
    width: 80, // Slightly smaller logo for sophistication
    height: 80,
    borderRadius: 50, // Squared corners with a slight radius
    resizeMode: 'cover',
  },
  // --- Form Section ---
  formContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700', // Bolder heading
    color: '#333333',
    marginBottom: 5,
  },
  subheading: {
    fontSize: 16,
    color: '#A0A0A0', // Subtle grey text
    marginBottom: 40, // Increased space below subheading
  },
  inputWrapper: {
    marginBottom: 25, // More space between inputs
  },
  input: {
    borderBottomWidth: 1, // Use a subtle bottom border instead of a full border
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12, // Increased padding
    fontSize: 16,
    color: '#333333', // Dark text color for readability
  },
  // --- Button Section ---
  loginButton: {
    backgroundColor: '#a00000', // Keep the brand color
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30, // Space above the button
    // Optional: Add a subtle shadow for a "lifted" look
    shadowColor: '#a00000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // for Android
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1, // Subtle letter spacing for a professional look
  },
  // --- Forgot Password ---
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#A0A0A0',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default Login;