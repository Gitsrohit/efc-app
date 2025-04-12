import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../../App';

type RootStackParamList = {
  Home: undefined;
  MyOrders: undefined;
  Favorites: undefined;
  SavedAddresses: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  Help: undefined;
  About: undefined;
  Login: undefined;
  FoodByCategory: { categoryName: string };
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.8;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [activeMenu, setActiveMenu] = useState('Home');
  const translateX = new Animated.Value(-SIDEBAR_WIDTH);
  const { logout } = useContext(AuthContext);

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const menuItems = [
    { title: 'My Orders', icon: 'receipt-outline', screen: 'MyOrders' },
    { title: 'Favorites', icon: 'heart-outline', screen: 'Favorites' },
    { title: 'Addresses', icon: 'location-outline', screen: 'SavedAddresses' },
    { title: 'Payments', icon: 'wallet-outline', screen: 'PaymentMethods' },
    { title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { title: 'Help & Support', icon: 'help-circle-outline', screen: 'Help' },
    { title: 'About Us', icon: 'information-circle-outline', screen: 'About' },
  ];

  const handleMenuItemPress = (item: typeof menuItems[0]) => {
    setActiveMenu(item.title);
    navigation.navigate(item.screen);
    onClose();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose();
              await logout();
              // Alternative navigation approach
              navigation.navigate('Login');
              navigation.popToTop(); // Clear the navigation stack
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <>
      {isOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={onClose}
          testID="sidebar-overlay"
        />
      )}
      
      <Animated.View 
        style={[
          styles.sidebarContainer,
          { transform: [{ translateX }] }
        ]}
        testID="sidebar-container"
      >
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.profileSection}>
            <View style={styles.profileIconContainer}>
              <Icon name="person-circle-outline" size={80} color="#FF6B6B" />
            </View>
            <Text style={styles.userName}>Welcome User</Text>
          </View>

          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={`${item.screen}-${index}`}
                style={[
                  styles.menuItem,
                  activeMenu === item.title && styles.activeMenuItem
                ]}
                onPress={() => handleMenuItemPress(item)}
              >
                <Icon 
                  name={item.icon} 
                  size={24} 
                  color={activeMenu === item.title ? '#FF6B6B' : '#333'} 
                />
                <Text style={[
                  styles.menuItemText,
                  activeMenu === item.title && styles.activeMenuItemText
                ]}>
                  {item.title}
                </Text>
                {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    zIndex: 100,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  profileIconContainer: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  activeMenuItem: {
    backgroundColor: '#FFF5F5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  activeMenuItemText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  menuDivider: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginLeft: 15,
    fontWeight: '600',
  },
});

export default Sidebar;