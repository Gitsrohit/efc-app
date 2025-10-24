import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const OrderConfirmedScreen = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#a00000', '#800000']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="checkmark-circle-outline" size={100} color="#FFD700" />
        </View>
        
        <Text style={styles.heading}>Order Confirmed!</Text>
        <Text style={styles.subHeading}>Thank you for your purchase.</Text>
        <Text style={styles.subText}>Your order is being processed and will be delivered shortly.</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
          <Icon name="home-outline" size={20} color="#a00000" style={styles.buttonIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('MyOrders')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>View My Orders</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a00000',
    marginRight: 10,
  },
  buttonIcon: {
    marginTop: 2,
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
});

export default OrderConfirmedScreen;