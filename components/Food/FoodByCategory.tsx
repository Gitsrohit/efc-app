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
  SafeAreaView, 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
          console.warn('No items found for this category.');
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
        const response = await fetch('https://efc-user-backend.onrender.com/api/v1/cart/add', {
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

      setShowNotification(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 500,
          easing: Easing.in(Easing.ease),
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
    <View style={enhancedStyles.cardContainer}>
      <Image source={{ uri: item.image }} style={enhancedStyles.foodImage} />
      <View style={enhancedStyles.infoContainer}>
        <Text style={enhancedStyles.foodName} numberOfLines={2} ellipsizeMode="tail">
          {item.itemName}
        </Text>
        <Text style={enhancedStyles.price}>{`₹${item.price}`}</Text>
      </View>
      {itemQuantities[item._id] ? (
        <View style={enhancedStyles.quantityWrapper}>
          <TouchableOpacity 
            onPress={() => handleDecrement(item)} 
            style={enhancedStyles.quantityButton}
            activeOpacity={0.7}
          >
            <Icon name="remove-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={enhancedStyles.quantityDisplay}>
            <Text style={enhancedStyles.quantityText}>{itemQuantities[item._id]}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => handleIncrement(item)} 
            style={enhancedStyles.quantityButton}
            activeOpacity={0.7}
          >
            <Icon name="add-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={enhancedStyles.addButton} 
          onPress={() => handleAdd(item)}
          activeOpacity={0.7}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={enhancedStyles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={['#a00000', '#600000']}
      style={enhancedStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={enhancedStyles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={enhancedStyles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={enhancedStyles.headerTitle}>{categoryName}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ViewCart')} 
            style={enhancedStyles.cartIconContainer}
            activeOpacity={0.7}
          >
            <Icon name="basket-outline" size={24} color="#FFFFFF" />
            {totalItemsInCart > 0 && (
              <View style={enhancedStyles.cartBadge}>
                <Text style={enhancedStyles.cartBadgeText}>{totalItemsInCart}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={enhancedStyles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={enhancedStyles.searchIcon} />
          <TextInput
            style={enhancedStyles.searchInput}
            placeholder="Search dishes..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        {isLoading ? (
          <View style={enhancedStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={enhancedStyles.loadingText}>Loading delicious items...</Text>
          </View>
        ) : (
          <View style={enhancedStyles.listWrapper}>
            <FlatList
              data={filteredFoodItems}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={enhancedStyles.listContainer}
              ListEmptyComponent={
                <View style={enhancedStyles.emptyContainer}>
                  <Icon name="fast-food-outline" size={80} color="rgba(255,255,255,0.7)" />
                  <Text style={enhancedStyles.emptyText}>No items found</Text>
                  <Text style={enhancedStyles.emptySubText}>Try a different search term</Text>
                </View>
              }
            />
          </View>
        )}

        {Object.keys(itemQuantities).length > 0 && (
          <TouchableOpacity 
            style={enhancedStyles.cartButton} 
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <View style={enhancedStyles.cartButtonContent}>
              <Text style={enhancedStyles.cartButtonText}>Add to Cart</Text>
              <View style={enhancedStyles.cartButtonBadge}>
                <Text style={enhancedStyles.cartButtonBadgeText}>{totalItemsInCart}</Text>
              </View>
              <Icon name="chevron-forward-outline" size={24} color="#a00000" />
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
      <Modal
        transparent={true}
        visible={showNotification}
        animationType="none"
        onRequestClose={() => setShowNotification(false)}
      >
        <View style={enhancedStyles.notificationContainer}>
          <Animated.View
            style={[
              enhancedStyles.notification,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Icon name="checkmark-circle-outline" size={24} color="#FFFFFF" />
            <Text style={enhancedStyles.notificationText}>Items added to cart!</Text>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// --- ENHANCED STYLESHEET ---
const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- Header ---
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  cartIconContainer: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700', 
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cartBadgeText: {
    color: '#a00000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginHorizontal: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    paddingVertical: 0,
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#f8f8f8', 
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 120, 
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a00000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a00000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    backgroundColor: '#a00000',
    alignSelf: 'center',
    marginLeft: 10,
  },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  quantityDisplay: {
    paddingHorizontal: 8,
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
    paddingVertical: 80,
    backgroundColor: 'transparent',
  },
  emptyText: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubText: {
    color: '#666',
    fontSize: 15,
    marginTop: 5,
  },
  cartButton: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: '#FFD700', 
    borderRadius: 15,
    paddingVertical: 18,
    shadowColor: '#a00000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  cartButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cartButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
    fontSize: 17,
  },
  cartButtonBadge: {
    backgroundColor: '#a00000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cartButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    paddingTop: 120, 
    zIndex: 999,
  },
  notification: {
    backgroundColor: '#388E3C',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default FoodByCategory;