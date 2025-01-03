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
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useNavigation } from '@react-navigation/native'; 

const Login = () => {
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
  
    try {
      const response = await fetch(
        'https://efc-app-1.onrender.com/api/v1/auth/login',
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
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('/Users/iceberg/efcApk/assets/images/images.jpeg')}
          style={styles.logo}
        />
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.heading}>Login</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={loginData.username}
            onChangeText={(value) => handleInputChange('username', value)}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            value={loginData.password}
            onChangeText={(value) => handleInputChange('password', value)}
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
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
  loginButton: {
    backgroundColor: '#a00000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default Login;
