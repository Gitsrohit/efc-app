import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './components/Home/HomeScreen';
import FoodByCategory from './components/Food/FoodByCategory';
import DineOut from './components/Dineout/DineOut';
import Footer from './components/Footer/Footer'; 
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
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
      </Stack.Navigator>

      {/* Place Footer here, outside the Stack.Navigator */}
      <Footer />
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
