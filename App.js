import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Signup from './components/authentication/Signup'; // Import the Signup component

export default function App() {
  return (
    <View style={styles.container}>
      <Signup /> {/* Render the Signup component */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
