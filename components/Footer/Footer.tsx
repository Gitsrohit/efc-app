import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Footer = () => {
  const navigation = useNavigation();
  
  const showFooterScreens = ['Home', 'FoodByCategory', 'DineOut', 'MyOrders'];
  const currentRoute = navigation.getState()?.routes[navigation.getState().index]?.name;

  if (!showFooterScreens.includes(currentRoute)) {
    return null;
  }
  const isActive = (routeName) => currentRoute === routeName;
  
  // Custom Menu Item Component
  const MenuItem = ({ name, iconName, label, routeName }) => (
    <TouchableOpacity 
      style={enhancedStyles.menuItem} 
      onPress={() => navigation.navigate(routeName)}
      activeOpacity={0.7}
    >
      <View style={enhancedStyles.iconWrapper}>
        <Icon 
          name={iconName} 
          size={24} 
          color={isActive(routeName) ? '#FFD700' : 'rgba(255, 255, 255, 0.7)'}
        />
      </View>
      <Text style={[
        enhancedStyles.menuText, 
        isActive(routeName) && enhancedStyles.activeMenuText
      ]}>
        {label}
      </Text>
      {isActive(routeName) && <View style={enhancedStyles.activeIndicator} />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#a00000', '#600000']} 
      style={enhancedStyles.footerContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <MenuItem 
        name="DineOut" 
        iconName="restaurant-outline" 
        label="DINE OUT" 
        routeName="DineOut" 
      />
      <MenuItem 
        name="Home" 
        iconName="home-outline" 
        label="HOME" 
        routeName="Home" 
      />
      <MenuItem 
        name="MyOrders" 
        iconName="receipt-outline" 
        label="ORDERS" 
        routeName="MyOrders" 
      />
    </LinearGradient>
  );
};

const enhancedStyles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 25, 
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    width: width,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, 
    position: 'relative',
    paddingVertical: 5,
  },
  iconWrapper: {
    marginBottom: 4,
  },
  menuText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  activeMenuText: {
    color: '#FFD700',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 30, 
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 1.5,
  }
});

export default Footer;