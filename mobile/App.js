import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';

const queryClient = new QueryClient();

class StartupErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('App startup error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080d17', padding: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>RoadWatch</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
            The app hit a startup error. Please reopen after reinstalling the latest APK.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const { loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  return (
    <StartupErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer theme={{ colors: { background: "#080d17" } }}>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StartupErrorBoundary>
  );
}