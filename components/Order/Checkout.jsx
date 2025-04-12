import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const orderData = route.params?.orderData || {};

  const [paymentMethod, setPaymentMethod] = useState(
    orderData.paymentMethod || 'Cash on Delivery'
  );
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(
    orderData.deliveryType === 'Home Delivery' ? 50 : 0
  );
  const [total, setTotal] = useState(orderData.totalAmount || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    if (orderData.items) {
      const calculatedSubtotal = orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      setSubtotal(calculatedSubtotal);
      setTotal(calculatedSubtotal + shipping);
    }
  }, [orderData.items, shipping]);

  const createRazorpayOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('https://efc-app-1.onrender.com/api/v1/payments/create-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const responseData = await response.json();
      
      if (!responseData.shortUrl) {
        throw new Error('Payment URL not received from server');
      }
      
      return responseData.shortUrl;
    } catch (error) {
      console.error('Error in createRazorpayOrder:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'Cash on Delivery') {
        Alert.alert(
          'Order Placed', 
          'Your order has been placed successfully. Pay when delivered.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const paymentUrl = await createRazorpayOrder();
      setPaymentUrl(paymentUrl);
      setShowWebView(true);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;
    
    // Check for payment success/failure URLs
    if (url.includes('razorpay.com/payment/success') || url.includes('yourdomain.com/payment/success')) {
      setShowWebView(false);
      Alert.alert(
        'Payment Successful', 
        'Your payment was successful!',
        [{ text: 'OK', onPress: () => navigation.navigate('OrderConfirmation') }]
      );
    } else if (url.includes('razorpay.com/payment/failed') || url.includes('yourdomain.com/payment/failed')) {
      setShowWebView(false);
      Alert.alert(
        'Payment Failed', 
        'Your payment failed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleWebViewClose = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            setShowWebView(false);
            setPaymentUrl(null);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.heading}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Icon name="location-on" size={24} color="#d32f2f" style={styles.addressIcon} />
            <View>
              <Text style={styles.addressText}>{orderData.deliveryAddress?.addressLine1 || 'No address'}</Text>
              {orderData.deliveryAddress?.addressLine2 && (
                <Text style={styles.addressText}>{orderData.deliveryAddress.addressLine2}</Text>
              )}
              <Text style={styles.addressText}>
                {orderData.deliveryAddress?.city || 'City'}, {orderData.deliveryAddress?.postalCode || 'Postal Code'}
              </Text>
              <Text style={styles.deliveryType}>
                {orderData.deliveryType || 'Delivery'} • {orderData.deliveryType === 'Home Delivery' ? '₹50 delivery fee' : 'Free pickup'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {orderData.items?.map((item) => (
            <View key={item.itemId} style={styles.orderItem}>
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/60' }} 
                style={styles.itemImage} 
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'Cash on Delivery' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('Cash on Delivery')}
            disabled={isProcessing}
          >
            <View style={styles.radioContainer}>
              <View style={styles.radio}>
                {paymentMethod === 'Cash on Delivery' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
            </View>
            <Icon name="money" size={24} color="#d32f2f" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'Online Payment' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('Online Payment')}
            disabled={isProcessing}
          >
            <View style={styles.radioContainer}>
              <View style={styles.radio}>
                {paymentMethod === 'Online Payment' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.paymentOptionText}>Online Payment</Text>
            </View>
            <Icon name="credit-card" size={24} color="#d32f2f" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>₹{shipping.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.confirmButton,
          isProcessing && styles.disabledButton
        ]} 
        onPress={handlePayment}
        disabled={isProcessing}
      >
        <Text style={styles.confirmButtonText}>
          {isProcessing ? 'Processing...' : 
           paymentMethod === 'Cash on Delivery' ? 'Confirm Order' : 'Proceed to Payment'}
        </Text>
        {!isProcessing && <Icon name="arrow-forward" size={24} color="#fff" />}
      </TouchableOpacity>

      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleWebViewClose}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity 
              onPress={handleWebViewClose}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Complete Payment</Text>
          </View>
          
          {webViewLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d32f2f" />
              <Text style={styles.loadingText}>Loading payment gateway...</Text>
            </View>
          )}
          
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              style={{ flex: 1 }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onError={(syntheticEvent) => {
                console.error('WebView error:', syntheticEvent.nativeEvent);
                Alert.alert('Error', 'Failed to load payment page');
                setShowWebView(false);
              }}
            />
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
  },
  addressIcon: {
    marginRight: 15,
    marginTop: 3,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  deliveryType: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
    marginTop: 5,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d32f2f',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPayment: {
    borderColor: '#d32f2f',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d32f2f',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d32f2f',
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#333',
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
  confirmButton: {
    backgroundColor: '#d32f2f',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#a5a5a5',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginRight: 10,
  },
  webviewHeader: {
    backgroundColor: '#d32f2f',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  webviewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default CheckoutScreen;