import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';

const FoodByCategory = ({ route }: { route: any }) => {
  const { categoryId } = route.params;
  const [foodItems, setFoodItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchFoodItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://efc-app-sprp.onrender.com/api/v1/admin/get-item?category=${categoryId}`);
      // Check if response is JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.items) {
          setFoodItems(data.items);
        } else {
          console.error('Error: Items not found in response');
        }
      } else {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFoodItems();
  }, [categoryId]);

  const filteredFoodItems = foodItems.filter((item: any) =>
    item.itemName.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderFoodItem = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
      <Image
        source={{ uri: `https://efc-app-sprp.onrender.com/${item.image.replace('\\', '/')}` }}
        style={styles.foodImage}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.foodName}>{item.itemName}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>{`₹${item.price}`}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by dishes..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Food Items List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FFFFFF" />
      ) : (
        <FlatList
          data={filteredFoodItems}
          renderItem={renderFoodItem}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items found for this category.</Text>
          }
        />
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    backgroundColor: '#FFA000', // Yellow background for the card
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
  emptyText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
  },
});

export default FoodByCategory;
