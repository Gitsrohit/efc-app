import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const Footer = () => {
  const navigation = useNavigation(); 

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity style={styles.menuItemLeft} onPress={() => navigation.navigate('DineOut')}>
        <MaterialIcons name="local-dining" size={24} color="black" />
        <Text style={styles.menuText}>DINEOUT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItemCenter} onPress={() => navigation.navigate('Home')}>
        <MaterialIcons name="home" size={24} color="black" /> {/* Changed to black */}
        <Text style={styles.homeText}>HOME</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItemRight} onPress={() => navigation.navigate('Settings')}>
        <MaterialIcons name="settings" size={24} color="black" />
        <Text style={styles.menuText}>SETTINGS</Text>
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
    position: 'relative',
    height: 80, 
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
