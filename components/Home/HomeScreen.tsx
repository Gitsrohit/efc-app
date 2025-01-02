import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0); 

  const banners = [
    {
      id: 1,
      image: require('/Users/iceberg/efcApk/assets/images/image.png'),
      title: "20% OFF on Pizza",
      description: "Get 20% off on orders above ₹700. Order your favorite pizza now!",
    },
    {
      id: 2,
      image: require('/Users/iceberg/efcApk/assets/images/image.png'),
      title: "Buy 1 Get 1 Free",
      description: "Enjoy a free burger with every burger you order today!",
    },
    {
      id: 3,
      image: require('/Users/iceberg/efcApk/assets/images/image.png'),
      title: "Flat ₹100 Off",
      description: "Flat ₹100 off on all dine-in orders this weekend. Don't miss out!",
    },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://efc-app-sprp.onrender.com/api/v1/admin/get-category');
        const result = await response.json();

        console.log('API Response:', result);

        if (result && result.success && Array.isArray(result.data)) {
          const formattedCategories = result.data.map((category) => ({
            name: category.name,
            image: require('/Users/iceberg/efcApk/assets/images/image.png'),
          }));
          setCategories(formattedCategories);
        } else {
          console.error('Unexpected API Response Structure:', result);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const renderBanner = ({ item, index }) => (
    <View
      style={[
        styles.bannerContainer,
        { backgroundColor: index % 2 === 0 ? '#ffe4e1' : '#f0e68c' },
      ]}
    >
      <Image source={item.image} style={styles.bannerImage} />
      <View style={styles.bannerTextContainer}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.category}
      onPress={() => navigation.navigate('FoodByCategory', { categoryName: item.name })}
    >
      <Image source={item.image} style={styles.categoryImage} />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );
  

  const foodItems = [
    { id: 1, name: "EFC's Special Combo", price: '₹210', image: require('/Users/iceberg/efcApk/assets/images/image.png') },
    { id: 2, name: 'Grilled Sandwich', price: '₹150', image: require('/Users/iceberg/efcApk/assets/images/image.png') },
    { id: 3, name: 'Cheese Burger', price: '₹180', image: require('/Users/iceberg/efcApk/assets/images/image.png') },
  ];

  const renderFoodItem = ({ item }) => (
    <View style={styles.foodCard}>
      <Image source={item.image} style={styles.foodImage} />
      <View style={styles.foodDetails}>
        <Text style={styles.foodTitle}>{item.name}</Text>
        <Text style={styles.foodPrice}>{item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>ADD</Text>
      </TouchableOpacity>
    </View>
  );

  const handleBannerScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.floor(contentOffsetX / (width * 0.9)); 
    setCurrentBannerIndex(index);
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {banners.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            currentBannerIndex === index && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('/Users/iceberg/efcApk/assets/images/profile.png')} style={styles.profileIcon} />
        <TextInput placeholder="Search by dishes..." style={styles.searchBar} />
        <TouchableOpacity>
          <Image source={require('/Users/iceberg/efcApk/assets/images/filter.png')} style={styles.filterIcon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>ROHIT, WHAT’S ON YOUR MIND?</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.name}
          horizontal
          contentContainerStyle={styles.categoryList}
          showsHorizontalScrollIndicator={false}
        />
      )}

      <FlatList
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerList}
        pagingEnabled
        snapToInterval={width * 0.9}
        decelerationRate="fast"
        onMomentumScrollEnd={handleBannerScroll} 
      />

      {renderDots()}

      <FlatList
        data={foodItems}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.foodList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#a00000', padding: 10, paddingTop: 20 },
  greeting: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 18,
    letterSpacing: 2, 
  },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  profileIcon: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  searchBar: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, height: 40 },
  filterIcon: { width: 25, height: 25, marginLeft: 10 },
  bannerList: { marginBottom: 20 },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 5,
    width: 350,
    padding: 10,
    height: 150,
  },
  bannerImage: { width: 80, height: 80, borderRadius: 20, marginRight: 10 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#a00000', marginBottom: 5 },
  bannerDescription: { fontSize: 14, color: '#666' },
  categoryList: { flexDirection: 'row', marginBottom: 20 },
  category: { alignItems: 'center', marginRight: 20 },
  categoryImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff', marginBottom: 5 },
  categoryText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  foodList: { paddingBottom: 100 },
  foodCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
  },
  foodImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  foodDetails: { flex: 1 },
  foodTitle: { fontSize: 16, color: '#333' },
  foodPrice: { fontSize: 14, color: '#888' },
  addButton: { backgroundColor: '#a00000', padding: 10, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    margin: 5,
  },
  activeDot: {
    backgroundColor: '#FFFF00',
  },
});

export default HomeScreen;
