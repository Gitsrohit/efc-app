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
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Sidebar from '../Sidebar/Sidebar';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  image: { uri: string } | number;
}

interface Banner {
  id: number;
  image: any;
  title: string;
  description: string;
  color: string;
}

interface FoodItem {
  id: number;
  name: string;
  price: string;
  rating: number;
  image: any;
}

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const scrollX = new Animated.Value(0);

  const banners: Banner[] = [
    {
      id: 1,
      image: require('../../assets/images/image.png'),
      title: '20% OFF on Pizza',
      description: 'Get 20% off on orders above ₹700. Order your favorite pizza now!',
      color: '#FF6B6B'
    },
    {
      id: 2,
      image: require('../../assets/images/image.png'),
      title: 'Buy 1 Get 1 Free',
      description: 'Enjoy a free burger with every burger you order today!',
      color: '#4ECDC4'
    },
    {
      id: 3,
      image: require('../../assets/images/image.png'),
      title: 'Flat ₹100 Off',
      description: "Flat ₹100 off on all dine-in orders this weekend. Don't miss out!",
      color: '#FFD166'
    },
  ];

  const foodItems: FoodItem[] = [
    { 
      id: 1, 
      name: "EFC's Special Combo", 
      price: '₹210', 
      rating: 4.5,
      image: require('../../assets/images/image.png') 
    },
    { 
      id: 2, 
      name: 'Grilled Sandwich', 
      price: '₹150', 
      rating: 4.2,
      image: require('../../assets/images/image.png') 
    },
    { 
      id: 3, 
      name: 'Cheese Burger', 
      price: '₹180', 
      rating: 4.7,
      image: require('../../assets/images/image.png') 
    },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(
          'https://efc-app-sprp.onrender.com/api/v1/admin/get-category',
          {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjc4MTA2NTRjZjllNGRhOTA2YjNmZWMwIiwiY29tcGFueUlkIjoiRUZDIiwiaWF0IjoxNzM2NTA5MDEzLCJleHAiOjE4MjI5MDkwMTN9.e2p1wGd8c8H2ilyy6VAc8iFd4ioDiKgAlYRvPsjRtOo`,
            },
          }
        );
        const result = await response.json();

        if (result?.success && Array.isArray(result.data)) {
          const formattedCategories = result.data.map((category: any) => ({
            id: category._id,
            name: category.name,
            image: { uri: category.image },
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderBannerItem = ({ item, index }: { item: Banner; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.bannerContainer,
          { 
            backgroundColor: item.color,
            transform: [{ scale }] 
          }
        ]}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerDescription}>{item.description}</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>
          <Image source={item.image} style={styles.bannerImage} />
        </View>
      </Animated.View>
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() =>
        navigation.navigate('FoodByCategory', { 
          categoryId: item.id, 
          categoryName: item.name 
        })
      }
    >
      <View style={styles.categoryIconContainer}>
        {typeof item.image === 'object' && 'uri' in item.image ? (
          <Image source={item.image} style={styles.categoryImage} />
        ) : (
          <Icon name="fast-food" size={30} color="#fff" />
        )}
      </View>
      <Text style={styles.categoryText} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity style={styles.foodCard}>
      <Image source={item.image} style={styles.foodImage} />
      <View style={styles.foodDetails}>
        <Text style={styles.foodTitle}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <Text style={styles.foodPrice}>{item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderBannerIndicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {banners.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={`indicator-${index}`}
              style={[styles.indicator, { opacity }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#a00000', '#800000']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar}>
              <Image 
                source={require('../../assets/images/profile.png')} 
                style={styles.profileIcon} 
              />
            </TouchableOpacity>
            <Text style={styles.greetingText}>
              <Text style={styles.greetingName}>ROHIT</Text>, WHAT'S ON YOUR MIND?
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.cartIconContainer}
            onPress={() => navigation.navigate('ViewCart')}
          >
            <Icon name="cart" size={24} color="#FFFFFF" />
            {cartItemsCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search dishes, restaurants..." 
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        )}

        {/* Banners */}
        <Text style={styles.sectionTitle}>Special Offers</Text>
        <View style={styles.bannerWrapper}>
          <Animated.FlatList
            data={banners}
            renderItem={renderBannerItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
          {renderBannerIndicator()}
        </View>

        {/* Top Deals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Deals</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={foodItems}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.foodList}
        />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  greetingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  greetingName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#a00000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  loader: {
    marginVertical: 20,
  },
  categoryList: {
    paddingBottom: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  categoryIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  bannerWrapper: {
    height: 180,
    marginBottom: 25,
  },
  bannerContainer: {
    width: width - 45,
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 7.5,
  },
  bannerContent: {
    flexDirection: 'row',
    height: '100%',
    padding: 15,
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bannerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#a00000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bannerImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  foodList: {
    paddingBottom: 30,
  },
  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  foodDetails: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a00000',
  },
  addButton: {
    backgroundColor: '#a00000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;