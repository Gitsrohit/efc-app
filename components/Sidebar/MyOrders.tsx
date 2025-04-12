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
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

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
        `https://efc-app-1.onrender.com/api/v1/orders/user/${userId}`,
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

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemContainer}>
      <Image 
        source={{ uri: 'https://via.placeholder.com/50' }} 
        style={styles.orderItemImage} 
      />
      <View style={styles.orderItemDetails}>
        <Text style={styles.orderItemName}>{item.itemName}</Text>
        <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.orderItemPrice}>₹{item.price.toFixed(2)}</Text>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderContainer}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
          <Text style={styles.orderDate}>
            {moment(item.orderTime).format('DD MMM YYYY, hh:mm A')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.deliveryStatus) }]}>
          <Text style={styles.statusText}>{item.deliveryStatus.toUpperCase()}</Text>
        </View>
      </View>

      <FlatList
        data={item.items}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      <View style={styles.orderFooter}>
        <View style={styles.deliveryInfo}>
          <Icon name="location-outline" size={16} color="#666" />
          <Text style={styles.deliveryText}>
            {`${item.deliveryAddress.addressLine1}, ${item.deliveryAddress.city}`}
          </Text>
        </View>

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
            style={styles.actionButton}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {item.deliveryStatus.toLowerCase() === 'processing' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelOrder(item.id)}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
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
        `https://efc-app-1.onrender.com/api/v1/orders/${orderId}/cancel`,
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

      // Refresh orders after cancellation
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
          <Icon name="warning-outline" size={50} color="#FFFFFF" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrders}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
          <Icon name="receipt-outline" size={80} color="#FFFFFF" />
          <Text style={styles.emptyText}>No orders found</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
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
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  shopNowButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
  },
  shopNowButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  orderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 3,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
    backgroundColor: '#F5F5F5',
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: '#666666',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  orderFooter: {
    padding: 15,
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
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  orderTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a00000',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#a00000',
    borderRadius: 5,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
});

export default MyOrdersScreen;