import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Signup from './components/authentication/Signup';
import Login from './components/authentication/Login';
import HomeScreen from './components/Home/HomeScreen';
import FoodByCategory from './components/Food/FoodByCategory';
import DineOut from './components/Dineout/DineOut';
import Footer from './components/Footer/Footer';
import ViewCart from './components/Cart/ViewCart'
import { StatusBar } from 'expo-status-bar';
const Stack = createStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        setIsAuthenticated(!!user); 
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuth();
  }, []);

  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (state) {
          const route = state.routes[state.index]?.name;
          setCurrentRoute(route); 
        }
      }}
    >
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'Signup'}>
        <Stack.Screen
          name="Signup"
          component={Signup}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FoodByCategory"
          component={FoodByCategory}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DineOut"
          component={DineOut}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="ViewCart"
          component={ViewCart}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      {['Home', 'FoodByCategory', 'DineOut'].includes(currentRoute) && <Footer />}
    </NavigationContainer>
  );
};

export default App;
