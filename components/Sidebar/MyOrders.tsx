import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width } = Dimensions.get('window');

interface OrderItem {
  id: string;
  itemName: string;
  itemId: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface DeliveryBoy {
  name: string;
  email: string;
  phone: string;
  averageRating: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  totalPrice: number;
  orderTime: string;
  paymentTime: string;
  deliveryTime: string;
  deliveryBoy?: DeliveryBoy;
}

const MyOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await fetch(
        `https://efc-user-backend.onrender.com/api/v1/orders/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result)) {
        setOrders(result);
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'shipped':
      case 'out for delivery':
        return '#2196F3';
      case 'cancelled':
      case 'failed':
        return '#F44336';
      case 'processing':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  // Helper function to render a list of items as a string
  const getItemsSummary = (items) => {
    return items.map(item => `${item.itemName} x${item.quantity}`).join(', ');
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderContainer}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
          <Text style={styles.orderDate}>
            {moment(item.orderTime).format('DD MMM YYYY, hh:mm A')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.deliveryStatus) }]}>
          <Text style={styles.statusText}>{item.deliveryStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderItemsSummary}>
        <Text style={styles.itemsSummaryText} numberOfLines={2}>
          {getItemsSummary(item.items)}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        {item.deliveryType === 'Home Delivery' && (
          <View style={styles.deliveryInfo}>
            <Icon name="location-outline" size={16} color="#666" />
            <Text style={styles.deliveryText}>
              {`${item.deliveryAddress.addressLine1}, ${item.deliveryAddress.city}`}
            </Text>
          </View>
        )}

        {item.deliveryBoy && (
          <View style={styles.deliveryBoyInfo}>
            <Icon name="person-outline" size={16} color="#666" />
            <Text style={styles.deliveryText}>
              {item.deliveryBoy.name} ({item.deliveryBoy.phone})
            </Text>
          </View>
        )}

        <View style={styles.orderTotalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{item.totalPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
            <Icon name="chevron-forward-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          
          {item.deliveryStatus.toLowerCase() === 'processing' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelOrder(item.id)}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
              <Icon name="close-circle-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const handleCancelOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `https://efc-user-backend.onrender.com/api/v1/orders/${orderId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      fetchOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order');
    }
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={['#a00000', '#800000']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#a00000', '#800000']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.errorContainer}>
          <Icon name="cloud-offline-outline" size={60} color="#FFFFFF" />
          <Text style={styles.errorText}>Oops! Something went wrong.</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrders}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#a00000', '#800000']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {orders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FFFFFF']}
              tintColor="#FFFFFF"
            />
          }
        >
          <Icon name="receipt-outline" size={80} color="rgba(255,255,255,0.8)" />
          <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopNowButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FFFFFF']}
              tintColor="#FFFFFF"
            />
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  errorSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#FFD700',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  retryButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  shopNowButton: {
    marginTop: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  shopNowButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  orderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 3,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  orderItemsSummary: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemsSummaryText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  orderFooter: {
    padding: 20,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryBoyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 10,
  },
  orderTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a00000',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsButton: {
    backgroundColor: '#a00000',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 5,
  },
});

export default MyOrdersScreen;