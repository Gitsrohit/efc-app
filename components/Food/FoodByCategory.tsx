import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const FoodByCategory = ({ route }) => {
  const { categoryId, categoryName } = route.params;
  const [foodItems, setFoodItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [itemQuantities, setItemQuantities] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const navigation = useNavigation();

  const fetchFoodItems = async () => {
    if (!categoryId) {
      alert('Invalid category ID.');
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://efc-app-sprp.onrender.com/api/v1/admin/get-item/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjc4MTA2NTRjZjllNGRhOTA2YjNmZWMwIiwiY29tcGFueUlkIjoiRUZDIiwiaWF0IjoxNzM2NTA5MDEzLCJleHAiOjE4MjI5MDkwMTN9.e2p1wGd8c8H2ilyy6VAc8iFd4ioDiKgAlYRvPsjRtOo`,
          },
        }
      );
      const result = await response.json();

      if (response.ok && result.success) {
        if (Array.isArray(result.data) && result.data.length > 0) {
          setFoodItems(result.data);
        } else {
          alert('No items found for this category.');
          setFoodItems([]);
        }
      } else {
        console.error('Error message:', result.message);
        alert(result.message || 'Failed to fetch food items.');
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
      alert('An error occurred while fetching food items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [categoryId]);

  const handleAdd = (item) => {
    setItemQuantities((prev) => ({ ...prev, [item._id]: 1 }));
  };

  const handleIncrement = (item) => {
    setItemQuantities((prev) => ({ ...prev, [item._id]: (prev[item._id] || 0) + 1 }));
  };

  const handleDecrement = (item) => {
    setItemQuantities((prev) => {
      const updatedQuantities = { ...prev };
      if (updatedQuantities[item._id] > 1) {
        updatedQuantities[item._id] -= 1;
      } else {
        delete updatedQuantities[item._id];
      }
      return updatedQuantities;
    });
  };

  const handleAddToCart = async () => {
    const itemsToAdd = Object.entries(itemQuantities).map(([itemId, quantity]) => {
      const item = foodItems.find((food) => food._id === itemId);
      return {
        itemId: item._id,
        itemName: item.itemName,
        quantity,
        price: item.price,
      };
    });

    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        alert('User is not authenticated. Please log in.');
        return;
      }

      for (const item of itemsToAdd) {
        const response = await fetch('https://efc-app-1.onrender.com/api/v1/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error adding item (${item.itemName}):`, errorText);
          alert(`Failed to add ${item.itemName} to the cart.`);
        }
      }

      // Show notification
      setShowNotification(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();

      // Hide notification after 2 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }).start(() => setShowNotification(false));
      }, 2000);

      setItemQuantities({});
    } catch (error) {
      console.error('Error adding items to cart:', error);
      alert('Failed to add items to cart.');
    }
  };

  const filteredFoodItems = foodItems.filter((item) =>
    item.itemName.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalItemsInCart = Object.values(itemQuantities).reduce((sum, quantity) => sum + quantity, 0);

  const renderFoodItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <Image source={{ uri: item.image }} style={styles.foodImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">
          {item.itemName}
        </Text>
        <Text style={styles.price}>{`₹${item.price}`}</Text>
      </View>
      {itemQuantities[item._id] ? (
        <View style={styles.quantityWrapper}>
          <TouchableOpacity 
            onPress={() => handleDecrement(item)} 
            style={styles.quantityButton}
            activeOpacity={0.7}
          >
            <Icon name="remove" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityText}>{itemQuantities[item._id]}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => handleIncrement(item)} 
            style={styles.quantityButton}
            activeOpacity={0.7}
          >
            <Icon name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => handleAdd(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button and category name */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ViewCart')} 
          style={styles.cartIconContainer}
          activeOpacity={0.7}
        >
          <Icon name="cart" size={24} color="#FFFFFF" />
          {totalItemsInCart > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItemsInCart}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#FFFFFF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading delicious items...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredFoodItems}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="fast-food" size={60} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>No items found</Text>
                <Text style={styles.emptySubText}>Try a different search term</Text>
              </View>
            }
          />
          
          {/* Add to Cart Button (floating) */}
          {Object.keys(itemQuantities).length > 0 && (
            <TouchableOpacity 
              style={styles.cartButton} 
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <View style={styles.cartButtonContent}>
                <Text style={styles.cartButtonText}>Add to Cart</Text>
                <View style={styles.cartButtonBadge}>
                  <Text style={styles.cartButtonBadgeText}>{totalItemsInCart}</Text>
                </View>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Notification Popup */}
      <Modal
        transparent={true}
        visible={showNotification}
        animationType="none"
        onRequestClose={() => setShowNotification(false)}
      >
        <View style={styles.notificationContainer}>
          <Animated.View
            style={[
              styles.notification,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.notificationText}>Items added to cart!</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D32F2F', // Rich red background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#B71C1C', // Darker red for header
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  cartIconContainer: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFC107',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE', // Light red/pink background for cards
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
    maxWidth: width - 180, // Ensure text doesn't overflow
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#D32F2F',
  },
  addButton: {
    backgroundColor: '#388E3C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#388E3C',
    alignSelf: 'center',
    marginLeft: 8,
  },
  quantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2E7D32',
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#388E3C',
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#388E3C',
    borderRadius: 25,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cartButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cartButtonBadge: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    marginRight: 12,
  },
  cartButtonBadgeText: {
    color: '#000000',
    fontSize: 14,
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
    marginTop: 16,
  },
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 50,
  },
  notification: {
    backgroundColor: '#388E3C',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default FoodByCategory;