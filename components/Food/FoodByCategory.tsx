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
  ImageBackground, // Import ImageBackground
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FoodByCategory = ({ route }) => {
  const { categoryId } = route.params;
  const [foodItems, setFoodItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [itemQuantities, setItemQuantities] = useState({});
  const [showNotification, setShowNotification] = useState(false); // State to control notification visibility
  const slideAnim = useRef(new Animated.Value(-100)).current; // For slide-in animation from the top
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

    console.log('Items to add to cart:', itemsToAdd);

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
        } else {
          console.log(`Item (${item.itemName}) added successfully.`);
        }
      }

      // Show notification
      setShowNotification(true);
      Animated.timing(slideAnim, {
        toValue: 0, // Slide in from the top
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();

      // Hide notification after 2 seconds
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100, // Slide out to the top
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
        <Text style={styles.foodName}>{item.itemName}</Text>
        <Text style={styles.price}>{`₹${item.price}`}</Text>
        {itemQuantities[item._id] ? (
          <View style={styles.quantityWrapper}>
            <TouchableOpacity onPress={() => handleDecrement(item)} style={styles.decrementButton}>
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{itemQuantities[item._id]}</Text>
            </View>
            <TouchableOpacity onPress={() => handleIncrement(item)} style={styles.incrementButton}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(item)}>
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/efcBg.png')} // Set your background image here
      style={styles.backgroundImage}
      resizeMode="cover" // Ensure the image covers the entire screen
    >
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by dishes..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => navigation.navigate('ViewCart')} style={styles.cartIconContainer}>
            <Icon name="cart" size={24} color="#FFFFFF" />
            {totalItemsInCart > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItemsInCart}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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
                <Text style={styles.emptyText}>No items found for this category.</Text>
              }
            />
            {Object.keys(itemQuantities).length > 0 && (
              <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
                <Text style={styles.cartButtonText}>
                  Add to Cart
                  {totalItemsInCart > 0 && (
                    <Text style={styles.cartItemCount}>{` (${totalItemsInCart})`}</Text>
                  )}
                  <Icon name="cart" size={20} color="#FFFFFF" style={styles.cartIcon} />
                </Text>
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
              <Text style={styles.notificationText}>Your item is successfully added to the cart!</Text>
            </Animated.View>
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
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartIconContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFF58',
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
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#B71C1C',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
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
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
  },
  decrementButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#388E3C',
  },
  incrementButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#388E3C',
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  cartItemCount: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#FFFFFF',
  },
  cartIcon: {
    marginLeft: 10,
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
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 50, // Adjust this value to position the notification
  },
  notification: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FoodByCategory;