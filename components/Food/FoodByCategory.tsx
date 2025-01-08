import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
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
  const navigation = useNavigation();

  const fetchFoodItems = async () => {
    if (!categoryId) {
      alert('Invalid category ID.');
      navigation.goBack();
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await fetch(`https://efc-app-sprp.onrender.com/api/v1/admin/get-item/${categoryId}`);
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
      const item = foodItems.find((food) => food.id === itemId);
      return {
        itemId: item.id,
        itemName: item.itemName,
        quantity,
        price: item.price,
      };
    });

    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
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

      alert('All items added to cart successfully!');
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
      <Image
        source={
          item.image
            ? { uri: `https://efc-app-sprp.onrender.com/${item.image}` }
            : require('/Users/iceberg/efcApk/assets/images/image.png')
        }
        style={styles.foodImage}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.foodName}>{item.itemName}</Text>
        <Text style={styles.description}>{item.description || 'No description available'}</Text>
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
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by dishes..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => navigation.navigate('ViewCart')} style={styles.cartIconContainer}>
          <Icon name="cart" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FFFFFF" />
      ) : (
        <>
          <FlatList
            data={filteredFoodItems}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B71C1C',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  cartIconContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffe500',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  cartButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cartItemCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartIcon: {
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 6,
    marginHorizontal: 8,
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderRadius: 8,
    overflow: 'hidden',
  },
  decrementButton: {
    height:35,
    borderBottomLeftRadius:10,
    borderTopLeftRadius:10,
    backgroundColor: '#00C853', 
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    height:35,
    backgroundColor: '#00C853',
    borderTopRightRadius:10,
    borderBottomRightRadius:10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    height:35,
    backgroundColor: '#B71C1C', 
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
 
});

export default FoodByCategory;
