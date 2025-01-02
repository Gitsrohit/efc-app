import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; 

const DineOut = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.profileIconContainer}>
          <Icon
            name="user" 
            size={30}
            color="#FFF"
          />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#B71C1C"
          />
        </View>

        <TouchableOpacity style={styles.cartIconContainer}>
          <Icon
            name="shopping-cart" 
            size={30}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <ImageBackground
          source={require('/Users/iceberg/efcApk/assets/images/cabin.jpeg')}
          style={styles.customCard}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <Text style={styles.greenZoneText}>CABINS</Text>
          <TouchableOpacity style={styles.bookNowButton}>
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </ImageBackground>

        <ImageBackground
          source={require('/Users/iceberg/efcApk/assets/images/greenzone.jpeg')}
          style={styles.customCard}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <Text style={styles.greenZoneText}>GREEN ZONE</Text>
          <TouchableOpacity style={styles.bookNowButton}>
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </ImageBackground>

        <ImageBackground
          source={require('/Users/iceberg/efcApk/assets/images/hall.jpeg')}
          style={styles.customCard}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <Text style={styles.greenZoneText}>HALL</Text>
          <TouchableOpacity style={styles.bookNowButton}>
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B71C1C',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileIconContainer: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 8,
  },
  cartIconContainer: {
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customCard: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40, 
    borderWidth: 2,
    borderColor: '#baff79',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    opacity: 0.4,
    borderRadius: 12,
  },
  greenZoneText: {
    color: '#FFEB3B',
    fontSize: 24,
    fontWeight: '900',
    zIndex: 1,
  },
  bookNowButton: {
    backgroundColor: '#FFEB3B',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    position: 'absolute',
    bottom: 10,
  },
  bookNowText: {
    color: '#B71C1C',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default DineOut;
