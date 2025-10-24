import React, { useEffect, useState, useRef } from 'react';
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
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
};

const QuantityHandler = ({ quantity, onDecrement, onIncrement }) => {
  return (
    <View style={enhancedStyles.quantityWrapper}>
      <TouchableOpacity 
        style={enhancedStyles.quantityButton} 
        onPress={onDecrement}
        disabled={quantity <= 0}
      >
        <Icon 
          name="remove-outline" 
          size={20} 
          color={quantity <= 1 ? '#999' : '#a00000'} 
        />
      </TouchableOpacity>
      <View style={enhancedStyles.quantityDisplay}>
        <Text style={enhancedStyles.quantityText}>{quantity}</Text>
      </View>
      <TouchableOpacity 
        style={enhancedStyles.quantityButton} 
        onPress={onIncrement}
      >
        <Icon name="add-outline" size={20} color="#a00000" />
      </TouchableOpacity>
    </View>
  );
};

const Cart = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [orderType, setOrderType] = useState<string | null>('Take Away'); // Default to Take Away
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

      const response = await fetch('https://efc-user-backend.onrender.com/api/v1/cart', {
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
        await fetch('https://efc-user-backend.onrender.com/api/v1/cart/update-quantity', {
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
      await fetch(`https://efc-user-backend.onrender.com/api/v1/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const itemToRemove = cartData?.items.find(item => item.itemId === itemId);
      if (itemToRemove) {
        Animated.timing(itemToRemove.animationValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setCartData(prev => {
            if (!prev) return null;
            const updatedItems = prev.items.filter(item => item.itemId !== itemId);
            const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return { ...prev, items: updatedItems, totalPrice };
          });
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item');
      console.error(error);
    }
  };

  const handlePlaceOrder = () => {
    if (!orderType) {
      Alert.alert('Hold on!', 'Please select a delivery option first.', [{ text: 'OK' }]);
      return;
    }
    if (orderType === 'Home Delivery') {
      setModalVisible(true);
    } else {
      handleProceedToPayment();
    }
  };

  const handleProceedToPayment = () => {
    if (isNavigating) return;

    if (orderType === 'Home Delivery' && (!address.addressLine1 || !address.city || !address.postalCode)) {
      Alert.alert('Attention!', 'Please fill all required address fields.', [{ text: 'OK' }]);
      return;
    }

    setIsNavigating(true);
    
    navigation.navigate('Checkout', { 
      orderData: {
        deliveryAddress: address,
        deliveryType: orderType || 'Take Away',
        paymentMethod: 'UPI/QR Code',
        items: cartData?.items || [],
        totalAmount: calculateTotal()
      }
    });
    
    setModalVisible(false);
    setTimeout(() => setIsNavigating(false), 500); 
  };

  const calculateTotal = () => {
    if (!cartData) return 0;
    return orderType === 'Home Delivery' ? cartData.totalPrice + 50 : cartData.totalPrice;
  };


  const renderEmptyCart = () => (
    <View style={enhancedStyles.emptyCartContainer}>
      <Icon name="basket-outline" size={80} color="rgba(255,255,255,0.7)" />
      <Text style={enhancedStyles.emptyCartText}>Your Basket is Empty</Text>
      <Text style={enhancedStyles.emptyCartSubText}>Add some delicious items to get started!</Text>
      <TouchableOpacity 
        style={enhancedStyles.goShoppingButton} 
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={enhancedStyles.goShoppingButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Animated.View
      style={[
        enhancedStyles.cartItem,
        {
          opacity: item.animationValue,
          height: item.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 95],
          }),
          paddingVertical: item.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 15],
          }),
          transform: [{
            translateX: item.animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [width, 0],
            }),
          }],
        },
      ]}
    >
      <View style={enhancedStyles.itemDetails}>
        <Text style={enhancedStyles.itemName} numberOfLines={2}>{item.itemName}</Text>
        <Text style={enhancedStyles.itemPrice}>₹{item.price.toFixed(2)}</Text>
      </View>
      <QuantityHandler
        quantity={item.quantity}
        onDecrement={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
        onIncrement={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
      />
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={['#a00000', '#600000']} 
      style={enhancedStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }} 
    >
      <SafeAreaView style={enhancedStyles.safeArea}>
        <View style={enhancedStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={enhancedStyles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={enhancedStyles.heading}>My Cart</Text>
          {cartData?.items ? (
            <Text style={enhancedStyles.itemCount}>{cartData.items.length} items</Text>
          ) : (
            <View style={enhancedStyles.itemCountPlaceholder} />
          )}
        </View>

        {cartData ? (
          cartData.items.length > 0 ? (
            <ScrollView 
              style={enhancedStyles.scrollContainer}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
>
              <FlatList
                data={cartData.items}
                keyExtractor={(item) => item.itemId}
                scrollEnabled={false}
                renderItem={renderCartItem}
              />
              <View style={enhancedStyles.sectionWrapper}>
                <Text style={enhancedStyles.sectionTitle}>Select Order Type</Text>
                <View style={enhancedStyles.orderTypeOptions}>
                  <TouchableOpacity
                    style={[
                      enhancedStyles.orderTypeOption,
                      orderType === 'Take Away' && enhancedStyles.selectedOption,
                    ]}
                    onPress={() => setOrderType('Take Away')}
                  >
                    <Icon 
                      name="walk-outline" 
                      size={24} 
                      color={orderType === 'Take Away' ? '#fff' : '#a00000'} 
                    />
                    <Text style={[
                      enhancedStyles.orderTypeText,
                      orderType === 'Take Away' && enhancedStyles.selectedOptionText
                    ]}>
                      Take Away
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      enhancedStyles.orderTypeOption,
                      orderType === 'Home Delivery' && enhancedStyles.selectedOption,
                    ]}
                    onPress={() => setOrderType('Home Delivery')}
                  >
                    <Icon 
                      name="bicycle-outline" 
                      size={24} 
                      color={orderType === 'Home Delivery' ? '#fff' : '#a00000'} 
                    />
                    <Text style={[
                      enhancedStyles.orderTypeText,
                      orderType === 'Home Delivery' && enhancedStyles.selectedOptionText
                    ]}>
                      Delivery
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={enhancedStyles.summaryContainer}>
                <Text style={enhancedStyles.sectionTitle}>Summary</Text>
                <View style={enhancedStyles.summaryRow}>
                  <Text style={enhancedStyles.summaryLabel}>Subtotal:</Text>
                  <Text style={enhancedStyles.summaryValue}>₹{cartData.totalPrice.toFixed(2)}</Text>
                </View>
                <View style={enhancedStyles.summaryRow}>
                  <Text style={enhancedStyles.summaryLabel}>Delivery Fee:</Text>
                  <Text style={enhancedStyles.summaryValue}>
                    {orderType === 'Home Delivery' ? '₹50.00' : 'Free'}
                  </Text>
                </View>
                <View style={enhancedStyles.totalRow}>
                  <Text style={enhancedStyles.totalLabel}>Total Payable:</Text>
                  <Text style={enhancedStyles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>
          ) : (
            renderEmptyCart()
          )
        ) : (
          <View style={enhancedStyles.loadingContainer}>
            <Text style={enhancedStyles.loadingText}>Loading your cart...</Text>
          </View>
        )}

        {cartData?.items && cartData.items.length > 0 && (
          <TouchableOpacity 
            style={enhancedStyles.placeOrderButton} 
            onPress={handlePlaceOrder}
            disabled={!orderType || isNavigating}
            activeOpacity={0.8}
          >
            <Text style={enhancedStyles.placeOrderText}>
              {isNavigating ? 'Processing...' : 'Proceed to Checkout'}
            </Text>
            <View style={enhancedStyles.checkoutPriceContainer}>
              <Text style={enhancedStyles.checkoutPriceText}>₹{calculateTotal().toFixed(2)}</Text>
              <Icon name="chevron-forward-outline" size={24} color="#a00000" />
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <LinearGradient
          colors={['#a00000', '#600000']}
          style={enhancedStyles.modalContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <SafeAreaView style={enhancedStyles.modalHeader}>
            <TouchableOpacity style={enhancedStyles.backButtonModal} onPress={() => setModalVisible(false)}>
              <Icon name="close-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={enhancedStyles.modalTitle}>Delivery Address</Text>
          </SafeAreaView>

          <ScrollView 
            style={enhancedStyles.modalScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={enhancedStyles.addressForm}>
              <Text style={enhancedStyles.modalSectionTitle}>Enter Details</Text>
              
              <View style={enhancedStyles.inputContainer}>
                <Icon name="location-outline" size={20} color="#a00000" />
                <TextInput
                  style={enhancedStyles.input}
                  placeholder="Address Line 1*"
                  value={address.addressLine1}
                  onChangeText={(text) => setAddress({...address, addressLine1: text})}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={enhancedStyles.inputContainer}>
                <Icon name="home-outline" size={20} color="#a00000" />
                <TextInput
                  style={enhancedStyles.input}
                  placeholder="Apartment / Floor (Optional)"
                  value={address.addressLine2}
                  onChangeText={(text) => setAddress({...address, addressLine2: text})}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={enhancedStyles.inputContainer}>
                <Icon name="business-outline" size={20} color="#a00000" />
                <TextInput
                  style={enhancedStyles.input}
                  placeholder="City*"
                  value={address.city}
                  onChangeText={(text) => setAddress({...address, city: text})}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={enhancedStyles.inputContainer}>
                <Icon name="mail-outline" size={20} color="#a00000" />
                <TextInput
                  style={enhancedStyles.input}
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
            style={enhancedStyles.confirmButton}
            onPress={handleProceedToPayment}
            disabled={isNavigating}
            activeOpacity={0.8}
          >
            <Text style={enhancedStyles.confirmButtonText}>
              {isNavigating ? 'Processing...' : 'Confirm Address & Pay'}
            </Text>
            {!isNavigating && <Icon name="arrow-forward-circle-outline" size={24} color="#a00000" />}
          </TouchableOpacity>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', 
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  itemCountPlaceholder: {
    width: 30, 
    height: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8', 
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a00000', 
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    height: 35,
    width: 100,
    justifyContent: 'space-between',
  },
  quantityButton: {
    paddingHorizontal: 5,
  },
  quantityDisplay: {
    paddingHorizontal: 5,
    backgroundColor: '#fff', 
    borderRadius: 4,
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
    backgroundColor: 'transparent',
  },
  emptyCartText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
  },
  emptyCartSubText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 30,
  },
  goShoppingButton: {
    backgroundColor: '#FFD700', 
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  goShoppingButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionWrapper: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    paddingLeft: 5,
  },
  orderTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 3,
  },
  selectedOption: {
    backgroundColor: '#a00000',
  },
  orderTypeText: {
    color: '#a00000',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 15,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0', 
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a00000',
  },

  placeOrderButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFD700', 
    paddingVertical: 18,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 15,
    shadowColor: '#a00000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  placeOrderText: {
    color: '#a00000',
    fontWeight: '700',
    fontSize: 17,
  },
  checkoutPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutPriceText: {
    color: '#a00000',
    fontWeight: '700',
    fontSize: 17,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  backButtonModal: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modalScrollContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
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
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    paddingVertical: 0,
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#a00000',
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