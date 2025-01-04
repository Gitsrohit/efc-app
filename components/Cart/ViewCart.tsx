import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [orderType, setOrderType] = useState(null);

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('User is not authenticated. Please log in.');
        return;
      }
      const response = await fetch('https://efc-app-1.onrender.com/api/v1/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCartData(data.data);
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch cart data');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch cart data');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while fetching cart data');
    }
  };

  const handlePlaceOrder = () => {
    if (!orderType) {
      Alert.alert('Error', 'Please select an order type');
      return;
    }

    Alert.alert('Success', `Your order has been placed for ${orderType}!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Cart is Ready!</Text>

      {/* Cart Items Section */}
      <View style={styles.cartContainer}>
        {cartData && cartData.items.length > 0 ? (
          <FlatList
            data={cartData.items}
            keyExtractor={(item) => item.itemId}
            ListHeaderComponent={() => (
              <View style={styles.cartHeader}>
                <Text style={styles.cartHeaderText}>Items</Text>
                <Text style={styles.cartHeaderText}>Quantity</Text>
                <Text style={styles.cartHeaderText}>Price</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Text style={styles.cartText}>{item.itemName}</Text>
                <Text style={styles.cartText}>{item.quantity}</Text>
                <Text style={styles.cartText}>{item.quantity * item.price}</Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noItemsText}>Your cart is empty</Text>
        )}
        {cartData && (
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalText}>Sub total:</Text>
            <Text style={styles.subtotalText}>{cartData.totalPrice}</Text>
          </View>
        )}
      </View>

      {/* Order Type Section */}
      <View style={styles.orderTypeContainer}>
        <Text style={styles.orderTypeLabel}>Order Type:</Text>
        <View style={styles.orderTypeOptions}>
          <TouchableOpacity
            style={[
              styles.orderTypeOption,
              orderType === 'Take Away' && styles.selectedOption,
            ]}
            onPress={() => setOrderType('Take Away')}
          >
            <Text style={styles.orderTypeText}>Take Away</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.orderTypeOption,
              orderType === 'Home Delivery' && styles.selectedOption,
            ]}
            onPress={() => setOrderType('Home Delivery')}
          >
            <Text style={styles.orderTypeText}>Home Delivery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Place Order Button */}
      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderText}>Place Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a00000', padding: 20, paddingTop: 40 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  cartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  cartHeaderText: {
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartText: {
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
  noItemsText: { textAlign: 'center', color: '#000', marginTop: 20 },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 10,
    marginTop: 10,
  },
  subtotalText: { fontWeight: 'bold', color: '#000' },
  orderTypeContainer: { marginBottom: 20 },
  orderTypeLabel: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  orderTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 10,
  },
  orderTypeOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedOption: { backgroundColor: '#a00000', borderColor: '#a00000' },
  orderTypeText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  placeOrderButton: {
    backgroundColor: '#a00000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderText: { color: '#fff', fontWeight: 'bold' },
});

export default Cart;
