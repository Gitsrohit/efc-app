import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  TextInput,
  Modal,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const QuantityHandler = ({ quantity, onDecrement, onIncrement }) => {
  return (
    <View style={styles.quantityWrapper}>
      <TouchableOpacity style={styles.quantityButton} onPress={onDecrement}>
        <Text style={styles.quantityButtonText}>−</Text>
      </TouchableOpacity>
      <View style={styles.quantityDisplay}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>
      <TouchableOpacity style={styles.quantityButton} onPress={onIncrement}>
        <Text style={styles.quantityButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [itemTimeouts, setItemTimeouts] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [address, setAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'User is not authenticated. Please log in.');
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
            animationValue: new Animated.Value(1),
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

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      // If quantity is less than 1, remove the item from the cart
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Error', 'User is not authenticated. Please log in.');
          return;
        }
  
        const response = await fetch(
          `https://efc-app-1.onrender.com/api/v1/cart/remove?itemId=${itemId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) {
          throw new Error('Failed to remove item from cart');
        }
  
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to remove item from cart');
        }
  
        // Remove the item from the local state
        setCartData((prevState) => ({
          ...prevState,
          items: prevState.items.filter((item) => item.itemId !== itemId),
          totalPrice: prevState.totalPrice - prevState.items.find((item) => item.itemId === itemId).price,
        }));
  
        console.log(`Item ${itemId} removed from cart successfully`);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Something went wrong while removing the item from the cart');
      }
      return;
    }
  
    // If quantity is greater than or equal to 1, update the quantity
    setCartData((prevState) => {
      const updatedItems = prevState.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      );
      const updatedTotalPrice = updatedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      return { ...prevState, items: updatedItems, totalPrice: updatedTotalPrice };
    });
  
    if (itemTimeouts[itemId]) {
      clearTimeout(itemTimeouts[itemId]);
    }
  
    const timeout = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Error', 'User is not authenticated. Please log in.');
          return;
        }
  
        const response = await fetch('https://efc-app-1.onrender.com/api/v1/cart/update-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId, quantity: newQuantity }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to update quantity');
        }
  
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to update quantity');
        }
  
        console.log(`Quantity for item ${itemId} updated successfully`);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Something went wrong while updating quantity');
      }
    }, 1000);
  
    setItemTimeouts((prevTimeouts) => ({
      ...prevTimeouts,
      [itemId]: timeout,
    }));
  };

  const handlePlaceOrder = () => {
    if (!orderType) {
      Alert.alert('Error', 'Please select an order type');
      return;
    }
    setModalVisible(true);
  };

  const handleConfirmAddress = async () => {
    if (!orderType) {
      Alert.alert('Error', 'Please select an order type.');
      return;
    }

    if (!address.addressLine1 || !address.city || !address.postalCode) {
      Alert.alert('Error', 'Please fill in all required address fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'User is not authenticated. Please log in.');
        return;
      }

      const payload = {
        deliveryAddress: {
          ...address,
        },
        deliveryType: orderType,
        paymentMethod: paymentMethod,
      };

      const response = await fetch(
        'https://efc-app-1.onrender.com/api/v1/orders/from-cart',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setModalVisible(false);
        Alert.alert('Success', 'Your order has been placed successfully!');
      } else {
        throw new Error(data.message || 'Failed to place the order.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while placing the order.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/efcBg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
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
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemPrice}>Price: ₹{item.price}</Text>
                  </View>
                  <QuantityHandler
                    quantity={item.quantity}
                    onDecrement={() =>
                      handleUpdateQuantity(item.itemId, item.quantity - 1)
                    }
                    onIncrement={() =>
                      handleUpdateQuantity(item.itemId, item.quantity + 1)
                    }
                  />
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
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.addressPopup}>
              <Text style={styles.popupHeading}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Address Line 1"
                value={address.addressLine1}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, addressLine1: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Address Line 2"
                value={address.addressLine2}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, addressLine2: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={address.city}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, city: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Postal Code"
                value={address.postalCode}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, postalCode: text }))
                }
              />
              <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
              <View style={styles.paymentMethodOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'Cash on Delivery' && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod('Cash on Delivery')}
                >
                  <Text style={styles.paymentMethodText}>Cash on Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'UPI/QR Code' && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod('UPI/QR Code')}
                >
                  <Text style={styles.paymentMethodText}>UPI/QR Code</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.confirmAddressButton}
                onPress={handleConfirmAddress}
              >
                <Text style={styles.confirmAddressText}>Confirm Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  cartContainer: {
    flex: 1,
    backgroundColor: 'rgba(245, 245, 245, 0.9)', 
    borderRadius: 15,
    padding: 15,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    elevation: 5,
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  itemDetails: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 18, fontWeight: '700', color: '#333' },
  itemPrice: { fontSize: 16, color: '#666', marginBottom: 5 },
  noItemsText: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 16 },
subtotalContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  backgroundColor: '#FFEB3B', 
  padding: 10,
  borderRadius: 10, 
  elevation: 3,
},
  subtotalText: { fontSize: 18, fontWeight: '700', color: '#333' },
  orderTypeContainer: { marginTop: 20 },
  orderTypeLabel: {
    fontWeight: '700',
    color: '#ffff',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 18,
  },
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
    backgroundColor: '#FFF',
  },
  selectedOption: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  orderTypeText: { color: '#333', fontWeight: '600', textAlign: 'center', fontSize: 16 },
  placeOrderButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 5,
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    height: 35,
    width: 100,
    justifyContent: 'space-between',
    elevation: 3,
  },
  quantityButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBE9E7',
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#B71C1C',
    fontWeight: '700',
  },
  quantityDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B71C1C',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addressPopup: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  popupHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  paymentMethodLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentMethodOption: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#FFF',
    elevation: 3,
  },
  selectedPaymentOption: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  confirmAddressButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    elevation: 5,
  },
  confirmAddressText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Cart;