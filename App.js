import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Signup from './components/authentication/Signup';
import Login from './components/authentication/Login';
import HomeScreen from './components/Home/HomeScreen';
import FoodByCategory from './components/Food/FoodByCategory';
import DineOut from './components/Dineout/DineOut';
import Footer from './components/Footer/Footer';
import ViewCart from './components/Cart/ViewCart';
import MyOrders from './components/Sidebar/MyOrders';
import Checkout from './components/Order/Checkout';
import { StatusBar } from 'expo-status-bar';
import OrderConfirmed from './components/Order/OrderConfirmedScreen';

const Stack = createStackNavigator();

// Create navigation reference
export const navigationRef = React.createRef();

export const AuthContext = React.createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: async () => {},
});

const ScreenWithFooter = ({ children }) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
      <Footer />
    </View>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setIsAuthenticated(false);
      // Reset navigation stack to Login screen
      navigationRef.current?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true);
          // If authenticated and not already on Home, navigate to Home
          if (navigationRef.current?.getCurrentRoute()?.name !== 'Home') {
            navigationRef.current?.navigate('Home');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuth();
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout }}>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator 
            initialRouteName={isAuthenticated ? 'Home' : 'Login'}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="Login">
              {(props) => (
                <Login 
                  {...props} 
                  onLoginSuccess={() => {
                    setIsAuthenticated(true);
                    navigationRef.current?.navigate('Home');
                  }}
                />
              )}
            </Stack.Screen>
            
            {/* Authenticated screens */}
            <Stack.Screen name="Home">
              {(props) => (
                <ScreenWithFooter>
                  <HomeScreen {...props} />
                </ScreenWithFooter>
              )}
            </Stack.Screen>
            <Stack.Screen name="FoodByCategory">
              {(props) => (
                <ScreenWithFooter>
                  <FoodByCategory {...props} />
                </ScreenWithFooter>
              )}
            </Stack.Screen>
            <Stack.Screen name="DineOut">
              {(props) => (
                <ScreenWithFooter>
                  <DineOut {...props} />
                </ScreenWithFooter>
              )}
            </Stack.Screen>
            <Stack.Screen name="ViewCart" component={ViewCart} />
            <Stack.Screen name="Checkout" component={Checkout} />
            <Stack.Screen name="OrderConfirmed" component={OrderConfirmed} />
            <Stack.Screen name="MyOrders">
              {(props) => (
                <ScreenWithFooter>
                  <MyOrders {...props} />
                </ScreenWithFooter>
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </AuthContext.Provider>
  );
};

export default App;