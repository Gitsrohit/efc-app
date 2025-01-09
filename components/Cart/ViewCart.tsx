import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

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
          const itemsWithAnimation = data.data.items.map((item) => ({
            ...item,
            animationValue: new Animated.Value(1), // Add animation value for each item
          }));
          setCartData({ ...data.data, items: itemsWithAnimation });
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

  const handleRemoveItem = async (itemId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'User is not authenticated. Please log in.');
        return;
      }

      const response = await fetch(`https://efc-app-1.onrender.com/api/v1/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const itemIndex = cartData.items.findIndex((item) => item.itemId === itemId);
          if (itemIndex !== -1) {
            const itemToRemove = cartData.items[itemIndex];
            Animated.timing(itemToRemove.animationValue, {
              toValue: 0, 
              duration: 300, 
              useNativeDriver: true, 
            }).start(() => {
              setCartData((prevState) => ({
                ...prevState,
                items: prevState.items.filter((item) => item.itemId !== itemId),
              }));
            });
          }
        } else {
          Alert.alert('Error', data.message || 'Failed to remove item');
        }
      } else {
        Alert.alert('Error', 'Failed to remove item');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while removing the item');
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
      <Text style={styles.heading}>Your Cart</Text>

      <View style={styles.cartContainer}>
        {cartData && cartData.items.length > 0 ? (
          <FlatList
            data={cartData.items}
            keyExtractor={(item) => item.itemId}
            renderItem={({ item }) => (
              <Animated.View
                style={[
                  styles.cartItem,
                  {
                    opacity: item.animationValue,
                    transform: [
                      {
                        translateX: item.animationValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [500, 0], 
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                  <Text style={styles.itemPrice}>Price: ₹{item.quantity * item.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.itemId)}
                >
                  <Icon name="trash" size={20} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        ) : (
          <Text style={styles.noItemsText}>Your cart is empty</Text>
        )}

        {cartData && (
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalText}>Subtotal:</Text>
            <Text style={styles.subtotalText}>₹{cartData.totalPrice}</Text>
          </View>
        )}
      </View>

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

      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderText}>Place Order 🛵</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#B71C1C', padding: 20, paddingTop: 40 },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  cartContainer: { flex: 1, backgroundColor: '#fffd81', borderRadius: 10, padding: 15, borderColor: '#fff', borderWidth: 1, },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemQuantity: { fontSize: 14, color: '#666', marginTop: 5 },
  itemPrice: { fontSize: 14, color: '#333', marginTop: 5 },
  removeButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noItemsText: { textAlign: 'center', color: '#999', marginTop: 20 },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  subtotalText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderTypeContainer: { marginTop: 20 },
  orderTypeLabel: { fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  orderTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
  },
  orderTypeOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  orderTypeText: { color: '#333', fontWeight: 'bold', textAlign: 'center' },
  placeOrderButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  placeOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default Cart;
