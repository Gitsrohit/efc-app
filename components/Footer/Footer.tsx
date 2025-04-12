import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const Footer = () => {
  const navigation = useNavigation();
  
  // Only show footer on these screens
  const showFooterScreens = ['Home', 'FoodByCategory', 'DineOut', 'MyOrders'];
  const currentRoute = navigation.getState()?.routes[navigation.getState().index]?.name;

  if (!showFooterScreens.includes(currentRoute)) {
    return null;
  }

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity style={styles.menuItemLeft} onPress={() => navigation.navigate('DineOut')}>
        <MaterialIcons name="local-dining" size={24} color="black" />
        <Text style={styles.menuText}>DINEOUT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItemCenter} onPress={() => navigation.navigate('Home')}>
        <MaterialIcons name="home" size={24} color="black" />
        <Text style={styles.homeText}>HOME</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItemRight} onPress={() => navigation.navigate('MyOrders')}>
        <MaterialIcons name="list-alt" size={24} color="black" />
        <Text style={styles.menuText}>ORDERS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFD600', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
  },
  menuItemCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, 
    padding: 15, 
  },
  menuItemLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, 
  },
  menuItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, 
  },
  menuText: {
    color: 'black',
    fontSize: 12,
    marginTop: 5,
  },
  homeText: {
    color: 'black', 
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
  },
});

export default Footer;