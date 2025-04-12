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
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

// Define types
interface CartItem {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  animationValue: Animated.Value;
}

interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
}

interface CartData {
  items: CartItem[];
  totalPrice: number;
}

type RootStackParamList = {
  Checkout: {
    orderData: {
      deliveryAddress: Address;
      deliveryType: string;
      paymentMethod: string;
      items: CartItem[];
      totalAmount: number;
    };
  };
  // Add other screens as needed
};

const QuantityHandler = ({ quantity, onDecrement, onIncrement }) => {
  return (
    <View style={styles.quantityWrapper}>
      <TouchableOpacity 
        style={[styles.quantityButton, styles.decrementButton]} 
        onPress={onDecrement}
      >
        <Icon name="remove" size={20} color="#fff" />
      </TouchableOpacity>
      <View style={styles.quantityDisplay}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.quantityButton, styles.incrementButton]} 
        onPress={onIncrement}
      >
        <Icon name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const Cart = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [orderType, setOrderType] = useState<string | null>(null);
  const [itemTimeouts, setItemTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [address, setAddress] = useState<Address>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
  });
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please log in to view your cart');
        return;
      }

      const response = await fetch('https://efc-app-1.onrender.com/api/v1/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const itemsWithAnimation = data.data.items.map((item: any) => ({
            ...item,
            animationValue: new Animated.Value(1),
          }));
          setCartData({ ...data.data, items: itemsWithAnimation });
        }
      } else {
        throw new Error('Failed to fetch cart');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load cart data');
      console.error(error);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItemFromCart(itemId);
      return;
    }

    setCartData(prev => {
      if (!prev) return null;
      const updatedItems = prev.items.map(item => 
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      );
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, items: updatedItems, totalPrice };
    });

    if (itemTimeouts[itemId]) clearTimeout(itemTimeouts[itemId]);
    const timeout = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        await fetch('https://efc-app-1.onrender.com/api/v1/cart/update-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId, quantity: newQuantity }),
        });
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    }, 1000);

    setItemTimeouts(prev => ({ ...prev, [itemId]: timeout }));
  };

  const removeItemFromCart = async (itemId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`https://efc-app-1.onrender.com/api/v1/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartData(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.filter(item => item.itemId !== itemId);
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { ...prev, items: updatedItems, totalPrice };
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item');
      console.error(error);
    }
  };

  const handlePlaceOrder = () => {
    if (!orderType) {
      Alert.alert('Error', 'Please select delivery option');
      return;
    }
    setModalVisible(true);
  };

  const handleProceedToPayment = () => {
    if (isNavigating) return;
    
    if (!address.addressLine1 || !address.city || !address.postalCode) {
      Alert.alert('Error', 'Please fill all required address fields');
      return;
    }

    setIsNavigating(true);
    
    navigation.navigate('Checkout', { 
      orderData: {
        deliveryAddress: address,
        deliveryType: orderType || 'Take Away',
        paymentMethod: 'UPI/QR Code', // Default payment method
        items: cartData?.items || [],
        totalAmount: calculateTotal()
      }
    });
    
    setModalVisible(false);
    setIsNavigating(false);
  };

  const calculateTotal = () => {
    if (!cartData) return 0;
    return orderType === 'Home Delivery' ? cartData.totalPrice + 50 : cartData.totalPrice;
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Icon name="remove-shopping-cart" size={60} color="#fff" />
      <Text style={styles.emptyCartText}>Your cart is empty</Text>
      <Text style={styles.emptyCartSubText}>Add some delicious items to get started!</Text>
    </View>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Animated.View
      style={[
        styles.cartItem,
        {
          opacity: item.animationValue,
          transform: [{
            translateX: item.animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [500, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <QuantityHandler
        quantity={item.quantity}
        onDecrement={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
        onIncrement={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Cart</Text>
        {cartData?.items && (
          <Text style={styles.itemCount}>{cartData.items.length} items</Text>
        )}
      </View>

      {cartData ? (
        cartData.items.length > 0 ? (
          <ScrollView style={styles.scrollContainer}>
            <FlatList
              data={cartData.items}
              keyExtractor={(item) => item.itemId}
              scrollEnabled={false}
              renderItem={renderCartItem}
            />

            <View style={styles.orderTypeContainer}>
              <Text style={styles.sectionTitle}>Delivery Option</Text>
              <View style={styles.orderTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.orderTypeOption,
                    orderType === 'Take Away' && styles.selectedOption,
                  ]}
                  onPress={() => setOrderType('Take Away')}
                >
                  <Icon 
                    name="takeout-dining" 
                    size={24} 
                    color={orderType === 'Take Away' ? '#fff' : '#d32f2f'} 
                  />
                  <Text style={[
                    styles.orderTypeText,
                    orderType === 'Take Away' && styles.selectedOptionText
                  ]}>
                    Take Away
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.orderTypeOption,
                    orderType === 'Home Delivery' && styles.selectedOption,
                  ]}
                  onPress={() => setOrderType('Home Delivery')}
                >
                  <Icon 
                    name="delivery-dining" 
                    size={24} 
                    color={orderType === 'Home Delivery' ? '#fff' : '#d32f2f'} 
                  />
                  <Text style={[
                    styles.orderTypeText,
                    orderType === 'Home Delivery' && styles.selectedOptionText
                  ]}>
                    Home Delivery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{cartData.totalPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                <Text style={styles.summaryValue}>
                  ₹{orderType === 'Home Delivery' ? '50' : '0'}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          renderEmptyCart()
        )
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      )}

      {cartData?.items && cartData.items.length > 0 && (
        <TouchableOpacity 
          style={styles.placeOrderButton} 
          onPress={handlePlaceOrder}
          disabled={!orderType || isNavigating}
        >
          <Text style={styles.placeOrderText}>
            {isNavigating ? 'Processing...' : 'Proceed to Checkout'}
          </Text>
          <View style={styles.checkoutPriceContainer}>
            <Text style={styles.checkoutPriceText}>₹{calculateTotal()}</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delivery Details</Text>
          </View>

          <ScrollView style={styles.modalScrollContainer}>
            <View style={styles.addressForm}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              
              <View style={styles.inputContainer}>
                <Icon name="location-on" size={20} color="#d32f2f" />
                <TextInput
                  style={styles.input}
                  placeholder="Address Line 1*"
                  value={address.addressLine1}
                  onChangeText={(text) => setAddress({...address, addressLine1: text})}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="home" size={20} color="#d32f2f" />
                <TextInput
                  style={styles.input}
                  placeholder="Address Line 2"
                  value={address.addressLine2}
                  onChangeText={(text) => setAddress({...address, addressLine2: text})}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="location-city" size={20} color="#d32f2f" />
                <TextInput
                  style={styles.input}
                  placeholder="City*"
                  value={address.city}
                  onChangeText={(text) => setAddress({...address, city: text})}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="markunread-mailbox" size={20} color="#d32f2f" />
                <TextInput
                  style={styles.input}
                  placeholder="Postal Code*"
                  value={address.postalCode}
                  onChangeText={(text) => setAddress({...address, postalCode: text})}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleProceedToPayment}
            disabled={isNavigating}
          >
            <Text style={styles.confirmButtonText}>
              {isNavigating ? 'Processing...' : 'Proceed to Payment'}
            </Text>
            {!isNavigating && <Icon name="payment" size={24} color="#fff" />}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d32f2f',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  itemCount: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    height: 40,
    width: 120,
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementButton: {
    backgroundColor: '#f44336',
  },
  incrementButton: {
    backgroundColor: '#4caf50',
  },
  quantityDisplay: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: '100%',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 15,
  },
  emptyCartSubText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  orderTypeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  orderTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderTypeOption: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 5,
  },
  selectedOption: {
    backgroundColor: '#d32f2f',
  },
  orderTypeText: {
    color: '#d32f2f',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#fff',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
  },
  placeOrderButton: {
    backgroundColor: '#d32f2f',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  checkoutPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutPriceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#d32f2f',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 15,
  },
  modalScrollContainer: {
    flex: 1,
    padding: 20,
  },
  addressForm: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
});

export default Cart;