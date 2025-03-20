import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [googleAuthUrl, setGoogleAuthUrl] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  
  const navigation = useNavigation();

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSignup = async () => {
    const { name, email, password, confirmPassword, phone } = formData;

    if (!name || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const response = await fetch(
        'https://efc-app-1.onrender.com/api/v1/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password, confirmPassword, phone }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', 'Signup successful!');
        console.log(data);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
      console.error(error);
    }
  };

  const getGoogleAuthUrl = async () => {
    try {
      const apiUrl = 'https://efc-app-1.onrender.com/api/v1/auth/google-login';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Google Auth URL:', data);
        setGoogleAuthUrl(data.data);
        Linking.openURL(data.data);
      } else {
        console.error('API Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error during Google Signup:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require('/Users/iceberg/efcApk/assets/images/images.jpeg')}
          style={styles.logo}
        />
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.heading}>Signup</Text>

        {/* Form Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Name"
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Confirm Password"
            style={styles.input}
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Phone"
            style={styles.input}
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
          />
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Signup</Text>
        </TouchableOpacity>
         <View style={styles.loginRedirectContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Login</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.googleButton} onPress={getGoogleAuthUrl}>
          <Text style={styles.googleButtonText}>Sign up with Google</Text>
        </TouchableOpacity>

        {userInfo && (
          <View style={styles.userInfo}>
            <Text>Welcome, {userInfo.user.name}</Text>
            <Text>Email: {userInfo.user.email}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a00000' },
  logoContainer: { alignItems: 'center', marginTop: 80 },
  logo: { width: 120, height: 120, borderRadius: 60, resizeMode: 'cover' },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  heading: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  inputContainer: { marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    color: '#000',
  },
  signupButton: {
    backgroundColor: '#a00000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  signupButtonText: { color: '#fff', fontWeight: 'bold' },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  googleButtonText: { color: '#fff', fontWeight: 'bold' },
  userInfo: { marginTop: 20, alignItems: 'center' },
  loginRedirectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: { fontSize: 16, color: '#000' },
  loginLink: { fontSize: 16, color: '#007BFF' },
});

export default Signup;