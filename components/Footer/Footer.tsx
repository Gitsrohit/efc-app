import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Footer = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.footerContainer}>
      {/* DINEOUT Button */}
      <TouchableOpacity style={styles.menuItemLeft} onPress={() => navigation.navigate('Dineout')}>
        <MaterialIcons name="local-dining" size={24} color="black" />
        <Text style={styles.menuText}>DINEOUT</Text>
      </TouchableOpacity>

      {/* HOME Button */}
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <MaterialIcons name="home" size={24} color="yellow" />
        <Text style={styles.homeText}>HOME</Text>
      </TouchableOpacity>

      {/* SETTINGS Button */}
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
    backgroundColor: '#FFD600', // Yellow background
    justifyContent: 'space-between', // Space buttons across the row
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
    height: 80, // Adjusting footer height for proper layout
  },
  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B71C1C', // Red background for the HOME button
    borderRadius: 40,
    padding: 15,
    position: 'absolute',
    bottom: 10, // Position the HOME button slightly above the footer
    left: '50%',
    transform: [{ translateX: -35 }], // Center the HOME button horizontally
    width: 70,
    height: 70,
    elevation: 10, // For shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  homeText: {
    color: 'yellow',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
  },
  menuItemLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Ensure the menu button takes up equal space
  },
  menuItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Ensure the menu button takes up equal space
  },
  menuText: {
    color: 'black',
    fontSize: 12,
    marginTop: 5,
  },
});

export default Footer;
