import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './components/Home/HomeScreen';
import FoodByCategory from './components/Food/FoodByCategory';
import Footer from './components/Footer/Footer'; // Import Footer component
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

const App = () => {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator>
          {/* Home Screen */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          {/* FoodByCategory Screen */}
          <Stack.Screen name="FoodByCategory" component={FoodByCategory} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      {/* Add Footer */}
      <Footer />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
