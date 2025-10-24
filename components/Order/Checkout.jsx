import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const orderData = route.params?.orderData || {};

  const [paymentMethod, setPaymentMethod] = useState(
    orderData.paymentMethod || 'Online Payment'
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
  const [paymentLinkIdForPolling, setPaymentLinkIdForPolling] = useState(null);
  const pollingTimer = useRef(null);
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
  
  useEffect(() => {
    return () => {
      if (pollingTimer.current) {
        clearTimeout(pollingTimer.current);
      }
    };
  }, []);

  const createOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const payload = {
        deliveryAddress: orderData.deliveryAddress,
        deliveryType: orderData.deliveryType,
        paymentMethod: paymentMethod,
        status: 'Confirmed', 
      };

      const response = await fetch('https://efc-user-backend.onrender.com/api/v1/orders/from-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }
      return await response.json();
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  };

  const createRazorpayOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('https://efc-user-backend.onrender.com/api/v1/payments/create-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment link');
      }

      const responseData = await response.json();

      if (!responseData.shortUrl || !responseData.paymentLinkId) {
        throw new Error('Payment URL or Link ID not received from server');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createRazorpayOrder:', error);
      throw error;
    }
  };
  
  const checkPaymentStatus = async (linkOrOrderId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`https://efc-user-backend.onrender.com/api/v1/payments/status/${linkOrOrderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check payment status');
      }

      const paymentStatusData = await response.json();

      console.log('Payment Status API Response Data:', paymentStatusData);

      return paymentStatusData;

    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  };

  const startPolling = async (linkOrOrderId) => {
    try {
      const statusData = await checkPaymentStatus(linkOrOrderId);
      const paymentStatus = statusData.status; 

      if (paymentStatus === 'SUCCESS') {
        clearTimeout(pollingTimer.current);
        await createOrder(); 
        
        setIsProcessing(false);
        Alert.alert(
          'Payment Successful', 
          'Your payment was successful and the order has been placed!',
          [{ text: 'OK', onPress: () => navigation.navigate('OrderConfirmed') }]
        );
      } else if (paymentStatus === 'FAILED') {
        clearTimeout(pollingTimer.current);
        setIsProcessing(false);
        Alert.alert(
          'Payment Failed', 
          `Your payment failed. Reason: ${statusData.failureReason || 'Unknown'}. Please try again.`,
          [{ text: 'OK' }]
        );
      } else {
        pollingTimer.current = setTimeout(() => startPolling(linkOrOrderId), 5000);
      }
    } catch (error) {
      clearTimeout(pollingTimer.current);
      setIsProcessing(false);
      console.error('Polling error:', error);
      Alert.alert('Verification Error', error.message || 'Something went wrong during payment verification.');
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'Cash on Delivery') {
        await createOrder();
        
        Alert.alert(
          'Order Placed', 
          'Your order has been placed successfully. Pay when delivered.',
          [{ text: 'OK', onPress: () => navigation.navigate('OrderConfirmed') }]
        );
      } else if (paymentMethod === 'Online Payment') {
        const paymentResponse = await createRazorpayOrder();
        
        setPaymentLinkIdForPolling(paymentResponse.paymentLinkId); 
        setPaymentUrl(paymentResponse.shortUrl);
        setShowWebView(true);
        startPolling(paymentResponse.paymentLinkId);

      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Payment Error', error.message || 'Failed to process payment');
    } finally {

      if(paymentMethod === 'Cash on Delivery' || showWebView === false) {
        setIsProcessing(false);
      }
    }
  };

  const handleWebViewNavigationStateChange = async (newNavState) => {
    const { url } = newNavState;
    

    if (url.includes('razorpay.com/payment/success') || url.includes('razorpay.com/payment/failed')) {
      
      setShowWebView(false);
      setIsProcessing(true); 
      
      if (paymentLinkIdForPolling) {


      } else {
        Alert.alert('Error', 'Payment Link ID missing. Cannot verify status.');
        setIsProcessing(false);
      }
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
            setPaymentLinkIdForPolling(null);
            if (pollingTimer.current) {
              clearTimeout(pollingTimer.current); 
            }
            setIsProcessing(false); // End processing state
            Alert.alert('Payment Cancelled', 'You can try again at any time.');
          }
        }
      ]
    );
  };



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
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={enhancedStyles.heading}>Final Checkout</Text>
          <View style={{ width: 40 }} /> {/* Spacer */}
        </View>

        <ScrollView 
          style={enhancedStyles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={enhancedStyles.card}>
            <View style={enhancedStyles.cardHeader}>
              <Icon name="location-outline" size={22} color="#a00000" />
              <Text style={enhancedStyles.sectionTitle}>Delivery To</Text>
              <TouchableOpacity onPress={() => { navigation.goBack(); }}>
                <Text style={enhancedStyles.editButton}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={enhancedStyles.addressContent}>
              <Text style={enhancedStyles.addressTextBold}>
                {orderData.deliveryAddress?.addressLine1 || 'No address provided'}
              </Text>
              {orderData.deliveryAddress?.addressLine2 && (
                <Text style={enhancedStyles.addressText}>{orderData.deliveryAddress.addressLine2}</Text>
              )}
              <Text style={enhancedStyles.addressText}>
                {orderData.deliveryAddress?.city || 'City'}, {orderData.deliveryAddress?.postalCode || 'Postal Code'}
              </Text>
              <View style={enhancedStyles.deliveryTypeBadge}>
                <Icon 
                  name={orderData.deliveryType === 'Home Delivery' ? 'bicycle-outline' : 'walk-outline'} 
                  size={14} 
                  color="#fff" 
                />
                <Text style={enhancedStyles.deliveryType}>
                  {orderData.deliveryType || 'Delivery'}
                </Text>
              </View>
            </View>
          </View>

          <View style={enhancedStyles.card}>
            <View style={enhancedStyles.cardHeader}>
              <Icon name="list-outline" size={22} color="#a00000" />
              <Text style={enhancedStyles.sectionTitle}>Order Items</Text>
            </View>
            {orderData.items?.map((item, index) => (
              <View key={item.itemId} style={[
                enhancedStyles.orderItem,
                index === orderData.items.length - 1 && enhancedStyles.lastOrderItem
              ]}>
                <View style={enhancedStyles.itemDetails}>
                  <Text style={enhancedStyles.itemName} numberOfLines={2}>{item.itemName}</Text>
                  <Text style={enhancedStyles.itemQuantity}>Qty: {item.quantity} x ₹{item.price.toFixed(2)}</Text>
                </View>
                <Text style={enhancedStyles.itemPriceTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View style={enhancedStyles.card}>
            <View style={enhancedStyles.cardHeader}>
              <Icon name="wallet-outline" size={22} color="#a00000" />
              <Text style={enhancedStyles.sectionTitle}>Payment Method</Text>
            </View>

            <TouchableOpacity
              style={[
                enhancedStyles.paymentOption,
                paymentMethod === 'Cash on Delivery' && enhancedStyles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod('Cash on Delivery')}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <View style={enhancedStyles.radioContainer}>
                <View style={enhancedStyles.radio}>
                  {paymentMethod === 'Cash on Delivery' && <View style={enhancedStyles.radioSelected} />}
                </View>
                <Text style={enhancedStyles.paymentOptionText}>Cash on Delivery (COD)</Text>
              </View>
              <Icon name="cash-outline" size={24} color={paymentMethod === 'Cash on Delivery' ? '#a00000' : '#666'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                enhancedStyles.paymentOption,
                paymentMethod === 'Online Payment' && enhancedStyles.selectedPayment,
                { marginBottom: 0 }
              ]}
              onPress={() => setPaymentMethod('Online Payment')}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <View style={enhancedStyles.radioContainer}>
                <View style={enhancedStyles.radio}>
                  {paymentMethod === 'Online Payment' && <View style={enhancedStyles.radioSelected} />}
                </View>
                <Text style={enhancedStyles.paymentOptionText}>Online Payment (UPI/Card)</Text>
              </View>
              <Icon name="card-outline" size={24} color={paymentMethod === 'Online Payment' ? '#a00000' : '#666'} />
            </TouchableOpacity>
          </View>

          <View style={enhancedStyles.card}>
            <Text style={enhancedStyles.summarySectionTitle}>Final Summary</Text>
            <View style={enhancedStyles.summaryRow}>
              <Text style={enhancedStyles.summaryLabel}>Subtotal:</Text>
              <Text style={enhancedStyles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={enhancedStyles.summaryRow}>
              <Text style={enhancedStyles.summaryLabel}>Delivery Fee:</Text>
              <Text style={enhancedStyles.summaryValue}>{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'FREE'}</Text>
            </View>
            <View style={enhancedStyles.totalRow}>
              <Text style={enhancedStyles.totalLabel}>Total Payable:</Text>
              <Text style={enhancedStyles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[
            enhancedStyles.confirmButton,
            isProcessing && enhancedStyles.disabledButton
          ]} 
          onPress={handlePayment}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#a00000" />
          ) : (
            <>
              <Text style={enhancedStyles.confirmButtonText}>
                {paymentMethod === 'Cash on Delivery' ? 'Confirm Order' : 'Pay Now'}
              </Text>
              <View style={enhancedStyles.finalPriceContainer}>
                <Text style={enhancedStyles.finalPriceText}>₹{total.toFixed(2)}</Text>
                <Icon name="chevron-forward-outline" size={24} color="#a00000" />
              </View>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleWebViewClose}
      >
        <LinearGradient
          colors={['#a00000', '#600000']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <SafeAreaView style={enhancedStyles.webviewHeader}>
            <TouchableOpacity 
              onPress={handleWebViewClose}
              style={enhancedStyles.closeButton}
            >
              <Icon name="close-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={enhancedStyles.webviewTitle}>Complete Payment</Text>
          </SafeAreaView>
          
          {webViewLoading && (
            <View style={enhancedStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={enhancedStyles.loadingText}>Loading payment gateway...</Text>
            </View>
          )}
          
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              style={{ flex: 1, backgroundColor: '#fff' }}
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
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

const enhancedStyles = StyleSheet.create({
  container: { flex: 1, },
  safeArea: { flex: 1, },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#fff', },
  scrollContainer: { flex: 1, backgroundColor: '#f8f8f8', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingVertical: 30, },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginLeft: 10, flex: 1, },
  editButton: { color: '#a00000', fontWeight: '600', fontSize: 15, },
  addressContent: { paddingTop: 10, },
  addressText: { fontSize: 15, color: '#666', lineHeight: 20, },
  addressTextBold: { fontSize: 16, color: '#333', fontWeight: '600', lineHeight: 22, marginBottom: 5, },
  deliveryTypeBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#a00000', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, },
  deliveryType: { fontSize: 14, color: '#fff', fontWeight: '600', marginLeft: 5, },
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  lastOrderItem: { borderBottomWidth: 0, paddingBottom: 0, },
  itemDetails: { flex: 1, flexDirection: 'column', paddingRight: 10, },
  itemName: { fontSize: 16, fontWeight: '500', color: '#333', },
  itemQuantity: { fontSize: 13, color: '#666', marginTop: 2, },
  itemPriceTotal: { fontSize: 16, fontWeight: '700', color: '#a00000', },
  paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 10, marginBottom: 10, backgroundColor: '#fff', },
  selectedPayment: { borderColor: '#a00000', backgroundColor: 'rgba(160, 0, 0, 0.05)', },
  radioContainer: { flexDirection: 'row', alignItems: 'center', },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#a00000', marginRight: 12, justifyContent: 'center', alignItems: 'center', },
  radioSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#a00000', },
  paymentOptionText: { fontSize: 16, color: '#333', fontWeight: '600', },
  summarySectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15, },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, },
  summaryLabel: { fontSize: 16, color: '#666', },
  summaryValue: { fontSize: 16, fontWeight: '600', color: '#333', },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', },
  totalLabel: { fontSize: 20, fontWeight: '800', color: '#333', },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#a00000', },
  confirmButton: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#FFD700', paddingVertical: 18, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 15, shadowColor: '#a00000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10, },
  disabledButton: { backgroundColor: '#ccc', shadowOpacity: 0, elevation: 0, },
  confirmButtonText: { color: '#a00000', fontWeight: '700', fontSize: 17, },
  finalPriceContainer: { flexDirection: 'row', alignItems: 'center', },
  finalPriceText: { color: '#a00000', fontWeight: '700', fontSize: 17, marginRight: 8, },
  webviewHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, },
  webviewTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center', marginRight: 35, },
  closeButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666', },
});

export default CheckoutScreen;